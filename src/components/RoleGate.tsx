import { BrandMark } from "./BrandMark";

interface RoleGateProps {
  onParticipant: () => void;
  onJudge: () => void;
}

export function RoleGate({ onParticipant, onJudge }: RoleGateProps) {
  return (
    <div className="animate-fade-in mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <div className="animate-rise flex items-center gap-3">
        <div className="relative">
          <BrandMark size="lg" className="animate-float" />
          <div className="absolute -inset-1 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl animate-glitch-hover cursor-default uppercase">
            CAMPUS<span className="text-cyan-600">HUNT</span>
          </h1>
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-slate-500">
            Freshers' Treasure Hunt 2026
          </p>
        </div>
      </div>

      <div className="animate-rise stagger-1 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="neo-btn px-3 py-1 rounded-full text-[0.6rem] uppercase tracking-widest">READY TO PLAY</div>
          <div className="h-0.5 flex-1 bg-slate-300 rounded-full" />
        </div>
        <h2 className="font-display text-[2.2rem] font-bold leading-[1.1] tracking-tight text-slate-800 sm:text-[2.8rem]">
          Join the Hunt
        </h2>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-slate-600 font-light">
          Welcome Freshers! Solve the riddles, find the hidden spots on campus, and win the treasure.
          Are you ready?
        </p>
      </div>

      <div className="mt-10 grid gap-6">
        <button
          type="button"
          className="neo-convex group relative rounded-3xl p-8 text-left"
          onClick={onParticipant}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-cyan-600">
                PATH :: PLAYER
              </p>
              <p className="font-display mt-1 text-2xl font-black text-slate-800 tracking-wide">
                HUNTING TEAM
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-slate-400 uppercase">Action</span>
              <span className="font-mono text-xl font-bold text-cyan-600">01</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 group-hover:text-slate-800 transition-colors">
            Log in with your team number to see your first riddle and start the game.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <span className="neo-concave px-4 py-2 rounded-xl font-mono text-[0.65rem] font-bold uppercase tracking-widest text-cyan-600">
              ENTER GAME
            </span>
            <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </div>
        </button>

        <button
          type="button"
          className="neo-convex group relative rounded-3xl p-8 text-left"
          onClick={onJudge}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-indigo-600">
                PATH :: ADMIN
              </p>
              <p className="font-display mt-1 text-2xl font-black text-slate-800 tracking-wide">
                GAME MASTER
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-slate-400 uppercase">Admin</span>
              <span className="font-mono text-xl font-bold text-indigo-600">02</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 group-hover:text-slate-800 transition-colors">
            For organizers to see live scores and manage the treasure hunt stops.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <span className="neo-concave px-4 py-2 rounded-xl font-mono text-[0.65rem] font-bold uppercase tracking-widest text-indigo-600">
              ADMIN LOGIN
            </span>
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
        </button>
      </div>
    </div>
  );
}
