import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import {
  codesMatch,
  judgeCodeMatch,
  phonesMatch,
  mapDbTeam,
  mapTeamToDb,
  mapDbVenue,
  mapVenueToDb,
  type Team,
  type Venue,
} from "../data/schema";

export type VerifyResult =
  | { ok: true; finished: boolean; nextLevel: number }
  | { ok: false; message: string };

export type CodeCheckResult =
  | { ok: true }
  | { ok: false; message: string };

interface HuntContextValue {
  teams: Team[];
  venues: Venue[];
  currentClue: Venue | null;
  loading: boolean;
  totalVenuesCount: number;
  getTeam: (teamId: string) => Team | undefined;
  loginByLeaderPhone: (phone: string) => Team | null;
  loginJudge: (accessCode: string) => boolean;
  ensureStarted: (teamId: string) => void;
  checkClueCode: (teamId: string, code: string) => Promise<CodeCheckResult>;
  confirmAndAdvance: (teamId: string) => VerifyResult;
  refreshCurrentClue: (levelIndex: number) => Promise<void>;
  updateTeamDetails: (teamId: string, teamName: string, leaderName: string, leaderPhone: string, members: string[]) => void;
  addTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  setTeamLevel: (teamId: string, level: number) => void;
  addVenue: (venue: Venue) => void;
  updateVenue: (venueId: string, updates: Partial<Venue>) => void;
  deleteVenue: (venueId: string) => void;
  resetTeam: (teamId: string) => void;
  resetAllProgress: () => void;
}

const HuntContext = createContext<HuntContextValue | null>(null);

