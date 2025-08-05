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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab ? currentTab === tab.id : location === tab.path;
            
            return (
              <Link key={tab.id} href={tab.path} className={`flex flex-col items-center space-y-1 py-2 px-3 ${
                isActive ? "text-golf-green" : "text-slate-400"
              } hover:text-golf-green transition-colors`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
