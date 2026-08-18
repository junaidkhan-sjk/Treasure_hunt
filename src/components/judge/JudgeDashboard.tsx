import { useEffect, useMemo, useState } from "react";
import {
  padStop,
  type Team,
  type Venue,
} from "../../data/schema";
import { useHunt } from "../../store/HuntStore";
import { formatClock, formatElapsed, formatRelative } from "../../utils/format";
import { BrandMark } from "../BrandMark";

interface JudgeDashboardProps {
  onBack: () => void;
}

type SortKey = "progress" | "recent" | "name";

export function JudgeDashboard({ onBack }: JudgeDashboardProps) {
  const {
    teams,
    venues,
    resetAllProgress,
    resetTeam,
    addTeam,
    deleteTeam,
    addVenue,
    deleteVenue,
    updateVenue,
    setTeamLevel
  } = useHunt();
  const [now, setNow] = useState(Date.now());
  const [sortKey, setSortKey] = useState<SortKey>("progress");
  const [query, setQuery] = useState("");
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isAddingVenue, setIsAddingVenue] = useState(false);

  const totalVenues = venues.length;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const finishedCount = teams.filter(
      (t) => t.finishedAt != null || t.currentLevelIndex >= totalVenues
    ).length;
    const active = teams.filter(
      (t) =>
        t.startedAt != null &&
        t.finishedAt == null &&
        t.currentLevelIndex < totalVenues
    ).length;
    const idle = teams.length - finishedCount - active;
    const avgLevel =
      teams.reduce(
        (sum, t) => sum + Math.min(t.currentLevelIndex, totalVenues),
        0
      ) / Math.max(teams.length, 1);
    return { finished: finishedCount, active, idle, avgLevel };
  }, [teams, totalVenues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...teams];
    if (q) {
      list = list.filter(
        (t) =>
          t.teamName.toLowerCase().includes(q) ||
          t.teamId.toLowerCase().includes(q) ||
          t.members.some((m) => m.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (sortKey === "name") return a.teamName.localeCompare(b.teamName);
      if (sortKey === "recent") {
        return (b.lastCompletionAt ?? 0) - (a.lastCompletionAt ?? 0);
      }
      const aDone = a.finishedAt != null || a.currentLevelIndex >= totalVenues;
      const bDone = b.finishedAt != null || b.currentLevelIndex >= totalVenues;
      if (aDone !== bDone) return aDone ? -1 : 1;
      if (b.currentLevelIndex !== a.currentLevelIndex) {
        return b.currentLevelIndex - a.currentLevelIndex;
      }
      return (a.lastCompletionAt ?? 0) - (b.lastCompletionAt ?? 0);
    });
    return list;
  }, [teams, query, sortKey, totalVenues]);

  return (
    <div className="animate-fade-in mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 font-body">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-white/5 pb-8 text-text">
        <div className="flex items-center gap-4">
          <div className="relative">
            <BrandMark size="lg" />
            <div className="absolute -inset-1 animate-pulse-glow rounded-full bg-cyan/10 blur-md" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-black tracking-tighter text-white uppercase">
                HUNT<span className="text-cyan">CONTROL</span>
              </h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-lime/30 bg-lime/10">
                <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
                <span className="font-mono text-[0.6rem] font-bold text-lime uppercase tracking-widest">LIVE</span>
              </div>
            </div>
            <p className="font-mono mt-1 text-[0.6rem] font-bold uppercase tracking-[0.4em] text-mute">
              Organizer Mode // Master Dashboard
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary !min-h-[40px] !px-4 !py-2 text-[0.65rem] font-black uppercase tracking-widest border-white/5 hover:border-cyan/30"
            onClick={() => {
              const check = window.confirm("REPAIR DATABASE: This will re-sync all 7 stops with the correct secret codes. Proceed?");
              if (check) {
                // We'll provide the SQL in the instructions since we can't run arbitrary SQL from JS easily without a RPC
                alert("Please copy and run the 'Final Fix' SQL I provided earlier in your Supabase SQL Editor to ensure the codes match.");
              }
            }}
          >
            [ ! ] REPAIR DB
          </button>
          <button
            type="button"
            className="btn btn-secondary !min-h-[40px] !px-4 !py-2 text-[0.65rem] font-black uppercase tracking-widest border-white/5 hover:border-cyan/30"
            onClick={() => setIsAddingTeam(true)}
          >
            [ + ] ADD TEAM
          </button>
          <button
            type="button"
            className="btn btn-secondary !min-h-[40px] !px-4 !py-2 text-[0.65rem] font-black uppercase tracking-widest border-white/5 hover:border-cyan/30"
            onClick={() => setIsAddingVenue(true)}
          >
            [ + ] ADD STOP
          </button>
          <button
            type="button"
            className="btn btn-secondary !min-h-[40px] !px-4 !py-2 text-[0.65rem] font-black uppercase tracking-widest border-rose/20 text-rose/80 hover:bg-rose/5"
            onClick={() => {
              if (window.confirm("RESET EVERYTHING? This will delete all team progress.")) resetAllProgress();
            }}
          >
            HARD RESET
          </button>
          <div className="w-px h-8 bg-white/5 mx-2" />
          <button
            type="button"
            className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-[0.65rem] font-black uppercase tracking-widest"
            onClick={onBack}
          >
            EXIT
          </button>
        </div>
      </header>

      <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="TOTAL TEAMS" value={padStop(teams.length)} delay="stagger-1" />
        <StatCard label="TEAMS HUNTING" value={padStop(stats.active)} tone="cyan" delay="stagger-2" />
        <StatCard label="TEAMS FINISHED" value={padStop(stats.finished)} tone="magenta" delay="stagger-3" />
        <StatCard label="AVG PROGRESS" value={stats.avgLevel.toFixed(1)} tone="violet" delay="stagger-4" />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-cyan/70">
              Live Tracker
            </p>
            <h2 className="font-display mt-1 text-2xl font-black text-white uppercase tracking-tight">
              Team Progress Board
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
               <input
                id="team-filter"
                type="search"
                className="field-input !w-64 !py-2.5 !pl-10 text-xs font-mono uppercase tracking-wider bg-black/40 border-white/5 focus:border-cyan/50"
                placeholder="FIND A TEAM..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mute opacity-50">🔍</span>
            </div>
            <select
              id="sort-key"
              className="field-input !w-auto !py-2.5 text-[0.65rem] font-bold uppercase tracking-widest bg-black/40 border-white/5"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="progress">SORT BY PROGRESS</option>
              <option value="recent">SORT BY RECENT ACTIVITY</option>
              <option value="name">SORT BY NAME</option>
            </select>
          </div>
        </div>

        <div className="glass-strong glow-border monitor-table-wrap overflow-hidden rounded-2xl border-white/5 bg-black/20 text-text">
           <div className="scanning-line opacity-5" />
          <table className="monitor-table">
            <thead>
              <tr className="bg-white/5">
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">TEAM NAME</th>
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">STATUS</th>
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">CURRENT STOP</th>
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">PROGRESS</th>
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">LAST UPDATE</th>
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">TOTAL TIME</th>
                <th className="!text-[0.6rem] !font-black !tracking-[0.2em]">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isAddingTeam && (
                <AddTeamRow onCancel={() => setIsAddingTeam(false)} onAdd={(t) => { addTeam(t); setIsAddingTeam(false); }} />
              )}
              {filtered.map((team) => (
                <TeamRow
                  key={team.teamId}
                  team={team}
                  now={now}
                  totalVenues={totalVenues}
                  venues={venues}
                  onReset={() => resetTeam(team.teamId)}
                  onDelete={() => deleteTeam(team.teamId)}
                  setTeamLevel={setTeamLevel}
                />
              ))}
              {filtered.length === 0 && !isAddingTeam && (
                <tr>
                  <td colSpan={7} className="!py-20 text-center font-mono text-xs text-mute/50 italic uppercase tracking-widest">
                    {"[ NO TEAMS FOUND ]"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 mb-12">
        <div className="mb-8">
           <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-violet/70">
            Map
          </p>
          <h2 className="font-display mt-1 text-2xl font-black text-white uppercase tracking-tight">
            Campus Stops
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isAddingVenue && (
            <AddVenueCard
              orderId={venues.length + 1}
              onCancel={() => setIsAddingVenue(false)}
              onAdd={(v) => { addVenue(v); setIsAddingVenue(false); }}
            />
          )}
          {venues.map((v, i) => {
            const hunting = teams.filter(
              (t) =>
                t.finishedAt == null && t.currentLevelIndex === v.orderId - 1
            ).length;
            const cleared = teams.filter(
              (t) => t.currentLevelIndex >= v.orderId
            ).length;
            return (
              <VenueCard
                key={v.id}
                venue={v}
                teamsCount={teams.length}
                huntingCount={hunting}
                clearedCount={cleared}
                delay={`stagger-${(i % 4) + 1}`}
                onUpdate={(updates) => updateVenue(v.id, updates)}
                onDelete={() => deleteVenue(v.id)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  delay,
}: {
  label: string;
  value: string;
  tone?: "cyan" | "violet" | "magenta";
  delay?: string;
}) {
  const color =
    tone === "cyan"
      ? "text-cyan"
      : tone === "violet"
        ? "text-violet"
        : tone === "magenta"
          ? "text-magenta"
          : "text-white";
  return (
    <div className={`glass animate-rise rounded-2xl px-5 py-5 border-l-2 ${tone === 'cyan' ? 'border-cyan' : tone === 'violet' ? 'border-violet' : tone === 'magenta' ? 'border-magenta' : 'border-white/10'} ${delay ?? ""}`}>
      <p className="font-mono text-[0.55rem] font-black uppercase tracking-[0.2em] text-mute mb-2">
        {label}
      </p>
      <p className={`font-display text-4xl font-black tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

function AddTeamRow({ onCancel, onAdd }: { onCancel: () => void, onAdd: (team: Team) => void }) {
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("");

  return (
    <tr className="bg-cyan/5 border-y border-cyan/20">
      <td colSpan={6} className="!p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[0.5rem] font-bold text-cyan/70 uppercase">TEAM ID</span>
            <input className="field-input !py-2 !text-xs font-mono uppercase bg-black/60" placeholder="e.g. TEAM-01" value={teamId} onChange={e => setTeamId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <span className="text-[0.5rem] font-bold text-cyan/70 uppercase">TEAM NAME</span>
            <input className="field-input !py-2 !text-xs font-mono uppercase bg-black/60" placeholder="COOL TEAM" value={teamName} onChange={e => setTeamName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <span className="text-[0.5rem] font-bold text-cyan/70 uppercase">LEADER NAME</span>
            <input className="field-input !py-2 !text-xs font-mono uppercase bg-black/60" placeholder="NAME" value={leaderName} onChange={e => setLeaderName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <span className="text-[0.5rem] font-bold text-cyan/70 uppercase">MOBILE NUMBER</span>
            <input className="field-input !py-2 !text-xs font-mono uppercase bg-black/60" placeholder="PHONE" value={leaderPhone} onChange={e => setLeaderPhone(e.target.value)} />
          </div>
        </div>
      </td>
      <td className="!p-4">
        <div className="flex flex-col gap-2">
          <button className="btn btn-primary !min-h-[30px] !text-[0.6rem] font-black uppercase" onClick={() => onAdd({
            teamId, teamName, leaderName, leaderPhone, members: [], currentLevelIndex: 0, lastCompletionAt: null, startedAt: null, finishedAt: null
          })}>SAVE TEAM</button>
          <button className="btn btn-ghost !min-h-[30px] !text-[0.6rem] font-black uppercase" onClick={onCancel}>CANCEL</button>
        </div>
      </td>
    </tr>
  );
}

function AddVenueCard({ orderId, onCancel, onAdd }: { orderId: number, onCancel: () => void, onAdd: (venue: Venue) => void }) {
  const [name, setName] = useState("");
  const [hint, setHint] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="glass rounded-2xl p-6 border-2 border-dashed border-cyan/30 bg-cyan/5 text-text">
      <p className="font-mono text-[0.6rem] font-black text-cyan uppercase tracking-widest mb-4">NEW STOP :: #{orderId}</p>
      <div className="space-y-4">
        <input className="field-input !py-2.5 !text-xs font-mono uppercase bg-black/60" placeholder="LOCATION NAME" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="field-input !py-2.5 !text-xs font-mono uppercase h-24 bg-black/60" placeholder="RIDDLE FOR TEAM" value={hint} onChange={e => setHint(e.target.value)} />
        <input className="field-input !py-2.5 !text-xs font-mono uppercase bg-black/60" placeholder="SECRET CODE" value={code} onChange={e => setCode(e.target.value)} />
      </div>
      <div className="mt-6 flex gap-3">
        <button className="btn btn-primary !min-h-[36px] !py-2 text-[0.6rem] font-black uppercase flex-1 tracking-widest" onClick={() => onAdd({
          id: `v-${Date.now()}`, orderId, name, locationLabel: "TBD", hintText: hint, venueImageUrl: "", correctCode: code, coordinatorName: "TBD", taskNote: "TBD"
        })}>CREATE STOP</button>
        <button className="btn btn-ghost !min-h-[36px] !py-2 text-[0.6rem] font-black uppercase flex-1 tracking-widest" onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

function VenueCard({ venue, teamsCount, huntingCount, clearedCount, delay, onUpdate, onDelete }: {
  venue: Venue, teamsCount: number, huntingCount: number, clearedCount: number, delay: string, onUpdate: (u: Partial<Venue>) => void, onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(venue.name);
  const [editHint, setEditHint] = useState(venue.hintText);

  const handleSave = () => {
    onUpdate({ name: editName, hintText: editHint });
    setIsEditing(false);
  };

  return (
    <div className={`glass animate-rise rounded-2xl p-5 border-t-2 ${huntingCount > 0 ? 'border-t-lime/50' : 'border-t-white/10'} ${delay} text-text`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col">
           <span className="font-mono text-[0.6rem] font-black text-cyan uppercase tracking-tighter">CAMPUS STOP</span>
           <span className="font-mono text-xl font-black text-white">#{padStop(venue.orderId)}</span>
        </div>
        <div className="flex gap-2">
          <button className="btn-link !text-[0.55rem] font-black uppercase tracking-tighter opacity-50 hover:opacity-100" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "[ CANCEL ]" : "[ EDIT ]"}</button>
          <button className="btn-link !text-[0.55rem] font-black uppercase tracking-tighter text-rose/50 hover:text-rose" onClick={() => window.confirm("DELETE THIS STOP?") && onDelete()}>[ DEL ]</button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <input className="field-input !py-2 !text-[0.65rem] font-mono uppercase bg-black/40" value={editName} onChange={e => setEditName(e.target.value)} />
          <textarea className="field-input !py-2 !text-[0.65rem] font-mono uppercase h-24 bg-black/40" value={editHint} onChange={e => setEditHint(e.target.value)} />
          <button className="btn btn-primary w-full !min-h-[32px] mt-2 font-black text-[0.6rem] uppercase tracking-widest" onClick={handleSave}>UPDATE STOP</button>
        </div>
      ) : (
        <>
          <p className="font-display mt-2 text-sm font-black text-white uppercase tracking-wide truncate">{venue.name}</p>
          <p className="mt-2 text-[0.65rem] text-mute/80 font-mono leading-relaxed line-clamp-3 italic">"{venue.hintText}"</p>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between items-end">
               <span className="text-[0.5rem] font-bold text-mute uppercase tracking-widest">HUNT PROGRESS</span>
               <span className="text-[0.6rem] font-mono text-cyan">{Math.round((clearedCount / Math.max(teamsCount, 1)) * 100)}%</span>
            </div>
            <div className="progress-track !h-1 bg-white/5">
              <div className="progress-fill !shadow-none" style={{ width: `${(clearedCount / Math.max(teamsCount, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${huntingCount > 0 ? 'bg-lime animate-pulse' : 'bg-white/10'}`} />
              <span className="font-mono text-[0.6rem] text-mute uppercase">{huntingCount} AT SPOT</span>
            </div>
            <span className="font-mono text-[0.6rem] text-cyan/70 uppercase">{clearedCount} FOUND</span>
          </div>
        </>
      )}
    </div>
  );
}

function TeamRow({
  team,
  now,
  totalVenues,
  venues,
  onReset,
  onDelete,
  setTeamLevel
}: {
  team: Team;
  now: number;
  totalVenues: number;
  venues: Venue[];
  onReset: () => void;
  onDelete: () => void;
  setTeamLevel: (id: string, lvl: number) => void;
}) {
  const { updateTeamDetails } = useHunt();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.teamName);
  const [editLeader, setEditLeader] = useState(team.leaderName);
  const [editPhone, setEditPhone] = useState(team.leaderPhone);
  const [editMembers, setEditMembers] = useState(team.members.join(", "));

  const done =
    team.finishedAt != null || team.currentLevelIndex >= totalVenues;
  const started = team.startedAt != null;
  const venue = venues[team.currentLevelIndex];
  const progress = Math.min(team.currentLevelIndex, totalVenues);
  const pct = (progress / totalVenues) * 100;
  const elapsed = team.startedAt
    ? (team.finishedAt ?? now) - team.startedAt
    : 0;

  const handleSave = () => {
    const memberArray = editMembers.split(",").map(m => m.trim()).filter(m => m !== "");
    updateTeamDetails(team.teamId, editName, editLeader, editPhone, memberArray);
    setIsEditing(false);
  };

  let statusLabel = "READY";
  let statusClass = "chip !bg-white/5 !text-mute !border-white/10";
  if (done) {
    statusLabel = "FINISHED";
    statusClass = "chip !bg-magenta/10 !text-magenta !border-magenta/30 animate-pulse-glow";
  } else if (started) {
    statusLabel = "HUNTING";
    statusClass = "chip !bg-cyan/10 !text-cyan !border-cyan/30";
  }

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="!py-4 text-text">
        {isEditing ? (
          <div className="space-y-3 py-1 pr-4">
            <input className="field-input !py-1.5 !text-[0.65rem] font-mono uppercase bg-black/60" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="TEAM NAME" />
            <div className="grid grid-cols-2 gap-2">
               <input className="field-input !py-1.5 !text-[0.65rem] font-mono uppercase bg-black/60" value={editLeader} onChange={(e) => setEditLeader(e.target.value)} placeholder="LEADER" />
               <input className="field-input !py-1.5 !text-[0.65rem] font-mono uppercase bg-black/60" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="PHONE" />
            </div>
            <textarea className="field-input !py-1.5 !text-[0.65rem] font-mono uppercase h-16 bg-black/60" value={editMembers} onChange={(e) => setEditMembers(e.target.value)} placeholder="MEMBERS (COMMA SEPARATED)" />
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary !min-h-[28px] !text-[0.55rem] font-black uppercase flex-1" onClick={handleSave}>SAVE</button>
              <button type="button" className="btn btn-ghost !min-h-[28px] !text-[0.55rem] font-black uppercase flex-1" onClick={() => setIsEditing(false)}>CANCEL</button>
            </div>
          </div>
        ) : (
          <div className="pr-4">
            <p className="font-display text-base font-black text-white uppercase tracking-tight leading-none mb-1">{team.teamName}</p>
            <p className="font-mono text-[0.55rem] font-bold text-cyan/60 uppercase tracking-widest mb-2">TEAM :: {team.teamId}</p>
            <div className="flex flex-wrap gap-2 mt-2">
               {team.members.slice(0, 3).map(m => (
                 <span key={m} className="text-[0.5rem] font-mono text-mute px-1.5 py-0.5 rounded border border-white/5 bg-white/5">#{m.split(' ')[0]}</span>
               ))}
               {team.members.length > 3 && <span className="text-[0.5rem] font-mono text-mute">+{team.members.length - 3}</span>}
            </div>
          </div>
        )}
      </td>
      <td>
        <span className={statusClass}>{statusLabel}</span>
      </td>
      <td className="text-text">
        <div className="max-w-[10rem]">
          <p className="text-[0.7rem] font-bold text-white uppercase tracking-tight truncate">{done ? "COMPLETED!" : venue?.name || "---"}</p>
          {!done && venue && (
            <p className="font-mono mt-1 text-[0.55rem] font-bold text-mute uppercase tracking-tighter">
               {venue.locationLabel}
            </p>
          )}
        </div>
      </td>
      <td>
        <div className="min-w-[8rem] pr-6 text-text">
          <div className="flex justify-between items-center mb-1.5">
             <span className="font-mono text-[0.6rem] font-black text-white/50">{progress}/{totalVenues}</span>
             <select
                className="font-mono text-[0.55rem] font-black text-cyan uppercase bg-transparent border-none focus:ring-0 cursor-pointer"
                value={team.currentLevelIndex}
                onChange={(e) => setTeamLevel(team.teamId, parseInt(e.target.value))}
              >
                {[...Array(totalVenues + 1)].map((_, i) => (
                  <option key={i} value={i} className="bg-panel text-white">LEVEL {i}</option>
                ))}
              </select>
          </div>
          <div className="progress-track !h-1.5 bg-white/5 overflow-hidden">
            <div className="progress-fill !shadow-none rounded-none" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </td>
      <td className="text-text">
        <p className="font-mono text-[0.7rem] font-bold text-white tracking-tighter">
          {formatClock(team.lastCompletionAt)}
        </p>
        <p className="mt-1 text-[0.5rem] font-black text-mute uppercase tracking-widest">
          {formatRelative(team.lastCompletionAt, now)}
        </p>
      </td>
      <td className="text-text">
        <p className="font-mono text-[0.75rem] font-black text-cyan tracking-tighter">
          {started ? formatElapsed(elapsed) : "---"}
        </p>
      </td>
      <td className="!py-4">
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button type="button" className="text-cyan/60 hover:text-cyan transition-colors" title="Edit Team" onClick={() => setIsEditing(true)}>
              <span className="font-mono text-[0.6rem] font-black underline uppercase tracking-tighter">Edit</span>
            </button>
          )}
          <button type="button" className="text-rose/50 hover:text-rose transition-colors" title="Delete Team" onClick={() => window.confirm(`DELETE ${team.teamName}?`) && onDelete()}>
             <span className="font-mono text-[0.6rem] font-black underline uppercase tracking-tighter">Delete</span>
          </button>
          <button type="button" className="text-amber/50 hover:text-amber transition-colors" title="Reset Team" onClick={() => window.confirm(`RESET ${team.teamName}?`) && onReset()}>
             <span className="font-mono text-[0.6rem] font-black underline uppercase tracking-tighter">Reset</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
