import { PORTFOLIO_URL } from '../data/site';
import { ArrowUpRight } from './Icons';

export default function About() {
  return (
    <section className="tile about" aria-labelledby="about-title">
      <h2 id="about-title" className="about__name">
        Ahmed Adnane Meddah
      </h2>
      <p className="about__text">
        AI engineering student at ENSIA, mathematician and olympiad coach. I have coached more
        than 500 students, won medals at international olympiads, and run a community of over a
        thousand members across several African countries.
      </p>
      <a className="text-link" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
        Portfolio <ArrowUpRight />
      </a>
    </section>
  );
}
