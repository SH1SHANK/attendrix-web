import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function FeatureGrid() {
  return (
    <section id="features" className="section bg-surface border-b border-black">
      <div className="container-tight">
        {/* Section Header */}
        <div className="mb-12">
          <p className="label text-muted-foreground mb-3">FEATURES</p>
          <h2 className="heading-2 mb-4">
            BUILT FOR
            <br />
            <span className="text-black">ACADEMIC PRECISION.</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl border-l-4 border-black pl-4">
            Every feature mirrors NITC&apos;s attendance policies exactly. No
            assumptions. No approximations. Just raw, verified data.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
          {/* Large Feature: Subject-Wise Tracking (Tier 2) */}
          <Card className="lg:col-span-8 p-0 overflow-hidden flex flex-col h-full bg-surface-elevated shadow-md border-2 border-black">
            <div className="grid md:grid-cols-2 h-full">
              <div className="p-5 lg:p-8 flex flex-col justify-between">
                <div>
                  <Badge variant="dark" className="mb-4">
                    CORE SYSTEM
                  </Badge>
                  <h3 className="heading-3 mb-4">SUBJECT-WISE LEDGERS</h3>
                  <p className="body-md text-muted-foreground mb-8">
                    Independent tracking for every course. Each subject
                    maintains its own attendance ledger—exactly mirroring the
                    Academic Section&apos;s eligibility criteria.
                  </p>
                </div>
                <ul className="space-y-4 mt-auto">
                  {[
                    "8 independent subject tracks",
                    "Real-time percentage updates",
                    "Critical status & risk alerts",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm font-medium"
                    >
                      <span className="w-2 h-2 bg-black border border-black" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-paper border-l-2 border-black p-5 lg:p-8 font-mono text-xs hidden md:flex flex-col justify-center">
                <p className="text-muted-foreground mb-4 uppercase tracking-widest font-bold">
                  LEDGER SNAPSHOT
                </p>
                <div className="space-y-3">
                  {[
                    { code: "ME201", pct: 76, status: "crit" },
                    { code: "CS201", pct: 88, status: "safe" },
                    { code: "MA201", pct: 85, status: "safe" },
                    { code: "PH201", pct: 81, status: "warn" },
                  ].map((s) => (
                    <div
                      key={s.code}
                      className="flex justify-between items-center p-3 bg-white border border-black shadow-[2px_2px_0_rgba(0,0,0,0.05)]"
                    >
                      <span className="font-bold">{s.code}</span>
                      <span
                        className={`font-bold ${
                          s.status === "crit"
                            ? "text-destructive"
                            : s.status === "warn"
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        {s.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Tall Feature: Safe Cut Calculator (Tier 2) */}
          <Card className="lg:col-span-4 lg:row-span-2 bg-ink text-white p-6 flex flex-col h-full border-2 border-black shadow-md">
            <div className="mb-4">
              <Badge variant="warning" className="text-black border-black">
                CALCULATOR
              </Badge>
            </div>
            <h3 className="heading-3 text-white mb-3">SAFE CUTS</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              How many classes can you skip and still hit 80%? We calculate this
              live for every subject, every day.
            </p>
            <div className="mt-auto">
              <div className="bg-charcoal p-4 border border-slate-600 font-mono text-xs shadow-[4px_4px_0_#000]">
                <p className="text-muted-foreground mb-3 border-b border-slate-600 pb-2">
                  FORMULA_EXECUTION
                </p>
                <div className="space-y-1 text-white opacity-80">
                  <p>
                    <span className="text-accent">def</span>{" "}
                    calculate_safe_cuts():
                  </p>
                  <p className="pl-4">return (current% * held -</p>
                  <p className="pl-4"> (80% * expected)) / 20%</p>
                </div>
                <div className="bg-ink border border-slate-600 mt-4 p-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
                  </div>
                  <p className="text-muted-foreground mb-1 uppercase text-[10px]">
                    ME201 STATUS
                  </p>
                  <p className="text-3xl text-destructive font-bold">-2</p>
                  <p className="text-destructive text-[10px] mt-1 font-bold">
                    WARNING: DEFICIT DETECTED
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Medium Feature: Slot System (Tier 3) */}
          <Card className="lg:col-span-4 p-6 flex flex-col justify-between h-full bg-surface-elevated border-2 border-black shadow-sm">
            <div>
              <h3 className="heading-4 mb-2">SLOT MAPPING</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Auto-maps courses to NITC&apos;s complex slot system (A1, B2,
                etc). No manual data entry.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {["A1", "B2", "C1", "D2", "E1", "F2"].map((slot) => (
                <span
                  key={slot}
                  className="font-mono text-xs px-2 py-1 bg-paper border border-black"
                >
                  {slot}
                </span>
              ))}
              <span className="font-mono text-xs px-2 py-1 text-muted-foreground border border-transparent">
                ...
              </span>
            </div>
          </Card>

          {/* Medium Feature: Medical Condonation (Tier 3) */}
          <Card className="lg:col-span-4 p-6 flex flex-col justify-between h-full bg-surface-elevated border-2 border-black shadow-sm">
            <div>
              <h3 className="heading-4 mb-2">MEDICAL LEAVE</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Approved medical leaves automatically adjust your attendance
                denominator for calculation.
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-3 p-3 bg-paper border border-black">
                <span className="w-3 h-3 bg-success border border-black" />
                <span className="text-xs font-mono font-bold">
                  3 DAYS CONDONED
                </span>
              </div>
            </div>
          </Card>

          {/* Large Feature: Lumen AI (Tier 2/3 Hybrid) */}
          <Card className="lg:col-span-12 p-0 overflow-hidden mt-2 bg-ink border-2 border-black shadow-md">
            <div className="bg-charcoal p-3 border-b-2 border-black flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-white tracking-widest pl-2">
                LUMEN_AI_ASSISTANT
              </span>
              <Badge variant="warning" className="text-[10px] h-5 px-1.5">
                EXPERIMENTAL
              </Badge>
            </div>
            <div className="grid lg:grid-cols-[1fr_320px] items-stretch">
              <div className="p-8">
                <h3 className="heading-3 text-white mb-3">
                  SYLLABUS-BOUND INTELLIGENCE
                </h3>
                <p className="body-md text-muted-foreground mb-8 max-w-2xl">
                  Upload your course pdfs. Lumen answers your doubts using ONLY
                  ground-truth data from your syllabus. Zero hallucinations.
                  100% relevance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { step: "01", label: "UPLOAD PDF" },
                    { step: "02", label: "VECTORIZE" },
                    { step: "03", label: "QUERY" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 border border-slate-600 bg-ink"
                    >
                      <span className="font-mono font-bold text-accent">
                        {item.step}
                      </span>
                      <span className="text-xs font-bold text-white tracking-wide">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-black p-6 border-l-2 border-charcoal hidden lg:flex flex-col justify-center">
                <div className="font-mono text-xs space-y-3">
                  <div className="p-3 bg-charcoal border border-slate-600 self-end max-w-[90%]">
                    <p className="text-muted-foreground text-[10px] mb-1 text-right">
                      YOU
                    </p>
                    <p className="text-white">Explain the second law</p>
                  </div>
                  <div className="p-3 bg-ink border border-accent self-start max-w-[95%] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                    <p className="text-accent text-[10px] mb-1">LUMEN</p>
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="text-white">
                        [Source: ME201_Module3.pdf]
                      </span>
                      <br />
                      The Second Law states that entropy of an isolated system
                      never decreases...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
