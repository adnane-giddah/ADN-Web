import { useEffect, useState } from 'react';
import { DISCORD_CODE, DISCORD_INVITE } from '../data/site';
import { ArrowUpRight, DiscordIcon } from './Icons';

type Invite = { members: number; online: number };

const plural = (n: number, word: string) => `${n.toLocaleString('en')} ${word}${n === 1 ? '' : 's'}`;

export default function DiscordCard() {
  const [invite, setInvite] = useState<Invite | null>(null);

  // Discord's public invite endpoint. If it fails the card simply has no counts.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://discord.com/api/v10/invites/${DISCORD_CODE}?with_counts=true`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.approximate_member_count === 'number') {
          setInvite({
            members: data.approximate_member_count,
            online: data.approximate_presence_count ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <a
      id="discord"
      className="tile discord"
      href={DISCORD_INVITE}
      target="_blank"
      rel="noreferrer"
      aria-label="Join the ADN community on Discord"
    >
      <DiscordIcon className="discord__icon" />
      <div>
        <p className="discord__eyebrow">Community</p>
        <h2 className="discord__title">Join ADN on Discord</h2>
        <p className="discord__text">Come in, meet the community and see what’s being built.</p>
      </div>
      <div className="discord__foot">
        <span className="discord__count">
          {invite && (
            <>
              <span className="discord__dot" aria-hidden="true" />
              {plural(invite.members, 'member')}
              {invite.online > 0 && ` · ${invite.online.toLocaleString('en')} online`}
            </>
          )}
        </span>
        <span className="discord__go" aria-hidden="true">
          <ArrowUpRight />
        </span>
      </div>
    </a>
  );
}
