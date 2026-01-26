"use client";

import { useEffect, useState } from "react";
// import { motion } from "framer-motion"; // Removed unused motion

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function DocsTOC() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Function to find all headings in the main content area
    const parseHeadings = () => {
      const elements = Array.from(
        document.querySelectorAll("main h2, main h3"),
      );
      const items: TOCItem[] = elements.map((elem) => ({
        id: elem.id,
        text: elem.textContent || "",
        level: Number(elem.tagName.substring(1)),
      }));
      setHeadings(items);
    };

    // Initial parse
    parseHeadings();

    // Re-parse on DOM changes (in case of dynamic loading)
    const observer = new MutationObserver(parseHeadings);
    const main = document.querySelector("main");
    if (main) {
      observer.observe(main, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      let currentId = "";
      const offset = 100; // Offset for sticky header

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element) {
          const top = element.getBoundingClientRect().top;
          if (top < offset) {
            currentId = heading.id;
          }
        }
      }
      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-64 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pl-4">
      <h4 className="font-bold text-sm uppercase tracking-wider mb-4 border-b-2 border-dashed border-neutral-300 pb-2">
        On This Page
      </h4>
      <nav className="space-y-1">
        {headings.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(item.id);
              if (el) {
                window.scrollTo({
                  top: el.offsetTop - 80, // Adjust for header
                  behavior: "smooth",
                });
                setActiveId(item.id);
              }
            }}
            className={`
              block text-sm py-1 transition-colors duration-200
              ${item.level === 3 ? "pl-4" : ""}
              ${
                activeId === item.id
                  ? "font-bold text-black border-l-2 border-black pl-3 -ml-[14px]"
                  : "text-neutral-500 hover:text-black"
              }
            `}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
