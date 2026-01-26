import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import remarkGfm from "remark-gfm";
import { getDocBySlug, getAllDocSlugs } from "@/lib/docs";
import { components } from "@/components/docs/MDXComponents";

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

  // Generate breadcrumbs
  const breadcrumbs = slug.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
    href: "/docs/" + slug.slice(0, index + 1).join("/"),
    isLast: index === slug.length - 1,
  }));

  return (
    <article className="min-w-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-8 font-mono">
        <Link
          href="/docs"
          className="hover:text-black hover:underline uppercase tracking-wide"
        >
          Docs
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            {crumb.isLast ? (
              <span className="text-black font-bold uppercase tracking-wide">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-black hover:underline uppercase tracking-wide"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Header */}
      <header className="mb-10 pb-6 border-b-2 border-black">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">
          {doc.frontmatter.title}
        </h1>
        {doc.frontmatter.description && (
          <p className="text-xl text-neutral-600 font-medium leading-relaxed">
            {doc.frontmatter.description}
          </p>
        )}
      </header>

      {/* MDX Content */}
      <MDXRemote
        source={doc.content}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </article>
  );
}
