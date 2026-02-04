import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type BaseFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

type InputProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = BaseFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

type FileUploaderProps = BaseFieldProps & {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
};

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="text-xs font-black uppercase text-neutral-600"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-label={label}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          "w-full border-[3px] border-black bg-white px-4 py-3 text-sm font-bold shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:ring-4 focus:ring-black/20",
          error ? "border-red-500" : "",
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-[11px] font-bold text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="text-xs font-black uppercase text-neutral-600"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        aria-label={label}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          "min-h-[120px] w-full border-[3px] border-black bg-white px-4 py-3 text-sm font-bold shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:ring-4 focus:ring-black/20",
          error ? "border-red-500" : "",
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-[11px] font-bold text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FileUploader({
  label,
  hint,
  error,
  files,
  onFilesChange,
  accept,
  multiple = true,
  className,
}: FileUploaderProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="text-xs font-black uppercase text-neutral-600"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        multiple={multiple}
        accept={accept}
        aria-label={label}
        aria-describedby={describedBy}
        className="w-full border-[3px] border-black bg-white px-4 py-3 text-sm font-bold shadow-[4px_4px_0px_0px_#000] file:mr-4 file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-white"
        onChange={(event) => {
          const list = Array.from(event.target.files ?? []);
          onFilesChange(list);
        }}
      />
      {files.length > 0 && (
        <ul className="space-y-1 text-[11px] font-bold text-neutral-600">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`}>
              {file.name} • {(file.size / 1024).toFixed(1)} KB
            </li>
          ))}
        </ul>
      )}
      {hint && (
        <p id={hintId} className="text-[11px] font-bold text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
