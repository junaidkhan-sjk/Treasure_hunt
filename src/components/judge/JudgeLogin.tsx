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
      setError("Enter the developer / judge access code.");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    if (!loginJudge(code)) {
      setCode("");
      setError("Access denied. Invalid ops code.");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    setError("");
    onSuccess();
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10">
      <button type="button" className="btn-link" onClick={onBack}>
        ← Back to nodes
      </button>

      <div className="mt-6 flex items-center gap-3">
        <BrandMark size="sm" />
        <div>
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-violet">
            Restricted · Ops desk
          </p>
          <h1 className="font-display text-xl font-bold text-white">
            Judge authorization
          </h1>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-mute">
        Monitor access is locked behind a developer code. Only marshals and
        event operators with the issued key may open the live board.
      </p>

      <form
        className="glass-strong glow-border mt-8 space-y-4 rounded-2xl p-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <div>
          <label
            htmlFor="judge-code"
            className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-mute"
          >
            Developer access code
          </label>
          <div className="relative mt-2">
            <input
              id="judge-code"
              type={showCode ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              className={`field-input font-mono tracking-[0.12em] pr-20 ${
                error ? "error" : ""
              } ${shaking ? "animate-shake" : ""}`}
              placeholder="••••••••••"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-mute transition hover:text-cyan"
              onClick={() => setShowCode((v) => !v)}
            >
              {showCode ? "Hide" : "Show"}
            </button>
          </div>
          <p id="judge-code-help" className="mt-1.5 text-xs text-mute/80">
            Issued only to judges and developers. Not shared with teams.
          </p>
          {error && (
            <p
              id="judge-code-error"
              className="mt-2 text-sm text-rose"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Unlock monitor
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="glass mt-6 rounded-2xl border border-rose/20 p-4">
        <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-rose">
          Security notice
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Failed attempts do not reveal whether a code format is close. Keep the
          ops key offline. Teams cannot open this desk with a leader number.
        </p>
      </div>
    </div>
  );
}
