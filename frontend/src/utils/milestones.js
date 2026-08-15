// Reward tiers unlocked as the streak grows. The reward shows a star, medal,
// or cup for completing every goal over these consecutive-day milestones.
export const MILESTONES = [
  { days: 1, reward: '🌱', label: 'First Day' },
  { days: 3, reward: '⭐', label: 'Rising Star' },
  { days: 7, reward: '🎯', label: 'Week Warrior' },
  { days: 14, reward: '🏅', label: 'Bronze Medal' },
  { days: 21, reward: '🥈', label: 'Silver Medal' },
  { days: 30, reward: '🥇', label: 'Gold Medal' },
  { days: 50, reward: '🏆', label: 'Champion Cup' },
  { days: 100, reward: '👑', label: 'Legend Crown' },
];

export const getMilestone = (streak) =>
  [...MILESTONES].reverse().find((m) => streak >= m.days) ?? MILESTONES[0];

export const getNextMilestone = (streak) =>
  MILESTONES.find((m) => m.days > streak) ?? null;