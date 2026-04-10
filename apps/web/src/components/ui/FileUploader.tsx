"use client";

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Upload, X, File, Image, Video, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { uploadFile, type StorageBucket } from "@/lib/storage";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

/* ─── Types ─────────────────────────────────────────────── */

interface FileUploadResult {
  path: string;
  publicUrl: string | null;
  fullPath: string;
  fileName: string;
  size: number;
}

interface FileUploaderProps {
  /** Which Supabase storage bucket to upload into */
  bucket: StorageBucket;
  /** Organization ID (first path segment — required for RLS) */
  orgId: string;
  /** Optional sub-folder within the org folder */
  folder?: string;
  /** Called when all files finish uploading */
  onUploadComplete?: (results: FileUploadResult[]) => void;
  /** Called on any upload error */
  onError?: (error: string) => void;
  /** Allow multiple files? Default true */
  multiple?: boolean;
  /** Max file size in bytes. Default: 10MB */
  maxSize?: number;
  /** Accepted MIME types (e.g. ["image/*", "application/pdf"]) */
  accept?: string[];
  /** Label text */
  label?: string;
  /** Compact mode — just a button instead of a drag zone */
  compact?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  result?: FileUploadResult;
}

/* ─── Helpers ───────────────────────────────────────────── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;
  if (type === "application/pdf") return FileText;
  return File;
}

/* ─── Component ─────────────────────────────────────────── */

export function FileUploader({
  bucket,
  orgId,
  folder,
  onUploadComplete,
  onError,
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  accept,
  label,
  compact = false,
  disabled = false,
}: FileUploaderProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newItems: QueuedFile[] = [];

      for (const file of fileArray) {
        // Validate size
        if (file.size > maxSize) {
          onError?.(`${file.name} exceeds ${formatSize(maxSize)} limit`);
          continue;
        }
        // Validate MIME type
        if (accept?.length) {
          const ok = accept.some((a) =>
            a.endsWith("/*")
              ? file.type.startsWith(a.replace("/*", "/"))
              : file.type === a
          );
          if (!ok) {
            onError?.(`${file.name}: unsupported file type`);
            continue;
          }
        }
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          status: "pending",
          progress: 0,
        });
      }

      if (!newItems.length) return;

      setQueue((prev) => (multiple ? [...prev, ...newItems] : newItems));

      // Start uploading
      for (const item of newItems) {
        processUpload(item);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucket, orgId, folder, maxSize, accept, multiple]
  );

  const processUpload = async (item: QueuedFile) => {
    setQueue((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 50 } : f))
    );

    try {
      const result = await uploadFile({
        bucket,
        orgId,
        folder,
        file: item.file,
      });

      const uploadResult: FileUploadResult = {
        ...result,
        fileName: item.file.name,
        size: item.file.size,
      };

      setQueue((prev) => {
        const updated = prev.map((f) =>
          f.id === item.id
            ? { ...f, status: "done" as FileStatus, progress: 100, result: uploadResult }
            : f
        );
        // Check if all done
        const allDone = updated.every((f) => f.status === "done" || f.status === "error");
        if (allDone) {
          const results = updated
            .filter((f) => f.status === "done" && f.result)
            .map((f) => f.result!);
          if (results.length) onUploadComplete?.(results);
        }
        return updated;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setQueue((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "error" as FileStatus, error: message } : f
        )
      );
      onError?.(message);
    }
  };

  const removeFile = (id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = ""; // reset so same file can be re-selected
    }
  };

  const acceptStr = accept?.join(",");

  /* ─── Compact mode ──────────────────────────────────── */
  if (compact) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={acceptStr}
          onChange={handleChange}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {label ?? "Upload"}
        </Button>
        {queue.length > 0 && (
          <div className="mt-2 space-y-1">
            {queue.map((item) => (
              <CompactFileRow key={item.id} item={item} onRemove={removeFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ─── Full drag-and-drop mode ───────────────────────── */
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={acceptStr}
        onChange={handleChange}
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={clsx(
          "relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-150",
          isDragOver
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border-default)] hover:border-[var(--border-hover)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="w-8 h-8 text-[var(--text-tertiary)]" />
        <p className="text-[13px] text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--accent)]">Click to upload</span>
          {" or drag and drop"}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          Max {formatSize(maxSize)} per file
        </p>
      </div>

      {/* File queue */}
      {queue.length > 0 && (
        <div className="mt-3 space-y-2">
          {queue.map((item) => (
            <FileRow key={item.id} item={item} onRemove={removeFile} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── File Row (full mode) ──────────────────────────────── */

function FileRow({ item, onRemove }: { item: QueuedFile; onRemove: (id: string) => void }) {
  const Icon = getFileIcon(item.file.type);

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-2.5 rounded-lg border text-[13px]",
        item.status === "error"
          ? "border-[var(--status-critical)]/30 bg-[var(--status-critical)]/5"
          : "border-[var(--border-default)] bg-[var(--surface-secondary)]"
      )}
    >
      <Icon className="w-5 h-5 shrink-0 text-[var(--text-tertiary)]" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-[var(--text-primary)]">{item.file.name}</p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {formatSize(item.file.size)}
          {item.error && (
            <span className="ml-2 text-[var(--status-critical)]">{item.error}</span>
          )}
        </p>
        {item.status === "uploading" && (
          <div className="mt-1 h-1 w-full rounded-full bg-[var(--border-default)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>
      {item.status === "done" && (
        <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--status-success)]" />
      )}
      {item.status === "error" && (
        <AlertCircle className="w-4 h-4 shrink-0 text-[var(--status-critical)]" />
      )}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="h-7 w-7 rounded-lg bg-transparent text-[var(--text-secondary)] shadow-none hover:bg-[var(--surface-tertiary)]"
        label={`Remove ${item.file.name}`}
        size="sm"
        type="button"
        variant="ghost"
      >
        <X className="w-3.5 h-3.5" />
      </IconButton>
    </div>
  );
}

/* ─── Compact File Row ──────────────────────────────────── */

function CompactFileRow({ item, onRemove }: { item: QueuedFile; onRemove: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      {item.status === "uploading" && (
        <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      )}
      {item.status === "done" && <CheckCircle2 className="w-3 h-3 text-[var(--status-success)]" />}
      {item.status === "error" && <AlertCircle className="w-3 h-3 text-[var(--status-critical)]" />}
      <span className="truncate flex-1">{item.file.name}</span>
      <IconButton
        onClick={() => onRemove(item.id)}
        className="h-5 w-5 rounded-md text-[var(--text-secondary)] shadow-none hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        label={`Remove ${item.file.name}`}
        size="sm"
        type="button"
        variant="ghost"
      >
        <X className="w-3 h-3" />
      </IconButton>
    </div>
  );
}
