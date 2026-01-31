import { Smartphone, Settings, ShieldAlert, Check } from "lucide-react";

export function InstallationGuide() {
  const steps = [
    {
      title: "Locate File",
      icon: <Smartphone className="w-5 h-5" />,
      content:
        "Tap the 'Download Complete' notification or find the APK in your 'Downloads' folder.",
    },
    {
      title: "Allow Source",
      icon: <Settings className="w-5 h-5" />,
      content:
        "If prompted, go to Settings and enable 'Install unknown apps' for your browser.",
    },
    {
      title: "Install App",
      icon: <Check className="w-5 h-5" />,
      content: "Tap 'Install' on the prompt. Wait for the process to finish.",
    },
    {
      title: "Play Protect",
      icon: <ShieldAlert className="w-5 h-5" />,
      content:
        "If Google Play Protect warns you, tap 'More details' -> 'Install anyway'.",
    },
  ];

  return (
    <div className="space-y-6">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className="flex gap-4 p-4 border-2 border-black bg-white shadow-[4px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0_#000] transition-shadow"
        >
          <div className="w-10 h-10 border-2 border-black bg-neutral-100 flex items-center justify-center font-bold text-lg shrink-0">
            {idx + 1}
          </div>
          <div>
            <h4 className="font-bold uppercase flex items-center gap-2 mb-1">
              {step.icon}
              {step.title}
            </h4>
            <p className="text-sm font-medium text-neutral-600 leading-relaxed">
              {step.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
