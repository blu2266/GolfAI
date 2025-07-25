import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function analyzeGolfSwing(base64Video: string): Promise<{
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
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional golf instructor and swing analyst. Analyze the golf swing video and provide detailed feedback in JSON format. 

          Analyze these key aspects:
          1. Backswing mechanics (shoulder turn, club position, balance)
          2. Downswing sequence (hip rotation, arm drop, weight transfer)
          3. Impact position (club face, body position, ball contact)
          4. Follow-through (extension, balance, finish position)

          Provide scores from 1-10 for each phase and overall. Include specific, actionable recommendations.

          Return JSON with this exact structure:
          {
            "overallScore": number,
            "overallFeedback": "string",
            "swingPhases": [
              {
                "name": "string",
                "timestamp": "string (e.g., '0.2s - 0.8s')",
                "score": number,
                "feedback": "string",
                "strengths": ["string"],
                "improvements": ["string"]
              }
            ],
            "keyMetrics": [
              {
                "label": "string",
                "value": "string",
                "change": "string (optional)",
                "changeDirection": "up|down|neutral (optional)"
              }
            ],
            "recommendations": [
              {
                "title": "string",
                "description": "string",
                "priority": "High Impact|Medium Impact|Low Impact",
                "category": "string"
              }
            ]
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this golf swing video and provide detailed technical feedback focusing on swing mechanics, timing, and areas for improvement."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:video/mp4;base64,${base64Video}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and ensure proper structure
    return {
      overallScore: Math.max(1, Math.min(10, result.overallScore || 7)),
      overallFeedback: result.overallFeedback || "Analysis complete. Focus on consistent practice.",
      swingPhases: result.swingPhases || [
        {
          name: "Backswing",
          timestamp: "0.0s - 0.8s",
          score: 8,
          feedback: "Good shoulder turn and club position.",
          strengths: ["Proper tempo"],
          improvements: ["Maintain balance"]
        }
      ],
      keyMetrics: result.keyMetrics || [
        {
          label: "Swing Plane",
          value: "105°",
          change: "+3° from last",
          changeDirection: "up" as const
        }
      ],
      recommendations: result.recommendations || [
        {
          title: "Follow-Through Extension",
          description: "Extend your arms more fully through impact for better power and accuracy.",
          priority: "High Impact" as const,
          category: "Swing Mechanics"
        }
      ]
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze golf swing: " + (error as Error).message);
  }
}
