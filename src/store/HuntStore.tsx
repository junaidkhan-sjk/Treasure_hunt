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
  venues: Venue[]; // Full list for Judge
  currentClue: Venue | null; // Single secure clue for Participant
  loading: boolean;
  totalVenuesCount: number;
  getTeam: (teamId: string) => Team | undefined;
  loginByLeaderPhone: (phone: string) => Team | null;
  loginJudge: (accessCode: string) => boolean;
  ensureStarted: (teamId: string) => void;
  checkClueCode: (teamId: string, code: string) => CodeCheckResult;
  confirmAndAdvance: (teamId: string) => VerifyResult;
  refreshCurrentClue: (levelIndex: number) => Promise<void>;
  // --- God Mode Ops ---
  updateTeamDetails: (teamId: string, teamName: string, leaderName: string, leaderPhone: string, members: string[]) => void;
  addTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  setTeamLevel: (teamId: string, level: number) => void;
  addVenue: (venue: Venue) => void;
  updateVenue: (venueId: string, updates: Partial<Venue>) => void;
  deleteVenue: (venueId: string) => void;
  // --------------------
  resetTeam: (teamId: string) => void;
  resetAllProgress: () => void;
}

const HuntContext = createContext<HuntContextValue | null>(null);

export function HuntProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]); // Only populated for Judge
  const [currentClue, setCurrentClue] = useState<Venue | null>(null); // Only one for Participant
  const [totalVenuesCount, setTotalVenuesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isJudgeSession, setIsJudgeSession] = useState(false);

  // 1. Initial Load (Teams and Metadata only)
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const { data: teamsData } = await supabase.from('teams').select('*');
        const { count } = await supabase.from('venues').select('*', { count: 'exact', head: true });

        if (teamsData) setTeams(teamsData.map(mapDbTeam));
        if (count !== null) setTotalVenuesCount(count);
      } catch (error) {
        console.error("Supabase load error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // 2. Secure Clue Fetcher (For Participants)
  const refreshCurrentClue = useCallback(async (levelIndex: number) => {
    // Only fetch the exact venue needed for this level
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('order_id', levelIndex + 1)
      .single();

    if (data) {
      setCurrentClue(mapDbVenue(data));
    } else {
      setCurrentClue(null);
    }
  }, []);

  // 3. Full Sequence Fetcher (For Judge Only)
  const loadFullSequence = useCallback(async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('order_id', { ascending: true });
    if (data) setVenues(data.map(mapDbVenue));
  }, []);

  // Real-time Subscriptions
  useEffect(() => {
    const teamsChannel = supabase
      .channel('teams-all')
      .on('postgres_changes', { event: '*', table: 'teams' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTeams(prev => [...prev, mapDbTeam(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setTeams(prev => prev.map(t => t.teamId === payload.new.team_id ? mapDbTeam(payload.new) : t));
        } else if (payload.eventType === 'DELETE') {
          setTeams(prev => prev.filter(t => t.teamId === payload.old.team_id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  const loginJudge = useCallback((accessCode: string) => {
    const ok = judgeCodeMatch(accessCode);
    if (ok) {
      setIsJudgeSession(true);
      loadFullSequence();
    }
    return ok;
  }, [loadFullSequence]);

  const getTeam = useCallback(
    (teamId: string) =>
      teams.find((t) => t.teamId.toUpperCase() === teamId.trim().toUpperCase()),
    [teams]
  );

  const loginByLeaderPhone = useCallback(
    (phone: string) => {
      const team = teams.find((t) => phonesMatch(phone, t.leaderPhone));
      return team ?? null;
    },
    [teams]
  );

  const ensureStarted = useCallback(async (teamId: string) => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team || team.startedAt) return;
    await supabase.from('teams').update({ started_at: Date.now() }).eq('team_id', teamId);
  }, [teams]);

  const checkClueCode = useCallback(
    (teamId: string, code: string): CodeCheckResult => {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team) return { ok: false, message: "Team not found." };

      // Use the securely loaded currentClue instead of searching the full list
      if (!currentClue) return { ok: false, message: "No active clue loaded." };

      if (!codesMatch(code, currentClue.correctCode)) {
        return { ok: false, message: "Invalid code. Check the paper." };
      }

      return { ok: true };
    },
    [teams, currentClue]
  );

  const confirmAndAdvance = useCallback(
    (teamId: string): VerifyResult => {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team) return { ok: false, message: "Team not found." };

      const nextLevel = team.currentLevelIndex + 1;
      const finished = nextLevel >= totalVenuesCount;
      const now = Date.now();

      supabase
        .from('teams')
        .update({
          current_level_index: nextLevel,
          last_completion_at: now,
          started_at: team.startedAt ?? now,
          finished_at: finished ? now : null,
        })
        .eq('team_id', teamId)
        .then();

      return { ok: true, finished, nextLevel };
    },
    [teams, totalVenuesCount]
  );

  // Admin Ops (God Mode)
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
    const { count } = await supabase.from('venues').select('*', { count: 'exact', head: true });
    if (count !== null) setTotalVenuesCount(count);
  }, []);

  const updateVenue = useCallback(async (venueId: string, updates: Partial<Venue>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.hintText) dbUpdates.hint_text = updates.hintText;
    if (updates.locationLabel) dbUpdates.location_label = updates.locationLabel;
    if (updates.correctCode) dbUpdates.correct_code = updates.correctCode;
    await supabase.from('venues').update(dbUpdates).eq('id', venueId);
  }, []);

  const deleteVenue = useCallback(async (venueId: string) => {
    await supabase.from('venues').delete().eq('id', venueId);
    const { count } = await supabase.from('venues').select('*', { count: 'exact', head: true });
    if (count !== null) setTotalVenuesCount(count);
  }, []);

  const resetTeam = useCallback(async (teamId: string) => {
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null }).eq('team_id', teamId);
  }, []);

  const resetAllProgress = useCallback(async () => {
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null });
  }, []);

  const value = useMemo(
    () => ({
      teams,
      venues,
      currentClue,
      loading,
      totalVenuesCount,
      getTeam,
      loginByLeaderPhone,
      loginJudge,
      ensureStarted,
      checkClueCode,
      confirmAndAdvance,
      refreshCurrentClue,
      updateTeamDetails,
      addTeam,
      deleteTeam,
      setTeamLevel,
      addVenue,
      updateVenue,
      deleteVenue,
      resetTeam,
      resetAllProgress,
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
