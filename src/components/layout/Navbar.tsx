import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, FileText, Send } from "lucide-react";
import { clearUser, getUser, type TBUser } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/how-to", label: "How To" },
  { to: "/submit", label: "Send Video" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

function initialsForUser(user: TBUser | null): string {
  const parts = (user?.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    return parts.slice(0, 2).map((part) => part[0]).join("");
  }
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

  // Re-check on route change
  useEffect(() => {
    setUserState(getUser());
    setMenu(false);
    setOpen(false);
  }, [location.pathname]);

  const initials = initialsForUser(user);
  const userLabel = user?.name?.trim() || (user?.phone ? `+91 ${user.phone.slice(-4)}` : "");

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="https://cdn.testbook.com/1755173671769-testbook-logo.png/1755173673.png"
            alt="Testbook"
            className="h-8 w-auto"
          />
          <div className="h-5 w-px bg-border" />
          <span className="text-xs font-bold text-tb-blue tracking-widest uppercase">Creator Lab</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? "text-tb-blue bg-blue-50 border border-blue-100"
                    : "text-foreground/70 hover:text-tb-navy hover:bg-secondary"
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
                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-border hover:border-tb-blue transition-colors bg-white"
              >
                <span className="size-8 rounded-full tb-gradient text-white flex items-center justify-center text-xs font-bold uppercase">
                  {initials}
                </span>
                <span className="max-w-32 truncate text-sm font-semibold text-tb-navy">{userLabel}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 card p-2 fade-up">
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  <Link to="/submit" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                    <Send className="size-4" /> Send video
                  </Link>
                  <Link to="/how-to" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary">
                    <FileText className="size-4" /> How To
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
          ) : location.pathname !== "/login" ? (
            <Link to="/login" className="btn-primary hidden md:inline-flex">Login</Link>
          ) : null}
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
        <div className="md:hidden border-t border-border bg-white fade-up shadow-lg">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link key={l.to} to={l.to} className={`px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${active ? "bg-blue-50 text-tb-blue" : "hover:bg-secondary text-foreground/80"}`}>
                  {l.label}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={() => { clearUser(); navigate({ to: "/" }); }}
                className="text-left px-4 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 mt-1"
              >
                Sign out
              </button>
            ) : location.pathname !== "/login" ? (
              <Link to="/login" className="btn-primary mt-2 text-sm">Login to Creator Lab</Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
