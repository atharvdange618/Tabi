"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { brutalBtnSm } from "./_shared";
import { useFiles, useUploadFile, useDeleteFile } from "@/hooks/useFiles";
import { FileViewerModal } from "@/components/shared/FileViewerModal";
import { formatFileSize, fileTypeLabel, toInitials } from "@/lib/helpers";
import type { FileDoc } from "shared/types";

type PopulatedFileDoc = Omit<FileDoc, "uploadedBy"> & {
  uploadedBy: { _id: string; name: string; email: string };
};

export function FilesTab({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { data: rawFiles = [], isLoading } = useFiles(tripId);
  const files = rawFiles as unknown as PopulatedFileDoc[];
  const uploadFile = useUploadFile(tripId);
  const deleteFile = useDeleteFile(tripId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewFile, setViewFile] = useState<FileDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) uploadFile.mutate(f);
    e.target.value = "";
  }

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <p className="font-display font-bold text-base">
          {files.length} {files.length === 1 ? "file" : "files"}
        </p>
        {canEdit && (
          <>
            <Button
              size="sm"
              className={cn(brutalBtnSm, "gap-1.5")}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadFile.isPending}
            >
              <Upload size={12} />
              {uploadFile.isPending ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.webp,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      {canEdit && (
        <p className="text-xs text-muted-foreground mb-4">
          JPEG, JPG, WebP, and PDF files are supported.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white border-2 border-[#1A1A1A] rounded-xl animate-pulse"
              />
            ))
          : files.map((file) => (
              <div
                key={file._id}
                onClick={() => setViewFile(file as unknown as FileDoc)}
                className="group bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150 cursor-pointer relative"
              >
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(file._id);
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center border border-red-200 hover:border-red-400 rounded bg-white"
                  >
                    <Trash2 size={11} className="text-red-500" />
                  </button>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-brand-peach border-2 border-[#1A1A1A] rounded-lg flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <Badge className="text-[10px] font-bold bg-[#e5e7eb] text-[#6B7280] border border-[#1A1A1A] px-1.5 py-0.5">
                    {fileTypeLabel(file.originalName)}
                  </Badge>
                </div>
                <p className="font-semibold text-sm truncate mb-1">
                  {file.originalName}
                </p>
                <p className="text-[11px] text-[#9CA3AF] font-medium">
                  {formatFileSize(file.sizeBytes)} ·{" "}
                  {toInitials(
                    typeof file.uploadedBy === "object"
                      ? file.uploadedBy.name
                      : undefined,
                  )}{" "}
                  · {format(new Date(file.createdAt), "MMM d")}
                </p>
              </div>
            ))}

        {canEdit && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#d1d5db] rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-[#1A1A1A] hover:bg-white transition-all group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#9CA3AF] group-hover:border-[#1A1A1A] flex items-center justify-center transition-colors">
              <Plus
                size={16}
                className="text-[#9CA3AF] group-hover:text-[#111]"
              />
            </div>
            <p className="text-xs font-semibold text-[#9CA3AF] group-hover:text-[#6B7280]">
              Upload a file
            </p>
          </button>
        )}
      </div>

      <FileViewerModal file={viewFile} onClose={() => setViewFile(null)} />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              Delete file?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7280]">
            This action cannot be undone.
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold rounded-lg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-red-500 transition-all duration-150"
              onClick={() => {
                if (deleteTarget) {
                  deleteFile.mutate(deleteTarget, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
