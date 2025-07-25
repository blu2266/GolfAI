import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AnalysisResults } from "@/components/analysis-results";
import type { SwingAnalysis } from "@shared/schema";

export default function Analysis() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const analysisId = params.id;

  const { data: analysis, isLoading, error } = useQuery<SwingAnalysis>({
    queryKey: [`/api/swing-analyses/${analysisId}`],
    enabled: !!analysisId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Analysis Not Found</h2>
          <p className="text-slate-600 mb-4">The requested swing analysis could not be found.</p>
          <Button onClick={() => setLocation("/history")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/history")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-deep-navy truncate">
              {analysis.title}
            </h1>
            <p className="text-sm text-slate-500">
              {new Date(analysis.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      {/* Analysis Content */}
      <main className="max-w-md mx-auto pb-6">
        <AnalysisResults analysis={analysis} />
      </main>
    </div>
  );
}