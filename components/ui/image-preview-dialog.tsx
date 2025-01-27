"use client"

import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ImagePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl?: string
  alt?: string
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  alt = "Image preview",
}: ImagePreviewDialogProps) {
  if (!imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-left">Image Preview</DialogTitle>
          <DialogDescription className="text-left">{alt}</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video w-full">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            unoptimized // This prevents Next.js from trying to optimize the signed URL
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
