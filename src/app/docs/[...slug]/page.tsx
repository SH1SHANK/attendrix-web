import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import remarkGfm from "remark-gfm";
import { getDocBySlug, extractHeadings, getAllDocSlugs } from "@/lib/docs";
import {
  RetroTable,
  RetroTableHead,
  RetroTableBody,
  RetroTableRow,
  RetroTableHeader,
  RetroTableCell,
  RetroCodeBlock,
  RetroInlineCode,
  RetroCallout,
  RetroAlert,
  RetroH1,
  RetroH2,
  RetroH3,
  RetroParagraph,
  RetroLink,
  RetroStrong,
  RetroUnorderedList,
  RetroOrderedList,
  RetroListItem,
  RetroHr,
  FAQ,
  FAQItem,
  CodeWindow,
} from "@/components/mdx/mdx-components";

// ============================================
// MDX COMPONENTS MAPPING
// ============================================

const mdxComponents = {
  // Headings
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <RetroH1>{props.children}</RetroH1>
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <RetroH2>{props.children}</RetroH2>
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <RetroH3>{props.children}</RetroH3>
  ),

  // Text
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <RetroParagraph>{props.children}</RetroParagraph>
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <RetroLink href={props.href}>{props.children}</RetroLink>
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <RetroStrong>{props.children}</RetroStrong>
  ),

  // Lists
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <RetroUnorderedList>{props.children}</RetroUnorderedList>
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <RetroOrderedList>{props.children}</RetroOrderedList>
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <RetroListItem>{props.children}</RetroListItem>
  ),

  // Code
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <RetroCodeBlock className={props.className}>
      {props.children}
    </RetroCodeBlock>
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    // Check if it's inside a pre (block code) or inline
    const isInline =
      typeof props.children === "string" && !props.children.includes("\n");
    if (isInline) {
      return <RetroInlineCode>{props.children}</RetroInlineCode>;
    }
    // For block code, just return children (pre handles styling)
    return <code className="text-green-400">{props.children}</code>;
  },

  // Blockquote / Callout
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <RetroCallout>{props.children}</RetroCallout>
  ),
  RetroAlert: (props: {
    children: React.ReactNode;
    type?: "note" | "warning" | "tip" | "info" | "hazard";
  }) => <RetroAlert type={props.type}>{props.children}</RetroAlert>,

  // Tables
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <RetroTable>{props.children}</RetroTable>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <RetroTableHead>{props.children}</RetroTableHead>
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <RetroTableBody>{props.children}</RetroTableBody>
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <RetroTableRow>{props.children}</RetroTableRow>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <RetroTableHeader>{props.children}</RetroTableHeader>
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <RetroTableCell>{props.children}</RetroTableCell>
  ),

  // Horizontal Rule
  hr: () => <RetroHr />,

  // Accordion / FAQ
  FAQ: (props: { children: React.ReactNode }) => <FAQ>{props.children}</FAQ>,
  FAQItem: (props: { children: React.ReactNode }) => (
    <FAQItem>{props.children}</FAQItem>
  ),
  // Code Window
  CodeWindow: (props: { title: string; children: React.ReactNode }) => (
    <CodeWindow title={props.title}>{props.children}</CodeWindow>
  ),
};

// ============================================
// TABLE OF CONTENTS COMPONENT
// ============================================

function TableOfContents({
  headings,
}: {
  headings: { text: string; slug: string; level: number }[];
}) {
  if (headings.length === 0) return null;

  return (
    <div className="border-2 border-black bg-white p-4">
      <h4 className="text-sm font-bold uppercase tracking-wider text-black mb-4 pb-2 border-b-2 border-black">
        On This Page
      </h4>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.slug}
            href={`#${heading.slug}`}
            className={`
              block text-sm py-1 transition-colors hover:text-black hover:underline
              ${heading.level === 2 ? "text-neutral-700 font-medium" : "text-neutral-500 pl-3"}
            `}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

// ============================================
// STATIC PARAMS GENERATION
// ============================================

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ============================================
// METADATA GENERATION
// ============================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return {
      title: "Doc Not Found",
      description: "The requested documentation page could not be found.",
    };
  }

  return {
    title: doc.frontmatter.title,
    description:
      doc.frontmatter.description ||
      `Documentation for ${doc.frontmatter.title}`,
    alternates: {
      canonical: `/docs/${slug.join("/")}`,
    },
    openGraph: {
      title: `${doc.frontmatter.title} | Attendrix Docs`,
      description: doc.frontmatter.description,
      url: `/docs/${slug.join("/")}`,
      type: "article",
    },
  };
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const headings = extractHeadings(doc.content);

  // Generate breadcrumbs
  const breadcrumbs = slug.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
    href: "/docs/" + slug.slice(0, index + 1).join("/"),
    isLast: index === slug.length - 1,
  }));

  return (
    <div className="flex gap-8">
      {/* Main Content */}
      <article className="flex-1 min-w-0">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
          <Link href="/docs" className="hover:text-black">
            Docs
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              {crumb.isLast ? (
                <span className="text-black font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-black">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </div>

        {/* MDX Content */}
        <MDXRemote
          source={doc.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
            },
          }}
        />
      </article>

      {/* Right Table of Contents */}
      <aside className="hidden xl:block w-64 shrink-0">
        <div className="sticky top-20">
          <TableOfContents headings={headings} />
        </div>
      </aside>
    </div>
  );
}
