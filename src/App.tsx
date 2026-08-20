import { useState, useEffect } from "react";
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
  const { loading, user, setEvent, activeEventId } = useHunt();
  const [screen, setScreen] = useState<AppScreen>({ name: "gate" });
  const [animKey, setAnimKey] = useState(0);

  const go = (next: AppScreen) => {
    setScreen(next);
    setAnimKey((k) => k + 1);
  };

  // Handle auto-redirect after Google Login
  useEffect(() => {
    if (user && screen.name === "judge-login" && activeEventId) {
       go({ name: "judge" });
    }
  }, [user, screen.name, activeEventId]);

  if (loading) {
    return (
      <>
        <TechBackground />
        <div className="flex min-h-dvh items-center justify-center bg-black/20">
          <div className="text-center space-y-6">
            <div className="relative h-20 w-20 mx-auto">
               <div className="absolute inset-0 animate-spin rounded-full border-b-2 border-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
               <div className="absolute inset-0 flex items-center justify-center font-mono text-[0.6rem] text-cyan font-bold uppercase">Uplink</div>
            </div>
            <p className="font-mono text-cyan text-xs tracking-[0.4em] animate-pulse uppercase">Establishing Satellite Uplink</p>
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
              onLogout={() => { setEvent(""); go({ name: "gate" }); }}
            />
          )}

          {screen.name === "judge-login" && (
            <JudgeLogin
              onBack={() => go({ name: "gate" })}
            />
          )}

          {screen.name === "judge" && user && (
            <JudgeDashboard onBack={() => { setEvent(""); go({ name: "gate" }); }} />
          )}

          {screen.name === "judge" && !user && (
            <div className="flex min-h-dvh items-center justify-center">
               <p className="text-rose">Authentication required. Redirecting...</p>
               {setTimeout(() => go({ name: "judge-login" }), 1500) && null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
