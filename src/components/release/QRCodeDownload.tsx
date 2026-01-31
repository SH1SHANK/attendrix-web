"use client";

import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Info } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QRCodeDownloadProps {
  url: string;
  version: string;
}

export function QRCodeDownload({ url, version }: QRCodeDownloadProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="hidden md:block relative">
      <div className="flex flex-col items-center gap-2 p-4 border-2 border-black bg-white shadow-[4px_4px_0_#000]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Scan to Download</span>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="relative"
          >
            <Info className="w-3 h-3 text-neutral-400 hover:text-black transition-colors" />

            {/* Tooltip */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-xs border-2 border-black shadow-[4px_4px_0_#000]"
                >
                  <div className="font-medium mb-1">Quick Mobile Download</div>
                  <div className="text-neutral-300">
                    Scan this QR code with your phone&apos;s camera to download
                    directly on your mobile device
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* QR Code */}
        <div className="p-2 bg-white border-2 border-black">
          <QRCodeSVG
            value={url}
            size={120}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        {/* Version Label */}
        <div className="text-[10px] font-mono text-neutral-500 text-center">
          v{version}
        </div>
      </div>
    </div>
  );
}
