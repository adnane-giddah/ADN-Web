import { GITHUB_URL, PROJECTS } from '../data/site';
import { ArrowUpRight, GitHubIcon } from './Icons';

export default function Projects() {
  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <header className="section__head">
        <h2 id="projects-title">Projects</h2>
        <a className="text-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
          <GitHubIcon /> More on GitHub <ArrowUpRight />
        </a>
      </header>
      <div className="projects">
        {PROJECTS.map((project) => (
          <a
            className="tile project"
            href={project.url}
            key={project.name}
            target="_blank"
            rel="noreferrer"
          >
            <span className="project__shot">
              <img src={project.image} alt="" width="800" height="500" loading="lazy" />
            </span>
            <span className="project__body">
              <span className="eyebrow">{project.category}</span>
              <span className="project__name">
                {project.name} <ArrowUpRight />
              </span>
              <span className="project__text">{project.description}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
