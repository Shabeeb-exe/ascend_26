'use strict';

const EVENTS_DATA = [
  {
    id: 'best-manager',
    title: 'Best Manager',
    category: 'Management',
    icon: '♛',
    format: 'Individual Participation',
    isTeam: false,
    fee: 500, // Fee per person
    desc: 'The ultimate test of endurance, crisis management, boardroom poise, and executive decision-making.',
    skills: 'Stress Interviews • Executive Case Study • Crisis Command',
    head: 'Hiba Hashim M',
    phoneDisplay: '+91 85904 26357',
    phoneRaw: '918590426357',
    rules: [
      'Open to individual undergraduate and postgraduate delegates with valid institutional ID.',
      'Multi-round elimination testing analytical agility, stress interviews, group dynamics, and boardroom crisis simulations.',
      'Participants must bring a personal laptop, formal business attire, and updated executive resume.',
      'Judges’ decisions across all rounds remain final and binding.'
    ]
  },
  {
    id: 'best-management-team',
    title: 'Best Management Team',
    category: 'Management',
    icon: '❖',
    format: 'Team of 4 Members',
    isTeam: true,
    fee: 250, // Fee per person
    desc: 'Synergy under pressure: multi-domain corporate simulations testing collective strategy and leadership.',
    skills: 'C-Suite Synergy • Corporate Turnaround • Live Board Pitch',
    head: 'Afra',
    phoneDisplay: '+91 92079 45311',
    phoneRaw: '919207945311',
    rules: [
      'Each contingent team comprises 4 members representing the same institution.',
      'Evaluates cross-functional coordination across CEO, CFO, CMO, and CHRO decision verticals.',
      'Includes real-time corporate crisis briefs, business plan defense, and boardroom presentations.',
      'Formal executive dress code is mandatory for stage rounds.'
    ]
  },
  {
    id: 'finance-game',
    title: 'Finance Game',
    category: 'Management',
    icon: '₹',
    format: 'Team of 2–4 Members',
    isTeam: true,
    fee: 250,
    desc: 'Portfolio mastery, capital allocation, valuation crunches, and market volatility simulations.',
    skills: 'Asset Valuation • Mock Stock Trading • M&A Structuring',
    head: 'Shifa Hasain K',
    phoneDisplay: '+91 85905 81078',
    phoneRaw: '918590581078',
    rules: [
      'Team-based financial strategy challenge testing capital budgeting, equity research, and risk hedging.',
      'Simulated market shocks and live portfolio rebalancing rounds across both fest days.',
      'At least one laptop with spreadsheet software per team is required.',
      'Strict adherence to submission timestamps during valuation crunches.'
    ]
  },
  {
    id: 'marketing-game',
    title: 'Marketing Game',
    category: 'Management',
    icon: '✦',
    format: 'Team of 2–4 Members',
    isTeam: true,
    fee: 250,
    desc: 'Brand warfare, creative pitching, consumer insights, and go-to-market campaign execution.',
    skills: 'Brand Repositioning • Guerrilla Pitch • GTM Strategy',
    head: 'Asna',
    phoneDisplay: '+91 85905 46047',
    phoneRaw: '918590546047',
    rules: [
      'Tests strategic brand positioning, ad-making creativity, crisis PR, and live product launches.',
      'Teams will tackle surprise consumer segments and competitive ambush scenarios.',
      'Originality, commercial viability, and persuasive storytelling carry top weightage.',
      'Bring laptops/tablets for deck design and digital collateral rounds.'
    ]
  },
  {
    id: 'hr-game',
    title: 'HR Game',
    category: 'Management',
    icon: '⚖',
    format: 'Team of 2–4 Members',
    isTeam: true,
    fee: 250,
    desc: 'Talent strategy, organizational conflict resolution, labor negotiation, and people analytics.',
    skills: 'Collective Bargaining • Talent Retention • Policy Design',
    head: 'Aparna',
    phoneDisplay: '+91 70128 76727',
    phoneRaw: '917012876727',
    rules: [
      'Focuses on industrial relations, organizational behavior, ethical dilemmas, and workforce analytics.',
      'Includes live roleplay negotiations, policy drafting, and conflict mediation panels.',
      'Judged on legal compliance awareness, empathy, strategic alignment, and negotiation poise.'
    ]
  },
  {
    id: 'business-quiz',
    title: 'Business Quiz',
    category: 'Management',
    icon: '◈',
    format: 'Team of 2 Members',
    isTeam: true,
    fee: 250,
    desc: 'High-stakes corporate trivia spanning global markets, brands, business history, and current affairs.',
    skills: 'Corporate Trivia • Brand Origins • Financial Headlines',
    head: 'Adhyasree P',
    phoneDisplay: '+91 89216 65179',
    phoneRaw: '918921665179',
    rules: [
      'Open to teams of 2 quizzers from the same or cross-disciplinary streams within an institution.',
      'Written preliminary round followed by high-intensity stage finals with buzzer and wager rounds.',
      'Covers global conglomerates, Indian business history, logos, taglines, startups, and economics.'
    ]
  },
  {
    id: 'ipl-auction',
    title: 'IPL Auction',
    category: 'Non-Management',
    icon: '🏏',
    format: 'Team of 3–4 Members',
    isTeam: true,
    fee: 250,
    desc: 'Franchise bidding war: build a championship squad with tactical purse management and cricket analytics.',
    skills: 'Purse Management • Squad Balance • Tactical Bidding',
    head: 'Jubin Thomas',
    phoneDisplay: '+91 70256 87728',
    phoneRaw: '917025687728',
    rules: [
      'Preliminary cricket & franchise analytics quiz selects top franchises for the live gavel auction.',
      'Each qualified franchise operates within a fixed virtual salary cap and overseas player quota.',
      'Final squad rating, balance across batting/bowling/all-rounders, and remaining purse efficiency decide winners.'
    ]
  },
  {
    id: 'treasure-hunt',
    title: 'Treasure Hunt',
    category: 'Non-Management',
    icon: '🧭',
    format: 'Team of 4 Members',
    isTeam: true,
    fee: 250,
    desc: 'Campus-wide cryptic trails, lateral thinking puzzles, and high-energy team exploration across UoC.',
    skills: 'Cryptic Decoding • Lateral Thinking • Speed Navigation',
    head: 'Amalnath',
    phoneDisplay: '+91 80784 48669',
    phoneRaw: '918078448669',
    rules: [
      'Teams of 4 race across designated zones of the University of Calicut campus solving interconnected clues.',
      'Tampering with clues of rival teams or using unauthorized motor transport leads to disqualification.',
      'Comfortable footwear is strongly recommended.'
    ]
  },
  {
    id: 'reel-making',
    title: 'Reel Making',
    category: 'Non-Management',
    icon: '🎬',
    format: 'Individual / Team of 2',
    isTeam: true,
    fee: 150,
    desc: 'Visual storytelling, kinetic editing, and creative direction capturing the pulse of ASCEND \'26.',
    skills: 'Cinematography • Kinetic Cuts • Fest Storytelling',
    head: 'Mahitha',
    phoneDisplay: '+91 90377 69519',
    phoneRaw: '919037769519',
    rules: [
      'All footage must be shot originally on campus during ASCEND \'26 within the announced theme window.',
      'Vertical 9:16 format (30 to 60 seconds) exported in high definition.',
      'Judged on visual narrative, transitions, audio sync, and brand vibrancy.'
    ]
  },
  {
    id: 'spot-games',
    title: 'Spot Games',
    category: 'Non-Management',
    icon: '⚡',
    format: 'On-Spot Individual / Duo',
    isTeam: false,
    fee: 150,
    desc: 'Spontaneous challenges, quick reflexes, crowd-favorite mini-games, and instant rewards.',
    skills: 'Quick Reflexes • Spontaneous Wit • Instant Rewards',
    head: 'Ansaf K',
    phoneDisplay: '+91 77364 17171',
    phoneRaw: '917736417171',
    rules: [
      'Open throughout both fest days at the main compound activity zone.',
      'Includes rapid-fire challenges, reflex games, and interactive crowd tasks.',
      'Instant goodies, vouchers, and spot prizes for winners!'
    ]
  }
];

