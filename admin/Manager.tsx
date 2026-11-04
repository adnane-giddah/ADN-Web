import { useState, type FormEvent } from 'react';
import Stars from '../src/components/Stars';

type Status = 'pending' | 'approved';
type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
  status?: Status; // reviews saved before moderation existed have none
};

const API = '/api/manager/reviews';
const isApproved = (review: Review) => review.status === 'approved';

class Unauthorized extends Error {}

export default function Manager() {
  const [token, setToken] = useState('');
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function request(path: string, init: RequestInit = {}) {
    const res = await fetch(API + path, {
      ...init,
      headers: { 'x-admin-token': token, 'content-type': 'application/json', ...init.headers },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Unauthorized('Wrong password.');
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      if (err instanceof Unauthorized) setReviews(null);
      setError(err instanceof TypeError ? 'Could not reach the server.' : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function login(e: FormEvent) {
    e.preventDefault();
    run(async () => setReviews(await request('')));
  }

  function setStatus(id: string, status: Status) {
    run(async () => {
      const updated: Review = await request(`/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReviews((list) => list && list.map((r) => (r.id === id ? updated : r)));
    });
  }

  function remove(id: string) {
    run(async () => {
      await request(`/${id}`, { method: 'DELETE' });
      setConfirming(null);
      setReviews((list) => list && list.filter((r) => r.id !== id));
    });
  }

  if (!reviews) {
    return (
      <section className="tile manager manager--login">
        <h1>Manager</h1>
        <form className="form" onSubmit={login}>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn--primary" disabled={busy}>
            {busy ? 'Opening…' : 'Open reviews'}
          </button>
        </form>
      </section>
    );
  }

  const published = reviews.filter(isApproved);
  const waiting = reviews.filter((r) => !isApproved(r));
  const average = published.length
    ? (published.reduce((sum, r) => sum + r.rating, 0) / published.length).toFixed(1)
    : '–';

  const group = (title: string, list: Review[], empty: string) => (
    <section className="manager__group">
      <h2>
        {title} <span>{list.length}</span>
      </h2>
      {list.length === 0 && <p className="muted">{empty}</p>}
      <ul>
        {list.map((review) => (
          <li key={review.id}>
            <div className="manager__meta">
              <strong>{review.name}</strong>
              <Stars value={review.rating} />
              <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleString()}</time>
            </div>
            <p className="manager__text">{review.text}</p>
            <div className="manager__actions">
              {isApproved(review) ? (
                <button className="btn btn--ghost btn--small" disabled={busy} onClick={() => setStatus(review.id, 'pending')}>
                  Unpublish
                </button>
              ) : (
                <button className="btn btn--primary btn--small" disabled={busy} onClick={() => setStatus(review.id, 'approved')}>
                  Approve
                </button>
              )}
              {confirming === review.id ? (
                <>
                  <button className="btn btn--danger btn--small" disabled={busy} onClick={() => remove(review.id)}>
                    Delete for good
                  </button>
                  <button className="btn btn--ghost btn--small" disabled={busy} onClick={() => setConfirming(null)}>
                    Keep it
                  </button>
                </>
              ) : (
                <button className="btn btn--ghost btn--small" disabled={busy} onClick={() => setConfirming(review.id)}>
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <section className="tile manager">
      <header className="manager__head">
        <h1>Reviews</h1>
        <p className="muted">
          {reviews.length} total · published average {average} / 5
        </p>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {group('Waiting for approval', waiting, 'Nothing is waiting.')}
      {group('Published', published, 'Nothing is published yet.')}
    </section>
  );
}
