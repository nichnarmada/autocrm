"use client"

import { Button } from "@/components/ui/button"
import { FileIcon, Download, X } from "lucide-react"
import Image from "next/image"

interface AttachmentPreviewProps {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  previewUrl?: string
  canDelete?: boolean
  onDelete?: () => void
  onDownload?: () => void
  onPreview?: () => void
  formatFileSize?: (bytes: number) => string
}

export function AttachmentPreview({
  id,
  fileName,
  fileType,
  fileSize,
  previewUrl,
  canDelete,
  onDelete,
  onDownload,
  onPreview,
  formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },
}: AttachmentPreviewProps) {
  const isImage = fileType.startsWith("image/")

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/50">
      {/* Preview/Icon Container */}
      <div className="relative aspect-square">
        {isImage && previewUrl ? (
          <div
            className="relative aspect-square cursor-pointer"
            onClick={onPreview}
          >
            <Image
              src={previewUrl}
              alt={fileName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority
              unoptimized
            />
            {/* Simple hover text for image preview */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
              Preview Image
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            {fileType.includes("pdf") ? (
              <FileIcon className="h-12 w-12 text-muted-foreground" />
            ) : fileType.includes("word") ||
              fileName.endsWith(".doc") ||
              fileName.endsWith(".docx") ? (
              <FileIcon className="h-12 w-12 text-blue-500" />
            ) : fileType.includes("sheet") ||
              fileName.endsWith(".xls") ||
              fileName.endsWith(".xlsx") ? (
              <FileIcon className="h-12 w-12 text-green-500" />
            ) : (
              <FileIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Delete Button */}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
            onClick={onDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* File Info with Download Button */}
      <div className="flex items-center justify-between p-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-none"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
