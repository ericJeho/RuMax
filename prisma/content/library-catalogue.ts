/**
 * The digital library catalogue.
 *
 * The seed previously created ten items, every one of them published by "RuMax University
 * Press" with a random year and an abstract that read "<title> — held in the RuMax Digital
 * Library and available to all registered students and staff." Cormen, Leiserson, Rivest
 * and Stein were, according to that catalogue, published by us.
 *
 * This is a real catalogue: 74 holdings across the six faculties, with correct publishers,
 * plausible years, per-item abstracts that say something specific, and a type mix a
 * university library actually has — monographs, journals, past papers, theses and
 * institutional reports.
 *
 * It is not exhaustive and is not meant to be. It is enough that every faculty has a
 * credible shelf, every course with a set text can point at it, and the catalogue reads as
 * curated rather than generated. Extending it means adding entries to the arrays below.
 *
 * Two deliberate omissions:
 *
 *   - **No ISBNs or DOIs on third-party works.** Identifiers must come from a real
 *     catalogue import (MARC, Crossref), not from memory. An invented ISBN in the right
 *     format is worse than no ISBN, because it looks authoritative and resolves to a
 *     different book. Items published by the university carry internal identifiers only.
 *   - **No file contents.** `fileUrl` points at where a file would live. These are
 *     catalogue records, not reproductions of the works they describe.
 *
 * `subjects` drives the faculty filter on /library, so the first tag should match a
 * faculty name where the item belongs to one.
 */

export type LibraryItemType =
  | 'BOOK'
  | 'EBOOK'
  | 'JOURNAL'
  | 'RESEARCH_PAPER'
  | 'PAST_PAPER'
  | 'THESIS'
  | 'MAGAZINE'
  | 'AUDIOBOOK'
  | 'VIDEO';

export type CatalogueEntry = {
  title: string;
  authors: string[];
  type: LibraryItemType;
  publisher: string;
  year: number;
  subjects: string[];
  abstract: string;
  /** Physical stock. Digital-only holdings use a licence count. */
  copies: number;
  downloadable?: boolean;
};

/* ------------------------------------------------ Computing & Data Science */

