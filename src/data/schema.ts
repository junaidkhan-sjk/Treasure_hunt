import SHA256 from "crypto-js/sha256";

/**
 * Field Hunt — in-memory data schema
 */
// ... (rest of interfaces)

export interface Venue {
  id: string;
  orderId: number;
  /** Internal / judge-only label */
  name: string;
  locationLabel: string;
  /** Riddle shown to participants (no place name spoiler as a title) */
  hintText: string;
  venueImageUrl: string;
  correctCode: string;
  /** Volunteer name teams must enter to unlock the photo check */
  coordinatorName: string;
  /** Short instruction without naming the venue */
  taskNote: string;
}

export interface Team {
  teamId: string;
  teamName: string;
  /** First member is treated as leader; phone gates team login */
  leaderName: string;
  leaderPhone: string;
  members: string[];
  currentLevelIndex: number;
  lastCompletionAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
}

/** Secret code for judge / developer monitor access (not shown in participant UI) */
export const JUDGE_ACCESS_CODE = "9301900147";

export type ParticipantPhase = "hint" | "confirm";

/** Keep digits only; compare last 10 for +91 / local formats */
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
  // SHA256 of "9301900147"
  const expectedHash = "5ea01e438e99a9f9e2a3069df84bcb50d165351d2ded73f06af3ef73027a4c30";
  return hashedInput === expectedHash;
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function codesMatch(input: string, expected: string): boolean {
  const normalizedInput = normalizeKey(input).replace(/[-\s]/g, "");
  const hashedInput = SHA256(normalizedInput).toString();

  // The 'expected' in our CSV will now be a HASH instead of plain text
  return hashedInput === expected;
}

export function namesMatch(input: string, expected: string): boolean {
  return normalizeKey(input) === normalizeKey(expected);
}

export function padStop(n: number): string {
  return String(n).padStart(2, "0");
}

/** Transform CSV row to Team object */
export function transformTeam(row: any): Team {
  return {
    teamId: row.teamId,
    teamName: row.teamName,
    leaderName: row.leaderName,
    leaderPhone: row.leaderPhone,
    members: row.members ? row.members.split(",").map((m: string) => m.trim()) : [],
    currentLevelIndex: 0,
    lastCompletionAt: null,
    startedAt: null,
    finishedAt: null,
  };
}

/** Transform CSV row to Venue object */
export function transformVenue(row: any): Venue {
  return {
    id: row.id,
    orderId: parseInt(row.orderId, 10),
    name: row.name,
    locationLabel: row.locationLabel,
    hintText: row.hintText,
    venueImageUrl: row.venueImageUrl,
    correctCode: row.correctCode,
    coordinatorName: row.coordinatorName,
    taskNote: row.taskNote,
  };
}
