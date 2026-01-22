import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { X, Check, AlertTriangle } from "lucide-react";

export default function ProblemSolution() {
  return (
    <section id="problem" className="section bg-paper border-b border-black">
      <div className="container-tight">
        {/* Section Header */}
        <div className="mb-12">
          <p className="label text-muted-foreground mb-3">THE PROBLEM</p>
          <h2 className="heading-2 mb-4">
            YOUR &quot;OVERALL PERCENTAGE&quot;
            <br />
            <span className="bg-accent px-2">IS A LIE.</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl border-l-4 border-black pl-4">
            Traditional apps show you one aggregate number. That&apos;s a
            dangerous oversimplification. One subject below 80% means you are
            exam ineligible, regardless of your total average.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Problem Card - Tier 2 */}
          <Card className="p-0 flex flex-col overflow-hidden border-2 border-black shadow-md">
            <div className="bg-destructive text-white p-3 lg:p-4 border-b border-black flex items-center gap-3">
              <span className="w-8 h-8 bg-white text-destructive flex items-center justify-center font-bold text-lg border border-black">
                <X className="w-5 h-5" />
              </span>
              <span className="font-mono font-bold tracking-wide">
                THE AVERAGE TRAP
              </span>
            </div>

            <div className="p-4 lg:p-6 flex-1 flex flex-col">
              <div className="bg-ink border-2 border-black p-4 lg:p-5 mb-4 font-mono text-sm relative shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider">
                  Aggregate View
                </p>
                <p className="text-white text-3xl lg:text-4xl font-bold mb-4">
                  82.5%
                </p>
                <div className="space-y-2 pt-3 border-t border-slate-600 text-xs">
                  <p className="text-muted-foreground flex gap-2">
                    <span>STATUS:</span>
                    <span className="text-white">SEEMINGLY SAFE</span>
                  </p>
                  <p className="text-destructive flex gap-2 font-bold animate-pulse">
                    <span>WARNING:</span>
                    <span>ME201 IS 76% (CRITICAL)</span>
                  </p>
                </div>
              </div>
              <p className="mt-auto text-sm font-medium text-destructive-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" /> One
                subject failure = Semester failure.
              </p>
            </div>
          </Card>

          {/* Solution Card - Tier 2 */}
          <Card className="p-0 flex flex-col overflow-hidden border-2 border-black shadow-md">
            <div className="bg-success text-white p-4 border-b border-black flex items-center gap-3">
              <span className="w-8 h-8 bg-white text-success flex items-center justify-center font-bold text-lg border border-black">
                <Check className="w-5 h-5" />
              </span>
              <span className="font-mono font-bold tracking-wide">
                SUBJECT-WISE TRUTH
              </span>
            </div>

            <div className="p-6 flex-1">
              <div className="space-y-3 font-mono text-sm">
                {[
                  {
                    code: "ME201",
                    pct: 76,
                    status: "CRITICAL",
                    label: "BARRED",
                  },
                  { code: "CS201", pct: 88, status: "SAFE", label: "OK" },
                  { code: "MA201", pct: 85, status: "SAFE", label: "OK" },
                  { code: "PH201", pct: 81, status: "WARNING", label: "RISK" },
                ].map((subject) => (
                  <div
                    key={subject.code}
                    className="p-3 border-2 border-black flex items-center justify-between bg-white hover:translate-x-1 transition-transform"
                  >
                    <span className="font-bold">{subject.code}</span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-bold ${
                          subject.status === "CRITICAL"
                            ? "text-destructive"
                            : subject.status === "WARNING"
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        {subject.pct}%
                      </span>
                      <Badge
                        variant={
                          subject.status === "CRITICAL"
                            ? "error"
                            : subject.status === "WARNING"
                              ? "warning"
                              : "success"
                        }
                        className="w-16 justify-center"
                      >
                        {subject.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* The Rule Section */}
        <Card className="p-0 overflow-hidden border-[3px] border-black shadow-[6px_6px_0_#000] bg-charcoal">
          <div className="bg-accent p-4 border-b-2 border-black flex justify-between items-center">
            <span className="font-mono text-sm font-bold text-black">
              NIT CALICUT ATTENDANCE POLICY
            </span>
            <Badge
              variant="outline"
              className="bg-white text-black border-black font-mono text-xs font-bold px-2 py-0.5"
            >
              R.2023
            </Badge>
          </div>
          <div className="p-8 grid md:grid-cols-[1.5fr_1fr] gap-8 items-center bg-charcoal">
            <div>
              <h3 className="heading-3 text-white mb-4">THE 80% RULE</h3>
              <div className="space-y-4 text-sm font-mono text-muted-foreground">
                <p className="flex items-start gap-3">
                  <span className="text-accent font-bold">§1</span>
                  <span>
                    Minimum{" "}
                    <span className="text-white border-b border-accent">
                      80% attendance
                    </span>{" "}
                    required in every distinct course.
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent font-bold">§2</span>
                  <span>
                    The threshold applies{" "}
                    <span className="text-white border-b border-accent">
                      per subject
                    </span>
                    . Cumulative average is irrelevant.
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent font-bold">§3</span>
                  <span>
                    Falling below 80% results in{" "}
                    <span className="text-destructive font-bold bg-destructive/10 px-1">
                      immediate exam ineligibility
                    </span>
                    .
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-accent bg-ink shadow-[4px_4px_0_#FACC15]">
              <p className="font-mono text-6xl font-bold text-accent tracking-tighter">
                80%
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                PER SUBJECT MINIMUM
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
