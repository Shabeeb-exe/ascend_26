'use strict';

/* ------------------------------------------------------------------
   SITE CONFIG — change these values in ONE place.
   ------------------------------------------------------------------ */
const SITE_CONFIG = {
  // UPI account that receives registration fees. Use the official fest/department account.
  upiId: 'muhammedshabeebkt2016@oksbi',
  payeeName: 'ASCEND 26 DCMS',
  // Google Apps Script web-app URL (see apps-script/Code.gs)
  sheetEndpoint: 'https://script.google.com/macros/s/AKfycbxt6ZHqEyzAjgFD48EE5SUG6yqozlLcTtvZFjN3WUYarRpStvq2lO7KxddIBFWujbgL-w/exec',
  // WhatsApp number (country code + number, no +) that receives registration details
  // Set to Muhammed Shabeeb K T (919744011164) for now; later to be replaced by Program Co-ordinator Aswathi A K (918086382375)
  coordinatorWhatsApp: '919744011164',
  // true  = fee is charged PER PARTICIPANT (fee x team members)
  // false = fee is charged once per event (flat per team / entry)
  feePerPerson: true,
  // Max people in one contingent roster (lead + teammates)
  maxRoster: 4,

  // ---- Event dates (TENTATIVE — update here once final dates are confirmed) ----
  eventDatesLabel: 'January 18 & 19, 2027',
  eventStartsAt: '2027-01-18T09:00:00+05:30',
  datesTentative: true,

  // ---- Registration switch ----
  // registrationOpen: false  -> the form is replaced by a "Registrations closed" notice
  // registrationClosesAt: ISO date-time after which the form closes automatically ('' = no deadline)
  //   e.g. '2027-01-10T23:59:00+05:30'
  registrationOpen: true,
  registrationClosesAt: ''
};


const EVENTS_DATA = [
  {
    id: 'best-manager',
    title: 'Best Manager',
    category: 'Management',
    icon: '♛',
    format: 'Individual Participation',
    isTeam: false,
    fee: 500,  // fee per participant
    minTeam: 1,
    maxTeam: 1,
    desc: 'The ultimate test of endurance, crisis management, boardroom poise, and executive decision-making.',
    skills: 'Stress Interviews • Executive Case Study • Crisis Command',
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
    fee: 250,  // fee per participant
    minTeam: 4,
    maxTeam: 4,
    desc: 'Synergy under pressure: multi-domain corporate simulations testing collective strategy and leadership.',
    skills: 'C-Suite Synergy • Corporate Turnaround • Live Board Pitch',
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
    format: 'Team of 4 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 4,
    maxTeam: 4,
    desc: 'Portfolio mastery, capital allocation, valuation crunches, and market volatility simulations.',
    skills: 'Asset Valuation • Mock Stock Trading • M&A Structuring',
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
    format: 'Team of 4 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 4,
    maxTeam: 4,
    desc: 'Brand warfare, creative pitching, consumer insights, and go-to-market campaign execution.',
    skills: 'Brand Repositioning • Guerrilla Pitch • GTM Strategy',
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
    format: 'Team of 4 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 4,
    maxTeam: 4,
    desc: 'Talent strategy, organizational conflict resolution, labor negotiation, and people analytics.',
    skills: 'Collective Bargaining • Talent Retention • Policy Design',
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
    format: 'Individual / Team of 2 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 1,
    maxTeam: 2,
    desc: 'High-stakes corporate trivia spanning global markets, brands, business history, and current affairs.',
    skills: 'Corporate Trivia • Brand Origins • Financial Headlines',
    rules: [
      'Open to individual participants or teams of 2 quizzers from the same or cross-disciplinary streams within an institution.',
      'Written preliminary round followed by high-intensity stage finals with buzzer and wager rounds.',
      'Covers global conglomerates, Indian business history, logos, taglines, startups, and economics.'
    ]
  },
  {
    id: 'ipl-auction',
    title: 'IPL Auction',
    category: 'Non-Management',
    icon: '🏏',
    format: 'Team of 2–4 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 2,
    maxTeam: 4,
    desc: 'Franchise bidding war: build a championship squad with tactical purse management and cricket analytics.',
    skills: 'Purse Management • Squad Balance • Tactical Bidding',
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
    fee: 250,  // fee per participant
    minTeam: 4,
    maxTeam: 4,
    desc: 'Campus-wide cryptic trails, lateral thinking puzzles, and high-energy team exploration across UoC.',
    skills: 'Cryptic Decoding • Lateral Thinking • Speed Navigation',
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
    format: 'Individual Participation',
    isTeam: false,
    fee: 150,  // fee per participant
    minTeam: 1,
    maxTeam: 1,
    desc: 'Visual storytelling, kinetic editing, and creative direction capturing the pulse of ASCEND \'26.',
    skills: 'Cinematography • Kinetic Cuts • Fest Storytelling',
    rules: [
      'All footage must be shot originally on campus during ASCEND \'26 within the announced theme window.',
      'Vertical 9:16 format (30 to 60 seconds) exported in high definition.',
      'Judged on visual narrative, transitions, audio sync, and brand vibrancy.'
    ]
  },
  {
    id: 'spot-games',
    title: 'E Football/PES',
    category: 'Non-Management',
    icon: '🎮',
    format: 'Individual Participation',
    isTeam: false,
    fee: 150,  // fee per participant
    minTeam: 1,
    maxTeam: 1,
    desc: 'A competitive football gaming event featuring E Football/PES.',
    skills: 'Football Gaming • Match Strategy • In-Game Decision-Making',
    rules: [
      'Open to individual participants during both fest days.',
      'Matches are played using E Football/PES.',
      'Participants must follow the tournament instructions provided by the organizers.'
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

  { name: 'Hiba Hashim M', role: 'Best Manager Head', category: 'Event Heads' },
  { name: 'Afra', role: 'Best Management Team Head', category: 'Event Heads' },
  { name: 'Shifa Hasain K', role: 'Finance Game Head', category: 'Event Heads' },
  { name: 'Asna', role: 'Marketing Game Head', category: 'Event Heads' },
  { name: 'Aparna', role: 'HR Game Head', category: 'Event Heads' },
  { name: 'Adhyasree P', role: 'Business Quiz Head', category: 'Event Heads' },
  { name: 'Jubin Thomas', role: 'IPL Auction Head', category: 'Event Heads' },
  { name: 'Amalnath', role: 'Treasure Hunt Head', category: 'Event Heads' },
  { name: 'Mahitha', role: 'Reel Making Head', category: 'Event Heads' },
  { name: 'Ansaf K', role: 'E Football/PES Head', category: 'Event Heads' },

  { name: 'Steljo', role: 'Volunteer Head', category: 'Committee Heads' },
  { name: 'Mohammed Shakir', role: 'Food Head', category: 'Committee Heads' },
  { name: 'Nidhi Gopinath', role: 'Judges Head', category: 'Committee Heads' },
  { name: 'Muhammed Shabeeb K T', role: 'Technical Head', category: 'Committee Heads' },
  { name: 'Alan Antony', role: 'Venue Head', category: 'Committee Heads' },
  { name: 'Nandhana N', role: 'Cultural Head', category: 'Committee Heads' },
  { name: 'Thejus Parol', role: 'Transportation Head', category: 'Committee Heads' },
  { name: 'Krishna K R', role: 'Decoration Head', category: 'Committee Heads' },
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
