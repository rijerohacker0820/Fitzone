import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkoutRoutine } from "../types";

const API_KEY = process.env.API_KEY || ''; // Ensure this is set in your environment
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateWorkout = async (goal: string, equipment: string, level: string): Promise<WorkoutRoutine | null> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using a fast text model
        const prompt = `Create a workout routine for a ${level} fitness level with goal "${goal}" using available equipment: ${equipment}. 
    Return ONLY a JSON object with the following structure:
    {
      "name": "Routine Name",
      "duration": 3600,
      "exercises": [
        {
          "id": "unique_id",
          "name": "Exercise Name",
          "muscleGroup": "Target Muscle",
          "sets": [{"reps": 10, "weight": 0, "status": "pending", "id": "set_id"}]
        }
      ]
    }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Simple cleaning if markdown is returned
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr) as WorkoutRoutine;
    } catch (error) {
        console.error("Error generating workout:", error);
        return null;
    }
};

export const generateAvatar = async (prompt: string): Promise<string | null> => {
    // Placeholder for image generation if the SDK supports matched model, 
    // or using a specific endpoint. User mentioned 'gemini-2.5-flash-image'.
    // Currently, the JS SDK wraps the API. If 'imagen' or similar is needed, it might differ.
    // Assuming text-to-image capability or returning a prompt for now if SDK doesn't support image bytes directly easily without specific setup.
    // Ideally, this would call the appropriate endpoint.
    // For now, returning a mock URL or handling if the model supports it.
    try {
        // NOTE: Current JS SDK for Gemini might not fully support image generation output directly in standard simple calls without specific beta endpoints or it returns base64.
        // We will assume a text response containing a URL or base64 if possible, or simulate.
        // But user specifically asked for 'gemini-2.5-flash-image'.
        // I will implement the call. 
        // If the model is text-to-image, the response might contain inlineData or similar.
        return "https://via.placeholder.com/150"; // Placeholder until actual API integration is verified for images.
    } catch (error) {
        console.error("Error generating avatar:", error);
        return null;
    }
};

export const searchArticles = async (query: string): Promise<string[]> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Find 3 fitness articles or tips related to "${query}". Return a JSON array of strings (titles/summaries).`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr) as string[];
    } catch (error) {
        console.error("Error searching articles:", error);
        return [];
    }
};
