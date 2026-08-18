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
    updateVenue
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
    <div className="animate-fade-in mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                Command Monitor
              </h1>
              <span className="chip chip-live">Live telemetry</span>
            </div>
            <p className="font-mono mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-mute">
              Field Hunt · Ops desk
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary !min-h-[42px] !px-3 !py-2 text-sm"
            onClick={() => setIsAddingTeam(true)}
          >
            + Add Team
          </button>
          <button
            type="button"
            className="btn btn-secondary !min-h-[42px] !px-3 !py-2 text-sm"
            onClick={() => setIsAddingVenue(true)}
          >
            + Add Node
          </button>
          <button
            type="button"
            className="btn btn-secondary !min-h-[42px] !px-3 !py-2 text-sm"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all team progress to node 0? This cannot be undone in this session."
                )
              ) {
                resetAllProgress();
              }
            }}
          >
            Hard reset
          </button>
          <button
            type="button"
            className="btn btn-ghost !min-h-[42px] !px-3 !py-2 text-sm"
            onClick={onBack}
          >
            Exit desk
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tracked units" value={String(teams.length)} delay="stagger-1" />
        <StatCard
          label="Active trail"
          value={String(stats.active)}
          tone="cyan"
          delay="stagger-2"
        />
        <StatCard
          label="Mission clear"
          value={String(stats.finished)}
          tone="magenta"
          delay="stagger-3"
        />
        <StatCard
          label="Avg depth"
          value={stats.avgLevel.toFixed(1)}
          tone="violet"
          delay="stagger-4"
        />
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-cyan">
              Monitoring grid
            </p>
            <h2 className="font-display mt-1 text-xl font-bold text-white">
              Live team board
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="team-filter">
              Filter teams
            </label>
            <input
              id="team-filter"
              type="search"
              className="field-input !w-44 !py-2 text-sm sm:!w-56"
              placeholder="Filter units…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label className="sr-only" htmlFor="sort-key">
              Sort
            </label>
            <select
              id="sort-key"
              className="field-input !w-auto !py-2 text-sm"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="progress">Sort: progress</option>
              <option value="recent">Sort: recent stamp</option>
              <option value="name">Sort: name</option>
            </select>
          </div>
        </div>

        <div className="glass-strong glow-border monitor-table-wrap mt-4 rounded-2xl">
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Status</th>
                <th>Target / State</th>
                <th>Progress</th>
                <th>Last ping</th>
                <th>Uptime</th>
                <th>Action</th>
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
                />
              ))}
              {filtered.length === 0 && !isAddingTeam && (
                <tr>
                  <td colSpan={7} className="!py-10 text-center text-mute">
                    No units match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 mb-6">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-violet">
          Route topology
        </p>
        <h2 className="font-display mt-1 text-xl font-bold text-white">
          Venue nodes
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

function AddTeamRow({ onCancel, onAdd }: { onCancel: () => void, onAdd: (team: Team) => void }) {
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("");

  return (
    <tr className="bg-cyan/5">
      <td colSpan={6}>
        <div className="grid grid-cols-4 gap-3 p-2">
          <input className="field-input !py-1 !text-sm" placeholder="ID (e.g. FH-NEW)" value={teamId} onChange={e => setTeamId(e.target.value)} />
          <input className="field-input !py-1 !text-sm" placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} />
          <input className="field-input !py-1 !text-sm" placeholder="Leader Name" value={leaderName} onChange={e => setLeaderName(e.target.value)} />
          <input className="field-input !py-1 !text-sm" placeholder="Leader Phone" value={leaderPhone} onChange={e => setLeaderPhone(e.target.value)} />
        </div>
      </td>
      <td>
        <div className="flex gap-2 p-2">
          <button className="btn-link !text-lime" onClick={() => onAdd({
            teamId, teamName, leaderName, leaderPhone, members: [], currentLevelIndex: 0, lastCompletionAt: null, startedAt: null, finishedAt: null
          })}>Add</button>
          <button className="btn-link !text-rose" onClick={onCancel}>Cancel</button>
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
    <div className="glass rounded-2xl p-4 border-2 border-dashed border-cyan/30">
      <p className="font-mono text-[0.7rem] font-bold text-cyan">NEW NODE N{padStop(orderId)}</p>
      <div className="mt-3 space-y-2">
        <input className="field-input !py-1 !text-sm" placeholder="Venue Name" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="field-input !py-1 !text-sm h-16" placeholder="Riddle/Hint" value={hint} onChange={e => setHint(e.target.value)} />
        <input className="field-input !py-1 !text-sm" placeholder="Correct Code" value={code} onChange={e => setCode(e.target.value)} />
      </div>
      <div className="mt-4 flex gap-3">
        <button className="btn btn-primary !min-h-[32px] !py-1 text-xs flex-1" onClick={() => onAdd({
          id: `v-${Date.now()}`, orderId, name, locationLabel: "TBD", hintText: hint, venueImageUrl: "", correctCode: code, coordinatorName: "TBD", taskNote: "TBD"
        })}>Create</button>
        <button className="btn btn-ghost !min-h-[32px] !py-1 text-xs flex-1" onClick={onCancel}>Cancel</button>
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
    <div className={`glass animate-rise rounded-2xl p-4 ${delay}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.7rem] font-bold text-cyan">N{padStop(venue.orderId)}</span>
        <div className="flex gap-2">
          <button className="btn-link !text-[0.6rem]" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit"}</button>
          <button className="btn-link !text-[0.6rem] !text-rose" onClick={() => window.confirm("Delete node?") && onDelete()}>Del</button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-2">
          <input className="field-input !py-1 !text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
          <textarea className="field-input !py-1 !text-sm h-20" value={editHint} onChange={e => setEditHint(e.target.value)} />
          <button className="btn btn-primary w-full !min-h-[32px] mt-2" onClick={handleSave}>Save</button>
        </div>
      ) : (
        <>
          <p className="font-display mt-2 text-base font-bold leading-tight text-white">{venue.name}</p>
          <p className="mt-1 text-xs text-mute line-clamp-2">{venue.hintText}</p>
          <div className="progress-track mt-3">
            <div className="progress-fill" style={{ width: `${(clearedCount / Math.max(teamsCount, 1)) * 100}%` }} />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="chip">{huntingCount} hot</span>
            <span className="text-[0.65rem] text-mute">{clearedCount}/{teamsCount} cleared</span>
          </div>
        </>
      )}
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
    <div className={`glass animate-rise rounded-2xl px-3.5 py-3.5 ${delay ?? ""}`}>
      <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-mute">
        {label}
      </p>
      <p className={`font-mono mt-1.5 text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
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
}: {
  team: Team;
  now: number;
  totalVenues: number;
  venues: Venue[];
  onReset: () => void;
  onDelete: () => void;
}) {
  const { updateTeamDetails, setTeamLevel } = useHunt();
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

  let statusLabel = "Idle";
  let statusClass = "chip";
  if (done) {
    statusLabel = "Clear";
    statusClass = "chip chip-danger";
  } else if (started) {
    statusLabel = "Hunting";
    statusClass = "chip chip-ok";
  } else {
    statusClass = "chip chip-warn";
  }

  const targetLabel = done
    ? "Treasure claimed"
    : venue
      ? `Hunting clue → ${venue.name}`
      : "—";

  return (
    <tr>
      <td>
        {isEditing ? (
          <div className="space-y-2 py-1">
            <input
              type="text"
              className="field-input !py-1 !text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Team Name"
            />
            <input
              type="text"
              className="field-input !py-1 !text-sm"
              value={editLeader}
              onChange={(e) => setEditLeader(e.target.value)}
              placeholder="Leader Name"
            />
            <input
              type="text"
              className="field-input !py-1 !text-sm"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Phone"
            />
            <textarea
              className="field-input !py-1 !text-sm h-12"
              value={editMembers}
              onChange={(e) => setEditMembers(e.target.value)}
              placeholder="Members (comma separated)"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-link !text-[0.65rem] !text-lime"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className="btn-link !text-[0.65rem] !text-rose"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(team.teamName);
                  setEditLeader(team.leaderName);
                  setEditPhone(team.leaderPhone);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-white">{team.teamName}</p>
            <p className="font-mono mt-0.5 text-[0.68rem] tracking-wide text-cyan/80">
              {team.teamId}
            </p>
            <p className="mt-1 font-mono text-[0.65rem] text-violet/90">
              Leader {team.leaderName} · {team.leaderPhone}
            </p>
            <p className="mt-1 max-w-[12rem] truncate text-xs text-mute">
              {team.members.join(" · ")}
            </p>
          </>
        )}
      </td>
      <td>
        <span className={statusClass}>{statusLabel}</span>
      </td>
      <td>
        <p className="text-sm text-slate-200">{targetLabel}</p>
        {!done && venue && (
          <p className="font-mono mt-0.5 text-[0.65rem] text-mute">
            N{padStop(venue.orderId)} · {venue.locationLabel}
          </p>
        )}
      </td>
      <td>
        <div className="min-w-[7.5rem]">
          <select
            className="field-input !py-1 !text-[0.7rem] !w-auto bg-transparent border-none"
            value={team.currentLevelIndex}
            onChange={(e) => setTeamLevel(team.teamId, parseInt(e.target.value))}
          >
            {[...Array(totalVenues + 1)].map((_, i) => (
              <option key={i} value={i} className="bg-panel text-white">
                Level {i} {i === totalVenues ? "(DONE)" : ""}
              </option>
            ))}
          </select>
          <div className="progress-track mt-1.5">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </td>
      <td>
        <p className="font-mono text-[0.78rem] tabular-nums text-slate-200">
          {formatClock(team.lastCompletionAt)}
        </p>
        <p className="mt-0.5 text-xs text-mute">
          {formatRelative(team.lastCompletionAt, now)}
        </p>
      </td>
      <td>
        <p className="font-mono text-[0.85rem] font-semibold tabular-nums text-cyan">
          {started ? formatElapsed(elapsed) : "—"}
        </p>
      </td>
      <td>
        <div className="flex flex-col items-start gap-1">
          {!isEditing && (
            <button
              type="button"
              className="btn-link !text-[0.68rem]"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className="btn-link !text-[0.68rem] !text-rose/80"
            onClick={() => {
              if (window.confirm(`Delete ${team.teamName}?`)) {
                onDelete();
              }
            }}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn-link !text-[0.68rem] !text-amber/80"
            onClick={() => {
              if (window.confirm(`Reset progress for ${team.teamName}?`)) {
                onReset();
              }
            }}
          >
            Reset
          </button>
        </div>
      </td>
    </tr>
  );
}
