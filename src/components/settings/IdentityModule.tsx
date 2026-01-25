"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { NeoAvatar } from "@/components/ui/NeoAvatar";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import Image from "next/image";

const identitySchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

interface IdentityModuleProps {
  initialData?: {
    displayName: string;
    username: string;
    email: string;
    bio: string;
  };
  onDirtyChange?: (isDirty: boolean) => void;
}

export function IdentityModule({
  initialData,
  onDirtyChange,
}: IdentityModuleProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      displayName: initialData?.displayName || "Pilot",
      bio: initialData?.bio || "",
    },
  });

  // Notify parent of dirty state
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = async (data: IdentityFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Saving identity:", data);
    toast.success("IDENTITY MATRIX UPDATED");
    onDirtyChange?.(false); // Reset dirty state in parent if needed (react-hook-form handles internal state)
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      onDirtyChange?.(true);
    }
  };

  return (
    <section className="border-2 border-black bg-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3">
        <span className="bg-black text-white px-3 py-1 text-lg">MODULE A</span>
        ID MATRIX
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* LEFT COLUMN: AVATAR */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="relative group">
            <div className="w-48 h-48 border-4 border-black bg-neutral-100 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <NeoAvatar
                  name={initialData?.displayName}
                  className="w-full h-full text-4xl"
                />
              )}
            </div>
            {/* Overlay Button */}
            <label className="absolute bottom-4 right-4 cursor-pointer">
              <div className="bg-yellow-400 border-2 border-black px-4 py-2 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-none">
                Upload ID
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <p className="text-xs font-mono text-neutral-500 text-center md:text-left max-w-[200px]">
            RECOMMENDED: 400x400PX <br />
            FORMAT: JPG, PNG
          </p>
        </div>

        {/* RIGHT COLUMN: FIELDS */}
        <div className="md:col-span-2 space-y-6">
          {/* Display Name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">
              Display Name
            </label>
            <input
              {...register("displayName")}
              className="w-full border-2 border-black p-3 font-bold text-lg focus:outline-none focus:bg-yellow-50 focus:ring-0 placeholder:text-neutral-300"
              placeholder="ENTER DESIGNATION"
            />
            {errors.displayName && (
              <span className="text-red-600 text-xs font-bold">
                {errors.displayName.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username (Locked) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                User ID <Lock className="w-3 h-3" />
              </label>
              <div className="w-full border-2 border-neutral-200 bg-neutral-100 p-3 font-mono text-neutral-500 text-sm cursor-not-allowed select-none">
                @{initialData?.username || "unknown_pilot"}
              </div>
            </div>

            {/* Email (Locked) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                Comm Link <Lock className="w-3 h-3" />
              </label>
              <div className="w-full border-2 border-neutral-200 bg-neutral-100 p-3 font-mono text-neutral-500 text-sm cursor-not-allowed select-none truncate">
                {initialData?.email || "pilot@attendrix.com"}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">
              Mission Bio
            </label>
            <textarea
              {...register("bio")}
              rows={4}
              className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-yellow-50 focus:ring-0 resize-none placeholder:text-neutral-300"
              placeholder="ENTER BIO DATA..."
            />
            {errors.bio && (
              <span className="text-red-600 text-xs font-bold">
                {errors.bio.message}
              </span>
            )}
          </div>

          {/* Save Button (Inline for this module) */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className={cn(
                "font-black tracking-widest uppercase px-8",
                !isDirty && "opacity-50 grayscale cursor-not-allowed",
              )}
            >
              {isSubmitting ? "Saving..." : "Update Identity"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
