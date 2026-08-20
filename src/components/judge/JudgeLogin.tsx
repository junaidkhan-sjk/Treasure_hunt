import { useState, type FormEvent } from "react";
import { BrandMark } from "../BrandMark";
import { useHunt } from "../../store/HuntStore";

interface JudgeLoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function JudgeLogin({ onBack, onSuccess }: JudgeLoginProps) {
  const { loginJudge } = useHunt();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter the developer access code.");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    if (!loginJudge(code)) {
      setCode("");
      setError("Invalid access code.");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    setError("");
    onSuccess();
  };

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
        Access restricted to event organizers. Enter the master key
        to configure teams, riddles, and monitor the live hunt.
      </p>

      <form
        className="glass-strong glow-border mt-10 space-y-6 rounded-2xl p-8 border-t-2 border-t-violet/30"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className={shaking ? "animate-shake" : ""}>
          <label
            htmlFor="judge-code"
            className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-mute mb-3 block"
          >
            DEVELOPER KEY
          </label>
          <div className="relative">
            <input
              id="judge-code"
              type={showCode ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              className={`field-input font-mono tracking-[0.4em] !text-center !text-xl !py-4 !bg-black/40 !border-white/10 focus:!border-violet/50 ${
                error ? "error" : ""
              }`}
              placeholder="**********"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "judge-code-error" : "judge-code-help"}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-mute transition hover:text-violet bg-white/5"
              onClick={() => setShowCode((v) => !v)}
            >
              {showCode ? "HIDE" : "SHOW"}
            </button>
          </div>
          {error && (
            <p
              id="judge-code-error"
              className="mt-4 text-xs text-rose font-mono uppercase tracking-tighter text-center font-bold"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary !bg-gradient-to-r !from-violet-600 !to-indigo-600 w-full !py-4 font-black tracking-widest uppercase shadow-[0_0_30px_rgba(124,58,237,0.3)]">
          OPEN DASHBOARD
        </button>
      </form>

      <div className="glass mt-10 rounded-2xl border border-rose/10 p-5 bg-rose/5">
        <p className="text-[0.65rem] leading-relaxed text-rose/60 font-mono uppercase tracking-widest text-center font-bold">
          * Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
