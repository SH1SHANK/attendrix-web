import { MOCK_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">
          {MOCK_USER.greeting},{" "}
          <span className="text-accent">{MOCK_USER.name}</span>
        </h1>
        <p className="text-lg text-muted-foreground">{MOCK_USER.subGreeting}</p>
      </div>
      <div className="mt-2 inline-block">
        <span className="rounded border-2 border-black bg-secondary px-3 py-1 text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {MOCK_USER.level}
        </span>
      </div>
    </header>
  );
}
