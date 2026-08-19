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
          <div className="absolute -inset-1 animate-pulse-glow rounded-full bg-cyan/20 blur-sm" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl animate-glitch-hover cursor-default uppercase">
            CAMPUS<span className="text-cyan">HUNT</span> <span className="text-cyan/50 text-xs align-top font-mono">2026</span>
          </h1>
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-cyan/70">
            Freshers' Grand Adventure
          </p>
        </div>
      </div>

      <div className="animate-rise stagger-1 mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="chip chip-live animate-pulse-glow">GAME IS LIVE</div>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan/30 to-transparent" />
        </div>
        <h2 className="font-display text-[2.2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.8rem]">
          <span className="inline-block animate-typing border-r-4 border-cyan pr-2">START YOUR QUEST</span>
        </h2>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-mute font-light">
          Welcome Freshers! Solve the riddles, find the hidden spots on campus, and win the treasure.
          Ready to begin?
        </p>
      </div>

      <div className="mt-10 grid gap-4">
        <button
          type="button"
          className="glass glow-border animate-rise stagger-2 group relative overflow-hidden rounded-2xl p-6 text-left"
          onClick={onParticipant}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="scanning-line opacity-0 transition-opacity group-hover:opacity-20" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-magenta/80">
                PATH :: PLAYER
              </p>
              <p className="font-display mt-1 text-2xl font-black text-white tracking-wide">
                HUNTING TEAM
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-cyan/40">LEVEL</span>
              <span className="font-mono text-xl font-bold text-cyan">01</span>
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-white/5" />
          <p className="mt-4 text-xs leading-relaxed text-mute group-hover:text-text transition-colors">
            Solve campus riddles, find the secret codes, and race to the finish line.
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-cyan group-hover:text-white transition-colors">
              [ JOIN THE HUNT ]
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
          </div>
        </button>

        <button
          type="button"
          className="glass glow-border animate-rise stagger-3 group relative overflow-hidden rounded-2xl p-6 text-left"
          onClick={onJudge}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="scanning-line opacity-0 transition-opacity group-hover:opacity-20" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-violet/80">
                PATH :: ADMIN
              </p>
              <p className="font-display mt-1 text-2xl font-black text-white tracking-wide">
                GAME MASTER
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-violet/40">SECURE</span>
              <span className="font-mono text-xl font-bold text-violet">02</span>
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-white/5" />
          <p className="mt-4 text-xs leading-relaxed text-mute group-hover:text-text transition-colors">
            View live scores, manage teams, and monitor the hunt progress.
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-violet group-hover:text-white transition-colors">
              [ OPEN DASHBOARD ]
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-violet animate-pulse" />
          </div>
        </button>
      </div>


    </div>
  );
}
