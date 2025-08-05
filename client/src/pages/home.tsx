import { useState } from "react";
import { VideoUpload } from "@/components/video-upload";
import { AnalysisResults } from "@/components/analysis-results";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useQuery } from "@tanstack/react-query";
import type { SwingAnalysis } from "@shared/schema";
import { Clock, Star } from "lucide-react";

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  const { data: recentAnalyses, isLoading } = useQuery<SwingAnalysis[]>({
    queryKey: ["/api/swing-analyses"],
  });

  const handleAnalysisComplete = (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
    setShowResults(true);
  };

  const handleBackToUpload = () => {
    setShowResults(false);
    setCurrentAnalysisId(null);
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,127,0.3)]">
              <div className="w-4 h-4 bg-deep-space rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold neon-green">SwingAI</h1>
          </div>
          <button className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
            <div className="space-y-1">
              <div className="w-4 h-0.5 bg-neon-green"></div>
              <div className="w-4 h-0.5 bg-electric-blue"></div>
              <div className="w-4 h-0.5 bg-cyber-purple"></div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20 relative">
        {!showResults ? (
          <section className="p-4 space-y-6">
            <div className="text-center py-6 glass rounded-2xl">
              <h2 className="text-3xl font-bold mb-3">
                <span className="gradient-primary bg-clip-text text-transparent">SWING ANALYSIS</span>
              </h2>
              <p className="text-foreground/70 text-sm">Neural network ready for biomechanical processing</p>
            </div>

            <VideoUpload
              onAnalysisComplete={handleAnalysisComplete}
            />

            {/* Recent Analyses */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold neon-blue px-1">RECENT ANALYSES</h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 bg-glass-white rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-glass-white rounded w-3/4"></div>
                          <div className="h-3 bg-glass-white rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentAnalyses && recentAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {recentAnalyses.map((analysis) => (
                    <button
                      key={analysis.id}
                      onClick={() => {
                        setCurrentAnalysisId(analysis.id);
                        setShowResults(true);
                      }}
                      className="w-full glass glass-hover rounded-xl p-4 flex items-center space-x-4 transition-all gradient-border"
                    >
                      <div className="w-16 h-12 gradient-primary rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(0,255,127,0.3)]">
                        <div className="w-6 h-6 bg-deep-space rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-2 border-l-neon-green border-y-[3px] border-y-transparent ml-0.5"></div>
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-sm text-foreground">{analysis.title}</h4>
                        <p className="text-xs text-foreground/60 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(analysis.createdAt)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center text-xs neon-green">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            <span>{analysis.overallScore}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-2 h-2 border-r-2 border-b-2 border-neon-green transform rotate-[-45deg]"></div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 glass rounded-2xl">
                  <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-foreground/80">No analyses in database</p>
                  <p className="text-xs text-foreground/60">Initialize your first swing analysis</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          currentAnalysisId && (
            <AnalysisResults 
              analysisId={currentAnalysisId} 
              onBack={handleBackToUpload}
            />
          )
        )}
      </main>

      <BottomNavigation currentTab="home" />
    </div>
  );
}
