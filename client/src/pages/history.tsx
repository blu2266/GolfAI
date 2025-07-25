import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Star, Filter, TrendingUp, Clock } from "lucide-react";
import { useLocation } from "wouter";
import type { SwingAnalysis, Club } from "@shared/schema";

export default function History() {
  const [location, setLocation] = useLocation();
  const [filterClub, setFilterClub] = useState<string>("all");
  const { data: savedAnalyses, isLoading: analysesLoading } = useQuery<SwingAnalysis[]>({
    queryKey: [`/api/swing-analyses/saved`],
  });

  const { data: clubs } = useQuery<Club[]>({
    queryKey: [`/api/clubs`],
  });

  const filteredAnalyses = savedAnalyses?.filter(analysis => 
    filterClub === "all" || analysis.clubId === filterClub
  ) || [];

  const groupedByMonth = filteredAnalyses.reduce((acc, analysis) => {
    const date = new Date(analysis.createdAt);
    const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(analysis);
    return acc;
  }, {} as Record<string, SwingAnalysis[]>);

  const getClubName = (clubId: string | null) => {
    if (!clubId || !clubs) return "Unknown Club";
    const club = clubs.find(c => c.id === clubId);
    return club ? `${club.name}` : "Unknown Club";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-deep-navy">Swing History</h1>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-500" />
            <Select value={filterClub} onValueChange={setFilterClub}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filter by club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs?.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name} ({club.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        <div className="p-4">
          {analysesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-2">No saved swings yet</p>
              <p className="text-sm text-slate-500">
                Save your analyses to track progress over time
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByMonth).map(([month, analyses]) => (
                <div key={month}>
                  <h3 className="text-sm font-semibold text-slate-600 mb-3 sticky top-32 bg-slate-50 py-2">
                    {month}
                  </h3>
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <Card
                        key={analysis.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setLocation(`/analysis/${analysis.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 mb-1">{formatDate(analysis.createdAt)}</p>
                              <h4 className="font-semibold text-deep-navy">{analysis.title}</h4>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-golf-green">
                                <Star className="w-4 h-4 mr-1 fill-current" />
                                <span className="font-bold">{analysis.overallScore}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {getClubName(analysis.clubId)}
                            </Badge>
                            {analysis.keyMetrics && analysis.keyMetrics[0] && (
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {analysis.keyMetrics[0].value}
                              </Badge>
                            )}
                          </div>

                          {analysis.notes && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {analysis.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation currentTab="history" />
    </div>
  );
}