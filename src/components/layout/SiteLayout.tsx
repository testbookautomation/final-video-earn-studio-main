import { useEffect, useState, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { TermsModal } from "@/components/TermsModal";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (name === "terms") setTermsOpen(true);
    };
    const onClose = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (name === "terms") setTermsOpen(false);
    };
    window.addEventListener("tb:modal:open", onOpen);
    window.addEventListener("tb:modal:close", onClose);
    return () => {
      window.removeEventListener("tb:modal:open", onOpen);
      window.removeEventListener("tb:modal:close", onClose);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
