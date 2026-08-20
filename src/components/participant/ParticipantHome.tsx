import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  padStop,
  type ParticipantPhase,
} from "../../data/schema";
import { useHunt } from "../../store/HuntStore";
import { formatElapsed } from "../../utils/format";
import { BrandMark } from "../BrandMark";

interface ParticipantHomeProps {
  teamId: string;
  onLogout: () => void;
}

export function ParticipantHome({ teamId, onLogout }: ParticipantHomeProps) {
  const { getTeam, currentClue, totalVenuesCount, ensureStarted, checkClueCode, confirmAndAdvance, refreshCurrentClue } =
    useHunt();
  const team = getTeam(teamId);

  const [phase, setPhase] = useState<ParticipantPhase>("hint");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [logs, setLogs] = useState<string[]>(["Welcome!", "Your first riddle is ready.", "Find the spot and enter the code."]);
  const codeRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${msg}`]);
  };

  useEffect(() => {
    if (team && team.finishedAt == null && team.startedAt == null) {
      ensureStarted(teamId);
      addLog("Game timer started!");
    }
  }, [team, teamId, ensureStarted]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Fetch clue securely on level change
  useEffect(() => {
    if (team) {
      refreshCurrentClue(team.currentLevelIndex);
      addLog(`Finding Stop #${team.currentLevelIndex + 1}...`);
    }
  }, [team?.currentLevelIndex, refreshCurrentClue]);

  // Reset UI on level change
  useEffect(() => {
    setPhase("hint");
    setCode("");
    setError("");
    setAdvancing(false);
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, [team?.currentLevelIndex]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  if (!team) {
    return (
      <div className="animate-fade-in mx-auto max-w-lg px-4 py-10">
        <p className="text-rose text-center">Connection lost. Please log in again.</p>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={onLogout}>
          Go to Login
        </button>
      </div>
    );
  }

  const finished =
    team.finishedAt != null || team.currentLevelIndex >= totalVenuesCount;
  const venue = currentClue;
  const clueNumber = team.currentLevelIndex + 1;
  const cleared = team.currentLevelIndex;
  const elapsedMs = team.startedAt
    ? (team.finishedAt ?? now) - team.startedAt
    : 0;
  const progressPct = (cleared / Math.max(totalVenuesCount, 1)) * 100;
  const isLast = team.currentLevelIndex >= totalVenuesCount - 1;

  const flashError = (msg: string) => {
    setError(msg);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 450);
  };

  const handleCodeCheck = async (e: FormEvent) => {
    e.preventDefault();
    if (advancing) return;

    const trimmed = code.trim();
    if (!trimmed) {
      flashError("Please enter the secret code.");
      return;
    }

    addLog(`Checking code: ${trimmed}...`);
    const result = await checkClueCode(teamId, trimmed);
    if (!result.ok) {
      setCode("");
      flashError(result.message);
      addLog("Wrong code! Try again.");
      codeRef.current?.focus();
      return;
    }

    setError("");
    setPhase("confirm");
    addLog("Correct! Does the photo match?");
  };

  const handleWrongPlace = () => {
    if (advancing) return;
    setPhase("hint");
    setCode("");
    setError("");
    addLog("Going back to the riddle.");
  };

  const handleCorrectPlace = () => {
    if (advancing) return;
    setAdvancing(true);
    addLog("Moving to next stop...");

    const result = confirmAndAdvance(teamId);
    if (!result.ok) {
      setAdvancing(false);
      flashError(result.message);
      setPhase("hint");
      addLog("Something went wrong.");
      return;
    }

    advanceTimer.current = window.setTimeout(() => {
      setAdvancing(false);
      addLog("Stop cleared! Next clue ready.");
    }, 400);
  };

  if (finished) {
    return (
      <div className="animate-fade-in mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10 text-center sm:px-6 font-body text-slate-700">
        <div className="flex w-full items-center justify-between border-b border-slate-200 pb-5 mb-10">
          <BrandMark size="sm" />
          <button type="button" className="neo-btn px-4 py-2 rounded-full !text-[0.6rem] uppercase tracking-widest text-rose-500" onClick={onLogout}>
            [ LOG OUT ]
          </button>
        </div>

        <div
          className="animate-seal relative mt-12 flex h-40 w-40 items-center justify-center rounded-full neo-convex"
          aria-hidden="true"
        >
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full">
            <span className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-cyan-600">
              QUEST
            </span>
            <span className="font-display mt-1 text-2xl font-black text-slate-800">
              COMPLETE
            </span>
          </div>
        </div>

        <h2 className="font-display mt-12 text-[2.2rem] font-black leading-tight text-slate-800 sm:text-[2.8rem] uppercase">
          GREAT JOB, <br/><span className="text-cyan-600">{team.teamName.toUpperCase()}</span>!
        </h2>
        <p className="mt-4 text-slate-400 font-mono text-sm uppercase tracking-widest font-bold">Mission Accomplished</p>

        <div className="mt-12 grid w-full max-w-sm grid-cols-2 gap-6">
          <div className="neo-flat rounded-3xl px-4 py-6">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-slate-400 font-bold">
              Final Time
            </p>
            <p className="font-mono mt-2 text-2xl font-black tabular-nums text-cyan-600">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="neo-flat rounded-3xl px-4 py-6">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-slate-400 font-bold">
              Nodes Secured
            </p>
            <p className="font-mono mt-2 text-2xl font-black tabular-nums text-indigo-500">
              {totalVenuesCount}/{totalVenuesCount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 text-slate-700">
        <div className="text-center">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mx-auto" />
          <p className="font-mono text-[0.65rem] text-slate-400 animate-pulse uppercase tracking-[0.3em] font-black">Syncing Node Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-5 sm:px-6 sm:py-7 font-body text-slate-700">
      <header className="flex items-start justify-between gap-3 border-b border-slate-300 pb-5 mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <BrandMark size="sm" className="animate-float" />
            <div className="absolute -inset-1 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight text-slate-800 tracking-tight">
              {team.teamName.toUpperCase()}
            </h1>
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                <p className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-cyan-700">
                  LEADER :: {team.leaderName.toUpperCase()}
                </p>
              </div>
              <p className="font-mono text-[0.5rem] uppercase tracking-widest text-slate-400">
                TEAM_ID :: {team.teamId}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="neo-concave px-3 py-1 rounded-lg font-mono text-[0.75rem] tabular-nums text-slate-600">
            {formatElapsed(elapsedMs)}
          </div>
          <button type="button" className="neo-btn px-3 py-1 rounded-md !text-[0.55rem] hover:text-rose-500 transition-colors uppercase tracking-widest" onClick={onLogout}>
            [ EXIT ]
          </button>
        </div>
      </header>

      {/* Message Box */}
      <div className="mt-6 neo-concave rounded-2xl p-4 font-mono text-[0.6rem] mb-8">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
           <span className="text-cyan-600 font-bold">»</span>
          <span className="text-slate-400 uppercase tracking-widest font-black">QUEST_UPDATES</span>
        </div>
        <div className="space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className={`${log.includes('Wrong') || log.includes('lost') ? 'text-rose-500' : log.includes('Correct') || log.includes('Stop cleared') ? 'text-emerald-600' : 'text-slate-500'}`}>
              {log}
            </div>
          ))}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-cyan-500 animate-pulse">{">"}</span>
            <span className="h-3 w-1.5 bg-cyan-200 animate-blink" />
          </div>
        </div>
      </div>

      {/* Progress Map */}
      <section className="neo-convex mt-6 relative overflow-hidden rounded-3xl p-6 mb-8 border-l-4 border-l-cyan-400">
        <div className="flex items-center justify-between gap-2 mb-6">
          <p className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-slate-400">
            PROGRESS_MAP
          </p>
          <div className="neo-concave px-3 py-1 rounded-full">
             <span className="font-mono text-[0.7rem] font-bold text-cyan-700 uppercase tracking-tighter">STOP {clueNumber} / {totalVenuesCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 relative px-1">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
           {[...Array(totalVenuesCount)].map((_, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-3">
               <div
                  className={`h-4 w-4 rounded-full transition-all duration-700 ${
                    i < cleared ? 'bg-cyan-500 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]' :
                    i === cleared ? 'bg-white border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] scale-125' : 'bg-slate-200'
                  }`}
                />
                <span className={`font-mono text-[0.5rem] font-black ${i === cleared ? 'text-cyan-600' : 'text-slate-300'}`}>
                  {i+1}
                </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-200">
          <p className="font-mono text-[0.55rem] text-slate-400 uppercase tracking-widest font-bold">
            {cleared} Found // {totalVenuesCount - cleared} Left
          </p>
          <span className="font-mono text-[0.6rem] text-cyan-600 font-black italic">
            {Math.round(progressPct)}% COMPLETE
          </span>
        </div>
      </section>

      {/* Current Riddle */}
      {phase === "hint" && (
        <section className="animate-fade-scale mt-8">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-1 w-10 bg-cyan-300 rounded-full" />
             <p className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-cyan-600">ACTIVE_RIDDLE</p>
          </div>
          <h2 className="font-display text-2xl font-black leading-tight text-slate-800 tracking-tight uppercase mb-6">
            Solve the Riddle
          </h2>

          <div className="neo-convex rounded-3xl p-8 relative overflow-hidden border-t-4 border-t-cyan-400 mb-10">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-6xl">
               ?
            </div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
              <span className="font-mono text-[0.55rem] font-black uppercase tracking-[0.2em] text-slate-400">
                MYSTERY_NODE :: #{padStop(clueNumber)}
              </span>
            </div>
            <blockquote className="font-display text-[1.4rem] font-bold leading-relaxed text-slate-700 italic">
              "{venue.hintText}"
            </blockquote>
            <div className="mt-10 pt-8 border-t border-slate-200 space-y-6">
               <div className="flex items-start gap-4">
                  <div className="neo-btn h-6 w-6 rounded-md flex items-center justify-center text-[0.6rem] font-black">!</div>
                  <p className="text-[0.7rem] leading-relaxed text-slate-500 uppercase font-mono tracking-tighter font-bold">
                    TIP: {venue.taskNote}
                  </p>
               </div>
              <div className="neo-concave rounded-2xl p-6 flex items-start gap-4">
                <span className="text-xl">💡</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Found the spot? Check the back of your physical clue card for the secret code and enter it below.
                </p>
              </div>
            </div>
          </div>

          <form
            className={`neo-flat mt-10 space-y-8 rounded-3xl p-8 border-b-4 border-b-cyan-400 ${
              shaking ? "animate-shake" : ""
            }`}
            onSubmit={handleCodeCheck}
          >
            <div className="text-center">
              <label
                htmlFor="clue-code"
                className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 block"
              >
                INPUT SECRET CODE
              </label>
              <div className="relative">
                <input
                  ref={codeRef}
                  id="clue-code"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="neo-input w-full rounded-2xl font-mono tracking-[0.5em] uppercase !text-center !text-3xl !py-6 outline-none focus:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
                  placeholder="------"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                />
              </div>
              {error && (
                <p className="mt-6 text-[0.7rem] text-rose-500 font-mono uppercase tracking-widest font-black" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className="neo-btn w-full !py-6 rounded-2xl font-black tracking-widest text-lg uppercase shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)] hover:text-cyan-600 transition-all">
              CHECK ANSWER
            </button>
          </form>
        </section>
      )}

      {/* Confirmation Section */}
      {phase === "confirm" && (
        <section className="animate-fade-scale mt-6 font-body">
          <button
            type="button"
            className="btn-link !text-[0.65rem] font-black uppercase tracking-widest text-cyan/30 hover:text-cyan"
            onClick={handleWrongPlace}
            disabled={advancing}
          >
            {"<< GO BACK TO RIDDLE"}
          </button>

          <p className="font-mono mt-8 text-[0.65rem] font-black uppercase tracking-[0.3em] text-violet">
            LOCATION_CHECK
          </p>
          <h2 className="font-display mt-2 text-[1.8rem] font-black leading-tight text-white tracking-tight uppercase">
            Are you here?
          </h2>
          <p className="mt-2 text-sm text-mute font-light italic">
            Match this photo with your surroundings.
          </p>

          <div className="glass-strong glow-border mt-8 overflow-hidden rounded-2xl border-t-2 border-t-violet/40 bg-black/40">
            <div className="relative aspect-[16/10] bg-void">
              <img
                src={venue.venueImageUrl}
                alt={`Photo of the campus location for Stop ${clueNumber}`}
                className="h-full w-full object-cover opacity-80"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-transparent to-cyan/10" />
              <div className="absolute left-5 top-5">
                <div className="chip !bg-violet/30 !border-violet/50 !text-white font-black tracking-widest text-[0.55rem] uppercase">Correct Code!</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-cyan font-black shadow-black">
                  STOP :: {clueNumber} // STATUS :: FOUND
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[0.7rem] leading-relaxed text-mute font-mono uppercase tracking-tighter italic font-light">
                If this photo matches the place you are standing, click below to continue.
              </p>
            </div>
          </div>

          {advancing && (
            <div
              className="animate-stamp mt-8 rounded-xl border border-lime/40 bg-lime/10 p-5 text-center shadow-[0_0_20px_rgba(52,211,153,0.1)]"
              role="status"
            >
              <p className="font-mono text-[0.75rem] font-black uppercase tracking-[0.3em] text-lime">
                {isLast ? "MISSION COMPLETE!" : "STOP FOUND!"}
              </p>
              <p className="mt-2 text-[0.6rem] text-lime/70 font-mono tracking-widest uppercase animate-pulse">
                {isLast
                  ? "Revealing the treasure..."
                  : "Next riddle incoming..."}
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-secondary w-full !py-5 font-black tracking-[0.2em] text-[0.65rem] uppercase"
              onClick={handleWrongPlace}
              disabled={advancing}
            >
              NO - WRONG SPOT
            </button>
            <button
              type="button"
              className="btn btn-primary w-full !py-5 font-black tracking-[0.2em] text-[0.65rem] uppercase"
              onClick={handleCorrectPlace}
              disabled={advancing}
            >
              {advancing ? "LOADING..." : "YES - NEXT CLUE"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
