"use client";

import { useState } from "react";
import { NeoBrutalButton } from "@/components/ui/NeoBrutalButton";
import { Card, cardVariants } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { getCourseBadge, parseCourseType } from "@/lib/onboarding/course-utils";
import type { CourseRecord } from "@/types/supabase-academic";
import { motion, MotionConfig } from "framer-motion";
import {
  BookOpen,
  FlaskConical,
  CheckCircle2,
  Circle,
  Search,
} from "lucide-react";

interface CourseGroup {
  category: string;
  courses: CourseRecord[];
}

interface Props {
  coreCourses: CourseRecord[];
  labGroups: CourseGroup[];
  electiveGroups: CourseGroup[];
  labSelections: Record<string, string>;
  electiveSelections: Record<string, string>;
  skipElectives: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectLab: (category: string, courseID: string) => void;
  onSelectElective: (category: string, courseID: string) => void;
  onToggleSkipElectives: (value: boolean) => void;
  onBack: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
  canComplete: boolean;
}

export default function OnboardingStepCourses({
  coreCourses,
  labGroups,
  electiveGroups,
  labSelections,
  electiveSelections,
  skipElectives,
  isLoading,
  isError,
  onRetry,
  onSelectLab,
  onSelectElective,
  onToggleSkipElectives,
  onBack,
  onComplete,
  isSubmitting,
  canComplete,
}: Props) {
  const [activeLabDialog, setActiveLabDialog] = useState<string | null>(null);
  const [activeElectiveDialog, setActiveElectiveDialog] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getDialogCourses = (category: string, isLab: boolean) => {
    const groups = isLab ? labGroups : electiveGroups;
    const group = groups.find((g) => g.category === category);
    if (!group) return [];

    if (!searchTerm) return group.courses;

    return group.courses.filter(
      (course) =>
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseID.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-1"
        >
          <h2 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black text-balance">
            Course Selection
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-50 border-2 border-black p-2">
            Core courses are already assigned. Select your lab sections and
            electives below
          </p>
        </motion.div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={`course-loading-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="h-12 border-2 sm:border-3 border-black bg-gradient-to-r from-neutral-100 to-neutral-200 animate-pulse shadow-[2px_2px_0_#0a0a0a] sm:shadow-[3px_3px_0_#0a0a0a]"
              />
            ))}
          </div>
        )}

        {isError && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="border-4 border-black bg-red-50 shadow-[8px_8px_0_#0a0a0a] p-6 flex items-center justify-between"
          >
            <p className="text-base font-black text-red-600 uppercase">
              ⚠️ Unable to load courses
            </p>
            <NeoBrutalButton
              variant="primary"
              onClick={onRetry}
              size="sm"
              className="touch-manipulation"
            >
              Retry
            </NeoBrutalButton>
          </motion.div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-3 sm:space-y-4">
            {/* Core Courses Section */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                  aria-hidden="true"
                />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black text-balance">
                  Core Courses
                </h3>
                <Badge
                  variant="dark"
                  size="default"
                  className="text-[10px] sm:text-xs"
                >
                  {coreCourses.length} Required
                </Badge>
              </div>

              {coreCourses.length === 0 ? (
                <div className="border-4 border-black bg-neutral-50 p-3 text-center shadow-[4px_4px_0_#0a0a0a]">
                  <p className="text-sm font-bold text-neutral-500">
                    Core courses not configured for this batch yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {coreCourses.map((course, idx) => (
                    <motion.div
                      key={course.courseID}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                      <Card
                        variant="default"
                        padding="none"
                        className="relative overflow-hidden group p-3 hover:shadow-[8px_8px_0_#0a0a0a] transition-shadow duration-300"
                      >
                        <div className="absolute top-0 right-0 w-10 h-10 bg-green-400 transform rotate-45 translate-x-5 -translate-y-5 border-2 border-black" />
                        <div className="flex items-start justify-between gap-4 relative">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-black uppercase tracking-wide text-black mb-1 truncate">
                              {course.courseName}
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-neutral-600">
                              {course.courseID}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            🔒 LOCKED
                          </Badge>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Lab Slots Section */}
            {labGroups.length > 0 && (
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                    aria-hidden="true"
                  />
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black text-balance">
                    Lab Slots
                  </h3>
                  <Badge variant="rose" size="default" className="text-[10px]">
                    Required
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {labGroups.map((group, idx) => {
                    const selectedCourse = group.courses.find(
                      (c) => labSelections[group.category] === c.courseID,
                    );
                    const isSelected = !!selectedCourse;

                    return (
                      <motion.div
                        key={group.category}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                      >
                        <button
                          type="button"
                          className={cn(
                            cardVariants({
                              variant: isSelected ? "yellow" : "default",
                              padding: "none",
                            }),
                            "relative cursor-pointer p-3 text-left transition-shadow duration-300 hover:shadow-[10px_10px_0_#0a0a0a] focus-visible:shadow-[10px_10px_0_#0a0a0a] focus-visible:outline-none touch-manipulation",
                            isSelected && "shadow-[8px_8px_0_#0a0a0a]",
                          )}
                          onClick={() => setActiveLabDialog(group.category)}
                          aria-haspopup="dialog"
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 bg-green-400 border-2 border-black p-1.5 shadow-[3px_3px_0_#0a0a0a]"
                            >
                              <CheckCircle2
                                className="w-4 h-4 text-white"
                                aria-hidden="true"
                              />
                            </motion.div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="dark" size="default">
                                {group.category}
                              </Badge>
                              <span className="text-[10px] sm:text-xs font-black text-neutral-500">
                                {group.courses.length} options
                              </span>
                            </div>

                            {isSelected ? (
                              <div>
                                <p className="text-xs sm:text-sm font-black uppercase text-black truncate">
                                  {selectedCourse.courseName}
                                </p>
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-600">
                                  {selectedCourse.courseID}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <Circle
                                  className="w-6 h-6 mx-auto text-neutral-400 mb-1"
                                  aria-hidden="true"
                                />
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
                                  Click to select
                                </p>
                              </div>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Electives Section */}
            {electiveGroups.length > 0 && (
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen
                      className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
                      aria-hidden="true"
                    />
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black text-balance">
                      Electives
                    </h3>
                    <Badge
                      variant="main"
                      size="default"
                      className="text-[10px]"
                    >
                      Optional
                    </Badge>
                  </div>

                  <label className="flex items-center gap-2 border-2 border-black px-3 py-1.5 bg-white hover:bg-yellow-100 transition-colors shadow-[3px_3px_0_#0a0a0a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipElectives}
                      onChange={(event) =>
                        onToggleSkipElectives(event.target.checked)
                      }
                      className="w-4 h-4 border-2 border-black accent-yellow-400"
                    />
                    <span className="text-[10px] sm:text-xs font-black uppercase">
                      Skip for now
                    </span>
                  </label>
                </div>

                {!skipElectives && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {electiveGroups.map((group, idx) => {
                      const selectedCourse = group.courses.find(
                        (c) =>
                          electiveSelections[group.category] === c.courseID,
                      );
                      const isSelected = !!selectedCourse;

                      return (
                        <motion.div
                          key={group.category}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                        >
                          <button
                            type="button"
                            className={cn(
                              cardVariants({
                                variant: isSelected ? "yellow" : "ghost",
                                padding: "none",
                              }),
                              "relative cursor-pointer p-3 text-left transition-shadow duration-300 hover:shadow-[10px_10px_0_#0a0a0a] hover:border-solid focus-visible:shadow-[10px_10px_0_#0a0a0a] focus-visible:outline-none touch-manipulation",
                              isSelected && "shadow-[8px_8px_0_#0a0a0a]",
                            )}
                            onClick={() =>
                              setActiveElectiveDialog(group.category)
                            }
                            aria-haspopup="dialog"
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 bg-purple-400 border-2 border-black p-1.5 shadow-[3px_3px_0_#0a0a0a]"
                              >
                                <CheckCircle2
                                  className="w-4 h-4 text-white"
                                  aria-hidden="true"
                                />
                              </motion.div>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="default" size="default">
                                  {group.category}
                                </Badge>
                                <span className="text-[10px] sm:text-xs font-black text-neutral-500">
                                  {group.courses.length} options
                                </span>
                              </div>

                              {isSelected ? (
                                <div>
                                  <p className="text-xs sm:text-sm font-black uppercase text-black truncate">
                                    {selectedCourse.courseName}
                                  </p>
                                  <p className="text-[10px] sm:text-xs font-bold text-neutral-600">
                                    {selectedCourse.courseID}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <Circle
                                    className="w-6 h-6 mx-auto text-neutral-400 mb-1"
                                    aria-hidden="true"
                                  />
                                  <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
                                    Click to select
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.section>
            )}
          </div>
        )}

        {/* Lab Selection Dialog */}
        <Dialog
          open={!!activeLabDialog}
          onOpenChange={(open) => !open && setActiveLabDialog(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-balance">
                <FlaskConical className="w-8 h-8" aria-hidden="true" />
                Select Lab: {activeLabDialog}
              </DialogTitle>
              <DialogDescription>
                Choose one lab slot from the options below
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  name="course_search"
                  placeholder="Search courses (e.g. ME2211)…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search courses"
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 border-4 border-black font-bold text-black placeholder:text-neutral-400 focus-visible:outline-none focus-visible:shadow-[6px_6px_0_#0a0a0a] transition-shadow transition-colors"
                />
              </div>

              {/* Course List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {activeLabDialog &&
                  getDialogCourses(activeLabDialog, true).map((course) => {
                    const selected =
                      labSelections[activeLabDialog] === course.courseID;
                    const badge = getCourseBadge(course);

                    return (
                      <motion.label
                        key={course.courseID}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "relative cursor-pointer border-4 border-black p-4 transition-transform duration-200",
                          selected
                            ? "bg-blue-400 shadow-[6px_6px_0_#0a0a0a]"
                            : "bg-white hover:shadow-[4px_4px_0_#0a0a0a] hover:-translate-y-0.5",
                        )}
                        onClick={() => {
                          onSelectLab(activeLabDialog, course.courseID);
                          setActiveLabDialog(null);
                          setSearchTerm("");
                        }}
                      >
                        {selected && (
                          <div className="absolute -top-2 -right-2 bg-green-400 border-2 border-black p-1 shadow-[2px_2px_0_#0a0a0a]">
                            <CheckCircle2
                              className="w-4 h-4 text-white"
                              aria-hidden="true"
                            />
                          </div>
                        )}

                        <input
                          type="radio"
                          name={`lab-dialog-${activeLabDialog}`}
                          checked={selected}
                          onChange={() => {}}
                          className="sr-only"
                        />

                        <div className="space-y-2">
                          <p className="text-sm font-black uppercase tracking-wide text-black break-words">
                            {course.courseName}
                          </p>
                          <p className="text-xs font-bold text-black/70">
                            {course.courseID}
                          </p>
                          {course.course_faculty && (
                            <p className="text-xs font-bold text-black/60">
                              👤 {course.course_faculty}
                            </p>
                          )}
                          {badge && (
                            <Badge
                              variant="dark"
                              size="default"
                              className="mt-2"
                            >
                              {badge}
                            </Badge>
                          )}
                        </div>
                      </motion.label>
                    );
                  })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Elective Selection Dialog */}
        <Dialog
          open={!!activeElectiveDialog}
          onOpenChange={(open) => !open && setActiveElectiveDialog(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-balance">
                <BookOpen className="w-8 h-8" aria-hidden="true" />
                Select Elective: {activeElectiveDialog}
              </DialogTitle>
              <DialogDescription>
                Choose one elective course from the options below
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  name="course_search"
                  placeholder="Search courses (e.g. ME2211)…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search courses"
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 border-4 border-black font-bold text-black placeholder:text-neutral-400 focus-visible:outline-none focus-visible:shadow-[6px_6px_0_#0a0a0a] transition-all duration-200"
                />
              </div>

              {/* Course List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeElectiveDialog &&
                  getDialogCourses(activeElectiveDialog, false).map(
                    (course) => {
                      const selected =
                        electiveSelections[activeElectiveDialog] ===
                        course.courseID;
                      const badge = getCourseBadge(course);
                      const meta = parseCourseType(course.courseType);

                      return (
                        <motion.label
                          key={course.courseID}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            "relative cursor-pointer border-4 border-black p-4 transition-shadow transition-transform duration-200",
                            selected
                              ? "bg-purple-400 shadow-[6px_6px_0_#0a0a0a]"
                              : "bg-white hover:shadow-[4px_4px_0_#0a0a0a] hover:-translate-y-0.5",
                          )}
                          onClick={() => {
                            onSelectElective(
                              activeElectiveDialog,
                              course.courseID,
                            );
                            setActiveElectiveDialog(null);
                            setSearchTerm("");
                          }}
                        >
                          {selected && (
                            <div className="absolute -top-2 -right-2 bg-green-400 border-2 border-black p-1 shadow-[2px_2px_0_#0a0a0a]">
                              <CheckCircle2
                                className="w-4 h-4 text-white"
                                aria-hidden="true"
                              />
                            </div>
                          )}

                          <input
                            type="radio"
                            name={`elective-dialog-${activeElectiveDialog}`}
                            checked={selected}
                            onChange={() => {}}
                            className="sr-only"
                          />

                          <div className="space-y-2">
                            <p className="text-sm font-black uppercase tracking-wide text-black break-words">
                              {course.courseName}
                            </p>
                            <p className="text-xs font-bold text-black/70">
                              {course.courseID}
                            </p>
                            {meta.isLab && (
                              <Badge variant="dark" size="default">
                                🧪 LAB
                              </Badge>
                            )}
                            {badge && (
                              <Badge
                                variant="outline"
                                size="default"
                                className="mt-2"
                              >
                                {badge}
                              </Badge>
                            )}
                          </div>
                        </motion.label>
                      );
                    },
                  )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t-3 border-black mt-4"
        >
          <NeoBrutalButton
            variant="outline"
            onClick={onBack}
            size="md"
            className="w-full sm:w-auto min-w-35 touch-manipulation"
          >
            ← Back
          </NeoBrutalButton>
          <NeoBrutalButton
            variant="primary"
            onClick={onComplete}
            disabled={!canComplete || isSubmitting}
            size="md"
            className="w-full sm:w-auto min-w-50 touch-manipulation"
          >
            {isSubmitting ? "Finalizing…" : "Finish Onboarding →"}
          </NeoBrutalButton>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
