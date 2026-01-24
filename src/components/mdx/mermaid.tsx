"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

// Initialize mermaid settings
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
});

interface MermaidProps {
  chart: string;
}

const Mermaid = ({ chart }: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;

      try {
        setError(null);
        // Generate a unique ID for the diagram to prevent DOM conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // mermaid.render returns an object { svg: string }
        const { svg: svgContent } = await mermaid.render(id, chart);
        setSvg(svgContent);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError("Failed to render diagram");
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="my-8 p-4 border-2 border-red-500 bg-red-50 text-red-700 font-mono text-sm">
        <p className="font-bold">Error rendering diagram:</p>
        <p>{error}</p>
        <pre className="mt-2 text-xs overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-8 flex w-full justify-center">
      {/* Neo-Brutalist "Figure Box" for the diagram */}
      <figure
        className="mermaid-container w-full overflow-x-auto rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]"
        style={{ minHeight: "100px" }}
      >
        {svg ? (
          <div
            ref={containerRef}
            className="flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex h-24 items-center justify-center text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </figure>
    </div>
  );
};

export default Mermaid;
