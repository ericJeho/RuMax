# User manuals

Three manuals in one file: students, lecturers, administrators. Every account uses the
password set as `SEED_PASSWORD` when the installation was seeded.

---

# 1. Student manual

## Getting started

Sign in at `/login` as `student@rumax.edu`. You land on **Dashboard**, which answers the
only question that matters day to day: what does this week need from me?

- **Deadlines** — the next eight, with the closest first and urgent ones in red.
- **Cumulative GPA** and your classification.
- **Balance** — anything outstanding, with a link to settle it.
- **Degree progress** — credits earned against credits required.

## Registering for courses

**Course registration** shows every course in your programme, grouped by year.

A course you cannot yet take is shown greyed out with the reason on the card —
*"Requires CS201 first"* — rather than simply being missing. Core courses are marked; take
them first, because they are usually prerequisites for later ones and are not offered every
term.

The counter at the top tracks your credit load. Full-time is 9–21 credits; most students
take 15. Submit, and the registrar approves within about two working days. You cannot open
course material until your registration is approved.

## Studying

Open a course from **My courses**. Content is organised into units, each with lessons —
video, reading, PDF, lab or slides.

Tick a lesson to mark it complete. The tick registers immediately even on a poor
connection; if the save fails you are told, and it syncs when you reconnect. Download
anything marked downloadable before you lose connectivity — the whole unit then works
offline, including video in its low-bandwidth form.

## Assignments

**Assignments** groups work into *due now*, *past deadline* and *submitted*.

Your draft **saves automatically as you type**, both to the server and to your own device.
Losing a long answer to a dropped connection should not happen, and if the server is
unreachable your work is still on your machine when you come back.

Submit before the deadline. If you cannot, ask your lecturer for an extension **before** it
passes — every course allows one extension of up to two weeks with no reason required.
Almost nobody uses this, and many people who could have finished do not.

Feedback appears on the same screen once marked, within 24 hours of the marking window
opening.

## Quizzes and examinations

Before you start, the panel on the right tells you the time limit, how many questions will
be served, how many attempts remain, and whether it is proctored.

Once you press start, **the clock runs whether or not the tab is open**. Answers save as
you go, so if your connection drops, reopen the page and the attempt resumes exactly where
it was.

In a proctored assessment, switching tabs and attempting to copy are recorded. Recordings
are reviewed only if the system flags something and are deleted after 90 days.

Objective questions are marked instantly and you see a per-question review with
explanations. Written answers are marked by your lecturer, so your final mark may be higher
than the figure shown.

## Grades, transcript and graduation

**Grades** shows published results by term with your GPA trend. **Transcript** is a
printable unofficial copy; official sealed transcripts come from the registrar.

**Graduation tracker** runs the same degree audit the registrar runs: credits earned,
outstanding core courses, CGPA against the minimum, and whether your fees are clear. If
something is blocking your award it is named there rather than discovered at graduation.

If your CGPA falls below 2.0 you will see a probation warning. Contact your advisor that
week — a reduced load for one term is the intervention that works most often.

## Fees

**Finance** shows every invoice, its balance, and your payment history with downloadable
receipts. Pay by card, PayPal, Flutterwave, Paystack, bank transfer, Airtel Money or TNM
Mpamba.

Tuition can be split across three instalments per term at no extra cost, but the plan must
be set up **before** the first due date. If you cannot pay, contact the finance office
before the invoice falls due; a plan is almost always possible, and an overdue account is
much harder to fix.

## Support

- **AI tutor** — explains and questions you, at 3am if that is when it clicks. It will not
  write assessed work, and conversations are stored against your account.
- **Academic advisor** — reads your actual record and tells you what needs attention, plus
  a route to a human for anything an algorithm cannot help with.
- **Messages** — direct contact with the lecturers who teach you and the university offices.
- **Student ID** — your digital ID with a verification code, working offline once the app
  is installed.

## Your data

**Profile → Your data** exports everything the university holds about you, immediately,
without anyone having to approve it.

---

# 2. Lecturer manual

Sign in as `lecturer@rumax.edu`.

## Dashboard

Your teaching load, the marking queue depth, the next deadline, and what has just been
handed in. The commitment students are given is feedback within 24 hours of the marking
window opening, so the queue count is the number that matters.

## Building a course

**Course builder** shows each course as units and lessons with their runtime. Aim for about
ten hours of study per 15-credit unit; the totals shown are how you check that.

## Setting work

**Assignments → New assignment.** State the task, the length and how it will be marked.
Ambiguity here becomes forty emails later.

Set the weight as a percentage of the course, choose whether late submissions are accepted,
and publish. Publishing notifies every approved student immediately; leave it unpublished
to keep drafting.

