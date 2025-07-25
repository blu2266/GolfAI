import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/video-player";
import { VideoFrameExtractor } from "@/components/video-frame-extractor";
import { ArrowLeft, Star, TrendingUp, Lightbulb, ArrowRight, Target } from "lucide-react";
import type { SwingAnalysis } from "@shared/schema";

interface AnalysisResultsProps {
  analysisId: string;
  onBack: () => void;
}

export function AnalysisResults({ analysisId, onBack }: AnalysisResultsProps) {
  const { data: analysis, isLoading, error } = useQuery<SwingAnalysis>({
    queryKey: ["/api/swing-analyses", analysisId],
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="bg-slate-200 rounded-2xl h-48 mb-4"></div>
          <div className="bg-slate-200 rounded-2xl h-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 rounded-xl h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="font-semibold mb-2">Analysis Not Found</h3>
            <p className="text-sm text-slate-600 mb-4">
              Unable to load the swing analysis.
            </p>
            <Button onClick={onBack} variant="outline">
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-golf-green";
    if (score >= 6) return "text-golden";
    return "text-red-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High Impact":
        return "bg-red-100 text-red-700";
      case "Medium Impact":
        return "bg-golden/10 text-golden";
      case "Low Impact":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div className="p-4 pb-0">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-4 p-0 h-auto font-normal text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>
      </div>

      {/* Video Player */}
      <VideoPlayer 
        videoSrc={analysis.videoPath.startsWith("sample") ? undefined : `/api/videos/${analysis.videoPath.split('/').pop()}`}
        className="mx-4"
      />

      {/* Overall Score */}
      <div className="mx-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-deep-navy mb-2">Swing Analysis Complete</h2>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                </div>
                <div className="text-slate-500">
                  <div className="text-lg">/10</div>
                  <div className="text-xs">Overall</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">{analysis.overallFeedback}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swing Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-deep-navy px-4">Swing Breakdown</h3>
        
        {analysis.swingPhases.map((phase, index) => (
          <div key={index} className="mx-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Video Frame Thumbnail */}
                  <div className="flex-shrink-0">
                    <VideoFrameExtractor
                      videoSrc={analysis.videoPath.startsWith("sample") ? "" : `/api/videos/${analysis.videoPath.split('/').pop()}`}
                      timestamp={phase.timestamp}
                      className="w-24 h-16 rounded-lg object-cover shadow-sm"
                    />
                  </div>
                  
                  {/* Phase Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-golf-green/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-golf-green rounded-full"></div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-deep-navy">{phase.name}</h4>
                          <p className="text-xs text-slate-600">{phase.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(phase.score)}`}>
                          {phase.score}
                        </div>
                        <div className="text-xs text-slate-500">Score</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{phase.feedback}</p>
                    <div className="flex flex-wrap gap-2">
                      {phase.strengths.map((strength, i) => (
                        <Badge key={i} variant="secondary" className="bg-golf-green/10 text-golf-green text-xs">
                          {strength}
                        </Badge>
                      ))}
                      {phase.improvements.map((improvement, i) => (
                        <Badge key={i} variant="secondary" className="bg-golden/10 text-golden text-xs">
                          {improvement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-deep-navy">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          {analysis.keyMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-deep-navy">{metric.value}</div>
                <div className="text-xs text-slate-600 mt-1">{metric.label}</div>
                {metric.change && (
                  <div className="flex items-center justify-center mt-2">
                    <TrendingUp className={`w-3 h-3 mr-1 ${
                      metric.changeDirection === 'up' ? 'text-golf-green' : 
                      metric.changeDirection === 'down' ? 'text-red-500' : 
                      'text-slate-400'
                    }`} />
                    <span className={`text-xs ${
                      metric.changeDirection === 'up' ? 'text-golf-green' : 
                      metric.changeDirection === 'down' ? 'text-red-500' : 
                      'text-slate-400'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-deep-navy">Improvement Tips</h3>
        {analysis.recommendations.map((tip, index) => (
          <Card key={index} className="bg-gradient-to-r from-golf-green/5 to-golf-green/10 border-golf-green/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-golf-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Lightbulb className="w-4 h-4 text-golf-green" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-deep-navy mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-700 mb-2">{tip.description}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getPriorityColor(tip.priority)}`}>
                      {tip.priority}
                    </Badge>
                    <button className="text-xs text-golf-green font-medium hover:underline">
                      View Drill <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Tracking */}
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-deep-navy">Progress Tracking</h3>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-deep-navy">vs. Previous Swing</h4>
              <button className="text-sm text-golf-green font-medium hover:underline">
                View Side-by-Side
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Overall Score</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">7.8</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-sm font-semibold text-golf-green">{analysis.overallScore}</span>
                  <span className="text-xs text-golf-green">
                    +{(analysis.overallScore - 7.8).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Swing Speed</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">98 mph</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-sm font-semibold text-golf-green">102 mph</span>
                  <span className="text-xs text-golf-green">+4 mph</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
