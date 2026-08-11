/**
 * University-wide constants: identity, navigation and the institutional narrative that
 * the marketing pages render. Editing this file changes the public site — the admin CMS
 * writes the same fields to `SystemSetting` for values that must change without a deploy.
 */

export const SITE = {
  name: 'RuMax Global Digital University',
  shortName: 'RuMax',
  tagline: 'Education Without Borders.',
  description:
    'RuMax Global Digital University delivers accredited undergraduate, masters, doctoral and professional programmes entirely online — to learners in 140 countries.',
  founded: 1998,
  motto: 'Scientia sine finibus',
  mottoTranslation: 'Knowledge without frontiers',
  email: 'admissions@rumax.edu',
  supportEmail: 'support@rumax.edu',
  phone: '+265 1 700 400',
  address: 'Digital Campus House, Chilomoni Ring Road, Blantyre, Malawi',
  registrationNumber: 'HEA/UNI/0142',
  social: {
    linkedin: 'https://www.linkedin.com/school/rumax-university',
    x: 'https://x.com/rumaxuniversity',
    youtube: 'https://youtube.com/@rumaxuniversity',
    instagram: 'https://instagram.com/rumaxuniversity',
    facebook: 'https://facebook.com/rumaxuniversity',
  },
} as const;

export const STATS = [
  { label: 'Students enrolled', value: 148_320, suffix: '+' },
  { label: 'Countries represented', value: 140, suffix: '' },
  { label: 'Programmes offered', value: 212, suffix: '' },
  { label: 'Graduate employment', value: 94, suffix: '%' },
] as const;

export const PRIMARY_NAV = [
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Our story', href: '/about', description: 'Who we are and what we stand for' },
      { label: 'History', href: '/about/history', description: 'From 1998 to 140 countries' },
      { label: 'Mission & vision', href: '/about/mission', description: 'Our purpose and direction' },
      { label: 'Vice-Chancellor', href: '/about/vice-chancellor', description: "A word from the VC" },
      { label: 'Leadership', href: '/about/leadership', description: 'Council and senior team' },
      { label: 'Accreditation', href: '/about/accreditation', description: 'Recognition and quality' },
    ],
  },
  {
    label: 'Academics',
    href: '/programs',
    children: [
      { label: 'Programmes', href: '/programs', description: 'Every degree and course' },
      { label: 'Faculties', href: '/faculties', description: 'Six faculties, 24 departments' },
      { label: 'Schools & institutes', href: '/schools', description: 'Specialist centres' },
      { label: 'Online learning', href: '/online-learning', description: 'How studying works' },
      { label: 'Academic calendar', href: '/academic-calendar', description: 'Key dates' },
      { label: 'Digital library', href: '/library', description: '2.4m items, open access' },
    ],
  },
  {
    label: 'Admissions',
    href: '/admissions',
    children: [
      { label: 'How to apply', href: '/admissions', description: 'Entry routes and deadlines' },
      { label: 'Apply now', href: '/apply', description: 'Start your application' },
      { label: 'Tuition & fees', href: '/admissions/fees', description: 'Costs and payment plans' },
      { label: 'Scholarships', href: '/scholarships', description: 'Funding your studies' },
      { label: 'International students', href: '/international', description: 'Visas and support' },
      { label: 'Track application', href: '/apply/status', description: 'Check your status' },
    ],
  },
  {
    label: 'Research',
    href: '/research',
    children: [
      { label: 'Research overview', href: '/research', description: 'Themes and impact' },
      { label: 'Projects', href: '/research/projects', description: 'Active investigations' },
      { label: 'Publications', href: '/research/publications', description: 'Repository' },
      { label: 'Funding & grants', href: '/research/funding', description: 'Support for researchers' },
    ],
  },
  {
    label: 'Life',
    href: '/campus-life',
    children: [
      { label: 'Campus life', href: '/campus-life', description: 'Community, clubs, wellbeing' },
      { label: 'News', href: '/news', description: 'Latest from the university' },
      { label: 'Events', href: '/events', description: "What's coming up" },
      { label: 'Blog', href: '/blog', description: 'Voices from RuMax' },
      { label: 'Gallery', href: '/gallery', description: 'Moments from our community' },
      { label: 'Alumni', href: '/alumni', description: '84,000 graduates worldwide' },
      { label: 'Careers centre', href: '/careers', description: 'Jobs and internships' },
    ],
  },
] as const;

