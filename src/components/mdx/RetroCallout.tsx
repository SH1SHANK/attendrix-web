import React from "react";
import { AlertCircle, FileText, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetroCalloutProps {
  children: React.ReactNode;
  type?: "note" | "warning" | "tip" | "info";
}

const RetroCallout = ({ children, type = "note" }: RetroCalloutProps) => {
  const configs = {
    note: {
      container: "bg-blue-50 border-blue-500 text-blue-900",
      icon: <Info className="h-6 w-6 text-blue-600" />,
    },
    warning: {
      container: "bg-red-50 border-red-500 text-red-900",
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
    },
    tip: {
      container: "bg-yellow-50 border-yellow-400 text-yellow-900",
      icon: <Lightbulb className="h-6 w-6 text-yellow-600" />,
    },
    // Adding info as an alias to note for compatibility
    info: {
      container: "bg-blue-50 border-blue-500 text-blue-900",
      icon: <Info className="h-6 w-6 text-blue-600" />,
    },
  };

  const config = configs[type] || configs.note;

  return (
    <div
      className={cn(
        "my-6 flex items-start gap-4 rounded-none border-l-4 p-4 shadow-sm",
        config.container,
      )}
    >
      <div className="mt-1 shrink-0 select-none">{config.icon}</div>
      <div className="text-base [&>p]:my-0 font-medium leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default RetroCallout;
