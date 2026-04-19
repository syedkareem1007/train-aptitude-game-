/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrainFront, 
  Terminal,
  Activity,
  Cpu,
  Zap,
  Star,
  Clock,
  History,
  RotateCcw,
  AlertCircle,
  Database,
  ShieldCheck,
  ChevronRight,
  Play,
  Trophy,
  CheckCircle2,
  Menu,
  ChevronDown
} from 'lucide-react';
import { Level, PerformanceRecord } from './types';
import { calculateClearanceTime } from './utils';

const LEVELS: Level[] = [
  {
    id: 1,
    title: "SINGLE_UNIT_CLEARANCE",
    scenario: "SIM_01",
    description: "450m manifest traveling at 90km/h. Calculate intersection time with stationary observer point.",
    trainALength: 450,
    trainASpeedKmH: 90,
    direction: 'stationary',
    options: [15, 18, 21, 24]
  },
  {
    id: 2,
    title: "PRIMARY_OBJECT_PASS",
    scenario: "SIM_02",
    description: "150m unit at 60km/h. Determine clearance time for a single pole intercept.",
    trainALength: 150,
    trainASpeedKmH: 60,
    direction: 'stationary',
    options: [7, 9, 11, 13]
  },
  {
    id: 3,
    title: "PLATFORM_INTEGRATION_A",
    scenario: "SIM_03",
    description: "150m unit passing through 100m platform zone at 120km/h constant velocity.",
    trainALength: 150,
    trainASpeedKmH: 120,
    platformLength: 100,
    direction: 'stationary',
    options: [5.5, 7.5, 9.5, 11.5]
  },
  {
    id: 4,
    title: "RELATIVE_VECTOR_ALPHA",
    scenario: "SIM_04",
    description: "100m unit (70km/h) passing secondary object (10km/h) moving in SAME direction.",
    trainALength: 100,
    trainASpeedKmH: 70,
    trainBSpeedKmH: 10,
    direction: 'same',
    options: [4, 6, 8, 10]
  },
  {
    id: 5,
    title: "RELATIVE_VECTOR_BETA",
    scenario: "SIM_05",
    description: "200m unit (80km/h) passing secondary object (10km/h) moving in OPPOSITE direction.",
    trainALength: 200,
    trainASpeedKmH: 80,
    trainBSpeedKmH: 10,
    direction: 'opposite',
    options: [6, 8, 10, 12]
  },
  {
    id: 6,
    title: "SYMMETRIC_INTERCEPT",
    scenario: "SIM_06",
    description: "Dual manifests (140m / 166m) approaching on parallel corridors at 50/60km/h.",
    trainALength: 140,
    trainASpeedKmH: 50,
    trainBLength: 166,
    trainBSpeedKmH: 60,
    direction: 'opposite',
    options: [8, 10, 12, 14]
  },
  {
    id: 7,
    title: "PARALLEL_OVERTAKE_DRIVE",
    scenario: "SIM_07",
    description: "Two 50m units in SAME direction at 40/30 km/h. Determine overtake completion time.",
    trainALength: 50,
    trainASpeedKmH: 40,
    trainBLength: 50,
    trainBSpeedKmH: 30,
    direction: 'same',
    options: [30, 36, 42, 48]
  },
  {
    id: 8,
    title: "STRUCTURAL_CROSS_DELTA",
    scenario: "SIM_08",
    description: "130m unit at 45km/h penetrating a 245m bridge structure. Calculate required exit time.",
    trainALength: 130,
    trainASpeedKmH: 45,
    platformLength: 245,
    direction: 'stationary',
    options: [25, 30, 35, 40]
  },
  {
    id: 9,
    title: "DYNAMIC_INTERCEPT_RATIO",
    scenario: "SIM_09",
    description: "Asymmetric manifests (405m / 170m) at 54/36 km/h in OPPOSITE directions. Find clearance time.",
    trainALength: 405,
    trainASpeedKmH: 54,
    trainBLength: 170,
    trainBSpeedKmH: 36,
    direction: 'opposite',
    options: [20, 23, 27, 31]
  }
];

