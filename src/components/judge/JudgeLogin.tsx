import { useState } from "react";
import { BrandMark } from "../BrandMark";
import { useHunt } from "../../store/HuntStore";

interface JudgeLoginProps {
  onBack: () => void;
}

export function JudgeLogin({ onBack }: JudgeLoginProps) {
  const { loginJudgeWithGoogle, setEvent } = useHunt();
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    if (!eventId.trim()) {
      setError("Please pick a name for your hunt first.");
      return;
    }
    setError("");
    // Set the event context before redirecting to Google
    setEvent(eventId.toUpperCase());
    await loginJudgeWithGoogle();
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
            Organizer Portal
          </p>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Developer Setup
          </h1>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-mute font-light">
        Create a new hunt or manage an existing one. Enter the Hunt Name (Event Code) and sign in.
      </p>

      <div className="glass-strong glow-border mt-10 space-y-8 rounded-2xl p-10 border-t-2 border-t-violet/30">
        <div>
          <label htmlFor="setup-event-id" className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-mute mb-3 block text-center">
            Hunt Name / Event Code
          </label>
          <input
            id="setup-event-id"
            type="text"
            className="field-input font-mono tracking-widest uppercase !text-center !py-4 !bg-black/40"
            placeholder="E.G. MY-GREAT-HUNT"
            value={eventId}
            onChange={e => setEventId(e.target.value.toUpperCase())}
          />
          {error && (
             <p className="mt-3 text-[0.6rem] text-rose text-center font-bold uppercase tracking-tighter">{error}</p>
          )}
        </div>

        <div className="h-px w-full bg-white/5" />

        <div className="text-center">
           <p className="font-mono text-[0.6rem] uppercase tracking-widest text-slate-500 mb-6">Identity Verification</p>
            <button
              onClick={handleGoogleLogin}
              className="btn w-full !py-4 !bg-white !text-slate-900 font-bold tracking-tight rounded-xl hover:bg-slate-100 flex items-center justify-center gap-3 transition-all"
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
              SIGN IN WITH GOOGLE
            </button>
        </div>
      </div>

      <div className="glass mt-10 rounded-2xl border border-rose/10 p-5 bg-rose/5">
        <p className="text-[0.65rem] leading-relaxed text-rose/60 font-mono uppercase tracking-widest text-center font-bold italic">
          * Each hunt is isolated to its unique name.
        </p>
      </div>
    </div>
  );
}
