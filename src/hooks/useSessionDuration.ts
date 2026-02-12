import { useRef, useCallback } from "react";

/**
 * Hook to track how long a study session takes (generation → completion).
 * Call `startTimer()` before the API call, then `reportDuration(sessionId)`
 * after receiving the session ID from the server.
 */
export function useSessionDuration() {
  const startTimeRef = useRef<number | null>(null);

  /** Call right before the API request */
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  /** Call after the session is created — sends duration to the server */
  const reportDuration = useCallback(async (sessionId: string | null | undefined) => {
    if (!sessionId || startTimeRef.current === null) return;

    const elapsedMs = Date.now() - startTimeRef.current;
    const durationMinutes = Math.max(1, Math.round(elapsedMs / 60_000));
    startTimeRef.current = null;

    try {
      await fetch("/api/session-duration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          duration_minutes: durationMinutes,
        }),
      });
    } catch (err) {
      console.error("Failed to report session duration:", err);
    }
  }, []);

  return { startTimer, reportDuration };
}