export default function App() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'analysis' | 'result'>('intro');
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{ delta: number, accuracy: number, ideal: number } | null>(null);
  const [isError, setIsError] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);

  const currentLevel = LEVELS[currentLevelIdx];

  // Randomize options for each level to avoid patterns
  const randomizedOptions = useMemo(() => {
    return [...currentLevel.options].sort(() => Math.random() - 0.5);
  }, [currentLevelIdx]);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setCurrentTime((Date.now() - startTime) / 1000);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  const handleStart = () => {
    setGameState('playing');
    setStartTime(Date.now());
    setCurrentTime(0);
    setLastResult(null);
  };

  const handleOptionSelect = (selectedTime: number) => {
    const idealTime = calculateClearanceTime(
      currentLevel.trainALength,
      currentLevel.trainASpeedKmH,
      currentLevel.platformLength || currentLevel.trainBLength || 0,
      currentLevel.trainBSpeedKmH || 0,
      currentLevel.direction
    );

    const delta = selectedTime - idealTime;
    const accuracy = Math.max(0, 100 - (Math.abs(delta) / idealTime) * 100);
    const isSuccess = Math.abs(delta) < 0.1; // Strict margin for choice mode

    setLastResult({ delta, accuracy, ideal: idealTime });
    setAttempts(prev => prev + 1);

    const newRecord: PerformanceRecord = {
      levelId: currentLevel.id,
      timeTaken: selectedTime,
      attempts: 1,
      wasCorrect: isSuccess,
      idealTime
    };

    setRecords(prev => [...prev, newRecord]);

    if (!isSuccess) {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
    }

    setGameState('result');
  };

  const nextScenario = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx(prev => prev + 1);
      setGameState('playing');
      setStartTime(Date.now());
      setCurrentTime(0);
      setLastResult(null);
    } else {
      setGameState('analysis');
    }
  };

  const resetSimulation = () => {
    setCurrentLevelIdx(0);
    setAttempts(0);
    setGameState('intro');
    setRecords([]);
    setStartTime(0);
    setCurrentTime(0);
    setLastResult(null);
  };

  const stats = useMemo(() => {
    const count = records.length;
    if (count === 0) return { totalAttempts: 0, efficiency: 0 };
    
    // Efficiency based on accuracy mean for the game version
    const totalAccuracy = records.reduce((acc, r) => {
      const delta = Math.abs(r.timeTaken - r.idealTime);
      const accVal = Math.max(0, 100 - (delta / r.idealTime) * 100);
      return acc + accVal;
    }, 0);
    
    return { totalAttempts: attempts, efficiency: Math.round(totalAccuracy / count) };
  }, [records, attempts]);

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-400 font-mono flex flex-col p-2 md:p-4 overflow-hidden relative">
      <div className="scanline" />
      
      {/* Header */}
      <header className="terminal-border terminal-header mb-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded">
            <Terminal className="text-emerald-500 w-5 h-5 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tighter terminal-text-glow text-emerald-500 uppercase leading-none">
              Intercept_Engine <span className="opacity-50 font-light text-zinc-500 text-xs">// V3.0</span>
            </h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Signal Response Protocol</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
           {/* Level Menu Toggle */}
           <div className="relative">
              <button 
                onClick={() => setShowLevelMenu(!showLevelMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 border text-[10px] font-black uppercase tracking-widest transition-all
                  ${showLevelMenu ? 'bg-emerald-500 text-zinc-950 border-emerald-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-emerald-500/50 hover:text-zinc-200'}
                `}
              >
                <Menu className="w-3.5 h-3.5" />
                <span>LEVELS_OVERRIDE</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLevelMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Level Dropdown Menu */}
              <AnimatePresence>
                {showLevelMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 shadow-2xl z-[100] p-1"
                  >
                    <div className="p-2 border-b border-zinc-800 flex justify-between items-center text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
                       <span>Select_Mission_Protocol</span>
                       <span>MOD_0{LEVELS.length}</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-1 space-y-1">
                       {LEVELS.map((level, idx) => (
                         <button
                           key={level.id}
                           onClick={() => {
                             setCurrentLevelIdx(idx);
                             setShowLevelMenu(false);
                             setGameState('intro');
                             setLastResult(null);
                           }}
                           className={`w-full p-3 text-left transition-all border group ${currentLevelIdx === idx ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-zinc-800'}`}
                         >
                            <div className="flex justify-between items-start mb-1">
                               <span className={`text-[8px] font-black ${currentLevelIdx === idx ? 'text-emerald-500' : 'text-zinc-600'}`}>SIM_0{idx + 1}</span>
                               <span className={`text-[8px] font-bold ${currentLevelIdx === idx ? 'text-emerald-500' : 'text-zinc-700'}`}>{level.scenario}</span>
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-tight ${currentLevelIdx === idx ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                               {level.title}
                            </div>
                            <div className="text-[8px] text-zinc-600 truncate mt-1">
                               {level.description}
                            </div>
                         </button>
                       ))}
                    </div>
                    <div className="p-2 bg-zinc-950 flex justify-center border-t border-zinc-800">
                       <span className="text-[7px] text-zinc-700 uppercase font-black">Terminal_Sequence_Active_2026</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           <div className="hidden lg:flex gap-6 border-l border-zinc-800 pl-6">
              <HeaderStat label="SYNC_READY" value="YES" color="text-zinc-500" />
              <HeaderStat label="CORRIDOR" value="SECURE" color="text-emerald-500" />
              <HeaderStat label="ACCURACY_INDEX" value={`${stats.efficiency}%`} color="text-emerald-500" />
           </div>
        </div>
      </header>

      {/* Main Grid Layout - Everything in Single Frame */}
      <div className="flex-1 grid grid-cols-12 gap-4 h-full min-h-0">
        
        {/* Left Panel: Mission & History */}
        <aside className="col-span-12 md:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
          {/* Mission Info */}
          <div className="terminal-border overflow-hidden flex flex-col h-1/2">
            <div className="terminal-header bg-emerald-500/5">
              <span className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4" /> Live_Telemetry
              </span>
              <span className="text-[10px] opacity-40">#{currentLevel.scenario}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <h2 className="text-zinc-100 text-sm font-bold uppercase">{currentLevel.title}</h2>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <p className="text-[10px] leading-relaxed text-zinc-500 italic">
                    OBSERVATION: {currentLevel.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Metric label="MANIFEST_LEN" value={`${currentLevel.trainALength + (currentLevel.platformLength || currentLevel.trainBLength || 0)}m`} />
                <Metric 
                  label="REL_SPEED" 
                  value={`${currentLevel.direction === 'opposite' ? currentLevel.trainASpeedKmH + (currentLevel.trainBSpeedKmH || 0) : currentLevel.trainASpeedKmH} km/h`} 
                />
                <Metric label="CORRIDOR" value={currentLevel.direction.toUpperCase()} />
              </div>
            </div>
          </div>

          {/* Perf History */}
          <div className="terminal-border flex-1 flex flex-col min-h-0">
            <div className="terminal-header bg-amber-500/5">
              <span className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                <History className="w-4 h-4" /> LOGS
              </span>
              <span className="text-[10px] opacity-40">HISTORY</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <AnimatePresence initial={false}>
                {records.length === 0 && (
                  <div className="h-full flex items-center justify-center text-zinc-700 italic text-[10px]">
                    ... AWAITING_DATA ...
                  </div>
                )}
                {[...records].reverse().map((r, i) => (
                   <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="p-2 border border-zinc-800 bg-zinc-950/50 flex justify-between items-center text-[11px]"
                   >
                     <div className="flex gap-2 items-center">
                        <div className={`w-1 h-1 rounded-full ${r.wasCorrect ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-zinc-600">S{r.levelId}</span>
                     </div>
                     <div className="flex gap-4">
                        <span className="text-zinc-500">I:{r.idealTime.toFixed(1)}s</span>
                        <span className="text-zinc-200">A:{r.timeTaken.toFixed(1)}s</span>
                     </div>
                   </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* Center Panel: Visualization */}
        <main className="col-span-12 md:col-span-6 flex flex-col gap-4 min-h-0">
          <div className="terminal-border relative flex-1 bg-zinc-900 group">
             <div className="absolute inset-0 opacity-5 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
             
             <div className="absolute top-2 left-4 flex gap-4 text-[10px] font-bold text-emerald-500/30">
                <span>RADAR_SWEEP_ACTIVE</span>
                <span>MODE: PREDICTIVE_INTERCEPT</span>
             </div>

             <div className="h-full w-full flex items-center justify-center p-8">
               <VisualizationPanel level={currentLevel} isActive={gameState === 'playing'} />
             </div>
             
             {/* Result Overlay after Trigger */}
             <AnimatePresence>
                {gameState === 'result' && lastResult && (
                  <motion.div 
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                    className="absolute inset-0 z-50 bg-zinc-950/80 flex items-center justify-center p-8 overflow-hidden"
                  >
                    {/* Celebration Background Ray Effect */}
                    {lastResult.accuracy > 99 && (
                       <motion.div 
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{ opacity: 0.1, rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-emerald-500/40 via-transparent to-emerald-500/40 rounded-full blur-[100px]"
                       />
                    )}

                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className={`terminal-border max-w-sm w-full bg-zinc-900 overflow-hidden relative shadow-2xl ${lastResult.accuracy > 99 ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-amber-500/50 shadow-amber-500/20'}`}
                    >
                       <div className={`terminal-header py-3 ${lastResult.accuracy > 99 ? 'bg-emerald-500 text-zinc-950' : 'bg-amber-500 text-zinc-950'}`}>
                          <span className="font-black text-xs italic flex items-center gap-2">
                             {lastResult.accuracy > 99 ? <Trophy className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                             {lastResult.accuracy > 99 ? 'STATUS: PROTOCOL_VALIDATED' : 'STATUS: MARGINAL_OFFSET'}
                          </span>
                       </div>

                       <div className="p-6 space-y-6">
                          <div className="relative">
                            {/* Scanning Animation */}
                            {lastResult.accuracy > 99 && (
                              <motion.div 
                                initial={{ top: '0%' }}
                                animate={{ top: '100%' }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-0.5 bg-emerald-500/50 blur-[2px] z-10"
                              />
                            )}
                            
                            <div className="space-y-1 text-center py-4">
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Calculation_Accuracy</p>
                               <div className="flex items-center justify-center gap-3">
                                  <motion.p 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`text-7xl font-black italic terminal-text-glow ${lastResult.accuracy > 99 ? 'text-emerald-500' : 'text-amber-500'}`}
                                  >
                                    {lastResult.accuracy.toFixed(1)}%
                                  </motion.p>
                                  {lastResult.accuracy > 99 && (
                                    <motion.div
                                      initial={{ x: 20, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: 0.5 }}
                                    >
                                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </motion.div>
                                  )}
                               </div>
                            </div>
                          </div>

                          {lastResult.accuracy > 99 && (
                             <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded text-center"
                             >
                                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                  CONGRATULATIONS: INTERCEPT_SYNC_COMPLETE
                                </p>
                             </motion.div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                             <div className="p-3 border border-zinc-800 bg-zinc-950 flex flex-col gap-1 items-center">
                                <span className="opacity-40">TARGET</span>
                                <span className="text-zinc-100 text-sm">{lastResult.ideal.toFixed(2)}s</span>
                             </div>
                             <div className="p-3 border border-zinc-800 bg-zinc-950 flex flex-col gap-1 items-center">
                                <span className="opacity-40">IDENTIFIED</span>
                                <span className="text-zinc-100 text-sm">{(lastResult.ideal + lastResult.delta).toFixed(2)}s</span>
                             </div>
                          </div>

                          <div className="pt-2">
                            <button 
                              onClick={nextScenario}
                              className={`w-full py-4 transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 group border
                                ${lastResult.accuracy > 99 ? 'bg-emerald-500 text-zinc-950 border-emerald-400 hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700'}
                              `}
                            >
                              PROCEED_NEXT_PROTOCOL <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
                            </button>
                          </div>
                       </div>

                       {/* Interactive Corner Details */}
                       <div className="absolute top-0 right-0 p-1">
                          <div className="w-2 h-2 border-t border-r border-zinc-500/30" />
                       </div>
                       <div className="absolute bottom-0 left-0 p-1">
                          <div className="w-2 h-2 border-b border-l border-zinc-500/30" />
                       </div>
                    </motion.div>
                  </motion.div>
                )}

                {gameState === 'intro' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center text-center p-12"
                  >
                    <div className="space-y-8 max-w-md">
                      <div className="flex justify-center">
                        <div className="relative">
                          <Cpu className="w-20 h-20 text-emerald-500 animate-pulse-slow shadow-[0_0_20px_rgba(16,185,129,0.3)] rounded-full p-4 border border-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-emerald-500 tracking-tighter italic uppercase underline decoration-emerald-500/30">Intercept System</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] max-w-[200px] mx-auto text-center">
                          Calculate the exact moment of clearance. Signal manual trigger.
                        </p>
                      </div>
                      <button 
                        onClick={handleStart}
                        className="w-full py-4 border border-emerald-500 text-emerald-500 font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-zinc-950 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Play className="fill-current w-4 h-4" /> START_OS_BOOT
                      </button>
                    </div>
                  </motion.div>
                )}

                {gameState === 'analysis' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-20 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-8"
                  >
                    <div className="terminal-border max-w-lg w-full bg-zinc-900 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                       <div className="terminal-header bg-emerald-500">
                          <span className="text-zinc-950 font-black text-xs uppercase tracking-tighter italic">FINAL_INTEG_REPORT</span>
                          <span className="text-zinc-950/60 text-[10px]">SESSION_COMPLETE</span>
                       </div>
                       <div className="p-8 space-y-8">
                          <div className="grid grid-cols-2 gap-4 text-center">
                             <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">MEAN_ACCURACY</p>
                                <p className="text-5xl font-black text-emerald-500 italic">{stats.efficiency}%</p>
                             </div>
                             <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-lg">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">SYNC_SUCCESS</p>
                                <p className="text-5xl font-black text-zinc-100 italic">{records.filter(r => r.wasCorrect).length}</p>
                             </div>
                          </div>
                          
                          <div className="space-y-2 max-h-40 overflow-y-auto bg-zinc-950 p-2 border border-zinc-800">
                                {records.map((r, i) => (
                                  <div key={i} className="flex justify-between items-center bg-zinc-900/50 px-3 py-2 border-l-2 border-emerald-500 text-[10px]">
                                    <span className="text-zinc-500">SIM_{r.levelId}</span>
                                    <div className="flex gap-4 font-mono font-bold">
                                      <span className="text-emerald-500">{Math.max(0, 100 - (Math.abs(r.timeTaken - r.idealTime)/r.idealTime)*100).toFixed(1)}% ACC</span>
                                      <span className="text-zinc-400">Δ {Math.abs(r.timeTaken - r.idealTime).toFixed(2)}s</span>
                                    </div>
                                  </div>
                                ))}
                          </div>

                          <button 
                            onClick={resetSimulation}
                            className="w-full py-4 bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3"
                          >
                             REINITIALIZE_GRID <RotateCcw className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* GAME CONTROLS: Option Selection Grid */}
          <div className="terminal-border p-6 bg-zinc-900/80">
            <div className="flex flex-col gap-4">
               {gameState === 'playing' ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {randomizedOptions.map((opt, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOptionSelect(opt)}
                        className={`py-8 border-2 text-2xl font-black uppercase tracking-widest transition-all relative group
                          ${isError ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/5'}
                        `}
                      >
                         <span className="relative z-10">{opt}s</span>
                         <span className="absolute bottom-1 right-2 text-[6px] opacity-10 text-zinc-100 group-hover:opacity-40">SELECT_VAL_{idx}</span>
                      </motion.button>
                    ))}
                 </div>
               ) : (
                 <div className="h-[104px] flex items-center justify-center border-2 border-zinc-800 border-dashed rounded text-zinc-600 font-bold uppercase tracking-widest italic text-xs">
                    {gameState === 'result' ? 'ANALYSIS_IN_PROGRESS' : 'SIGNAL_INTERCEPT_LOCKED'}
                 </div>
               )}
               
               <div className="flex justify-between items-center text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                  <span>Selection_Matrix_Active</span>
                  <span>Select_Estimated_Clearance</span>
               </div>
            </div>
          </div>
        </main>

        {/* Right Panel: Operations Status */}
        <aside className="col-span-12 md:col-span-3 flex flex-col gap-4 min-h-0 h-full">
           <div className="terminal-border p-6 flex flex-col items-center justify-center text-center gap-4 bg-zinc-900/50">
              <div className="p-4 rounded-full border-2 border-zinc-800 bg-zinc-950">
                <Clock className="w-12 h-12 text-zinc-600" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Live_Clock</p>
                 <p className="text-5xl font-black text-zinc-100 tracking-tighter terminal-text-glow tabular-nums">
                    {currentTime.toFixed(1)}<span className="text-lg opacity-40">s</span>
                 </p>
              </div>
           </div>

           <div className="terminal-border p-6 flex-1 flex flex-col gap-6">
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol_Progress</p>
                 <div className="flex gap-2">
                    {LEVELS.map((_, i) => (
                       <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 
                          ${i < currentLevelIdx ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                            i === currentLevelIdx ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-800'}`} 
                       />
                    ))}
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800 flex-1 overflow-y-auto">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Efficiency_Index</p>
                 <div className="flex items-center gap-4">
                    <div className="text-4xl font-black text-emerald-500 italic">{stats.efficiency}%</div>
                    <div className="h-12 w-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                       <motion.div 
                        animate={{ height: `${stats.efficiency}%` }} 
                        className="bg-emerald-500 w-full rounded-full" 
                       />
                    </div>
                 </div>
                 
                 <div className="space-y-2 bg-zinc-950/50 p-3 rounded border border-zinc-800">
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="text-zinc-600">ATTEMPTS_TTL</span>
                       <span className="text-zinc-300 font-bold">{stats.totalAttempts || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="text-zinc-600">MISSION_TTL</span>
                       <span className="text-zinc-300 font-bold">{records.length} / {LEVELS.length}</span>
                    </div>
                 </div>
              </div>

              <div className={`terminal-border p-3 border-emerald-500/20 bg-emerald-500/5 transition-opacity duration-500 ${isError ? 'opacity-100 animate-shake !border-red-500 !bg-red-500/10' : 'opacity-60'}`}>
                 <div className="flex items-center gap-3">
                    {isError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Database className="w-5 h-5 text-emerald-500" />}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-900 leading-none mb-1">
                        {isError ? 'CRC_ERROR' : 'KERNEL_READY'}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono">
                        {isError ? 'PAYLOAD_MISMATCH_RETRY' : 'AWAITING_INPUT_SIGNAL'}
                      </span>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </div>

      <footer className="mt-4 flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            OPERATIONAL_STATUS: NOMINAL
         </div>
         <div>REGION: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center gap-4 bg-zinc-950/50 border border-zinc-800 p-2">
      <span className="text-[9px] font-black text-zinc-600 uppercase">{label}</span>
      <span className="text-[11px] font-bold text-zinc-100">{value}</span>
    </div>
  );
}

function HeaderStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] font-black text-zinc-600">{label}</span>
      <span className={`text-xs font-bold ${color} tracking-widest`}>{value}</span>
    </div>
  );
}

function VisualizationPanel({ level, isActive }: { level: Level, isActive: boolean }) {
  const idealTime = useMemo(() => calculateClearanceTime(
    level.trainALength,
    level.trainASpeedKmH,
    level.platformLength || level.trainBLength || 0,
    level.trainBSpeedKmH || 0,
    level.direction
  ), [level]);

  // Visual velocity mapping
  // We want the tail to pass the center (0px position relative to start) at exactly idealTime
  // Since the animation goes from -550 to 550, the center is at 550px from start.
  // The tail also needs to account for train length scaling (50 units = 1 car = ~50px)
  const animDuration = idealTime * 2; // Arbitrary but keeps things relative

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative overflow-hidden bg-zinc-950/40">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 flex flex-col justify-between opacity-5">
         {Array.from({length: 8}).map((_, i) => (
           <div key={i} className="border-b border-emerald-500 w-full" />
         ))}
      </div>

      <div className="relative w-full h-96 flex flex-col items-center justify-center overflow-hidden z-10">
        
        {/* Level Path Rendering */}
        <div className="w-full relative py-16 flex flex-col gap-16">
          
          {/* TRACK 02 (Visual Background) */}
          {level.id === 3 && (
            <div className="relative w-full h-16 flex items-center">
               <div className="track-ballast !h-20 opacity-60" />
               <div className="train-track !h-[18px] shadow-[0_0_25px_rgba(0,0,0,0.8)] opacity-60" />
               <div className="train-rails !h-[18px] opacity-60" />
               <motion.div 
                 initial={{ x: 650 }}
                 animate={isActive ? { x: -650 } : { x: 650 }}
                 transition={{ duration: animDuration * 0.8, repeat: Infinity, ease: "linear" }}
                 className="flex absolute left-0 flex-row-reverse z-40"
               >
                 <TrainUnit 
                   color="amber" 
                   length={(level.trainBLength || 100) / 50} 
                   speed={level.trainBSpeedKmH}
                   distance={level.trainBLength}
                   isFlipped 
                 />
               </motion.div>
            </div>
          )}

          {/* TRACK 01 (Visual Foreground / Front) */}
          <div className="relative w-full h-16 flex items-center">
            <div className="track-ballast !h-20" />
            <div className="train-track !h-[18px] shadow-[0_0_25px_rgba(0,0,0,0.8)]" />
            <div className="train-rails !h-[18px]" />
            
            {/* PLATFORM / SENSOR POINT */}
            {level.id === 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30">
                <div className="h-14 w-2 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
                <div className="bg-zinc-950 border border-amber-500 px-3 py-1 text-[10px] text-amber-500 font-black tracking-widest uppercase text-center">
                  OBS_PT_01
                </div>
              </div>
            )}

            {level.id === 2 && (
              <div className="absolute left-1/2 -translate-x-1/2 w-[500px] h-16 border-x-4 border-zinc-700 bg-zinc-800/20 flex items-end justify-center pb-2 z-0 translate-y-[-4px]">
                 <div className="flex gap-6">
                    {Array.from({length: 12}).map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-zinc-800 rounded-sm" />
                    ))}
                 </div>
                 <div className="absolute -top-6 w-full text-center">
                    <span className="text-[9px] text-zinc-500 font-bold tracking-[0.5em] uppercase">STATION_MANIFEST_ZONE</span>
                 </div>
              </div>
            )}

            {/* TRAIN A */}
            <motion.div 
               initial={{ x: -650 }}
               animate={isActive ? { x: 650 } : { x: -650 }}
               transition={{ duration: animDuration, repeat: Infinity, ease: "linear" }}
               className="flex absolute left-0 z-40"
            >
               <TrainUnit 
                  color="emerald" 
                  length={level.trainALength / 50} 
                  speed={level.trainASpeedKmH}
                  distance={level.trainALength}
               />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
         <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Aptitude_Telemetry</span>
         <div className="flex gap-1 items-end h-6">
            {Array.from({length: 6}).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [4, 20, 8, 24, 6] }}
                transition={{ duration: 0.8 + i * 0.15, repeat: Infinity }}
                className="w-1 bg-emerald-500/20 rounded-full"
              />
            ))}
         </div>
      </div>
    </div>
  );
}

