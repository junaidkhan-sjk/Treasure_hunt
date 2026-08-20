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
    <div className="animate-fade-in mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 font-body text-slate-700">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-300 pb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <BrandMark size="lg" />
            <div className="absolute -inset-1 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-black tracking-tighter text-slate-800 uppercase">
                HUNT<span className="text-cyan-600">CONTROL</span>
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neo-concave">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[0.6rem] font-black text-emerald-600 uppercase tracking-widest">LIVE</span>
              </div>
            </div>
            <p className="font-mono mt-1 text-[0.6rem] font-bold uppercase tracking-[0.4em] text-slate-400">
              Organizer Mode // Master HUD
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="neo-btn px-4 py-2 text-[0.65rem] font-black uppercase tracking-widest"
            onClick={() => {
              const check = window.confirm("REPAIR DATABASE: This will re-sync all 7 stops with the correct secret codes. Proceed?");
              if (check) {
                alert("Please copy and run the 'Final Fix' SQL in your Supabase SQL Editor.");
              }
            }}
          >
            REPAIR DB
          </button>
          <button
            type="button"
            className="neo-btn px-4 py-2 text-[0.65rem] font-black uppercase tracking-widest text-cyan-600"
            onClick={() => setIsAddingTeam(true)}
          >
            ADD TEAM
          </button>
          <button
            type="button"
            className="neo-btn px-4 py-2 text-[0.65rem] font-black uppercase tracking-widest text-indigo-600"
            onClick={() => setIsAddingVenue(true)}
          >
            ADD STOP
          </button>
          <button
            type="button"
            className="neo-btn px-4 py-2 text-[0.65rem] font-black uppercase tracking-widest text-rose-500"
            onClick={() => {
              if (window.confirm("RESET EVERYTHING? This will delete all team progress.")) resetAllProgress();
            }}
          >
            RESET ALL
          </button>
          <div className="w-0.5 h-8 bg-slate-300 mx-2" />
          <button
            type="button"
            className="neo-btn px-4 py-2 text-[0.65rem] font-black uppercase tracking-widest"
            onClick={onBack}
          >
            EXIT
          </button>
        </div>
      </header>

      <section className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <StatCard label="TOTAL TEAMS" value={padStop(teams.length)} delay="stagger-1" />
        <StatCard label="ACTIVE" value={padStop(stats.active)} tone="cyan" delay="stagger-2" />
        <StatCard label="FINISHED" value={padStop(stats.finished)} tone="magenta" delay="stagger-3" />
        <StatCard label="AVG LEVEL" value={stats.avgLevel.toFixed(1)} tone="violet" delay="stagger-4" />
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <p className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-slate-400">
              Live Tracker
            </p>
            <h2 className="font-display mt-1 text-2xl font-black text-slate-800 uppercase tracking-tight">
              Leaderboard
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
               <input
                id="team-filter"
                type="search"
                className="neo-concave w-64 rounded-xl py-3 pl-10 pr-4 text-xs font-mono uppercase tracking-wider outline-none"
                placeholder="FIND TEAM..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
            </div>
            <select
              id="sort-key"
              className="neo-concave rounded-xl py-3 px-4 text-[0.65rem] font-black uppercase tracking-widest outline-none border-none"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="progress">PROGRESS</option>
              <option value="recent">ACTIVITY</option>
              <option value="name">NAME</option>
            </select>
          </div>
        </div>

        <div className="neo-flat overflow-hidden rounded-3xl">
          <table className="monitor-table !min-w-[800px]">
            <thead className="neo-concave">
              <tr>
                <th className="!text-slate-400">TEAM NAME</th>
                <th className="!text-slate-400">STATUS</th>
                <th className="!text-slate-400">LOCATION</th>
                <th className="!text-slate-400">LEVEL</th>
                <th className="!text-slate-400">LAST ACTIVE</th>
                <th className="!text-slate-400">TIME</th>
                <th className="!text-slate-400">ACTIONS</th>
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
                  <td colSpan={7} className="!py-24 text-center font-mono text-xs text-slate-300 italic uppercase tracking-widest">
                    {"[ NO DATA FOUND ]"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20 mb-20">
        <div className="mb-10">
           <p className="font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-slate-400">
            Map
          </p>
          <h2 className="font-display mt-1 text-2xl font-black text-slate-800 uppercase tracking-tight">
            Campus Checkpoints
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      ? "text-cyan-600"
      : tone === "violet"
        ? "text-indigo-600"
        : tone === "magenta"
          ? "text-rose-500"
          : "text-slate-800";
  return (
    <div className={`neo-flat animate-rise rounded-3xl px-6 py-8 border-l-4 ${tone === 'cyan' ? 'border-cyan-400' : tone === 'violet' ? 'border-indigo-400' : tone === 'magenta' ? 'border-rose-400' : 'border-slate-300'} ${delay ?? ""}`}>
      <p className="font-mono text-[0.55rem] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
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
  const [members, setMembers] = useState("");

  return (
    <tr className="neo-concave">
      <td colSpan={6} className="!p-6 text-slate-700">
        <div className="grid grid-cols-5 gap-6">
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">TEAM ID</span>
            <input className="neo-input w-full !py-3 !text-xs font-mono uppercase rounded-xl" placeholder="e.g. TEAM-01" value={teamId} onChange={e => setTeamId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">TEAM NAME</span>
            <input className="neo-input w-full !py-3 !text-xs font-mono uppercase rounded-xl" placeholder="COOL SQUAD" value={teamName} onChange={e => setTeamName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">LEADER</span>
            <input className="neo-input w-full !py-3 !text-xs font-mono uppercase rounded-xl" placeholder="NAME" value={leaderName} onChange={e => setLeaderName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">PHONE</span>
            <input className="neo-input w-full !py-3 !text-xs font-mono uppercase rounded-xl" placeholder="PHONE" value={leaderPhone} onChange={e => setLeaderPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">CREW (CSV)</span>
            <input className="neo-input w-full !py-3 !text-xs font-mono uppercase rounded-xl" placeholder="M1, M2..." value={members} onChange={e => setMembers(e.target.value)} />
          </div>
        </div>
      </td>
      <td className="!p-6">
        <div className="flex flex-col gap-3">
          <button className="neo-btn !min-h-[36px] !text-[0.65rem] font-black uppercase text-emerald-600" onClick={() => onAdd({
            teamId, teamName, leaderName, leaderPhone,
            members: members.split(',').map(m => m.trim()).filter(m => m !== ""),
            currentLevelIndex: 0, lastCompletionAt: null, startedAt: null, finishedAt: null
          })}>SAVE</button>
          <button className="neo-btn !min-h-[36px] !text-[0.65rem] font-black uppercase" onClick={onCancel}>CANCEL</button>
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
    <div className="neo-flat rounded-3xl p-8 border-2 border-dashed border-cyan-300">
      <p className="font-mono text-[0.65rem] font-black text-cyan-600 uppercase tracking-widest mb-6 text-center">NEW CHECKPOINT :: #{orderId}</p>
      <div className="space-y-6">
        <input className="neo-input w-full !py-4 !text-sm font-mono uppercase rounded-2xl" placeholder="LOCATION NAME" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="neo-input w-full !py-4 !text-sm font-mono uppercase h-28 rounded-2xl" placeholder="RIDDLE FOR TEAM" value={hint} onChange={e => setHint(e.target.value)} />
        <input className="neo-input w-full !py-4 !text-sm font-mono uppercase rounded-2xl" placeholder="SECRET CODE" value={code} onChange={e => setCode(e.target.value)} />
      </div>
      <div className="mt-10 flex gap-4">
        <button className="neo-btn w-full !py-4 text-[0.7rem] font-black uppercase text-cyan-600 rounded-2xl" onClick={() => onAdd({
          id: `v-${Date.now()}`, orderId, name, locationLabel: "TBD", hintText: hint, venueImageUrl: "", correctCode: code, coordinatorName: "TBD", taskNote: "TBD"
        })}>CREATE</button>
        <button className="neo-btn w-full !py-4 text-[0.7rem] font-black uppercase rounded-2xl" onClick={onCancel}>CANCEL</button>
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
    <div className={`neo-flat animate-rise rounded-3xl p-6 border-t-4 ${huntingCount > 0 ? 'border-t-emerald-400' : 'border-t-slate-300'} ${delay} text-slate-700`}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex flex-col">
           <span className="font-mono text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">NODE :: #{padStop(venue.orderId)}</span>
        </div>
        <div className="flex gap-2">
          <button className="neo-btn px-3 py-1 rounded-md !text-[0.55rem] font-black uppercase" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "CANCEL" : "EDIT"}</button>
          <button className="neo-btn px-3 py-1 rounded-md !text-[0.55rem] font-black uppercase text-rose-500" onClick={() => window.confirm("DELETE THIS NODE?") && onDelete()}>DEL</button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-6 space-y-4">
          <input className="neo-input w-full !py-3 !text-[0.7rem] font-mono uppercase rounded-xl" value={editName} onChange={e => setEditName(e.target.value)} />
          <textarea className="neo-input w-full !py-3 !text-[0.7rem] font-mono uppercase h-24 rounded-xl" value={editHint} onChange={e => setEditHint(e.target.value)} />
          <button className="neo-btn w-full !min-h-[40px] mt-4 font-black text-[0.65rem] uppercase text-cyan-600 rounded-xl" onClick={handleSave}>UPDATE NODE</button>
        </div>
      ) : (
        <>
          <p className="font-display mt-2 text-base font-black text-slate-800 uppercase tracking-tight truncate">{venue.name}</p>
          <p className="mt-4 text-[0.7rem] text-slate-500 font-mono leading-relaxed line-clamp-3 italic">"{venue.hintText}"</p>
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-end">
               <span className="text-[0.55rem] font-black text-slate-400 uppercase tracking-widest">SYNC STATUS</span>
               <span className="text-[0.7rem] font-mono font-black text-cyan-600">{Math.round((clearedCount / Math.max(teamsCount, 1)) * 100)}%</span>
            </div>
            <div className="neo-concave !h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full transition-all duration-700" style={{ width: `${(clearedCount / Math.max(teamsCount, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${huntingCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} />
              <span className="font-mono text-[0.6rem] font-bold text-slate-400 uppercase">{huntingCount} ACTIVE</span>
            </div>
            <span className="font-mono text-[0.6rem] font-black text-cyan-600 uppercase">{clearedCount} SECURED</span>
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

  let statusClass = "neo-concave px-3 py-1 rounded-full text-[0.55rem] font-black uppercase tracking-widest text-slate-400";
  let statusLabel = "IDLE";
  if (done) {
    statusLabel = "COMPLETE";
    statusClass = "neo-flat bg-indigo-50 px-3 py-1 rounded-full text-[0.55rem] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100";
  } else if (started) {
    statusLabel = "HUNTING";
    statusClass = "neo-flat bg-cyan-50 px-3 py-1 rounded-full text-[0.55rem] font-black uppercase tracking-widest text-cyan-600 border border-cyan-100";
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="!py-6">
        {isEditing ? (
          <div className="space-y-4 py-2 pr-6">
            <input className="neo-input w-full !py-2 !text-xs font-mono uppercase rounded-xl" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="TEAM NAME" />
            <div className="grid grid-cols-2 gap-4">
               <input className="neo-input w-full !py-2 !text-xs font-mono uppercase rounded-xl" value={editLeader} onChange={(e) => setEditLeader(e.target.value)} placeholder="LEADER" />
               <input className="neo-input w-full !py-2 !text-xs font-mono uppercase rounded-xl" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="PHONE" />
            </div>
            <textarea className="neo-input w-full !py-2 !text-xs font-mono uppercase h-20 rounded-xl" value={editMembers} onChange={(e) => setEditMembers(e.target.value)} placeholder="CREW (CSV)" />
            <div className="flex gap-4">
              <button type="button" className="neo-btn !min-h-[32px] !text-[0.6rem] font-black uppercase flex-1 rounded-xl text-emerald-600" onClick={handleSave}>SAVE</button>
              <button type="button" className="neo-btn !min-h-[32px] !text-[0.6rem] font-black uppercase flex-1 rounded-xl" onClick={() => setIsEditing(false)}>CANCEL</button>
            </div>
          </div>
        ) : (
          <div className="pr-6">
            <p className="font-display text-base font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{team.teamName}</p>
            <p className="font-mono text-[0.55rem] font-black text-cyan-600 uppercase tracking-widest mb-3">ID :: {team.teamId}</p>
            <div className="flex flex-wrap gap-2">
               {team.members.slice(0, 3).map(m => (
                 <span key={m} className="neo-concave px-2 py-0.5 rounded-lg text-[0.5rem] font-black text-slate-400 uppercase tracking-tighter">#{m.split(' ')[0]}</span>
               ))}
            </div>
          </div>
        )}
      </td>
      <td>
        <span className={statusClass}>{statusLabel}</span>
      </td>
      <td className="text-slate-600">
        <div className="max-w-[10rem]">
          <p className="text-[0.75rem] font-black text-slate-800 uppercase tracking-tight truncate">{done ? "MISSION DONE!" : venue?.name || "---"}</p>
          {!done && venue && (
            <p className="font-mono mt-1 text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest">
               NODE #{padStop(venue.orderId)}
            </p>
          )}
        </div>
      </td>
      <td>
        <div className="min-w-[8rem] pr-8">
          <div className="flex justify-between items-center mb-2">
             <span className="font-mono text-[0.6rem] font-black text-slate-400">{progress}/{totalVenues}</span>
             <select
                className="font-mono text-[0.6rem] font-black text-cyan-600 uppercase bg-transparent outline-none cursor-pointer"
                value={team.currentLevelIndex}
                onChange={(e) => setTeamLevel(team.teamId, parseInt(e.target.value))}
              >
                {[...Array(totalVenues + 1)].map((_, i) => (
                  <option key={i} value={i}>LVL {i}</option>
                ))}
              </select>
          </div>
          <div className="neo-concave !h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </td>
      <td className="text-slate-600">
        <p className="font-mono text-[0.75rem] font-black text-slate-800 tracking-tighter">
          {formatClock(team.lastCompletionAt)}
        </p>
        <p className="mt-1 text-[0.55rem] font-black text-slate-400 uppercase tracking-widest">
          {formatRelative(team.lastCompletionAt, now)}
        </p>
      </td>
      <td className="text-slate-600">
        <p className="font-mono text-[0.8rem] font-black text-cyan-600 tracking-tighter">
          {started ? formatElapsed(elapsed) : "---"}
        </p>
      </td>
      <td className="!py-6">
        <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button type="button" className="neo-btn p-2 rounded-lg text-cyan-600" title="Edit" onClick={() => setIsEditing(true)}>
              <span className="font-mono text-[0.6rem] font-black uppercase">Edit</span>
            </button>
          )}
          <button type="button" className="neo-btn p-2 rounded-lg text-rose-500" title="Delete" onClick={() => window.confirm(`DELETE ${team.teamName}?`) && onDelete()}>
             <span className="font-mono text-[0.6rem] font-black uppercase">Del</span>
          </button>
          <button type="button" className="neo-btn p-2 rounded-lg text-amber-500" title="Reset" onClick={() => window.confirm(`RESET ${team.teamName}?`) && onReset()}>
             <span className="font-mono text-[0.6rem] font-black uppercase">Reset</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
