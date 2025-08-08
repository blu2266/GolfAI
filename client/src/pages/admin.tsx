import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Plus, Edit2, Check, X, Cpu, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PromptConfiguration, AISettings } from "@shared/schema";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingPrompt, setEditingPrompt] = useState<string>("");
  const [newPromptName, setNewPromptName] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: prompts, isLoading } = useQuery<PromptConfiguration[]>({
    queryKey: ["/api/admin/prompts"],
  });

  const { data: aiSettings } = useQuery<AISettings>({
    queryKey: ["/api/admin/ai-settings"],
  });

  const activePrompt = prompts?.find(p => p.isActive);

  useEffect(() => {
    if (activePrompt && !editingPrompt) {
      setEditingPrompt(activePrompt.prompt);
    }
  }, [activePrompt]);

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, prompt }: { id: string; prompt: string }) => {
      await apiRequest("PATCH", `/api/admin/prompts/${id}`, { prompt });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update prompt",
        variant: "destructive",
      });
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: async ({ name, prompt }: { name: string; prompt: string }) => {
      await apiRequest("POST", "/api/admin/prompts", { name, prompt });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New prompt created successfully",
      });
      setIsCreating(false);
      setNewPromptName("");
      setEditingPrompt("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
    },
  });

  const activatePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/prompts/${id}/activate`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt activated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to activate prompt",
        variant: "destructive",
      });
    },
  });

  const updateAIProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      await apiRequest("PUT", "/api/admin/ai-settings", { provider });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI provider updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update AI provider",
        variant: "destructive",
      });
    },
  });

  // Check if user is admin
  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSavePrompt = () => {
    if (!activePrompt) return;
    updatePromptMutation.mutate({ id: activePrompt.id, prompt: editingPrompt });
  };

  const handleCreatePrompt = () => {
    if (!newPromptName.trim() || !editingPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a name and prompt content",
        variant: "destructive",
      });
      return;
    }
    createPromptMutation.mutate({ name: newPromptName, prompt: editingPrompt });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">Admin Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* AI Provider Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="w-5 h-5" />
              <span>AI Provider Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-provider">Select AI Provider</Label>
                <Select
                  value={aiSettings?.provider || "gemini"}
                  onValueChange={(value) => updateAIProviderMutation.mutate(value)}
                >
                  <SelectTrigger id="ai-provider" className="w-full mt-2">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Google Gemini 2.5 Pro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="openai">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4" />
                        <span>OpenAI ChatGPT-5 (GPT-4o)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                {aiSettings?.provider === "openai" ? (
                  <div>
                    <strong>ChatGPT-5 (GPT-4o)</strong> - OpenAI's latest multimodal model with advanced video analysis capabilities.
                    <br />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Requires OPENAI_API_KEY environment variable
                    </span>
                  </div>
                ) : (
                  <div>
                    <strong>Google Gemini 2.5 Pro</strong> - Google's advanced AI model optimized for multimodal understanding and video analysis.
                    <br />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Requires GEMINI_API_KEY environment variable
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Configuration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Prompt Configuration</CardTitle>
              <Button 
                size="sm" 
                onClick={() => {
                  setIsCreating(true);
                  setEditingPrompt("");
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Prompt
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Selection */}
            <div className="space-y-2">
              <Label>Available Prompts</Label>
              <div className="flex flex-wrap gap-2">
                {prompts?.map((prompt) => (
                  <Badge
                    key={prompt.id}
                    variant={prompt.isActive ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (!prompt.isActive) {
                        activatePromptMutation.mutate(prompt.id);
                      }
                      setEditingPrompt(prompt.prompt);
                    }}
                  >
                    {prompt.name}
                    {prompt.isActive && <Check className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Create New Prompt */}
            {isCreating && (
              <div className="space-y-2 p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label>Create New Prompt</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                      setNewPromptName("");
                      setEditingPrompt(activePrompt?.prompt || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Prompt name (e.g., 'beginner-friendly')"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                />
              </div>
            )}

            {/* Prompt Editor */}
            <div className="space-y-2">
              <Label>Prompt Content</Label>
              <Textarea
                value={editingPrompt}
                onChange={(e) => setEditingPrompt(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                placeholder="Enter the system prompt for Gemini..."
              />
              <p className="text-sm text-slate-600">
                This prompt will be sent to Gemini along with the golf swing video. 
                The AI will analyze the video based on these instructions.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isCreating ? (
                <Button 
                  onClick={handleCreatePrompt}
                  disabled={createPromptMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Prompt
                </Button>
              ) : (
                <Button 
                  onClick={handleSavePrompt}
                  disabled={updatePromptMutation.isPending || !activePrompt}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>

            {/* Prompt Guidelines */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Prompt Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be specific about the analysis structure you want</li>
                <li>• Include scoring criteria for consistency</li>
                <li>• Specify the tone (encouraging, technical, etc.)</li>
                <li>• Define what aspects of the swing to focus on</li>
                <li>• The JSON structure will be automatically appended</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}