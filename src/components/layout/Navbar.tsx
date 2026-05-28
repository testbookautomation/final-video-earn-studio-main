import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, FileText, Send, User } from "lucide-react";
import { clearUser, getUser, type TBUser } from "@/lib/auth";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/submit", label: "Send Video" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

function initialsForUser(user: TBUser | null): string {
  const parts = (user?.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) return parts.slice(0, 2).map((p) => p[0]).join("");
  return user?.phone ? user.phone.slice(-2) : "TB";
}

export function Navbar() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [user, setUserState] = useState<TBUser | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const sync = () => setUserState(getUser());
    sync();
    window.addEventListener("tb:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tb:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    setUserState(getUser());
    setMenu(false);
    setOpen(false);
  }, [location.pathname]);

  const initials = initialsForUser(user);
  const userLabel = user?.name?.trim() || (user?.phone ? `+91 ${user.phone.slice(-4)}` : "");

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 md:bg-white/75 border-b border-border/80 shadow-[0_2px_20px_rgba(0,0,0,0.02)]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 h-[52px] sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img src="https://cdn.testbook.com/1755173671769-testbook-logo.png/1755173673.png" alt="Testbook" className="h-7 sm:h-8 w-auto" />
          <div className="h-5 w-px bg-border/80" />
          <span className="text-[9px] sm:text-[11px] font-black text-tb-blue tracking-widest uppercase bg-blue-50 border border-blue-100/50 px-1.5 sm:px-2 py-0.5 rounded-md">Creators Lab</span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to} 
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  active 
                    ? "text-tb-blue bg-blue-50/80 border border-blue-100/60" 
                    : "text-foreground/75 hover:text-tb-navy hover:bg-secondary/60"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-tb-blue shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                )}
              </Link>
            );
          })}
          <Link
            to="/how-to"
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 text-foreground/75 hover:text-tb-navy hover:bg-secondary/60"
          >
            How To
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative hidden md:block">
              <button 
                onClick={() => setMenu((v) => !v)} 
                className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full border border-border/80 hover:border-tb-blue/40 shadow-sm hover:shadow transition-all duration-200 bg-white"
              >
                <span className="size-8 rounded-full bg-gradient-to-br from-tb-navy to-tb-blue text-white flex items-center justify-center text-xs font-black uppercase shadow-sm">{initials}</span>
                <span className="max-w-32 truncate text-sm font-bold text-tb-navy">{userLabel}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${menu ? "rotate-180" : ""}`} />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2.5 w-60 card p-2 bg-white/95 backdrop-blur-xl border border-border/80 shadow-xl shadow-slate-900/5 fade-up z-50">
                  <div className="px-3 py-2 border-b border-border/50 mb-1 text-xs">
                    <div className="font-semibold text-tb-navy truncate">{user.name || "Creator Account"}</div>
                    <div className="text-muted-foreground truncate font-medium mt-0.5">+91 {user.phone}</div>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl text-foreground/80 hover:text-tb-blue hover:bg-blue-50/60 transition-colors"><LayoutDashboard className="size-4" /> Dashboard</Link>
                  <Link to="/submit" className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl text-foreground/80 hover:text-tb-blue hover:bg-blue-50/60 transition-colors"><Send className="size-4" /> Send video</Link>
                  <Link to="/how-to" className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl text-foreground/80 hover:text-tb-blue hover:bg-blue-50/60 transition-colors"><FileText className="size-4" /> How To</Link>
                  <button onClick={() => { clearUser(); navigate({ to: "/" }); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-red-50 text-red-600 border-t border-border/50 mt-1 transition-colors"><LogOut className="size-4" /> Sign out</button>
                </div>
              )}
            </div>
          ) : location.pathname !== "/login" ? (
            <Link to="/login" className="btn-primary hidden md:inline-flex text-xs px-3.5 sm:px-5 py-2 min-h-[38px] sm:min-h-[40px] shadow-sm">Login</Link>
          ) : null}

          {/* Mobile hamburger menu toggle */}
          <button 
            className="md:hidden size-10 rounded-xl border border-border/80 flex items-center justify-center hover:bg-secondary/40 transition-colors active:scale-95 bg-white" 
            onClick={() => setOpen((v) => !v)} 
            aria-label="Menu"
          >
            {open ? <X className="size-5 text-tb-navy" /> : <Menu className="size-5 text-tb-navy" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-white/95 backdrop-blur-xl fade-up shadow-lg relative z-50">
          <div className="px-3.5 py-3 flex flex-col gap-1.5">
            {navLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link 
                  key={l.to} 
                  to={l.to} 
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    active 
                      ? "bg-blue-50 text-tb-blue border border-blue-100/50" 
                      : "hover:bg-secondary/50 text-foreground/80 hover:text-tb-navy"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              to="/how-to"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-bold text-foreground/80 hover:bg-secondary/50 hover:text-tb-navy"
            >
              How To
            </Link>
            {user ? (
              <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-2">
                <div className="px-4 py-2 bg-secondary/30 rounded-xl">
                  <div className="text-xs font-bold text-tb-navy truncate">{user.name || "Creator Account"}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">+91 {user.phone}</div>
                </div>
                <button 
                  onClick={() => { clearUser(); navigate({ to: "/" }); }} 
                  className="text-left px-4 py-3 rounded-xl text-sm font-extrabold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : location.pathname !== "/login" ? (
              <Link to="/login" className="btn-primary mt-2 text-sm justify-center py-3">Login to Creators Lab</Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
