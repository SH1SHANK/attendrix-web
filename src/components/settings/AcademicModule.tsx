"use client";

import React from "react";
import { FileWarning } from "lucide-react";
import { toast } from "sonner";

// Mock Data (would usually come from props)
const ACADEMIC_DATA = {
  batchID: "ME0204",
  semester: "04",
  courses: ["ME201", "ME242", "MA202", "HS201"],
  status: "ACTIVE_SCHOLAR",
};

export function AcademicModule() {
  const handleRequestChange = () => {
    // Placeholder actions
    toast.info("SUPPORT TICKET CREATED: #REQ-9921");
    window.location.href =
      "mailto:registrar@attendrix.edu?subject=Academic%20Record%20Change%20Request";
  };

  return (
    <section className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      {/* Module Header */}
      <div className="p-6 md:p-8 pb-0 flex items-center justify-between z-10 relative">
        <h2 className="text-2xl font-black uppercase flex items-center gap-3">
          <span className="bg-black text-white px-3 py-1 text-lg">
            MODULE B
          </span>
          ACADEMIC RECORD
        </h2>
        <div className="hidden md:flex items-center gap-2 border border-black bg-neutral-100 px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-neutral-500">
            READ ONLY
          </span>
        </div>
      </div>

      {/* Striped Background Pattern (CSS-based) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
          backgroundSize: "10px 10px",
        }}
      />

      <div className="p-6 md:p-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Batch Badge */}
          <div className="border-2 border-neutral-300 bg-neutral-50 p-4 flex flex-col justify-between h-32 md:h-auto">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Global Batch ID
            </span>
            <span className="text-4xl md:text-5xl font-black text-neutral-800 font-mono tracking-tighter">
              {ACADEMIC_DATA.batchID}
            </span>
          </div>

          {/* Semester & Status */}
          <div className="flex flex-col gap-6">
            <div className="flex-1 border-2 border-neutral-300 bg-neutral-50 p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Sem
              </span>
              <span className="text-3xl font-black text-neutral-800 font-mono">
                {ACADEMIC_DATA.semester}
              </span>
            </div>
            <div className="flex-1 border-2 border-neutral-300 bg-neutral-50 p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Status
              </span>
              <span className="text-sm font-black text-green-700 uppercase bg-green-100 px-2 py-1 border border-green-200">
                {ACADEMIC_DATA.status}
              </span>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="border-2 border-neutral-300 bg-neutral-50 p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Enrolled Modules
            </span>
            <div className="flex flex-wrap gap-2 content-start">
              {ACADEMIC_DATA.courses.map((course) => (
                <span
                  key={course}
                  className="font-mono text-xs font-bold bg-white border border-neutral-300 px-2 py-1 shadow-sm"
                >
                  {course}
                </span>
              ))}
              <span className="font-mono text-xs font-bold text-neutral-400 px-2 py-1">
                +2 Labs
              </span>
            </div>
          </div>
        </div>

        {/* Request Change Button */}
        <button
          onClick={handleRequestChange}
          className="mt-8 w-full group relative overflow-hidden bg-neutral-100 border-2 border-dashed border-neutral-400 p-4 flex items-center justify-center gap-3 text-neutral-600 transition-all hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-800"
        >
          <FileWarning className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-sm">
            Request Transfer / Curriculum Change
          </span>
          <div className="absolute inset-0 bg-yellow-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </section>
  );
}
