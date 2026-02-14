/**
 * Streak calculation utilities based on study_sessions.created_at
 */

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Calculate learning streaks from an array of session timestamps.
 *
 * A "streak day" means the user had at least one study session on that
 * calendar date (UTC). Consecutive calendar days form a streak.
 *
 * @param sessions - Array of objects with a `created_at` ISO timestamp
 * @returns Current streak and longest streak in days
 */
export function calculateStreak(
  sessions: { created_at: string }[]
): StreakResult {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Deduplicate to unique calendar dates (UTC) and sort ascending
  const uniqueDates = Array.from(
    new Set(
      sessions.map((s) => {
        const d = new Date(s.created_at);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      })
    )
  ).sort();

  // Convert to epoch days for easy consecutive-day comparison
  const toEpochDay = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  };

  const epochDays = uniqueDates.map(toEpochDay);

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < epochDays.length; i++) {
    if (epochDays[i] - epochDays[i - 1] === 1) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    longestStreak = Math.max(longestStreak, currentRun);
  }

  // Current streak: count backwards from today
  const todayEpoch = toEpochDay(
    new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  );

  const lastSessionEpoch = epochDays[epochDays.length - 1];

  // If the last session isn't today or yesterday, current streak is 0
  if (todayEpoch - lastSessionEpoch > 1) {
    return { currentStreak: 0, longestStreak };
  }

  let currentStreak = 1;
  for (let i = epochDays.length - 2; i >= 0; i--) {
    if (epochDays[i + 1] - epochDays[i] === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}
