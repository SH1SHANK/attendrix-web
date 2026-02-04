import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

interface SupportLayoutProps {
  title: string;
  subtitle: string;
  subject: string;
  tips: string[];
  ctaLabel?: string;
}

const SUPPORT_EMAIL = "support@attendrix.app";

export default function SupportLayout({
  title,
  subtitle,
  subject,
  tips,
  ctaLabel = "Email Support",
}: SupportLayoutProps) {
  const subjectLine = `[Attendrix Web Support] ${subject}`;
  const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subjectLine)}`;

  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/profile"
          aria-label="Back to Profile"
          className="mb-6 inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <section className="border-[3px] border-black bg-white px-6 py-6 shadow-[6px_6px_0px_0px_#000]">
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            {title}
          </h1>
          <p className="mt-3 text-sm font-bold text-neutral-600">{subtitle}</p>

          <div className="mt-6 grid gap-4">
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                What to include
              </p>
              <ul className="list-square pl-5 text-sm font-bold text-neutral-700 space-y-1">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <a
              href={mailtoLink}
              aria-label={ctaLabel}
              className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
            >
              <Mail className="h-4 w-4" />
              {ctaLabel}
            </a>

            <p className="text-xs font-black uppercase text-neutral-500">
              Email goes to {SUPPORT_EMAIL}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
