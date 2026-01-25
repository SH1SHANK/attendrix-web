import { FloatingDock } from "@/components/app/FloatingDock";

import { AppHeader } from "@/components/AppHeader";
import AlphaBanner from "@/components/AlphaBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffdf5]">
      {/* Subtle Dot Pattern Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: `24px 24px`,
        }}
      />

      {/* Alpha Banner */}
      <AlphaBanner />

      {/* Smart Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-28 pt-4">
        {children}
      </main>

      {/* Fixed Bottom Navigation Dock */}
      <FloatingDock />
    </div>
  );
}
