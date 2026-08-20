import { BrandMark } from "../BrandMark";
import { useHunt } from "../../store/HuntStore";

interface JudgeLoginProps {
  onBack: () => void;
}

export function JudgeLogin({ onBack }: JudgeLoginProps) {
  const { loginJudgeWithGoogle } = useHunt();

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10 text-text font-body">
      <button type="button" className="btn-link !text-[0.65rem] font-bold uppercase tracking-widest text-violet/50 hover:text-violet" onClick={onBack}>
        {"<< GO BACK"}
      </button>

      <div className="mt-8 flex items-center gap-3">
        <div className="relative">
          <BrandMark size="sm" className="animate-float" />
          <div className="absolute -inset-1 bg-violet/20 blur-sm rounded-full" />
        </div>
        <div>
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-violet/70">
            Setup Mode
          </p>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Developer Portal
          </h1>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-mute font-light">
        Access restricted to event organizers. Use your Google account to log in and manage your hunt.
      </p>

      <div className="glass-strong glow-border mt-10 space-y-6 rounded-2xl p-10 border-t-2 border-t-violet/30 text-center">
        <div className="mb-8">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
              <span className="text-3xl">🔑</span>
           </div>
           <p className="font-mono text-[0.7rem] uppercase tracking-widest text-slate-400">Secure Authentication Required</p>
        </div>

        <button
          onClick={loginJudgeWithGoogle}
          className="btn w-full !py-4 !bg-white !text-slate-900 font-bold tracking-tight rounded-xl hover:bg-slate-100 flex items-center justify-center gap-3 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
          SIGN IN WITH GOOGLE
        </button>

        <p className="mt-6 text-[0.65rem] text-mute uppercase tracking-widest">
           * No password required.
        </p>
      </div>

      <div className="glass mt-10 rounded-2xl border border-rose/10 p-5 bg-rose/5">
        <p className="text-[0.65rem] leading-relaxed text-rose/60 font-mono uppercase tracking-widest text-center font-bold">
          * Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
