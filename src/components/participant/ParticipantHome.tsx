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
  const codeRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (team && team.finishedAt == null && team.startedAt == null) {
      ensureStarted(teamId);
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
        <p className="text-rose">Session dropped.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={onLogout}>
          Re-authenticate
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

  const handleCodeCheck = (e: FormEvent) => {
    e.preventDefault();
    if (advancing) return;

    const trimmed = code.trim();
    if (!trimmed) {
      flashError("Enter the code from the backside of the clue paper.");
      return;
    }

    const result = checkClueCode(teamId, trimmed);
    if (!result.ok) {
      setCode("");
      flashError(result.message);
      codeRef.current?.focus();
      return;
    }

    setError("");
    setPhase("confirm");
  };

  const handleWrongPlace = () => {
    if (advancing) return;
    setPhase("hint");
    setCode("");
    setError("");
  };

  const handleCorrectPlace = () => {
    if (advancing) return;
    setAdvancing(true);

    const result = confirmAndAdvance(teamId);
    if (!result.ok) {
      setAdvancing(false);
      flashError(result.message);
      setPhase("hint");
      return;
    }

    advanceTimer.current = window.setTimeout(() => {
      setAdvancing(false);
    }, 400);
  };

  if (finished) {
    return (
      <div className="animate-fade-in mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10 text-center sm:px-6">
        <div className="flex w-full items-center justify-between">
          <BrandMark size="sm" />
          <button type="button" className="btn-link" onClick={onLogout}>
            Disconnect
          </button>
        </div>

        <div
          className="animate-seal relative mt-12 flex h-32 w-32 items-center justify-center rounded-full"
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan/40 via-violet/30 to-magenta/40 blur-xl" />
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full border border-cyan/40 bg-panel/80 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-cyan">
              Mission
            </span>
            <span className="font-display mt-1 text-lg font-bold text-white">
              CLEAR
            </span>
          </div>
        </div>

        <h1 className="font-display mt-8 text-[1.9rem] font-bold leading-tight text-white sm:text-[2.2rem]">
          Well hunted, <span className="text-gradient">{team.teamName}</span>
        </h1>
        <p className="mt-3 text-mute">All clues cleared. Treasure protocol live.</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">
          Present this screen at the final marshal desk. Your crew finished the
          full circuit—without a place list in hand.
        </p>

        <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="glass rounded-2xl px-3 py-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-mute">
              Field time
            </p>
            <p className="font-mono mt-2 text-2xl font-semibold tabular-nums text-cyan">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="glass rounded-2xl px-3 py-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-mute">
              Clues
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
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent mx-auto" />
          <p className="font-mono text-xs text-cyan animate-pulse">Decrypting Clue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-lg px-4 py-5 sm:px-6 sm:py-7">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark size="sm" className="animate-float" />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight text-white">
              {team.teamName}
            </p>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cyan">
              Agent ID: {team.teamId}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-lg border border-cyan/20 bg-cyan/10 px-2.5 py-1 font-mono text-[0.75rem] tabular-nums text-cyan shadow-[0_0_16px_rgba(34,211,238,0.15)]">
            {formatElapsed(elapsedMs)}
          </div>
          <button type="button" className="btn-link" onClick={onLogout}>
            Disconnect
          </button>
        </div>
      </header>

      {/* Progress only — no place names or route list */}
      <section className="glass mt-5 relative overflow-hidden rounded-2xl p-4 border-l-2 border-l-cyan">
        <div className="scanning-line opacity-10" />
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-cyan animate-pulse-glow">
            Mission Timeline
          </p>

          <span className="chip animate-pulse-glow">
            LEVEL {padStop(clueNumber)}
          </span>
        </div>
        <div className="progress-track mt-3">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 font-mono text-[0.65rem] text-mute">
          {cleared} cleared · place names hidden
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {team.members.map((m) => (
            <li
              key={m}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
            >
              {m}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
        {(["hint", "confirm"] as ParticipantPhase[]).map((p) => (
          <span
            key={p}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              phase === p
                ? "bg-cyan shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                : phase === "confirm" && p === "hint"
                  ? "bg-violet/60"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* PHASE 1 — Hint + code from backside of clue paper */}
      {phase === "hint" && (
        <section className="animate-fade-scale mt-4">
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-cyan">
            Active clue
          </p>
          <h1 className="font-display mt-2 text-[1.55rem] font-bold leading-snug text-white sm:text-[1.75rem]">
            Follow the riddle
          </h1>
          <p className="mt-2 text-sm text-mute">
            Place names stay hidden. Solve this clue on campus, then enter the
            code printed on the backside of the clue paper.
          </p>

          <div className="glass-strong glow-border mt-4 rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_8px_#34d399]" />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-mute">
                Encrypted · clue {padStop(clueNumber)}
              </span>
            </div>
            <blockquote className="font-display text-[1.15rem] font-semibold leading-snug text-slate-100 sm:text-[1.3rem]">
              {venue.hintText}
            </blockquote>
            <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-mute">
              {venue.taskNote}
            </p>
            <p className="mt-3 rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2.5 text-sm text-slate-300">
              Flip the physical clue paper. Enter the code written on the back
              to open the photo check.
            </p>
          </div>

          <form
            className={`glass mt-5 space-y-3 rounded-2xl p-4 sm:p-5 ${
              shaking ? "animate-shake" : ""
            }`}
            onSubmit={handleCodeCheck}
          >
            <div>
              <label
                htmlFor="clue-code"
                className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-mute"
              >
                Code on clue paper
              </label>
              <input
                ref={codeRef}
                id="clue-code"
                type="text"
                autoCapitalize="characters"
                autoComplete="off"
                className={`field-input mt-2 font-mono tracking-[0.16em] uppercase ${
                  error ? "error" : ""
                }`}
                placeholder="Backside code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "code-error" : "code-help"}
              />
              <p id="code-help" className="mt-1.5 text-xs text-mute">
                Exact code from the reverse side of this stop&apos;s clue paper.
              </p>
              {error && (
                <p id="code-error" className="mt-1.5 text-sm text-rose" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Check this stop
            </button>
          </form>
        </section>
      )}

      {/* PHASE 2 — Image confirm (still no place name) */}
      {phase === "confirm" && (
        <section className="animate-fade-scale mt-4">
          <button
            type="button"
            className="btn-link"
            onClick={handleWrongPlace}
            disabled={advancing}
          >
            ← Back to clue
          </button>

          <p className="font-mono mt-4 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-violet">
            Visual check
          </p>
          <h2 className="font-display mt-2 text-[1.55rem] font-bold leading-snug text-white">
            Does this match where you are?
          </h2>
          <p className="mt-2 text-sm text-mute">
            Clue-paper code accepted. Compare this photo to your surroundings.
            Place names stay hidden either way.
          </p>

          <div className="glass-strong glow-border mt-4 overflow-hidden rounded-2xl">
            <div className="relative aspect-[16/10] bg-void">
              <img
                src={venue.venueImageUrl}
                alt={`Reference view for clue ${clueNumber}`}
                className="h-full w-full object-cover opacity-90"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-transparent to-cyan/10" />
              <div className="absolute left-3 top-3">
                <span className="chip chip-live">Photo check</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-cyan">
                  Clue {padStop(clueNumber)} · name sealed
                </p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed text-mute">
                If the photo does not match reality, you are at the wrong place.
                Go back to the clue and keep hunting.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                If it matches, confirm below. You will receive the next riddle
                only—not the next place name.
              </p>
            </div>
          </div>

          {advancing && (
            <div
              className="animate-stamp mt-4 rounded-xl border border-lime/30 bg-lime/10 px-3.5 py-3"
              role="status"
            >
              <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-lime">
                {isLast ? "Final stop cleared" : "Stop cleared"}
              </p>
              <p className="mt-1 text-sm text-lime/90">
                {isLast
                  ? "Unlocking treasure screen…"
                  : "Loading next clue… place name hidden."}
              </p>
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={handleWrongPlace}
              disabled={advancing}
            >
              No — wrong place
            </button>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleCorrectPlace}
              disabled={advancing}
            >
              {advancing ? "Advancing…" : "Yes — next clue"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
