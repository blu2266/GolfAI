import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSwingAnalysisSchema, insertClubSchema, insertUserPreferencesSchema } from "@shared/schema";
import { analyzeGolfSwing } from "./gemini";
import { extractFramesFromVideo, getFrameUrl } from "./videoFrameExtractor";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(mp4|mov|avi)$/i;
    const allowedMimeTypes = /^video\//;
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only video files (MP4, MOV, AVI) are allowed"));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get recent swing analyses (protected)
  app.get("/api/swing-analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getUserSwingAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching swing analyses:", error);
      res.status(500).json({ message: "Failed to fetch swing analyses" });
    }
  });

  // Get specific swing analysis (protected)
  app.get("/api/swing-analyses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysis = await storage.getSwingAnalysis(req.params.id);
      if (!analysis || analysis.userId !== userId) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching swing analysis:", error);
      res.status(500).json({ message: "Failed to fetch swing analysis" });
    }
  });

  // Upload and analyze video (protected)
  app.post("/api/analyze-swing", isAuthenticated, upload.single("video"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const { title } = req.body;
      const userId = req.user.claims.sub; // Get authenticated user ID
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      // Get video file path for Gemini analysis
      const videoPath = req.file.path;

      // Analyze with Gemini
      const analysisResult = await analyzeGolfSwing(videoPath);

      // Create analysis record first
      const analysisData = {
        userId,
        videoPath: videoPath,
        title,
        frameExtractions: [],
        ...analysisResult
      };

      const validatedData = insertSwingAnalysisSchema.parse(analysisData);
      const analysis = await storage.createSwingAnalysis(validatedData);

      // Now extract frames with the correct analysis ID
      try {
        const frameExtractions = await extractFramesFromVideo(
          videoPath,
          analysis.id,
          analysisResult.swingPhases
        );
        
        // Update analysis with frame extractions
        await storage.updateSwingAnalysis(analysis.id, { frameExtractions });
        
        // Return updated analysis with frame extractions
        analysis.frameExtractions = frameExtractions;
      } catch (error) {
        console.error("Failed to extract frames:", error);
        // Continue without frames if extraction fails
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing swing:", error);
      
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlink(req.file.path, (unlinkError) => {
          if (unlinkError) console.error("Error deleting file:", unlinkError);
        });
      }

      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to analyze swing" });
      }
    }
  });

  // Serve uploaded videos
  app.get("/api/videos/:filename", (req, res) => {
    const filename = req.params.filename;
    const videoPath = path.join("uploads", filename);
    
    if (fs.existsSync(videoPath)) {
      res.sendFile(path.resolve(videoPath));
    } else {
      res.status(404).json({ message: "Video not found" });
    }
  });

  // Sample analysis endpoint for demo
  app.post("/api/sample-analysis", async (req, res) => {
    try {
      const sampleAnalysis = {
        userId: "temp-user",
        videoPath: "sample.mp4",
        title: "Driver Practice - Range",
        overallScore: 8.2,
        overallFeedback: "Great swing mechanics! Focus on follow-through for more power.",
        swingPhases: [
          {
            name: "Backswing",
            timestamp: "0.2s - 0.8s",
            score: 9.1,
            feedback: "Excellent shoulder turn and club position. Maintain this tempo.",
            strengths: ["Good tempo", "Proper shoulder turn"],
            improvements: ["Minor grip adjustment"]
          },
          {
            name: "Downswing",
            timestamp: "0.8s - 1.1s",
            score: 8.5,
            feedback: "Good hip rotation sequence. Could improve weight transfer.",
            strengths: ["Hip sequence", "Club path"],
            improvements: ["Weight transfer timing"]
          },
          {
            name: "Impact",
            timestamp: "1.1s - 1.2s",
            score: 7.8,
            feedback: "Solid contact position. Work on maintaining spine angle.",
            strengths: ["Ball contact", "Club face angle"],
            improvements: ["Spine angle stability"]
          },
          {
            name: "Follow-through",
            timestamp: "1.2s - 2.0s",
            score: 7.5,
            feedback: "Good balance but could extend arms more through impact.",
            strengths: ["Balance", "Finish position"],
            improvements: ["Arm extension", "Power transfer"]
          }
        ],
        keyMetrics: [
          {
            label: "Swing Plane",
            value: "105°",
            change: "+3° from last",
            changeDirection: "up" as const
          },
          {
            label: "Swing Speed",
            value: "102 mph",
            change: "+4 mph",
            changeDirection: "up" as const
          },
          {
            label: "Attack Angle",
            value: "-2.1°",
            change: "Optimal",
            changeDirection: "neutral" as const
          },
          {
            label: "Face Angle",
            value: "1.2° open",
            change: "-0.5°",
            changeDirection: "down" as const
          }
        ],
        recommendations: [
          {
            title: "Follow-Through Extension",
            description: "Extend your arms more fully through impact to generate additional power and accuracy.",
            priority: "High Impact" as const,
            category: "Swing Mechanics"
          },
          {
            title: "Weight Transfer Timing",
            description: "Focus on shifting weight to your front foot earlier in the downswing for better power generation.",
            priority: "Medium Impact" as const,
            category: "Body Movement"
          },
          {
            title: "Grip Pressure",
            description: "Maintain lighter grip pressure throughout the swing to improve club head speed.",
            priority: "Low Impact" as const,
            category: "Setup & Grip"
          }
        ]
      };

      const validatedData = insertSwingAnalysisSchema.parse(sampleAnalysis);
      const analysis = await storage.createSwingAnalysis(validatedData);

      res.json(analysis);
    } catch (error) {
      console.error("Error creating sample analysis:", error);
      res.status(500).json({ message: "Failed to create sample analysis" });
    }
  });

  // Save/unsave an analysis (protected)
  app.patch("/api/swing-analyses/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const { isSaved, notes, clubId } = req.body;
      const analysis = await storage.updateSwingAnalysis(req.params.id, {
        isSaved,
        notes,
        clubId
      });
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error updating analysis:", error);
      res.status(500).json({ message: "Failed to update analysis" });
    }
  });

  // Get saved analyses for the current user (protected)
  app.get("/api/swing-analyses/saved", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getSavedSwingAnalysesByUser(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching saved analyses:", error);
      res.status(500).json({ message: "Failed to fetch saved analyses" });
    }
  });

  // Club management (protected)
  app.get("/api/clubs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clubs = await storage.getClubsByUser(userId);
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  app.post("/api/clubs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clubData = { ...req.body, userId };
      const club = await storage.createClub(clubData);
      res.json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(500).json({ message: "Failed to create club" });
    }
  });

  app.patch("/api/clubs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const club = await storage.updateClub(req.params.id, req.body);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(500).json({ message: "Failed to update club" });
    }
  });

  app.delete("/api/clubs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteClub(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting club:", error);
      res.status(500).json({ message: "Failed to delete club" });
    }
  });

  // User preferences (protected)
  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || {});
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.updateUserPreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Admin routes (require admin role)
  app.get('/api/admin/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const prompts = await storage.getAllPromptConfigurations();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.post('/api/admin/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { name, prompt } = req.body;
      const newPrompt = await storage.createPromptConfiguration({
        name,
        prompt,
        isActive: false,
        updatedBy: user.id,
      });
      res.json(newPrompt);
    } catch (error) {
      console.error("Error creating prompt:", error);
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  app.patch('/api/admin/prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { prompt } = req.body;
      const updated = await storage.updatePromptConfiguration(req.params.id, {
        prompt,
        updatedBy: user.id,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.post('/api/admin/prompts/:id/activate', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.setActivePromptConfiguration(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating prompt:", error);
      res.status(500).json({ message: "Failed to activate prompt" });
    }
  });

  // Serve frame images
  app.get('/api/frames/:analysisId/:frameName', (req, res) => {
    const { analysisId, frameName } = req.params;
    const framePath = path.join('uploads', 'frames', analysisId, frameName);
    
    if (fs.existsSync(framePath)) {
      res.sendFile(path.resolve(framePath));
    } else {
      res.status(404).json({ message: 'Frame not found' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
