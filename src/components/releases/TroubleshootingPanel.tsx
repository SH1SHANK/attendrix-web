"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    imagePath: "/images/troubleshooting/unknown-apps.png", // Placeholder
    q: "Installation Blocked / Unknown Sources",
    a: "Android blocks apps from outside the Play Store by default. Look for a 'Settings' button on the prompt, then toggle 'Allow from this source'.",
  },
  {
    q: "App Not Installed Error",
    a: "This usually means you have an older version installed with a different signature, or insufficient storage. Try uninstalling the old version first.",
  },
  {
    q: "Parse Error / Corrupted File",
    a: "The download was likely interrupted. Delete the partial file and try downloading again on a stable connection.",
  },
  {
    q: "Play Protect Warning",
    a: "Google Play Protect flags all new/unknown apps. This is normal for direct APK downloads. Select 'Install Anyway' to proceed.",
  },
];

export function TroubleshootingPanel() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="space-y-2">
      {faqs.map((faq, idx) => (
        <div key={idx} className="border-2 border-black bg-white">
          <button
            onClick={() => toggle(idx)}
            className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
          >
            <span className="font-bold uppercase text-sm">{faq.q}</span>
            {openIdx === idx ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {openIdx === idx && (
            <div className="p-4 border-t-2 border-black">
              <p className="text-sm font-medium text-neutral-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
