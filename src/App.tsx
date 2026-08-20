import { useState, useEffect } from "react";
import { HuntProvider, useHunt } from "./store/HuntStore";
import { TechBackground } from "./components/TechBackground";
import { RoleGate } from "./components/RoleGate";
import { TeamLogin } from "./components/participant/TeamLogin";
import { ParticipantHome } from "./components/participant/ParticipantHome";
import { JudgeLogin } from "./components/judge/JudgeLogin";
import { JudgeDashboard } from "./components/judge/JudgeDashboard";
import { BrandMark } from "./components/BrandMark";

type AppScreen =
  | { name: "gatekeeper" }
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
  const { loading, activeEventId, setEvent, user } = useHunt();
  const [screen, setScreen] = useState<AppScreen>({ name: "gatekeeper" });
  const [animKey, setAnimKey] = useState(0);

  const go = (next: AppScreen) => {
    setScreen(next);
    setAnimKey((k) => k + 1);
  };

  // Persist screen state or handle redirect after Google Login
  useEffect(() => {
    if (user && screen.name === "judge-login") {
       go({ name: "judge" });
    }
  }, [user, screen.name]);

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

  // Multi-Tenant Gatekeeper
  if (screen.name === "gatekeeper" && !activeEventId) {
    return <EventGate onSelect={(id) => { setEvent(id); go({ name: "gate" }); }} />;
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
            />
          )}

          {screen.name === "judge" && user && (
            <JudgeDashboard onBack={() => { setEvent(""); go({ name: "gatekeeper" }); }} />
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

function EventGate({ onSelect }: { onSelect: (id: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <>
      <TechBackground />
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="glass-strong max-w-md w-full rounded-3xl p-8 text-center animate-fade-in">
           <BrandMark size="lg" className="mx-auto mb-6 animate-float" />
           <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight mb-2">Treasure Hunt Engine</h1>
           <p className="text-sm text-mute mb-10">Enter an Event Key to join or conduct a hunt.</p>

           <div className="space-y-6">
              <input
                className="field-input !text-center !text-xl !py-4 font-mono uppercase tracking-widest"
                placeholder="EVENT-CODE"
                value={val}
                onChange={e => setVal(e.target.value.toUpperCase())}
              />
              <button
                disabled={!val.trim()}
                className="btn btn-primary w-full !py-4 font-black uppercase tracking-widest disabled:opacity-50"
                onClick={() => onSelect(val)}
              >
                PROCEED
              </button>
           </div>

           <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-[0.65rem] text-mute uppercase tracking-[0.2em] mb-4">How to use</p>
              <div className="text-[0.6rem] text-cyan/60 font-mono text-left space-y-2">
                 <p>» Pick any unique name for your event.</p>
                 <p>» Share that name with your players.</p>
                 <p>» Use Google Login to manage your event.</p>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}
