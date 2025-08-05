import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Video, Play, Check, Loader2 } from "lucide-react";

interface VideoUploadProps {
  onAnalysisComplete: (analysisId: string) => void;
}

export function VideoUpload({ onAnalysisComplete }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processingSteps = [
    "Video uploaded successfully",
    "Motion tracking complete", 
    "Analyzing swing mechanics",
    "Generating recommendations"
  ];

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/analyze-swing", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      setProcessingStep(0);
      setUploadProgress(0);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/swing-analyses"] });
      onAnalysisComplete(data.id);
      toast({
        title: "Analysis Complete!",
        description: "Your golf swing has been analyzed successfully.",
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      setProcessingStep(0);
      setUploadProgress(0);
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const sampleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sample-analysis");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/swing-analyses"] });
      onAnalysisComplete(data.id);
      toast({
        title: "Sample Analysis Ready!",
        description: "Demo analysis has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - check both extension and MIME type
      const allowedExtensions = /\.(mp4|mov|avi)$/i;
      const isVideoMimeType = file.type.startsWith('video/');
      const hasValidExtension = allowedExtensions.test(file.name);
      
      if (!isVideoMimeType && !hasValidExtension) {
        toast({
          title: "Invalid File Type",
          description: "Please select an MP4, MOV, or AVI video file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a video file smaller than 100MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingStep(0);

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", `${selectedFile.name.split('.')[0]} - Analysis`);
    formData.append("userId", "temp-user");

    // Simulate processing steps
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < processingSteps.length - 1) {
          setUploadProgress((prev + 1) * 25);
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 1500);

    uploadMutation.mutate(formData);
  };

  const handleCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handleSampleAnalysis = () => {
    sampleMutation.mutate();
  };

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 glass rounded-2xl">
          {/* Futuristic Processing Animation */}
          <div className="relative h-32 mb-6 flex items-center justify-center">
            <div className="absolute w-32 h-32">
              <div className="absolute inset-0 border-4 border-neon-green/30 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-neon-green border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-electric-blue/30 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 border-4 border-electric-blue border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-4 border-4 border-cyber-purple/30 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 border-4 border-cyber-purple border-b-transparent rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
            </div>
            <div className="relative z-10 w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,255,127,0.6)]">
              <div className="text-2xl font-bold text-deep-space animate-pulse-neon">AI</div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold neon-green mb-2">NEURAL PROCESSING</h2>
          <p className="text-foreground/70 text-sm mb-6">
            {[
              "Initializing motion vectors...",
              "Quantum speed analysis...",
              "Biomechanical mapping...",
              "Optimizing trajectory data..."
            ][processingStep] || "Neural network analyzing swing data..."}
          </p>
          
          <Progress value={uploadProgress} className="w-full mb-4" />
          <p className="text-xs text-foreground/50">
            {processingSteps[processingStep] || "Processing..."}
          </p>
        </div>

        <div className="space-y-3">
          {processingSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                index < processingStep
                  ? "glass border-neon-green/50"
                  : index === processingStep
                  ? "glass border-cyber-purple holographic"
                  : "glass opacity-50"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                index < processingStep
                  ? "gradient-primary"
                  : index === processingStep
                  ? "border-2 border-cyber-purple border-t-transparent animate-spin"
                  : "bg-glass-white"
              }`}>
                {index < processingStep ? (
                  <Check className="w-4 h-4 text-deep-space" />
                ) : index === processingStep ? null : null}
              </div>
              <span className={`text-sm font-medium ${
                index <= processingStep ? "text-foreground" : "text-foreground/50"
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor="video-upload"
          onClick={() => fileInputRef.current?.click()}
          className="block w-full glass rounded-2xl p-8 text-center cursor-pointer hover:scale-[1.02] transition-all duration-200 gradient-border"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,127,0.4)] animate-pulse-neon">
              <CloudUpload className="text-deep-space text-2xl w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">UPLOAD SWING DATA</h3>
              <p className="text-sm text-foreground/70">Access device storage or camera module</p>
            </div>
            <div className="text-xs text-foreground/50">
              Supported: MP4, MOV, AVI • Max capacity: 100MB
            </div>
          </div>
        </label>
      </div>

      {selectedFile && (
        <Card className="glass p-4 gradient-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground">{selectedFile.name}</h4>
              <p className="text-xs text-foreground/60">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full gradient-primary text-deep-space font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,127,0.4)]"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                PROCESSING...
              </>
            ) : (
              "INITIATE ANALYSIS"
            )}
          </Button>
        </Card>
      )}

      {/* Camera Capture Button */}
      <Button
        onClick={handleCamera}
        className="w-full gradient-accent text-white py-4 h-auto font-bold shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform"
      >
        <Video className="w-5 h-5 mr-3" />
        CAPTURE NEW SEQUENCE
      </Button>

      {/* Sample Analysis Button */}
      <Button
        onClick={handleSampleAnalysis}
        disabled={sampleMutation.isPending}
        variant="outline"
        className="w-full glass border-2 border-cyber-purple text-cyber-purple py-4 h-auto font-bold hover:scale-105 transition-transform hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
      >
        {sampleMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            LOADING...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-3" />
            DEMO ANALYSIS MODE
          </>
        )}
      </Button>
    </div>
  );
}
