import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Search, Heart, FileText, LogOut, Menu, X, Building2, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV = [
  { label: "Dashboard", path: "/portal", icon: LayoutDashboard },
  { label: "Browse Deals", path: "/portal/browse", icon: Search },
  { label: "Watchlist", path: "/portal/watchlist", icon: Heart },
  { label: "My Offers", path: "/portal/offers", icon: FileText },
];

export default function PortalLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin("/portal"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await base44.auth.logout("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link to="/portal" className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 gradient-navy rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-foreground leading-tight">DistressDeals</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Investor Portal</div>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.[0]?.toUpperCase() || "I"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{user?.full_name || "Investor"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-card border-r border-border flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-card border-r border-border flex flex-col" style={{ animation: "slide-left 0.3s ease-out" }}>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            <span className="font-display font-bold text-foreground">DistressDeals</span>
          </div>
          <Link to="/portal" className="w-5 h-5" />
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}