import React from "react";

interface CodeWindowProps {
  title: string;
  children: React.ReactNode;
}

const CodeWindow = ({ title, children }: CodeWindowProps) => {
  return (
    <div className="my-8">
      {/* Title Tab */}
      <div className="inline-block border-2 border-black border-b-0 bg-neutral-200 px-4 py-1.5 font-mono text-sm font-bold text-black">
        {title}
      </div>

      {/* Content Container - removes top border from code block if it's a direct child */}
      <div className="[&>pre]:mt-0 [&>pre]:border-t-2 [&>pre]:rounded-none">
        {children}
      </div>
    </div>
  );
};

export default CodeWindow;
