"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface SnippetProps {
  children: React.ReactNode;
  filename?: string;
  language?: string;
}

export function Snippet({ children, filename, language }: SnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = document.getElementById(`code-${filename}`)?.innerText || "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 border-2 border-black shadow-[4px_4px_0_#000] bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Mac-style dots for aesthetic */}
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <span className="font-mono text-xs text-neutral-400">
            {filename || language || "Terminal"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto">{children}</div>
    </div>
  );
}