export const FOOTER_NAV = [
  {
    heading: 'Study',
    links: [
      { label: 'Programmes', href: '/programs' },
      { label: 'Faculties', href: '/faculties' },
      { label: 'Online learning', href: '/online-learning' },
      { label: 'Digital library', href: '/library' },
      { label: 'Academic calendar', href: '/academic-calendar' },
      { label: 'Scholarships', href: '/scholarships' },
    ],
  },
  {
    heading: 'Apply',
    links: [
      { label: 'Admissions', href: '/admissions' },
      { label: 'Apply now', href: '/apply' },
      { label: 'Track application', href: '/apply/status' },
      { label: 'Tuition & fees', href: '/admissions/fees' },
      { label: 'International students', href: '/international' },
      { label: 'FAQs', href: '/faqs' },
    ],
  },
  {
    heading: 'University',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Leadership', href: '/about/leadership' },
      { label: 'Research', href: '/research' },
      { label: 'Partners', href: '/partners' },
      { label: 'Work with us', href: '/jobs' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { label: 'Student portal', href: '/portal' },
      { label: 'Lecturer portal', href: '/lecturer' },
      { label: 'Verify a certificate', href: '/verify' },
      { label: 'Alumni network', href: '/alumni' },
      { label: 'Careers centre', href: '/careers' },
      { label: 'Help desk', href: '/support' },
    ],
  },
] as const;

export const LEGAL_NAV = [
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of use', href: '/terms' },
  { label: 'Cookie policy', href: '/cookies' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Sitemap', href: '/sitemap' },
] as const;

export const LEADERSHIP = [
  {
    name: 'Prof. Thandiwe Ruzivo',
    role: 'Vice-Chancellor & President',
    bio: 'A computational linguist by training, Prof. Ruzivo has led RuMax since 2019, doubling enrolment while holding graduate satisfaction above 90%.',
    initials: 'TR',
  },
  {
    name: 'Prof. Daniel Mwangi',
    role: 'Deputy Vice-Chancellor, Academic Affairs',
    bio: 'Oversees curriculum, quality assurance and the academic regulations that govern every programme.',
    initials: 'DM',
  },
  {
    name: 'Dr. Amara Okonkwo',
    role: 'Deputy Vice-Chancellor, Research & Innovation',
    bio: 'Leads the six research institutes and the university’s open-access publishing mandate.',
    initials: 'AO',
  },
  {
    name: 'Mr. Hassan El-Amin',
    role: 'University Registrar',
    bio: 'Custodian of student records, admissions decisions, examinations and graduation.',
    initials: 'HE',
  },
  {
    name: 'Ms. Grace Phiri',
    role: 'Chief Finance Officer',
    bio: 'Responsible for tuition policy, scholarships disbursement and financial sustainability.',
    initials: 'GP',
  },
  {
    name: 'Dr. Sofia Marchetti',
    role: 'Chief Technology Officer',
    bio: 'Runs the learning platform, data protection programme and the 99.99% availability commitment.',
    initials: 'SM',
  },
] as const;

export const MILESTONES = [
  { year: 1998, title: 'Founded as RuMax Institute', body: 'Opened with 240 students and three diploma programmes in Blantyre.' },
  { year: 2004, title: 'First degree-awarding powers', body: 'Accredited to award bachelors degrees by the national higher education authority.' },
  { year: 2011, title: 'Fully online delivery', body: 'Retired the last on-campus lecture and moved every programme to distance delivery.' },
  { year: 2016, title: 'Research institutes established', body: 'Six institutes founded around climate, health systems, and digital economy research.' },
  { year: 2020, title: '100,000 students', body: 'Enrolment passed six figures across 118 countries during the global shift to remote study.' },
  { year: 2023, title: 'Verifiable credentials', body: 'Every award issued with a cryptographic verification record employers can check instantly.' },
  { year: 2025, title: 'AI-supported learning', body: 'AI tutoring, study planning and formative feedback embedded across the curriculum.' },
] as const;

export const VALUES = [
  {
    title: 'Access without barriers',
    body: 'Geography, disability, income and time zone should never decide who gets to learn. Every course we build is designed to work on a low-bandwidth connection and a five-year-old phone.',
  },
  {
    title: 'Academic rigour',
    body: 'Online does not mean easier. Our programmes are externally examined and our regulations are published in full.',
  },
  {
    title: 'Evidence over assertion',
    body: 'We publish our completion rates, graduate outcomes and student satisfaction — including the numbers we are not proud of.',
  },
  {
    title: 'Human teaching, AI support',
    body: 'AI helps students practise and helps lecturers give faster feedback. It never replaces the person who marks your work.',
  },
] as const;

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'pt', label: 'Portuguese', native: 'Português', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'zh', label: 'Chinese', native: '中文', dir: 'ltr' },
  { code: 'de', label: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili', dir: 'ltr' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
