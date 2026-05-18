import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { getOrCreateUserSession, getUrlUserParams, setUser, getUser, isBrowser, updateUserSession } from "@/lib/auth";
import { track } from "@/lib/analytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-tb-navy">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page hopped off the creator stage. Let's get you home.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary inline-flex">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary">Try again</button>
          <a href="/" className="btn-ghost">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0b1437" },
      { title: "Testbook Creator Lab" },
      { name: "description", content: "Creator Lab is a student creator campaign portal for submitting videos and earning UPI payouts." },
      { name: "author", content: "Testbook" },
      { property: "og:site_name", content: "Testbook Creator Lab" },
      { property: "og:title", content: "Testbook Creator Lab" },
      { property: "og:description", content: "Creator Lab is a student creator campaign portal for submitting videos and earning UPI payouts." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://creatorlabs.testbook.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Testbookdotcom" },
      { name: "twitter:title", content: "Testbook Creator Lab" },
      { name: "twitter:description", content: "Creator Lab is a student creator campaign portal for submitting videos and earning UPI payouts." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBrowser()) return;
    getOrCreateUserSession();

    const urlUser = getUrlUserParams(window.location.search);
    if (!urlUser.hasIdentity) return;

    const userId = urlUser.userId || urlUser.phone;
    updateUserSession({ phone: urlUser.phone, userId });

    if (window.location.pathname === "/login") return;

    if (urlUser.phone.length === 10) {
      if (!getUser()) {
        setUser({ phone: urlUser.phone, userId, loggedInAt: Date.now() });
        track("UGC_creators_auth_login_completed", {
          page: window.location.pathname,
          payload: { source: "url_params", userId, phone: urlUser.phone },
        });
      }

      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", clean);

      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </QueryClientProvider>
  );
}
