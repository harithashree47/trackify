import { toDateStr, todayStr, shiftDay } from './date.js';

// A day counts toward the streak when it has at least one goal and every goal
// on that day is completed. The streak stays alive while today is still in
// progress (nothing added yet or not all completed), so completing day 1's
// goals keeps a 1-day streak visible the next morning until today is finished.
// It only resets after a full day is missed (no completed day since yesterday).
export const calculateStreak = (goals) => {
  const dayMap = {};
  for (const g of goals) {
    const ds = toDateStr(g.createdAt);
    if (!dayMap[ds]) dayMap[ds] = { total: 0, completed: 0 };
    dayMap[ds].total += 1;
    if (g.completed) dayMap[ds].completed += 1;
  }

  const isCompleteDay = (ds) => {
    const day = dayMap[ds];
    return !!day && day.total > 0 && day.completed === day.total;
  };

  const today = todayStr();

  // If today isn't finished yet, start counting from yesterday so an
  // in-progress day doesn't wipe the streak.
  const cursor = isCompleteDay(today) ? today : shiftDay(today, -1);

  let streak = 0;
  let ds = cursor;
  while (isCompleteDay(ds)) {
    streak++;
    ds = shiftDay(ds, -1);
  }
  return streak;
};