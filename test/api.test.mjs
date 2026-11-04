// Runs the real API over HTTP against both stores. Uses a temp folder and a fake
// Upstash server, so your .env and server/data are never touched.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApi } from '../server/api.mjs';

const TOKEN = 'test-token';

function listen(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function startApi(env) {
  const handleApi = createApi(env);
  const server = await listen(async (req, res) => {
    if (!(await handleApi(req, res))) res.writeHead(418).end();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, { body, token, headers = {} } = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: {
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(token && { 'x-admin-token': token }),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    return { status: res.status, data: await res.json().catch(() => null) };
  };
  return { server, call };
}

// Speaks the parts of the Upstash REST protocol the store uses.
function fakeUpstash() {
  const hashes = new Map();
  const strings = new Map();
  const run = ([cmd, key, ...args]) => {
    const hash = hashes.get(key) || new Map();
    switch (cmd) {
      case 'HSET':
        hashes.set(key, hash.set(args[0], args[1]));
        return 1;
      case 'HGET':
        return hash.get(args[0]) ?? null;
      case 'HGETALL':
        return [...hash].flat();
      case 'HDEL':
        return hash.delete(args[0]) ? 1 : 0;
      case 'GET':
        return strings.get(key) ?? null;
      case 'SET':
        if (args.includes('NX') && strings.has(key)) return null;
        strings.set(key, String(args[0]));
        return 'OK';
      case 'INCR': {
        const next = Number(strings.get(key) || 0) + 1;
        strings.set(key, String(next));
        return next;
      }
      default:
        throw new Error(`fake Upstash: ${cmd}`);
    }
  };
  return listen((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (req.headers.authorization !== 'Bearer redis-token') {
        res.writeHead(401).end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const body = JSON.parse(raw);
      const reply = req.url === '/pipeline' ? body.map((c) => ({ result: run(c) })) : { result: run(body) };
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(reply));
    });
  });
}

const good = { name: 'Amina', rating: 4, text: 'Really enjoyed 4DN.' };

function sharedBehaviour(setup) {
  let call;
  let teardown;
  // Every test gets its own client address so rate limits don't collide.
  let nextIp = 1;
  const asNewVisitor = () => ({ 'x-forwarded-for': `203.0.113.${nextIp++}` });

  before(async () => {
    ({ call, teardown } = await setup());
  });
  after(() => teardown());

  test('a new review stays hidden until it is approved', async () => {
    const posted = await call('POST', '/api/reviews', { body: good, headers: asNewVisitor() });
    assert.equal(posted.status, 201);
    assert.deepEqual((await call('GET', '/api/reviews')).data.reviews, []);

    const all = await call('GET', '/api/manager/reviews', { token: TOKEN });
    assert.equal(all.status, 200);
    assert.equal(all.data[0].status, 'pending');
    const { id } = all.data[0];

    const approved = await call('PATCH', `/api/manager/reviews/${id}`, {
      token: TOKEN,
      body: { status: 'approved' },
    });
    assert.equal(approved.data.status, 'approved');

    const pub = await call('GET', '/api/reviews');
    assert.equal(pub.data.count, 1);
    assert.equal(pub.data.average, 4);
    assert.deepEqual(Object.keys(pub.data.reviews[0]).sort(), ['createdAt', 'id', 'name', 'rating', 'text']);

    const removed = await call('DELETE', `/api/manager/reviews/${id}`, { token: TOKEN });
    assert.equal(removed.status, 200);
    assert.equal((await call('GET', '/api/reviews')).data.count, 0);
    assert.equal((await call('DELETE', `/api/manager/reviews/${id}`, { token: TOKEN })).status, 404);
  });

  test('bad reviews are rejected with a clear status', async () => {
    const send = (body) => call('POST', '/api/reviews', { body, headers: asNewVisitor() });
    assert.equal((await send({ ...good, text: 'x' })).status, 400);
    assert.equal((await send({ ...good, text: 'x'.repeat(1001) })).status, 400);
    assert.equal((await send({ ...good, rating: 0 })).status, 400);
    assert.equal((await send({ ...good, rating: 6 })).status, 400);
    assert.equal((await send({ ...good, rating: 4.6 })).status, 400);
    assert.equal((await send({ ...good, rating: '5' })).status, 400);
    assert.equal((await send('{not json')).status, 400);
    assert.equal((await send('null')).status, 400);
    assert.equal((await send({ ...good, text: 'y'.repeat(20_000) })).status, 413);
  });

  test('the honeypot pretends to work but stores nothing', async () => {
    const before = (await call('GET', '/api/manager/reviews', { token: TOKEN })).data.length;
    const res = await call('POST', '/api/reviews', {
      body: { ...good, website: 'spam.example' },
      headers: asNewVisitor(),
    });
    assert.equal(res.status, 201);
    assert.equal((await call('GET', '/api/manager/reviews', { token: TOKEN })).data.length, before);
  });

  test('only valid reviews count towards the limit of 3 per hour', async () => {
    const headers = asNewVisitor();
    assert.equal((await call('POST', '/api/reviews', { body: { ...good, text: 'x' }, headers })).status, 400);
    for (let i = 0; i < 3; i++) {
      assert.equal((await call('POST', '/api/reviews', { body: good, headers })).status, 201);
    }
    assert.equal((await call('POST', '/api/reviews', { body: good, headers })).status, 429);
    assert.equal((await call('POST', '/api/reviews', { body: good, headers: asNewVisitor() })).status, 201);
  });

  test('the manager API needs the password and locks after 5 wrong tries', async () => {
    const headers = asNewVisitor();
    assert.equal((await call('GET', '/api/manager/reviews', { headers })).status, 401);
    for (let i = 0; i < 4; i++) {
      assert.equal((await call('GET', '/api/manager/reviews', { token: 'nope', headers })).status, 401);
    }
    assert.equal((await call('GET', '/api/manager/reviews', { token: TOKEN, headers })).status, 429);
    assert.equal((await call('GET', '/api/manager/reviews', { token: TOKEN, headers: asNewVisitor() })).status, 200);
  });

  test('wrong routes and methods fail cleanly', async () => {
    assert.equal((await call('GET', '/api/nope')).status, 404);
    assert.equal((await call('PUT', '/api/reviews')).status, 405);
    assert.equal((await call('POST', '/api/health')).status, 405);
    const plain = await call('POST', '/api/reviews', {
      headers: { 'content-type': 'text/plain', ...asNewVisitor() },
      body: JSON.stringify(good),
    });
    assert.equal(plain.status, 415);
  });
}

describe('file store', () => {
  sharedBehaviour(async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'adn-test-'));
    const { server, call } = await startApi({ ADMIN_TOKEN: TOKEN, TRUST_PROXY: 'true', DATA_DIR: dir });
    return {
      call,
      teardown: () => {
        server.close();
        rmSync(dir, { recursive: true, force: true });
      },
    };
  });
});

