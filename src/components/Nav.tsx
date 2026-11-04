import { useEffect, useState } from 'react';
import { DISCORD_INVITE } from '../data/site';
import { CloseIcon, DiscordIcon, MenuIcon } from './Icons';

const LINKS = [
  { id: 'play', label: 'Play' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
  { id: 'reviews', label: 'Reviews' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  // Lights up the link for whichever section crosses the middle of the screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((current) => (current === entry.target.id ? '' : current));
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const { id } of LINKS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="nav__brand" href="#top" aria-label="ADN, back to top">
          <img src="favicon.svg" alt="" width="34" height="34" />
          <span>ADN</span>
        </a>
        <nav id="nav-links" className={open ? 'nav__links is-open' : 'nav__links'} aria-label="Sections">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a className="nav__discord" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
          <DiscordIcon />
          <span>Join Discord</span>
        </a>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </header>
  );
}
