import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CalendarDays,
  Globe2,
  GraduationCap,
  Laptop,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { Badge, ButtonLink, Card, SectionHeading } from '@/components/ui';
import { CountUp, Reveal, RevealGroup, RevealItem } from '@/components/motion';
import { SITE, STATS, VALUES } from '@/lib/site';
import { formatCurrency, formatDate, truncate } from '@/lib/format';
import { getFaculties, getFeaturedPrograms, getLatestPosts, getUpcomingEvents } from '@/lib/queries';

export const revalidate = 300;

const LEVEL_LABELS: Record<string, string> = {
  CERTIFICATE: 'Certificate',
  DIPLOMA: 'Diploma',
  UNDERGRADUATE: 'Undergraduate',
  MASTERS: 'Masters',
  PHD: 'Doctorate',
  PROFESSIONAL: 'Professional',
  SHORT_COURSE: 'Short course',
  EXECUTIVE: 'Executive',
  MOOC: 'Open course',
};

export default async function HomePage() {
  const [programs, faculties, news, events] = await Promise.all([
    getFeaturedPrograms(6),
    getFaculties(),
    getLatestPosts('NEWS', 3),
    getUpcomingEvents(3),
  ]);

  return (
    <>
      {/* ------------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden bg-mesh">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgb(var(--rx-brand)/0.18),transparent_60%)]"
        />
        <div className="rx-container relative grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <Reveal>
            <Badge tone="brand" className="mb-5">
              <Sparkles size={12} aria-hidden />
              Applications open for the January intake
            </Badge>

            <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              A world-class degree,
              <br />
              <span className="text-gradient">wherever you are.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {SITE.name} teaches {STATS[0].value.toLocaleString()} students across {STATS[1].value}{' '}
              countries. Accredited undergraduate, masters and doctoral programmes — delivered
              entirely online, designed to fit around work and family.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/apply" size="lg">
                Start your application
                <ArrowRight size={16} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/programs" size="lg" variant="secondary">
                Browse 212 programmes
              </ButtonLink>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-semibold text-fg">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative">
              {/* A glassmorphic "today at RuMax" panel: concrete, not decorative. */}
              <Card glass className="p-6 shadow-glass">
                <div className="mb-5 flex items-center justify-between">
                  <p className="font-display text-lg font-semibold">Today at RuMax</p>
                  <Badge tone="success">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                    </span>
                    Live
                  </Badge>
                </div>

                <ul className="space-y-3">
                  {[
                    { icon: Laptop, title: 'Advanced Machine Learning', meta: 'Live seminar · 14:00 UTC · 312 attending' },
                    { icon: Users, title: 'Postgraduate research clinic', meta: 'Drop-in · 16:00 UTC · Institute of Data Science' },
                    { icon: Award, title: 'Graduation ceremony rehearsal', meta: 'Streamed · 18:30 UTC · Class of 2025' },
                  ].map((item) => (
                    <li
                      key={item.title}
                      className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface/60 p-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                        <item.icon size={17} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted">{item.meta}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/70 pt-5 text-center">
                  {[
                    { value: '99.99%', label: 'Platform uptime' },
                    { value: '< 24h', label: 'Feedback turnaround' },
                    { value: '24/7', label: 'AI tutor support' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="font-display text-lg font-semibold">{item.value}</p>
                      <p className="text-[11px] leading-tight text-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------------- Programmes */}
      <section className="rx-container py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Study with us"
            title="Featured programmes"
            description="From four-year bachelors degrees to eight-week professional certificates — every one taught online by the academics who designed it."
          />
          <Link href="/programs" className="text-sm font-semibold text-brand hover:underline">
            All programmes →
          </Link>
        </div>

        {programs.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted">
            Programme catalogue is being updated. Run <code className="text-brand">npm run db:seed</code> to
            load the demonstration content.
          </Card>
        ) : (
          <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <RevealItem key={program.id}>
                <Card hover className="flex h-full flex-col p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge tone="brand">{LEVEL_LABELS[program.level] ?? program.level}</Badge>
                    <Badge>{program.durationMonths} months</Badge>
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug">
                    <Link href={`/programs/${program.slug}`} className="hover:text-brand">
                      {program.title}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {truncate(program.summary, 130)}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="text-muted">{program.faculty.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(Number(program.tuitionPerYear), program.currency)}
                      <span className="text-xs font-normal text-muted">/yr</span>
                    </span>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* ----------------------------------------------------------- How it works */}
      <section className="border-y border-border bg-surface-2/40 py-20">
        <div className="rx-container">
          <SectionHeading
            align="center"
            eyebrow="How online study works"
            title="Structured, supported, and built around your life"
            description="Every programme runs on the same rhythm — so you always know what this week asks of you."
          />

          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BookOpen,
                title: 'Learn',
                body: 'Weekly modules of recorded lectures, readings and interactive labs. Everything downloadable for offline study.',
              },
              {
                icon: Users,
                title: 'Meet',
                body: 'Live seminars twice a week with your lecturer and cohort, recorded if your timezone makes attendance hard.',
              },
              {
                icon: Bot,
                title: 'Practise',
                body: 'Unlimited practice quizzes and an AI tutor that explains rather than answers — available at 3am when it clicks.',
              },
              {
                icon: Award,
                title: 'Prove',
                body: 'Assessed coursework and proctored examinations, with feedback inside 24 hours and a verifiable credential at the end.',
              },
            ].map((step, index) => (
              <RevealItem key={step.title}>
                <Card className="h-full p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                      <step.icon size={18} aria-hidden />
                    </span>
                    <span className="font-mono text-xs text-muted">0{index + 1}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Faculties */}
      {faculties.length > 0 ? (
        <section className="rx-container py-20">
          <SectionHeading
            eyebrow="Academic structure"
            title="Six faculties, one university"
            description="Each faculty sets its own curriculum and quality standards, examined externally every year."
          />
          <RevealGroup className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {faculties.map((faculty) => (
              <RevealItem key={faculty.id}>
                <Link href={`/faculties/${faculty.slug}`} className="block h-full">
                  <Card hover className="h-full p-6">
                    <GraduationCap size={22} className="mb-3 text-accent" aria-hidden />
                    <h3 className="font-display text-lg font-semibold">{faculty.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {truncate(faculty.description, 118)}
                    </p>
                    <p className="mt-4 text-xs text-muted">
                      {faculty._count.departments} departments · {faculty._count.programs} programmes
                      {faculty.dean ? ` · Dean: ${faculty.dean.firstName} ${faculty.dean.lastName}` : ''}
                    </p>
                  </Card>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      ) : null}

      {/* ------------------------------------------------------------------ Values */}
      <section className="border-y border-border bg-surface-2/40 py-20">
        <div className="rx-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <SectionHeading eyebrow="What we stand for" title="Our commitments to you" />
            <p className="mt-4 text-muted">
              We publish our regulations, our completion rates and our graduate outcomes in full.
              Read the{' '}
              <Link href="/about/mission" className="text-brand underline underline-offset-4">
                mission and vision
              </Link>{' '}
              or the{' '}
              <Link href="/about/accreditation" className="text-brand underline underline-offset-4">
                accreditation record
              </Link>
              .
            </p>
          </Reveal>

          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <RevealItem key={value.title}>
                <Card className="h-full p-6">
                  <h3 className="font-display text-base font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ------------------------------------------------------------ News & events */}
      <section className="rx-container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading eyebrow="Newsroom" title="Latest from RuMax" />
              <Link href="/news" className="shrink-0 text-sm font-semibold text-brand hover:underline">
                All news →
              </Link>
            </div>

            {news.length === 0 ? (
              <p className="text-sm text-muted">No news published yet.</p>
            ) : (
              <div className="space-y-5">
                {news.map((post) => (
                  <Reveal key={post.id}>
                    <Card hover className="p-6">
                      <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                        {formatDate(post.publishedAt)} · {post.tags[0] ?? 'University'}
                      </p>
                      <h3 className="font-display text-lg font-semibold">
                        <Link href={`/news/${post.slug}`} className="hover:text-brand">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{truncate(post.excerpt, 180)}</p>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading eyebrow="Diary" title="Upcoming events" />
              <Link href="/events" className="shrink-0 text-sm font-semibold text-brand hover:underline">
                All events →
              </Link>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-muted">No events scheduled.</p>
            ) : (
              <ul className="space-y-4">
                {events.map((event) => (
                  <li key={event.id}>
                    <Card className="flex gap-4 p-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand/10 text-center text-brand">
                        <span>
                          <span className="block text-lg font-semibold leading-none">
                            {event.eventStart ? new Date(event.eventStart).getUTCDate() : '—'}
                          </span>
                          <span className="block text-[10px] uppercase">
                            {event.eventStart
                              ? new Date(event.eventStart).toLocaleString('en', {
                                  month: 'short',
                                  timeZone: 'UTC',
                                })
                              : ''}
                          </span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          <Link href={`/events/${event.slug}`} className="hover:text-brand">
                            {event.title}
                          </Link>
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                          <CalendarDays size={12} aria-hidden />
                          {event.location ?? 'Online'}
                        </p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Verify CTA */}
      <section className="rx-container pb-20">
        <Card className="overflow-hidden bg-brand-gradient p-0 text-white">
          <div className="grid items-center gap-8 p-10 lg:grid-cols-[1.4fr_1fr] lg:p-14">
            <div>
              <Badge className="mb-4 border-white/30 bg-white/15 text-white">
                <ShieldCheck size={12} aria-hidden />
                Verifiable credentials
              </Badge>
              <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                Every RuMax award can be checked in seconds.
              </h2>
              <p className="mt-4 max-w-xl text-white/85">
                Graduates receive a certificate carrying a unique serial and a cryptographic hash.
                Employers verify it instantly — no email, no phone call, no fee.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink
                  href="/verify"
                  variant="secondary"
                  size="lg"
                  className="border-white/20 bg-white text-brand hover:bg-white/90"
                >
                  Verify a certificate
                </ButtonLink>
                <ButtonLink
                  href="/alumni"
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10"
                >
                  Alumni network
                </ButtonLink>
              </div>
            </div>

            <div className="hidden justify-self-end lg:block">
              <Globe2 size={190} strokeWidth={0.7} className="text-white/25" aria-hidden />
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
