/* eslint-disable no-console */
/**
 * Demonstration data for RuMax Global Digital University.
 *
 * Running `npm run db:seed` builds a complete, internally consistent university: six
 * faculties, a full curriculum, three academic terms, staff and students with real
 * registrations, submitted work, published grades, invoices, payments and issued
 * certificates that verify against the public portal.
 *
 * The generator is deterministic (fixed seed) so screenshots, tests and documentation
 * stay in step across machines. Re-running clears and rebuilds everything.
 */
import { randomBytes } from 'node:crypto';

import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import {
  formatApplicationReference,
  formatInvoiceNumber,
  formatStudentNumber,
  generateSerial,
  hashCertificate,
} from '../src/lib/certificates';
import { classify, gradePointFor, letterFor } from '../src/lib/grading';
import { AUTHORED_COURSES } from './content/ai301-machine-learning';

const prisma = new PrismaClient();

/**
 * The password every demonstration account is given.
 *
 * `SEED_PASSWORD` wins whenever it is set. The fallback depends on where this runs,
 * because the two situations want opposite things:
 *
 *   - Locally, predictable is the point. You seed a throwaway database and sign straight
 *     in, and there is nothing to protect.
 *   - In production, predictable is an open door. A default written in this repository is
 *     known to everyone who can read it, so a deployment that forgot to set
 *     `SEED_PASSWORD` would come up with credentials anybody could use.
 *
 * Production therefore gets a random password, printed once when the seed finishes.
 * Forgetting to configure it now locks the demonstration accounts rather than opening
 * them to the internet.
 */
const LOCAL_DEFAULT_PASSWORD = 'rumax-local-dev';
const PASSWORD_WAS_GENERATED =
  !process.env.SEED_PASSWORD && process.env.NODE_ENV === 'production';
const PASSWORD =
  process.env.SEED_PASSWORD ||
  (PASSWORD_WAS_GENERATED ? randomBytes(12).toString('base64url') : LOCAL_DEFAULT_PASSWORD);

/* --------------------------------------------------------- deterministic rng */

let seedState = 20250101;
function rng(): number {
  // Mulberry32 — small, fast, and reproducible across Node versions.
  seedState |= 0;
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)];
const between = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const chance = (p: number) => rng() < p;
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

/* ------------------------------------------------------------------- content */

const FACULTIES = [
  {
    slug: 'computing-and-data-science',
    name: 'Faculty of Computing & Data Science',
    description:
      'Software engineering, artificial intelligence, cybersecurity and data science, taught by practitioners who still ship code.',
    departments: [
      ['software-engineering', 'Department of Software Engineering'],
      ['artificial-intelligence', 'Department of Artificial Intelligence'],
      ['cybersecurity', 'Department of Cybersecurity'],
      ['data-science', 'Department of Data Science'],
    ],
  },
  {
    slug: 'business-and-economics',
    name: 'Faculty of Business & Economics',
    description:
      'Management, finance, entrepreneurship and development economics with a focus on emerging markets.',
    departments: [
      ['management', 'Department of Management'],
      ['finance-and-accounting', 'Department of Finance & Accounting'],
      ['economics', 'Department of Economics'],
    ],
  },
  {
    slug: 'health-sciences',
    name: 'Faculty of Health Sciences',
    description:
      'Public health, health systems management and epidemiology, built around the realities of low-resource settings.',
    departments: [
      ['public-health', 'Department of Public Health'],
      ['health-systems', 'Department of Health Systems Management'],
    ],
  },
  {
    slug: 'education',
    name: 'Faculty of Education',
    description:
      'Teacher education, curriculum design and educational technology for schools and universities.',
    departments: [
      ['curriculum-studies', 'Department of Curriculum Studies'],
      ['educational-technology', 'Department of Educational Technology'],
    ],
  },
  {
    slug: 'law-and-governance',
    name: 'Faculty of Law & Governance',
    description:
      'International law, human rights, public policy and the governance of digital societies.',
    departments: [
      ['public-law', 'Department of Public Law'],
      ['policy-and-governance', 'Department of Policy & Governance'],
    ],
  },
  {
    slug: 'engineering-and-environment',
    name: 'Faculty of Engineering & Environment',
    description:
      'Renewable energy, water systems, climate adaptation and the engineering of resilient infrastructure.',
    departments: [
      ['renewable-energy', 'Department of Renewable Energy'],
      ['environmental-engineering', 'Department of Environmental Engineering'],
      ['civil-systems', 'Department of Civil Systems'],
    ],
  },
] as const;

type ProgramSeed = {
  code: string;
  title: string;
  level: Prisma.ProgramCreateInput['level'];
  faculty: string;
  department: string;
  months: number;
  credits: number;
  tuition: number;
  featured?: boolean;
  summary: string;
  entry: string[];
  careers: string[];
};

const PROGRAMS: ProgramSeed[] = [
  {
    code: 'BSC-CS',
    title: 'BSc (Hons) Computer Science',
    level: 'UNDERGRADUATE',
    faculty: 'computing-and-data-science',
    department: 'software-engineering',
    months: 48,
    credits: 360,
    tuition: 3200,
    featured: true,
    summary:
      'A four-year honours degree covering programming, systems, algorithms, machine learning and a substantial final-year project.',
    entry: [
      'Secondary school certificate with passes in Mathematics and English',
      'Two academic references',
      'Personal statement of 500 words',
    ],
    careers: ['Software engineer', 'Data engineer', 'Systems analyst', 'Technical founder'],
  },
  {
    code: 'MSC-AI',
    title: 'MSc Artificial Intelligence',
    level: 'MASTERS',
    faculty: 'computing-and-data-science',
    department: 'artificial-intelligence',
    months: 18,
    credits: 180,
    tuition: 5400,
    featured: true,
    summary:
      'Machine learning, deep learning, natural language processing and AI ethics, finishing with an industry-linked dissertation.',
    entry: [
      'Bachelors degree at second class or above in a quantitative discipline',
      'Demonstrable programming ability in Python',
      'Research proposal of 1,000 words',
    ],
    careers: ['Machine learning engineer', 'Research scientist', 'AI product lead'],
  },
  {
    code: 'MSC-CYB',
    title: 'MSc Cybersecurity',
    level: 'MASTERS',
    faculty: 'computing-and-data-science',
    department: 'cybersecurity',
    months: 18,
    credits: 180,
    tuition: 5600,
    featured: true,
    summary:
      'Offensive and defensive security, cryptography, incident response and security governance with hands-on virtual labs.',
    entry: ['Bachelors degree in computing or two years of relevant experience', 'Two references'],
    careers: ['Security analyst', 'Penetration tester', 'CISO track'],
  },
  {
    code: 'PHD-DS',
    title: 'PhD Data Science',
    level: 'PHD',
    faculty: 'computing-and-data-science',
    department: 'data-science',
    months: 48,
    credits: 360,
    tuition: 4800,
    summary:
      'A supervised doctoral programme producing original research, with two taught research-methods modules in year one.',
    entry: [
      'Masters degree with a research component',
      'Research proposal of 3,000 words',
      'Interview with the proposed supervisor',
    ],
    careers: ['Academic researcher', 'Principal data scientist', 'Policy adviser'],
  },
  {
    code: 'MBA',
    title: 'Executive MBA',
    level: 'EXECUTIVE',
    faculty: 'business-and-economics',
    department: 'management',
    months: 24,
    credits: 180,
    tuition: 7900,
    featured: true,
    summary:
      'A part-time MBA for working managers: strategy, finance, operations, leadership and a live consultancy project.',
    entry: ['Bachelors degree', 'Minimum five years of professional experience', 'Employer reference'],
    careers: ['General manager', 'Director', 'Founder'],
  },
  {
    code: 'BCOM',
    title: 'BCom Accounting & Finance',
    level: 'UNDERGRADUATE',
    faculty: 'business-and-economics',
    department: 'finance-and-accounting',
    months: 36,
    credits: 300,
    tuition: 2900,
    summary:
      'Professional-body-aligned accounting degree with exemptions toward ACCA and CIMA qualifications.',
    entry: ['Secondary school certificate including Mathematics', 'One reference'],
    careers: ['Accountant', 'Financial analyst', 'Auditor'],
  },
  {
    code: 'MPH',
    title: 'Master of Public Health',
    level: 'MASTERS',
    faculty: 'health-sciences',
    department: 'public-health',
    months: 18,
    credits: 180,
    tuition: 4900,
    featured: true,
    summary:
      'Epidemiology, biostatistics, health policy and programme evaluation for practitioners in low- and middle-income settings.',
    entry: [
      'Bachelors degree in health, science or social science',
      'Two years of practice experience preferred',
    ],
    careers: ['Epidemiologist', 'Programme manager', 'Health policy analyst'],
  },
  {
    code: 'DIP-HSM',
    title: 'Diploma in Health Systems Management',
    level: 'DIPLOMA',
    faculty: 'health-sciences',
    department: 'health-systems',
    months: 12,
    credits: 120,
    tuition: 1800,
    summary:
      'A one-year diploma for clinic and district health managers covering budgeting, supply chains and quality improvement.',
    entry: ['Secondary school certificate', 'Employment in a health setting'],
    careers: ['Clinic manager', 'District health officer'],
  },
  {
    code: 'PGCE',
    title: 'PGCE Secondary Education',
    level: 'PROFESSIONAL',
    faculty: 'education',
    department: 'curriculum-studies',
    months: 12,
    credits: 120,
    tuition: 2400,
    summary:
      'A postgraduate teaching qualification with supervised practice in a school near you and online pedagogy seminars.',
    entry: ['Bachelors degree in a teaching subject', 'Enhanced background check'],
    careers: ['Secondary school teacher', 'Head of department'],
  },
  {
    code: 'CERT-EDTECH',
    title: 'Certificate in Educational Technology',
    level: 'CERTIFICATE',
    faculty: 'education',
    department: 'educational-technology',
    months: 6,
    credits: 60,
    tuition: 900,
    summary:
      'Practical design of online courses: assessment, accessibility, learning analytics and course production.',
    entry: ['Open entry — no formal qualifications required'],
    careers: ['Learning designer', 'Digital learning lead'],
  },
  {
    code: 'LLM-IHR',
    title: 'LLM International Human Rights Law',
    level: 'MASTERS',
    faculty: 'law-and-governance',
    department: 'public-law',
    months: 18,
    credits: 180,
    tuition: 5200,
    summary:
      'Treaty systems, regional courts, litigation strategy and the practice of human rights advocacy.',
    entry: ['Law degree or equivalent professional qualification', 'Writing sample'],
    careers: ['Human rights lawyer', 'Policy adviser', 'NGO legal lead'],
  },
  {
    code: 'MSC-RE',
    title: 'MSc Renewable Energy Systems',
    level: 'MASTERS',
    faculty: 'engineering-and-environment',
    department: 'renewable-energy',
    months: 18,
    credits: 180,
    tuition: 5100,
    featured: true,
    summary:
      'Solar, wind, storage and mini-grid engineering, with simulation labs and a capstone system design.',
    entry: ['Engineering or physical sciences degree', 'Mathematics at undergraduate level'],
    careers: ['Energy systems engineer', 'Mini-grid developer', 'Sustainability consultant'],
  },
  {
    code: 'SC-CLIM',
    title: 'Climate Adaptation for Practitioners',
    level: 'SHORT_COURSE',
    faculty: 'engineering-and-environment',
    department: 'environmental-engineering',
    months: 3,
    credits: 30,
    tuition: 450,
    summary:
      'An eight-week short course on adaptation planning, climate finance and community resilience.',
    entry: ['Open entry'],
    careers: ['Adaptation officer', 'Programme coordinator'],
  },
  {
    code: 'MOOC-DL',
    title: 'Foundations of Digital Literacy',
    level: 'MOOC',
    faculty: 'education',
    department: 'educational-technology',
    months: 2,
    credits: 10,
    tuition: 0,
    summary:
      'A free, self-paced open course for anyone starting out online — devices, search, safety and study skills.',
    entry: ['Open to everyone, no cost'],
    careers: ['Foundation for further study'],
  },
];