const computing: CatalogueEntry[] = [
  {
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein'],
    type: 'EBOOK',
    publisher: 'MIT Press',
    year: 2022,
    subjects: ['Computing', 'Algorithms', 'Data structures'],
    abstract:
      'The standard reference for algorithm design and analysis. Rigorous on asymptotic complexity and correctness proofs, and comprehensive enough to serve as a lookup for the rest of your career. Set text for CS201; the chapters on dynamic programming and graph algorithms are the ones you will return to.',
    copies: 40,
  },
  {
    title: 'Pattern Recognition and Machine Learning',
    authors: ['Christopher M. Bishop'],
    type: 'EBOOK',
    publisher: 'Springer',
    year: 2006,
    subjects: ['Computing', 'Machine learning', 'Statistics'],
    abstract:
      'A Bayesian treatment of machine learning, heavier on probability than most introductions and better for it. Predates deep learning as a dominant paradigm, which makes it a clearer guide to the foundations that did not change. Recommended alongside AI301.',
    copies: 30,
  },
  {
    title: 'The Elements of Statistical Learning',
    authors: ['Trevor Hastie', 'Robert Tibshirani', 'Jerome Friedman'],
    type: 'EBOOK',
    publisher: 'Springer',
    year: 2009,
    subjects: ['Computing', 'Machine learning', 'Statistics'],
    abstract:
      'The reference for statistical approaches to learning: regularisation, ensembles, model selection. Demanding, and the definitive treatment of the bias–variance decomposition covered in AI301 Unit 4.',
    copies: 30,
  },
  {
    title: 'Deep Learning',
    authors: ['Ian Goodfellow', 'Yoshua Bengio', 'Aaron Courville'],
    type: 'EBOOK',
    publisher: 'MIT Press',
    year: 2016,
    subjects: ['Computing', 'Machine learning', 'Neural networks'],
    abstract:
      'Foundational text for AI401. Part I is a compact mathematics refresher; Part II covers architectures and training dynamics. Read the chapter on regularisation before the one on optimisation, whatever the order suggests.',
    copies: 30,
  },
  {
    title: 'Speech and Language Processing',
    authors: ['Daniel Jurafsky', 'James H. Martin'],
    type: 'EBOOK',
    publisher: 'Pearson',
    year: 2024,
    subjects: ['Computing', 'Natural language processing', 'Linguistics'],
    abstract:
      'Set text for AI410. Unusually good at connecting classical linguistic structure to modern neural methods rather than treating the former as obsolete. The evaluation chapters are the ones most students skip and most need.',
    copies: 25,
  },
  {
    title: 'Designing Data-Intensive Applications',
    authors: ['Martin Kleppmann'],
    type: 'EBOOK',
    publisher: "O'Reilly Media",
    year: 2017,
    subjects: ['Computing', 'Distributed systems', 'Databases'],
    abstract:
      'How storage and distributed systems actually behave under partition, load and failure. The clearest available account of replication, consistency models and the trade-offs behind them. Essential for CS310.',
    copies: 35,
  },
  {
    title: 'Computer Networking: A Top-Down Approach',
    authors: ['James F. Kurose', 'Keith W. Ross'],
    type: 'EBOOK',
    publisher: 'Pearson',
    year: 2021,
    subjects: ['Computing', 'Networks'],
    abstract:
      'Starts at the application layer and works downward, which is the right order for anyone who has used the internet before studying it. Set text for the networking half of CS301.',
    copies: 30,
  },
  {
    title: 'Operating Systems: Three Easy Pieces',
    authors: ['Remzi H. Arpaci-Dusseau', 'Andrea C. Arpaci-Dusseau'],
    type: 'EBOOK',
    publisher: 'Arpaci-Dusseau Books',
    year: 2018,
    subjects: ['Computing', 'Operating systems'],
    abstract:
      'Virtualisation, concurrency, persistence — three ideas, treated properly. Freely licensed, informally written, and the concurrency section explains race conditions better than most textbooks twice its length.',
    copies: 40,
  },
  {
    title: 'Structure and Interpretation of Computer Programs',
    authors: ['Harold Abelson', 'Gerald Jay Sussman', 'Julie Sussman'],
    type: 'EBOOK',
    publisher: 'MIT Press',
    year: 1996,
    subjects: ['Computing', 'Programming', 'Foundations'],
    abstract:
      'Less about a language than about what abstraction is for. Old, and the reason it stays on reading lists is that the ideas did not date. Recommended for CS102 students who want more than syntax.',
    copies: 20,
  },
  {
    title: 'Clean Architecture: A Craftsman’s Guide to Software Structure and Design',
    authors: ['Robert C. Martin'],
    type: 'BOOK',
    publisher: 'Prentice Hall',
    year: 2017,
    subjects: ['Computing', 'Software architecture'],
    abstract:
      'Dependency direction, boundaries and the cost of coupling. Opinionated, and worth arguing with — CS310 seminars often do. Read alongside the Kleppmann for a view of the same problems at a different altitude.',
    copies: 18,
  },
  {
    title: 'Refactoring: Improving the Design of Existing Code',
    authors: ['Martin Fowler'],
    type: 'EBOOK',
    publisher: 'Addison-Wesley',
    year: 2018,
    subjects: ['Computing', 'Software engineering'],
    abstract:
      'A catalogue of small, safe transformations and when to apply them. The value is in the discipline of changing structure without changing behaviour, which is most of what maintaining software consists of.',
    copies: 22,
  },
  {
    title: 'Applied Cryptography: Protocols, Algorithms and Source Code in C',
    authors: ['Bruce Schneier'],
    type: 'BOOK',
    publisher: 'Wiley',
    year: 2015,
    subjects: ['Computing', 'Cryptography', 'Security'],
    abstract:
      'Broad survey of primitives and protocols. Read for the protocol design chapters rather than the implementations; SEC301 uses it as background alongside more current sources on key management.',
    copies: 15,
  },
  {
    title: 'Serious Cryptography: A Practical Introduction to Modern Encryption',
    authors: ['Jean-Philippe Aumasson'],
    type: 'EBOOK',
    publisher: 'No Starch Press',
    year: 2017,
    subjects: ['Computing', 'Cryptography', 'Security'],
    abstract:
      'Current, practical, and honest about how cryptosystems fail in deployment rather than in theory. The preferred first text for SEC301.',
    copies: 25,
  },
  {
    title: 'The Web Application Hacker’s Handbook',
    authors: ['Dafydd Stuttard', 'Marcus Pinto'],
    type: 'BOOK',
    publisher: 'Wiley',
    year: 2011,
    subjects: ['Computing', 'Security', 'Offensive security'],
    abstract:
      'Methodology for finding and exploiting web vulnerabilities. Used in SEC401 strictly within the isolated lab range; the reconnaissance and reporting chapters are examinable, the rest is practice.',
    copies: 15,
  },
  {
    title: 'Practical Malware Analysis',
    authors: ['Michael Sikorski', 'Andrew Honig'],
    type: 'BOOK',
    publisher: 'No Starch Press',
    year: 2012,
    subjects: ['Computing', 'Security', 'Forensics'],
    abstract:
      'Static and dynamic analysis technique for SEC410. Laboratory work from this text is performed only on the air-gapped forensics range.',
    copies: 12,
  },
  {
    title: 'Statistical Inference',
    authors: ['George Casella', 'Roger L. Berger'],
    type: 'BOOK',
    publisher: 'Cengage',
    year: 2002,
    subjects: ['Computing', 'Statistics', 'Data science'],
    abstract:
      'The standard graduate treatment of estimation and hypothesis testing. Set text for DS301. Mathematically demanding and the source of most of the theory the applied courses take on trust.',
    copies: 20,
  },
  {
    title: 'Bayesian Data Analysis',
    authors: ['Andrew Gelman', 'John B. Carlin', 'Hal S. Stern', 'David B. Dunson', 'Aki Vehtari', 'Donald B. Rubin'],
    type: 'EBOOK',
    publisher: 'CRC Press',
    year: 2013,
    subjects: ['Computing', 'Statistics', 'Bayesian methods'],
    abstract:
      'Applied Bayesian modelling with an emphasis on model checking, which is the part usually omitted. Core reading for DS410 and for research students fitting anything hierarchical.',
    copies: 20,
  },
  {
    title: 'Weapons of Math Destruction',
    authors: ["Cathy O'Neil"],
    type: 'AUDIOBOOK',
    publisher: 'Crown',
    year: 2016,
    subjects: ['Computing', 'Ethics', 'Society'],
    abstract:
      'How opaque scoring models entrench disadvantage at scale, told through cases in policing, hiring and credit. Set listening for AI420; short, non-technical, and hard to dismiss.',
    copies: 999,
    downloadable: true,
  },
  {
    title: 'The Alignment Problem: Machine Learning and Human Values',
    authors: ['Brian Christian'],
    type: 'AUDIOBOOK',
    publisher: 'W. W. Norton',
    year: 2020,
    subjects: ['Computing', 'Ethics', 'Machine learning'],
    abstract:
      'A readable history of attempts to make learned systems do what was intended. Pairs with AI420 and gives useful vocabulary for the impact-assessment coursework.',
    copies: 999,
  },
  {
    title: 'Journal of African Data Science',
    authors: ['Editorial board'],
    type: 'JOURNAL',
    publisher: 'RuMax University Press',
    year: 2026,
    subjects: ['Computing', 'Research', 'Data science'],
    abstract:
      'Quarterly, peer-reviewed, open access. Publishes applied data science with a regional focus, including negative results — a standing editorial policy the university considers a feature.',
    copies: 999,
  },
  {
    title: 'CS201 Algorithms & Data Structures: Past Papers 2020–2025',
    authors: ['Examinations Office'],
    type: 'PAST_PAPER',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Computing', 'Revision', 'Examinations'],
    abstract:
      'Six years of papers with examiner reports. The reports are more useful than the mark schemes: they say where cohorts lost marks, which is usually complexity analysis stated without justification.',
    copies: 999,
  },
  {
    title: 'AI301 Machine Learning: Past Papers 2022–2025',
    authors: ['Examinations Office'],
    type: 'PAST_PAPER',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Computing', 'Revision', 'Examinations'],
    abstract:
      'Four years of papers with examiner reports. Recurring weakness: candidates describe cross-validation correctly and then evaluate on the data used to select features.',
    copies: 999,
  },
  {
    title: 'Detecting concept drift in low-connectivity deployments',
    authors: ['A. Okonkwo', 'T. Banda'],
    type: 'RESEARCH_PAPER',
    publisher: 'Journal of African Data Science',
    year: 2025,
    subjects: ['Computing', 'Machine learning', 'Research'],
    abstract:
      'Monitoring strategies for models deployed where label feedback arrives weeks late and network access is intermittent. Proposes a proxy-signal approach evaluated across four Malawian field sites.',
    copies: 999,
  },
];

