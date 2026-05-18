import { Link, useRouterState } from "@tanstack/react-router";
import { Home, FileText, Send, LayoutDashboard } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/sop", label: "SOP", Icon: FileText },
  { to: "/submit", label: "Submit", Icon: Send },
  { to: "/dashboard", label: "Stats", Icon: LayoutDashboard },
] as const;

export function MobileBottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-4">
        {items.map(({ to, label, Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-tb-blue" : "text-muted-foreground"
              }`}
            >
              <Icon className={`size-5 ${active ? "stroke-[2.4]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
