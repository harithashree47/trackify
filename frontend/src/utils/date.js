export const DAY_MS = 24 * 60 * 60 * 1000;

export const toDateStr = (date) => {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

export const todayStr = () => toDateStr(new Date());

export const shiftDay = (dateStr, offset) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offset);
  return toDateStr(date);
};

export const getDayNumber = (dateStr, startDateStr) => {
  if (!startDateStr) return 1;
  const diff =
    new Date(dateStr + 'T12:00:00') - new Date(startDateStr + 'T12:00:00');
  return Math.max(Math.floor(diff / DAY_MS) + 1, 1);
};

export const isToday = (dateStr) => dateStr === todayStr();
