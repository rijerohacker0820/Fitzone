import apiClient from "../api/apiClient";
import { WorkoutRoutine } from "../types";
import * as Crypto from "expo-crypto";

/**
 * AI Workout Generation Service
 * Calls the backend endpoint to generate workouts.
 */
export const generateWorkoutWithAI = async (
  goal: string,
  equipment: string,
  level: string,
): Promise<WorkoutRoutine | null> => {
  try {
    const response = await apiClient.post("/ai/workout", {
      goal,
      equipment,
      experience: level,
    });
    
    const parsed = response.data;
    
    // Transform to app format
    const routine: WorkoutRoutine = {
      id: Crypto.randomUUID(),
      name: parsed.name || "AI Generated Routine",
      description: parsed.description || goal,
      exercises: (parsed.exercises || []).map((ex: any) => ({
        id: Crypto.randomUUID(),
        name: ex.name,
        muscleGroup: ex.muscleGroup || "General",
        sets: Array.from({ length: ex.setsCount || 3 }).map(() => ({
          id: Crypto.randomUUID(),
          reps: ex.repsCount || 10,
          weight: 0,
          status: "pending" as const,
        })),
      })),
      date: new Date().toISOString(),
      duration: 3600,
      status: "planned",
      tags: ["AI Generated", level, equipment],
    };

    return routine;
  } catch (error) {
    console.error("[AI Service] Error generating workout:", error);
    throw error;
  }
};

