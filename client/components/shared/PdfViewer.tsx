"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onLoadError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="font-semibold text-brand-coral">Failed to load PDF.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* PDF pages */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        {loading && (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
            Loading PDF…
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={null}
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={pageNumber}
            width={700}
            renderTextLayer
            renderAnnotationLayer
            loading={null}
          />
        </Document>
      </div>

      {/* Pagination */}
      {numPages > 1 && (
        <div className="flex items-center gap-3 py-3 border-t-2 border-[#1A1A1A] w-full justify-center bg-white shrink-0">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-2 border-[#1A1A1A]"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-xs font-semibold tabular-nums">
            {pageNumber} / {numPages}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-2 border-[#1A1A1A]"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
