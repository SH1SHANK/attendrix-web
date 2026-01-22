import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="section bg-paper border-b border-black">
      <div className="container-tight">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-16">
          <p className="label text-muted-foreground mb-3">PRICING</p>
          <h2 className="heading-2 mb-4">
            SIMPLE.
            <br />
            <span className="text-black">TRANSPARENT.</span>
          </h2>
          <p className="body-md text-muted-foreground max-w-md mx-auto">
            Built by students, for students. Premium launching Q3 2026.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Free Tier (Tier 3 - Quiet) */}
          <Card className="flex flex-col bg-white p-0 rounded-none border-2 border-black shadow-[2px_2px_0_#000] hover:shadow-none transition-all">
            <div className="p-6 border-b border-black">
              <Card.Title className="heading-4 mb-1">FREE</Card.Title>
              <Card.Description className="text-xs text-muted-foreground uppercase tracking-wide">
                For individual students
              </Card.Description>
            </div>

            <div className="p-6 border-b border-black bg-paper">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold">₹0</span>
                <span className="text-muted-foreground font-mono text-xs">
                  /forever
                </span>
              </div>
            </div>

            <Card.Content className="flex-1 flex flex-col p-6">
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  "Full subject-wise tracking",
                  "Safe cut calculator",
                  "Medical condonation",
                  "Lumen AI (limited context)",
                  "5 PDF uploads / sem",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="secondary"
                size="md"
                className="w-full text-xs py-3 mt-auto border-2 border-black"
              >
                <a href="#">GET STARTED</a>
              </Button>
            </Card.Content>
          </Card>

          {/* Premium Tier (Tier 2 - Dominant) */}
          <Card className="flex flex-col bg-ink text-white p-0 rounded-none border-2 border-black relative z-10 shadow-[8px_8px_0_#000] md:-mt-4 md:-mb-4 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3">
              <Badge variant="warning" className="text-[9px] font-bold">
                COMING SOON
              </Badge>
            </div>

            <div className="p-4 lg:p-8 border-b-2 border-charcoal">
              <Card.Title className="heading-3 text-white mb-1">
                PREMIUM
              </Card.Title>
              <Card.Description className="text-xs text-muted-foreground uppercase tracking-wide">
                For power users
              </Card.Description>
            </div>

            <div className="p-4 lg:p-8 border-b-2 border-charcoal bg-charcoal">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-5xl font-bold text-white">
                  ₹99
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  /semester
                </span>
              </div>
            </div>

            <Card.Content className="flex-1 flex flex-col p-4 lg:p-8">
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Everything in Free",
                  "GPT-4o & Claude 4.5 Sonnet",
                  "Unlimited PDF uploads",
                  "128k context windows",
                  "Priority support",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 text-sm text-white"
                  >
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="default" /* Accent typically */
                className="w-full text-xs py-4 opacity-80 cursor-not-allowed mt-auto bg-accent text-black border-black hover:bg-accent hover:opacity-100"
                disabled
              >
                NOTIFY ME
              </Button>
            </Card.Content>
          </Card>

          {/* Batch Tier (Tier 3 - Quiet) */}
          <Card className="flex flex-col bg-white p-0 rounded-none border-2 border-black shadow-[2px_2px_0_#000] hover:shadow-none transition-all">
            <div className="p-6 border-b border-black">
              <Card.Title className="heading-4 mb-1">BATCH</Card.Title>
              <Card.Description className="text-xs text-muted-foreground uppercase tracking-wide">
                For Class Reps
              </Card.Description>
            </div>

            <div className="p-6 border-b border-black bg-paper">
              <span className="font-mono text-xl font-bold">CUSTOM</span>
            </div>

            <Card.Content className="flex-1 flex flex-col p-6">
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  "Batch-wide onboarding",
                  "Shared timetable setup",
                  "CR admin dashboard",
                  "48-hour rapid setup",
                  "Priority fixes",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="secondary"
                size="md"
                className="w-full text-xs py-3 mt-auto border-2 border-black"
              >
                <a href="mailto:onboarding@attendrix.app">CONTACT US</a>
              </Button>
            </Card.Content>
          </Card>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 text-xs font-mono text-muted-foreground border border-border-light px-4 py-2 bg-surface">
            <span>NO CREDIT CARD</span>
            <span className="text-border-light">|</span>
            <span>CANCEL ANYTIME</span>
            <span className="text-border-light">|</span>
            <span>STUDENT-BUILT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