type CourseSeed = { code: string; title: string; credits: number; level: number; department: string; description: string };

const COURSES: CourseSeed[] = [
  { code: 'CS101', title: 'Programming Fundamentals', credits: 15, level: 100, department: 'software-engineering', description: 'Variables, control flow, functions, data structures and testing, taught in Python with weekly labs.' },
  { code: 'CS102', title: 'Discrete Mathematics for Computing', credits: 15, level: 100, department: 'software-engineering', description: 'Logic, sets, relations, graphs and proof techniques underpinning algorithms and databases.' },
  { code: 'CS201', title: 'Data Structures & Algorithms', credits: 15, level: 200, department: 'software-engineering', description: 'Complexity analysis, trees, graphs, sorting, searching and algorithm design strategies.' },
  { code: 'CS202', title: 'Database Systems', credits: 15, level: 200, department: 'software-engineering', description: 'Relational modelling, normalisation, SQL, transactions and an introduction to distributed stores.' },
  { code: 'CS210', title: 'Web & API Engineering', credits: 15, level: 200, department: 'software-engineering', description: 'HTTP, REST and GraphQL design, authentication, caching and deploying a service to production.' },
  { code: 'CS301', title: 'Operating Systems & Networks', credits: 15, level: 300, department: 'software-engineering', description: 'Processes, memory, file systems, the TCP/IP stack and the concurrency problems they create.' },
  { code: 'CS310', title: 'Software Architecture', credits: 15, level: 300, department: 'software-engineering', description: 'Decomposition, coupling, evolutionary architecture and documenting decisions that outlive their authors.' },
  { code: 'AI301', title: 'Machine Learning', credits: 15, level: 300, department: 'artificial-intelligence', description: 'Supervised and unsupervised learning, model evaluation, regularisation and the failure modes of each.' },
  { code: 'AI401', title: 'Deep Learning', credits: 20, level: 400, department: 'artificial-intelligence', description: 'Neural network architectures, training dynamics, transfer learning and practical model deployment.' },
  { code: 'AI410', title: 'Natural Language Processing', credits: 20, level: 400, department: 'artificial-intelligence', description: 'Tokenisation through transformers, with an emphasis on evaluation and low-resource languages.' },
  { code: 'AI420', title: 'AI Ethics & Governance', credits: 10, level: 400, department: 'artificial-intelligence', description: 'Fairness, accountability, transparency, regulation and the practice of impact assessment.' },
  { code: 'SEC301', title: 'Applied Cryptography', credits: 15, level: 300, department: 'cybersecurity', description: 'Symmetric and public-key primitives, protocols, key management and how cryptosystems fail in practice.' },
  { code: 'SEC401', title: 'Offensive Security', credits: 20, level: 400, department: 'cybersecurity', description: 'Threat modelling, reconnaissance, exploitation and reporting, conducted entirely in isolated lab ranges.' },
  { code: 'SEC410', title: 'Incident Response & Forensics', credits: 20, level: 400, department: 'cybersecurity', description: 'Detection, containment, evidence handling and post-incident review under regulatory obligations.' },
  { code: 'DS301', title: 'Statistical Inference', credits: 15, level: 300, department: 'data-science', description: 'Estimation, hypothesis testing, resampling and the interpretation of uncertainty.' },
  { code: 'DS410', title: 'Research Methods in Data Science', credits: 20, level: 400, department: 'data-science', description: 'Designing, running and reporting empirical studies with reproducible pipelines.' },
  { code: 'BUS101', title: 'Principles of Management', credits: 15, level: 100, department: 'management', description: 'Organising, planning, leading and controlling — and what the evidence says about each.' },
  { code: 'BUS301', title: 'Strategic Management', credits: 15, level: 300, department: 'management', description: 'Industry analysis, competitive positioning, resource-based strategy and execution.' },
  { code: 'BUS410', title: 'Leadership & Organisational Change', credits: 15, level: 400, department: 'management', description: 'Change models, stakeholder management and leading distributed teams across cultures.' },
  { code: 'FIN201', title: 'Financial Accounting', credits: 15, level: 200, department: 'finance-and-accounting', description: 'Double entry through to published financial statements and their limitations.' },
  { code: 'FIN301', title: 'Corporate Finance', credits: 15, level: 300, department: 'finance-and-accounting', description: 'Valuation, capital structure, investment appraisal and risk-adjusted decision making.' },
  { code: 'ECO201', title: 'Development Economics', credits: 15, level: 200, department: 'economics', description: 'Growth, poverty, inequality and the evaluation of development interventions.' },
  { code: 'PH301', title: 'Epidemiology', credits: 15, level: 300, department: 'public-health', description: 'Study design, measures of association, bias and confounding, and outbreak investigation.' },
  { code: 'PH302', title: 'Biostatistics', credits: 15, level: 300, department: 'public-health', description: 'Analysis of health data from description through regression to survival methods.' },
  { code: 'PH401', title: 'Health Policy & Systems', credits: 15, level: 400, department: 'health-systems', description: 'Financing, governance, service delivery and the politics of health reform.' },
  { code: 'EDU201', title: 'Curriculum Design', credits: 15, level: 200, department: 'curriculum-studies', description: 'Backward design, constructive alignment and assessment that measures what it claims to.' },
  { code: 'EDU301', title: 'Learning Design for Online Courses', credits: 15, level: 300, department: 'educational-technology', description: 'Accessible, engaging online courses: media, activity design, and learning analytics.' },
  { code: 'LAW301', title: 'International Human Rights Law', credits: 20, level: 300, department: 'public-law', description: 'The UN and regional systems, justiciability, and strategic litigation.' },
  { code: 'GOV301', title: 'Digital Governance & Policy', credits: 15, level: 300, department: 'policy-and-governance', description: 'Data protection, platform regulation, digital identity and public-sector technology.' },
  { code: 'ENG301', title: 'Solar Photovoltaic Systems', credits: 15, level: 300, department: 'renewable-energy', description: 'Cell physics through to sizing, inverters, storage and installation economics.' },
  { code: 'ENG310', title: 'Energy Storage & Mini-Grids', credits: 15, level: 300, department: 'renewable-energy', description: 'Battery chemistry, dispatch strategy and the design of village-scale mini-grids.' },
  { code: 'ENV301', title: 'Climate Adaptation Planning', credits: 15, level: 300, department: 'environmental-engineering', description: 'Vulnerability assessment, adaptation options appraisal and climate finance.' },
];

