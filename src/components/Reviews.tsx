import { useEffect, useState } from 'react';
import { DISCORD_INVITE, EMAIL } from '../data/site';
import ReviewForm from './ReviewForm';
import Stars from './Stars';

type Review = { id: string; name: string; rating: number; text: string; createdAt: string };
type Published = { accepting: boolean; count: number; average: number | null; reviews: Review[] };

const dateFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' });

export default function Reviews() {
  // null while loading. An unreachable API counts as not accepting.
  const [data, setData] = useState<Published | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const offline: Published = { accepting: false, count: 0, average: null, reviews: [] };
    fetch('/api/reviews', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : offline))
      .then(setData)
      .catch((error) => {
        if (error.name !== 'AbortError') setData(offline);
      });
    return () => controller.abort();
  }, []);

  return (
    <section id="reviews" className="section" aria-labelledby="reviews-title">
      <header className="section__head">
        <h2 id="reviews-title">Reviews</h2>
        {data && data.average !== null && (
          <p className="reviews__score">
            <strong>{data.average.toFixed(1)}</strong>
            <Stars value={Math.round(data.average)} />
            <span>
              from {data.count} {data.count === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        )}
      </header>

      <div className="reviews">
        <div className="tile reviews__wall">
          {data?.reviews.length ? (
            <ul>
              {data.reviews.map((review) => (
                <li key={review.id}>
                  <Stars value={review.rating} />
                  <p className="reviews__text">{review.text}</p>
                  <p className="reviews__by">
                    {review.name} ·{' '}
                    <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="reviews__empty">
              <span aria-hidden="true">★</span>
              <p>{data ? 'No reviews published yet.' : 'Loading reviews…'}</p>
              {data?.accepting && <p className="muted">Tried a project? Yours could be the first.</p>}
            </div>
          )}
        </div>

        <div className="tile reviews__form">
          <h3>Leave a review</h3>
          {data && !data.accepting ? (
            <div className="reviews__closed">
              <p>Reviews are not open just yet, but your feedback is still welcome.</p>
              <p>
                <a href={DISCORD_INVITE} target="_blank" rel="noreferrer">
                  Say it on Discord
                </a>{' '}
                or email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
              </p>
            </div>
          ) : (
            <ReviewForm />
          )}
        </div>
      </div>
    </section>
  );
}
