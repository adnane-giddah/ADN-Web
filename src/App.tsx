import DnaBackground from './components/DnaBackground';
import Widget from './components/Widget';
import ReviewForm from './components/ReviewForm';

const projects = [
  {
    name: '4DN',
    category: 'Co-op puzzle adventure',
    description:
      'Four players, one shared adventure. Team up over the same Wi-Fi, explore labyrinths, trade clues and take on obstacle courses together.',
    url: 'https://adnane-giddah.github.io/4DN/',
  },
  {
    name: 'ADNTism',
    category: 'A precision challenge',
    description:
      'A playful interactive take on epsilon: get closer, sharpen your estimate and see just how close you can get.',
    url: 'https://adnane-giddah.github.io/ADNTism/',
  },
  {
    name: 'ADN Mission',
    category: 'Geography & exploration',
    description:
      'A geography-focused learning space bringing together games, maps and courses to make exploring the world more engaging.',
    url: 'https://adn-mission.vercel.app/',
  },
  {
    name: 'Portfolio',
    category: 'AI & mathematics',
    description:
      'A personal portfolio highlighting Ahmed Adnane Meddah’s work and interests across artificial intelligence and mathematics.',
    url: 'https://adnane-giddah.github.io/Portfolio/',
  },
  {
    name: 'Olympiad Portal',
    category: 'Collaborative problem solving',
    description:
      'A shared workspace for an olympiad committee to create, discuss and rate competition problems together.',
    url: 'https://github-seven-murex.vercel.app/',
  },
  {
    name: "Asma'ul Husna",
    category: 'Cultural education',
    description:
      'A fresh, interactive way to learn and memorize the 99 Names of God, rooted in Islamic tradition.',
    url: 'https://asma-ul-husna-1l1.pages.dev/',
  },
];

export default function App() {
  return (
    <>
      <DnaBackground />
      <main className="page">
        <div className="widgets">
          <Widget
            variant="hero"
            label="Brand"
            tag="01"
            footer={<span>Est. by Ahmed Adnane Meddah</span>}
          >
            <img className="logo" src="favicon.svg" alt="ADN logo" />
            <h1>
              <em>ADN</em>
            </h1>
            <p>
              ADN is a brand created by <strong>Ahmed Adnane Meddah</strong>.
            </p>
          </Widget>

          <div className="widget-wide">
            <Widget label="Projects" tag="02">
              <div className="projects">
                <p className="projects__intro">
                  A collection of games, experiments and tools built to make
                  ideas interactive.
                </p>
                <div className="projects__grid">
                  {projects.map((project, index) => (
                    <a
                      className="project-card"
                      href={project.url}
                      key={project.name}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="project-card__number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="project-card__category">
                        {project.category}
                      </span>
                      <span className="project-card__name">{project.name}</span>
                      <span className="project-card__description">
                        {project.description}
                      </span>
                      <span className="project-card__link">
                        Explore project <span aria-hidden="true">↗</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </Widget>
          </div>

          <div className="widget-wide">
            <Widget label="Leave a review" tag="03">
              <ReviewForm />
            </Widget>
          </div>
        </div>
      </main>
    </>
  );
}
