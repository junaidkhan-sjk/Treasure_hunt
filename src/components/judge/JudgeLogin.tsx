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
      setError("Enter the Game Master access code.");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    if (!loginJudge(code)) {
      setCode("");
      setError("Wrong access code.");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    setError("");
    onSuccess();
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10 text-slate-700 font-body">
      <button type="button" className="neo-btn px-4 py-2 rounded-full !text-[0.65rem] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors" onClick={onBack}>
        {"<< GO BACK"}
      </button>

      <div className="mt-10 flex items-center gap-4">
        <div className="relative">
          <BrandMark size="sm" className="animate-float" />
          <div className="absolute -inset-1 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]" />
        </div>
        <div>
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-slate-400">
            Admin Portal
          </p>
          <h1 className="font-display text-2xl font-black text-slate-800 uppercase tracking-tight">
            Game Master Login
          </h1>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-slate-500 font-light">
        Restricted access for event organizers only. Enter the master key
        to view live progress and manage the hunt.
      </p>

      <form
        className="neo-flat mt-10 space-y-8 rounded-3xl p-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className={shaking ? "animate-shake" : ""}>
          <label
            htmlFor="judge-code"
            className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block text-center"
          >
            MASTER KEY
          </label>
          <div className="relative">
            <input
              id="judge-code"
              type={showCode ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              className="neo-input w-full rounded-2xl font-mono tracking-[0.4em] !text-center !text-xl !py-5 focus:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,1)] outline-none transition-all"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-slate-400 transition hover:text-indigo-600"
              onClick={() => setShowCode((v) => !v)}
            >
              {showCode ? "HIDE" : "SHOW"}
            </button>
          </div>
          {error && (
            <p
              id="judge-code-error"
              className="mt-6 text-xs text-rose-500 font-mono uppercase tracking-tighter text-center font-bold"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="neo-btn w-full !py-5 rounded-2xl font-black tracking-widest uppercase hover:text-indigo-600 transition-all">
          OPEN DASHBOARD
        </button>
      </form>

      <div className="neo-concave mt-10 rounded-2xl p-5">
        <p className="text-[0.65rem] leading-relaxed text-rose-400 font-mono uppercase tracking-widest text-center font-bold">
          * Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