The list then shows, per assignment, how many of the cohort have submitted and how many you
have marked.

## Marking

**Marking queue** shows one submission at a time, oldest first. This is deliberate —
marking side by side encourages comparative marking, which drifts.

The brief is shown above the submission so you are marking against what was actually asked.
A similarity score above 25% is flagged; refer it to the academic integrity team rather
than reflecting it in the mark.

**AI draft** produces feedback for you to edit. It never sets a mark and never reaches the
student — you edit it and you own it. Two strengths, two specific improvements. "Q4
conflates two definitions" helps; "more detail needed" does not.

Releasing a mark notifies the student and locks their submission.

## Quizzes and examinations

**Quiz builder** takes a question bank and the rules that govern it: duration, attempts,
pass mark, weight, how many questions to serve from the bank, shuffling, proctoring and
lockdown.

Serving 5 questions from a bank of 20 means no two candidates see the same paper. The
explanation you write for each question is shown after submission — that is where most of
the learning happens.

Save unpublished to keep it invisible to students until you are ready.

## Gradebook and analytics

**Gradebook** is every student against every assessment, with a running mark normalised by
the weight actually assessed so far — so a mid-term view is meaningful rather than dragging
everyone toward zero.

**Course page → Student performance** flags students at risk: behind on marks *and* behind
on material. Either alone is noisy; both together is almost always someone an early
conversation can still help. A short, specific message naming the piece of work and
offering an extension recovers more students than any automated nudge.

**Assessment statistics** show the mean, median and range per assessment. A mean far above
75% or below 45% usually says more about the assessment than the cohort.

## Attendance

**Attendance register** defaults everyone to present; change only the exceptions. That is
how registers actually get filled in. Retaking a register for the same date corrects it
rather than duplicating it.

---

# 3. Administrator manual

Sign in as `admin@rumax.edu` for the full ERP, `registrar@rumax.edu` for academic and
admissions modules, or `finance@rumax.edu` for finance only. The navigation is filtered by
role, and every route re-checks permission independently.

## Dashboard

Enrolment, revenue and collection rate, the admissions funnel, enrolment by level, payment
method mix, and retention risk.

**Retention risk** is rule-based and explainable, never a black-box score: a student is
listed only when two or more concrete conditions hold — no registrations this term, nothing
ever submitted, a failing average, a large balance, no sign-in for 45 days — and the
conditions are shown so the retention team can judge for themselves.

## Admissions

**Admissions** is a review queue. Selecting an application shows the applicant, their
qualifications, their statement, and their documents with what is missing called out.

The workflow is *Begin review → Invite to interview → Make offer → Enrol*, or *Reject* at
any point.

- **Make offer** is blocked while a mandatory document is missing.
- **Enrol** requires a prior offer, and runs one transaction: the account becomes a
  student, a student number is issued, the programme is attached, and the first tuition
  invoice is raised.

Decision notes are recorded against the officer who made them. Applicants can request them
under a subject access request, so write what you would be content to have read back.

## Registrations

Approve or decline in bulk. Students cannot open course material until approved, so this
queue is time-sensitive. Already-decided registrations are left alone, so a double submit
cannot flip an approval a student is already studying under.

## Records and catalogue

**Students** — search the register by name, email or student number, with CGPA and balance.
**Staff** — teaching load, research output, and which accounts still lack two-factor.
**Programmes** and **Courses** — the catalogue, with courses lacking a lecturer flagged.
**Academic calendar** — term dates, which drive registration eligibility and assessment
availability platform-wide.
**Certificates** — every credential issued and how often each has been verified externally.

## Finance

Billed, collected, outstanding and the arrears list the finance office works from, plus
revenue trend and payment method mix. A student in arrears may have results withheld, but
access to teaching material is never removed for non-payment during a term.

## Communications

**Announcements** target an audience — everyone, students, lecturers, staff, alumni or
applicants. Sending a notification as well is optional and should stay that way: an
audience that ignores notifications is worse than one that never had them. Above 5,000
recipients the fan-out is queued rather than written inline.

## Reports

Six standing reports — enrolment census, attainment and progression, financial position,
admissions cycle, retention and withdrawal, research output — generated live and returning
aggregates only, so committee papers never contain an identifiable student.

## System

**Audit log** — every consequential action, filterable, append-only, retained seven years.
**Role permissions** — the matrix the API actually enforces, read-only by design. Changing
a grant is a code change in `src/lib/rbac.ts`, reviewed and deployed like any other
security control.
**Settings** — feature flags and the live status of every external integration, with
unconfigured services shown honestly rather than hidden.