const FIRST_NAMES = ['Amina', 'Thabo', 'Chikondi', 'Grace', 'Daniel', 'Fatima', 'Kwame', 'Leila', 'Samuel', 'Nadia', 'Tendai', 'Yusuf', 'Blessings', 'Ruth', 'Emmanuel', 'Zainab', 'Peter', 'Mercy', 'Hassan', 'Aisha', 'Joseph', 'Precious', 'Ibrahim', 'Sarah', 'Michael', 'Chiamaka', 'Elias', 'Noor', 'Patrick', 'Halima', 'Lucas', 'Esther', 'Omar', 'Rebecca', 'Farai'];
const LAST_NAMES = ['Banda', 'Mwale', 'Phiri', 'Okonkwo', 'Mensah', 'Abdi', 'Nakamura', 'Silva', 'Chirwa', 'Adeyemi', 'Kamau', 'Ndlovu', 'Osei', 'Traoré', 'Hassan', 'Mutale', 'Diallo', 'Moyo', 'Achieng', 'Kone', 'Santos', 'Zulu', 'Ali', 'Gomes', 'Nkosi'];
const COUNTRIES = ['Malawi', 'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Zambia', 'Tanzania', 'Egypt', 'India', 'Brazil', 'United Kingdom', 'Zimbabwe', 'Uganda', 'Senegal', 'Pakistan', 'Philippines'];

/* ---------------------------------------------------------------------- main */

