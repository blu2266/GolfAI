import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface VideoPlayerProps {
  videoSrc?: string;
  className?: string;
  analysisId?: string;
}

export function VideoPlayer({ videoSrc, className = "", analysisId }: VideoPlayerProps) {
  const [showFullVideo, setShowFullVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Show GIF preview if analysisId is provided and not showing full video yet
  if (analysisId && !showFullVideo) {
    return (
      <div 
        className={`relative bg-black rounded-2xl overflow-hidden cursor-pointer group ${className}`}
        onClick={() => setShowFullVideo(true)}
      >
        <img 
          src={`/api/frames/${analysisId}/full_swing.gif`}
          alt="Golf swing preview"
          className="w-full h-auto"
          onError={(e) => {
            // Fallback to showing video if GIF not available
            setShowFullVideo(true);
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="bg-white/90 hover:bg-white rounded-full p-4 shadow-lg">
            <Play className="w-8 h-8 text-deep-navy ml-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-t-2xl overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450"
        preload="metadata"
      >
        {videoSrc && <source src={videoSrc} type="video/mp4" />}
      </video>

      {/* Video Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
        <Button
          onClick={togglePlayback}
          size="icon"
          className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full border-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 mx-4">
          <div
            className="h-1 bg-white/30 rounded-full relative cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-1 bg-golf-green rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="w-3 h-3 bg-white rounded-full absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <span className="text-xs font-mono min-w-[40px] text-right">
          {formatTime(currentTime)}
        </span>
      </div>

      {/* Analysis Annotations */}
      <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-2 text-white text-xs">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-golf-green rounded-full mr-2"></div>
          Impact Zone
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={togglePlayback}
            size="icon"
            className="w-16 h-16 bg-black/50 hover:bg-black/70 rounded-full border-0"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
