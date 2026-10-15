// Portfolio content shared by the homepage sections and the header's Explore menu.

export const projects = [
  {
    id: 1,
    name: 'FolioCuts',
    image: '/projects/foliocuts.webp',
    category: 'Platform',
    description: 'Digital barbershop management for Kenyan shops. Commission tracking, M-Pesa STK push, automated receipts, loyalty rewards, live analytics, staff dashboards. 3-minute onboarding.',
    tags: ['Spring Boot', 'Next.js', 'M-Pesa', 'PostgreSQL'],
    github: 'https://github.com/markmumba/foliocuts-backend',
    demo: 'https://foliocuts.markian.fit/',
  },
  {
    id: 2,
    name: 'Garbage Collection System',
    image: '/projects/bolloapp.webp',
    category: 'Fullstack',
    description: 'Waste management platform connecting households with local collectors. Real-time pickup tracking, automated payments and payouts.',
    tags: ['Next.js', 'Spring Boot', 'PostgreSQL'],
    github: 'https://github.com/markmumba/bolloapp-backend/tree/new-architecture',
    demo: 'https://bolla.blazor-movies.online/',
  },
  {
    id: 3,
    name: 'Rentitup',
    image: '/projects/rentitup.webp',
    category: 'Marketplace',
    description: 'Rental platform connecting machinery owners with users — from contractors to homeowners.',
    tags: ['Next.js', 'Spring Boot'],
    github: 'https://github.com/markmumba/rentitup-microservice',
    demo: 'https://rentitup.markian.fit',
  },
  {
    id: 4,
    name: 'Agamemnon',
    image: '/projects/agamemnon.webp',
    category: 'Cinematic',
    description: 'Cinematic tribute site for the High King of Mycenae. Immersive visual storytelling with dramatic typography and atmospheric design.',
    tags: ['Next.js', 'CSS'],
    github: 'https://github.com/markmumba/agamemnon',
    demo: 'https://agamemnon.markian.fit',
  },
  {
    id: 5,
    name: 'Bag Street Kenya',
    image: '/projects/bagstreet.webp',
    category: 'E-commerce',
    description: 'E-commerce platform for bags, shoes, and scarves with WhatsApp integration.',
    tags: ['Next.js', 'WhatsApp API'],
    github: 'https://github.com/markmumba/bag_street_kenya',
    demo: 'https://bagstreetke.co.ke/',
  },
]

export const experience = [
  { role: 'Fullstack Developer', company: 'Cloudit', year: '2025' },
  { role: 'Backend Engineer', company: 'Kyosk', year: '2025' },
  { role: 'Freelance Developer', company: 'Independent', year: '2023' },
]

export const technologyGroups = [
  { id: 'languages', label: 'Languages', tone: 'blue' },
  { id: 'backend', label: 'Back end', tone: 'green' },
  { id: 'frontend', label: 'Front end', tone: 'yellow' },
  { id: 'infrastructure', label: 'Infrastructure', tone: 'red' },
] as const

export type TechnologyGroupId = (typeof technologyGroups)[number]['id']

export const technologies: { name: string; group: TechnologyGroupId; note: string }[] = [
  { name: 'Java', group: 'languages', note: 'Primary language for backend services' },
  { name: 'TypeScript', group: 'languages', note: 'Typed frontends and tooling' },
  { name: 'JavaScript', group: 'languages', note: 'The web, everywhere' },
  { name: 'Python', group: 'languages', note: 'Scripts, automation and data work' },
  { name: 'Spring Boot', group: 'backend', note: 'REST APIs and microservices' },
  { name: 'gRPC', group: 'backend', note: 'Fast, typed service-to-service contracts' },
  { name: 'OAuth2', group: 'backend', note: 'Authentication and secured APIs' },
  { name: 'Microservices', group: 'backend', note: 'Independently deployed, distributed services' },
  { name: 'React', group: 'frontend', note: 'Component-driven interfaces' },
  { name: 'Next.js', group: 'frontend', note: 'Fullstack React applications' },
  { name: 'Tailwind CSS', group: 'frontend', note: 'Utility-first styling' },
  { name: 'Docker', group: 'infrastructure', note: 'Containerized builds and deployments' },
  { name: 'PostgreSQL', group: 'infrastructure', note: 'Relational modelling and query tuning' },
  { name: 'Linux', group: 'infrastructure', note: 'Servers, shells and everything underneath' },
]
