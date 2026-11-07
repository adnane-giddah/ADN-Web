import About from './components/About';
import Contact from './components/Contact';
import DiscordCard from './components/DiscordCard';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Nav from './components/Nav';
import OneSecond from './components/OneSecond';
import Portfolio from './components/Portfolio';
import Projects from './components/Projects';
import Reviews from './components/Reviews';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main" className="page">
        <div id="top" className="bento">
          <Hero />
          <DiscordCard />
          <OneSecond />
        </div>
        <Projects />
        <Portfolio />
        <div className="bento bento--people">
          <About />
          <Contact />
        </div>
        <Reviews />
      </main>
      <Footer />
    </>
  );
}