async function main() {
  console.log('Seeding RuMax Global Digital University…');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await clearDatabase();

  /* --- academic structure ------------------------------------------------ */

  const facultyIds = new Map<string, string>();
  const departmentIds = new Map<string, string>();

  for (const faculty of FACULTIES) {
    const record = await prisma.faculty.create({
      data: { slug: faculty.slug, name: faculty.name, description: faculty.description },
    });
    facultyIds.set(faculty.slug, record.id);

    for (const [slug, name] of faculty.departments) {
      const dept = await prisma.department.create({
        data: {
          slug,
          name,
          facultyId: record.id,
          description: `${name} within the ${faculty.name}, responsible for its curriculum, teaching quality and research output.`,
        },
      });
      departmentIds.set(slug, dept.id);
    }
  }
  console.log(`  ✓ ${FACULTIES.length} faculties, ${departmentIds.size} departments`);

  /* --- staff ------------------------------------------------------------- */

  const admin = await prisma.user.create({
    data: {
      email: 'admin@rumax.edu',
      passwordHash,
      firstName: 'Sofia',
      lastName: 'Marchetti',
      role: 'ADMIN',
      status: 'ACTIVE',
      staffNumber: 'STF00001',
      country: 'Italy',
      twoFactorEnabled: true,
      bio: 'Chief Technology Officer and system administrator for the RuMax learning platform.',
    },
  });

  const registrar = await prisma.user.create({
    data: {
      email: 'registrar@rumax.edu',
      passwordHash,
      firstName: 'Hassan',
      lastName: 'El-Amin',
      role: 'REGISTRAR',
      status: 'ACTIVE',
      staffNumber: 'STF00002',
      country: 'Egypt',
      bio: 'University Registrar. Custodian of admissions, student records, examinations and graduation.',
    },
  });

  await prisma.user.create({
    data: {
      email: 'finance@rumax.edu',
      passwordHash,
      firstName: 'Grace',
      lastName: 'Phiri',
      role: 'FINANCE',
      status: 'ACTIVE',
      staffNumber: 'STF00003',
      country: 'Malawi',
      bio: 'Finance officer responsible for tuition, scholarships and student billing.',
    },
  });

  const lecturerSeeds = [
    ['lecturer@rumax.edu', 'Amara', 'Okonkwo', 'artificial-intelligence', 'Professor of Machine Learning; leads the Institute of Data Science.'],
    ['d.mwangi@rumax.edu', 'Daniel', 'Mwangi', 'software-engineering', 'Senior Lecturer in Software Engineering; twenty years building payment systems.'],
    ['l.haddad@rumax.edu', 'Leila', 'Haddad', 'cybersecurity', 'Reader in Cybersecurity; former national CERT incident lead.'],
    ['t.banda@rumax.edu', 'Tendai', 'Banda', 'public-health', 'Associate Professor of Epidemiology; field experience across six outbreak responses.'],
    ['k.mensah@rumax.edu', 'Kwame', 'Mensah', 'management', 'Professor of Strategy; teaches on the Executive MBA.'],
    ['n.silva@rumax.edu', 'Nadia', 'Silva', 'renewable-energy', 'Senior Lecturer in Renewable Energy; designs mini-grids for rural electrification.'],
    ['e.chirwa@rumax.edu', 'Emmanuel', 'Chirwa', 'educational-technology', 'Lecturer in Learning Design; accessibility specialist.'],
    ['s.ali@rumax.edu', 'Sarah', 'Ali', 'public-law', 'Lecturer in International Law; practising human rights advocate.'],
  ] as const;

  const lecturers = [];
  for (const [index, [email, firstName, lastName, , bio]] of lecturerSeeds.entries()) {
    lecturers.push(
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'LECTURER',
          status: 'ACTIVE',
          staffNumber: `STF${String(index + 10).padStart(5, '0')}`,
          country: pick(COUNTRIES),
          bio,
        },
      }),
    );
  }

  // Deans are drawn from the professoriate.
  for (const [index, faculty] of FACULTIES.entries()) {
    await prisma.faculty.update({
      where: { slug: faculty.slug },
      data: { deanId: lecturers[index % lecturers.length].id },
    });
  }
  console.log(`  ✓ ${lecturers.length + 3} staff accounts`);

  /* --- programmes and courses -------------------------------------------- */

  const programIds = new Map<string, string>();
  for (const program of PROGRAMS) {
    const record = await prisma.program.create({
      data: {
        slug: slug(program.title),
        code: program.code,
        title: program.title,
        level: program.level,
        summary: program.summary,
        description: `${program.summary}\n\nTeaching is fully online. Each module runs on a weekly rhythm of recorded lectures, guided reading, a live seminar and a formative activity. Assessment combines continuous coursework with a final examination, and every piece of work receives written feedback within 24 hours of the marking deadline.\n\nThe programme is delivered by the ${
          FACULTIES.find((f) => f.slug === program.faculty)?.name
        } and is externally examined each year.`,
        durationMonths: program.months,
        totalCredits: program.credits,
        tuitionPerYear: program.tuition,
        entryRequirements: program.entry,
        careerOutcomes: program.careers,
        accreditation: 'Accredited by the National Council for Higher Education (ref HEA/UNI/0142)',
        featured: program.featured ?? false,
        facultyId: facultyIds.get(program.faculty)!,
        departmentId: departmentIds.get(program.department)!,
        mode: program.level === 'MOOC' || program.level === 'SHORT_COURSE' ? 'SELF_PACED' : 'ONLINE',
      },
    });
    programIds.set(program.code, record.id);
  }

  const courseIds = new Map<string, string>();
  for (const [index, course] of COURSES.entries()) {
    const record = await prisma.course.create({
      data: {
        slug: slug(course.title),
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        level: course.level,
        departmentId: departmentIds.get(course.department)!,
        lecturerId: lecturers[index % lecturers.length].id,
      },
    });
    courseIds.set(course.code, record.id);
  }

  // Prerequisite chains, then curriculum mapping.
  const prerequisites: [string, string][] = [
    ['CS201', 'CS101'],
    ['CS202', 'CS101'],
    ['CS210', 'CS201'],
    ['CS301', 'CS201'],
    ['CS310', 'CS210'],
    ['AI301', 'CS201'],
    ['AI401', 'AI301'],
    ['AI410', 'AI301'],
    ['SEC401', 'SEC301'],
    ['SEC410', 'SEC301'],
    ['DS410', 'DS301'],
    ['FIN301', 'FIN201'],
    ['PH302', 'PH301'],
  ];
  for (const [course, prereq] of prerequisites) {
    await prisma.coursePrerequisite.create({
      data: { courseId: courseIds.get(course)!, prerequisiteId: courseIds.get(prereq)! },
    });
  }

  const curriculum: Record<string, string[]> = {
    'BSC-CS': ['CS101', 'CS102', 'CS201', 'CS202', 'CS210', 'CS301', 'CS310', 'AI301'],
    'MSC-AI': ['AI301', 'AI401', 'AI410', 'AI420', 'DS301', 'DS410'],
    'MSC-CYB': ['SEC301', 'SEC401', 'SEC410', 'CS301', 'GOV301'],
    'PHD-DS': ['DS301', 'DS410', 'AI401'],
    MBA: ['BUS101', 'BUS301', 'BUS410', 'FIN301'],
    BCOM: ['BUS101', 'FIN201', 'FIN301', 'ECO201'],
    MPH: ['PH301', 'PH302', 'PH401'],
    'DIP-HSM': ['PH401', 'BUS101'],
    PGCE: ['EDU201', 'EDU301'],
    'CERT-EDTECH': ['EDU301'],
    'LLM-IHR': ['LAW301', 'GOV301'],
    'MSC-RE': ['ENG301', 'ENG310', 'ENV301'],
    'SC-CLIM': ['ENV301'],
    'MOOC-DL': ['EDU301'],
  };

  for (const [programCode, courseCodes] of Object.entries(curriculum)) {
    for (const [index, courseCode] of courseCodes.entries()) {
      await prisma.programCourse.create({
        data: {
          programId: programIds.get(programCode)!,
          courseId: courseIds.get(courseCode)!,
          year: Math.floor(index / 3) + 1,
          semester: (index % 2) + 1,
          isCore: index < 4,
        },
      });
    }
  }
  console.log(`  ✓ ${PROGRAMS.length} programmes, ${COURSES.length} courses`);

  /* --- course content ---------------------------------------------------- */

  const MODULE_TEMPLATES = [
    ['Foundations', ['Course orientation and how to succeed', 'Core concepts and vocabulary', 'Worked examples']],
    ['Core techniques', ['The principal method', 'Applying the method to real data', 'Common mistakes and how to avoid them']],
    ['Applications', ['Case study: an industry problem', 'Hands-on laboratory', 'Group discussion and peer review']],
    ['Assessment & synthesis', ['Revision and consolidation', 'Assessment briefing', 'Where this leads next']],
  ] as const;

  for (const [code, courseId] of courseIds.entries()) {
    const authored = AUTHORED_COURSES.get(code);

    // Courses with authored content get it verbatim. Everything else gets the template
    // above, which demonstrates the structure without pretending to teach anything.
    if (authored) {
      for (const [moduleIndex, unit] of authored.modules.entries()) {
        const module = await prisma.courseModule.create({
          data: { courseId, title: unit.title, summary: unit.summary, position: moduleIndex },
        });

        for (const [lessonIndex, lesson] of unit.lessons.entries()) {
          await prisma.lesson.create({
            data: {
              moduleId: module.id,
              title: lesson.title,
              type: lesson.type,
              durationMins: lesson.durationMins,
              position: lessonIndex,
              body: lesson.body,
              contentUrl:
                lesson.type === 'VIDEO'
                  ? `https://media.rumax.edu/${code.toLowerCase()}/u${moduleIndex + 1}-l${lessonIndex + 1}.mp4`
                  : null,
            },
          });
        }
      }
      continue;
    }

    for (const [moduleIndex, [moduleTitle, lessons]] of MODULE_TEMPLATES.entries()) {
      const module = await prisma.courseModule.create({
        data: {
          courseId,
          title: `Unit ${moduleIndex + 1}: ${moduleTitle}`,
          summary: `${moduleTitle} for ${code}. Around six hours of study including the live seminar.`,
          position: moduleIndex,
        },
      });

      for (const [lessonIndex, lessonTitle] of lessons.entries()) {
        const type = lessonIndex === 0 ? 'VIDEO' : lessonIndex === 1 ? 'READING' : pick(['PDF', 'LAB', 'SLIDES'] as const);
        await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: lessonTitle,
            type,
            durationMins: type === 'VIDEO' ? between(18, 55) : between(25, 90),
            position: lessonIndex,
            body:
              type === 'READING'
                ? `Reading notes for "${lessonTitle}". Work through the set text, then answer the three check questions at the end. Bring anything unclear to the live seminar.`
                : null,
            contentUrl: type === 'VIDEO' ? `https://media.rumax.edu/${code.toLowerCase()}/u${moduleIndex + 1}-l${lessonIndex + 1}.mp4` : null,
          },
        });
      }
    }
  }
  console.log('  ✓ course modules and lessons');

  /* --- academic terms ---------------------------------------------------- */

  const terms = await Promise.all([
    prisma.academicTerm.create({
      data: {
        name: '2024/25 Semester 1',
        academicYear: '2024/25',
        startDate: daysFromNow(-320),
        endDate: daysFromNow(-200),
        registrationOpens: daysFromNow(-350),
        registrationCloses: daysFromNow(-310),
        examStart: daysFromNow(-215),
        examEnd: daysFromNow(-202),
      },
    }),
    prisma.academicTerm.create({
      data: {
        name: '2024/25 Semester 2',
        academicYear: '2024/25',
        startDate: daysFromNow(-180),
        endDate: daysFromNow(-60),
        registrationOpens: daysFromNow(-200),
        registrationCloses: daysFromNow(-170),
        examStart: daysFromNow(-75),
        examEnd: daysFromNow(-62),
      },
    }),
    prisma.academicTerm.create({
      data: {
        name: '2025/26 Semester 1',
        academicYear: '2025/26',
        startDate: daysFromNow(-14),
        endDate: daysFromNow(105),
        registrationOpens: daysFromNow(-45),
        registrationCloses: daysFromNow(7),
        examStart: daysFromNow(90),
        examEnd: daysFromNow(103),
        isCurrent: true,
      },
    }),
  ]);
  const currentTerm = terms[2];

  /* --- students ---------------------------------------------------------- */

  const demoStudent = await prisma.user.create({
    data: {
      email: 'student@rumax.edu',
      passwordHash,
      firstName: 'Chikondi',
      lastName: 'Banda',
      role: 'STUDENT',
      status: 'ACTIVE',
      studentNumber: formatStudentNumber(2023, 1),
      programId: programIds.get('BSC-CS')!,
      yearOfStudy: 3,
      admittedAt: daysFromNow(-720),
      country: 'Malawi',
      city: 'Blantyre',
      timezone: 'Africa/Blantyre',
      phone: '+265 991 234 567',
      bio: 'Third-year computer science student. Interested in machine learning for agriculture.',
    },
  });

  const students = [demoStudent];
  for (let i = 2; i <= 60; i += 1) {
    const program = pick(PROGRAMS);
    const admissionYear = between(2022, 2025);
    students.push(
      await prisma.user.create({
        data: {
          email: `student${i}@rumax.edu`,
          passwordHash,
          firstName: pick(FIRST_NAMES),
          lastName: pick(LAST_NAMES),
          role: 'STUDENT',
          status: 'ACTIVE',
          studentNumber: formatStudentNumber(admissionYear, i),
          programId: programIds.get(program.code)!,
          yearOfStudy: between(1, Math.max(1, Math.floor(program.months / 12))),
          admittedAt: daysFromNow(-between(60, 1100)),
          country: pick(COUNTRIES),
        },
      }),
    );
  }

  // Graduates — these are the accounts whose certificates the public portal verifies.
  const graduates = [];
  for (let i = 1; i <= 12; i += 1) {
    const program = pick(PROGRAMS.filter((p) => p.level !== 'MOOC'));
    graduates.push(
      await prisma.user.create({
        data: {
          email: `alumni${i}@rumax.edu`,
          passwordHash,
          firstName: pick(FIRST_NAMES),
          lastName: pick(LAST_NAMES),
          role: 'ALUMNI',
          status: 'GRADUATED',
          studentNumber: formatStudentNumber(2020, 900 + i),
          programId: programIds.get(program.code)!,
          admittedAt: daysFromNow(-between(1400, 2200)),
          graduatedAt: daysFromNow(-between(30, 400)),
          country: pick(COUNTRIES),
        },
      }),
    );
  }
  console.log(`  ✓ ${students.length} students, ${graduates.length} alumni`);

  /* --- registrations, timetable, assessment ------------------------------ */

  const csCourses = ['CS201', 'CS202', 'CS210', 'AI301'];
  for (const code of csCourses) {
    await prisma.registration.create({
      data: {
        userId: demoStudent.id,
        courseId: courseIds.get(code)!,
        termId: currentTerm.id,
        status: 'APPROVED',
        approvedById: registrar.id,
        approvedAt: daysFromNow(-20),
      },
    });
  }

  for (const student of students.slice(1)) {
    const codes = [...COURSES].sort(() => rng() - 0.5).slice(0, between(3, 5));
    for (const course of codes) {
      await prisma.registration.create({
        data: {
          userId: student.id,
          courseId: courseIds.get(course.code)!,
          termId: currentTerm.id,
          status: chance(0.85) ? 'APPROVED' : 'PENDING',
          ...(chance(0.85) ? { approvedById: registrar.id, approvedAt: daysFromNow(-between(5, 30)) } : {}),
        },
      });
    }
  }

  for (const code of csCourses) {
    await prisma.timetableSlot.create({
      data: {
        courseId: courseIds.get(code)!,
        termId: currentTerm.id,
        dayOfWeek: between(1, 5),
        startTime: pick(['09:00', '11:00', '14:00', '16:00']),
        endTime: pick(['10:30', '12:30', '15:30', '17:30']),
        location: 'Virtual Classroom ' + between(1, 8),
      },
    });

    await prisma.liveSession.create({
      data: {
        courseId: courseIds.get(code)!,
        title: `${code} live seminar`,
        provider: pick(['ZOOM', 'TEAMS', 'GOOGLE_MEET'] as const),
        joinUrl: `https://meet.rumax.edu/${code.toLowerCase()}-seminar`,
        startsAt: daysFromNow(between(1, 6)),
        endsAt: daysFromNow(between(1, 6)),
      },
    });
  }

  // Assignments across every course; the demo student's are fully worked through.
  const assignmentTitles = [
    ['Portfolio task 1', 'Complete the exercises in the workbook and submit a single PDF with your reasoning shown for each question.'],
    ['Applied case study', 'Choose one of the three scenarios in the brief. In 1,500 words, analyse the problem, propose an approach, and justify it against the alternatives.'],
    ['Final project', 'Produce a working artefact plus a 2,000-word report covering design decisions, evaluation and limitations.'],
  ] as const;

  for (const [code, courseId] of courseIds.entries()) {
    const authoredWork = AUTHORED_COURSES.get(code)?.assignments;

    for (const [index, [title, instructions]] of assignmentTitles.entries()) {
      // Authored courses supply three assignments in the same order — marked, open and
      // future — so the grading below continues to apply unchanged.
      const brief = authoredWork?.[index];

      const assignment = await prisma.assignment.create({
        data: {
          courseId,
          title: brief ? `${code} — ${brief.title}` : `${code} — ${title}`,
          instructions: brief?.instructions ?? instructions,
          maxScore: brief?.maxScore ?? 100,
          weight: brief?.weight ?? (index === 2 ? 0.3 : 0.15),
          dueAt: daysFromNow(index === 0 ? -12 : index === 1 ? 9 : 45),
          allowLate: brief?.allowLate ?? index !== 2,
        },
      });

      if (csCourses.includes(code)) {
        // Past assignment marked; current one still open.
        if (index === 0) {
          const score = between(62, 88);
          await prisma.submission.create({
            data: {
              assignmentId: assignment.id,
              userId: demoStudent.id,
              content: 'Submitted via the student portal. Working shown for all six questions.',
              status: 'GRADED',
              submittedAt: daysFromNow(-13),
              score,
              similarity: between(2, 11),
              feedback:
                'Solid work. Your reasoning in questions 3 and 5 is clear and well justified. Question 4 conflates two different definitions — review the unit 2 notes. Presentation is excellent.',
              gradedById: courseIds.get(code) ? lecturers[0].id : null,
              gradedAt: daysFromNow(-9),
            },
          });
        }
      }
    }
  }

  // Quizzes with a real question bank on the demo student's courses.
  for (const code of csCourses) {
    const authoredQuiz = AUTHORED_COURSES.get(code)?.quiz;

    const quiz = await prisma.quiz.create({
      data: {
        courseId: courseIds.get(code)!,
        title: authoredQuiz?.title ?? `${code} Unit 1–2 quiz`,
        description:
          authoredQuiz?.description ??
          'Ten questions covering the first two units. Two attempts, best mark counts.',
        type: 'QUIZ',
        durationMins: authoredQuiz?.durationMins ?? 30,
        maxAttempts: 2,
        weight: 0.1,
        questionsToServe: authoredQuiz?.questionsToServe ?? 5,
        published: true,
        opensAt: daysFromNow(-10),
        closesAt: daysFromNow(20),
      },
    });

    const genericBank = [
      ['Which complexity class describes binary search on a sorted array?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1, 'Each comparison halves the remaining search space.'],
      ['A hash table degrades to which complexity when every key collides?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'All entries end up in one bucket, so lookup becomes a linear scan.'],
      ['Normalisation to third normal form primarily removes which problem?', ['Slow joins', 'Transitive dependencies', 'Index bloat', 'Deadlocks'], 1, '3NF eliminates non-key attributes depending on other non-key attributes.'],
      ['Which HTTP status indicates the request was understood but refused?', ['401', '403', '404', '409'], 1, '403 Forbidden: authenticated but not authorised.'],
      ['In supervised learning, a model that fits training noise is said to be…', ['Underfitting', 'Regularised', 'Overfitting', 'Converged'], 2, 'Overfitting: low training error, high generalisation error.'],
      ['Which is NOT a property of a good hash function for hash tables?', ['Deterministic', 'Uniform distribution', 'Reversible', 'Fast to compute'], 2, 'Reversibility is irrelevant here and undesirable for cryptographic use.'],
      ['A database transaction that is "isolated" guarantees…', ['It never fails', 'Concurrent transactions do not see intermediate state', 'It is written to disk', 'It cannot be rolled back'], 1, 'Isolation is the I in ACID.'],
      ['Cross-validation is used primarily to…', ['Speed up training', 'Estimate generalisation performance', 'Reduce dataset size', 'Balance classes'], 1, 'It gives a less optimistic estimate than a single train/test split.'],
      ['Which data structure gives O(1) amortised append and O(1) indexed access?', ['Linked list', 'Dynamic array', 'Binary search tree', 'Heap'], 1, 'Dynamic arrays double capacity, amortising the copy cost.'],
      ['REST treats a URL as…', ['A remote procedure', 'A resource identifier', 'A session token', 'A query plan'], 1, 'Resources are nouns; verbs come from the HTTP method.'],
    ] as const;

    const bank: readonly {
      prompt: string;
      options: readonly string[];
      correct: number;
      explanation: string;
    }[] =
      authoredQuiz?.questions ??
      genericBank.map(([prompt, options, correct, explanation]) => ({
        prompt,
        options,
        correct,
        explanation,
      }));

    for (const [position, { prompt, options, correct, explanation }] of bank.entries()) {
      const question = await prisma.question.create({
        data: { quizId: quiz.id, prompt, type: 'MULTIPLE_CHOICE', points: 1, position, explanation },
      });
      for (const [optionIndex, text] of options.entries()) {
        await prisma.questionOption.create({
          data: { questionId: question.id, text, isCorrect: optionIndex === correct, position: optionIndex },
        });
      }
    }

    await prisma.quiz.create({
      data: {
        courseId: courseIds.get(code)!,
        title: `${code} final examination`,
        description: 'Proctored closed-book examination. Two hours. Counts for 40% of the course mark.',
        type: 'FINAL_EXAM',
        durationMins: 120,
        maxAttempts: 1,
        weight: 0.4,
        proctored: true,
        lockdownBrowser: true,
        published: false,
        opensAt: currentTerm.examStart,
        closesAt: currentTerm.examEnd,
      },
    });
  }
  console.log('  ✓ registrations, timetable, assignments and quizzes');

  /* --- historical grades ------------------------------------------------- */

  const historicalCodes = ['CS101', 'CS102', 'BUS101', 'FIN201'];
  for (const [index, code] of historicalCodes.entries()) {
    const score = [78, 71, 84, 66][index];
    await prisma.grade.create({
      data: {
        userId: demoStudent.id,
        courseId: courseIds.get(code)!,
        termId: terms[index % 2].id,
        score,
        letter: letterFor(score),
        gradePoint: gradePointFor(score),
        credits: COURSES.find((c) => c.code === code)!.credits,
        published: true,
        publishedAt: daysFromNow(-between(70, 200)),
      },
    });
  }

  for (const student of students.slice(1, 40)) {
    for (const course of [...COURSES].sort(() => rng() - 0.5).slice(0, between(2, 4))) {
      const score = between(38, 95);
      await prisma.grade
        .create({
          data: {
            userId: student.id,
            courseId: courseIds.get(course.code)!,
            termId: pick(terms.slice(0, 2)).id,
            score,
            letter: letterFor(score),
            gradePoint: gradePointFor(score),
            credits: course.credits,
            published: true,
            publishedAt: daysFromNow(-between(60, 210)),
          },
        })
        // Skip the occasional duplicate (same student, course and term) the shuffle produces.
        .catch(() => undefined);
    }
  }

  /* --- attendance -------------------------------------------------------- */

  for (const code of csCourses) {
    for (let week = 1; week <= 6; week += 1) {
      await prisma.attendanceRecord.create({
        data: {
          userId: demoStudent.id,
          courseId: courseIds.get(code)!,
          date: daysFromNow(-week * 7),
          status: chance(0.85) ? 'PRESENT' : pick(['LATE', 'EXCUSED', 'ABSENT'] as const),
        },
      });
    }
  }

  /* --- admissions -------------------------------------------------------- */

  const applicant = await prisma.user.create({
    data: {
      email: 'applicant@rumax.edu',
      passwordHash,
      firstName: 'Yusuf',
      lastName: 'Diallo',
      role: 'APPLICANT',
      status: 'PENDING',
      country: 'Senegal',
    },
  });

  await prisma.application.create({
    data: {
      reference: formatApplicationReference(1),
      userId: applicant.id,
      programId: programIds.get('MSC-AI')!,
      status: 'UNDER_REVIEW',
      firstName: 'Yusuf',
      lastName: 'Diallo',
      email: 'applicant@rumax.edu',
      phone: '+221 77 123 4567',
      nationality: 'Senegalese',
      country: 'Senegal',
      highestQualification: 'BSc Computer Science',
      institution: 'Université Cheikh Anta Diop',
      graduationYear: 2023,
      gpa: '3.6 / 4.0',
      intakeTerm: '2025/26 Semester 1',
      fundingSource: 'Self-funded with scholarship application',
      personalStatement:
        'I want to build language technology that works for Wolof and other West African languages. My final-year project trained a small speech recogniser on 40 hours of community-recorded audio; the MSc would give me the depth in modelling and evaluation I am missing.',
      applicationFeePaid: true,
      submittedAt: daysFromNow(-9),
      documents: {
        create: [
          { type: 'PASSPORT_PHOTO', fileName: 'photo.jpg', fileUrl: '/uploads/demo/photo.jpg', mimeType: 'image/jpeg', fileSize: 184_320, verified: true },
          { type: 'PASSPORT', fileName: 'passport.pdf', fileUrl: '/uploads/demo/passport.pdf', fileSize: 512_000, verified: true },
          { type: 'ACADEMIC_CERTIFICATE', fileName: 'degree-certificate.pdf', fileUrl: '/uploads/demo/degree.pdf', fileSize: 743_000 },
          { type: 'TRANSCRIPT', fileName: 'transcript.pdf', fileUrl: '/uploads/demo/transcript.pdf', fileSize: 655_000 },
          { type: 'CV', fileName: 'cv.pdf', fileUrl: '/uploads/demo/cv.pdf', fileSize: 210_000 },
        ],
      },
    },
  });

  const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'OFFER_MADE', 'ACCEPTED', 'REJECTED', 'ENROLLED'] as const;
  for (let i = 2; i <= 45; i += 1) {
    const program = pick(PROGRAMS);
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    await prisma.application.create({
      data: {
        reference: formatApplicationReference(i),
        programId: programIds.get(program.code)!,
        status: pick(statuses),
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
        country: pick(COUNTRIES),
        nationality: pick(COUNTRIES),
        highestQualification: pick(['Secondary certificate', 'Diploma', 'BSc', 'BA', 'MSc']),
        institution: 'Prior institution',
        graduationYear: between(2015, 2025),
        intakeTerm: currentTerm.name,
        applicationFeePaid: chance(0.8),
        submittedAt: daysFromNow(-between(1, 90)),
        personalStatement: 'Submitted with the application form.',
      },
    });
  }
  console.log('  ✓ admissions pipeline');

  /* --- finance ----------------------------------------------------------- */

  let invoiceSeq = 1;
  const paidInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: formatInvoiceNumber(invoiceSeq++),
      userId: demoStudent.id,
      termId: terms[1].id,
      description: 'Tuition — 2024/25 Semester 2',
      amount: 1600,
      amountPaid: 1600,
      status: 'PAID',
      dueDate: daysFromNow(-150),
      items: [
        { label: 'Tuition fee', amount: 1500 },
        { label: 'Technology and library access', amount: 100 },
      ],
    },
  });

  await prisma.payment.create({
    data: {
      reference: 'PAY-2025-000001',
      invoiceId: paidInvoice.id,
      userId: demoStudent.id,
      amount: 1600,
      provider: 'STRIPE',
      status: 'SUCCEEDED',
      providerRef: 'pi_demo_3Nk2L8',
      paidAt: daysFromNow(-152),
      receiptUrl: '/portal/receipts/PAY-2025-000001',
    },
  });

  const openInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: formatInvoiceNumber(invoiceSeq++),
      userId: demoStudent.id,
      termId: currentTerm.id,
      description: 'Tuition — 2025/26 Semester 1',
      amount: 1600,
      amountPaid: 600,
      status: 'PARTIALLY_PAID',
      dueDate: daysFromNow(21),
      items: [
        { label: 'Tuition fee', amount: 1500 },
        { label: 'Examination fee', amount: 100 },
      ],
    },
  });

  await prisma.payment.create({
    data: {
      reference: 'PAY-2025-000002',
      invoiceId: openInvoice.id,
      userId: demoStudent.id,
      amount: 600,
      provider: 'AIRTEL_MONEY',
      status: 'SUCCEEDED',
      providerRef: 'AM-88213904',
      paidAt: daysFromNow(-11),
      receiptUrl: '/portal/receipts/PAY-2025-000002',
    },
  });

  for (const student of students.slice(1, 45)) {
    const amount = between(600, 2600);
    const paid = chance(0.6) ? amount : chance(0.5) ? Math.round(amount / 2) : 0;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: formatInvoiceNumber(invoiceSeq++),
        userId: student.id,
        termId: currentTerm.id,
        description: `Tuition — ${currentTerm.name}`,
        amount,
        amountPaid: paid,
        status: paid === amount ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : chance(0.3) ? 'OVERDUE' : 'ISSUED',
        dueDate: daysFromNow(between(-30, 40)),
      },
    });

    if (paid > 0) {
      await prisma.payment.create({
        data: {
          reference: `PAY-2025-${String(invoiceSeq).padStart(6, '0')}`,
          invoiceId: invoice.id,
          userId: student.id,
          amount: paid,
          provider: pick(['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK', 'AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER'] as const),
          status: 'SUCCEEDED',
          paidAt: daysFromNow(-between(1, 60)),
        },
      });
    }
  }
  console.log('  ✓ invoices and payments');

  /* --- certificates ------------------------------------------------------ */

  for (const graduate of graduates) {
    const program = PROGRAMS.find((p) => programIds.get(p.code) === graduate.programId)!;
    const cgpa = 2 + rng() * 2;
    const serial = generateSerial(new Date(graduate.graduatedAt!).getFullYear());
    const payload = {
      serial,
      studentName: `${graduate.firstName} ${graduate.lastName}`,
      studentNumber: graduate.studentNumber!,
      programTitle: program.title,
      certificateType: 'DEGREE',
      classification: classify(cgpa),
      issuedAt: graduate.graduatedAt!,
    };

    await prisma.certificate.create({
      data: {
        serial,
        userId: graduate.id,
        programId: graduate.programId,
        type: 'DEGREE',
        title: program.title,
        classification: classify(cgpa),
        issuedAt: graduate.graduatedAt!,
        documentHash: hashCertificate(payload),
        blockchainTx: `0x${Array.from({ length: 40 }, () => '0123456789abcdef'[between(0, 15)]).join('')}`,
      },
    });
  }

  // A known-good serial for documentation and tests.
  const showcaseSerial = 'RX-2025-DEMO-0001';
  const showcasePayload = {
    serial: showcaseSerial,
    studentName: 'Chikondi Banda',
    studentNumber: demoStudent.studentNumber!,
    programTitle: 'Certificate in Educational Technology',
    certificateType: 'CERTIFICATE',
    classification: 'Distinction',
    issuedAt: daysFromNow(-40),
  };
  await prisma.certificate.create({
    data: {
      serial: showcaseSerial,
      userId: demoStudent.id,
      programId: programIds.get('CERT-EDTECH')!,
      type: 'CERTIFICATE',
      title: 'Certificate in Educational Technology',
      classification: 'Distinction',
      issuedAt: daysFromNow(-40),
      documentHash: hashCertificate(showcasePayload),
      blockchainTx: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    },
  });
  console.log(`  ✓ ${graduates.length + 1} certificates (try serial ${showcaseSerial} at /verify)`);

  /* --- library, research, community, content ----------------------------- */

  const libraryItems = [
    ['Introduction to Algorithms', ['Cormen', 'Leiserson', 'Rivest', 'Stein'], 'EBOOK', ['Computing', 'Algorithms']],
    ['Pattern Recognition and Machine Learning', ['Bishop'], 'EBOOK', ['Computing', 'Machine learning']],
    ['Modern Epidemiology', ['Rothman', 'Greenland'], 'BOOK', ['Health', 'Epidemiology']],
    ['Journal of African Data Science, Vol. 12', ['Editorial board'], 'JOURNAL', ['Research', 'Data science']],
    ['Mini-grid design in rural Malawi: a field study', ['Silva', 'Banda'], 'RESEARCH_PAPER', ['Energy', 'Development']],
    ['CS201 Past Examination Papers 2020–2025', ['Examinations Office'], 'PAST_PAPER', ['Computing', 'Revision']],
    ['Human Rights Quarterly, Autumn Issue', ['Editorial board'], 'MAGAZINE', ['Law']],
    ['Statistics Without Tears', ['Rowntree'], 'AUDIOBOOK', ['Statistics', 'Foundations']],
    ['Teaching Online: An Evidence Review', ['Chirwa'], 'EBOOK', ['Education']],
    ['Corporate Finance in Emerging Markets', ['Mensah'], 'BOOK', ['Business', 'Finance']],
  ] as const;

  for (const [title, authors, type, subjects] of libraryItems) {
    await prisma.libraryItem.create({
      data: {
        slug: slug(title),
        title,
        authors: [...authors],
        type,
        subjects: [...subjects],
        year: between(2015, 2025),
        publisher: 'RuMax University Press',
        abstract: `${title} — held in the RuMax Digital Library and available to all registered students and staff.`,
        copies: between(1, 40),
        available: between(1, 40),
        fileUrl: `/library/files/${slug(title)}.pdf`,
      },
    });
  }

  const researchProjects = [
    ['Low-resource speech recognition for Southern African languages', 'Building open speech datasets and models for Chichewa, Tumbuka and Yao.', 'Gates Foundation', 480_000],
    ['Climate-resilient water systems in the Shire Valley', 'Sensor networks and community governance models for drought resilience.', 'UK Research and Innovation', 620_000],
    ['Digital identity and exclusion', 'Who is left out when public services move to digital identity, and what mitigates it.', 'Open Society Foundations', 210_000],
    ['AI-assisted formative feedback at scale', 'Does automated draft feedback improve outcomes without displacing teaching?', 'Internal research fund', 95_000],
  ] as const;

  const projectIds: string[] = [];
  for (const [index, [title, abstract, funder, amount]] of researchProjects.entries()) {
    const project = await prisma.researchProject.create({
      data: {
        slug: slug(title),
        title,
        abstract,
        fundingBody: funder,
        fundingAmount: amount,
        startDate: daysFromNow(-between(200, 900)),
        endDate: daysFromNow(between(100, 700)),
        leadId: lecturers[index % lecturers.length].id,
        keywords: title.toLowerCase().split(' ').filter((w) => w.length > 5).slice(0, 4),
      },
    });
    projectIds.push(project.id);
  }

  for (let i = 0; i < 18; i += 1) {
    await prisma.publication.create({
      data: {
        title: pick([
          'Evaluating transfer learning for low-resource ASR',
          'Community governance of rural mini-grids: a five-year review',
          'Measurement error in digital-identity enrolment data',
          'Formative feedback latency and student outcomes',
          'Cost-effectiveness of district-level supply chain reform',
          'Threat modelling for university learning platforms',
        ]),
        journal: pick(['Journal of African Data Science', 'Energy for Development', 'Global Health Systems', 'Computers & Education']),
        year: between(2020, 2025),
        doi: `10.5281/rumax.${between(100000, 999999)}`,
        citations: between(0, 180),
        authorId: pick(lecturers).id,
        projectId: pick(projectIds),
        abstract: 'Open-access publication deposited in the RuMax research repository.',
      },
    });
  }

  const posts = [
    ['NEWS', 'RuMax passes 148,000 enrolled students', 'Enrolment grew 18% year on year, with the strongest growth in professional certificates.', ['Enrolment']],
    ['NEWS', 'New MSc in Renewable Energy Systems opens for January', 'The programme includes simulation labs and a capstone mini-grid design project.', ['Programmes', 'Energy']],
    ['NEWS', 'Platform availability hit 99.99% for the third consecutive year', 'Independent monitoring confirms the university met its service commitment.', ['Technology']],
    ['NEWS', 'Graduate employment reaches 94% within six months', 'The annual outcomes survey covers 12,400 graduates across all faculties.', ['Outcomes']],
    ['BLOG', 'What I learned studying an MSc while working nights', 'A student writes about time-blocking, asynchronous study and asking for help early.', ['Student voice']],
    ['BLOG', 'How we mark 40,000 assignments a term without slipping past 24 hours', 'The examinations office explains the marking pipeline.', ['Behind the scenes']],
    ['BLOG', 'Designing for a 3G connection', 'Why every RuMax course must work on a slow phone, and how we test it.', ['Accessibility', 'Engineering']],
    ['PRESS', 'RuMax joins the Global Online Universities Consortium', 'Membership enables credit transfer across eleven partner institutions.', ['Partnerships']],
  ] as const;

  for (const [index, [category, title, excerpt, tags]] of posts.entries()) {
    await prisma.post.create({
      data: {
        slug: slug(title),
        title,
        excerpt,
        category,
        tags: [...tags],
        publishedAt: daysFromNow(-index * 6 - 1),
        body: `${excerpt}\n\n## Background\n\nRuMax Global Digital University publishes its operational and academic performance openly, including the figures that fall short of target. This report forms part of that commitment.\n\n## Detail\n\nFull methodology, definitions and the underlying data tables are available from the Office of Institutional Research on request. Where figures are estimates, they are labelled as such.\n\n## What happens next\n\nThe University Senate reviews these figures each quarter and publishes any resulting changes to policy in the academic regulations.`,
      },
    });
  }

  const events = [
    ['Open day: meet the Faculty of Computing', 'A live session with lecturers and current students. Bring your questions about entry requirements and study load.', 12],
    ['Graduation ceremony — Class of 2025', 'Streamed live with regional watch parties in eight cities.', 34],
    ['Research seminar: AI for African languages', 'Dr Amara Okonkwo presents findings from the low-resource speech project.', 5],
    ['Scholarship application workshop', 'How to write a competitive funding application, with worked examples.', 19],
  ] as const;

  for (const [title, excerpt, inDays] of events) {
    await prisma.post.create({
      data: {
        slug: slug(title),
        title,
        excerpt,
        category: 'EVENT',
        tags: ['Event'],
        eventStart: daysFromNow(inDays),
        eventEnd: daysFromNow(inDays),
        location: 'Online — link sent on registration',
        body: `${excerpt}\n\nThe session is recorded and captioned. Register with your email address and we will send the joining link 24 hours beforehand.`,
      },
    });
  }

  const scholarships = [
    ['Vice-Chancellor’s Excellence Scholarship', 'Full tuition for outstanding applicants across all faculties.', 100, 15],
    ['Women in STEM Scholarship', 'Half tuition for women entering computing, engineering or data science programmes.', 50, 40],
    ['Refugee and Displaced Students Fund', 'Full tuition plus a device and connectivity stipend.', 100, 25],
    ['Malawi Access Bursary', 'Means-tested support for students resident in Malawi.', 60, 120],
    ['Alumni Legacy Award', 'Funded by graduate donations, open to continuing students in financial hardship.', 40, 60],
  ] as const;

  for (const [name, description, coverage, days] of scholarships) {
    await prisma.scholarship.create({
      data: {
        slug: slug(name),
        name,
        description: `${description} Applications are assessed on academic merit and, where relevant, financial need. Recipients are notified within four weeks of the closing date.`,
        coveragePct: coverage,
        deadline: daysFromNow(days),
        slots: between(5, 60),
        eligibility: [
          'Hold or expect to hold the entry qualification for your chosen programme',
          'Submit a 500-word statement of need or merit',
          'Provide one academic or professional reference',
        ],
      },
    });
  }

  const partners = [
    ['African Virtual University', 'Academic', 'Kenya'],
    ['Open University of Catalonia', 'Academic', 'Spain'],
    ['World Health Organization — AFRO', 'Institutional', 'Congo'],
    ['Microsoft Philanthropies', 'Industry', 'United States'],
    ['Airtel Africa', 'Industry', 'Nigeria'],
    ['Malawi Ministry of Education', 'Government', 'Malawi'],
    ['Coursera for Campus', 'Platform', 'United States'],
    ['ORCID', 'Research infrastructure', 'United States'],
  ] as const;

  for (const [name, category, country] of partners) {
    await prisma.partner.create({
      data: { name, category, country, summary: `${name} partners with RuMax on ${category.toLowerCase()} initiatives.` },
    });
  }

  const faqs = [
    ['Admissions', 'Is a RuMax degree recognised by employers?', 'Yes. RuMax is accredited by the National Council for Higher Education (ref HEA/UNI/0142) and our awards carry the same standing as any accredited university degree. Every certificate can be verified instantly at /verify.'],
    ['Admissions', 'Can I apply without formal qualifications?', 'For certificates, short courses and MOOCs, yes — these are open entry. Degree programmes require the qualifications listed on each programme page, though we consider relevant professional experience through our recognition of prior learning route.'],
    ['Admissions', 'When can I start?', 'There are two main intakes, in January and September, plus rolling enrolment for self-paced short courses. Application deadlines are on each programme page.'],
    ['Study', 'How many hours a week will I need?', 'A 15-credit module is designed for about 10 hours a week over a 12-week term. Most part-time students take two modules a term.'],
    ['Study', 'Do I have to attend live classes?', 'Live seminars run twice a week and are recorded. Attendance is expected but we understand time zones — the recordings and the discussion forum carry the same material.'],
    ['Study', 'What if my internet connection is poor?', 'Every lesson can be downloaded for offline study, video is available in a low-bandwidth audio-plus-slides format, and the mobile app syncs when you next get a connection.'],
    ['Fees', 'Can I pay in instalments?', 'Yes. Tuition can be split across three instalments per term at no extra cost. Set this up under Finance → Payment plans in your student portal.'],
    ['Fees', 'Which payment methods do you accept?', 'Card (Visa and MasterCard) via Stripe, PayPal, Flutterwave, Paystack, bank transfer, and mobile money including Airtel Money and TNM Mpamba.'],
    ['Fees', 'Are there refunds if I withdraw?', 'Full refund within 14 days of a term starting, 50% up to week four, none thereafter. The full policy is in the terms of use.'],
    ['Support', 'What support is available if I fall behind?', 'Contact your academic advisor through the portal. We can arrange extensions, a reduced load, or an interruption of studies. Talk to us early — almost everything is fixable before a deadline passes.'],
    ['Technical', 'What device do I need?', 'Any device with a browser. The platform is tested on phones from 2018 onwards and works on connections as slow as 3G.'],
    ['Technical', 'Is my data safe?', 'Data is encrypted in transit and at rest, we are GDPR and FERPA aligned, and you can export or request deletion of your personal data from your profile at any time.'],
  ] as const;

  for (const [index, [category, question, answer]] of faqs.entries()) {
    await prisma.faqEntry.create({ data: { category, question, answer, position: index } });
  }

  const jobs = [
    ['Graduate Software Engineer', 'Airtel Africa', 'Lilongwe, Malawi', 'GRADUATE'],
    ['Data Analyst Internship', 'Ministry of Health', 'Remote', 'INTERNSHIP'],
    ['Junior Security Analyst', 'Standard Bank', 'Johannesburg, South Africa', 'GRADUATE'],
    ['Learning Designer', 'African Virtual University', 'Remote', 'FULL_TIME'],
    ['Renewable Energy Field Engineer', 'SolarWorks', 'Blantyre, Malawi', 'FULL_TIME'],
    ['Research Assistant — Epidemiology', 'RuMax Institute of Health Systems', 'Remote', 'CONTRACT'],
  ] as const;

  for (const [title, employer, location, type] of jobs) {
    await prisma.jobPosting.create({
      data: {
        slug: slug(`${title}-${employer}`),
        title,
        employer,
        location,
        type,
        remote: location === 'Remote',
        closesAt: daysFromNow(between(10, 70)),
        description: `${employer} is recruiting a ${title.toLowerCase()}. This role is open to RuMax students and graduates and is advertised through the RuMax Career Centre.`,
        requirements: [
          'Relevant degree or final-year student status',
          'Evidence of practical project work',
          'Right to work in the advertised location',
        ],
        salaryRange: chance(0.6) ? 'Competitive, disclosed at interview' : null,
      },
    });
  }

  /* --- announcements, forums, messages ----------------------------------- */

  const announcements = [
    ['Registration for 2025/26 Semester 1 closes on Friday', 'Late registration requires Dean’s approval and attracts a fee. Register through the portal under Course Registration.', 'STUDENTS', true],
    ['Examination timetable published', 'The provisional timetable for the January examination period is now available. Clashes must be reported within seven days.', 'STUDENTS', false],
    ['Marking deadline reminder', 'All Semester 1 coursework must be marked and returned within 24 hours of the marking window opening.', 'LECTURERS', false],
    ['Scheduled maintenance on Sunday 02:00–04:00 UTC', 'The platform will be read-only during this window. Assessment deadlines have been adjusted accordingly.', 'ALL', false],
    ['Alumni mentoring programme opens for applications', 'Graduates can now register to mentor a current student for the coming academic year.', 'ALUMNI', false],
  ] as const;

  for (const [title, body, audience, pinned] of announcements) {
    await prisma.announcement.create({
      data: { title, body, audience, pinned, authorId: registrar.id, publishedAt: daysFromNow(-between(1, 20)) },
    });
  }

  const thread = await prisma.forumThread.create({
    data: {
      courseId: courseIds.get('CS201')!,
      authorId: demoStudent.id,
      title: 'Why is quicksort O(n²) in the worst case if it is usually so fast?',
      body: 'I understand the average case is O(n log n) but I cannot see how the worst case arises in practice. Is it only with already-sorted input?',
      views: 184,
    },
  });

  await prisma.forumPost.createMany({
    data: [
      {
        threadId: thread.id,
        authorId: lecturers[1].id,
        body: 'Good question. The worst case is about pivot choice, not input order as such. If your pivot consistently splits the array into 1 and n−1 elements, you get n levels of recursion each doing O(n) work. Already-sorted input triggers exactly that when you always pick the first element as pivot — which is why practical implementations pick a random or median-of-three pivot.',
        isAnswer: true,
        upvotes: 23,
      },
      {
        threadId: thread.id,
        authorId: students[3].id,
        body: 'Worth adding: introsort (what most standard libraries actually use) switches to heapsort once recursion depth exceeds 2·log n, so the O(n²) case is bounded away in practice.',
        upvotes: 11,
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        senderId: lecturers[1].id,
        recipientId: demoStudent.id,
        subject: 'Feedback on your CS201 portfolio task',
        body: 'Chikondi — your portfolio task is marked and returned. The reasoning in Q3 and Q5 is strong. Do have another look at the definition of amortised complexity before the exam. Office hours are Thursday 15:00 UTC if you would like to talk it through.',
        readAt: daysFromNow(-8),
      },
      {
        senderId: registrar.id,
        recipientId: demoStudent.id,
        subject: 'Course registration approved',
        body: 'Your registration for CS201, CS202, CS210 and AI301 for 2025/26 Semester 1 has been approved. Your timetable is available in the portal.',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: demoStudent.id, title: 'Assignment due in 9 days', body: 'CS202 — Applied case study closes at 23:59 UTC.', link: '/portal/assignments', category: 'assignment' },
      { userId: demoStudent.id, title: 'Grade published', body: 'Your CS201 portfolio task has been marked.', link: '/portal/grades', category: 'grade' },
      { userId: demoStudent.id, title: 'Balance outstanding', body: 'US$1,000 remains on invoice INV-2025-000002, due in 21 days.', link: '/portal/finance', category: 'finance' },
    ],
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'site.maintenanceMode', value: false },
      { key: 'admissions.openIntake', value: '2025/26 Semester 1' },
      { key: 'finance.lateFeePercent', value: 5 },
      { key: 'features.aiTutor', value: true },
      { key: 'features.proctoring', value: true },
    ],
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: 'system.seed', entityType: 'System', metadata: { note: 'Demonstration data loaded' } },
  });

  console.log('\nSeed complete.\n');
  if (PASSWORD_WAS_GENERATED) {
    // Printed once and never stored in plaintext — only the bcrypt hash reaches the
    // database, so this line is the only chance to record it.
    console.log('  SEED_PASSWORD was not set. A random password was generated for this run:');
    console.log(`\n      ${PASSWORD}\n`);
    console.log('  Copy it now — it is not recoverable. Set SEED_PASSWORD to choose your own.');
  } else {
    console.log('  Demo accounts — password for all:', PASSWORD);
  }
  console.log('    admin@rumax.edu      Administrator (full ERP)');
  console.log('    registrar@rumax.edu  Registrar (admissions, records)');
  console.log('    finance@rumax.edu    Finance officer');
  console.log('    lecturer@rumax.edu   Lecturer (course builder, gradebook)');
  console.log('    student@rumax.edu    Student (LMS, grades, finance)');
  console.log('    applicant@rumax.edu  Applicant (application tracking)');
  console.log(`\n  Verify a certificate at /verify using serial ${showcaseSerial}\n`);
}

