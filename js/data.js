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
      'Best Manager is an individual event. Students from all disciplines (UG & PG) can participate in the event.',
      'Participants must be dressed in formal business attire for all rounds.',
      'Participants must bring a personal laptop with a stable internet connection.',
      'As an individual event, any form of external help or assistance is strictly prohibited unless a round specifically demands collaboration.',
      'Time limits for each round must be strictly followed; reporting late to any round may result in loss of marks or disqualification.',
      'No additional time will be given for late arrivals.',
      'The panel\'s evaluation and decision are non-negotiable and final. Any misconduct or argument will result in instant disqualification.'
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
      'Students from all disciplines (UG & PG) are eligible to participate.',
      'Each team must consist of 4 members from the same institution; once registered, no changes are allowed.',
      'There is no limit to the number of teams that can participate from a single college.',
      'Formal business attire is mandatory for all participants.',
      'College ID card is mandatory and must be presented when required.',
      'Each team must bring a laptop with a stable internet connection for the event.',
      'Teams must maintain professionalism and discipline throughout the event; any unfair practice will lead to disqualification.',
      'The structure and format of each round will be revealed only on the day of the event or during the course of the event.',
      'Time limits must be strictly followed in each round; late reporting may result in penalties.',
      'Judges\' decisions are final and binding, and organizers reserve the right to modify rules if necessary.'
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
      'Participants must be in formal business attire.',
      'Each team shall consist of 4 members from the same institution. Multiple teams from the same institution may participate.',
      'Team composition cannot be altered once registration is completed; member swapping between teams is not permitted.',
      'Each team must bring: (a) a laptop with a stable internet connection, and (b) a non-scientific calculator.',
      'Any form of malpractice, unethical behavior, or late reporting will lead to immediate disqualification.',
      'The decision of the judges and organizers will be final, and organizers reserve the right to modify rules or event structure if required.'
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
      'Participants must be in formal attire.',
      'Each team shall consist of 4 members from the same institution. Multiple teams from the same college may participate.',
      'Students from all disciplines are eligible to participate, with no restriction on the number of teams representing a single college.',
      'A laptop with strong internet connection is compulsory for each team.',
      'Time limits for each round must be strictly adhered to.',
      'Late reporting may lead to loss of marks or disqualification, and no extra time will be granted for late arrivals.',
      'The Game Masters\' and judges\' evaluation and decisions are non-negotiable and final. Any misconduct or argument will result in instant disqualification.',
      'The organizers reserve the right to make changes to the rules or event structure if necessary.'
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
      'All participants must be in formal business attire throughout the event.',
      'Each team shall consist of 4 members from the same institution, and multiple teams from the same institution may participate.',
      'Once registration is completed, team composition cannot be changed, and member swapping between teams is strictly prohibited.',
      'Each team must bring a laptop with a stable internet connection for the event.',
      'The event consists of multiple rounds testing participants\' HR knowledge, analytical thinking, communication skills, creativity, decision-making, and teamwork.',
      'Participants must strictly follow time limits and instructions given in each round. Late reporting will lead to loss of marks or disqualification, and no extra time will be provided.',
      'Any form of malpractice, unethical behavior, or misconduct will lead to immediate disqualification.',
      'The panel\'s evaluation and decision are non-negotiable and final.'
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
      'The Business Quiz will be a one-day event conducted on Day 2 of ASCEND.',
      'Students from any discipline can participate. Multiple teams from the same institution may participate.',
      'The event consists of teams with 2 members each. Both members must be from the same college/institution.',
      'Single player may be permitted at participant\'s own risk.',
      'The use of mobile phones and electronic devices is strictly prohibited during the quiz rounds.',
      'Details and rules of individual rounds will be communicated by the Quizmaster during the event.'
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
      'One-day event conducted on Day 1 of ASCEND.',
      'A team must consist of 4 members from the same institution. All UG and PG students from any stream and affiliated colleges are eligible.',
      'All participants must bring their college ID and be dressed in formal attire.',
      'Capped Entry: Only the first 30 registered teams will be accepted, based strictly on the order in which registrations are received.',
      'Participants should have a sound knowledge about cricket, players, and franchise strategy.',
      'Each team should have at least one mobile phone with a stable internet connection for the event.',
      'Details regarding auction rounds and virtual purses will be disclosed during the event.',
      'Address all questions or doubts before each round begins. Misconduct or malpractice will result in disqualification.',
      'Decisions by the organizing panel will be final.'
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
      'One-day event conducted on Day 1 of ASCEND across the University of Calicut campus.',
      'Students of any discipline can participate in teams of 4 members.',
      'Follow all instructions carefully and complete tasks as given. Submit items, photos, and videos within the time limit; late submissions will not be accepted.',
      'Use of vehicles, personal mobile phones, internet, smart watches, or any other gadgets is not allowed unless specifically instructed to do so.',
      'Do not disturb ongoing classes, university staff, or campus activities while completing tasks.',
      'Ensure safety at all times; do not damage university property or cause inconvenience to anyone.',
      'No copying or interfering with other teams; cheating leads to instant disqualification.',
      'Volunteers will verify submissions; the Event Head\'s decision is final. Maintain team spirit and cooperate with volunteers.'
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
      'Open to students of any discipline as an individual event. Each participant can submit only one entry.',
      'All footage must be captured and edited on campus within the designated event time schedule.',
      'Entries must be submitted within the given deadline. Late submissions will not be accepted.',
      'Video format: Vertical 9:16 aspect ratio (30 to 60 seconds) exported in high definition.',
      'Judged on visual storytelling, creativity, transitions, audio sync, and festival vibrancy.'
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
      'Open to individual participants. Participants must bring their own mobile phone with the game installed (no borrowing during the event).',
      'The game can only be played in Authentic Mode. Total number of substitutions is 5. Default match time is 6 minutes.',
      'Players should only use the recommended player form settings announced before the match. A walkover will be awarded against anyone who alters the form of the players.',
      'If the connection is lost in between, aggregate match score will be considered and remaining time will be given.',
      'The decision taken by tournament admins and judges will be final and binding. Sports keeps discipline, so play fair.'
    ]
  }
];

