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
      <div className="animate-fade-in mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10 text-center sm:px-6 font-body text-text">
        <div className="flex w-full items-center justify-between border-b border-white/5 pb-5 mb-10">
          <BrandMark size="sm" />
          <button type="button" className="btn-link !text-[0.6rem] uppercase tracking-widest text-rose" onClick={onLogout}>
            [ LOG OUT ]
          </button>
        </div>

        <div
          className="animate-seal relative mt-12 flex h-32 w-32 items-center justify-center rounded-full glass"
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan/40 via-violet/30 to-magenta/40 blur-xl opacity-50" />
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full border border-cyan/40">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-cyan">
              QUEST
            </span>
            <span className="font-display mt-1 text-lg font-bold text-white">
              DONE!
            </span>
          </div>
        </div>

        <h2 className="font-display mt-12 text-[2rem] font-bold leading-tight text-white sm:text-[2.5rem] uppercase">
          GREAT JOB, <br/><span className="text-gradient">{team.teamName.toUpperCase()}</span>!
        </h2>
        <p className="mt-4 text-mute font-mono text-sm uppercase tracking-widest">You found all the spots!</p>

        <div className="mt-12 grid w-full max-w-sm grid-cols-2 gap-4">
          <div className="glass rounded-2xl px-3 py-6">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-mute">
              Your Time
            </p>
            <p className="font-mono mt-2 text-2xl font-semibold tabular-nums text-cyan">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="glass rounded-2xl px-3 py-6">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-mute">
              Stops Found
            </p>
            <p className="font-mono mt-2 text-2xl font-semibold tabular-nums text-violet">
              {totalVenuesCount}/{totalVenuesCount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-void text-text">
        <div className="text-center">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-cyan border-t-transparent mx-auto" />
          <p className="font-mono text-[0.65rem] text-cyan animate-pulse uppercase tracking-[0.3em] font-bold italic">Preparing your next clue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-5 sm:px-6 sm:py-7 font-body text-text">
      <header className="flex items-start justify-between gap-3 border-b border-white/5 pb-5 mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <BrandMark size="sm" className="animate-float" />
            <div className="absolute -inset-1 bg-cyan/10 blur-sm rounded-full" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight text-white tracking-tight">
              {team.teamName.toUpperCase()}
            </h1>
            <div className="flex flex-col gap-1 mt-1.5">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-cyan animate-pulse" />
                <p className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-cyan/70">
                  LEADER :: {team.leaderName.toUpperCase()}
                </p>
              </div>
              {team.members.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                   <p className="font-mono text-[0.45rem] uppercase tracking-tighter text-mute/40">CREW ::</p>
                   {team.members.slice(0, 3).map((m, i) => (
                     <span key={i} className="font-mono text-[0.5rem] uppercase tracking-tight text-mute/60">
                        {m.split(' ')[0]}
                        {i < Math.min(team.members.length, 3) - 1 && <span className="mx-1 opacity-30">•</span>}
                     </span>
                   ))}
                   {team.members.length > 3 && <span className="text-[0.45rem] font-mono text-cyan/40">+{team.members.length - 3}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-lg border border-cyan/20 bg-cyan/5 px-3 py-1 font-mono text-[0.75rem] tabular-nums text-cyan">
            {formatElapsed(elapsedMs)}
          </div>
          <button type="button" className="btn-link !text-[0.6rem] hover:!text-rose transition-colors uppercase tracking-widest" onClick={onLogout}>
            [ EXIT ]
          </button>
        </div>
      </header>

      {/* Game Updates */}
      <div className="mt-6 glass-strong rounded-xl p-4 font-mono text-[0.65rem] bg-black/40 border border-white/5 mb-8">
        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
          <span className="text-cyan font-bold">»</span>
          <span className="text-mute uppercase tracking-widest font-black">GAME_UPDATES</span>
        </div>
        <div className="space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className={`${log.includes('Wrong') || log.includes('lost') ? 'text-rose' : log.includes('Correct') || log.includes('Stop cleared') ? 'text-lime' : 'text-cyan/60'}`}>
              {log}
            </div>
          ))}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-cyan animate-pulse">{">"}</span>
            <span className="h-3 w-1.5 bg-cyan/40 animate-blink" />
          </div>
        </div>
      </div>

      {/* Progress Map */}
      <section className="glass mt-6 relative overflow-hidden rounded-2xl p-6 border-l-4 border-l-cyan bg-black/20 mb-8">
        <div className="scanning-line opacity-5" />
        <div className="flex items-center justify-between gap-2 mb-6">
          <p className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-cyan/80">
            PROGRESS_MAP
          </p>
          <div className="px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20">
             <span className="font-mono text-[0.7rem] font-bold text-cyan uppercase">STOP {clueNumber} / {totalVenuesCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 relative px-1">
           <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2" />
           {[...Array(totalVenuesCount)].map((_, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-3">
               <div
                  className={`h-3 w-3 rounded-full border transition-all duration-700 ${
                    i < cleared ? 'bg-cyan border-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]' :
                    i === cleared ? 'bg-black border-cyan animate-pulse scale-125 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black border-white/10'
                  }`}
                />
                <span className={`font-mono text-[0.5rem] ${i === cleared ? 'text-cyan font-black' : 'text-mute/30'}`}>
                  {i+1}
                </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/5">
          <p className="font-mono text-[0.55rem] text-mute uppercase tracking-widest">
            {cleared} Found // {totalVenuesCount - cleared} Left
          </p>
          <span className="font-mono text-[0.6rem] text-cyan font-black italic">
            {Math.round(progressPct)}% DONE
          </span>
        </div>
      </section>

      {/* Current Riddle */}
      {phase === "hint" && (
        <section className="animate-fade-scale mt-8">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-1 w-8 bg-cyan/40 rounded-full" />
             <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-cyan">YOUR_CLUE</p>
          </div>
          <h2 className="font-display text-2xl font-black leading-tight text-white tracking-tight uppercase mb-6">
            Solve the Riddle
          </h2>

          <div className="glass-strong glow-border mt-6 rounded-2xl p-8 relative overflow-hidden border-t-2 border-t-cyan/30 mb-10">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-6xl">
               ?
            </div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-pulse" />
              <span className="font-mono text-[0.55rem] font-black uppercase tracking-[0.2em] text-mute">
                MYSTERY_STOP_#{padStop(clueNumber)}
              </span>
            </div>
            <blockquote className="font-display text-[1.3rem] font-bold leading-relaxed text-slate-100 italic">
              "{venue.hintText}"
            </blockquote>
            <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
               <div className="flex items-start gap-4">
                  <span className="font-mono text-cyan text-[0.7rem] font-black">[!]</span>
                  <p className="text-[0.7rem] leading-relaxed text-mute uppercase font-mono tracking-tighter font-bold">
                    Tip: {venue.taskNote}
                  </p>
               </div>
              <div className="rounded-xl border border-cyan/10 bg-white/[0.02] p-5 flex items-start gap-4">
                <span className="text-cyan text-sm">✦</span>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Find this spot on campus. Once there, find the secret code
                  on the back of your card and enter it below.
                </p>
              </div>
            </div>
          </div>

          <form
            className={`glass mt-8 space-y-8 rounded-2xl p-8 border-b-2 border-b-cyan/20 ${
              shaking ? "animate-shake" : ""
            }`}
            onSubmit={handleCodeCheck}
          >
            <div className="text-center">
              <label
                htmlFor="clue-code"
                className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-mute mb-6 block"
              >
                TYPE SECRET CODE
              </label>
              <div className="relative">
                <input
                  ref={codeRef}
                  id="clue-code"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className={`field-input font-mono tracking-[0.4em] uppercase !text-center !text-3xl !py-6 !bg-black/60 !border-white/10 focus:!border-cyan/50 ${
                    error ? "error" : ""
                  }`}
                  placeholder="------"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                />
              </div>
              {error && (
                <p className="mt-6 text-[0.7rem] text-rose font-mono uppercase tracking-widest font-bold" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full !py-6 font-black tracking-widest uppercase shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              CHECK MY ANSWER
            </button>
          </form>
        </section>
      )}

      {/* Confirmation Section */}
      {phase === "confirm" && (
        <section className="animate-fade-scale mt-8">
          <button
            type="button"
            className="btn-link !text-[0.65rem] font-black uppercase tracking-widest text-cyan/30 hover:text-cyan"
            onClick={handleWrongPlace}
            disabled={advancing}
          >
            {"<< GO BACK TO RIDDLE"}
          </button>

          <p className="font-mono mt-10 text-[0.65rem] font-black uppercase tracking-[0.3em] text-violet">
            LOCATION_CHECK
          </p>
          <h2 className="font-display mt-2 text-[2rem] font-black leading-tight text-white tracking-tight uppercase mb-8">
            Are you here?
          </h2>
          <p className="mt-2 text-sm text-mute font-light italic mb-8">
            Match this photo with your surroundings.
          </p>

          <div className="glass-strong glow-border overflow-hidden rounded-2xl border-t-2 border-t-violet/40 bg-black/40 mb-10">
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
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-cyan font-black shadow-black">
                  STOP :: {clueNumber} // STATUS :: FOUND
                </p>
              </div>
            </div>
            <div className="p-8">
              <p className="text-[0.75rem] leading-relaxed text-mute font-mono uppercase tracking-tighter italic font-light">
                If this photo matches the place you are standing, click below to continue.
              </p>
            </div>
          </div>

          {advancing && (
            <div
              className="animate-stamp mt-8 rounded-xl border border-lime/40 bg-lime/10 p-6 text-center shadow-[0_0_20px_rgba(52,211,153,0.1)]"
              role="status"
            >
              <p className="font-mono text-[0.8rem] font-black uppercase tracking-[0.3em] text-lime">
                {isLast ? "MISSION COMPLETE!" : "STOP FOUND!"}
              </p>
              <p className="mt-2 text-[0.6rem] text-lime/70 font-mono tracking-widest uppercase animate-pulse">
                {isLast
                  ? "Revealing the treasure..."
                  : "Next riddle incoming..."}
              </p>
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-secondary w-full !py-6 font-black tracking-[0.2em] text-[0.7rem] uppercase"
              onClick={handleWrongPlace}
              disabled={advancing}
            >
              NO - WRONG SPOT
            </button>
            <button
              type="button"
              className="btn btn-primary w-full !py-6 font-black tracking-[0.2em] text-[0.7rem] uppercase"
              onClick={handleCorrectPlace}
              disabled={advancing}
            >
              {advancing ? "LOADING..." : "YES - NEXT CLUE"}
            </button>
          </div>
        </section>
      )}

      {/* Team Crew Info */}
      <div className="mt-12 glass rounded-2xl p-8 border-t border-white/5 bg-black/10 mb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <p className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-magenta/70">
            UNIT_ROSTER
          </p>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center font-mono text-[0.7rem] text-cyan font-bold">LDR</div>
             <div>
                <p className="font-mono text-[0.55rem] text-mute uppercase tracking-widest font-bold">Team Leader</p>
                <p className="font-display text-lg font-black text-white uppercase tracking-wide">{team.leaderName}</p>
             </div>
          </div>

          <div className="pt-6 border-t border-white/5">
             <p className="font-mono text-[0.6rem] text-mute uppercase tracking-widest mb-4 font-bold">Crew Members</p>
             <div className="flex flex-wrap gap-3">
                {team.members.map((m) => (
                  <span
                    key={m}
                    className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 font-mono text-[0.65rem] text-mute uppercase tracking-tighter hover:text-cyan transition-colors"
                  >
                    # {m}
                  </span>
                ))}
                {team.members.length === 0 && (
                  <span className="text-[0.65rem] font-mono text-mute/30 italic">No other members registered.</span>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
