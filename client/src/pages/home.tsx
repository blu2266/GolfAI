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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-golf-green rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-bold text-deep-navy">SwingAI</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <div className="space-y-1">
              <div className="w-4 h-0.5 bg-slate-600"></div>
              <div className="w-4 h-0.5 bg-slate-600"></div>
              <div className="w-4 h-0.5 bg-slate-600"></div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        {!showResults ? (
          <section className="p-4 space-y-6">
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-deep-navy mb-2">Analyze Your Golf Swing</h2>
              <p className="text-slate-600 text-sm">Upload a video and get AI-powered insights to improve your game</p>
            </div>

            <VideoUpload
              onAnalysisComplete={handleAnalysisComplete}
            />

            {/* Recent Analyses */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 px-1">Recent Analyses</h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 bg-slate-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
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
                      className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center space-x-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-16 h-12 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                        <div className="w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-2 border-l-white border-y-1 border-y-transparent ml-0.5"></div>
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-sm text-deep-navy">{analysis.title}</h4>
                        <p className="text-xs text-slate-600 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(analysis.createdAt)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center text-xs text-golf-green">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            <span>{analysis.overallScore}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 transform rotate-[-45deg]"></div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm">No analyses yet</p>
                  <p className="text-xs">Upload your first swing to get started</p>
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