const GENERAL_GUIDELINES = [
  {
    title: 'Eligibility',
    desc: 'All undergraduate and postgraduate students from any stream/discipline and recognized affiliated colleges are eligible to participate. Students enrolled in professional courses (such as ACCA, CA, CMA, CS, etc.) are also eligible.'
  },
  {
    title: 'College ID & Verification',
    desc: 'A valid College ID card or an official authorization letter from the college authority is mandatory for each participant during spot verification. All members of a team must belong to the same college/institution. There is no restriction on the number of teams/delegates representing a single college.'
  },
  {
    title: 'Event Duration & Schedule',
    desc: 'All flagship competitions are 2-day events, except Treasure Hunt and IPL Auction (conducted on Day 1), and Business Quiz (conducted on Day 2). Teams failing to report at the specified venue within the stipulated time will be disqualified. Team composition cannot be modified after registration.'
  },
  {
    title: 'Food & Accommodation',
    desc: 'Food (complimentary lunch) and accommodation are provided only to participants of registered events (excluding spot events). Complimentary accommodation is provided to participants/teams that qualify for Day 2. Participants requiring accommodation before Day 1 or for Day 2 can avail it for a nominal fee.'
  },
  {
    title: 'Gadgets & Equipment',
    desc: 'Laptops, mobile phones, chargers, and USB cables will not be provided by the institute. Participants are required to bring their own devices wherever specified in event rules. Writing materials and basic stationery will be provided.'
  },
  {
    title: 'Code of Conduct & Discipline',
    desc: 'The use of cigarettes, alcohol, profanity, catcalling, aggressive behavior, or any form of malpractice or misconduct is strictly prohibited and will result in immediate disqualification. Scorecards will not be disclosed, and decisions of judges and the organizing committee are final and non-negotiable.'
  },
  {
    title: 'Certification',
    desc: 'All registered participants will be awarded an official participation e-certificate within 10 days of the conclusion of the event.'
  }
];

const TEAM_DATA = [
  { name: 'Mohammed Irfan C', role: 'Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 91880 07846', phoneRaw: '919188007846', photo: 'assets/team/mohammed-irfan.png' },
  { name: 'Nandana K U', role: 'Joint Co-ordinator', category: 'Core Committee', phoneDisplay: '+91 97787 95642', phoneRaw: '919778795642', photo: 'assets/team/nandana-ku.png' },
  { name: 'Mukhthar T P', role: 'Convenor', category: 'Core Committee', phoneDisplay: '+91 75929 65567', phoneRaw: '917592965567', photo: 'assets/team/mukhthar-tp.png' },
  { name: 'Fathima Rushda A K', role: 'Joint Convenor', category: 'Core Committee', phoneDisplay: '+91 81378 24644', phoneRaw: '918137824644', photo: 'assets/team/fathima-rushda.png' },
  { name: 'Rohan A', role: 'Finance Lead', category: 'Core Committee', phoneDisplay: '+91 97461 80378', phoneRaw: '919746180378', photo: 'assets/team/rohan-a.png' },
  { name: 'Anagha M V', role: 'Event Manager', category: 'Core Committee', phoneDisplay: '+91 85907 85977', phoneRaw: '918590785977', photo: 'assets/team/anagha-mv.png' },
  { name: 'Ajaydas H', role: 'Promotion Lead', category: 'Core Committee', phoneDisplay: '+91 79071 55174', phoneRaw: '917907155174', photo: 'assets/team/ajay-das.png' },
  { name: 'Anugrah A M', role: 'Invitation Lead', category: 'Core Committee', phoneDisplay: '+91 94970 61719', phoneRaw: '919497061719', photo: 'assets/team/anugrah-m.png' },
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
  { name: 'Shibin C', role: 'E-Football Head', category: 'Event Heads', photo: 'assets/team/shibin-c.png' },
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
