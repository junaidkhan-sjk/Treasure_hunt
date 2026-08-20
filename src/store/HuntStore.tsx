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
  loginByPhoneDirect: (phone: string) => Promise<Team | null>;
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
  seedDefaultHunt: () => Promise<void>;
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
      .on('postgres_changes', { event: '*', table: 'teams' }, (payload) => {
          if (payload.eventType === 'INSERT') {
              setTeams(prev => [...prev, mapDbTeam(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
              setTeams(prev => prev.map(t => t.teamId === payload.new.team_id ? mapDbTeam(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
              setTeams(prev => prev.filter(t => t.teamId !== payload.old.team_id));
          }
      })
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

  // Fallback direct DB login if state is stale
  const loginByPhoneDirect = useCallback(async (phone: string) => {
    const localTeam = teams.find((t) => phonesMatch(phone, t.leaderPhone));
    if (localTeam) return localTeam;

    const { data, error } = await supabase.from('teams').select('*');
    if (!error && data) {
       const freshTeams = data.map(mapDbTeam);
       setTeams(freshTeams);
       return freshTeams.find(t => phonesMatch(phone, t.leaderPhone)) || null;
    }
    return null;
  }, [teams]);

  const ensureStarted = useCallback(async (teamId: string) => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team || team.startedAt) return;
    await supabase.from('teams').update({ started_at: Date.now() }).eq('team_id', teamId);
  }, [teams]);

  const checkClueCode = useCallback(
    async (teamId: string, code: string): Promise<CodeCheckResult> => {
      console.log(`[AUTH] Validating node for team: ${teamId}...`);

      try {
        const { data, error } = await supabase.functions.invoke('verify-clue', {
          body: { team_id: teamId, submitted_code: code }
        });

        if (!error && data && typeof data.ok === 'boolean') {
          if (data.ok) return { ok: true };
          return { ok: false, message: data.message || "Invalid code." };
        }
      } catch (err) {
        console.warn("[AUTH] Edge Function unavailable, falling back to secure local check.");
      }

      if (currentClue) {
        const isMatch = codesMatch(code, currentClue.correctCode);
        if (isMatch) return { ok: true };
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
    // Optimistic Update
    setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, teamName, leaderName, leaderPhone, members } : t));

    await supabase.from('teams').update({
      team_name: teamName,
      leader_name: leaderName,
      leader_phone: leaderPhone,
      members: members
    }).eq('team_id', teamId);
  }, []);

  const addTeam = useCallback(async (team: Team) => {
    // Optimistic Update
    setTeams(prev => [...prev, team]);

    const { error } = await supabase.from('teams').insert([mapTeamToDb(team)]);
    if (error) {
        console.error("Add team error:", error);
        fetchData(); // Rollback/Sync
    }
  }, [fetchData]);

  const deleteTeam = useCallback(async (teamId: string) => {
    setTeams(prev => prev.filter(t => t.teamId !== teamId));
    await supabase.from('teams').delete().eq('team_id', teamId);
  }, []);

  const setTeamLevel = useCallback(async (teamId: string, level: number) => {
    setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, currentLevelIndex: level } : t));
    await supabase.from('teams').update({ current_level_index: level, finished_at: level >= totalVenuesCount ? Date.now() : null }).eq('team_id', teamId);
  }, [totalVenuesCount]);

  const addVenue = useCallback(async (venue: Venue) => {
    await supabase.from('venues').insert([mapVenueToDb(venue)]);
    fetchData();
  }, [fetchData]);

  const updateVenue = useCallback(async (venueId: string, updates: Partial<Venue>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.hintText) dbUpdates.hint_text = updates.hintText;
    await supabase.from('venues').update(dbUpdates).eq('id', venueId);
  }, []);

  const deleteVenue = useCallback(async (venueId: string) => {
    await supabase.from('venues').delete().eq('id', venueId);
    fetchData();
  }, [fetchData]);

  const resetTeam = useCallback(async (teamId: string) => {
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null }).eq('team_id', teamId);
  }, []);

  const resetAllProgress = useCallback(async () => {
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null });
  }, []);

  const seedDefaultHunt = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Clear existing venues
      await supabase.from('venues').delete().neq('id', '0');

      // 2. Insert default 7 stops
      const defaults: Venue[] = [
        {
          id: 'v1', orderId: 1, name: '4th Floor', locationLabel: 'F Block',
          hintText: 'Climb high where the air is thin and the view is wide; find the spot where F-block touches the sky.',
          venueImageUrl: 'https://images.pexels.com/photos/13003822/pexels-photo-13003822.jpeg',
          correctCode: 'FLR01', coordinatorName: 'Charan', taskNote: 'Find the code on the notice board near the lift.'
        },
        {
          id: 'v2', orderId: 2, name: 'Library', locationLabel: 'Reading Wing',
          hintText: 'Turn pages softly, then follow the glow; where stories are silent, your next mark will show.',
          venueImageUrl: 'https://images.pexels.com/photos/5759484/pexels-photo-5759484.jpeg',
          correctCode: 'LIB02', coordinatorName: 'Vinamra', taskNote: 'Look behind the main entrance pillar for the code.'
        },
        {
          id: 'v3', orderId: 3, name: 'Yagya Shala', locationLabel: 'Sacred Area',
          hintText: 'From sacred smoke, let the spirit rise; seek the place where tradition meets the freshers eyes.',
          venueImageUrl: 'https://images.pexels.com/photos/37826466/pexels-photo-37826466.jpeg',
          correctCode: 'YGY03', coordinatorName: 'Ahmad', taskNote: 'Find the code near the offering entrance.'
        },
        {
          id: 'v4', orderId: 4, name: 'Admin', locationLabel: 'Main Counter',
          hintText: 'Forms may wait, but your quest will not stand; find the place where the campus rules the land.',
          venueImageUrl: 'https://images.pexels.com/photos/31139015/pexels-photo-31139015.jpeg',
          correctCode: 'ADM04', coordinatorName: 'Anjali', taskNote: 'Look under the reception desk ledge.'
        },
        {
          id: 'v5', orderId: 5, name: 'Sport Complex', locationLabel: 'Main Field',
          hintText: 'Where jerseys and whistles meet, the competition is fire; find the coach who watches the goal line higher.',
          venueImageUrl: 'https://images.pexels.com/photos/36393288/pexels-photo-36393288.jpeg',
          correctCode: 'SPT05', coordinatorName: 'Shivam', taskNote: 'Locate the volunteer near the sports equipment room.'
        },
        {
          id: 'v6', orderId: 6, name: 'Main Gate', locationLabel: 'Entrance Portal',
          hintText: 'The gateway to knowledge stands wide and tall; where everyone enters, find the start for all.',
          venueImageUrl: 'https://images.pexels.com/photos/29704449/pexels-photo-29704449.jpeg',
          correctCode: 'GAT06', coordinatorName: 'Shubhi', taskNote: 'The code is with the security guard at the gate.'
        },
        {
          id: 'v7', orderId: 7, name: 'Seminar Hall', locationLabel: 'Final Destination',
          hintText: 'Your last target is where lecture echoes call; once inside the hall, the treasure reveals to all.',
          venueImageUrl: 'https://images.pexels.com/photos/29704449/pexels-photo-29704449.jpeg',
          correctCode: 'HAL07', coordinatorName: 'Shubhranshu', taskNote: 'Final stop! Enter the hall code to finish your journey.'
        }
      ];

      const { error } = await supabase.from('venues').insert(defaults.map(mapVenueToDb));
      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error("Seed error:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const value = useMemo(
    () => ({
      teams, venues, currentClue, loading, totalVenuesCount, getTeam, loginByLeaderPhone, loginByPhoneDirect,
      loginJudge, ensureStarted, checkClueCode, confirmAndAdvance, refreshCurrentClue,
      updateTeamDetails, addTeam, deleteTeam, setTeamLevel, addVenue, updateVenue,
      deleteVenue, resetTeam, resetAllProgress, seedDefaultHunt
    }),
    [
      teams, venues, currentClue, loading, totalVenuesCount, getTeam, loginByLeaderPhone, loginByPhoneDirect,
      loginJudge, ensureStarted, checkClueCode, confirmAndAdvance, refreshCurrentClue,
      updateTeamDetails, addTeam, deleteTeam, setTeamLevel, addVenue, updateVenue,
      deleteVenue, resetTeam, resetAllProgress, seedDefaultHunt
    ]
  );

  return <HuntContext.Provider value={value}>{children}</HuntContext.Provider>;
}

export function useHunt() {
  const ctx = useContext(HuntContext);
  if (!ctx) throw new Error("useHunt must be used within HuntProvider");
  return ctx;
}
