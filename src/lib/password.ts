/**
 * Password policy.
 *
 * Kept separate from `auth.ts` because that module is `server-only` — the register form
 * needs to evaluate the same rules in the browser to show live feedback, and duplicating
 * the rules in two places is how client and server policies drift apart.
 */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 10) problems.push('Use at least 10 characters');
  if (!/[a-z]/.test(password)) problems.push('Include a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('Include an uppercase letter');
  if (!/[0-9]/.test(password)) problems.push('Include a number');
  if (!/[^A-Za-z0-9]/.test(password)) problems.push('Include a symbol');
  return problems;
}

export function isStrongPassword(password: string): boolean {
  return passwordProblems(password).length === 0;
}
