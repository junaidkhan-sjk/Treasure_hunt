import { useState, type FormEvent } from "react";
import { BrandMark } from "../BrandMark";
import { useHunt } from "../../store/HuntStore";
import { normalizePhone } from "../../data/schema";

interface TeamLoginProps {
  onBack: () => void;
  onSuccess: (teamId: string) => void;
}

export function TeamLogin({ onBack, onSuccess }: TeamLoginProps) {
  const { loginByPhoneDirect } = useHunt();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [shaking, setShaking] = useState(false);

  const flash = (msg: string) => {
    setError(msg);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 450);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    const digits = normalizePhone(phone);
    if (digits.length !== 10) {
      flash("Please enter your 10-digit phone number.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const team = await loginByPhoneDirect(digits);
      if (!team) {
        flash("Sorry, this phone number isn't registered.");
        return;
      }
      setError("");
      onSuccess(team.teamId);
    } catch (err) {
      flash("Uplink error. Check your connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10 text-slate-700 font-body">
      <button type="button" className="neo-btn px-4 py-2 rounded-full !text-[0.65rem] font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-colors" onClick={onBack}>
        {"<< GO BACK"}
      </button>

      <div className="mt-10 flex items-center gap-4">
        <div className="relative">
          <BrandMark size="sm" className="animate-float" />
          <div className="absolute -inset-1 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]" />
        </div>
        <div>
          <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-slate-400">
            Player Login
          </p>
          <h1 className="font-display text-2xl font-black text-slate-800 uppercase tracking-tight">
            Team Login
          </h1>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-slate-500 font-light">
        Enter your registered phone number to start the hunt.
      </p>

      <form
        className="neo-flat mt-10 space-y-8 rounded-3xl p-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className={shaking ? "animate-shake" : ""}>
          <label
            htmlFor="leader-phone"
            className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block text-center"
          >
            Your Phone Number
          </label>
          <div className="relative">
             <input
              id="leader-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className="neo-input w-full rounded-2xl font-mono tracking-[0.3em] !text-center !text-xl !py-5 focus:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,1)] outline-none transition-all"
              placeholder="0000000000"
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
          <p id="phone-help" className="mt-4 text-[0.6rem] text-slate-400 font-mono uppercase tracking-tighter text-center italic">
            * 10-digit number used during registration
          </p>
          {error && (
            <p id="phone-error" className="mt-4 text-xs text-rose-500 font-mono uppercase tracking-tighter text-center font-bold" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={isLoggingIn} className="neo-btn w-full !py-5 rounded-2xl font-black tracking-widest uppercase disabled:opacity-50 hover:text-cyan-600">
          {isLoggingIn ? "VERIFYING..." : "START THE HUNT"}
        </button>
      </form>
    </div>
  );
}
