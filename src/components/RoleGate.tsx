import { BrandMark } from "./BrandMark";

interface RoleGateProps {
  onParticipant: () => void;
  onJudge: () => void;
}

export function RoleGate({ onParticipant, onJudge }: RoleGateProps) {
  return (
    <div className="animate-fade-in mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <div className="animate-rise flex items-center gap-3">
        <BrandMark size="lg" className="animate-float" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl animate-glitch-hover cursor-default">
            Field Hunt <span className="text-cyan text-sm align-top">2026</span>
          </h1>
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-cyan animate-pulse-glow">
            Advanced Computing Freshers Edition
          </p>
        </div>
      </div>

      <div className="animate-rise stagger-1 mt-8">
        <div className="chip chip-live mb-4 animate-pulse-glow">System Active</div>
        <h2 className="font-display text-[1.85rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2.15rem]">
          <span className="inline-block animate-typing">Welcome, Freshers!</span>
          <br />
          Start your expedition.
        </h2>
        <p className="mt-3 max-w-md text-[0.98rem] leading-relaxed text-mute">
          A high-stakes digital hunt for the next generation of computing experts.
          Solve the riddles, find the nodes, and prove your skills.
        </p>
      </div>



      <div className="mt-8 grid gap-3">
        <button
          type="button"
          className="glass glow-border animate-rise stagger-2 group relative overflow-hidden rounded-2xl p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
          onClick={onParticipant}
        >
          <div className="scanning-line opacity-0 transition-opacity group-hover:opacity-20" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-magenta">
                Node A · Mobile
              </p>
              <p className="font-display mt-1.5 text-xl font-bold text-white">
                Participant
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/25 bg-cyan/10 font-mono text-sm text-cyan transition group-hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]">
              01
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Leader number login, riddles only (no place list), clue-paper code,
            photo confirm, then the next hidden clue.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-wider text-cyan">
            Leader login
            <span className="transition group-hover:translate-x-1">→</span>
          </span>
        </button>

        <button
          type="button"
          className="glass glow-border animate-rise stagger-3 group relative overflow-hidden rounded-2xl p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(167,139,250,0.18)]"
          onClick={onJudge}
        >
          <div className="scanning-line opacity-0 transition-opacity group-hover:opacity-20" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-violet">
                Node B · Locked
              </p>
              <p className="font-display mt-1.5 text-xl font-bold text-white">
                Judge Monitor
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet/30 bg-violet/10 font-mono text-sm text-violet transition group-hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]">
              02
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Requires the developer ops code. Teams cannot open this desk with a
            phone number.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-wider text-violet">
            Authorize desk
            <span className="transition group-hover:translate-x-1">→</span>
          </span>
        </button>
      </div>

      <div className="glass animate-rise stagger-4 mt-8 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-mute">
            Demo leader phones
          </p>
          <span className="cursor-blink font-mono text-cyan">_</span>
        </div>
        <ul className="mt-3 space-y-1.5 font-mono text-[0.78rem] text-slate-300">
          <li className="flex justify-between gap-3">
            <span className="text-cyan">9876543210</span>
            <span className="text-mute">Alpha · fresh</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-cyan">9876543211</span>
            <span className="text-mute">Bravo · mid</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-cyan">9876543212</span>
            <span className="text-mute">Charlie · deep</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-cyan">9876543213</span>
            <span className="text-mute">Delta · done</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-cyan">9876543214</span>
            <span className="text-mute">Echo · early</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-mute">
          Judge code is not listed here — issued only to operators.
        </p>
      </div>
    </div>
  );
}
