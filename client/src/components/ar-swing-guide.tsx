import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, RotateCcw, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ARSwingGuideProps {
  onClose: () => void;
}

interface GuidelinePoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

interface SwingAnalysis {
  posture: 'good' | 'warning' | 'error';
  alignment: 'good' | 'warning' | 'error';
  clubPosition: 'good' | 'warning' | 'error';
  confidence: number;
}

export function ARSwingGuide({ onClose }: ARSwingGuideProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  
  const [isActive, setIsActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [guidelines, setGuidelines] = useState<GuidelinePoint[]>([]);
  const [analysis, setAnalysis] = useState<SwingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  console.log('ARSwingGuide component rendered');

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraReady(true);
        }
      } catch (error) {
        console.error('Camera access failed:', error);
        toast({
          title: "Camera Access Failed",
          description: "Please allow camera access to use AR guidance",
          variant: "destructive"
        });
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [toast]);

  // Initialize swing guidelines
  useEffect(() => {
    if (isCameraReady && isActive) {
      const initialGuidelines: GuidelinePoint[] = [
        { x: 0.5, y: 0.2, label: "Head Position", color: "#10B981" },
        { x: 0.5, y: 0.4, label: "Shoulder Line", color: "#F59E0B" },
        { x: 0.5, y: 0.6, label: "Hip Line", color: "#EF4444" },
        { x: 0.3, y: 0.8, label: "Ball Position", color: "#8B5CF6" },
        { x: 0.7, y: 0.5, label: "Target Line", color: "#06B6D4" }
      ];
      setGuidelines(initialGuidelines);
      startAnalysis();
    }
  }, [isCameraReady, isActive]);

  const startAnalysis = () => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const analyze = () => {
      if (!isActive) return;

      // Simulate real-time analysis
      const mockAnalysis: SwingAnalysis = {
        posture: Math.random() > 0.7 ? 'good' : Math.random() > 0.3 ? 'warning' : 'error',
        alignment: Math.random() > 0.6 ? 'good' : Math.random() > 0.3 ? 'warning' : 'error',
        clubPosition: Math.random() > 0.8 ? 'good' : Math.random() > 0.4 ? 'warning' : 'error',
        confidence: Math.random() * 0.4 + 0.6 // 60-100%
      };

      setAnalysis(mockAnalysis);
      setIsAnalyzing(true);

      // Draw overlay
      drawOverlay();

      // Continue analysis
      animationRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guidelines
    guidelines.forEach(point => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      // Draw guideline point
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = point.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(point.label, x + 15, y + 5);
    });

    // Draw alignment grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Horizontal reference lines
    [0.2, 0.4, 0.6, 0.8].forEach(ratio => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * ratio);
      ctx.lineTo(canvas.width, canvas.height * ratio);
      ctx.stroke();
    });

    // Draw target line
    if (analysis) {
      ctx.strokeStyle = analysis.alignment === 'good' ? '#10B981' : '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.1, canvas.height * 0.8);
      ctx.lineTo(canvas.width * 0.9, canvas.height * 0.8);
      ctx.stroke();
    }
  };

  const toggleAR = () => {
    if (isActive) {
      setIsActive(false);
      setIsAnalyzing(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsActive(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* AR Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ 
            opacity: isActive ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />

        {/* Top UI */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              AR Swing Guide
            </Badge>
            {analysis && (
              <Badge 
                variant="outline" 
                className={`bg-black/50 border-white/20 text-white`}
              >
                Confidence: {Math.round(analysis.confidence * 100)}%
              </Badge>
            )}
          </div>
          
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-black/50 border-white/20 text-white hover:bg-black/70"
          >
            ✕
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {/* Real-time Analysis */}
          {analysis && isActive && (
            <Card className="mb-4 bg-black/80 border-white/20">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className={`${getStatusColor(analysis.posture)}`}>
                    <div className="flex items-center justify-center mb-1">
                      {getStatusIcon(analysis.posture)}
                    </div>
                    <div className="text-xs font-medium text-white">Posture</div>
                  </div>
                  <div className={`${getStatusColor(analysis.alignment)}`}>
                    <div className="flex items-center justify-center mb-1">
                      {getStatusIcon(analysis.alignment)}
                    </div>
                    <div className="text-xs font-medium text-white">Alignment</div>
                  </div>
                  <div className={`${getStatusColor(analysis.clubPosition)}`}>
                    <div className="flex items-center justify-center mb-1">
                      {getStatusIcon(analysis.clubPosition)}
                    </div>
                    <div className="text-xs font-medium text-white">Club Position</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4 relative z-20">
            <Button
              onClick={toggleAR}
              disabled={!isCameraReady}
              className={`${
                isActive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white border-0`}
            >
              {isActive ? (
                <>
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop AR
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start AR
                </>
              )}
            </Button>
            
            <Button
              onClick={() => {
                // Reset guidelines to default positions
                const resetGuidelines: GuidelinePoint[] = [
                  { x: 0.5, y: 0.2, label: "Head Position", color: "#10B981" },
                  { x: 0.5, y: 0.4, label: "Shoulder Line", color: "#F59E0B" },
                  { x: 0.5, y: 0.6, label: "Hip Line", color: "#EF4444" },
                  { x: 0.3, y: 0.8, label: "Ball Position", color: "#8B5CF6" },
                  { x: 0.7, y: 0.5, label: "Target Line", color: "#06B6D4" }
                ];
                setGuidelines(resetGuidelines);
              }}
              variant="outline"
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Instructions */}
        {!isActive && isCameraReady && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <Card className="bg-black/80 border-white/20 max-w-sm mx-4 pointer-events-auto">
              <CardContent className="p-6 text-center text-white">
                <Target className="w-12 h-12 mx-auto mb-4 text-golf-green" />
                <h3 className="text-lg font-semibold mb-2">AR Swing Guidance</h3>
                <p className="text-sm text-white/80 mb-4">
                  Position yourself in the camera view and tap "Start AR" to see real-time 
                  alignment guides and posture feedback.
                </p>
                <div className="text-xs text-white/60">
                  • Stand in address position
                  • Align with the guidelines
                  • Practice your setup and posture
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}