function TrainUnit({ color, length, speed, distance, isFlipped = false }: { color: 'emerald' | 'amber', length: number, speed?: number, distance?: number, isFlipped?: boolean }) {
  const cars = Math.max(1, Math.floor(length));
  const baseColor = color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600';
  const carColor = color === 'emerald' ? 'bg-emerald-800' : 'bg-amber-800';
  const accentText = color === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
  const accentBorder = color === 'emerald' ? 'border-emerald-500' : 'border-amber-500';

  return (
    <div className="relative group/train">
      {/* High-Intensity Red Telemetry Labels on top of Engine */}
      <div className={`absolute -top-16 ${isFlipped ? 'right-0' : 'left-0'} flex flex-col gap-1.5 whitespace-nowrap z-50 w-28 items-center`}>
         {speed !== undefined && (
            <div className="text-[12px] font-black px-3 py-1 border-b-4 border-red-500 text-red-500 bg-zinc-950 shadow-[0_6px_15px_rgba(239,68,68,0.3)] w-full text-center uppercase tracking-tight">
               VEL: {speed} KM/H
            </div>
         )}
         {distance !== undefined && (
            <div className="text-[12px] font-black px-3 py-1 border-b-4 border-red-500 text-red-500 bg-zinc-950 shadow-[0_6px_15px_rgba(239,68,68,0.3)] w-full text-center uppercase tracking-tight">
               LEN: {distance}M
            </div>
         )}
      </div>

      <div className={`flex items-center gap-[4px] ${!isFlipped ? 'flex-row-reverse' : ''}`}>
         {/* Engine */}
         <div className={`relative h-10 w-24 ${baseColor} border border-zinc-950 ${isFlipped ? 'rounded-l-md' : 'rounded-r-md'} flex items-center shadow-[0_6px_15px_rgba(0,0,0,0.5)]`}>
            <div className={`absolute ${isFlipped ? 'right-3' : 'left-3'} top-2 h-4 w-6 bg-zinc-950/40 border border-zinc-900 border-2`} />
            <div className={`absolute ${isFlipped ? 'left-2' : 'right-2'} top-2 flex flex-col gap-1.5`}>
               <div className="w-2.5 h-1.5 bg-zinc-950/20" />
               <div className="w-2.5 h-1.5 bg-zinc-950/20" />
            </div>
            {/* Headlight */}
            <div className={`absolute ${isFlipped ? 'left-[-4px]' : 'right-[-4px]'} top-3 w-2 h-4 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,1)] rounded-full`} />
         </div>
         
         {/* Cars */}
         {Array.from({ length: cars }).map((_, i) => (
           <div key={i} className={`relative h-8 w-20 ${carColor} border border-zinc-950 flex items-center justify-around px-2 shadow-[0_4px_8px_rgba(0,0,0,0.3)]`}>
              <div className="w-4 h-4 bg-zinc-950/30 border-x border-zinc-900" />
              <div className="w-4 h-4 bg-zinc-950/30 border-x border-zinc-900" />
              <div className="w-4 h-4 bg-zinc-950/30 border-x border-zinc-900" />
           </div>
         ))}
      </div>
    </div>
  );
}
