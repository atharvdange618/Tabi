"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Download, File as FileIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { FileDoc } from "shared/types";

interface FileViewerModalProps {
  file: FileDoc | null;
  onClose: () => void;
}

export function FileViewerModal({ file, onClose }: FileViewerModalProps) {
  const isTextFile =
    !!file &&
    (file.mimeType.startsWith("text/") || file.mimeType === "application/json");

  const {
    data: textContent,
    isLoading: isLoadingText,
    isError: textError,
  } = useQuery({
    queryKey: ["fileContent", file?.cloudinaryUrl],
    queryFn: async () => {
      const res = await fetch(file!.cloudinaryUrl);
      if (!res.ok) throw new Error("Failed to fetch text content");
      return res.text();
    },
    enabled: isTextFile,
    staleTime: Infinity,
  });

  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isText = isTextFile;
  const isUnsupported = !isImage && !isText;

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl brutal-card w-[90vw] h-[80vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display truncate pr-8">
            {file.originalName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 w-full mt-4 overflow-y-auto rounded-md border-2 border-brutal-border relative bg-gray-50 flex flex-col items-center justify-start">
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <Image
                src={file.cloudinaryUrl}
                alt={file.originalName}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {isText && (
            <div className="w-full h-full p-4 overflow-y-auto bg-white">
              {isLoadingText ? (
                <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                  <Loader2 className="animate-spin" /> Loading content...
                </div>
              ) : textError ? (
                <div className="flex items-center justify-center h-full text-brand-coral font-semibold">
                  Failed to load text content.
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 wrap-break-word">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {isUnsupported && (
            <div className="flex-1 w-full flex flex-col items-center justify-center p-8 text-center">
              <FileIcon
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <p className="font-body text-muted-foreground">
                No preview available for this file type.
              </p>
              <a
                href={file.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 brutal-button bg-brand-blue text-white px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <Download size={16} />
                Download File
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
