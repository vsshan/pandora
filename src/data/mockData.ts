export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  change: string;
  positive: boolean;
  logoUrl?: string;
  logoBg: string;
}

export interface Meeting {
  id: string;
  date: string;
  title: string;
  type: 'internal' | 'client-call' | 'client-meeting' | 'no-visibility';
  typeLabel: string;
  typeIcon: string;
  owner: string;
  ownerTitle: string;
  hasAlert?: boolean;
  attendees?: string[];
  location?: string;
  description?: string;
}

export interface NewsItem {
  id: string;
  source: string;
  headline: string;
  preview: string;
  date: string;
  imageUrl?: string;
}

export interface Insight {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  date: string;
  source?: string;
}

export interface Activity {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  loggedBy: string;
  timeAgo: string;
}

export const favoriteCompanies: Company[] = [
  {
    id: 'oracle',
    name: 'Oracle Corp.',
    ticker: 'ORCL',
    sector: 'Technology - Software',
    change: '+1.25%',
    positive: true,
    logoBg: 'bg-red-100 dark:bg-red-900/50',
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeSruPYaVc0e18hV160OcQDc8JZEg0nKXKxXsiebZGDeuLTUqjdPT-faPFxyxEcdoKdwtsAKBNKqPdPaKx7YBc7Oe1u4BOHjV2yVPL1uk5ZPu5YujSEbp23_kgZeNpKpRijWKXiu_Hskm6m1Q6bPKAnLmZ6hCArJy2PJowv0ZhU_qimajnJlNSImYuh0nA9f0xUD9ZE0E-_9IBasZ7GVl4Q_bw7iGtLAIMbnA33J9J8qIAmBgCBdZgniZwA5OBnAjMaQtkltld4qbC',
  },
  {
    id: 'salesforce',
    name: 'Salesforce Inc.',
    ticker: 'CRM',
    sector: 'Technology - Software',
    change: '-0.58%',
    positive: false,
    logoBg: 'bg-blue-100 dark:bg-blue-900/50',
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHbad3OsoUq1ZDrSMwjV2EXSPwFRU2EMnRhp-ptic2sWRbEtARtS0PSQZANaPOnsuLpAL7Hbkb5kyyoLw2axtDNyinxGaTqSxszAQk82gnk3ac2EHAuobjn3UWC4ACxyHY_Q4O4gqmZzcK42QUMZmS3tUSfgE7qSWrY_cVfkanCL1P1-y0brQspYln4rGYGqLKGOpwnl1OCMJoqONvO2mVUUehBbo2Nh5sGzB2-AlwYtKnINc9HIun3MDWydFvDIaumD42cFk_26jk',
  },
  {
    id: 'adobe',
    name: 'Adobe Systems',
    ticker: 'ADBE',
    sector: 'Technology - Software',
    change: '+2.01%',
    positive: true,
    logoBg: 'bg-red-100 dark:bg-red-900/50',
    logoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPBD2_REtBFsCebm43yKwJ-bfWBYmjoy-Ny-OorPkRdgvq4PJatesftjsup-C5bB_w_pBznmK001qjjIBVQfqa0ubo_ReinFwzCkMBg5zboU7GnY0GmsrGep0ONNHueI4YqmCecCX2pfhMpnOuQqrO0fBrdEZ3-PULw51vL8gdpJn6ZN61BhhHu2Rsakkm6q1QY8AF4BXqMByLxqG31QTDfMFWH4-uDfPP-K9I6RebVA0rv-eOT9Yu-jsXRq4NfiG9XJq8EUcKc5QJ',
  },
];

export const innovatech = {
  id: 'innovatech',
  name: 'Innovatech Solutions',
  ticker: 'INVT',
  sector: 'Technology - Software',
  ceo: 'Eleanor Vance',
  website: 'innovatech.com',
  hq: 'San Francisco, CA',
  stockPrice: '$152.34',
  stockChange: '+1.25%',
  stockPositive: true,
  marketCap: '$120B',
  revenue: '$15.2B',
  peRatio: '35.4',
  summary:
    'Innovatech Solutions is a leading provider of cloud-based enterprise software. This section provides a concise summary of the company\'s business, mission, and market position, giving bankers a quick understanding of the client.',
  executiveSummary:
    'Innovatech is a premier provider of cloud-based enterprise software, focusing on AI-driven analytics and workflow automation. They hold a significant market share in the tech sector.',
};

export const recentActivity: Activity[] = [
  {
    id: '1',
    icon: 'newspaper',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-800 dark:text-blue-300',
    title: 'Innovatech announces record Q3 earnings, beating analyst expectations.',
    loggedBy: 'Market News',
    timeAgo: '1d ago',
  },
  {
    id: '2',
    icon: 'phone',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary dark:text-text-dark-primary',
    title: 'Introductory Call with CFO',
    loggedBy: 'Logged by James Harrison',
    timeAgo: '2d ago',
  },
  {
    id: '3',
    icon: 'groups',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    title: 'Q3 Strategy Meeting',
    loggedBy: 'Logged by Sarah Jenkins',
    timeAgo: '1w ago',
  },
  {
    id: '4',
    icon: 'edit_note',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'Note: Competitor Acquisition',
    loggedBy: 'Logged by Admin',
    timeAgo: '1mo ago',
  },
];