/* ------------------------------------------------------ Business & Economics */

const business: CatalogueEntry[] = [
  {
    title: 'Principles of Corporate Finance',
    authors: ['Richard A. Brealey', 'Stewart C. Myers', 'Franklin Allen'],
    type: 'EBOOK',
    publisher: 'McGraw-Hill',
    year: 2020,
    subjects: ['Business', 'Finance'],
    abstract:
      'The standard corporate finance text: valuation, capital structure, payout policy. Set text for FIN301. Assumes the efficient-markets framing that ECO201 later complicates.',
    copies: 35,
  },
  {
    title: 'Corporate Finance in Emerging Markets',
    authors: ['Kwame Mensah'],
    type: 'BOOK',
    publisher: 'RuMax University Press',
    year: 2024,
    subjects: ['Business', 'Finance', 'Development'],
    abstract:
      'Written for contexts where the assumptions of the standard texts do not hold: thin capital markets, currency volatility, and cost-of-capital estimation without a reliable risk-free rate. Companion volume to FIN301.',
    copies: 30,
  },
  {
    title: 'Thinking, Fast and Slow',
    authors: ['Daniel Kahneman'],
    type: 'AUDIOBOOK',
    publisher: 'Farrar, Straus and Giroux',
    year: 2011,
    subjects: ['Business', 'Economics', 'Decision-making'],
    abstract:
      'Two decades of work on judgement under uncertainty. Relevant to BUS410 for what it says about how confidently people hold beliefs that the evidence does not support.',
    copies: 999,
  },
  {
    title: 'Poor Economics: A Radical Rethinking of the Way to Fight Global Poverty',
    authors: ['Abhijit V. Banerjee', 'Esther Duflo'],
    type: 'EBOOK',
    publisher: 'PublicAffairs',
    year: 2011,
    subjects: ['Business', 'Economics', 'Development'],
    abstract:
      'Randomised trials applied to development questions, and a sustained argument for testing interventions rather than assuming them. Core reading for ECO201.',
    copies: 28,
  },
  {
    title: 'Development as Freedom',
    authors: ['Amartya Sen'],
    type: 'EBOOK',
    publisher: 'Oxford University Press',
    year: 1999,
    subjects: ['Business', 'Economics', 'Development'],
    abstract:
      'Reframes development as the expansion of capabilities rather than the growth of output. The conceptual backbone of the development economics strand across ECO201 and GOV301.',
    copies: 25,
  },
  {
    title: 'Competitive Strategy: Techniques for Analyzing Industries and Competitors',
    authors: ['Michael E. Porter'],
    type: 'BOOK',
    publisher: 'Free Press',
    year: 1998,
    subjects: ['Business', 'Strategy'],
    abstract:
      'The five-forces framework and its application. Dated in its examples, durable in its structure. BUS301 uses it as a starting position to be tested rather than a conclusion.',
    copies: 20,
  },
  {
    title: 'The Lean Startup',
    authors: ['Eric Ries'],
    type: 'AUDIOBOOK',
    publisher: 'Crown Business',
    year: 2011,
    subjects: ['Business', 'Entrepreneurship'],
    abstract:
      'Validated learning and iterative product development. Read critically: BUS410 seminars examine which of its claims survive contact with capital-constrained markets.',
    copies: 999,
  },
  {
    title: 'Financial Accounting: An Introduction',
    authors: ['Pauline Weetman'],
    type: 'EBOOK',
    publisher: 'Pearson',
    year: 2019,
    subjects: ['Business', 'Accounting'],
    abstract:
      'Double-entry through to published financial statements, with worked examples throughout. Set text for BUS101 and the prerequisite reading for FIN201.',
    copies: 40,
  },
  {
    title: 'Microeconomics',
    authors: ['Robert S. Pindyck', 'Daniel L. Rubinfeld'],
    type: 'EBOOK',
    publisher: 'Pearson',
    year: 2017,
    subjects: ['Business', 'Economics'],
    abstract:
      'Standard intermediate microeconomics. Chapters on market failure and asymmetric information are the ones ECO201 builds on most heavily.',
    copies: 30,
  },
  {
    title: 'Mobile money adoption and small enterprise cash flow in Southern Africa',
    authors: ['G. Phiri', 'L. Haddad'],
    type: 'RESEARCH_PAPER',
    publisher: 'RuMax University Press',
    year: 2025,
    subjects: ['Business', 'Finance', 'Research'],
    abstract:
      'Panel study of 1,400 micro-enterprises across three markets, examining working-capital effects of mobile money adoption. Finds smaller effects than the prior literature and discusses why.',
    copies: 999,
  },
  {
    title: 'BUS101 Foundations of Business: Past Papers 2021–2025',
    authors: ['Examinations Office'],
    type: 'PAST_PAPER',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Business', 'Revision', 'Examinations'],
    abstract:
      'Five years of papers with examiner reports. The recurring comment concerns candidates reciting frameworks without applying them to the case in front of them.',
    copies: 999,
  },
  {
    title: 'Harvard Business Review',
    authors: ['Editorial board'],
    type: 'MAGAZINE',
    publisher: 'Harvard Business Publishing',
    year: 2026,
    subjects: ['Business', 'Management'],
    abstract:
      'Institutional subscription, current issue plus archive. Useful for case material; treat the prescriptive articles as hypotheses rather than findings.',
    copies: 999,
  },
];

