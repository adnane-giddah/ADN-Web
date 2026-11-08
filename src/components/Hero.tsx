import Helix from './Helix';

export default function Hero() {
  return (
    <section className="tile hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <h1 id="hero-title" className="hero__title">
          ADN
        </h1>
        <p className="hero__lead">Games, experiments and tools by Ahmed Adnane Meddah.</p>
      </div>
      <div className="hero__art">
        <Helix />
      </div>
    </section>
  );
}