export const companyNews: NewsItem[] = [
  {
    id: '1',
    source: 'TechCrunch',
    headline: 'Innovatech Solutions Secures $200M in Series D Funding',
    preview: 'The new funding round, led by...',
    date: 'Oct 26, 2023',
  },
  {
    id: '2',
    source: 'Bloomberg',
    headline: 'CEO Eleanor Vance on the Future of Enterprise AI',
    preview: 'An in-depth interview on strategy...',
    date: 'Oct 24, 2023',
  },
  {
    id: '3',
    source: 'Reuters',
    headline: 'Innovatech Launches New Predictive Analytics Suite',
    preview: 'The platform aims to revolutionize...',
    date: 'Oct 22, 2023',
  },
];

export const homeNews: NewsItem[] = [
  {
    id: '1',
    source: 'Bloomberg',
    headline: "Oracle's Cloud Division Posts Record Growth",
    preview: '',
    date: 'Oct 26, 2023',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB2cpmtQdb4AyauOeUXXIn5Oj1ODi-RlhFClBW6dT9LdaJJDno_xXpIBKRctVEkmNanBPxlQhuOyr_EYyVZe2X6dKPsEEUa2DoM-Au4QX3d7X17f37FACq7QFNcmecWn33QyFL91p0c123xGtDVSnYqgyYuvVS6wV-6_GvYPCT8L-XQmEQ0NuYYiszQNPrjlcaxjVMGXgAtTZ0znYagIM3piJqV9Aeuty6h-b1K7g9oFe5ZFAsDxvwrZ7szqRAqVwnGVTBWzdY5CBTY',
  },
  {
    id: '2',
    source: 'Reuters',
    headline: 'Salesforce Unveils New AI-Powered CRM Features',
    preview: '',
    date: 'Oct 25, 2023',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZMnnuPAli2YJgsvebzys3Vlq6ro94biPDxudflMKD_cNbDTAtToL1dq5YegrR-UXlFK7EYmNGklCtsp3IYEyjSIiLqjAhn2jpV_osheNfDBarG7a4Gq_ahnxkq3FbZufu9J15rVW7Mca2Evmgs-MAk9jTNEjJgLum-Njg_WxFuk2CGQ7MlVUsl8_Uk3nJYk3Xn1c_EL_xTsEQOj9oP4kYyTt9Vf0Z7A_sukStbp_a7OTIGIKQIoxvVEGFqveL83JShCTN_hUNkeTl',
  },
  {
    id: '3',
    source: 'Wall Street Journal',
    headline: "Adobe's Acquisition of Figma Faces Regulatory Scrutiny",
    preview: '',
    date: 'Oct 24, 2023',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCW49494qFEVZ-OIVJFHFPT9Vq7Ijyouh3-rKjU6DT5s9c_EkJIlqnP0tS4SImrej3xBivsN4vZ9MIO_mYitAFrBFqZyVwayCFUqTO7nu9c8mmESyVQyuwxnW0yxz-LFACIjiNHdku9xqH75-DdYVDXJZWjI_CLARgP6h3ax_fDGsG82DC6dpDUnOdxxtlk1a-1ewdW5T96nlOIs7G-aTsFRM4AxhP06g-BaV7bk6PszeeITAPw0xsCHtdKC1QdB6kZKztpciA5gVkr',
  },
];

export const companyInsights: Insight[] = [
  {
    id: '1',
    author: 'Sarah Jenkins',
    authorAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpE1D4t_KnB_qLPjHc6QAulkt3a99GWH9HsFrrixeQXEs4G5P9stUqlreNfGh6GaV7pKfrfUsuWMdQ1kg4SzPTKKAb0GT5he8bDTE1E2kdkFviyW8esRhY3l6krLW-gQTx-EBR8vWjNUBOGwleAwKnnLFUMxh0QOhLmm9isg9kPW8-unyjeHYDx9RVznNfCG339sbUeJmNG4y05ijO8jLjH17VmryrLfY-wajYp6qu97WmFh5YkzBgl3iEMQB2QdbKuv57-OzR5QOV',
    content:
      "Deep dive on Innovatech's latest 10-K filing. Key takeaway: margin expansion is accelerating faster than anticipated.",
    date: 'Oct 25, 2023',
  },
  {
    id: '2',
    author: 'James Harrison',
    authorAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXPog53vUjhxSAxc8AF_HZ7k0xxQhxgPHfOYet7qTUdGkOjLNyVejHGi6qcdzxlfoc1czpGdzrz7SELio5e04dGtOlxPcktFu7SVPHnlle0RyurddlmFG8rdOccIPgyBbqqzSqbO58rJ3oGdBt03JNyS6NGB7bGV7OjZNdMzCt93vPPTpF3Yv5DrTxFc9uiWr00L6hTvwaoR6-j_QKhG4Ia3gdDKG4neL2FKT3t1iz1Yah5c-58i5DZVFb3sz0bEUw1TpBvQMJqzPS',
    content:
      'Analysis of recent executive commentary suggests a major product announcement is imminent. Potential M&A target?',
    date: 'Oct 23, 2023',
  },
];

