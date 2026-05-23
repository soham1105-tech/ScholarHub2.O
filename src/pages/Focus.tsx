import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';

export default function Focus() {
  const { isFocusLocked, setIsFocusLocked } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(90 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [monkMode, setMonkMode] = useState(true);
  const [activeSound, setActiveSound] = useState('rain');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  // --- Real Personal Adaptive Audio Engine via Web Audio API ---
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [soundVolume, setSoundVolume] = useState(40); // 0 to 100
  const [brainwave, setBrainwave] = useState<'alpha' | 'theta' | 'beta' | 'gamma'>('alpha');
  const [breathingSync, setBreathingSync] = useState(false);
  const [filterIntensity, setFilterIntensity] = useState(60); // 0 to 100

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<any[]>([]);
  const intervalsRef = useRef<any[]>([]);

  // Function to get specific beat frequency depending on personal state selection
  const getBrainwaveFreq = (wave: 'alpha' | 'theta' | 'beta' | 'gamma') => {
    if (wave === 'alpha') return 10;   // 10 Hz for Flow & Focus
    if (wave === 'theta') return 6;    // 6 Hz for Deep Memory & Creativity
    if (wave === 'beta') return 15;    // 15 Hz for Cognitive Alertness
    if (wave === 'gamma') return 40;   // 40 Hz for Peak Analytical Focus
    return 10;
  };

  const stopAudio = () => {
    activeNodesRef.current.forEach(node => {
      try { node.stop(); } catch(e){}
      try { node.disconnect(); } catch(e){}
    });
    activeNodesRef.current = [];
    intervalsRef.current.forEach(int => clearInterval(int));
    intervalsRef.current = [];
  };

  // Helper to start Binaural Beats (pure stereophonic difference frequency)
  const startBinauralBeats = (ctx: AudioContext, master: AudioNode, baseFreq: number, beatFreq: number) => {
    const merger = ctx.createChannelMerger(2);
    
    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = baseFreq - beatFreq / 2;

    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = baseFreq + beatFreq / 2;

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = 0.45;
    rightGain.gain.value = 0.45;

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);

    leftGain.connect(merger, 0, 0); // left ear
    rightGain.connect(merger, 0, 1); // right ear

    merger.connect(master);

    leftOsc.start();
    rightOsc.start();

    activeNodesRef.current.push(leftOsc, rightOsc);
  };

  // 1. Synthesizer for Rain Drops & Mist Filter
  const startRainSynth = (ctx: AudioContext, master: AudioNode) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400 + (filterIntensity * 8);

    noiseSource.connect(filter);
    filter.connect(master);
    noiseSource.start();
    activeNodesRef.current.push(noiseSource);

    // Synthesis of randomized soft raindrops/clicks
    const pitterOsc = ctx.createOscillator();
    pitterOsc.type = 'sine';
    pitterOsc.frequency.value = 750;
    
    const pitterGain = ctx.createGain();
    pitterGain.gain.setValueAtTime(0, ctx.currentTime);
    pitterOsc.connect(pitterGain);
    pitterGain.connect(master);
    pitterOsc.start();
    activeNodesRef.current.push(pitterOsc);

    const interval = setInterval(() => {
      const time = ctx.currentTime;
      pitterOsc.frequency.setValueAtTime(300 + Math.random() * 850, time);
      pitterGain.gain.setValueAtTime(0, time);
      pitterGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.05, time + 0.04);
      pitterGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    }, 380);
    intervalsRef.current.push(interval);
  };

  // 2. Deep Library Study Chamber (Brown noise rumble + high focus binaural sync)
  const startLibrarySynth = (ctx: AudioContext, master: AudioNode) => {
    const bufferSize = 4 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.8; 
    }

    const brownSource = ctx.createBufferSource();
    brownSource.buffer = noiseBuffer;
    brownSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 160 + (filterIntensity * 2.5);

    brownSource.connect(filter);
    filter.connect(master);
    brownSource.start();
    activeNodesRef.current.push(brownSource);

    // Occasional low volume paper turn / soft key press
    const keyOsc = ctx.createOscillator();
    keyOsc.type = 'triangle';
    keyOsc.frequency.value = 180;
    const keyGain = ctx.createGain();
    keyGain.gain.setValueAtTime(0, ctx.currentTime);
    keyOsc.connect(keyGain);
    keyGain.connect(master);
    keyOsc.start();
    activeNodesRef.current.push(keyOsc);

    const intVal = setInterval(() => {
      const time = ctx.currentTime;
      keyOsc.frequency.setValueAtTime(90 + Math.random() * 300, time);
      keyGain.gain.setValueAtTime(0, time);
      keyGain.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.03, time + 0.15);
      keyGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.1);
    }, 5500);
    intervalsRef.current.push(intVal);

    // Sync a soft binaural wave
    startBinauralBeats(ctx, master, 180, getBrainwaveFreq(brainwave));
  };

  // 3. Clinical White Focus Noise modulated by premium selected Brainwaves
  const startNoiseSynth = (ctx: AudioContext, master: AudioNode) => {
    // Binaural Core
    startBinauralBeats(ctx, master, 130, getBrainwaveFreq(brainwave));

    // Dynamic White stream passing through bandpass filter
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
       output[i] = Math.random() * 2 - 1;
    }
    const whiteSource = ctx.createBufferSource();
    whiteSource.buffer = noiseBuffer;
    whiteSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500 + (filterIntensity * 5);
    filter.Q.value = 0.85;

    const whiteGain = ctx.createGain();
    whiteGain.gain.value = 0.08;

    whiteSource.connect(filter);
    filter.connect(whiteGain);
    whiteGain.connect(master);
    whiteSource.start();

    activeNodesRef.current.push(whiteSource);
  };

  // 4. Vintage Warm Lo-fi Analog chord loop and vinyl surface dynamic hum
  const startLofiSynth = (ctx: AudioContext, master: AudioNode) => {
    const studyChords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
      [174.61, 220.00, 261.63, 329.63]  // Fmaj7 (F3, A3, C4, E4)
    ];

    const polyOscs: any[] = [];
    const polyGains: any[] = [];

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(master);
      osc.start();

      polyOscs.push(osc);
      polyGains.push(oscGain);
      activeNodesRef.current.push(osc);
    }

    let chordIdx = 0;
    const playChordSequence = () => {
      const time = ctx.currentTime;
      const notes = studyChords[chordIdx];
      
      // Customize glide and warmth
      const richnessMod = 1 + (filterIntensity - 50) / 200; // soft speed multiplier
      
      for (let i = 0; i < 4; i++) {
        polyOscs[i].frequency.setValueAtTime(notes[i], time);
        polyGains[i].gain.setValueAtTime(polyGains[i].gain.value, time);
        polyGains[i].gain.linearRampToValueAtTime(0.12 * richnessMod, time + 2.0);
        polyGains[i].gain.linearRampToValueAtTime(0.01, time + 5.5);
      }
      chordIdx = (chordIdx + 1) % studyChords.length;
    };

    playChordSequence();
    const chordInterval = setInterval(playChordSequence, 6000);
    intervalsRef.current.push(chordInterval);

    // Pure analog static vinyl surface scratch generator
    const scratchInterval = setInterval(() => {
      const time = ctx.currentTime;
      const statOsc = ctx.createOscillator();
      statOsc.type = 'sine';
      statOsc.frequency.setValueAtTime(80 + Math.random() * 2500, time);
      
      const statGain = ctx.createGain();
      statGain.gain.setValueAtTime(0.001 + Math.random() * 0.003, time);
      statOsc.connect(statGain);
      statGain.connect(master);
      statOsc.start();
      statGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

      setTimeout(() => {
        try { statOsc.stop(); statOsc.disconnect(); } catch(e){}
      }, 60);
    }, 220);
    intervalsRef.current.push(scratchInterval);
  };

  const setupAndPlayRealAudio = () => {
    stopAudio();
    
    // Create AudioContext if not instantiated
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Master Volume Control node
    const master = ctx.createGain();
    master.gain.value = soundVolume / 100;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // Trigger individual custom audio generators
    if (activeSound === 'rain') {
      startRainSynth(ctx, master);
    } else if (activeSound === 'library') {
      startLibrarySynth(ctx, master);
    } else if (activeSound === 'noise') {
      startNoiseSynth(ctx, master);
    } else if (activeSound === 'lofi') {
      startLofiSynth(ctx, master);
    }
  };

  // Automatic Audio generator restart whenever settings shift and synth state is active
  useEffect(() => {
    if (isPlayingSound) {
      setupAndPlayRealAudio();
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [activeSound, brainwave, filterIntensity, isPlayingSound]);

  // Handle immediate volume sliders
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current && !breathingSync) {
      masterGainRef.current.gain.value = soundVolume / 100;
    }
  }, [soundVolume, breathingSync]);

  // Breathing Cardiac Coherence rhythm tracker - oscillates volume down and up to guide user breathing 
  useEffect(() => {
    let breathInterval: any = null;
    if (isPlayingSound && breathingSync && audioCtxRef.current && masterGainRef.current) {
      const runCoherenceCycle = () => {
        if (!masterGainRef.current || !audioCtxRef.current) return;
        const time = audioCtxRef.current.currentTime;
        const preferredVolume = soundVolume / 100;
        
        // 5s Inhale: Gently ramp volume to peak focus
        masterGainRef.current.gain.linearRampToValueAtTime(preferredVolume, time + 5);
        // 5s Exhale: Gently contract volume down to 35% of peak
        masterGainRef.current.gain.linearRampToValueAtTime(preferredVolume * 0.35, time + 10);
      };

      runCoherenceCycle();
      breathInterval = setInterval(runCoherenceCycle, 10000);
    } else {
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = soundVolume / 100;
      }
    }
    return () => {
      if (breathInterval) clearInterval(breathInterval);
    };
  }, [breathingSync, isPlayingSound, soundVolume]);
  // -----------------------------------------------------------------




  // Handle continuous hold for 3 seconds to trigger emergency exit
  useEffect(() => {
    let interval: any = null;
    if (isHolding && hasStarted) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsHolding(false);
            // Emergency Exit Action
            localStorage.removeItem('focus_end_time');
            setIsFocusLocked(false);
            setHasStarted(false);
            setIsRunning(false);
            setSecondsLeft(90 * 60);
            return 0;
          }
          return prev + 4; // 120ms intervals -> takes 3 seconds
        });
      }, 120);
    } else {
      setHoldProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, hasStarted, setIsFocusLocked]);

  // Load state on mount if already locked
  useEffect(() => {
    const savedEndTime = localStorage.getItem('focus_end_time');
    if (savedEndTime) {
      const parsedEndTime = Number(savedEndTime);
      const timeLeft = Math.ceil((parsedEndTime - Date.now()) / 1000);
      if (timeLeft > 0) {
        setSecondsLeft(timeLeft);
        setHasStarted(true);
        setIsRunning(true);
        setIsFocusLocked(true);
      } else {
        localStorage.removeItem('focus_end_time');
        setIsFocusLocked(false);
      }
    }
  }, [setIsFocusLocked]);

  // Handle countdown with dynamic end_time verification to prevent skew/drift
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        const savedEndTime = localStorage.getItem('focus_end_time');
        if (savedEndTime) {
          const timeLeft = Math.ceil((Number(savedEndTime) - Date.now()) / 1000);
          if (timeLeft <= 0) {
            setIsRunning(false);
            setHasStarted(false);
            setIsFocusLocked(false);
            setSecondsLeft(0);
            localStorage.removeItem('focus_end_time');
          } else {
            setSecondsLeft(timeLeft);
          }
        } else {
          // Fallback if no stored time
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              setHasStarted(false);
              setIsFocusLocked(false);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, setIsFocusLocked]);



  const totalSeconds = 90 * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const sounds = [
    { id: 'rain', label: 'Rain', icon: 'volume-high' },
    { id: 'library', label: 'Library', icon: 'volume-high' },
    { id: 'noise', label: 'Noise', icon: 'volume-high' },
    { id: 'lofi', label: 'Lo-fi', icon: 'headphones' },
  ];

  return (
    <div className={`page-transition premium-gradient min-h-screen transition-all duration-1000 ${monkMode ? 'brightness-[0.8] saturate-[1.2]' : ''}`}>
      <TopBar title="Deep Focus" />
      
      <main className="p-6 pt-[100px] pb-[120px] max-w-lg mx-auto space-y-6">
        {/* Goal Indicator */}
        <div className="flex justify-center">
          <div className="ios-glass px-5 py-2 rounded-full border border-forest-accent/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-forest-accent animate-pulse" />
            <span className="text-[13px] font-bold text-text-primary tracking-wide uppercase">Goal: 180 / 300 min</span>
          </div>
        </div>

        {/* Timer UI - Premium Circular Progress */}
        <section className="ios-card p-10 flex flex-col items-center relative overflow-hidden">
          {monkMode && (
            <div className="absolute inset-0 bg-forest-accent/5 transition-opacity duration-1000 pointer-events-none" />
          )}
          
          <div className="relative w-64 h-64 mb-10">
            <svg viewBox="0 0 280 280" className="w-full h-full drop-shadow-[0_0_20px_rgba(74,222,128,0.2)]">
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="rgba(74, 222, 128, 0.05)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="#4ade80"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 140 140)"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset, transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[56px] font-light text-white tabular-nums tracking-tighter font-display leading-none">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-[12px] font-bold tracking-[0.2em] text-text-muted uppercase mt-2">REMAINING</span>
            </div>
          </div>

          <div className="text-center w-full space-y-1">
            <h2 className="text-[20px] font-bold text-white tracking-tight">Physics Lab Report</h2>
            <p className="text-[14px] text-forest-accent font-semibold uppercase tracking-widest opacity-80">Phase 02: Analysis</p>
          </div>

          <div className="flex gap-4 w-full mt-8">
            <button 
              onClick={() => {
                if (!hasStarted) {
                  const endTime = Date.now() + 90 * 60 * 1000;
                  localStorage.setItem('focus_end_time', String(endTime));
                  setIsFocusLocked(true);
                  setHasStarted(true);
                  setIsRunning(true);
                }
              }}
              disabled={hasStarted}
              className={`flex-1 h-14 ios-button font-bold text-[16px] shadow-lg transition-all ${
                hasStarted 
                  ? 'bg-white/5 text-text-muted border border-white/5 cursor-not-allowed opacity-60' 
                  : 'bg-forest-accent text-forest-bg hover:opacity-90 active:scale-95'
              }`}
            >
              {hasStarted ? (
                <span className="flex items-center justify-center gap-2">
                  <SVGIcon name="lock" className="w-4 h-4 text-forest-accent animate-pulse" />
                  Focus Session Locked...
                </span>
              ) : 'Start Focus Session'}
            </button>
            <button 
              onClick={() => {
                if (!hasStarted) {
                  setSecondsLeft(90 * 60);
                  setIsRunning(false);
                }
              }}
              disabled={hasStarted}
              className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center ios-button border border-white/10 transition-all ${
                hasStarted ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95'
              }`}
              title={hasStarted ? 'Cannot reset live focus session' : 'Reset timer'}
            >
              <SVGIcon name="stop" className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {hasStarted && (
            <div className="mt-6 w-full flex flex-col items-center gap-2 animate-pulse">
              <button
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setIsHolding(true);
                }}
                onTouchEnd={() => setIsHolding(false)}
                style={{ touchAction: 'none' }}
                className="relative overflow-hidden w-full h-12 rounded-2xl bg-forest-critical/10 border border-forest-critical/20 hover:bg-forest-critical/15 text-forest-critical active:scale-95 transition-all text-[13px] font-bold tracking-wider uppercase select-none cursor-pointer flex items-center justify-center gap-2"
              >
                {/* Progress fill */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-forest-critical/20 transition-all duration-100 ease-linear pointer-events-none"
                  style={{ width: `${holdProgress}%` }}
                />
                <SVGIcon name="lock" className="w-4 h-4 animate-bounce" />
                <span>{isHolding ? `Holding (${Math.max(1, Math.ceil((100 - holdProgress) / 33.3))}s)...` : 'Hold to Emergency Unlock'}</span>
              </button>
              <p className="text-[11px] text-text-muted text-center max-w-xs leading-relaxed">
                Emergency override will cancel early. Regular sessions build long-term focus.
              </p>
            </div>
          )}
        </section>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 gap-4">
          <section className="ios-card p-5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${monkMode ? 'bg-forest-accent/20 text-forest-accent shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'bg-white/5 text-text-faint'}`}>
                <SVGIcon name="lock" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-white">Monk Mode</h3>
                <p className="text-[12px] text-text-muted font-medium">{monkMode ? 'Isolation active' : 'Notifications enabled'}</p>
              </div>
            </div>
            <button 
              onClick={() => setMonkMode(!monkMode)}
              className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${monkMode ? 'bg-forest-accent shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${monkMode ? 'translate-x-7' : 'translate-x-0'} shadow-md`} />
            </button>
          </section>

          <section className="ios-card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                <SVGIcon name="headphones" className="w-4.5 h-4.5 text-forest-accent animate-pulse" />
                Adaptive Sound
              </h3>
              
              {/* Actual Audio Toggle Player */}
              <button 
                onClick={() => {
                  setIsPlayingSound(!isPlayingSound);
                  // Ensure we initialize AudioContext securely via click interaction
                  if (!isPlayingSound) {
                    setTimeout(() => {
                      setupAndPlayRealAudio();
                    }, 50);
                  } else {
                    stopAudio();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                  isPlayingSound 
                    ? 'bg-forest-accent/20 border-forest-accent/30 text-forest-accent shadow-[0_0_10px_rgba(74,222,128,0.2)] animate-pulse' 
                    : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'
                }`}
              >
                <div className="flex gap-0.5 items-end justify-center w-3 h-3">
                  <div className={`w-0.5 bg-current rounded-full transition-all ${isPlayingSound ? 'h-3 animate-[pulse_0.6s_infinite_alternate]' : 'h-1.5'}`} />
                  <div className={`w-0.5 bg-current rounded-full transition-all ${isPlayingSound ? 'h-2 animate-[pulse_0.4s_infinite_alternate_-0.2s]' : 'h-1.5'}`} />
                  <div className={`w-0.5 bg-current rounded-full transition-all ${isPlayingSound ? 'h-3.5 animate-[pulse_0.8s_infinite_alternate_-0.4s]' : 'h-1.5'}`} />
                </div>
                <span>{isPlayingSound ? 'Sound Active' : 'Start Audio'}</span>
              </button>
            </div>

            {/* Sound Selector Grid */}
            <div className="grid grid-cols-4 gap-2">
              {sounds.map(sound => (
                <button
                  key={sound.id}
                  onClick={() => {
                    setActiveSound(sound.id);
                    // Seamlessly restart/play on select if already active
                    if (isPlayingSound) {
                      setTimeout(() => setupAndPlayRealAudio(), 50);
                    } else {
                      setIsPlayingSound(true);
                    }
                  }}
                  className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ios-button ${
                    activeSound === sound.id 
                    ? 'bg-forest-accent/25 text-forest-accent border border-forest-accent/45 shadow-[0_4px_12px_rgba(74,222,128,0.1)]' 
                    : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/8'
                  }`}
                >
                  <SVGIcon name={sound.id === 'lofi' ? 'headphones' : 'volume-high'} className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{sound.label}</span>
                </button>
              ))}
            </div>

            {/* Real Audio Synthesis Control Deck (visible on active sound or expanded always for high-fidelity engagement) */}
            <div className="pt-2 border-t border-white/5 space-y-4">
              
              {/* Dynamic Volume Slider & Sound Wave */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px] font-bold text-text-muted">
                  <span>AMBIENT LEVEL</span>
                  <span className="font-mono text-white">{soundVolume}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-forest-accent focus:outline-none"
                />
              </div>

              {/* Dynamic Soundspace filter Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px] font-bold text-text-muted">
                  <span>SOUNDSPACE MIST / COMPLEXITY</span>
                  <span className="font-mono text-white">{filterIntensity}%</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  value={filterIntensity}
                  onChange={(e) => setFilterIntensity(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-forest-accent focus:outline-none"
                />
              </div>

              {/* Personal Brainwave Focus Customization */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold tracking-wider text-text-faint uppercase">BRAINWAVE TUNER (BINAURAL DIFFERENTIALS)</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBrainwave('alpha')}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      brainwave === 'alpha'
                        ? 'bg-forest-accent/15 border-forest-accent/30 text-white'
                        : 'bg-white/5 border-transparent text-text-muted hover:bg-white/8'
                    }`}
                  >
                    <div className="text-[12px] font-bold">Alpha (10Hz)</div>
                    <div className="text-[9px] text-text-faint font-medium">Flow state & smooth studying</div>
                  </button>
                  <button
                    onClick={() => setBrainwave('theta')}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      brainwave === 'theta'
                        ? 'bg-forest-accent/15 border-forest-accent/30 text-white'
                        : 'bg-white/5 border-transparent text-text-muted hover:bg-white/8'
                    }`}
                  >
                    <div className="text-[12px] font-bold">Theta (6Hz)</div>
                    <div className="text-[9px] text-text-faint font-medium">Deep retention & creativity</div>
                  </button>
                  <button
                    onClick={() => setBrainwave('beta')}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      brainwave === 'beta'
                        ? 'bg-forest-accent/15 border-forest-accent/30 text-white'
                        : 'bg-white/5 border-transparent text-text-muted hover:bg-white/8'
                    }`}
                  >
                    <div className="text-[12px] font-bold">Beta (15Hz)</div>
                    <div className="text-[9px] text-text-faint font-medium">High alert analytic logic</div>
                  </button>
                  <button
                    onClick={() => setBrainwave('gamma')}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      brainwave === 'gamma'
                        ? 'bg-forest-accent/15 border-forest-accent/30 text-white'
                        : 'bg-white/5 border-transparent text-text-muted hover:bg-white/8'
                    }`}
                  >
                    <div className="text-[12px] font-bold">Gamma (40Hz)</div>
                    <div className="text-[9px] text-text-faint font-medium">Problem solving synthesis</div>
                  </button>
                </div>
              </div>

              {/* Coherence / Respiratory Pace Sync */}
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full bg-forest-accent ${isPlayingSound && breathingSync ? 'animate-[ping_2s_infinite]' : ''}`} />
                    <span className="text-[13px] font-bold text-white">HRV Breathing Coherence</span>
                  </div>
                  <button 
                    onClick={() => setBreathingSync(!breathingSync)}
                    className={`w-10 h-5.5 rounded-full transition-all flex items-center px-0.5 ${breathingSync ? 'bg-forest-accent' : 'bg-white/10'}`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${breathingSync ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                  Modulates ambient output volume automatically to match a perfect 10-second cardiac-coherence cycle (5s inhale rise, 5s exhale fall) to calm anxiety and prevent cognitive exhaustion under monk mode.
                </p>
              </div>

            </div>
          </section>


        </div>
      </main>

      <BottomNav />
    </div>
  );
}
