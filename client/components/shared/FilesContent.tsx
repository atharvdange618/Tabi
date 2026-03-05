"use client";

import { useParams } from "next/navigation";
import { useFiles, useUploadFile, useDeleteFile } from "../../hooks/useFiles";
import {
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Eye,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { FileDoc } from "../../../shared/types";
import Image from "next/image";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return <ImageIcon size={20} className="text-brand-blue" />;
  if (mimeType.includes("pdf"))
    return <FileText size={20} className="text-brand-coral" />;
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
        <div className="brutal-card rounded-lg p-12 text-center">
          <h2 className="text-xl font-bold font-display mb-2">No files</h2>
          <p className="text-muted-foreground font-body">
            Upload documents, images, or receipts for your trip.
          </p>
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
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* File Viewer Dialog */}
      <Dialog
        open={!!viewingFile}
        onOpenChange={(open) => !open && setViewingFile(null)}
      >
        <DialogContent className="sm:max-w-4xl brutal-card w-[90vw] h-[80vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-display truncate pr-8">
              {viewingFile?.originalName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full mt-4 overflow-hidden rounded-md border-2 border-brutal-border relative bg-gray-50 flex items-center justify-center">
            {viewingFile?.mimeType?.startsWith("image/") ? (
              <Image
                src={viewingFile.cloudinaryUrl}
                alt={viewingFile.originalName}
                width={500}
                height={500}
                className="max-w-full max-h-full object-contain"
              />
            ) : viewingFile?.mimeType?.includes("pdf") ? (
              <iframe
                src={viewingFile.cloudinaryUrl}
                className="w-full h-full"
                title={viewingFile.originalName}
              />
            ) : (
              <div className="text-center p-8">
                <FileIcon
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <p className="font-body text-muted-foreground">
                  No preview available for this file type.
                </p>
                <a
                  href={viewingFile?.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-brand-blue hover:underline font-medium"
                >
                  <Download size={16} />
                  Download File
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
