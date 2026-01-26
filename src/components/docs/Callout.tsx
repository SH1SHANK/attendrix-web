import { Info, AlertTriangle, Lightbulb } from "lucide-react";

type CalloutType = "note" | "warning" | "tip" | "info";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const variants = {
  note: {
    icon: Info,
    color: "bg-blue-100",
    borderColor: "border-blue-500",
    textColor: "text-blue-900",
    iconColor: "text-blue-700",
  },
  info: {
    icon: Info,
    color: "bg-neutral-100",
    borderColor: "border-neutral-500",
    textColor: "text-neutral-900",
    iconColor: "text-neutral-700",
  },
  warning: {
    icon: AlertTriangle,
    color: "bg-[#fff5cc]", // Light yellow matching brand
    borderColor: "border-[#FFD02F]",
    textColor: "text-yellow-900",
    iconColor: "text-yellow-700",
  },
  tip: {
    icon: Lightbulb,
    color: "bg-green-100",
    borderColor: "border-green-500",
    textColor: "text-green-900",
    iconColor: "text-green-700",
  },
};

export function Callout({ type = "note", title, children }: CalloutProps) {
  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div
      className={`
        my-6 p-4 border-l-4 
        ${variant.color} ${variant.borderColor} 
        shadow-[4px_4px_0_rgba(0,0,0,0.1)]
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${variant.iconColor}`} />
        <div className={`flex-1 ${variant.textColor}`}>
          {title && (
            <h5 className="font-bold mb-1 uppercase tracking-wide text-xs">
              {title}
            </h5>
          )}
          <div className="text-sm [&>p]:m-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
