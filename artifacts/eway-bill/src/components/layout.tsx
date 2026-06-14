import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { LogOut, Home, Building2, Users, FileText, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    ...(isSuperAdmin ? [
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/users", label: "Users", icon: Users },
    ] : []),
    { href: "/ewaybills", label: "E-Way Bills", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background no-print">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="font-bold text-sm text-sidebar-foreground truncate" title="Legacy Business E-WAY BILL Generator">
            Legacy Business<br/>E-WAY BILL Generator
          </h1>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  location === item.href || location.startsWith(`${item.href}/`)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-col gap-1 mb-4">
            <span className="text-sm font-medium text-sidebar-foreground truncate">{user.companyName}</span>
            <span className="text-xs text-muted-foreground truncate">{user.username} ({user.role})</span>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 border-b bg-card md:hidden">
          <h1 className="font-bold text-sm truncate">Legacy Business E-WAY BILL Generator</h1>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