describe('redis store', () => {
  sharedBehaviour(async () => {
    const redis = await fakeUpstash();
    const { server, call } = await startApi({
      ADMIN_TOKEN: TOKEN,
      TRUST_PROXY: 'true',
      KV_REST_API_URL: `http://127.0.0.1:${redis.address().port}/`,
      KV_REST_API_TOKEN: 'redis-token',
    });
    return {
      call,
      teardown: () => {
        server.close();
        redis.close();
      },
    };
  });
});

describe('deployment situations', () => {
  test('Vercel without Redis says it cannot accept reviews', async () => {
    const { server, call } = await startApi({ VERCEL: '1', ADMIN_TOKEN: TOKEN });
    assert.equal((await call('GET', '/api/health')).data.storage, 'none');
    assert.equal((await call('GET', '/api/reviews')).data.accepting, false);
    assert.equal((await call('POST', '/api/reviews', { body: good })).status, 503);
    assert.equal((await call('GET', '/api/manager/reviews', { token: TOKEN })).status, 503);
    server.close();
  });

  test('without ADMIN_TOKEN nobody gets in, not even with an empty password', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'adn-test-'));
    const { server, call } = await startApi({ DATA_DIR: dir });
    assert.equal((await call('GET', '/api/manager/reviews')).status, 401);
    assert.equal((await call('GET', '/api/manager/reviews', { token: 'x' })).status, 401);
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  test('a storage outage returns 503 without leaking details', async () => {
    const { server, call } = await startApi({
      KV_REST_API_URL: 'http://127.0.0.1:9',
      KV_REST_API_TOKEN: 'secret-redis-token',
    });
    const original = console.error;
    console.error = () => {};
    const res = await call('GET', '/api/reviews');
    console.error = original;
    assert.equal(res.status, 503);
    assert.doesNotMatch(JSON.stringify(res.data), /127\.0\.0\.1|secret-redis-token/);
    server.close();
  });

  test('a spoofed forwarded address cannot dodge the limit behind a proxy', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'adn-test-'));
    const { server, call } = await startApi({ TRUST_PROXY: 'true', DATA_DIR: dir });
    const post = (fake) =>
      call('POST', '/api/reviews', { body: good, headers: { 'x-forwarded-for': `${fake}, 198.51.100.7` } });
    for (let i = 0; i < 3; i++) assert.equal((await post(`10.0.0.${i}`)).status, 201);
    assert.equal((await post('10.0.0.99')).status, 429);
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  test('older reviews with no status stay private, and simultaneous reviews all survive', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'adn-test-'));
    const old = { id: 'old-1', name: 'A', rating: 5, text: 'From before', createdAt: '2026-01-01T00:00:00.000Z' };
    writeFileSync(path.join(dir, 'reviews.json'), JSON.stringify([old]));
    const { server, call } = await startApi({ TRUST_PROXY: 'true', ADMIN_TOKEN: TOKEN, DATA_DIR: dir });
    assert.equal((await call('GET', '/api/reviews')).data.count, 0);

    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        call('POST', '/api/reviews', { body: good, headers: { 'x-forwarded-for': `192.0.2.${i}` } }),
      ),
    );
    assert.equal(JSON.parse(readFileSync(path.join(dir, 'reviews.json'), 'utf8')).length, 21);
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
