import { useState, type FormEvent } from 'react';

export default function ReviewForm() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [website, setWebsite] = useState(''); // honeypot, real users leave it empty
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, text, rating, website }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong.');
      }
      setStatus('done');
      setName('');
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <p className="stat">
        Thank you!
        <span className="muted"> Your review was sent.</span>
      </p>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <input
        className="field"
        placeholder="Your name (optional)"
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={n <= rating ? 'star on' : 'star'}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="field"
        placeholder="Write your review about ADN..."
        required
        minLength={3}
        maxLength={1000}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        className="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send review'}
      </button>
    </form>
  );
}
