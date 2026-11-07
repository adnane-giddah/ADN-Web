export const DISCORD_INVITE = 'https://discord.gg/Zew6qUMs9F';
export const DISCORD_CODE = 'Zew6qUMs9F';
export const ADNTISM_URL = 'https://adnane-giddah.github.io/ADNTism/';
export const PORTFOLIO_URL = 'https://adnane-giddah.github.io/Portfolio/';
export const GITHUB_URL = 'https://github.com/adnane-giddah';
export const LINKEDIN_URL = 'https://linkedin.com/in/ahmed-adnane-meddah-8454b434b';
export const EMAIL = 'ahmed-adnane.meddah@ensia.edu.dz';
export const PHONE_DISPLAY = '+213 540 45 99 39';
export const PHONE_HREF = 'tel:+213540459939';

export type Project = {
  name: string;
  category: string;
  description: string;
  url: string;
  image: string;
};

export const PROJECTS: Project[] = [
  {
    name: "Asma'ul Husna",
    category: 'Cultural education',
    description:
      'A fresh, interactive way to learn and memorize the 99 Names of God, rooted in Islamic tradition.',
    url: 'https://asma-ul-husna-1l1.pages.dev/',
    image: 'projects/asma.webp',
  },
  {
    name: '4DN',
    category: 'Co-op puzzle adventure',
    description:
      'Four players, one shared adventure. Team up over the same Wi-Fi, explore labyrinths, trade clues and take on obstacle courses together.',
    url: 'https://adnane-giddah.github.io/4DN/',
    image: 'projects/4dn.webp',
  },
  {
    name: 'ADNTism',
    category: 'A precision challenge',
    description:
      'A playful interactive take on epsilon: get closer, sharpen your estimate and see just how close you can get.',
    url: ADNTISM_URL,
    image: 'projects/adntism.webp',
  },
  {
    name: 'ADN Mission',
    category: 'Geography & exploration',
    description:
      'A geography-focused learning space bringing together games, maps and courses to make exploring the world more engaging.',
    url: 'https://adn-mission.vercel.app/',
    image: 'projects/mission.webp',
  },
  {
    name: 'Olympiad Portal',
    category: 'Collaborative problem solving',
    description:
      'A shared workspace for an olympiad committee to create, discuss and rate competition problems together.',
    url: 'https://github-seven-murex.vercel.app/',
    image: 'projects/olympiad.webp',
  },
];

export const STATS = [
  { value: '500+', label: 'Students coached' },
  { value: '5+', label: 'International medals' },
  { value: '5+', label: 'African countries reached' },
  { value: '1k+', label: 'Community members' },
];
