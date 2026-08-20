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
            Player Login
          </p>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Team Login
          </h1>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-mute font-light">
        Enter your registered phone number to start the hunt.
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
            Your Phone Number
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
          <p id="phone-help" className="mt-3 text-[0.65rem] text-mute/60 font-mono uppercase tracking-tighter text-center">
            * Use the 10-digit number you registered with.
          </p>
          {error && (
            <p id="phone-error" className="mt-4 text-xs text-rose font-mono uppercase tracking-tighter text-center" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={isLoggingIn} className="btn btn-primary w-full !py-4 font-black tracking-widest uppercase disabled:opacity-50">
          {isLoggingIn ? "ESTABLISHING UPLINK..." : "START THE HUNT"}
        </button>
      </form>
    </div>
  );
}
