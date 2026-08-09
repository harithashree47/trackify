import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useGoals } from '../hooks/useGoals.js';
import { toDateStr, todayStr } from '../utils/date.js';
import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHOW_DAY_LABELS = [1, 3, 5];

// GitHub-style heatmap cell sizing (px).
const CELL_SIZE = 14;
const GAP = 3;
const WEEKDAY_COL_W = 28; // w-7
const LABEL_GUTTER = WEEKDAY_COL_W + 4; // w-7 + mr-1

const LEVEL_COLORS = [
  'bg-[#ebedf0]', // empty
  'bg-emerald-300', // low
  'bg-emerald-400', // medium-low
  'bg-emerald-500', // medium
  'bg-emerald-600', // high
];

const levelClass = (completed) =>
  LEVEL_COLORS[Math.min(4, Math.max(0, completed))];

const LEGEND_LEVELS = [0, 1, 3, 4];

const formatDate = (ds) =>
  new Date(ds + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const ErrorCard = ({ message, onRetry }) => (
  <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
      <FiRefreshCw className="h-6 w-6" />
    </div>
    <h3 className="text-base font-bold text-red-800">Couldn't load your calendar</h3>
    <p className="mt-1 text-sm text-red-600">{message}</p>
    <Button className="mt-4" onClick={onRetry} leftIcon={<FiRefreshCw className="h-4 w-4" />}>
      Try Again
    </Button>
  </div>
);

export const Calendar = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const { goals, isLoading, error, retry } = useGoals({ enabled: isAuthenticated });

  const todayStrLocal = todayStr();
  const [tooltip, setTooltip] = useState(null);

  const dailyMap = useMemo(() => {
    const map = {};
    goals.forEach((g) => {
      const ds = toDateStr(g.createdAt);
      if (!map[ds]) map[ds] = { total: 0, completed: 0 };
      map[ds].total += 1;
      if (g.completed) map[ds].completed += 1;
    });
    return map;
  }, [goals]);

  const startDateStr = useMemo(() => {
    if (goals.length === 0) return null;
    return goals.map((g) => toDateStr(g.createdAt)).sort()[0];
  }, [goals]);

  const weeks = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    start.setDate(start.getDate() - 363);
    start.setDate(start.getDate() - start.getDay());

    if (startDateStr) {
      const sd = new Date(startDateStr + 'T12:00:00');
      if (sd > start) {
        start.setFullYear(sd.getFullYear(), sd.getMonth(), sd.getDate());
        start.setDate(start.getDate() - start.getDay());
      }
    }

    const result = [];
    let week = [];
    const cur = new Date(start);
    while (cur <= end) {
      const ds = toDateStr(cur);
      week.push({ date: ds, ...(dailyMap[ds] || { total: 0, completed: 0 }) });
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length > 0) {
      while (week.length < 7) week.push({ date: null, total: 0, completed: 0 });
      result.push(week);
    }
    return result;
  }, [dailyMap, startDateStr]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = null;
    weeks.forEach((week, idx) => {
      const first = week.find((d) => d.date);
      if (!first) return;
      const month = new Date(first.date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
      });
      if (month !== lastMonth) {
        labels.push({ index: idx, label: month });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogout={handleLogout} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-2"
        >
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="h-4 w-4" />
          </motion.button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Activity Calendar
            </h1>
            <p className="text-[12px] font-medium text-slate-500">
              Your last 12 months at a glance
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-56 animate-pulse rounded-[20px] bg-white border border-slate-100" />
          </div>
        ) : error ? (
          <ErrorCard message={error} onRetry={retry} />
        ) : (
          <>
            {/* Contribution Graph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
                  {Object.keys(dailyMap).length > 0
                    ? `${Object.keys(dailyMap).length} day${
                        Object.keys(dailyMap).length === 1 ? '' : 's'
                      } of goal setting`
                    : 'No activity yet'}
                </h2>
                <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11.5px] font-bold text-blue-600 sm:inline-flex">
                  <FiCalendar className="h-3.5 w-3.5" />
                  Click a day to open its goals
                </span>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-max">
                  {/* Month labels */}
                  <div
                    className="relative mb-2"
                    style={{ marginLeft: LABEL_GUTTER, height: CELL_SIZE }}
                  >
                    {monthLabels.map(({ index, label }) => (
                      <span
                        key={`${index}-${label}`}
                        className="absolute text-[10px] font-semibold text-slate-400"
                        style={{ left: index * (CELL_SIZE + GAP) }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex">
                    {/* Weekday labels */}
                    <div
                      className="mr-1 flex w-7 flex-none flex-col items-end pr-0.5"
                      style={{ gap: GAP }}
                    >
                      {WEEKDAY_LABELS.map((label, i) => (
                        <div
                          key={label}
                          style={{ height: CELL_SIZE }}
                          className={`flex items-center text-[10px] font-medium leading-none ${
                            SHOW_DAY_LABELS.includes(i)
                              ? 'text-slate-400'
                              : 'text-transparent'
                          }`}
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    {/* Weeks */}
                    <div className="flex" style={{ gap: GAP }}>
                      {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                          {week.map((cell, di) => {
                            if (!cell.date) {
                              return (
                                <div
                                  key={di}
                                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                                />
                              );
                            }
                            const isCurrent = cell.date === todayStrLocal;
                            const isFutureDay = cell.date > todayStrLocal;
                            const isBeforeStart =
                              startDateStr && cell.date < startDateStr;
                            if (isBeforeStart) {
                              return (
                                <div
                                  key={di}
                                  className="rounded-[3px] bg-[#ebedf0]"
                                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                                />
                              );
                            }
                            return (
                              <button
                                key={di}
                                disabled={isFutureDay}
                                onClick={() => navigate(`/goals?date=${cell.date}`)}
                                onMouseMove={(e) =>
                                  setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    date: cell.date,
                                    total: cell.total,
                                    completed: cell.completed,
                                  })
                                }
                                onMouseLeave={() => setTooltip(null)}
                                className={`rounded-[3px] transition hover:brightness-90 ${levelClass(
                                  cell.completed
                                )} ${isFutureDay ? 'opacity-40' : ''} ${
                                  isCurrent
                                    ? 'ring-2 ring-blue-600 ring-offset-1'
                                    : ''
                                }`}
                                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div
                    className="mt-4 flex items-center justify-end gap-1.5 text-[10px] font-medium text-slate-400"
                  >
                    <span>Less</span>
                    {LEGEND_LEVELS.map((l) => (
                      <span
                        key={l}
                        className={`rounded-[3px] ${levelClass(l)}`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      />
                    ))}
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Hover tooltip */}
              {tooltip && (
                <div
                  className="pointer-events-none fixed z-50 rounded-lg bg-slate-900 px-3 py-2 text-white shadow-xl"
                  style={{
                    left:
                      tooltip.x + 14 > window.innerWidth - 210
                        ? tooltip.x - 198
                        : tooltip.x + 14,
                    top:
                      tooltip.y + 18 > window.innerHeight - 96
                        ? tooltip.y - 84
                        : tooltip.y + 18,
                  }}
                >
                  <p className="whitespace-nowrap text-[11.5px] font-bold leading-snug">
                    {formatDate(tooltip.date)}
                  </p>
                  <p className="whitespace-nowrap text-[11px] leading-snug text-slate-300">
                    {tooltip.total} goal{tooltip.total === 1 ? '' : 's'}
                  </p>
                  <p className="whitespace-nowrap text-[11px] leading-snug text-slate-300">
                    {tooltip.completed} completed
                  </p>
                </div>
              )}
            </motion.div>

            {/* Hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] font-medium text-slate-400 sm:hidden"
            >
              <FiCheckCircle className="h-3.5 w-3.5" />
              Tap a green square to open that day's goals
            </motion.p>
          </>
        )}
      </main>
    </div>
  );
};
