import { toDateStr, todayStr, shiftDay } from './date.js';
import { calculateStreak } from './streak.js';

// Groups goals by title and calculates the current streak for each.
// A streak is maintained if the user adds and completes the specific goal on consecutive days.
export const calculateGoalSpecificStreaks = (goals) => {
  const titleGroups = {};

  for (const g of goals) {
    const title = g.title.trim().toLowerCase();
    if (!titleGroups[title]) {
      titleGroups[title] = { originalTitle: g.title, goals: [] };
    }
    titleGroups[title].goals.push(g);
  }

  const streaks = [];
  for (const key in titleGroups) {
    const group = titleGroups[key];
    const currentStreak = calculateStreak(group.goals);
    if (currentStreak > 0) {
      streaks.push({
        title: group.originalTitle,
        streak: currentStreak,
      });
    }
  }

  // Sort by highest streak first
  return streaks.sort((a, b) => b.streak - a.streak);
};

// Gets the ISO week string (YYYY-Www)
const getWeekStr = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

// Gets the ISO month string (YYYY-MM)
const getMonthStr = (dateStr) => {
  return dateStr.substring(0, 7);
};

// Calculates how many consecutive weeks the user had at least one "completed day".
export const calculateWeeklyStreak = (goals) => {
  const dayMap = {};
  for (const g of goals) {
    const ds = toDateStr(g.createdAt);
    if (!dayMap[ds]) dayMap[ds] = { total: 0, completed: 0 };
    dayMap[ds].total += 1;
    if (g.completed) dayMap[ds].completed += 1;
  }

  const activeWeeks = new Set();
  for (const ds in dayMap) {
    if (dayMap[ds].total > 0 && dayMap[ds].completed === dayMap[ds].total) {
      activeWeeks.add(getWeekStr(ds));
    }
  }

  const today = todayStr();
  let currentWeekDate = today;
  let currentWeekStr = getWeekStr(currentWeekDate);
  
  // If no activity this week yet, start checking from last week
  if (!activeWeeks.has(currentWeekStr)) {
    currentWeekDate = shiftDay(today, -7);
    currentWeekStr = getWeekStr(currentWeekDate);
  }

  let streak = 0;
  while (activeWeeks.has(currentWeekStr)) {
    streak++;
    currentWeekDate = shiftDay(currentWeekDate, -7);
    currentWeekStr = getWeekStr(currentWeekDate);
  }

  return streak;
};

// Calculates how many consecutive months the user had at least one "completed day".
export const calculateMonthlyStreak = (goals) => {
  const dayMap = {};
  for (const g of goals) {
    const ds = toDateStr(g.createdAt);
    if (!dayMap[ds]) dayMap[ds] = { total: 0, completed: 0 };
    dayMap[ds].total += 1;
    if (g.completed) dayMap[ds].completed += 1;
  }

  const activeMonths = new Set();
  for (const ds in dayMap) {
    if (dayMap[ds].total > 0 && dayMap[ds].completed === dayMap[ds].total) {
      activeMonths.add(getMonthStr(ds));
    }
  }

  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth() + 1; // 1-12
  
  let currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  if (!activeMonths.has(currentMonthStr)) {
    currentMonth -= 1;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear -= 1;
    }
    currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  }

  let streak = 0;
  while (activeMonths.has(currentMonthStr)) {
    streak++;
    currentMonth -= 1;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear -= 1;
    }
    currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  }

  return streak;
};
