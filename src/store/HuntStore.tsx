import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Papa from "papaparse";
import {
  codesMatch,
  judgeCodeMatch,
  phonesMatch,
  transformTeam,
  transformVenue,
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
  loading: boolean;
  getTeam: (teamId: string) => Team | undefined;
  loginByLeaderPhone: (phone: string) => Team | null;
  loginJudge: (accessCode: string) => boolean;
  ensureStarted: (teamId: string) => void;
  checkClueCode: (teamId: string, code: string) => CodeCheckResult;
  confirmAndAdvance: (teamId: string) => VerifyResult;
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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsRes, venuesRes] = await Promise.all([
          fetch("/data/teams.csv"),
          fetch("/data/venues.csv"),
        ]);

        const teamsText = await teamsRes.text();
        const venuesText = await venuesRes.text();

        const teamsParsed = Papa.parse(teamsText, { header: true, skipEmptyLines: true });
        const venuesParsed = Papa.parse(venuesText, { header: true, skipEmptyLines: true });

        const rawTeams = teamsParsed.data.map(transformTeam);
        const rawVenues = venuesParsed.data.map(transformVenue);

        // Merge with localStorage progress and overrides if exists
        const savedProgress = localStorage.getItem("fh_teams_progress");
        const savedVenues = localStorage.getItem("fh_venues_overrides");

        if (savedVenues) {
          setVenues(JSON.parse(savedVenues));
        } else {
          setVenues(rawVenues);
        }

        if (savedProgress) {
          const progressMap = JSON.parse(savedProgress);
          const mergedTeams = rawTeams.map(t => ({
            ...t,
            ...(progressMap[t.teamId] || {})
          }));
          // Add any teams that were added manually (not in CSV)
          Object.keys(progressMap).forEach(id => {
            if (!rawTeams.find(rt => rt.teamId === id)) {
              mergedTeams.push({
                teamId: id,
                ...progressMap[id]
              });
            }
          });
          setTeams(mergedTeams);
        } else {
          setTeams(rawTeams);
        }
      } catch (error) {
        console.error("Failed to load CSV data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sync to localStorage whenever teams change
  useEffect(() => {
    if (teams.length > 0) {
      const progressMap = teams.reduce((acc, t) => {
        acc[t.teamId] = {
          teamName: t.teamName,
          leaderName: t.leaderName,
          leaderPhone: t.leaderPhone,
          members: t.members,
          currentLevelIndex: t.currentLevelIndex,
          lastCompletionAt: t.lastCompletionAt,
          startedAt: t.startedAt,
          finishedAt: t.finishedAt
        };
        return acc;
      }, {} as any);
      localStorage.setItem("fh_teams_progress", JSON.stringify(progressMap));
    }
  }, [teams]);

  // Sync venues to localStorage
  useEffect(() => {
    if (venues.length > 0) {
      localStorage.setItem("fh_venues_overrides", JSON.stringify(venues));
    }
  }, [venues]);

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

  const loginJudge = useCallback((accessCode: string) => {
    return judgeCodeMatch(accessCode);
  }, []);

  const ensureStarted = useCallback((teamId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.teamId.toUpperCase() !== teamId.trim().toUpperCase()) return t;
        if (t.startedAt != null) return t;
        if (t.finishedAt != null) return t;
        return { ...t, startedAt: Date.now() };
      })
    );
  }, []);

  const checkClueCode = useCallback(
    (teamId: string, code: string): CodeCheckResult => {
      const team = teams.find(
        (t) => t.teamId.toUpperCase() === teamId.trim().toUpperCase()
      );
      if (!team) {
        return { ok: false, message: "Team not found." };
      }
      if (team.finishedAt != null || team.currentLevelIndex >= venues.length) {
        return { ok: false, message: "This expedition is already complete." };
      }

      const venue = venues[team.currentLevelIndex];
      if (!venue) {
        return { ok: false, message: "No active clue for this team." };
      }

      if (!codesMatch(code, venue.correctCode)) {
        return {
          ok: false,
          message:
            "Wrong code. Check the backside of the clue paper and try again.",
        };
      }

      return { ok: true };
    },
    [teams, venues]
  );

  const confirmAndAdvance = useCallback(
    (teamId: string): VerifyResult => {
      const team = teams.find(
        (t) => t.teamId.toUpperCase() === teamId.trim().toUpperCase()
      );
      if (!team) {
        return { ok: false, message: "Team not found." };
      }
      if (team.finishedAt != null || team.currentLevelIndex >= venues.length) {
        return { ok: false, message: "This expedition is already complete." };
      }

      const nextLevel = team.currentLevelIndex + 1;
      const finished = nextLevel >= venues.length;
      const now = Date.now();

      setTeams((prev) =>
        prev.map((t) => {
          if (t.teamId !== team.teamId) return t;
          return {
            ...t,
            currentLevelIndex: nextLevel,
            lastCompletionAt: now,
            startedAt: t.startedAt ?? now,
            finishedAt: finished ? now : null,
          };
        })
      );

      return { ok: true, finished, nextLevel };
    },
    [teams, venues]
  );

  const updateTeamDetails = useCallback((teamId: string, teamName: string, leaderName: string, leaderPhone: string, members: string[]) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.teamId === teamId
          ? { ...t, teamName, leaderName, leaderPhone, members }
          : t
      )
    );
  }, []);

  const addTeam = useCallback((team: Team) => {
    setTeams(prev => [...prev, team]);
  }, []);

  const deleteTeam = useCallback((teamId: string) => {
    setTeams(prev => prev.filter(t => t.teamId !== teamId));
  }, []);

  const setTeamLevel = useCallback((teamId: string, level: number) => {
    setTeams(prev => prev.map(t =>
      t.teamId === teamId ? { ...t, currentLevelIndex: level, finishedAt: level >= venues.length ? Date.now() : null } : t
    ));
  }, [venues.length]);

  const addVenue = useCallback((venue: Venue) => {
    setVenues(prev => [...prev, venue]);
  }, []);

  const updateVenue = useCallback((venueId: string, updates: Partial<Venue>) => {
    setVenues(prev => prev.map(v => v.id === venueId ? { ...v, ...updates } : v));
  }, []);

  const deleteVenue = useCallback((venueId: string) => {
    setVenues(prev => prev.filter(v => v.id !== venueId));
  }, []);

  const resetTeam = useCallback((teamId: string) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.teamId.toUpperCase() === teamId.trim().toUpperCase()
          ? {
              ...t,
              currentLevelIndex: 0,
              lastCompletionAt: null,
              startedAt: null,
              finishedAt: null,
            }
          : t
      )
    );
  }, []);

  const resetAllProgress = useCallback(() => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        currentLevelIndex: 0,
        lastCompletionAt: null,
        startedAt: null,
        finishedAt: null,
      }))
    );
  }, []);

  const value = useMemo(
    () => ({
      teams,
      venues,
      loading,
      getTeam,
      loginByLeaderPhone,
      loginJudge,
      ensureStarted,
      checkClueCode,
      confirmAndAdvance,
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
      teams,
      venues,
      loading,
      getTeam,
      loginByLeaderPhone,
      loginJudge,
      ensureStarted,
      checkClueCode,
      confirmAndAdvance,
      updateTeamDetails,
      addTeam,
      deleteTeam,
      setTeamLevel,
      addVenue,
      updateVenue,
      deleteVenue,
      resetTeam,
      resetAllProgress,
    ]
  );

  return <HuntContext.Provider value={value}>{children}</HuntContext.Provider>;
}


export function useHunt() {
  const ctx = useContext(HuntContext);
  if (!ctx) throw new Error("useHunt must be used within HuntProvider");
  return ctx;
}