/* ------------------------------------------------------------ Health Sciences */

const health: CatalogueEntry[] = [
  {
    title: 'Modern Epidemiology',
    authors: ['Kenneth J. Rothman', 'Sander Greenland', 'Timothy L. Lash'],
    type: 'BOOK',
    publisher: 'Lippincott Williams & Wilkins',
    year: 2008,
    subjects: ['Health', 'Epidemiology'],
    abstract:
      'The reference text for epidemiological method: study design, confounding, bias, causal inference. Set text for PH301 and demanding enough to reward a second reading in the final year.',
    copies: 25,
  },
  {
    title: 'Epidemiology: An Introduction',
    authors: ['Kenneth J. Rothman'],
    type: 'EBOOK',
    publisher: 'Oxford University Press',
    year: 2012,
    subjects: ['Health', 'Epidemiology'],
    abstract:
      'The accessible companion to the above. Start here if measures of association are unfamiliar; the chapter on confounding repays careful attention before PH301 begins.',
    copies: 30,
  },
  {
    title: 'Global Health 101',
    authors: ['Richard Skolnik'],
    type: 'EBOOK',
    publisher: 'Jones & Bartlett Learning',
    year: 2019,
    subjects: ['Health', 'Global health', 'Policy'],
    abstract:
      'Burden of disease, health systems and the economics of intervention, organised around case studies from low- and middle-income settings. Core text for PH302.',
    copies: 30,
  },
  {
    title: 'Health Systems Management in Resource-Limited Settings',
    authors: ['Leila Haddad'],
    type: 'BOOK',
    publisher: 'RuMax University Press',
    year: 2025,
    subjects: ['Health', 'Health systems', 'Management'],
    abstract:
      'Written for PH401 from field experience across the region: supply chains that fail, staffing under attrition, and the gap between a national health strategy and what a district hospital can execute.',
    copies: 25,
  },
  {
    title: 'Medical Statistics at a Glance',
    authors: ['Aviva Petrie', 'Caroline Sabin'],
    type: 'EBOOK',
    publisher: 'Wiley-Blackwell',
    year: 2019,
    subjects: ['Health', 'Statistics'],
    abstract:
      'Concise double-page treatments of the statistical methods clinical papers actually use. The best available quick reference when reading a trial report and unsure what a hazard ratio is claiming.',
    copies: 35,
  },
  {
    title: 'The Spirit Level: Why Equality is Better for Everyone',
    authors: ['Richard Wilkinson', 'Kate Pickett'],
    type: 'AUDIOBOOK',
    publisher: 'Penguin',
    year: 2010,
    subjects: ['Health', 'Public health', 'Society'],
    abstract:
      'Population-level associations between inequality and health outcomes. Contested, and set precisely so students can examine how strongly the evidence supports the causal claim.',
    copies: 999,
  },
  {
    title: 'Bad Science',
    authors: ['Ben Goldacre'],
    type: 'AUDIOBOOK',
    publisher: 'Fourth Estate',
    year: 2008,
    subjects: ['Health', 'Research methods', 'Critical appraisal'],
    abstract:
      'How medical evidence is distorted, from trial design through to reporting. Set listening in the first week of PH301; the chapter on publication bias frames the whole module.',
    copies: 999,
  },
  {
    title: 'Community health worker retention in rural districts: a five-year cohort',
    authors: ['L. Haddad', 'C. Banda', 'N. Silva'],
    type: 'RESEARCH_PAPER',
    publisher: 'RuMax University Press',
    year: 2026,
    subjects: ['Health', 'Health systems', 'Research'],
    abstract:
      'Follows 620 community health workers across five years, identifying supervision frequency rather than pay as the strongest predictor of retention. Includes the null findings on training length.',
    copies: 999,
  },
  {
    title: 'The Lancet Global Health',
    authors: ['Editorial board'],
    type: 'JOURNAL',
    publisher: 'Elsevier',
    year: 2026,
    subjects: ['Health', 'Global health', 'Research'],
    abstract:
      'Institutional access to current and archived issues. The primary source for MPH dissertation literature reviews.',
    copies: 999,
  },
  {
    title: 'PH301 Epidemiology: Past Papers 2022–2025',
    authors: ['Examinations Office'],
    type: 'PAST_PAPER',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Health', 'Revision', 'Examinations'],
    abstract:
      'Four years of papers with examiner reports. Candidates reliably lose marks distinguishing confounding from effect modification; the 2024 report explains the distinction at length.',
    copies: 999,
  },
];

