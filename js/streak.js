// "5 days in a row": how many days in a row (ending today, or yesterday if today is still open) have at least one real tale.
import { addDays } from './util.js';

export function computeStreak(tales, today) {
  const days = new Set(tales.filter((t) => !t.sample).map((t) => t.date));
  const postedToday = days.has(today);
  let day = postedToday ? today : addDays(today, -1), n = 0;
  while (days.has(day)) { n++; day = addDays(day, -1); }
  return { count: n, postedToday };
}

export const MILESTONES = [3, 7, 14, 30, 60, 100];
