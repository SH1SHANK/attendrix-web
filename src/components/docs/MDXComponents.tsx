import { Callout } from "./Callout";
import { PropertyTable } from "./PropertyTable";
import { Mermaid } from "./Mermaid";
import { Snippet } from "./Snippet";
import { RetroAlert } from "../mdx/mdx-components";
import CodeWindow from "../mdx/CodeWindow";
import {
  FAQ,
  FAQItem,
  RetroAccordion,
  RetroAccordionItem,
} from "../mdx/RetroAccordion";
import Link from "next/link";

export const components = {
  // Custom Components
  Callout,
  PropertyTable,
  Mermaid,
  Snippet,
  RetroAlert,
  CodeWindow,
  FAQ,
  FAQItem,
  RetroAccordion,
  RetroAccordionItem,

  // Overrides
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-black font-bold underline decoration-2 decoration-[#FFD02F] hover:bg-[#FFD02F] transition-colors"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-black font-bold underline decoration-dotted hover:bg-neutral-100 transition-colors"
      >
        {children}
      </a>
    );
  },

  // Custom Pre for better styling even without Snippet wrapper
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <div className="my-6 border-2 border-black shadow-[4px_4px_0_#000] bg-[#1e1e1e] text-white p-4 overflow-x-auto rounded-none">
      <pre className="m-0 bg-transparent p-0">{children}</pre>
    </div>
  ),

  // Responsive Images
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <div className="my-8 border-2 border-black shadow-[4px_4px_0_#000]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...props} className="block w-full" alt={props.alt || ""} />
    </div>
  ),
};
