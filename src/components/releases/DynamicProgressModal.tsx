"use client";

import dynamic from "next/dynamic";

// Dynamically import the modal to avoid SSR issues
const ProgressModal = dynamic(
  () => import("@/components/releases/ProgressModal").then((mod) => mod.ProgressModal),
  {
    ssr: false,
    loading: () => null,
  }
);

export function DynamicProgressModal() {
  return <ProgressModal />;
}
