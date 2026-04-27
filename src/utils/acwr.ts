import { WorkoutRoutine } from "../types";

// Formula: Volume = sets * reps * weight
export const calculateVolume = (routine: WorkoutRoutine): number => {
  let volume = 0;
  routine.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      // If completed or mostly completed (we count partials? Spec says "Partial" status exists but simpler here)
      if (
        (set.status === "completed" || set.status === "partial") &&
        set.weight > 0
      ) {
        volume += set.reps * set.weight;
      }
    });
  });
  return volume;
};

export const calculateACWR = (
  logs: WorkoutRoutine[],
): {
  acute: number;
  chronic: number;
  ratio: number;
  status: "Optimal" | "Fatigue Risk" | "Recovery";
} => {
  // Sort logs by date desc
  const sorted = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (sorted.length === 0)
    return { acute: 0, chronic: 0, ratio: 0, status: "Recovery" };

  const today = new Date();
  const dayMillis = 24 * 60 * 60 * 1000;

  // Acute: Last 7 days
  let acuteLoad = 0;
  // Chronic: Last 28 days
  let chronicLoad = 0; // Total volume over 28 days / 4 weeks (avg weekly load usually?)
  // ACWR definition varies. often Acute = avg daily load last 7 days. Chronic = avg daily load last 28 days.
  // Or Acute = Total load 7 days. Chronic = (Total load 28 days) / 4.
  // User said: "Acute Load" (7-day volume) vs "Chronic Load" (28-day average).
  // "28-day average" usually means average of the rolling 7-day sums? Or just (Sum 28 days) / 4?
  // I will use (Sum 7 days) and (Sum 28 days)/4 for ratio.

  // Filter for last 7 days
  const sevenDaysAgo = today.getTime() - 7 * dayMillis;
  const twentyEightDaysAgo = today.getTime() - 28 * dayMillis;

  let sum7 = 0;
  let sum28 = 0;

  sorted.forEach((log) => {
    const logTime = new Date(log.date).getTime();
    const vol = calculateVolume(log);
    if (logTime >= sevenDaysAgo) {
      sum7 += vol;
    }
    if (logTime >= twentyEightDaysAgo) {
      sum28 += vol;
    }
  });

  acuteLoad = sum7;
  chronicLoad = sum28 / 4;

  const ratio = chronicLoad === 0 ? 0 : acuteLoad / chronicLoad;

  let status: "Optimal" | "Fatigue Risk" | "Recovery" = "Optimal";
  if (ratio > 1.5) status = "Fatigue Risk";
  else if (ratio < 0.8) status = "Recovery";

  return { acute: acuteLoad, chronic: chronicLoad, ratio, status };
};
