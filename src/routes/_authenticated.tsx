import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  // SSR-safe redirect handled by client guard below; getUser is browser-only.
  component: AuthGate,
});

function AuthGate() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const u = getUser();
    if (!u) {
      // Manual redirect (no router context required for this simple LS auth)
      window.location.href = `/login`;
    } else {
      setOk(true);
    }
  }, []);
  if (!ok) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner !border-tb-blue/30 !border-t-tb-blue" />
      </div>
    );
  }
  return <Outlet />;
}

// satisfy TS unused import if we ever decide to use redirect()
void redirect;
