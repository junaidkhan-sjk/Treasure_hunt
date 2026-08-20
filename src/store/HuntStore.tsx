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
  activeEventId: string | null;
  totalVenuesCount: number;
  setEvent: (eventId: string) => void;
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
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentClue, setCurrentClue] = useState<Venue | null>(null);
  const [totalVenuesCount, setTotalVenuesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Set Event and Start Fetching
  const setEvent = (eventId: string) => {
    const normalized = eventId.trim().toUpperCase();
    setActiveEventId(normalized);
    setLoading(true);
  };

  const fetchData = useCallback(async () => {
    if (!activeEventId) return;

    try {
      const { data: teamsData, error: tErr } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', activeEventId);

      const { data: venuesData, count, error: vErr } = await supabase
        .from('venues')
        .select('*', { count: 'exact' })
        .eq('event_id', activeEventId)
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
  }, [activeEventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!activeEventId) return;

    const channel = supabase
      .channel(`event-${activeEventId}`)
      .on('postgres_changes', {
          event: '*',
          table: 'teams',
          filter: `event_id=eq.${activeEventId}`
      }, (payload) => {
          if (payload.eventType === 'INSERT') {
              setTeams(prev => [...prev, mapDbTeam(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
              setTeams(prev => prev.map(t => t.teamId === payload.new.team_id ? mapDbTeam(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
              setTeams(prev => prev.filter(t => t.teamId !== payload.old.team_id));
          }
      })
      .on('postgres_changes', {
          event: '*',
          table: 'venues',
          filter: `event_id=eq.${activeEventId}`
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEventId, fetchData]);

  const refreshCurrentClue = useCallback(async (levelIndex: number) => {
    if (!activeEventId) return;
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('event_id', activeEventId)
      .eq('order_id', levelIndex + 1)
      .maybeSingle();

    if (data) setCurrentClue(mapDbVenue(data));
  }, [activeEventId]);

  const loginJudge = useCallback((accessCode: string) => {
    return judgeCodeMatch(accessCode);
  }, []);

  const getTeam = useCallback(
    (teamId: string) => teams.find((t) => t.teamId.toUpperCase() === teamId.trim().toUpperCase()),
    [teams]
  );

  const loginByLeaderPhone = useCallback(
    (phone: string) => teams.find((t) => phonesMatch(phone, t.leaderPhone)) ?? null,
    [teams]
  );

  const loginByPhoneDirect = useCallback(async (phone: string) => {
    if (!activeEventId) return null;
    const localTeam = teams.find((t) => phonesMatch(phone, t.leaderPhone));
    if (localTeam) return localTeam;

    const { data, error } = await supabase.from('teams').select('*').eq('event_id', activeEventId);
    if (!error && data) {
       const freshTeams = data.map(mapDbTeam);
       setTeams(freshTeams);
       return freshTeams.find(t => phonesMatch(phone, t.leaderPhone)) || null;
    }
    return null;
  }, [activeEventId, teams]);

  const ensureStarted = useCallback(async (teamId: string) => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team || team.startedAt) return;
    await supabase.from('teams').update({ started_at: Date.now() }).eq('team_id', teamId).eq('event_id', activeEventId);
  }, [teams, activeEventId]);

  const checkClueCode = useCallback(
    async (teamId: string, code: string): Promise<CodeCheckResult> => {
      if (currentClue) {
        const isMatch = codesMatch(code, currentClue.correctCode);
        if (isMatch) return { ok: true };
      }
      return { ok: false, message: "Invalid code. Check your clue and try again." };
    },
    [currentClue]
  );

  const confirmAndAdvance = useCallback(
    (teamId: string): VerifyResult => {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team || !activeEventId) return { ok: false, message: "Team not found." };

      const nextLevel = team.currentLevelIndex + 1;
      const finished = nextLevel >= totalVenuesCount;
      const now = Date.now();

      supabase.from('teams').update({
        current_level_index: nextLevel,
        last_completion_at: now,
        started_at: team.startedAt ?? now,
        finished_at: finished ? now : null,
      }).eq('team_id', teamId).eq('event_id', activeEventId).then(({error}) => {
        if (error) console.error("Advancement error:", error);
      });

      return { ok: true, finished, nextLevel };
    },
    [teams, totalVenuesCount, activeEventId]
  );

  // Admin Ops
  const updateTeamDetails = useCallback(async (teamId: string, teamName: string, leaderName: string, leaderPhone: string, members: string[]) => {
    if (!activeEventId) return;
    setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, teamName, leaderName, leaderPhone, members } : t));
    await supabase.from('teams').update({
      team_name: teamName,
      leader_name: leaderName,
      leader_phone: leaderPhone,
      members: members
    }).eq('team_id', teamId).eq('event_id', activeEventId);
  }, [activeEventId]);

  const addTeam = useCallback(async (team: Team) => {
    if (!activeEventId) return;
    const teamWithEvent = { ...team, eventId: activeEventId };
    setTeams(prev => [...prev, teamWithEvent]);
    const { error } = await supabase.from('teams').insert([mapTeamToDb(teamWithEvent)]);
    if (error) {
        console.error("Add team error:", error);
        fetchData();
    }
  }, [activeEventId, fetchData]);

  const deleteTeam = useCallback(async (teamId: string) => {
    if (!activeEventId) return;
    setTeams(prev => prev.filter(t => t.teamId !== teamId));
    await supabase.from('teams').delete().eq('team_id', teamId).eq('event_id', activeEventId);
  }, [activeEventId]);

  const setTeamLevel = useCallback(async (teamId: string, level: number) => {
    if (!activeEventId) return;
    setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, currentLevelIndex: level } : t));
    await supabase.from('teams').update({ current_level_index: level, finished_at: level >= totalVenuesCount ? Date.now() : null }).eq('team_id', teamId).eq('event_id', activeEventId);
  }, [activeEventId, totalVenuesCount]);

  const addVenue = useCallback(async (venue: Venue) => {
    if (!activeEventId) return;
    const venueWithEvent = { ...venue, eventId: activeEventId };
    await supabase.from('venues').insert([mapVenueToDb(venueWithEvent)]);
    fetchData();
  }, [activeEventId, fetchData]);

  const updateVenue = useCallback(async (venueId: string, updates: Partial<Venue>) => {
    if (!activeEventId) return;
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.hintText) dbUpdates.hint_text = updates.hintText;
    await supabase.from('venues').update(dbUpdates).eq('id', venueId).eq('event_id', activeEventId);
  }, [activeEventId]);

  const deleteVenue = useCallback(async (venueId: string) => {
    if (!activeEventId) return;
    await supabase.from('venues').delete().eq('id', venueId).eq('event_id', activeEventId);
    fetchData();
  }, [activeEventId, fetchData]);

  const resetTeam = useCallback(async (teamId: string) => {
    if (!activeEventId) return;
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null }).eq('team_id', teamId).eq('event_id', activeEventId);
  }, [activeEventId]);

  const resetAllProgress = useCallback(async () => {
    if (!activeEventId) return;
    await supabase.from('teams').update({ current_level_index: 0, last_completion_at: null, started_at: null, finished_at: null }).eq('event_id', activeEventId);
  }, [activeEventId]);

  const seedDefaultHunt = useCallback(async () => {
    if (!activeEventId) return;
    setLoading(true);
    try {
      await supabase.from('venues').delete().eq('event_id', activeEventId);
      const defaults: Venue[] = [
        {
          id: `v1-${activeEventId}`, eventId: activeEventId, orderId: 1, name: '4th Floor', locationLabel: 'F Block',
          hintText: 'Climb high where the air is thin and the view is wide; find the spot where F-block touches the sky.',
          venueImageUrl: 'https://images.pexels.com/photos/13003822/pexels-photo-13003822.jpeg',
          correctCode: 'FLR01', coordinatorName: 'Charan', taskNote: 'Find the code near the lift notice board.'
        },
        {
          id: `v2-${activeEventId}`, eventId: activeEventId, orderId: 2, name: 'Library', locationLabel: 'Reading Wing',
          hintText: 'Turn pages softly, then follow the glow; where stories are silent, your next mark will show.',
          venueImageUrl: 'https://images.pexels.com/photos/5759484/pexels-photo-5759484.jpeg',
          correctCode: 'LIB02', coordinatorName: 'Vinamra', taskNote: 'Behind the entrance pillar.'
        },
        {
          id: `v3-${activeEventId}`, eventId: activeEventId, orderId: 3, name: 'Yagya Shala', locationLabel: 'Sacred Area',
          hintText: 'From sacred smoke, let the spirit rise; seek the place where tradition meets the freshers eyes.',
          venueImageUrl: 'https://images.pexels.com/photos/37826466/pexels-photo-37826466.jpeg',
          correctCode: 'YGY03', coordinatorName: 'Ahmad', taskNote: 'Near the offering entrance.'
        },
        {
          id: `v4-${activeEventId}`, eventId: activeEventId, orderId: 4, name: 'Admin', locationLabel: 'Main Counter',
          hintText: 'Forms may wait, but your quest will not stand; find the place where the campus rules the land.',
          venueImageUrl: 'https://images.pexels.com/photos/31139015/pexels-photo-31139015.jpeg',
          correctCode: 'ADM04', coordinatorName: 'Anjali', taskNote: 'Under the reception desk ledge.'
        },
        {
          id: `v5-${activeEventId}`, eventId: activeEventId, orderId: 5, name: 'Sport Complex', locationLabel: 'Main Field',
          hintText: 'Where jerseys and whistles meet, the competition is fire; find the coach who watches the goal line higher.',
          venueImageUrl: 'https://images.pexels.com/photos/36393288/pexels-photo-36393288.jpeg',
          correctCode: 'SPT05', coordinatorName: 'Shivam', taskNote: 'Near sports equipment room.'
        },
        {
          id: `v6-${activeEventId}`, eventId: activeEventId, orderId: 6, name: 'Main Gate', locationLabel: 'Entrance Portal',
          hintText: 'The gateway to knowledge stands wide and tall; where everyone enters, find the start for all.',
          venueImageUrl: 'https://images.pexels.com/photos/29704449/pexels-photo-29704449.jpeg',
          correctCode: 'GAT06', coordinatorName: 'Shubhi', taskNote: 'With the security guard.'
        },
        {
          id: `v7-${activeEventId}`, eventId: activeEventId, orderId: 7, name: 'Seminar Hall', locationLabel: 'Final Destination',
          hintText: 'Your last target is where lecture echoes call; once inside the hall, the treasure reveals to all.',
          venueImageUrl: 'https://images.pexels.com/photos/29704449/pexels-photo-29704449.jpeg',
          correctCode: 'HAL07', coordinatorName: 'Shubhranshu', taskNote: 'Enter the hall code to finish.'
        }
      ];
      await supabase.from('venues').insert(defaults.map(mapVenueToDb));
      await fetchData();
    } catch (error) {
      console.error("Seed error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeEventId, fetchData]);

  const value = useMemo(
    () => ({
      teams, venues, currentClue, loading, totalVenuesCount, activeEventId, setEvent,
      getTeam, loginByLeaderPhone, loginByPhoneDirect,
      loginJudge, ensureStarted, checkClueCode, confirmAndAdvance, refreshCurrentClue,
      updateTeamDetails, addTeam, deleteTeam, setTeamLevel, addVenue, updateVenue,
      deleteVenue, resetTeam, resetAllProgress, seedDefaultHunt
    }),
    [
      teams, venues, currentClue, loading, totalVenuesCount, activeEventId, setEvent,
      getTeam, loginByLeaderPhone, loginByPhoneDirect,
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
