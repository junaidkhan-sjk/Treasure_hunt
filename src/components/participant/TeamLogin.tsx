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
      flash("Enter your 10-digit mobile number.");
      return;
    }
    const team = loginByLeaderPhone(digits);
    if (!team) {
      flash("Mobile number not found in our list.");
      return;
    }
    setError("");
    onSuccess(team.teamId);
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10 text-text font-body">
      <button type="button" className="btn-link !text-[0.65rem] font-bold uppercase tracking-widest text-cyan/50 hover:text-cyan" onClick={onBack}>
        {"<< GO BACK"}
      </button>

      <div className="mt-8 flex items-center gap-3 text-text">
        <div className="relative">
          <BrandMark size="sm" className="animate-float" />
          <div className="absolute -inset-1 bg-cyan/20 blur-sm rounded-full" />
        </div>
        <div>
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-cyan/70">
            Adventure Start
          </p>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Team Login
          </h1>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-mute font-light">
        Enter the mobile number you registered with to start your hunt.
      </p>

      <form
        className="glass-strong glow-border mt-10 space-y-6 rounded-2xl p-6 border-t-2 border-t-cyan/30"
        onSubmit={handleSubmit}
        noValidate
      >
        <div>
          <label
            htmlFor="leader-phone"
            className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-mute mb-2 block"
          >
            Registered Mobile Number
          </label>
          <div className="relative">
             <input
              id="leader-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className={`field-input font-mono tracking-[0.3em] !text-center !text-xl !py-4 ${
                error ? "error" : ""
              } ${shaking ? "animate-shake" : ""}`}
              placeholder="000000 0000"
              value={phone}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d\s+\-]/g, "").slice(0, 16);
                setPhone(next);
                if (error) setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "phone-error" : "phone-help"}
            />
          </div>
          <p id="phone-help" className="mt-3 text-[0.65rem] text-mute/60 font-mono uppercase tracking-tighter text-center">
            * 10 digits only
          </p>
          {error && (
            <p id="phone-error" className="mt-4 text-xs text-rose font-mono uppercase tracking-tighter text-center" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full !py-4 font-black tracking-widest uppercase">
          START THE ADVENTURE
        </button>
      </form>

      <div className="glass mt-8 rounded-2xl p-5 border-white/5">
         <div className="flex items-center gap-2 mb-4">
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-magenta/70">
            TEST NUMBERS
          </p>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { phone: "9876543210", label: "ALPHA" },
            { phone: "9301900147", label: "DEV" },
          ].map((item) => (
            <button
              key={item.phone}
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[0.65rem] font-bold tracking-wider text-slate-300 transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan"
              onClick={() => {
                setPhone(item.phone);
                setError("");
              }}
            >
              {item.phone}
              <span className="ml-2 text-mute/50">:: {item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
