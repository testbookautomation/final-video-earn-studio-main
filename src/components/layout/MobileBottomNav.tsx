import { Link, useRouterState } from "@tanstack/react-router";
import { Home, FileText, Send, LayoutDashboard } from "lucide-react";

export function MobileBottomNav() {
  const { location } = useRouterState();

  const items = [
    { type: "link" as const, to: "/", label: "Home", Icon: Home },
    { type: "link" as const, to: "/how-to", label: "How To", Icon: FileText },
    { type: "link" as const, to: "/submit", label: "Submit", Icon: Send },
    { type: "link" as const, to: "/dashboard", label: "Stats", Icon: LayoutDashboard },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/85 backdrop-blur-xl border-t border-border/80 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-4 relative h-16">
        {items.map((item) => {
          if (item.type === "button") {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center gap-1 py-1 min-h-[56px] text-[10px] sm:text-[11px] font-bold transition-all duration-200 text-muted-foreground hover:text-tb-navy scale-bounce"
              >
                <item.Icon className="size-5 stroke-[2] transition-transform duration-200" />
                {item.label}
              </button>
            );
          }
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 min-h-[56px] text-[10px] sm:text-[11px] font-bold transition-all duration-200 scale-bounce ${
                active ? "text-tb-blue" : "text-muted-foreground hover:text-tb-navy"
              }`}
            >
              {/* Active subtle glowing top accent bar */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.75 rounded-full bg-gradient-to-r from-tb-blue to-tb-blue-light shadow-[0_2px_10px_rgba(37,99,235,0.4)] animate-fade-in" />
              )}
              <item.Icon 
                className={`size-5 transition-all duration-300 ${
                  active ? "stroke-[2.5] scale-110 text-tb-blue" : "stroke-[2] text-muted-foreground"
                }`} 
              />
              <span className={`transition-all duration-200 ${active ? "font-extrabold text-tb-blue" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