/** Order matters: children before parents, since not every relation cascades. */
async function clearDatabase() {
  await prisma.$transaction([
    prisma.certificateVerification.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.answer.deleteMany(),
    prisma.quizAttempt.deleteMany(),
    prisma.questionOption.deleteMany(),
    prisma.question.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.courseModule.deleteMany(),
    prisma.forumPost.deleteMany(),
    prisma.forumThread.deleteMany(),
    prisma.attendanceRecord.deleteMany(),
    prisma.liveSession.deleteMany(),
    prisma.timetableSlot.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.registration.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.applicationDocument.deleteMany(),
    prisma.application.deleteMany(),
    prisma.libraryLoan.deleteMany(),
    prisma.libraryItem.deleteMany(),
    prisma.publication.deleteMany(),
    prisma.researchProject.deleteMany(),
    prisma.message.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.tutorConversation.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.session.deleteMany(),
    prisma.coursePrerequisite.deleteMany(),
    prisma.programCourse.deleteMany(),
    prisma.course.deleteMany(),
    prisma.program.deleteMany(),
    prisma.department.deleteMany(),
    prisma.faculty.deleteMany(),
    prisma.user.deleteMany(),
    prisma.academicTerm.deleteMany(),
    prisma.post.deleteMany(),
    prisma.scholarship.deleteMany(),
    prisma.partner.deleteMany(),
    prisma.faqEntry.deleteMany(),
    prisma.jobPosting.deleteMany(),
    prisma.contactEnquiry.deleteMany(),
    prisma.systemSetting.deleteMany(),
  ]);
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