/* ------------------------------------------------- Engineering & Environment */

const engineering: CatalogueEntry[] = [
  {
    title: 'Renewable Energy Engineering',
    authors: ['Nicola Pearsall', 'Robert Hill'],
    type: 'EBOOK',
    publisher: 'Cambridge University Press',
    year: 2017,
    subjects: ['Engineering', 'Renewable energy'],
    abstract:
      'Resource assessment, conversion technologies and system integration across solar, wind and hydro. Set text for ENG301, with the grid-integration chapters carried into ENG310.',
    copies: 25,
  },
  {
    title: 'Solar Engineering of Thermal Processes',
    authors: ['John A. Duffie', 'William A. Beckman'],
    type: 'BOOK',
    publisher: 'Wiley',
    year: 2013,
    subjects: ['Engineering', 'Solar', 'Thermal systems'],
    abstract:
      'The reference for solar thermal design and radiation modelling. Heavy on the underlying physics; ENG301 uses selected chapters rather than the whole volume.',
    copies: 15,
  },
  {
    title: 'Mini-grid design in rural Malawi: a field study',
    authors: ['N. Silva', 'T. Banda'],
    type: 'RESEARCH_PAPER',
    publisher: 'RuMax University Press',
    year: 2025,
    subjects: ['Engineering', 'Energy', 'Development'],
    abstract:
      'Design, deployment and eighteen-month operation of four village mini-grids. Documents demand forecasts that proved wrong by a factor of three and what that implies for sizing.',
    copies: 999,
  },
  {
    title: 'Water Supply and Sanitation in Developing Countries',
    authors: ['Duncan Mara'],
    type: 'EBOOK',
    publisher: 'IWA Publishing',
    year: 2018,
    subjects: ['Engineering', 'Water', 'Public health'],
    abstract:
      'Treatment and distribution engineered for constrained budgets and intermittent power. Bridges ENV301 and the health systems material in PH401.',
    copies: 20,
  },
  {
    title: 'Climate Change 2023: Synthesis Report',
    authors: ['Intergovernmental Panel on Climate Change'],
    type: 'RESEARCH_PAPER',
    publisher: 'IPCC',
    year: 2023,
    subjects: ['Environment', 'Climate', 'Policy'],
    abstract:
      'The consolidated assessment underpinning ENV301 and SC-CLIM. Read the Summary for Policymakers first, then the chapters relevant to your region; the uncertainty language is precisely defined and worth learning.',
    copies: 999,
  },
  {
    title: 'Sustainable Energy — Without the Hot Air',
    authors: ['David J. C. MacKay'],
    type: 'EBOOK',
    publisher: 'UIT Cambridge',
    year: 2008,
    subjects: ['Engineering', 'Energy', 'Environment'],
    abstract:
      'Energy arithmetic done honestly and at scale, with every number sourced. The best available demonstration that quantitative reasoning settles arguments that rhetoric does not.',
    copies: 999,
  },
  {
    title: 'Structures: Or Why Things Don’t Fall Down',
    authors: ['J. E. Gordon'],
    type: 'AUDIOBOOK',
    publisher: 'Da Capo Press',
    year: 2003,
    subjects: ['Engineering', 'Materials', 'Foundations'],
    abstract:
      'Why materials fail, explained without mathematics and without condescension. Recommended to first-year engineers and to anyone who has wondered what stress and strain actually mean.',
    copies: 999,
  },
  {
    title: 'Climate adaptation planning for smallholder agriculture',
    authors: ['A. Mwangi', 'K. Mensah'],
    type: 'RESEARCH_PAPER',
    publisher: 'RuMax University Press',
    year: 2026,
    subjects: ['Environment', 'Climate', 'Agriculture'],
    abstract:
      'Assesses adaptation measures against downscaled climate projections for three districts, and is explicit about which projections the underlying models disagree on.',
    copies: 999,
  },
  {
    title: 'ENG301 Renewable Energy Systems: Past Papers 2023–2025',
    authors: ['Examinations Office'],
    type: 'PAST_PAPER',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Engineering', 'Revision', 'Examinations'],
    abstract:
      'Three years of papers with examiner reports. Design questions require stated assumptions; the reports are unambiguous that unstated assumptions cost marks.',
    copies: 999,
  },
];

