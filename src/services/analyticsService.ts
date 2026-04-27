import apiClient from "../api/apiClient";
import {
  ExerciseProgress,
  MuscleDistribution,
  HistoricalComparison,
  PersonalRecord,
} from "../types";

// ─── Personal Records ─────────────────────────────────

export const getPersonalRecords = async (): Promise<
  {
    exerciseName: string;
    muscleGroup: string;
    personalRecord: PersonalRecord;
  }[]
> => {
  const response = await apiClient.get("/analytics/personal-records");
  return response.data;
};

// ─── Exercise Progress ────────────────────────────────

export const getExerciseProgress = async (
  exerciseName: string,
): Promise<ExerciseProgress> => {
  const response = await apiClient.get(
    `/analytics/exercise-progress?name=${encodeURIComponent(exerciseName)}`,
  );
  return response.data;
};

// ─── Muscle Distribution ──────────────────────────────

export const getMuscleDistribution = async (
  days: number = 30,
): Promise<MuscleDistribution[]> => {
  const response = await apiClient.get(
    `/analytics/muscle-distribution?days=${days}`,
  );
  return response.data;
};

// ─── Historical Comparison ────────────────────────────

export const getHistoricalComparison = async (
  periodDays: number = 30,
): Promise<HistoricalComparison> => {
  const response = await apiClient.get(
    `/analytics/comparison?periodDays=${periodDays}`,
  );
  return response.data;
};
