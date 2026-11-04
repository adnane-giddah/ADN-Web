import { DISCORD_INVITE } from '../data/site';
import Helix from './Helix';
import { ArrowUpRight } from './Icons';

export default function Hero() {
  return (
    <section className="tile hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="eyebrow">A brand by Ahmed Adnane Meddah</p>
        <h1 id="hero-title" className="hero__title">
          ADN
        </h1>
        <p className="hero__lead">
          Games, experiments and tools built to make ideas interactive.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#projects">
            Explore the projects
          </a>
          <a className="btn btn--ghost" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
            Join the community <ArrowUpRight />
          </a>
        </div>
      </div>
      <div className="hero__art">
        <Helix />
      </div>
    </section>
  );
}
