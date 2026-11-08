import { PORTFOLIO_URL } from '../data/site';
import { ArrowUpRight } from './Icons';

export default function Portfolio() {
  return (
    <section id="portfolio" className="section" aria-labelledby="portfolio-title">
      <header className="section__head">
        <h2 id="portfolio-title">Portfolio</h2>
      </header>
      <a className="tile project portfolio" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
        <span className="project__shot">
          <img src="projects/portfolio.webp" alt="" width="800" height="500" loading="lazy" />
        </span>
        <span className="project__body portfolio__body">
          <span className="project__tag">AI &amp; mathematics</span>
          <span className="project__name">
            Ahmed Adnane Meddah <ArrowUpRight />
          </span>
          <span className="project__text">
            The full story: awards, olympiad coaching, research interests and projects across
            artificial intelligence and mathematics.
          </span>
        </span>
      </a>
    </section>
  );
}
