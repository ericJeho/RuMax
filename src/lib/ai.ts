import 'server-only';

import { env, integrations } from './env';

/**
 * AI services for the platform (tutor, study planner, quiz generation, feedback,
 * career advice, writing help).
 *
 * The platform must demonstrate end to end without credentials, so every capability has
 * two paths: a live call to the Claude Messages API when `ANTHROPIC_API_KEY` is set, and
 * a deterministic offline responder otherwise. Callers cannot tell the difference at the
 * type level; the response carries `source` so the UI can label offline answers honestly.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type AiResponse = {
  text: string;
  source: 'claude' | 'offline';
  model?: string;
};

export type AiPersona = keyof typeof PERSONAS;

const PERSONAS = {
  tutor: `You are the RuMax AI Tutor for RuMax Global Digital University. You help students
understand material — you never do their graded work for them. Explain concepts step by
step, ask a checking question at the end, and if a student asks you to write an
assignment, decline and offer to help them plan and understand it instead. Be concise.`,

  advisor: `You are the RuMax AI Academic Advisor. You help students choose courses, plan
their degree path, understand prerequisites and credit loads, and stay on track to
graduate. Recommend speaking to a human advisor for anything involving fees, visas or
academic appeals.`,

  career: `You are the RuMax AI Career Advisor. You give practical, specific guidance on
CVs, interviews, internships and graduate roles. Prefer concrete examples over generic
advice.`,

  writing: `You are the RuMax AI Writing Assistant. You help students improve their own
writing: structure, clarity, argument and citation. You do not write essays for
students. Give targeted suggestions on the text they provide.`,

  research: `You are the RuMax AI Research Assistant. You help with literature strategy,
methodology, and framing research questions. Never fabricate citations — if you are not
certain a source exists, say so and describe what to search for instead.`,
} as const;

/** Send a conversation to Claude, or answer offline when no key is configured. */
export async function chat(
  persona: AiPersona,
  messages: ChatMessage[],
  options: { maxTokens?: number; context?: string } = {},
): Promise<AiResponse> {
  const system = options.context
    ? `${PERSONAS[persona]}\n\nCourse context the student is working in:\n${options.context}`
    : PERSONAS[persona];

  if (!integrations.ai) {
    return { text: offlineReply(persona, messages), source: 'offline' };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY as string,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL,
        max_tokens: options.maxTokens ?? 1024,
        system,
        messages,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error('[ai] request failed', response.status, await response.text().catch(() => ''));
      return { text: offlineReply(persona, messages), source: 'offline' };
    }

    const data = (await response.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('\n')
      .trim();

    if (!text) return { text: offlineReply(persona, messages), source: 'offline' };
    return { text, source: 'claude', model: env.ANTHROPIC_MODEL };
  } catch (error) {
    console.error('[ai] request threw', error);
    return { text: offlineReply(persona, messages), source: 'offline' };
  }
}

/**
 * Offline responder. It is not a language model — it recognises the shape of the
 * question and returns genuinely useful study guidance, so the feature is demonstrable
 * without an API key rather than merely showing an error.
 */
