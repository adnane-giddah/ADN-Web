import { useState, type CSSProperties } from 'react';
import { NAMES } from '../data/names';
import { ASMA_URL } from '../data/site';
import { ArrowUpRight, ChevronLeft, ChevronRight } from './Icons';

const TOTAL = NAMES.length;
const LONG_NAME = 20; // characters including diacritics; longer Names use smaller type

// Same formula as the Asma'ul Husna site, so both show the same Name each day.
function todaysName(now = new Date()) {
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  return (day % TOTAL) + 1;
}

const wrap = (id: number) => ((id - 1 + TOTAL) % TOTAL) + 1;

export default function AsmaWidget() {
  const [today] = useState(() => todaysName());
  const [id, setId] = useState(today);
  const name = NAMES[id - 1];
  const isToday = id === today;

  return (
    <section id="asma" className="tile asma" aria-labelledby="asma-title">
      <svg className="asma__star" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <rect x="35" y="35" width="130" height="130" />
        <rect x="35" y="35" width="130" height="130" transform="rotate(45 100 100)" />
        <circle cx="100" cy="100" r="46" />
      </svg>

      <div className="asma__name">
        <p className="asma__badge">
          {isToday ? `Name of the day · ${id} of ${TOTAL}` : `Name ${id} of ${TOTAL}`}
        </p>
        <p
          className={name.arabic.length > LONG_NAME ? 'asma__arabic asma__arabic--long' : 'asma__arabic'}
          lang="ar"
          dir="rtl"
        >
          {name.arabic}
        </p>
        <p className="asma__translit">{name.translit}</p>
      </div>

      <div className="asma__panel">
        <h2 id="asma-title" className="asma__title">
          Asma’ul Husna
        </h2>
        <p className="asma__subtitle">The 99 Names of Allah</p>

        <div className="asma__meaning" aria-live="polite">
          <h3>{name.en}</h3>
          <p>{name.enDesc}</p>
          <p className="asma__meaning-ar" lang="ar" dir="rtl">
            {name.ar}
          </p>
        </div>

        <div className="asma__controls">
          <button
            type="button"
            className="asma__step"
            aria-label="Previous Name"
            onClick={() => setId(wrap(id - 1))}
          >
            <ChevronLeft />
          </button>
          <input
            className="asma__range"
            type="range"
            min={1}
            max={TOTAL}
            value={id}
            aria-label="Choose one of the 99 Names"
            aria-valuetext={`${id}: ${name.translit}`}
            style={{ '--fill': `${((id - 1) / (TOTAL - 1)) * 100}%` } as CSSProperties}
            onChange={(e) => setId(Number(e.target.value))}
          />
          <button
            type="button"
            className="asma__step"
            aria-label="Next Name"
            onClick={() => setId(wrap(id + 1))}
          >
            <ChevronRight />
          </button>
        </div>

        <div className="asma__actions">
          <a className="asma__cta" href={ASMA_URL} target="_blank" rel="noreferrer">
            Learn all 99 Names <ArrowUpRight />
          </a>
          {!isToday && (
            <button type="button" className="asma__today" onClick={() => setId(today)}>
              Back to today’s Name
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
