import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type SupportFormLayoutProps = {
  title: string;
  subtitle: string;
  tips: string[];
  children: ReactNode;
};

export default function SupportFormLayout({
  title,
  subtitle,
  tips,
  children,
}: SupportFormLayoutProps) {
  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/profile"
          aria-label="Back to Profile"
          className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <section className="border-[3px] border-black bg-white px-6 py-6 shadow-[6px_6px_0px_0px_#000]">
          <div className="space-y-3">
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              {title}
            </h1>
            <p className="text-sm font-bold text-neutral-600">{subtitle}</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="order-2 lg:order-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {children}
            </div>
            <aside className="order-1 border-[3px] border-black bg-white px-4 py-4 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-3">
                Helpful Tips
              </p>
              <ul className="list-square space-y-2 pl-5 text-sm font-bold text-neutral-700">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] font-bold uppercase text-neutral-500">
                We respond quickly during academic hours.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
