"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  CloudDownload,
  Search,
  Star,
  Tag,
} from "lucide-react";
import DotPatternBackground from "../ui/DotPatternBackground";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

function FileRow({
  title,
  meta,
  tag,
  offline,
}: {
  title: string;
  meta: string;
  tag: string;
  offline?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 py-2.5 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral-800">{title}</p>
          <p className="text-[10px] font-mono text-neutral-400">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 border border-black bg-yellow-100 text-[9px] font-bold uppercase">
          {tag}
        </span>
        {offline && (
          <span className="px-2 py-0.5 border border-black bg-green-100 text-[9px] font-bold uppercase">
            Offline
          </span>
        )}
      </div>
    </div>
  );
}

function StudyMaterialsMock({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      className="relative perspective-1000 group"
      initial={reduceMotion ? false : { rotateY: 4, rotateX: -4 }}
      whileHover={
        reduceMotion ? undefined : { rotateY: 0, rotateX: 0, scale: 1.02 }
      }
      transition={
        reduceMotion ? undefined : { type: "spring", stiffness: 200, damping: 20 }
      }
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        className="bg-white border-[3px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden relative z-10"
        whileHover={
          reduceMotion ? undefined : { boxShadow: "6px 6px 0px 0px #000" }
        }
        transition={reduceMotion ? undefined : { duration: 0.2 }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b-[3px] border-black bg-[#E5E7EB]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 border-2 border-black rounded-full" />
            <div className="w-3 h-3 bg-yellow-400 border-2 border-black rounded-full" />
            <div className="w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
          </div>
          <div className="flex-1 ml-4">
            <div className="bg-white border-2 border-black px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
              <Search className="w-3 h-3 text-neutral-400" />
              <span className="font-mono text-xs text-neutral-600">
                Search materials
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#fffdf5] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] text-neutral-500 uppercase">
                StudyMaterials
              </span>
              <h3 className="font-black text-sm uppercase">Course Library</h3>
            </div>
            <div className="px-2 py-0.5 bg-purple-100 border border-purple-300 flex items-center gap-1">
              <Star className="w-3 h-3 text-purple-600" />
              <span className="font-mono text-[8px] text-purple-700 uppercase">
                Favorites
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 border border-black bg-yellow-100 text-[9px] font-bold uppercase flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </span>
            <span className="px-2 py-1 border border-black bg-green-100 text-[9px] font-bold uppercase flex items-center gap-1">
              <CloudDownload className="w-3 h-3" /> Offline Cache
            </span>
            <span className="px-2 py-1 border border-black bg-blue-100 text-[9px] font-bold uppercase flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Drive Linked
            </span>
          </div>

          <div className="bg-white border-2 border-black p-3 space-y-1.5">
            <FileRow
              title="Thermo Notes"
              meta="PDF • 18 pages"
              tag="Module 2"
              offline
            />
            <FileRow
              title="Signals Slides"
              meta="PPT • 42 slides"
              tag="Lecture"
            />
            <FileRow
              title="Lab Manual"
              meta="DOC • 12 pages"
              tag="Lab"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase text-neutral-500">
              <Check className="w-3 h-3 text-green-600" />
              Cached for offline use
            </div>
            <button className="text-[10px] font-mono font-bold uppercase text-black flex items-center gap-1">
              Open Library <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -top-6 -right-6 w-12 h-12 border-4 border-black bg-white flex items-center justify-center z-20 shadow-[4px_4px_0px_0px_#000]"
        animate={
          reduceMotion ? undefined : { y: [0, -10, 0], rotate: [0, 5, 0] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <Tag className="w-6 h-6 text-black" />
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-8 w-20 h-8 bg-[#FFD02F] border-2 border-black z-20 flex items-center justify-center shadow-[4px_4px_0px_0px_#000]"
        animate={
          reduceMotion ? undefined : { x: [0, 5, 0], rotate: [0, -3, 0] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 4, repeat: Infinity, delay: 1, ease: "easeInOut" }
        }
      >
        <span className="font-mono text-[10px] font-bold">OFFLINE</span>
      </motion.div>
    </motion.div>
  );
}

export default function StudyMaterialsSpotlight() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <>
      <section
        id="study-materials"
        className="relative py-20 md:py-32 px-4 overflow-hidden"
      >
        <DotPatternBackground />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "visible"}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              className="order-2 lg:order-1"
              variants={reduceMotion ? undefined : itemVariants}
            >
              <div className="inline-flex items-center gap-2 bg-[#FFD02F] text-black px-4 py-1.5 border-2 border-black mb-6 shadow-[3px_3px_0_#000]">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  StudyMaterials
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black mb-6 leading-[0.95]">
                Study Materials,
                <br />
                <span className="text-[#FFD02F] bg-black px-2 py-1 inline-block mt-2">
                  Built-In
                </span>
              </h2>

              <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-4 text-neutral-800">
                Tags, Favorites, Offline Cache
              </h3>

              <div className="text-lg text-neutral-600 font-medium mb-8 max-w-lg leading-relaxed space-y-4">
                <p>
                  Drive-backed course folders with quick tags, favorites,
                  offline cache, and focus mode. Full suite on Web, lighter
                  access on APK.
                </p>

                <ul className="space-y-2 mt-4 ml-1">
                  <li className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-700">
                    <div className="w-4 h-4 bg-black flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    Tags, pinned sections, and quick search
                  </li>
                  <li className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-700">
                    <div className="w-4 h-4 bg-black flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    Offline cache controls (Web)
                  </li>
                  <li className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-700">
                    <div className="w-4 h-4 bg-black flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    Lumen reads your course PDFs
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-black text-[#FFD02F] border-[3px] border-black font-bold uppercase tracking-wider shadow-[6px_6px_0px_0px_#FFD02F] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#FFD02F]"
                >
                  Open StudyMaterials
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2"
              variants={reduceMotion ? undefined : itemVariants}
            >
              <StudyMaterialsMock reduceMotion={reduceMotion} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        id="academic-management"
        className="relative py-20 md:py-24 px-4 overflow-hidden"
      >
        <DotPatternBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 border-2 border-black mb-6 shadow-[3px_3px_0_#FFD02F]">
                <ClipboardList className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  Beyond Attendance
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black mb-4">
                Assignments. Exams. Next Up.
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 font-medium leading-relaxed max-w-xl">
                Attendrix doesn’t stop at attendance. Manage your assignments
                and exams, see what’s due next, and stay on track with a full
                academic command center.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">
                    Next Exam
                  </span>
                </div>
                <p className="text-lg font-black uppercase">Signals & Systems</p>
                <p className="text-xs font-mono text-neutral-500 uppercase">
                  Fri · 9:00 AM · LH-2
                </p>
              </div>
              <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">
                    Next Assignment
                  </span>
                </div>
                <p className="text-lg font-black uppercase">Thermo Lab Report</p>
                <p className="text-xs font-mono text-neutral-500 uppercase">
                  Due · Tuesday · 11:59 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
