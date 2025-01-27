"use client"

import { useCallback, useState } from "react"
import { UploadCloud } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  onRemove?: (index: number) => void
  maxSize?: number // in bytes
  accept?: string[]
  maxFiles?: number
  className?: string
}

export function FileUpload({
  value = [],
  onChange,
  onRemove,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = [
    "image/*",
    ".pdf",
    ".txt",
    ".csv",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
  ],
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Validates a single file
  const validateFile = useCallback(
    (file: File) => {
      if (file.size > maxSize) {
        throw new Error(
          `File size should be less than ${maxSize / 1024 / 1024}MB`
        )
      }

      const fileType = file.type || ""
      const fileExtension = `.${file.name.split(".").pop()}`
      const isAccepted = accept.some(
        (type) =>
          type === fileType ||
          type === fileExtension ||
          (type.endsWith("/*") && fileType.startsWith(type.replace("/*", "")))
      )

      if (!isAccepted) {
        throw new Error(
          `Invalid file type. Supported types: ${accept.join(", ")}`
        )
      }

      return true
    },
    [accept, maxSize]
  )

  // Handle dropped or selected files
  const handleFiles = useCallback(
    (files: FileList) => {
      const newFiles = Array.from(files)
      const validFiles: File[] = []

      // Check if adding these files would exceed maxFiles
      if (value.length + newFiles.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`)
      }

      for (const file of newFiles) {
        try {
          validateFile(file)
          validFiles.push(file)
        } catch (error) {
          console.error(`Error validating file ${file.name}:`, error)
          // You might want to show an error toast here
        }
      }

      if (validFiles.length > 0) {
        onChange?.([...value, ...validFiles])
      }
    },
    [value, onChange, validateFile, maxFiles]
  )

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  // Handle file input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        handleFiles(files)
      }
      // Reset the input value so the same file can be selected again
      e.target.value = ""
    },
    [handleFiles]
  )

  // Handle file removal
  const handleRemove = useCallback(
    (index: number) => {
      onRemove?.(index)
      const newFiles = value.filter((_, i) => i !== index)
      onChange?.(newFiles)
    },
    [value, onChange, onRemove]
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors",
          dragActive && "border-primary/50 bg-muted/50",
          "hover:border-primary/50"
        )}
      >
        <Input
          type="file"
          onChange={handleChange}
          multiple
          accept={accept.join(",")}
          className="absolute inset-0 h-full cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Click to upload</span> or drag and
            drop files here
          </div>
          <div className="text-xs text-muted-foreground">
            Supported file types: images, PDF, text, Word, Excel. Max size:{" "}
            {maxSize / 1024 / 1024}MB
          </div>
        </div>
      </div>
    </div>
  )
}
