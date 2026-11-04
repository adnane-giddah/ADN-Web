import { useState, type FormEvent } from 'react';

const MAX_TEXT = 1000;

export default function ReviewForm() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [website, setWebsite] = useState(''); // honeypot, real users leave it empty
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError('Please pick a star rating.');
      return;
    }
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
        throw new Error(data.error || 'Could not send your review. Please try again.');
      }
      setStatus('done');
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Could not reach the server. Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'Could not send your review. Please try again.',
      );
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div className="form__done" role="status">
        <p className="form__thanks">Thank you!</p>
        <p className="muted">Your review will appear here once it has been approved.</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <fieldset className="rating">
        <legend>Your rating</legend>
        <div className="rating__stars">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} title={`${n} star${n > 1 ? 's' : ''}`}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
              />
              <span className="sr-only">
                {n} star{n > 1 ? 's' : ''}
              </span>
              <span aria-hidden="true">★</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Your review</span>
        <textarea
          required
          minLength={3}
          maxLength={MAX_TEXT}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <small className="field__count">
          {text.length} / {MAX_TEXT}
        </small>
      </label>

      <label className="field">
        <span>Name (optional)</span>
        <input maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <input
        className="hp"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form__foot">
        <button className="btn btn--primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send review'}
        </button>
        <small className="muted">Your name and review are public once approved.</small>
      </div>
    </form>
  );
}