const TEAM_DATA = [
  { name: 'Mohammed Irfan C', role: 'Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 91880 07846', phoneRaw: '919188007846' },
  { name: 'Nandana K U', role: 'Joint Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 97787 95642', phoneRaw: '919778795642' },
  { name: 'Mukhthar T P', role: 'Convenor', category: 'Core Committee', phoneDisplay: '+91 75929 65567', phoneRaw: '917592965567' },
  { name: 'Fathima Rushda', role: 'Joint Convenor', category: 'Core Committee', phoneDisplay: '+91 81378 24644', phoneRaw: '918137824644' },
  { name: 'Rohan', role: 'Finance Lead', category: 'Core Committee', phoneDisplay: '+91 97461 80378', phoneRaw: '919746180378' },
  { name: 'Anagha M V', role: 'Event Manager', category: 'Core Committee', phoneDisplay: '+91 85907 85977', phoneRaw: '918590785977' },
  { name: 'Ajay Das', role: 'Promotion Lead', category: 'Core Committee', phoneDisplay: '+91 79071 55174', phoneRaw: '917907155174' },
  { name: 'Anugrah', role: 'Invitation Lead', category: 'Core Committee', phoneDisplay: '+91 94970 61719', phoneRaw: '919497061719' },
  { name: 'Aswathi A K', role: 'Program Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 80863 82375', phoneRaw: '918086382375' },
  { name: 'Muhammed Shabeeb K T', role: 'Sponsorship Lead', category: 'Core Committee', phoneDisplay: '+91 97440 11164', phoneRaw: '919744011164' },

  { name: 'Hiba Hashim M', role: 'Best Manager Head', category: 'Event Heads', phoneDisplay: '+91 85904 26357', phoneRaw: '918590426357' },
  { name: 'Afra', role: 'Best Management Team Head', category: 'Event Heads', phoneDisplay: '+91 92079 45311', phoneRaw: '919207945311' },
  { name: 'Shifa Hasain K', role: 'Finance Game Head', category: 'Event Heads', phoneDisplay: '+91 85905 81078', phoneRaw: '918590581078' },
  { name: 'Asna', role: 'Marketing Game Head', category: 'Event Heads', phoneDisplay: '+91 85905 46047', phoneRaw: '918590546047' },
  { name: 'Aparna', role: 'HR Game Head', category: 'Event Heads', phoneDisplay: '+91 70128 76727', phoneRaw: '917012876727' },
  { name: 'Adhyasree P', role: 'Business Quiz Head', category: 'Event Heads', phoneDisplay: '+91 89216 65179', phoneRaw: '918921665179' },
  { name: 'Jubin Thomas', role: 'IPL Auction Head', category: 'Event Heads', phoneDisplay: '+91 70256 87728', phoneRaw: '917025687728' },
  { name: 'Amalnath', role: 'Treasure Hunt Head', category: 'Event Heads', phoneDisplay: '+91 80784 48669', phoneRaw: '918078448669' },
  { name: 'Mahitha', role: 'Reel Making Head', category: 'Event Heads', phoneDisplay: '+91 90377 69519', phoneRaw: '919037769519' },
  { name: 'Ansaf K', role: 'Spot Games Head', category: 'Event Heads', phoneDisplay: '+91 77364 17171', phoneRaw: '917736417171' },

  { name: 'Steljo', role: 'Volunteer Head', category: 'Committee Heads', phoneDisplay: '+91 81298 58290', phoneRaw: '918129858290' },
  { name: 'Mohammed Shakir', role: 'Food Head', category: 'Committee Heads', phoneDisplay: '+91 85471 95513', phoneRaw: '918547195513' },
  { name: 'Nidhi Gopinath', role: 'Judges Head', category: 'Committee Heads', phoneDisplay: '+91 93871 57213', phoneRaw: '919387157213' },
  { name: 'Muhammed Shabeeb K T', role: 'Technical Head', category: 'Committee Heads', phoneDisplay: '+91 97440 11164', phoneRaw: '919744011164' },
  { name: 'Alan Antony', role: 'Venue Head', category: 'Committee Heads', phoneDisplay: '+91 62821 93396', phoneRaw: '916282193396' },
  { name: 'Nandhana N', role: 'Cultural Head', category: 'Committee Heads', phoneDisplay: '+91 85907 25066', phoneRaw: '918590725066' },
  { name: 'Thejus Parol', role: 'Transportation Head', category: 'Committee Heads', phoneDisplay: '+91 80756 03606', phoneRaw: '918075603606' },
  { name: 'Krishna K R', role: 'Decoration Head', category: 'Committee Heads', phoneDisplay: '+91 62820 96026', phoneRaw: '916282096026' },
  { name: 'Fathimathul Safa (MBA)', role: 'Grievance Head', category: 'Committee Heads', phoneDisplay: '+91 95394 97391', phoneRaw: '919539497391' },
  { name: 'Mohammed Shameem (M.Com)', role: 'Grievance Head', category: 'Committee Heads', phoneDisplay: '+91 90747 60194', phoneRaw: '919074760194' },
  { name: 'Sasma', role: 'Hospitality Head', category: 'Committee Heads', phoneDisplay: '+91 97475 10695', phoneRaw: '919747510695' }
];

const PAST_SPONSORS = [
  'State Bank of India (SBI)',
  'Mathrubhumi',
  'Red FM 93.5',
  'South Indian Bank',
  'myG Digital Hub',
  'Walkaroo',
  'Veranda RACE',
  'Santa Monica Study Abroad',
  'Salpido',
  'Rapidrops',
  'Skyford',
  'Gadpro',
  'Trazi Digital Academy',
  'EduIncept',
  'Algate',
  'Leadz Study Abroad',
  'Mother Hospital',
  'The Mojito Club',
  'Ledgergate',
  'Gravity Academy',
  'Grande Luxe',
  'Lekshya'
];
