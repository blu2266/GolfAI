import { Home, History, TrendingUp, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNavigation({ currentTab }: { currentTab?: string }) {
  const [location] = useLocation();
  const tabs = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "history", label: "History", icon: History, path: "/history" },
    { id: "progress", label: "Progress", icon: TrendingUp, path: "/progress" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t z-40">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab ? currentTab === tab.id : location === tab.path;
            
            return (
              <Link key={tab.id} href={tab.path} className={`flex flex-col items-center space-y-1 py-2 px-3 transition-all ${
                isActive ? "text-neon-green scale-110" : "text-foreground/50 hover:text-electric-blue"
              }`}>
                <div className={`p-2 rounded-xl transition-all ${
                  isActive ? "gradient-primary shadow-[0_0_20px_rgba(0,255,127,0.4)]" : "glass hover:scale-110"
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-deep-space" : ""}`} />
                </div>
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