export const homeInsights: Insight[] = [
  {
    id: '1',
    author: 'Internal Analyst',
    content: "Recent M&A Activity in the Tech Sector",
    date: '',
    source: 'Internal Analyst',
  },
  {
    id: '2',
    author: 'Market Research Team',
    content: 'Competitive Landscape Analysis: CRM',
    date: '',
    source: 'Market Research Team',
  },
  {
    id: '3',
    author: 'Sector Specialist',
    content: 'Digital Media Subscription Trends',
    date: '',
    source: 'Sector Specialist',
  },
];

export const upcomingMeetings: Meeting[] = [
  {
    id: '1',
    date: 'Oct 30, 2023',
    title: 'Q4 Pipeline Review',
    type: 'internal',
    typeLabel: 'Internal Meeting',
    typeIcon: 'groups',
    owner: 'Sarah Jenkins',
    ownerTitle: 'Managing Director',
    hasAlert: true,
    attendees: ['Sarah Jenkins', 'James Harrison', 'Michael Chen', 'Priya Patel'],
    location: 'Conference Room A, 200 Park Ave, New York',
    description:
      'Quarterly review of the M&A and ECM pipeline for Q4. Primary focus is on Project Phoenix closing timeline, two new mandate opportunities in the enterprise software space, and calibrating cross-coverage expectations with the TMT team.',
  },
  {
    id: '2',
    date: 'Nov 05, 2023',
    title: 'Project Phoenix - Pitch Prep',
    type: 'client-call',
    typeLabel: 'Client Call',
    typeIcon: 'phone',
    owner: 'James Harrison',
    ownerTitle: 'Vice President',
    attendees: ['James Harrison', 'Sarah Jenkins', 'Eleanor Vance (Innovatech)', 'David Kim (Innovatech CFO)'],
    location: 'Video Call (Zoom)',
    description:
      'Preparatory call before the formal pitch next week. Agenda covers feedback on the preliminary valuation range, preferred deal structure (strategic vs. sponsor), and timeline sensitivities given the current rate environment.',
  },
  {
    id: '3',
    date: 'Nov 12, 2023',
    title: 'Follow-up on New Analytics Suite',
    type: 'no-visibility',
    typeLabel: 'No visibility',
    typeIcon: 'visibility_off',
    owner: 'Eleanor Vance',
    ownerTitle: 'CEO',
    hasAlert: true,
    attendees: [],
    location: 'Unknown',
    description:
      'Meeting details are restricted due to confidentiality settings. Contact Eleanor Vance directly for agenda and attendee information.',
  },
];

export const previousMeetings: Meeting[] = [
  {
    id: '4',
    date: 'Oct 26, 2023',
    title: 'Introductory Pitch',
    type: 'client-meeting',
    typeLabel: 'Client Meeting',
    typeIcon: 'business_center',
    owner: 'Michael Chen',
    ownerTitle: 'Associate',
    attendees: ['Michael Chen', 'Sarah Jenkins', 'Eleanor Vance (Innovatech)', 'Lisa Park (Innovatech COO)'],
    location: 'Innovatech HQ, 550 Mission St, San Francisco',
    description:
      'First formal pitch to Innovatech\'s leadership team. Presented our M&A advisory credentials and initial strategic options analysis. Client was receptive to the sell-side mandate framing. Key takeaway: Eleanor emphasized timing sensitivity around their Q1 board review.',
  },
  {
    id: '5',
    date: 'Oct 19, 2023',
    title: 'Follow-up on M&A Proposal',
    type: 'client-call',
    typeLabel: 'Client Call',
    typeIcon: 'phone',
    owner: 'Sarah Jenkins',
    ownerTitle: 'Vice President',
    attendees: ['Sarah Jenkins', 'David Kim (Innovatech CFO)'],
    location: 'Phone Call',
    description:
      'CFO David Kim called to discuss the preliminary valuation range in our proposal. He pushed back on the revenue multiple and requested comps adjusted for pure-play SaaS peers. Agreed to revise and resubmit the analysis within the week.',
  },
  {
    id: '6',
    date: 'Oct 05, 2023',
    title: 'Q3 Strategy Meeting',
    type: 'internal',
    typeLabel: 'Internal Meeting',
    typeIcon: 'groups',
    owner: 'Sarah Jenkins',
    ownerTitle: 'Vice President',
    attendees: ['Sarah Jenkins', 'James Harrison', 'Michael Chen'],
    location: 'Internal — War Room 3B',
    description:
      'Internal strategy session to align on the Innovatech coverage approach. Discussed sector tailwinds in enterprise AI, Innovatech\'s competitive moat, and how to position against Goldman and Morgan Stanley who are also circling the mandate.',
  },
];
