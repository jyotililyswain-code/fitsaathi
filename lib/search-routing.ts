export function generalSearchTargetFor(rawQuery: string) {
  const query = rawQuery.trim();
  const normalized = query.toLowerCase();
  const encoded = encodeURIComponent(query);
  if (/(coach|trainer|training)/.test(normalized)) return `/find-coach?search=${encoded}`;
  if (/(dojo|academy|martial|karate|taekwondo|mma|gym|fitness studio|yoga studio)/.test(normalized)) return `/dojos?search=${encoded}`;
  if (/(seller|shop|store|product|equipment|protein|supplement|cart)/.test(normalized)) return `/shop?search=${encoded}`;
  if (/(booking|book|class|classes|yoga|running|boxing|dance)/.test(normalized)) return `/find-coach?search=${encoded}`;
  if (/(chat|message|invite)/.test(normalized)) return "/chat";
  if (/(dashboard|account)/.test(normalized)) return "/dashboard";
  return `/find-coach?search=${encoded}`;
}
