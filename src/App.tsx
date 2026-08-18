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
        <div className="flex min-h-dvh items-center justify-center bg-black/20">
          <div className="text-center space-y-6">
            <div className="relative h-20 w-20 mx-auto">
               <div className="absolute inset-0 animate-spin rounded-full border-b-2 border-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
               <div className="absolute inset-2 animate-spin rounded-full border-t-2 border-violet shadow-[0_0_15px_rgba(167,139,250,0.3)]" style={{ animationDirection: 'reverse' }} />
               <div className="absolute inset-0 flex items-center justify-center font-mono text-[0.6rem] text-cyan font-bold uppercase">Uplink</div>
            </div>
            <div className="space-y-2">
               <p className="font-mono text-cyan text-xs tracking-[0.4em] animate-pulse uppercase">Establishing Satellite Uplink</p>
               <div className="h-1 w-48 bg-white/5 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-cyan animate-[loading_2s_infinite]" />
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
          <div className="glass p-8 rounded-2xl border-rose/30 max-w-md">
            <h1 className="text-rose font-display text-xl font-bold mb-4 uppercase tracking-tighter">Connection Lost</h1>
            <p className="text-mute text-sm mb-6 font-mono uppercase tracking-tighter leading-relaxed">
              [CRITICAL] Database credentials missing in your environment.
            </p>
            <div className="bg-rose/10 p-5 rounded-xl text-[0.65rem] text-rose/80 font-mono text-left space-y-3 mb-8 border border-rose/20">
               <p>1. CREATE A FILE NAMED <span className="text-white">.env</span> IN ROOT</p>
               <p>2. ADD YOUR SUPABASE URL AND ANON KEY</p>
               <p>3. RESTART THE DEV SERVER</p>
            </div>
            <button className="btn btn-primary w-full !py-4 font-black uppercase tracking-widest" onClick={() => window.location.reload()}>RETRY_HANDSHAKE</button>
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
