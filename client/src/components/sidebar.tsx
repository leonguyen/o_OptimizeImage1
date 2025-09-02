import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Combine, Upload, Key, History, Settings, ChartLine, User, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine, requiresAuth: true },
  { name: "Upload Images", href: "/upload", icon: Upload, requiresAuth: false },
  { name: "API Keys", href: "/api-keys", icon: Key, requiresAuth: true },
  { name: "History", href: "/history", icon: History, requiresAuth: true },
  { name: "Settings", href: "/settings", icon: Settings, requiresAuth: true },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const visibleNavigation = navigation.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Combine className="text-primary-foreground text-sm" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">TinyPNG Manager</h1>
            <p className="text-xs text-muted-foreground">API Integration Hub</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {visibleNavigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
          
          {!isAuthenticated && (
            <li>
              <Button
                variant="ghost"
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full justify-start px-3 py-2 h-auto text-muted-foreground hover:text-foreground hover:bg-muted"
                data-testid="button-login"
              >
                <LogIn size={20} className="mr-3" />
                <span>Login for More</span>
              </Button>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        {isAuthenticated ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="text-primary text-sm" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">System Manager</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="text-muted-foreground text-sm" size={16} />
            </div>
            <p className="text-xs text-muted-foreground">Login to access all features</p>
          </div>
        )}
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </aside>
  );
}