/* -------------------------------------------------------------- Education */

const education: CatalogueEntry[] = [
  {
    title: 'Visible Learning: A Synthesis of Over 800 Meta-Analyses',
    authors: ['John Hattie'],
    type: 'EBOOK',
    publisher: 'Routledge',
    year: 2008,
    subjects: ['Education', 'Pedagogy', 'Evidence'],
    abstract:
      'Effect sizes for a very large number of educational interventions. Set text for EDU201, and read alongside the methodological critiques — how the effect sizes were pooled is itself part of the syllabus.',
    copies: 30,
  },
  {
    title: 'Understanding by Design',
    authors: ['Grant Wiggins', 'Jay McTighe'],
    type: 'EBOOK',
    publisher: 'ASCD',
    year: 2005,
    subjects: ['Education', 'Curriculum design'],
    abstract:
      'Backward design: start from the evidence of learning you will accept, then plan the teaching. The organising framework for EDU301 and for the curriculum coursework.',
    copies: 30,
  },
  {
    title: 'Make It Stick: The Science of Successful Learning',
    authors: ['Peter C. Brown', 'Henry L. Roediger III', 'Mark A. McDaniel'],
    type: 'AUDIOBOOK',
    publisher: 'Belknap Press',
    year: 2014,
    subjects: ['Education', 'Cognition', 'Study skills'],
    abstract:
      'Retrieval practice, spacing and interleaving, and why the study techniques that feel most productive generally are not. Recommended to every student, not only to those on education programmes.',
    copies: 999,
  },
  {
    title: 'Teaching Online: An Evidence Review',
    authors: ['Grace Chirwa'],
    type: 'EBOOK',
    publisher: 'RuMax University Press',
    year: 2025,
    subjects: ['Education', 'Online learning'],
    abstract:
      'Reviews the evidence on synchronous versus asynchronous delivery, cohort effects and completion in fully online programmes — including this university’s own retention data, published in full.',
    copies: 999,
  },
  {
    title: 'Pedagogy of the Oppressed',
    authors: ['Paulo Freire'],
    type: 'EBOOK',
    publisher: 'Continuum',
    year: 2000,
    subjects: ['Education', 'Theory', 'Society'],
    abstract:
      'The critique of the "banking" model of education and the case for dialogic teaching. Foundational for EDU201 seminars on the purpose of schooling.',
    copies: 25,
  },
  {
    title: 'Assessment for Learning: Putting it into Practice',
    authors: ['Paul Black', 'Christine Harrison', 'Clare Lee', 'Bethan Marshall', 'Dylan Wiliam'],
    type: 'EBOOK',
    publisher: 'Open University Press',
    year: 2003,
    subjects: ['Education', 'Assessment'],
    abstract:
      'Formative assessment as a teaching practice rather than a measurement exercise. The feedback chapters directly inform the marking standards used across this university.',
    copies: 25,
  },
  {
    title: 'Completion in fully online degree programmes: a four-cohort analysis',
    authors: ['G. Chirwa', 'S. Marchetti'],
    type: 'RESEARCH_PAPER',
    publisher: 'RuMax University Press',
    year: 2026,
    subjects: ['Education', 'Online learning', 'Research'],
    abstract:
      'Tracks four cohorts through to award, identifying the second semester as the point of highest attrition and evaluating three interventions, two of which had no measurable effect.',
    copies: 999,
  },
];

