import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Video, Play, Check, Loader2 } from "lucide-react";

interface VideoUploadProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (analysisId: string) => void;
}

export function VideoUpload({ onAnalysisStart, onAnalysisComplete }: VideoUploadProps) {
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
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
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
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
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
    onAnalysisStart();

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", `${selectedFile.name.split('.')[0]} - Analysis`);

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
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-golf-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-12 h-12 border-4 border-golf-green border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-deep-navy mb-2">Analyzing Your Swing</h2>
          <p className="text-slate-600 text-sm mb-6">Our AI is examining your technique...</p>
          
          <Progress value={uploadProgress} className="w-full mb-4" />
          <p className="text-xs text-slate-500">
            {processingSteps[processingStep] || "Processing..."}
          </p>
        </div>

        <div className="space-y-3">
          {processingSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                index < processingStep
                  ? "bg-white border-slate-200"
                  : index === processingStep
                  ? "bg-golden/10 border-golden/30"
                  : "bg-white border-slate-200 opacity-50"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                index < processingStep
                  ? "bg-golf-green"
                  : index === processingStep
                  ? "border-2 border-golden border-t-transparent animate-spin"
                  : "bg-slate-300"
              }`}>
                {index < processingStep ? (
                  <Check className="w-4 h-4 text-white" />
                ) : index === processingStep ? null : null}
              </div>
              <span className={`text-sm ${
                index <= processingStep ? "text-slate-700" : "text-slate-500"
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
          className="block w-full border-2 border-dashed border-golf-green/30 rounded-2xl bg-golf-green/5 p-8 text-center cursor-pointer hover:border-golf-green/50 hover:bg-golf-green/10 transition-all duration-200"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-golf-green/20 rounded-full flex items-center justify-center mx-auto">
              <CloudUpload className="text-golf-green text-2xl w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-deep-navy mb-1">Upload Your Swing Video</h3>
              <p className="text-sm text-slate-600">Tap to select from gallery or camera</p>
            </div>
            <div className="text-xs text-slate-500">
              Supports MP4, MOV, AVI • Max 100MB
            </div>
          </div>
        </label>
      </div>

      {selectedFile && (
        <Card className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-deep-navy">{selectedFile.name}</h4>
              <p className="text-xs text-slate-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full bg-golf-green hover:bg-golf-green/90 text-white"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Swing"
            )}
          </Button>
        </Card>
      )}

      {/* Camera Capture Button */}
      <Button
        onClick={handleCamera}
        className="w-full bg-deep-navy text-white py-4 h-auto font-semibold shadow-lg hover:bg-deep-navy/90"
      >
        <Video className="w-5 h-5 mr-3" />
        Record New Swing
      </Button>

      {/* Sample Analysis Button */}
      <Button
        onClick={handleSampleAnalysis}
        disabled={sampleMutation.isPending}
        variant="outline"
        className="w-full border-2 border-golf-green text-golf-green py-4 h-auto font-semibold hover:bg-golf-green hover:text-white"
      >
        {sampleMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-3" />
            Try Sample Analysis
          </>
        )}
      </Button>
    </div>
  );
}
