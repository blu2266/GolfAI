import { useEffect, useState, useRef } from "react";

interface VideoFrameExtractorProps {
  videoSrc: string;
  timestamp: string;
  onFrameExtracted?: (imageUrl: string) => void;
  className?: string;
}

export function VideoFrameExtractor({ 
  videoSrc, 
  timestamp, 
  onFrameExtracted,
  className = "" 
}: VideoFrameExtractorProps) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoSrc || !timestamp) return;

    const extractFrame = async () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Parse timestamp (e.g., "00:01.3" or "0.2s - 0.8s")
        let seekTime = 0;
        const timestampMatch = timestamp.match(/(\d+):(\d+\.?\d*)|(\d+\.?\d*)s/);
        
        if (timestampMatch) {
          if (timestampMatch[1] && timestampMatch[2]) {
            // Format: "00:01.3"
            seekTime = parseInt(timestampMatch[1]) * 60 + parseFloat(timestampMatch[2]);
          } else if (timestampMatch[3]) {
            // Format: "0.2s"
            seekTime = parseFloat(timestampMatch[3]);
          }
        }

        // If it's a range like "0.2s - 0.8s", take the midpoint
        const rangeMatch = timestamp.match(/(\d+\.?\d*)s\s*-\s*(\d+\.?\d*)s/);
        if (rangeMatch) {
          const start = parseFloat(rangeMatch[1]);
          const end = parseFloat(rangeMatch[2]);
          seekTime = (start + end) / 2;
        }

        video.currentTime = seekTime;
        
        await new Promise<void>((resolve) => {
          video.addEventListener('seeked', () => resolve(), { once: true });
        });

        // Draw the current frame to canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to image URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFrameUrl(dataUrl);
          setIsLoading(false);
          
          if (onFrameExtracted) {
            onFrameExtracted(dataUrl);
          }
        }
      } catch (error) {
        console.error('Error extracting frame:', error);
        setIsLoading(false);
      }
    };

    extractFrame();
  }, [videoSrc, timestamp, onFrameExtracted]);

  // For sample videos or invalid sources, show a placeholder
  if (!videoSrc || videoSrc === "" || isLoading) {
    return (
      <div className={`bg-gradient-to-br from-golf-green/20 to-golf-green/10 ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
            <div className="w-1 h-4 bg-golf-green rounded-full transform rotate-12"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        preload="metadata"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="hidden" />
      {frameUrl && (
        <img 
          src={frameUrl} 
          alt={`Swing at ${timestamp}`}
          className={`object-cover ${className}`}
        />
      )}
    </>
  );
}