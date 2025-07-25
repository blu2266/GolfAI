import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Edit2, Trash2, Save, X, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Club, UserPreferences } from "@shared/schema";

interface ClubFormData {
  name: string;
  type: "driver" | "fairway_wood" | "hybrid" | "iron" | "wedge" | "putter";
  brand: string;
  model: string;
  loft?: number;
  shaft?: string;
  isActive: boolean;
}

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();
  // User ID now comes from authentication
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [showAddClub, setShowAddClub] = useState(false);
  const [clubForm, setClubForm] = useState<ClubFormData>({
    name: "",
    type: "driver",
    brand: "",
    model: "",
    isActive: true
  });

  // Queries
  const { data: clubs, isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: [`/api/clubs`],
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: [`/api/preferences`],
  });

  // Mutations
  const createClubMutation = useMutation({
    mutationFn: async (data: ClubFormData) => {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create club");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs`] });
      setShowAddClub(false);
      resetClubForm();
      toast({
        title: "Club added",
        description: "Your club has been added to your bag.",
      });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClubFormData> }) => {
      const response = await fetch(`/api/clubs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update club");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs`] });
      setEditingClub(null);
      resetClubForm();
      toast({
        title: "Club updated",
        description: "Your club has been updated successfully.",
      });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/clubs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete club");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs`] });
      toast({
        title: "Club removed",
        description: "The club has been removed from your bag.",
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const response = await fetch(`/api/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update preferences");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/preferences`] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
  });

  const resetClubForm = () => {
    setClubForm({
      name: "",
      type: "driver",
      brand: "",
      model: "",
      isActive: true
    });
  };

  const handleAddClub = () => {
    createClubMutation.mutate(clubForm);
  };

  const handleUpdateClub = () => {
    if (editingClub) {
      updateClubMutation.mutate({ id: editingClub.id, data: clubForm });
    }
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setClubForm({
      name: club.name,
      type: club.type as "driver" | "fairway_wood" | "hybrid" | "iron" | "wedge" | "putter",
      brand: club.brand || "",
      model: club.model || "",
      loft: club.loft || undefined,
      shaft: club.shaft || undefined,
      isActive: club.isActive
    });
  };

  const handleToggleInBag = (club: Club) => {
    updateClubMutation.mutate({ 
      id: club.id, 
      data: { isActive: !club.isActive } 
    });
  };

  const clubsByType = clubs?.reduce((acc, club) => {
    if (!acc[club.type]) {
      acc[club.type] = [];
    }
    acc[club.type].push(club);
    return acc;
  }, {} as Record<string, Club[]>) || {};

  const clubTypeOrder = ["driver", "fairway_wood", "hybrid", "iron", "wedge", "putter"];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-deep-navy">Profile & Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        <div className="p-4 space-y-4">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-slate-600">Email</Label>
                  <p className="font-medium">{(user as any)?.email || "Loading..."}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Member Since</Label>
                  <p className="font-medium">January 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unit-system" className="text-sm">
                    Unit System
                  </Label>
                  <Select 
                    value={preferences?.units || "yards"}
                    onValueChange={(value) => updatePreferencesMutation.mutate({ units: value as "yards" | "meters" })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yards">Yards</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="handicap" className="text-sm">
                    Handicap
                  </Label>
                  <Input
                    id="handicap"
                    type="number"
                    className="w-20"
                    placeholder="0.0"
                    value={preferences?.handicap || ""}
                    onChange={(e) => updatePreferencesMutation.mutate({ handicap: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Golf Bag Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  My Golf Bag
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddClub(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Club
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clubsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : clubs?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-2">No clubs in your bag yet</p>
                  <p className="text-sm text-slate-500">Add your clubs to track performance</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clubTypeOrder.map(type => {
                    const clubsOfType = clubsByType[type];
                    if (!clubsOfType || clubsOfType.length === 0) return null;
                    
                    return (
                      <div key={type}>
                        <h4 className="text-sm font-semibold text-slate-600 mb-2 capitalize">
                          {type}s
                        </h4>
                        <div className="space-y-2">
                          {clubsOfType.map(club => (
                            <div
                              key={club.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                club.isActive
                                  ? "bg-white border-slate-200"
                                  : "bg-slate-50 border-slate-100"
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-deep-navy">{club.name}</p>
                                  {!club.isActive && (
                                    <Badge variant="secondary" className="text-xs">
                                      Not in bag
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600">
                                  {club.brand} {club.model}
                                  {club.loft && ` • ${club.loft}°`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClub(club)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteClubMutation.mutate(club.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Club Dialog */}
      <Dialog open={showAddClub || !!editingClub} onOpenChange={(open) => {
        if (!open) {
          setShowAddClub(false);
          setEditingClub(null);
          resetClubForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClub ? "Edit Club" : "Add New Club"}
            </DialogTitle>
            <DialogDescription>
              {editingClub ? "Update your club details." : "Add a new club to your golf bag."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="club-name">Club Name</Label>
              <Input
                id="club-name"
                value={clubForm.name}
                onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                placeholder="e.g., TaylorMade Stealth"
              />
            </div>
            
            <div>
              <Label htmlFor="club-type">Type</Label>
              <Select 
                value={clubForm.type}
                onValueChange={(value) => setClubForm({ ...clubForm, type: value as typeof clubForm.type })}
              >
                <SelectTrigger id="club-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="fairway_wood">Fairway Wood</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="iron">Iron</SelectItem>
                  <SelectItem value="wedge">Wedge</SelectItem>
                  <SelectItem value="putter">Putter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="club-brand">Brand</Label>
                <Input
                  id="club-brand"
                  value={clubForm.brand}
                  onChange={(e) => setClubForm({ ...clubForm, brand: e.target.value })}
                  placeholder="e.g., TaylorMade"
                />
              </div>
              
              <div>
                <Label htmlFor="club-model">Model</Label>
                <Input
                  id="club-model"
                  value={clubForm.model}
                  onChange={(e) => setClubForm({ ...clubForm, model: e.target.value })}
                  placeholder="e.g., Stealth 2"
                />
              </div>
            </div>
            
            {(clubForm.type !== "putter") && (
              <div>
                <Label htmlFor="club-loft">Loft (degrees)</Label>
                <Input
                  id="club-loft"
                  type="number"
                  value={clubForm.loft || ""}
                  onChange={(e) => setClubForm({ ...clubForm, loft: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 10.5"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="club-shaft">Shaft</Label>
              <Input
                id="club-shaft"
                value={clubForm.shaft || ""}
                onChange={(e) => setClubForm({ ...clubForm, shaft: e.target.value })}
                placeholder="e.g., Fujikura Ventus Blue"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="in-bag"
                checked={clubForm.isActive}
                onCheckedChange={(checked) => setClubForm({ ...clubForm, isActive: checked })}
              />
              <Label htmlFor="in-bag">Currently in bag</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddClub(false);
                setEditingClub(null);
                resetClubForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingClub ? handleUpdateClub : handleAddClub}
              disabled={!clubForm.name || !clubForm.type}
            >
              {editingClub ? "Update" : "Add"} Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation currentTab="profile" />
    </div>
  );
}