import { useState, type FormEvent } from 'react';
import Widget from '../src/components/Widget';

type Review = { id: string; name: string; rating: number; text: string; createdAt: string };

export default function Manager() {
  const [token, setToken] = useState('');
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState('');

  async function load(t: string) {
    const res = await fetch('api/reviews', { headers: { 'x-admin-token': t } });
    if (!res.ok) throw new Error(res.status === 401 ? 'Wrong password.' : 'Could not load.');
    setReviews(await res.json());
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function remove(id: string) {
    await fetch(`api/reviews/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
    setReviews((r) => r && r.filter((x) => x.id !== id));
  }

  if (!reviews) {
    return (
      <Widget label="Manager" tag="login">
        <form className="form" onSubmit={login}>
          <input
            className="field"
            type="password"
            placeholder="Manager password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn">Open reviews</button>
        </form>
      </Widget>
    );
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '-';

  return (
    <Widget
      label="Reviews"
      tag={`${reviews.length} total`}
      footer={<span>Average rating: {avg} / 5</span>}
    >
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      <ul className="reviews">
        {reviews.map((r) => (
          <li key={r.id}>
            <div className="reviews__head">
              <strong>{r.name}</strong>
              <span className="reviews__stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <time>{new Date(r.createdAt).toLocaleString()}</time>
              <button className="link" onClick={() => remove(r.id)}>Delete</button>
            </div>
            <p>{r.text}</p>
          </li>
        ))}
      </ul>
    </Widget>
  );
}
