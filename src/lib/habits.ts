/**
 * Shared habit streak utilities — used by both the API route and client UI.
 * All calculations are pure functions that work on a sorted array of
 * "YYYY-MM-DD" date strings.
 */

export function computeStreaks(history: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (!history.length) return { currentStreak: 0, longestStreak: 0 };

  // Deduplicate and sort ascending
  const sorted = Array.from(new Set(history)).sort();

  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;

    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: walk backwards from today
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const histSet = new Set(sorted);
  let current = 0;

  if (histSet.has(todayStr) || histSet.has(yesterdayStr)) {
    const start = histSet.has(todayStr) ? todayStr : yesterdayStr;
    let cursor = new Date(start);
    while (histSet.has(cursor.toISOString().split("T")[0])) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}