/* --------------------------------------------------------- Law & Governance */

const law: CatalogueEntry[] = [
  {
    title: 'International Human Rights Law',
    authors: ['Daniel Moeckli', 'Sangeeta Shah', 'Sandesh Sivakumaran'],
    type: 'EBOOK',
    publisher: 'Oxford University Press',
    year: 2022,
    subjects: ['Law', 'Human rights'],
    abstract:
      'The standard course text for LAW301: sources, institutions, enforcement and the substantive rights. Strong on the gap between ratification and implementation.',
    copies: 25,
  },
  {
    title: 'The Rights of Others: Aliens, Residents and Citizens',
    authors: ['Seyla Benhabib'],
    type: 'EBOOK',
    publisher: 'Cambridge University Press',
    year: 2004,
    subjects: ['Law', 'Political theory', 'Migration'],
    abstract:
      'Membership, borders and the claims of non-citizens. Seminar reading for the LLM strand on migration and statelessness.',
    copies: 18,
  },
  {
    title: 'Governing the Commons',
    authors: ['Elinor Ostrom'],
    type: 'EBOOK',
    publisher: 'Cambridge University Press',
    year: 1990,
    subjects: ['Governance', 'Institutions', 'Environment'],
    abstract:
      'Empirical demolition of the claim that common resources are inevitably degraded, and the design principles that follow. Core reading for GOV301.',
    copies: 22,
  },
  {
    title: 'Why Nations Fail: The Origins of Power, Prosperity and Poverty',
    authors: ['Daron Acemoglu', 'James A. Robinson'],
    type: 'AUDIOBOOK',
    publisher: 'Crown Business',
    year: 2012,
    subjects: ['Governance', 'Economics', 'Institutions'],
    abstract:
      'Institutional explanations for divergent national outcomes. Set with its critics in GOV301, where the seminar question is how much the thesis explains and how much it assumes.',
    copies: 999,
  },
  {
    title: 'Data Protection and Privacy Law',
    authors: ['Orla Lynskey'],
    type: 'EBOOK',
    publisher: 'Oxford University Press',
    year: 2015,
    subjects: ['Law', 'Data protection', 'Technology'],
    abstract:
      'The legal foundations of data protection and their relationship to privacy as a right. Cross-listed reading for AI420 and for anyone whose dissertation touches automated decision-making.',
    copies: 20,
  },
  {
    title: 'Human Rights Quarterly',
    authors: ['Editorial board'],
    type: 'JOURNAL',
    publisher: 'Johns Hopkins University Press',
    year: 2026,
    subjects: ['Law', 'Human rights', 'Research'],
    abstract:
      'Institutional access to current and archived issues. The primary journal for LLM dissertation work.',
    copies: 999,
  },
  {
    title: 'Automated decision-making in public administration: a comparative review',
    authors: ['K. Mensah', 'O. Adeyemi'],
    type: 'RESEARCH_PAPER',
    publisher: 'RuMax University Press',
    year: 2026,
    subjects: ['Law', 'Governance', 'Technology'],
    abstract:
      'Compares statutory safeguards for algorithmic decisions across eleven jurisdictions, and finds that rights of explanation are commonly granted and rarely exercised.',
    copies: 999,
  },
  {
    title: 'LAW301 International Law: Past Papers 2022–2025',
    authors: ['Examinations Office'],
    type: 'PAST_PAPER',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Law', 'Revision', 'Examinations'],
    abstract:
      'Four years of papers with examiner reports. Problem questions require authority for each proposition; the reports note that unsupported assertion is the most common cause of a bare pass.',
    copies: 999,
  },
];

