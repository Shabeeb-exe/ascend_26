'use strict';

/* ------------------------------------------------------------------
   SITE CONFIG — change these values in ONE place.
   ------------------------------------------------------------------ */
const SITE_CONFIG = {
  // UPI account that receives registration fees. Use the official fest/department account.
  upiId: 'muhammedshabeebkt2016@oksbi',
  payeeName: 'ASCEND 26 DCMS',
  // Google Apps Script web-app URL (see apps-script/Code.gs)
  sheetEndpoint: 'https://script.google.com/macros/s/AKfycbzDXStAGPsAlhsW3fO6YVZhhYrnUywlbFb1K6_Ylver3bQHfA5Mb192SXvIiH1uDgaT1g/exec',
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
    format: 'Team of 2 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 2,
    maxTeam: 2,
    desc: 'High-stakes corporate trivia spanning global markets, brands, business history, and current affairs.',
    skills: 'Corporate Trivia • Brand Origins • Financial Headlines',
    rules: [
      'Open to teams of 2 quizzers representing the same institution.',
      'Written preliminary round followed by high-intensity stage finals with buzzer and wager rounds.',
      'Covers global conglomerates, Indian business history, logos, taglines, startups, and economics.'
    ]
  },
  {
    id: 'ipl-auction',
    title: 'IPL Auction',
    category: 'Non-Management',
    icon: '🏏',
    format: 'Team of 4 Members',
    isTeam: true,
    fee: 250,  // fee per participant
    minTeam: 4,
    maxTeam: 4,
    desc: 'Franchise bidding war: build a championship squad with tactical purse management and cricket analytics.',
    skills: 'Purse Management • Squad Balance • Tactical Bidding',
    rules: [
      'Preliminary cricket & franchise analytics quiz selects top franchises for the live gavel auction.',
      'Each qualified franchise team comprises 4 members representing the same institution, operating within a fixed virtual salary cap.',
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
  { name: 'Mohammed Irfan C', role: 'Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 91880 07846', phoneRaw: '919188007846', photo: 'assets/team/mohammed-irfan.png' },
  { name: 'Nandana K U', role: 'Joint Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 97787 95642', phoneRaw: '919778795642', photo: 'assets/team/nandana-ku.png' },
  { name: 'Mukhthar T P', role: 'Convenor', category: 'Core Committee', phoneDisplay: '+91 75929 65567', phoneRaw: '917592965567', photo: 'assets/team/mukhthar-tp.png' },
  { name: 'Fathima Rushda', role: 'Joint Convenor', category: 'Core Committee', phoneDisplay: '+91 81378 24644', phoneRaw: '918137824644', photo: 'assets/team/fathima-rushda.png' },
  { name: 'Rohan A', role: 'Finance Lead', category: 'Core Committee', phoneDisplay: '+91 97461 80378', phoneRaw: '919746180378', photo: 'assets/team/rohan-a.png' },
  { name: 'Anagha M V', role: 'Event Manager', category: 'Core Committee', phoneDisplay: '+91 85907 85977', phoneRaw: '918590785977', photo: 'assets/team/anagha-mv.png' },
  { name: 'Ajay Das (Ajaydas H)', role: 'Promotion Lead', category: 'Core Committee', phoneDisplay: '+91 79071 55174', phoneRaw: '917907155174', photo: 'assets/team/ajay-das.png' },
  { name: 'Anugrah M (Anugrah A M)', role: 'Invitation Lead', category: 'Core Committee', phoneDisplay: '+91 94970 61719', phoneRaw: '919497061719', photo: 'assets/team/anugrah-m.png' },
  { name: 'Aswathi A K', role: 'Program Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 80863 82375', phoneRaw: '918086382375', photo: 'assets/team/aswathi-ak.png' },
  { name: 'Muhammed Shabeeb K T', role: 'Sponsorship Lead', category: 'Core Committee', phoneDisplay: '+91 97440 11164', phoneRaw: '919744011164', photo: 'assets/team/muhammed-shabeeb.png' },

  { name: 'Hiba Hashim M', role: 'Best Manager Head', category: 'Event Heads', photo: 'assets/team/hiba-hashim.png' },
  { name: 'Afra T C', role: 'Best Management Team Head', category: 'Event Heads', photo: 'assets/team/afra-tc.png' },
  { name: 'Shifa Hasain K', role: 'Finance Game Head', category: 'Event Heads', photo: 'assets/team/shifa-hasain.png' },
  { name: 'Asna Fathima S', role: 'Marketing Game Head', category: 'Event Heads', photo: 'assets/team/asna-fathima.png' },
  { name: 'Aparna M P', role: 'HR Game Head', category: 'Event Heads', photo: 'assets/team/aparna-mp.png' },
  { name: 'Adhyasree P', role: 'Business Quiz Head', category: 'Event Heads', photo: 'assets/team/adhyasree-p.png' },
  { name: 'Jubin Thomas', role: 'IPL Auction Head', category: 'Event Heads', photo: 'assets/team/jubin-thomas.png' },
  { name: 'Amalnath S', role: 'Treasure Hunt Head', category: 'Event Heads', photo: 'assets/team/amalnath-s.png' },
  { name: 'Mahitha S', role: 'Reel Making Head', category: 'Event Heads', photo: 'assets/team/mahitha-s.png' },
  { name: 'Ansaf K', role: 'Spot Games Head', category: 'Event Heads', photo: 'assets/team/ansaf-k.png' },

  { name: 'Steljo P S', role: 'Volunteer Head', category: 'Committee Heads', photo: 'assets/team/steljo-ps.png' },
  { name: 'Muhammed Shakir Sadah P P', role: 'Food Head', category: 'Committee Heads', photo: 'assets/team/muhammed-shakir.png' },
  { name: 'Nidhi Gopinath C', role: 'Judges Head', category: 'Committee Heads', photo: 'assets/team/nidhi-gopinath.png' },
  { name: 'Muhammed Shabeeb K T', role: 'Technical Head', category: 'Committee Heads', photo: 'assets/team/muhammed-shabeeb.png' },
  { name: 'Alan Antony E A', role: 'Venue Head', category: 'Committee Heads', photo: 'assets/team/alan-antony.png' },
  { name: 'Nandhana N', role: 'Cultural Head', category: 'Committee Heads', photo: 'assets/team/nandhana-n.png' },
  { name: 'Thejus Parol', role: 'Transportation Head', category: 'Committee Heads', photo: 'assets/team/thejus-parol.png' },
  { name: 'Krishna K R', role: 'Decoration Head', category: 'Committee Heads', photo: 'assets/team/krishna-kr.png' },
  { name: 'Fathimathul Safa K (MBA)', role: 'Grievance Head', category: 'Committee Heads', phoneDisplay: '+91 95394 97391', phoneRaw: '919539497391', photo: 'assets/team/fathimathul-safa.png' },
  { name: 'Mohammed Shameem V (M.Com)', role: 'Grievance Head', category: 'Committee Heads', phoneDisplay: '+91 90747 60194', phoneRaw: '919074760194', photo: 'assets/team/mohammed-shameem.png' },
  { name: 'Sasma K', role: 'Hospitality Head', category: 'Committee Heads', phoneDisplay: '+91 97475 10695', phoneRaw: '919747510695', photo: 'assets/team/sasma-k.png' }
];

const PAST_SPONSORS = [
  { name: 'State Bank of India (SBI)', logo: 'assets/sponsors/sbi.png' },
  { name: 'Mathrubhumi', logo: 'assets/sponsors/mathrubhumi.png' },
  { name: 'myG Digital Hub', logo: 'assets/sponsors/myg.png' },
  { name: 'Media One', logo: 'assets/sponsors/media-one.png' },
  { name: 'South Indian Bank', logo: 'assets/sponsors/south-indian-bank.png' },
  { name: 'Walkaroo', logo: 'assets/sponsors/walkaroo.png' },
  { name: 'Red FM 93.5', logo: 'assets/sponsors/red-fm.png' },
  { name: 'Club FM', logo: 'assets/sponsors/club-fm.png' },
  { name: 'Salpido', logo: 'assets/sponsors/salpido.png' },
  { name: 'Veranda RACE', logo: 'assets/sponsors/veranda-race.png' },
  { name: 'Rapidrops Fire Protection', logo: 'assets/sponsors/rapidrops.png' },
  { name: 'Skyford Aviation', logo: 'assets/sponsors/skyford.png' },
  { name: 'Santa Monica Study Abroad', logo: 'assets/sponsors/santa-monica.png' },
  { name: 'Leadz Study Abroad', logo: 'assets/sponsors/leadz.png' },
  { name: 'Gadpro', logo: 'assets/sponsors/gadpro.png' },
  { name: 'Trazi Digital Academy', logo: 'assets/sponsors/trazi.png' },
  { name: 'EduIncept', logo: 'assets/sponsors/eduincept.png' },
  { name: 'Algate', logo: 'assets/sponsors/algate.png' },
  { name: 'Ledgergate Academy', logo: 'assets/sponsors/ledgergate.png' },
  { name: 'Gravity Family Salon', logo: 'assets/sponsors/gravity-salon.png' },
  { name: 'Holy Mont International', logo: 'assets/sponsors/holymont.png' },
  { name: 'Mother Rehab Hospital', logo: 'assets/sponsors/mother-rehab.png' },
  { name: 'The Mojito Club', logo: 'assets/sponsors/mojito-club.png' },
  { name: 'Ikkayees', logo: 'assets/sponsors/ikkayees.png' },
  { name: 'UET Entrance Tips', logo: 'assets/sponsors/uet.png' },
  { name: 'Grande Luxe', logo: 'assets/sponsors/grande-luxe.png' },
  { name: 'Lekshya', logo: 'assets/sponsors/lekshya.png' },
  { name: 'Royal Farm Fresh Dairy', logo: 'assets/sponsors/royal-dairy.png' },
  { name: 'Canine Heaven', logo: 'assets/sponsors/canine-heaven.png' },
  { name: 'Real Ice', logo: 'assets/sponsors/real-ice.png' }
];
