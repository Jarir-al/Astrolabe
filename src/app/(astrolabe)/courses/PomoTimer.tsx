"use client";
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function PomodoroTimer() {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('Study'); 
    useEffect(() => {
      let interval: ReturnType<typeof setInterval> | null = null;
      if (isActive) {
        interval = setInterval(() => {
          if (seconds > 0) {
            setSeconds(seconds - 1);
          } else if (minutes > 0) {
            setMinutes(minutes - 1);
            setSeconds(59);
          } else {
            setIsActive(false);
            // Optional: Add a notification sound here
            alert(`${mode} session finished!`);
          }
        }, 1000);
      } else if (interval) {
        clearInterval(interval);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isActive, seconds, minutes, mode]);
  
    const switchMode = (newMode: string, time: number) => {
      setMode(newMode);
      setMinutes(time);
      setSeconds(0);
      setIsActive(false);
    };
  
    return (
      <div className="bg-zinc-900 p-8 rounded-xl text-white w-full border border-white/10 shadow-2xl">
        <div className="flex gap-2 mb-6">
          <button onClick={() => switchMode('Study', 25)} className={`px-4 py-1 text-xs font-bold uppercase rounded-full border transition-colors cursor-pointer ${mode === 'Study' ? 'bg-white text-black' : 'border-white/20 hover:border-white/40'}`}>25-5</button>
          <button onClick={() => switchMode('Study', 45)} className={`px-4 py-1 text-xs font-bold uppercase rounded-full border transition-colors cursor-pointer ${mode === 'Study' ? 'bg-white text-black' : 'border-white/20 hover:border-white/40'}`}>45-15</button>
          <button onClick={() => switchMode('Break', 5)} className="px-4 py-1 text-xs font-bold uppercase rounded-full border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">Break</button>
        </div>
  
        <div className="text-8xl font-black tracking-tighter mb-6 tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
  
        <div className="flex gap-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-amber-500 font-black uppercase hover:bg-amber-400 transition-colors rounded-lg cursor-pointer text-black"
          >
            {isActive ? <Pause /> : <Play />} {isActive ? 'Pause' : 'Start'}
          </button>
          <button 
            onClick={() => { setIsActive(false); setMinutes(25); setSeconds(0); }}
            className="p-4 bg-white/10 hover:bg-white/20 transition-colors rounded-lg cursor-pointer"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
}
