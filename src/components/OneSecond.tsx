import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { DISCORD_INVITE } from '../data/site';
import { TILE_H, TILE_W, Tile } from './Helix';
import { ArrowUpRight } from './Icons';

const TARGET_MS = 1000;
const CHAIN_MS = 2000; // the chain is two logo crossings, one per second
const BEST_KEY = 'adn-one-second-best';

function readBest() {
  try {
    const best = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(best) && best > 0 ? best : null;
  } catch {
    return null;
  }
}

function saveBest(ms: number) {
  try {
    localStorage.setItem(BEST_KEY, String(ms));
  } catch {
    // Private windows can refuse storage. The best score just won't be remembered.
  }
}

function verdict(off: number) {
  if (off <= 5) return 'Unreal. That is as close as it gets.';
  if (off <= 25) return 'Incredible timing.';
  if (off <= 75) return 'Very close.';
  if (off <= 200) return 'Not bad. You can get closer.';
  return 'Far off. Count it in your head and try again.';
}

const seconds = (ms: number) => (ms / 1000).toFixed(3);

// The logo laid on its side and repeated, so one crossing is one second.
function Chain({ className }: { className: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${TILE_H * 2} ${TILE_W}`} aria-hidden="true" focusable="false">
      <g transform={`translate(0 ${TILE_W}) rotate(-90)`}>
        <Tile y={0} />
        <Tile y={TILE_H} />
      </g>
    </svg>
  );
}

export default function OneSecond() {
  const [holding, setHolding] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [best, setBest] = useState(readBest);
  const startedAt = useRef<number | null>(null);

  function press() {
    if (startedAt.current !== null) return;
    startedAt.current = performance.now();
    setHolding(true);
  }

  function release() {
    if (startedAt.current === null) return;
    const held = Math.round(performance.now() - startedAt.current);
    startedAt.current = null;
    setHolding(false);
    setResult(held);
    const off = Math.abs(held - TARGET_MS);
    // A 0 would read as "no score yet", so a perfect run is stored as 0.5 ms.
    if (best === null || off < best) {
      const score = Math.max(off, 0.5);
      setBest(score);
      saveBest(score);
    }
  }

  function cancel() {
    startedAt.current = null;
    setHolding(false);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    press();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat) press();
  }

  function onKeyUp(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    release();
  }

  const off = result === null ? null : Math.abs(result - TARGET_MS);
  // Hidden while holding, so the chain can't be used as a clock.
  const lit = holding || result === null ? 0 : Math.min(result / CHAIN_MS, 1) * 100;

  return (
    <section id="play" className="tile game" aria-labelledby="game-title">
      <div className="game__intro">
        <p className="eyebrow">The ADN challenge</p>
        <h2 id="game-title" className="game__title">
          Stop at exactly one second.
        </h2>
        <p className="game__text">
          Press and hold the ADN logo. Let go when you think one second has passed. One crossing of
          the chain is one second.
        </p>
        <a className="text-link" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
          Share your best score on Discord <ArrowUpRight />
        </a>
      </div>

      <div className="game__play">
        <div className="game__top">
          <button
            type="button"
            className={holding ? 'game__hold is-holding' : 'game__hold'}
            aria-label="Press and hold to start the timer, let go to stop it"
            onPointerDown={onPointerDown}
            onPointerUp={release}
            onPointerCancel={cancel}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={cancel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img src="favicon.svg" alt="" width="96" height="96" draggable={false} />
          </button>
          <div className="game__readout">
            <p className={holding ? 'game__time is-holding' : 'game__time'} aria-live="polite">
              {holding ? '?.???' : result === null ? '0.000' : seconds(result)}
              <small>s</small>
            </p>
            <p className="game__verdict" role="status">
              {holding
                ? 'Let go at one second…'
                : off === null
                  ? 'Press and hold the logo.'
                  : `${off} ms off. ${verdict(off)}`}
            </p>
          </div>
        </div>

        <div className="game__track">
          <Chain className="game__chain" />
          <div className="game__lit" style={{ clipPath: `inset(0 ${100 - lit}% 0 0)` }}>
            <Chain className="game__chain" />
          </div>
          <span className="game__target" />
        </div>
        <div className="game__scale" aria-hidden="true">
          <span>0 s</span>
          <span>1 s</span>
          <span>2 s</span>
        </div>

        <p className="game__best">
          <small>Your best</small>
          {best === null ? '–' : `${Math.floor(best)} ms off`}
        </p>
      </div>
    </section>
  );
}
