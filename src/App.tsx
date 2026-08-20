import { useState } from "react";
import { HuntProvider, useHunt } from "./store/HuntStore";
import { TechBackground } from "./components/TechBackground";
import { RoleGate } from "./components/RoleGate";
import { TeamLogin } from "./components/participant/TeamLogin";
import { ParticipantHome } from "./components/participant/ParticipantHome";
import { JudgeLogin } from "./components/judge/JudgeLogin";
import { JudgeDashboard } from "./components/judge/JudgeDashboard";

type AppScreen =
  | { name: "gate" }
  | { name: "participant-login" }
  | { name: "participant-home"; teamId: string }
  | { name: "judge-login" }
  | { name: "judge" };

export default function App() {
  return (
    <HuntProvider>
      <AppShell />
    </HuntProvider>
  );
}

function AppShell() {
  const { loading, teams } = useHunt();
  const [screen, setScreen] = useState<AppScreen>({ name: "gate" });
  const [animKey, setAnimKey] = useState(0);

  const go = (next: AppScreen) => {
    setScreen(next);
    setAnimKey((k) => k + 1);
  };

  // Check if Supabase keys are missing
  const hasCreds = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConnectionIssue = !loading && teams.length === 0 && !hasCreds;

  if (loading) {
    return (
      <>
        <TechBackground />
        <div className="flex min-h-dvh items-center justify-center">
          <div className="text-center space-y-8">
            <div className="relative h-24 w-24 mx-auto neo-convex rounded-full flex items-center justify-center">
               <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
               <div className="absolute inset-0 flex items-center justify-center font-mono text-[0.6rem] text-cyan-600 font-black uppercase">SYNC</div>
            </div>
            <div className="space-y-4">
               <p className="font-mono text-slate-400 text-xs tracking-[0.4em] animate-pulse uppercase font-black">Establishing Satellite Uplink</p>
               <div className="neo-concave h-2 w-56 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 animate-[loading_2s_infinite]" />
               </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isConnectionIssue) {
    return (
      <>
        <TechBackground />
        <div className="flex min-h-dvh items-center justify-center p-6 text-center">
          <div className="neo-flat p-10 rounded-3xl max-w-md border-t-4 border-rose-400">
            <h1 className="text-rose-500 font-display text-2xl font-black mb-4 uppercase tracking-tight">Handshake Failed</h1>
            <p className="text-slate-500 text-sm mb-8 font-mono uppercase tracking-widest leading-relaxed font-bold">
              [CRITICAL] Database credentials missing in environment.
            </p>
            <div className="neo-concave p-6 rounded-2xl text-[0.7rem] text-slate-400 font-mono text-left space-y-4 mb-10">
               <p>1. CREATE <span className="text-slate-800 font-bold">.env</span> IN ROOT</p>
               <p>2. ADD SUPABASE KEYS</p>
               <p>3. RESTART SERVER</p>
            </div>
            <button className="neo-btn w-full !py-5 font-black uppercase tracking-widest rounded-2xl text-rose-500" onClick={() => window.location.reload()}>RETRY_HANDSHAKE</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TechBackground />
      <div className="tech-shell text-text">
        <div key={`${screen.name}-${animKey}`}>
          {screen.name === "gate" && (
            <RoleGate
              onParticipant={() => go({ name: "participant-login" })}
              onJudge={() => go({ name: "judge-login" })}
            />
          )}

          {screen.name === "participant-login" && (
            <TeamLogin
              onBack={() => go({ name: "gate" })}
              onSuccess={(teamId) => go({ name: "participant-home", teamId })}
            />
          )}

          {screen.name === "participant-home" && (
            <ParticipantHome
              teamId={screen.teamId}
              onLogout={() => go({ name: "participant-login" })}
            />
          )}

          {screen.name === "judge-login" && (
            <JudgeLogin
              onBack={() => go({ name: "gate" })}
              onSuccess={() => go({ name: "judge" })}
            />
          )}

          {screen.name === "judge" && (
            <JudgeDashboard onBack={() => go({ name: "gate" })} />
          )}
        </div>
      </div>
    </>
  );
}