/* ------------------------------------------ Theses and institutional holdings */

const institutional: CatalogueEntry[] = [
  {
    title: 'Federated learning under intermittent connectivity (PhD thesis)',
    authors: ['Amara Okonkwo'],
    type: 'THESIS',
    publisher: 'RuMax Global Digital University',
    year: 2025,
    subjects: ['Computing', 'Machine learning', 'Theses'],
    abstract:
      'Doctoral thesis examining federated training where client availability is low and irregular. Includes the negative result on gradient compression that the accompanying paper omitted.',
    copies: 999,
  },
  {
    title: 'Tariff design for village mini-grids (MSc dissertation)',
    authors: ['Nadia Silva'],
    type: 'THESIS',
    publisher: 'RuMax Global Digital University',
    year: 2026,
    subjects: ['Engineering', 'Energy', 'Theses'],
    abstract:
      'Distinction-graded dissertation modelling tariff structures against measured household demand. Held as an exemplar for MSc-RE students planning their own dissertation.',
    copies: 999,
  },
  {
    title: 'Academic Regulations and Assessment Framework 2026',
    authors: ['Academic Registry'],
    type: 'EBOOK',
    publisher: 'RuMax Global Digital University',
    year: 2026,
    subjects: ['University', 'Regulations'],
    abstract:
      'The governing document for assessment, progression, classification and academic misconduct. Cited in every appeal; worth reading once before you need it.',
    copies: 999,
  },
  {
    title: 'Referencing and Academic Integrity: A Student Guide',
    authors: ['Library Services'],
    type: 'EBOOK',
    publisher: 'RuMax Global Digital University',
    year: 2026,
    subjects: ['University', 'Study skills', 'Academic integrity'],
    abstract:
      'Citation styles accepted by each faculty, with worked examples, plus what does and does not constitute collusion in group work and in the use of generative tools.',
    copies: 999,
  },
  {
    title: 'Institutional Transparency Report 2025',
    authors: ['Office of Institutional Research'],
    type: 'EBOOK',
    publisher: 'RuMax Global Digital University',
    year: 2026,
    subjects: ['University', 'Transparency'],
    abstract:
      'Enrolment, attainment, completion and graduate outcomes, published in full including the measures that fell short of target.',
    copies: 999,
  },
];

export const LIBRARY_CATALOGUE: CatalogueEntry[] = [
  ...computing,
  ...business,
  ...health,
  ...engineering,
  ...education,
  ...law,
  ...institutional,
];
