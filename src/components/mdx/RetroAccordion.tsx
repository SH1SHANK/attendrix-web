"use client";

import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

// ============================================
// CONTEXT
// ============================================

interface AccordionContextType {
  openItems: Set<string>;
  toggleItem: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

// ============================================
// RETRO ACCORDION WRAPPER
// ============================================

export function RetroAccordion({ children }: { children: React.ReactNode }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className="w-full space-y-4 my-8">{children}</div>
    </AccordionContext.Provider>
  );
}

// ============================================
// RETRO ACCORDION ITEM
// ============================================

interface AccordionItemProps {
  id: string;
  question: string;
  children: React.ReactNode;
}

export function RetroAccordionItem({
  id,
  question,
  children,
}: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("RetroAccordionItem must be used within RetroAccordion");
  }

  const { openItems, toggleItem } = context;
  const isOpen = openItems.has(id);

  return (
    <div className="border-2 border-black bg-white">
      {/* Trigger / Question */}
      <button
        onClick={() => toggleItem(id)}
        className="w-full text-left px-6 py-4 font-bold text-lg flex justify-between items-center hover:bg-[#FFD02F] transition-colors"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      {/* Content / Answer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 border-t-2 border-black bg-neutral-50 text-neutral-700 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SIMPLER MDX-FRIENDLY VERSION
// (For inline usage in MDX without passing props)
// ============================================

interface FAQItemProps {
  children: React.ReactNode;
}

export function FAQItem({ children }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract question from first child (should be wrapped in <summary>)
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div className="border-2 border-black bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-4 font-bold text-lg flex justify-between items-center hover:bg-[#FFD02F] transition-colors"
      >
        <span>{childArray[0]}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 border-t-2 border-black bg-neutral-50 text-neutral-700 leading-relaxed">
              {childArray.slice(1)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ({ children }: { children: React.ReactNode }) {
  return <div className="w-full space-y-4 my-8">{children}</div>;
}