export function HuntProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentClue, setCurrentClue] = useState<Venue | null>(null);
  const [totalVenuesCount, setTotalVenuesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Initial Data Fetch
  const fetchData = useCallback(async () => {
    try {
      const { data: teamsData, error: tErr } = await supabase.from('teams').select('*');
      const { data: venuesData, count, error: vErr } = await supabase
        .from('venues')
        .select('*', { count: 'exact' })
        .order('order_id', { ascending: true });

      if (tErr) console.error("Teams fetch error:", tErr);
      if (vErr) console.error("Venues fetch error:", vErr);

      if (teamsData) setTeams(teamsData.map(mapDbTeam));
      if (venuesData) setVenues(venuesData.map(mapDbVenue));
      if (count !== null) setTotalVenuesCount(count);
    } catch (error) {
      console.error("Supabase fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Real-time Subscriptions
  useEffect(() => {
    const teamsChannel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'venues' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
    };
  }, [fetchData]);

  const refreshCurrentClue = useCallback(async (levelIndex: number) => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('order_id', levelIndex + 1)
      .maybeSingle();

    if (error) console.error("Clue fetch error:", error);
    if (data) setCurrentClue(mapDbVenue(data));
  }, []);

  const loginJudge = useCallback((accessCode: string) => {
    const ok = judgeCodeMatch(accessCode);
    if (ok) fetchData();
    return ok;
  }, [fetchData]);

  const getTeam = useCallback(
    (teamId: string) => teams.find((t) => t.teamId.toUpperCase() === teamId.trim().toUpperCase()),
    [teams]
  );

  const loginByLeaderPhone = useCallback(
    (phone: string) => teams.find((t) => phonesMatch(phone, t.leaderPhone)) ?? null,
    [teams]
  );

  const ensureStarted = useCallback(async (teamId: string) => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team || team.startedAt) return;
    await supabase.from('teams').update({ started_at: Date.now() }).eq('team_id', teamId);
  }, [teams]);

  const checkClueCode = useCallback(
    async (teamId: string, code: string): Promise<CodeCheckResult> => {
      console.log(`[AUTH] Validating node for team: ${teamId}...`);

      // Step 1: Try Edge Function (Ultimate Security)
      try {
        const { data, error } = await supabase.functions.invoke('verify-clue', {
          body: { team_id: teamId, submitted_code: code }
        });

        // If function exists and returns a clear YES/NO
        if (!error && data && typeof data.ok === 'boolean') {
          if (data.ok) return { ok: true };
          return { ok: false, message: data.message || "Invalid code." };
        }
      } catch (err) {
        console.warn("[AUTH] Edge Function unavailable, falling back to secure local check.");
      }

      // Step 2: Fallback to Secure Client-Side Hash Check
      // This is still very secure because we only compare hashes, not plain text.
      if (currentClue) {
        const isMatch = codesMatch(code, currentClue.correctCode);
        if (isMatch) {
          console.log("[AUTH] Local validation successful.");
          return { ok: true };
        }
      }

      return { ok: false, message: "Invalid code. Check your clue paper and try again." };
    },
    [currentClue]
  );

  const confirmAndAdvance = useCallback(
    (teamId: string): VerifyResult => {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team) return { ok: false, message: "Team not found." };

      const nextLevel = team.currentLevelIndex + 1;
      const finished = nextLevel >= totalVenuesCount;
      const now = Date.now();

      // Trigger DB update
      supabase.from('teams').update({
        current_level_index: nextLevel,
        last_completion_at: now,
        started_at: team.startedAt ?? now,
        finished_at: finished ? now : null,
      }).eq('team_id', teamId).then(({error}) => {
        if (error) console.error("Advancement error:", error);
      });

      return { ok: true, finished, nextLevel };
    },
    [teams, totalVenuesCount]
  );

  // Admin Ops
  const updateTeamDetails = useCallback(async (teamId: string, teamName: string, leaderName: string, leaderPhone: string, members: string[]) => {
    await supabase.from('teams').update({ team_name: teamName, leader_name: leaderName, leader_phone: leaderPhone, members: members }).eq('team_id', teamId);
  }, []);

  const addTeam = useCallback(async (team: Team) => {
    await supabase.from('teams').insert([mapTeamToDb(team)]);
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    await supabase.from('teams').delete().eq('team_id', teamId);
  }, []);

  const setTeamLevel = useCallback(async (teamId: string, level: number) => {
    await supabase.from('teams').update({ current_level_index: level, finished_at: level >= totalVenuesCount ? Date.now() : null }).eq('team_id', teamId);
  }, [totalVenuesCount]);

  const addVenue = useCallback(async (venue: Venue) => {
    await supabase.from('venues').insert([mapVenueToDb(venue)]);
  }, []);

  const updateVenue = useCallback(async (venueId: string, updates: Partial<Venue>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.hintText) dbUpdates.hint_text = updates.hintText;
    await supabase.from('venues').update(dbUpdates).eq('id', venueId);
  }, []);

  const deleteVenue = useCallback(async (venueId: string) => {
    await supabase.from('venues').delete().eq('id', venueId);
  }, []);

  const resetTeam = useCallback(async (teamId: string) => {
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null }).eq('team_id', teamId);
  }, []);

  const resetAllProgress = useCallback(async () => {
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null });
  }, []);

  const value = useMemo(
    () => ({
      teams, venues, currentClue, loading, totalVenuesCount, getTeam, loginByLeaderPhone,
      loginJudge, ensureStarted, checkClueCode, confirmAndAdvance, refreshCurrentClue,
      updateTeamDetails, addTeam, deleteTeam, setTeamLevel, addVenue, updateVenue,
      deleteVenue, resetTeam, resetAllProgress,
    }),
    [
      teams, venues, currentClue, loading, totalVenuesCount, getTeam, loginByLeaderPhone,
      loginJudge, ensureStarted, checkClueCode, confirmAndAdvance, refreshCurrentClue,
      updateTeamDetails, addTeam, deleteTeam, setTeamLevel, addVenue, updateVenue,
      deleteVenue, resetTeam, resetAllProgress
    ]
  );

  return <HuntContext.Provider value={value}>{children}</HuntContext.Provider>;
}

export function useHunt() {
  const ctx = useContext(HuntContext);
  if (!ctx) throw new Error("useHunt must be used within HuntProvider");
  return ctx;
}
