import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Activity, Calendar, BarChart } from "lucide-react";
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SwingAnalysis, Club } from "@shared/schema";

export default function Progress() {
  const [timeRange, setTimeRange] = useState<string>("30");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const userId = "temp-user"; // TODO: Get from auth context

  const { data: savedAnalyses, isLoading } = useQuery<SwingAnalysis[]>({
    queryKey: [`/api/swing-analyses/saved/${userId}`],
  });

  const { data: clubs } = useQuery<Club[]>({
    queryKey: [`/api/clubs/${userId}`],
  });

  // Filter analyses by time range and club
  const filteredAnalyses = savedAnalyses?.filter(analysis => {
    const analysisDate = new Date(analysis.createdAt);
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const matchesTimeRange = analysisDate >= cutoffDate;
    const matchesClub = selectedClub === "all" || analysis.clubId === selectedClub;
    
    return matchesTimeRange && matchesClub;
  }) || [];

  // Calculate statistics
  const calculateStats = () => {
    if (filteredAnalyses.length === 0) return null;

    const scores = filteredAnalyses.map(a => a.overallScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    // Calculate improvement trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length || 0;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length || 0;
    const improvement = secondAvg - firstAvg;

    return {
      avgScore: avgScore.toFixed(1),
      maxScore: maxScore.toFixed(1),
      minScore: minScore.toFixed(1),
      improvement: improvement.toFixed(1),
      totalSwings: filteredAnalyses.length
    };
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!filteredAnalyses.length) return [];

    // Group by date
    const grouped = filteredAnalyses.reduce((acc, analysis) => {
      const date = new Date(analysis.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!acc[date]) {
        acc[date] = { date, scores: [], avgScore: 0 };
      }
      acc[date].scores.push(analysis.overallScore);
      return acc;
    }, {} as Record<string, { date: string; scores: number[]; avgScore: number }>);

    // Calculate averages and return sorted data
    return Object.values(grouped)
      .map(item => ({
        ...item,
        avgScore: item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Show last 10 data points
  };

  // Prepare phase performance data
  const preparePhaseData = () => {
    if (!filteredAnalyses.length) return [];

    const phaseScores: Record<string, number[]> = {};
    
    filteredAnalyses.forEach(analysis => {
      analysis.swingPhases?.forEach(phase => {
        if (!phaseScores[phase.name]) {
          phaseScores[phase.name] = [];
        }
        phaseScores[phase.name].push(phase.score);
      });
    });

    return Object.entries(phaseScores).map(([name, scores]) => ({
      name,
      score: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));
  };

  const stats = calculateStats();
  const chartData = prepareChartData();
  const phaseData = preparePhaseData();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-deep-navy">Progress Tracking</h1>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs?.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !stats ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-2">No data available</p>
              <p className="text-sm text-slate-500">
                Save swing analyses to track your progress
              </p>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Average Score</span>
                      <Target className="w-4 h-4 text-golf-green" />
                    </div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.avgScore}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {parseFloat(stats.improvement) > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-500">+{stats.improvement}</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-500">{stats.improvement}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Total Swings</span>
                      <Activity className="w-4 h-4 text-golf-green" />
                    </div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.totalSwings}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last {timeRange} days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Best Score</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.maxScore}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Room to Grow</span>
                      <BarChart className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-deep-navy">{stats.minScore}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Score Trend Chart */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Score Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          stroke="#64748b"
                        />
                        <YAxis 
                          domain={[0, 10]}
                          tick={{ fontSize: 12 }}
                          stroke="#64748b"
                        />
                        <Tooltip 
                          formatter={(value: number) => value.toFixed(1)}
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avgScore" 
                          stroke="#4ade80" 
                          strokeWidth={3}
                          dot={{ fill: '#4ade80', r: 5 }}
                          name="Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Phase Performance Chart */}
              {phaseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Phase Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsBarChart data={phaseData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          stroke="#64748b"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          domain={[0, 10]}
                          tick={{ fontSize: 12 }}
                          stroke="#64748b"
                        />
                        <Tooltip 
                          formatter={(value: number) => value.toFixed(1)}
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="score" 
                          fill="#1e3a5f"
                          radius={[8, 8, 0, 0]}
                          name="Avg Score"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Focus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {phaseData
                      .sort((a, b) => a.score - b.score)
                      .slice(0, 3)
                      .map((phase, index) => (
                        <div key={phase.name} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{phase.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "destructive" : "secondary"}>
                              {phase.score.toFixed(1)}
                            </Badge>
                            <span className="text-xs text-slate-500">avg</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <BottomNavigation currentTab="progress" />
    </div>
  );
}