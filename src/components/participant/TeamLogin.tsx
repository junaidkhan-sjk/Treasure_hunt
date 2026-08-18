import { useState, type FormEvent } from "react";
import { BrandMark } from "../BrandMark";
import { useHunt } from "../../store/HuntStore";
import { normalizePhone } from "../../data/schema";

interface TeamLoginProps {
  onBack: () => void;
  onSuccess: (teamId: string) => void;
}

export function TeamLogin({ onBack, onSuccess }: TeamLoginProps) {
  const { loginByLeaderPhone } = useHunt();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const flash = (msg: string) => {
    setError(msg);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 450);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const digits = normalizePhone(phone);
    if (digits.length !== 10) {
      flash("Enter the 10-digit mobile number of your team leader.");
      return;
    }
    const team = loginByLeaderPhone(digits);
    if (!team) {
      flash("Number not found. Only the registered leader number can enter.");
      return;
    }
    setError("");
    onSuccess(team.teamId);
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10">
      <button type="button" className="btn-link" onClick={onBack}>
        ← Back to nodes
      </button>

      <div className="mt-6 flex items-center gap-3">
        <BrandMark size="sm" className="animate-float" />
        <div>
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-cyan">
            Advanced Computing Expedition
          </p>
          <h1 className="font-display text-xl font-bold text-white">
            Access Verification
          </h1>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-mute">
        Enter the registered mobile number of your team leader. If the number
        matches the field registry, your crew unlocks the trail.
      </p>

      <form
        className="glass-strong glow-border mt-8 space-y-4 rounded-2xl p-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <div>
          <label
            htmlFor="leader-phone"
            className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-mute"
          >
            Leader mobile number
          </label>
          <input
            id="leader-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={`field-input mt-2 font-mono tracking-[0.18em] ${
              error ? "error" : ""
            } ${shaking ? "animate-shake" : ""}`}
            placeholder="10-digit number"
            value={phone}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d\s+\-]/g, "").slice(0, 16);
              setPhone(next);
              if (error) setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "phone-error" : "phone-help"}
          />
          <p id="phone-help" className="mt-1.5 text-xs text-mute/80">
            Only the leader number on the registration sheet works. +91 is OK.
          </p>
          {error && (
            <p id="phone-error" className="mt-2 text-sm text-rose" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Enter the hunt
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="glass mt-6 rounded-2xl p-4">
        <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-magenta">
          Demo leader numbers
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { phone: "9876543210", label: "Alpha" },
            { phone: "9876543211", label: "Bravo" },
            { phone: "9876543214", label: "Echo" },
          ].map((item) => (
            <button
              key={item.phone}
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[0.72rem] font-medium tracking-wide text-slate-200 transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan"
              onClick={() => {
                setPhone(item.phone);
                setError("");
              }}
            >
              {item.phone}
              <span className="ml-1.5 text-mute">· {item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
