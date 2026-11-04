import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import {
  DISCORD_INVITE,
  EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  PHONE_DISPLAY,
  PHONE_HREF,
  PORTFOLIO_URL,
} from '../data/site';
import {
  CheckIcon,
  CopyIcon,
  DiscordIcon,
  GitHubIcon,
  GlobeIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
} from './Icons';

type Channel = {
  label: string;
  value: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  external?: boolean;
};

const CHANNELS: Channel[] = [
  { label: 'Phone', value: PHONE_DISPLAY, href: PHONE_HREF, Icon: PhoneIcon },
  { label: 'Discord', value: 'Join the ADN server', href: DISCORD_INVITE, Icon: DiscordIcon, external: true },
  { label: 'GitHub', value: 'adnane-giddah', href: GITHUB_URL, Icon: GitHubIcon, external: true },
  { label: 'LinkedIn', value: 'ahmed-adnane-meddah', href: LINKEDIN_URL, Icon: LinkedInIcon, external: true },
  { label: 'Portfolio', value: 'adnane-giddah.github.io', href: PORTFOLIO_URL, Icon: GlobeIcon, external: true },
];

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  return (
    <section id="contact" className="tile contact" aria-labelledby="contact-title">
      <p className="eyebrow">Contact</p>
      <h2 id="contact-title" className="contact__title">
        Let’s talk
      </h2>

      <div className="contact__email">
        <a href={`mailto:${EMAIL}`}>
          <MailIcon />
          <span>
            <small>Email</small>
            <span className="contact__address">
              {EMAIL.split('@')[0]}@<wbr />
              {EMAIL.split('@')[1]}
            </span>
          </span>
        </a>
        <button type="button" onClick={copyEmail} aria-label={copied ? 'Email copied' : 'Copy email address'}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>

      <ul className="contact__list">
        {CHANNELS.map(({ label, value, href, Icon, external }) => (
          <li key={label}>
            <a href={href} {...(external && { target: '_blank', rel: 'noreferrer' })}>
              <Icon />
              <span>
                <small>{label}</small>
                {value}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
