import { DISCORD_INVITE, EMAIL, GITHUB_URL, LINKEDIN_URL } from '../data/site';
import { DiscordIcon, GitHubIcon, LinkedInIcon, MailIcon } from './Icons';

const LINKS = [
  { label: 'Discord', href: DISCORD_INVITE, Icon: DiscordIcon },
  { label: 'GitHub', href: GITHUB_URL, Icon: GitHubIcon },
  { label: 'LinkedIn', href: LINKEDIN_URL, Icon: LinkedInIcon },
  { label: 'Email', href: `mailto:${EMAIL}`, Icon: MailIcon },
];

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} ADN · Ahmed Adnane Meddah</p>
      <ul>
        {LINKS.map(({ label, href, Icon }) => (
          <li key={label}>
            <a href={href} aria-label={label} title={label} target="_blank" rel="noreferrer">
              <Icon />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
