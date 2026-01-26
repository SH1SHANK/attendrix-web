import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ============================================
// TYPES
// ============================================

export interface DocFrontmatter {
  title: string;
  description?: string;
}

export interface Doc {
  slug: string;
  frontmatter: DocFrontmatter;
  content: string;
}

export interface NavItem {
  title: string;
  href: string;
  isNew?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ============================================
// CONSTANTS
// ============================================

const DOCS_DIRECTORY = path.join(process.cwd(), "content", "docs");

// Navigation configuration - hardcoded for control
export const docsNavigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Lumen AI", href: "/docs/features/lumen-ai", isNew: true },
      {
        title: "Marking Attendance",
        href: "/docs/features/marking-attendance",
      },
      { title: "Safe Cut Calculator", href: "/docs/features/safe-cut" },
    ],
  },
  {
    title: "Gamification",
    items: [{ title: "Amplix System", href: "/docs/amplix", isNew: true }],
  },
  {
    title: "API Reference",
    items: [
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "Attendance RPC", href: "/docs/api/attendance" },
    ],
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the file path for a given slug
 */
function getDocFilePath(slug: string[]): string {
  return path.join(DOCS_DIRECTORY, ...slug) + ".mdx";
}

/**
 * Check if a doc file exists
 */
export function docExists(slug: string[]): boolean {
  const filePath = getDocFilePath(slug);
  return fs.existsSync(filePath);
}

/**
 * Get a single doc by slug
 */
export async function getDocBySlug(slug: string[]): Promise<Doc | null> {
  const filePath = getDocFilePath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug: slug.join("/"),
    frontmatter: {
      title: data.title || "Untitled",
      description: data.description,
    },
    content,
  };
}

/**
 * Get all doc slugs for static generation
 */
export async function getAllDocSlugs(): Promise<string[][]> {
  const slugs: string[][] = [];

  function walkDir(dir: string, prefix: string[] = []) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, [...prefix, file]);
      } else if (file.endsWith(".mdx")) {
        const slug = file.replace(/\.mdx$/, "");
        slugs.push([...prefix, slug]);
      }
    }
  }

  walkDir(DOCS_DIRECTORY);
  return slugs;
}

/**
 * Extract headings from MDX content for Table of Contents
 */
export function extractHeadings(
  content: string,
): { text: string; slug: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { text: string; slug: string; level: number }[] = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    if (!match) continue;
    const level = match![1]!.length;
    const text = match![2]!.trim();
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    headings.push({ text, slug, level });
  }

  return headings;
}
