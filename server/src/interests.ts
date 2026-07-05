const interestPattern = /^[\p{L}\p{N}][\p{L}\p{N}\s&'./+-]{1,49}$/u;

export function cleanInterest(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function validateInterestList(values: unknown[] = []) {
  const interests: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const interest = cleanInterest(value);
    if (!interest) return { ok: false as const, error: "Fitness interests cannot be empty." };
    if (interest.length > 50) return { ok: false as const, error: "Fitness interests must be 50 characters or fewer." };
    if (!interestPattern.test(interest)) return { ok: false as const, error: "Fitness interests can use letters, numbers, spaces, and simple punctuation only." };

    const key = interest.toLowerCase();
    if (seen.has(key)) return { ok: false as const, error: `Duplicate fitness interest: ${interest}` };
    seen.add(key);
    interests.push(interest);
  }

  return { ok: true as const, interests };
}
