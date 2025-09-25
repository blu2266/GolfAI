import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VideoPlayer } from "@/components/video-player";
import { ImageModal } from "@/components/ui/image-modal";
import { ArrowLeft, Star, TrendingUp, Lightbulb, ArrowRight, Target, Save, X, ThumbsUp, Wrench, Camera, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getVideoUrl, getPhaseGifUrl, getFullSwingGifUrl } from "@/lib/media-utils";
import type { SwingAnalysis, Club } from "@shared/schema";
import { resolveApiUrl } from "@/lib/api";

interface AnalysisResultsProps {
  analysisId: string;
  onBack: () => void;
}

export function AnalysisResults({ analysisId, onBack }: AnalysisResultsProps) {
  const { toast } = useToast();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveNotes, setSaveNotes] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);
  
  const { data: analysis, isLoading, error } = useQuery<SwingAnalysis>({
    queryKey: ["/api/swing-analyses", analysisId],
  });
  
  const { data: clubs } = useQuery<Club[]>({
    queryKey: [`/api/clubs`],
  });
  
  const saveMutation = useMutation({
    mutationFn: async (data: { isSaved: boolean; notes?: string; clubId?: string }) => {
      const response = await fetch(resolveApiUrl(`/api/swing-analyses/${analysisId}/save`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to save analysis");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swing-analyses", analysisId] });
      setShowSaveForm(false);
      toast({
        title: analysis?.isSaved ? "Analysis unsaved" : "Analysis saved",
        description: analysis?.isSaved ? "Removed from your history" : "Added to your history for tracking",
      });
    },
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
        videoSrc={analysis.videoPath.startsWith("sample") ? undefined : getVideoUrl(analysis)}
        className="mx-4"
        analysisId={analysis.id}
        analysis={analysis}
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
              <p className="text-sm text-slate-600 mb-4">{analysis.overallFeedback}</p>
              
              {/* Save Analysis Button */}
              {!showSaveForm && (
                <Button
                  onClick={() => {
                    if (analysis.isSaved) {
                      saveMutation.mutate({ isSaved: false });
                    } else {
                      setShowSaveForm(true);
                    }
                  }}
                  variant={analysis.isSaved ? "outline" : "default"}
                  className="mt-4"
                >
                  {analysis.isSaved ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Remove from History
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Analysis
                    </>
                  )}
                </Button>
              )}
              
              {/* Save Form */}
              {showSaveForm && (
                <div className="mt-4 text-left space-y-3 border-t pt-4">
                  <div>
                    <Label htmlFor="club-select">Club Used</Label>
                    <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                      <SelectTrigger id="club-select">
                        <SelectValue placeholder="Select a club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs?.filter(club => club.isActive).map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name} ({club.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this swing..."
                      value={saveNotes}
                      onChange={(e) => setSaveNotes(e.target.value)}
                      className="h-20"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        saveMutation.mutate({
                          isSaved: true,
                          notes: saveNotes,
                          clubId: selectedClubId || undefined
                        });
                      }}
                      disabled={!selectedClubId}
                    >
                      Save to History
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSaveForm(false);
                        setSaveNotes("");
                        setSelectedClubId("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ball Metrics */}
      {analysis.ballMetrics && Object.keys(analysis.ballMetrics).length > 0 && (
        <div className="mx-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-deep-navy mb-4">Ball Flight Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {analysis.ballMetrics.ballSpeed && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-golf-green">{analysis.ballMetrics.ballSpeed}</div>
                    <div className="text-xs text-slate-600">Ball Speed</div>
                  </div>
                )}
                {analysis.ballMetrics.estimatedDistance && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-golf-green">{analysis.ballMetrics.estimatedDistance}</div>
                    <div className="text-xs text-slate-600">Est. Distance</div>
                  </div>
                )}
                {analysis.ballMetrics.launchAngle && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-golf-green">{analysis.ballMetrics.launchAngle}</div>
                    <div className="text-xs text-slate-600">Launch Angle</div>
                  </div>
                )}
                {analysis.ballMetrics.hangTime && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-golf-green">{analysis.ballMetrics.hangTime}</div>
                    <div className="text-xs text-slate-600">Hang Time</div>
                  </div>
                )}
                {analysis.ballMetrics.curve && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-golf-green">{analysis.ballMetrics.curve}</div>
                    <div className="text-xs text-slate-600">Shot Shape</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Swing Breakdown */}
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-deep-navy">Swing Breakdown</h3>
        
        {analysis.swingPhases.map((phase, index) => (
          <Card key={index} className="overflow-hidden">
            {/* Phase Header with Score */}
            <div className="bg-gradient-to-r from-golf-green/10 to-transparent p-4 border-b">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-deep-navy">
                  {phase.name}
                </h4>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-2xl font-bold ${getScoreColor(phase.score)}`}>
                    {phase.score}
                  </span>
                  <span className="text-slate-500 text-sm">/10</span>
                </div>
              </div>
            </div>
            
            {/* GIF Display */}
            {analysis.frameExtractions && analysis.frameExtractions.find(frame => frame.timestamp === phase.timestamp) && (
              <div className="bg-gradient-to-b from-slate-50 to-white p-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <img 
                    src={getPhaseGifUrl(analysis, phase.name)}
                    alt={`${phase.name} motion`}
                    className="w-full h-48 md:h-64 object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => setExpandedImage({ 
                      src: getPhaseGifUrl(analysis, phase.name),
                      alt: `${phase.name} motion`
                    })}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="text-center hidden p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">Preview not available</p>
                  </div>
                </div>
              </div>
            )}
            
            <CardContent className="pt-6 pb-6 space-y-5">
              {/* Feedback Summary */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed">{phase.feedback}</p>
              </div>
              
              {/* Strengths and Improvements Stacked */}
              <div className="space-y-4">
                {/* Positives Section */}
                {phase.strengths && phase.strengths.length > 0 && (
                  <div className="bg-golf-green/5 rounded-lg p-4 border border-golf-green/20">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-golf-green/20 rounded-full flex items-center justify-center">
                        <ThumbsUp className="w-4 h-4 text-golf-green" />
                      </div>
                      <h5 className="font-semibold text-deep-navy">Strengths</h5>
                    </div>
                    <div className="space-y-2">
                      {phase.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-golf-green flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Areas for Improvement Section */}
                {phase.improvements && phase.improvements.length > 0 && (
                  <div className="bg-golden/5 rounded-lg p-4 border border-golden/20">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-golden/20 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-golden" />
                      </div>
                      <h5 className="font-semibold text-deep-navy">Areas to Work On</h5>
                    </div>
                    <div className="space-y-2">
                      {phase.improvements.map((improvement, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <ArrowRight className="w-4 h-4 text-golden flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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

      {/* Image Modal */}
      {expandedImage && (
        <ImageModal
          isOpen={!!expandedImage}
          onClose={() => setExpandedImage(null)}
          src={expandedImage.src}
          alt={expandedImage.alt}
        />
      )}
    </div>
  );
}
