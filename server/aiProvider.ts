import { analyzeGolfSwing as analyzeWithGemini } from "./gemini";
import { analyzeGolfSwingWithOpenAI } from "./openai";
import { storage } from "./storage";

export type AIProvider = "gemini" | "openai";

export interface SwingAnalysisResult {
  overallScore: number;
  overallFeedback: string;
  swingPhases: Array<{
    name: string;
    timestamp: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  keyMetrics: Array<{
    label: string;
    value: string;
    change?: string;
    changeDirection?: 'up' | 'down' | 'neutral';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'High Impact' | 'Medium Impact' | 'Low Impact';
    category: string;
  }>;
  ballMetrics?: {
    ballSpeed?: string;
    estimatedDistance?: string;
    launchAngle?: string;
    hangTime?: string;
    curve?: string;
  };
}

export async function analyzeSwingWithProvider(videoPath: string): Promise<SwingAnalysisResult> {
  // Get the current AI provider setting
  const aiSettings = await storage.getAISettings();
  const provider = aiSettings?.provider || "gemini";
  
  // Get the active prompt configuration
  const activePrompt = await storage.getActivePromptConfiguration();
  const prompt = activePrompt?.prompt || getDefaultPrompt();
  
  console.log(`Using AI provider: ${provider}`);
  
  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      return await analyzeGolfSwingWithOpenAI(videoPath, prompt);
      
    case "gemini":
    default:
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key not configured");
      }
      return await analyzeWithGemini(videoPath);
  }
}

function getDefaultPrompt(): string {
  return `You are a professional golf instructor with 20+ years of experience. Analyze this golf swing video in detail.

Focus on these key phases:
1. **Address/Setup** (0.0s - 0.5s): Stance width, ball position, posture, alignment
2. **Backswing** (0.5s - 1.5s): Shoulder turn, hip rotation, club position at top, weight shift
3. **Downswing** (1.5s - 2.0s): Transition, hip lead, lag, club path
4. **Impact** (2.0s - 2.2s): Club face angle, body position, weight transfer
5. **Follow-through** (2.2s - 3.0s): Extension, balance, finish position

Also analyze ball flight and provide estimated metrics:
- Ball speed (mph)
- Estimated carry distance (yards)
- Launch angle (degrees)
- Hang time (seconds)
- Shot shape/curve (draw, fade, straight, etc.)

Provide scores from 1-10 for each phase and overall.

Return your analysis in this exact JSON format:
{
  "overallScore": number (1-10),
  "overallFeedback": "string (2-3 sentences summarizing the swing)",
  "swingPhases": [
    {
      "name": "string (phase name)",
      "timestamp": "string (e.g., '0.5s - 1.5s')",
      "score": number (1-10),
      "feedback": "string (detailed analysis of this phase)",
      "strengths": ["string (what was done well)"],
      "improvements": ["string (specific areas to work on)"]
    }
  ],
  "keyMetrics": [
    {
      "label": "string (metric name)",
      "value": "string (measurement)",
      "change": "string (optional comparison)",
      "changeDirection": "up|down|neutral (optional)"
    }
  ],
  "recommendations": [
    {
      "title": "string (recommendation title)",
      "description": "string (detailed explanation)",
      "priority": "High Impact|Medium Impact|Low Impact",
      "category": "string (e.g., 'Technique', 'Timing', 'Balance')"
    }
  ],
  "ballMetrics": {
    "ballSpeed": "string (e.g., '145 mph')",
    "estimatedDistance": "string (e.g., '265 yards')",
    "launchAngle": "string (e.g., '12.5°')",
    "hangTime": "string (e.g., '5.8 seconds')",
    "curve": "string (e.g., 'Slight fade')"
  }
}`;
}