function offlineReply(persona: AiPersona, messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const q = last.toLowerCase();

  const preamble =
    'AI services are running in offline mode (no `ANTHROPIC_API_KEY` configured), so this is a scripted study aid rather than a live tutor response.';

  if (persona === 'career') {
    return `${preamble}\n\n**Career guidance checklist**\n\n1. Lead your CV with outcomes, not duties — "cut report build time 40%" beats "responsible for reports".\n2. Mirror the vocabulary of the job advert; most first-pass screens are keyword based.\n3. Prepare six STAR stories (Situation, Task, Action, Result) you can adapt to most questions.\n4. Ask two questions at the end of every interview — one about the team, one about the first 90 days.\n\nBook a session with a human careers adviser from **Career Centre → Counselling** for feedback on your specific CV.`;
  }

  if (persona === 'writing') {
    return `${preamble}\n\n**Revision pass for your draft**\n\n- **Structure:** does every paragraph state its claim in the first sentence?\n- **Evidence:** each claim needs a source or data point; flag any that do not have one.\n- **Signposting:** connect paragraphs with a transition that names the relationship (however, consequently, by contrast).\n- **Citations:** use the Citation Generator in the Digital Library to format references consistently.\n\nPaste a single paragraph at a time for the most focused feedback.`;
  }

  if (persona === 'research') {
    return `${preamble}\n\n**Research strategy**\n\n1. Write your question as a single sentence with an independent and dependent variable.\n2. Build a search string from three concept blocks joined with AND, synonyms within each joined with OR.\n3. Search the Digital Library and at least one external index; record every search string you run.\n4. Screen by abstract first, then full text; keep an exclusion reason for each rejected paper.\n\nI will not invent citations — use the Library search to find real sources.`;
  }

  if (persona === 'advisor') {
    return `${preamble}\n\n**Planning your next term**\n\n- Full-time load is 9–21 credits; most students take 15.\n- Clear prerequisites before electives — the Course Registration screen blocks registrations whose prerequisites are unmet and tells you which ones.\n- Check the Graduation Tracker for outstanding core courses before you choose electives.\n- Registration closes on the date shown in the Academic Calendar; late registration needs Dean's approval.`;
  }

  // Tutor — try to be topic-aware.
  if (/assignment|essay|write my|do my/.test(q)) {
    return `${preamble}\n\nI will not write graded work for you, but I can help you do it well:\n\n1. Restate the question in your own words — this alone catches most misreadings.\n2. List the three claims your answer needs to make.\n3. For each claim, note the evidence you have and the evidence you still need.\n4. Draft the argument as bullet points before writing prose.\n\nBring me your bullet outline and I will tell you where the reasoning is thin.`;
  }
  if (/exam|revise|revision|study plan/.test(q)) {
    return `${preamble}\n\n**A revision plan that works**\n\n- **Retrieval, not re-reading.** Close the notes and write what you remember; check afterwards.\n- **Spacing.** Three 40-minute sessions across three days beat one two-hour session.\n- **Past papers under timed conditions** — the Digital Library has past papers by course code.\n- **Interleave topics.** Mixing question types trains you to recognise which method applies.`;
  }

  return `${preamble}\n\nHere is how I would approach "${last.slice(0, 120)}":\n\n1. **Define the terms.** Write a one-line definition of each key concept in the question.\n2. **Find the worked example.** Your course modules include at least one solved case — work through it without looking, then compare.\n3. **Explain it aloud.** If you cannot explain it in two sentences, the gap is where to study next.\n4. **Test yourself.** Attempt the practice quiz for this module; it is unlimited attempts and does not count toward your grade.\n\nAsk me about a specific step and I will go deeper.`;
}

/** Generate quiz questions from lesson material (lecturer Quiz Builder). */
export async function generateQuizQuestions(
  topic: string,
  count: number,
  material?: string,
): Promise<AiResponse> {
  return chat('tutor', [
    {
      role: 'user',
      content: `Write ${count} multiple-choice questions on "${topic}"${
        material ? ` based on this material:\n\n${material.slice(0, 6000)}` : ''
      }. For each: the question, four options labelled A–D, the correct letter, and a one-sentence explanation. Return them as a numbered list.`,
    },
  ]);
}

/** Draft formative feedback on a submission for a lecturer to review and edit. */
export async function draftFeedback(
  assignmentTitle: string,
  rubric: string,
  submission: string,
): Promise<AiResponse> {
  return chat('writing', [
    {
      role: 'user',
      content: `Draft feedback for a submission to "${assignmentTitle}".\n\nRubric:\n${rubric}\n\nSubmission:\n${submission.slice(
        0,
        8000,
      )}\n\nGive two strengths, two specific improvements, and a suggested band. Make clear this is a draft for the lecturer, not a final mark.`,
    },
  ]);
}
