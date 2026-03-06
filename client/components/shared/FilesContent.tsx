"use client";

import { useParams } from "next/navigation";
import { useFiles, useUploadFile, useDeleteFile } from "../../hooks/useFiles";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Eye,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import type { FileDoc } from "../../../shared/types";
import { FileViewerModal } from "./FileViewerModal";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return <ImageIcon size={20} className="text-brand-blue" />;
  return <FileIcon size={20} className="text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesContent() {
  const params = useParams<{ id: string }>();
  const { data: files, isLoading } = useFiles(params.id);
  const uploadFile = useUploadFile(params.id);
  const deleteFile = useDeleteFile(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingFile, setViewingFile] = useState<FileDoc | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile.mutate(file);
      e.target.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="brutal-card rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Upload */}
      <div className="flex justify-end mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadFile.isPending}
          className="brutal-button bg-brand-blue px-4 py-2 rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50 h-auto"
        >
          {uploadFile.isPending ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload size={14} />
              Upload File
            </>
          )}
        </Button>
      </div>

      {!files || files.length === 0 ? (
        <div className="brutal-card rounded-xl p-10 text-center hero-grid relative overflow-hidden">
          <div className="absolute top-0 right-4 text-[120px] leading-none opacity-[0.04] font-kanji select-none pointer-events-none">
            旅
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-peach border-2 border-brutal-border shadow-[4px_4px_0px_#1a1a1a] rounded-2xl flex items-center justify-center mb-5 rotate-3">
              <FileIcon size={30} strokeWidth={1.5} />
            </div>
            <span className="badge bg-brand-lemon mb-4 inline-flex">
              No files yet
            </span>
            <h2 className="font-display font-extrabold text-xl uppercase tracking-tight text-[#111] mb-2">
              Nothing uploaded
            </h2>
            <p className="text-muted-foreground font-body text-sm max-w-xs mx-auto">
              Upload documents, images, or receipts for your trip.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file._id}
              className="brutal-card rounded-lg p-4 flex items-center gap-4"
            >
              {getFileIcon(file.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-body truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.sizeBytes)}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setViewingFile(file)}
                className="p-1.5 text-muted-foreground hover:text-brand-blue hover:bg-transparent transition-colors size-auto h-auto"
                title="View"
                aria-label="View file"
              >
                <Eye size={14} />
              </Button>
              <a
                href={file.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Download"
              >
                <Download size={14} />
              </a>
              <Button
                variant="ghost"
                onClick={() => deleteFile.mutate(file._id)}
                disabled={deleteFile.isPending}
                className="p-1.5 text-muted-foreground hover:text-brand-coral hover:bg-transparent transition-colors size-auto h-auto"
                title="Delete"
                aria-label="Delete file"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}
