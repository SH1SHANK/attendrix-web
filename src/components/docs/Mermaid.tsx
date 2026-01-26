"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut } from "lucide-react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: "#FFD02F",
        primaryTextColor: "#000",
        primaryBorderColor: "#000",
        lineColor: "#000",
        secondaryColor: "#fff",
        tertiaryColor: "#fffdf5",
        fontFamily: "var(--font-inter)",
      },
      securityLevel: "loose",
    });

    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div className="my-8 border-2 border-black shadow-[4px_4px_0_#000] bg-white overflow-hidden relative group">
      {/* Controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          className="p-1.5 bg-white border-2 border-black hover:bg-neutral-100 active:translate-y-px"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.1))}
          className="p-1.5 bg-white border-2 border-black hover:bg-neutral-100 active:translate-y-px"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Diagram Container */}
      <div className="overflow-auto p-4 min-h-[300px] flex items-center justify-center bg-[#fdfdfd]">
        <div
          ref={containerRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease-out",
          }}
          className="w-full flex justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      <div className="absolute bottom-2 right-2 text-[10px] text-neutral-400 font-mono pointer-events-none">
        MERMAID.JS
      </div>
    </div>
  );
}
