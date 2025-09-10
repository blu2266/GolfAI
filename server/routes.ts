import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSwingAnalysisSchema, insertClubSchema, insertUserPreferencesSchema } from "@shared/schema";
import { analyzeSwingWithProvider } from "./aiProvider";
import { extractFramesFromVideo, getFrameUrl, createFullSwingGif } from "./videoFrameExtractor";

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

  // Get saved analyses for the current user (protected) - MUST BE BEFORE :id route
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

  // Get specific swing analysis (protected) - MUST BE AFTER /saved route
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

      // Analyze with selected AI provider (Gemini or OpenAI)
      const analysisResult = await analyzeSwingWithProvider(videoPath);

      // Create analysis record first
      const analysisData = {
        userId,
        videoPath: videoPath,
        title,
        frameExtractions: [],
        ...analysisResult,
        ballMetrics: analysisResult.ballMetrics || {}
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
        
        // Create full swing GIF
        await createFullSwingGif(videoPath, analysis.id);
        
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

  // Serve uploaded videos with optimal quality settings
  app.get("/api/videos/:filename", (req, res) => {
    const filename = req.params.filename;
    const videoPath = path.join("uploads", filename);
    
    if (fs.existsSync(videoPath)) {
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        // Support video seeking/streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=3600',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=3600',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
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
      const userId = req.user.claims.sub;
      
      // Get the existing analysis
      const existingAnalysis = await storage.getSwingAnalysis(req.params.id);
      if (!existingAnalysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Check if the user owns this analysis
      if (existingAnalysis.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      let updateData: any = { isSaved, notes, clubId };
      
      // If saving the analysis and not already saved to object storage, upload media files
      if (isSaved && !existingAnalysis.objectStorageVideoPath) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        
        try {
          // Upload video to object storage
          const privateDir = objectStorageService.getPrivateObjectDir();
          const videoFileName = path.basename(existingAnalysis.videoPath);
          const videoDestPath = `${privateDir}/analyses/${req.params.id}/video/${videoFileName}`;
          
          console.log(`Uploading video to object storage: ${videoDestPath}`);
          const videoStoragePath = await objectStorageService.uploadFileToStorage(
            existingAnalysis.videoPath,
            videoDestPath
          );
          
          updateData.objectStorageVideoPath = `/objects/analyses/${req.params.id}/video/${videoFileName}`;
          
          // Upload GIFs if they exist
          if (existingAnalysis.frameExtractions && existingAnalysis.frameExtractions.length > 0) {
            const framePaths: Record<string, string> = {};
            
            for (const extraction of existingAnalysis.frameExtractions) {
              const frameFileName = path.basename(extraction.framePath);
              const frameDestPath = `${privateDir}/analyses/${req.params.id}/frames/${frameFileName}`;
              
              // Check if the local file exists before trying to upload
              const localFramePath = path.join('uploads', 'frames', req.params.id, frameFileName);
              if (fs.existsSync(localFramePath)) {
                console.log(`Uploading frame to object storage: ${frameDestPath}`);
                await objectStorageService.uploadFileToStorage(
                  localFramePath,
                  frameDestPath
                );
                framePaths[extraction.timestamp] = `/objects/analyses/${req.params.id}/frames/${frameFileName}`;
              }
            }
            
            // Also upload the full swing GIF if it exists
            const fullSwingGifPath = path.join('uploads', 'frames', req.params.id, 'full_swing.gif');
            if (fs.existsSync(fullSwingGifPath)) {
              const fullSwingDestPath = `${privateDir}/analyses/${req.params.id}/frames/full_swing.gif`;
              console.log(`Uploading full swing GIF to object storage: ${fullSwingDestPath}`);
              await objectStorageService.uploadFileToStorage(
                fullSwingGifPath,
                fullSwingDestPath
              );
              framePaths['full_swing'] = `/objects/analyses/${req.params.id}/frames/full_swing.gif`;
            }
            
            if (Object.keys(framePaths).length > 0) {
              updateData.objectStorageFramePaths = framePaths;
            }
          }
          
          console.log("Media files uploaded to object storage successfully");
        } catch (uploadError) {
          console.error("Error uploading to object storage:", uploadError);
          // Continue with save even if upload fails
        }
      }
      
      const analysis = await storage.updateSwingAnalysis(req.params.id, updateData);
      res.json(analysis);
    } catch (error) {
      console.error("Error updating analysis:", error);
      res.status(500).json({ message: "Failed to update analysis" });
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

  // AI settings routes (admin only)
  app.get('/api/admin/ai-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const settings = await storage.getAISettings();
      res.json(settings || { provider: 'gemini' });
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ message: "Failed to fetch AI settings" });
    }
  });

  app.put('/api/admin/ai-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { provider } = req.body;
      if (!provider || !['gemini', 'openai'].includes(provider)) {
        return res.status(400).json({ message: "Invalid AI provider" });
      }
      
      const settings = await storage.updateAISettings({ 
        provider,
        updatedBy: user.id 
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating AI settings:", error);
      res.status(500).json({ message: "Failed to update AI settings" });
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

  // Serve objects from object storage for saved analyses
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    const userId = req.user?.claims?.sub;
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // For swing analysis media, check if the user owns the analysis
      const analysisMatch = req.path.match(/\/objects\/analyses\/([^\/]+)\//);
      if (analysisMatch) {
        const analysisId = analysisMatch[1];
        const analysis = await storage.getSwingAnalysis(analysisId);
        
        if (!analysis || analysis.userId !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      // Download the object to the response
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Object not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
