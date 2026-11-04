import { PORTFOLIO_URL, STATS } from '../data/site';
import { ArrowUpRight } from './Icons';

export default function About() {
  return (
    <section className="tile about" aria-labelledby="about-title">
      <p className="eyebrow">The founder</p>
      <h2 id="about-title" className="about__name">
        Ahmed Adnane Meddah
      </h2>
      <p className="about__text">
        AI engineering student at ENSIA, mathematician and olympiad coach. Where rigour meets
        intelligence.
      </p>
      <dl className="about__stats">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <a className="text-link" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
        Read the full portfolio <ArrowUpRight />
      </a>
    </section>
  );
}
