import React from "react";
import Mermaid from "./mermaid";
import RetroCallout from "./RetroCallout";

// ============================================
// RETRO TABLE COMPONENTS
// ============================================

export function RetroTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto mb-8">
      <table className="w-full border-2 border-black">{children}</table>
    </div>
  );
}

export function RetroTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[#FFD02F] border-b-2 border-black">{children}</thead>
  );
}

export function RetroTableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function RetroTableRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b-2 border-black last:border-b-0 hover:bg-neutral-50 transition-colors">
      {children}
    </tr>
  );
}

export function RetroTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-4 text-left border-r-2 border-black last:border-r-0 font-bold uppercase text-xs tracking-wider text-black">
      {children}
    </th>
  );
}

export function RetroTableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="p-4 text-left border-r-2 border-black last:border-r-0 text-neutral-700">
      {children}
    </td>
  );
}

// ============================================
// CODE BLOCK COMPONENT
// ============================================

export function RetroCodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Check if it's a mermaid diagram
  // Patterns: className="language-mermaid" or child code element has it
  const isMermaid =
    className?.includes("mermaid") ||
    (React.isValidElement(children) &&
      (children.props as { className?: string }).className?.includes(
        "mermaid",
      ));

  // If it's a code block with language-mermaid, the content is usually the child text
  if (isMermaid) {
    let chart = "";

    if (typeof children === "string") {
      chart = children;
    } else if (React.isValidElement(children)) {
      const childProps = children.props as { children?: React.ReactNode };
      if (typeof childProps.children === "string") {
        chart = childProps.children;
      }
    }

    if (chart) {
      return <Mermaid chart={chart} />;
    }
  }

  return (
    <pre className="bg-neutral-950 text-neutral-50 border-2 border-black p-4 mb-6 overflow-x-auto font-mono text-sm leading-relaxed">
      {children}
    </pre>
  );
}

export function RetroInlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-neutral-200 px-1.5 py-0.5 font-mono text-sm border border-neutral-400 text-neutral-800">
      {children}
    </code>
  );
}

// ============================================
// CALLOUT / BLOCKQUOTE COMPONENT
// ============================================

// We export the default function here to be picked up by the index import
export { RetroCallout };
export function RetroAlert(props: {
  children: React.ReactNode;
  type?: "note" | "warning" | "tip" | "info" | "hazard";
}) {
  return <RetroCallout type={props.type}>{props.children}</RetroCallout>;
}
export { default as CodeWindow } from "./CodeWindow";

// ============================================
// HEADING COMPONENTS
// ============================================

export function RetroH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black mb-6">
      {children}
    </h1>
  );
}

export function RetroH2({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  const text = typeof children === "string" ? children : "";
  const headingId =
    id ||
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <h2
      id={headingId}
      className="text-2xl font-black uppercase tracking-tight text-black mt-12 mb-4 scroll-mt-20 flex items-center gap-3"
    >
      <span className="w-2 h-8 bg-[#FFD02F]" />
      {children}
    </h2>
  );
}

export function RetroH3({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  const text = typeof children === "string" ? children : "";
  const headingId =
    id ||
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <h3
      id={headingId}
      className="text-xl font-bold text-black mt-8 mb-3 scroll-mt-20"
    >
      {children}
    </h3>
  );
}

// ============================================
// TEXT COMPONENTS
// ============================================

export function RetroParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-600 leading-relaxed mb-4">{children}</p>;
}

export function RetroLink({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href || "#"}
      className="text-[#c9a000] underline underline-offset-2 hover:text-black transition-colors font-medium"
    >
      {children}
    </a>
  );
}

export function RetroStrong({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold text-black">{children}</strong>;
}

// ============================================
// LIST COMPONENTS
// ============================================

export function RetroUnorderedList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ul className="space-y-2 text-neutral-600 mb-6 ml-2">{children}</ul>;
}

export function RetroOrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="space-y-2 text-neutral-600 mb-6 ml-2 list-decimal list-inside">
      {children}
    </ol>
  );
}

export function RetroListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-2 h-2 bg-black rounded-none mt-2 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  );
}

// ============================================
// HORIZONTAL RULE
// ============================================

export function RetroHr() {
  return <hr className="border-t-2 border-black my-10" />;
}

// ============================================
// RE-EXPORT ACCORDION COMPONENTS
// ============================================

export {
  RetroAccordion,
  RetroAccordionItem,
  FAQ,
  FAQItem,
} from "./RetroAccordion";
