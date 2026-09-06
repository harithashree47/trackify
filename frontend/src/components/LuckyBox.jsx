import { motion } from 'framer-motion';
import { FiGift, FiStar } from 'react-icons/fi';

export const LuckyBox = ({ streak }) => {
  const currentCycleDay = streak === 0 ? -1 : (streak - 1) % 7;
  const cycleNumber = Math.floor((Math.max(streak - 1, 0)) / 7) + 1;

  const boxes = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm p-5 sm:p-6 relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 flex-none">
              <FiGift className="w-6 h-6 stroke-[2]" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-800 tracking-tight">Streak Rewards</h3>
             <p className="text-[12px] text-slate-500 font-medium">Unlock a reward every day you hit your goals</p>
           </div>
        </div>
        <div className="sm:text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Week {cycleNumber}</span>
        </div>
      </div>

      <div className="relative">
        {/* Progress bar background line (desktop) */}
        <div className="absolute top-[40%] left-[5%] right-[5%] h-1.5 bg-slate-100 rounded-full -translate-y-1/2 hidden sm:block"></div>
        
        {/* Active progress line (desktop) */}
        <div 
          className="absolute top-[40%] left-[5%] h-1.5 bg-amber-400 rounded-full -translate-y-1/2 hidden sm:block transition-all duration-700 ease-out"
          style={{ width: `${(Math.max(0, currentCycleDay) / 6) * 90}%` }}
        ></div>

        <div className="relative grid grid-cols-7 gap-2 sm:gap-4">
          {boxes.map((day, index) => {
            const isUnlocked = index <= currentCycleDay;
            const isJustUnlocked = index === currentCycleDay;
            const isNextToUnlock = index === currentCycleDay + 1;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  initial={isJustUnlocked ? { scale: 0.8, y: 15 } : false}
                  animate={
                    isJustUnlocked 
                      ? { scale: [1, 1.1, 1], y: [0, -5, 0] } 
                      : isNextToUnlock 
                        ? { y: [0, -3, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                        : false
                  }
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className={`relative w-full aspect-square sm:rounded-full rounded-2xl flex items-center justify-center transition-all duration-300 bg-white ${
                    isUnlocked 
                      ? isJustUnlocked 
                        ? 'border-2 border-amber-400 shadow-md z-10' 
                        : 'border-[1.5px] border-amber-200 shadow-sm'
                      : 'border-[1.5px] border-slate-200 bg-slate-50 opacity-70'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center p-2 sm:p-3">
                    {isUnlocked ? (
                      <FiStar className={`w-3/5 h-3/5 transition-all duration-500 ${isJustUnlocked ? 'text-amber-500 fill-amber-400 drop-shadow-md' : 'text-amber-400 fill-amber-300 drop-shadow-sm'}`} />
                    ) : (
                      <FiGift className="w-3/5 h-3/5 text-slate-400 stroke-[1.5]" />
                    )}
                  </div>
                  
                  {/* Small Key Badge for the next box */}
                  {isNextToUnlock && (
                    <div className="absolute -bottom-1.5 -right-1.5 sm:right-0 bg-white rounded-full w-5 h-5 flex items-center justify-center border border-slate-200 shadow-sm text-[9px]">
                       🗝️
                    </div>
                  )}
                </motion.div>
                
                <div className={`mt-3 sm:mt-4 flex flex-col items-center transition-colors duration-300 ${isUnlocked ? 'opacity-100' : 'opacity-60'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isJustUnlocked ? 'text-amber-600' : isUnlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                    Day {day}
                  </span>
                  {/* Dot indicator for mobile */}
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full sm:hidden ${isUnlocked ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
