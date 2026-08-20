import SHA256 from "crypto-js/sha256";

/**
 * Field Hunt — Database Schema
 */

export interface Venue {
  id: string;
  orderId: number;
  name: string;
  locationLabel: string;
  hintText: string;
  venueImageUrl: string;
  correctCode: string;
  coordinatorName: string;
  taskNote: string;
}

export interface Team {
  teamId: string;
  teamName: string;
  leaderName: string;
  leaderPhone: string;
  members: string[];
  currentLevelIndex: number;
  lastCompletionAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export const JUDGE_ACCESS_CODE = "0786";

export type ParticipantPhase = "hint" | "confirm";

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function phonesMatch(input: string, expected: string): boolean {
  const a = normalizePhone(input);
  const b = normalizePhone(expected);
  return a.length === 10 && a === b;
}

export function judgeCodeMatch(input: string): boolean {
  const hashedInput = SHA256(input.trim().toUpperCase()).toString();
  const expectedHash = "27ed5b43a1c87bdf97934b51528c17cf26f3e34ba4328041da951caad6dcd884";
  return hashedInput === expectedHash;
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function codesMatch(input: string, expected: string): boolean {
  const normalizedInput = input.trim().toUpperCase().replace(/[-\s]/g, "");
  const hashedInput = SHA256(normalizedInput).toString();

  // High Security: Match the hash
  if (hashedInput === expected) return true;

  // Fallback: If DB contains plain text (useful for emergency debugging)
  if (normalizedInput === expected.trim().toUpperCase()) return true;

  return false;
}

export function padStop(n: number): string {
  return String(n).padStart(2, "0");
}

/** Map Supabase fields to Team object */
export function mapDbTeam(row: any): Team {
  return {
    teamId: row.team_id,
    teamName: row.team_name,
    leaderName: row.leader_name,
    leaderPhone: row.leader_phone,
    members: row.members || [],
    currentLevelIndex: row.current_level_index || 0,
    lastCompletionAt: row.last_completion_at ? Number(row.last_completion_at) : null,
    startedAt: row.started_at ? Number(row.started_at) : null,
    finishedAt: row.finished_at ? Number(row.finished_at) : null,
  };
}

/** Map Team object to Supabase fields */
export function mapTeamToDb(team: Team) {
  return {
    team_id: team.teamId,
    team_name: team.teamName,
    leader_name: team.leaderName,
    leader_phone: team.leaderPhone,
    members: team.members,
    current_level_index: team.currentLevelIndex,
    last_completion_at: team.lastCompletionAt,
    started_at: team.startedAt,
    finished_at: team.finishedAt,
  };
}

/** Map Supabase fields to Venue object */
export function mapDbVenue(row: any): Venue {
  return {
    id: row.id,
    orderId: row.order_id,
    name: row.name,
    locationLabel: row.location_label,
    hintText: row.hint_text,
    venueImageUrl: row.venue_image_url,
    correctCode: row.correct_code,
    coordinatorName: row.coordinator_name,
    taskNote: row.task_note,
  };
}

/** Map Venue object to Supabase fields */
export function mapVenueToDb(venue: Venue) {
  return {
    id: venue.id,
    order_id: venue.orderId,
    name: venue.name,
    location_label: venue.locationLabel,
    hint_text: venue.hintText,
    venue_image_url: venue.venueImageUrl,
    correct_code: venue.correctCode,
    coordinator_name: venue.coordinatorName,
    task_note: venue.taskNote,
  };
}
