import { Badge } from "@/components/ui/Badge";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-charcoal">
      {/* Accent bar */}
      <div className="h-1 bg-accent w-full" />

      <div className="container-tight section-sm">
        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-4 mb-8 md:mb-12">
          {/* Brand Column (4 Cols) */}
          <div className="md:col-span-5 pr-0 md:pr-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent flex items-center justify-center border-2 border-white shadow-[4px_4px_0_rgba(255,255,255,0.2)]">
                <span className="font-mono font-bold text-lg text-black">
                  A
                </span>
              </div>
              <span className="font-bold text-xl tracking-tight">
                ATTENDRIX
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
              Subject-wise attendance tracking for NIT Calicut students. Built
              to solve the overall percentage trap. Not affiliated with NITC
              administration.
            </p>

            {/* Social Links */}
            <div className="flex gap-2">
              {[
                { label: "TWITTER", href: "#" },
                { label: "GITHUB", href: "#" },
                { label: "TELEGRAM", href: "https://t.me/AttendrixBot" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    social.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="px-3 py-1.5 border border-charcoal font-mono text-[10px] font-bold tracking-wider hover:border-accent hover:text-accent transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid (8 Cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 md:pt-0 border-t md:border-t-0 border-charcoal">
            {/* Product */}
            <div>
              <h4 className="font-mono text-[10px] font-bold tracking-widest text-accent mb-4">
                PRODUCT
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Safe Cut Calculator", href: "#features" },
                  { label: "Lumen AI", href: "#features" },
                  { label: "Changelog", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-mono text-[10px] font-bold tracking-widest text-accent mb-4">
                RESOURCES
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Documentation", href: "#" },
                  { label: "API Reference", href: "#" },
                  { label: "System Status", href: "#" },
                  { label: "FAQ", href: "#faq" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-mono text-[10px] font-bold tracking-widest text-accent mb-4">
                LEGAL
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Data Processing", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-charcoal pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-5 text-center sm:text-left">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
              © 2026 ATTENDRIX — BUILT BY NITC STUDENTS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
