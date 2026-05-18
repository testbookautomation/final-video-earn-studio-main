import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, FileText, Send, Sparkles } from "lucide-react";
import { clearUser, getUser, type TBUser } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/sop", label: "Creator SOP" },
  { to: "/submit", label: "Submit Video" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

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

  // Re-check on route change
  useEffect(() => {
    setUserState(getUser());
    setMenu(false);
    setOpen(false);
  }, [location.pathname]);

  const initials = user?.phone ? user.phone.slice(-2) : "TB";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur bg-white/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-9 rounded-xl tb-gradient flex items-center justify-center shadow-md">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-tb-navy">Testbook</div>
            <div className="text-[11px] font-semibold text-tb-blue -mt-0.5">Creator Lab</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "text-tb-blue bg-blue-50" : "text-foreground/70 hover:text-tb-navy hover:bg-secondary"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border hover:border-tb-blue transition-colors"
              >
                <span className="size-8 rounded-full tb-gradient text-white flex items-center justify-center text-xs font-bold uppercase">
                  {initials}
                </span>
                <span className="text-sm font-medium text-tb-navy">+91 {user.phone.slice(-4)}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 card p-2 fade-up">
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  <Link to="/submit" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                    <Send className="size-4" /> Submit video
                  </Link>
                  <Link to="/sop" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                    <FileText className="size-4" /> Creator SOP
                  </Link>
                  <button
                    onClick={() => {
                      clearUser();
                      navigate({ to: "/" });
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden md:inline-flex">Login</Link>
          )}
          <button
            className="md:hidden size-10 rounded-lg border border-border flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-white fade-up">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary">
                {l.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { clearUser(); navigate({ to: "/" }); }}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            ) : (
              <Link to="/login" className="btn-primary mt-1">Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
