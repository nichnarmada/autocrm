"use client"

import { Row } from "@tanstack/react-table"
import { Maximize2, Trash, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { User } from "./columns"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataTableRowActionsProps {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            // onClick={handleView}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="sr-only">View user details</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View User</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            // onClick={() => setShowEditDialog(true)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit user</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit User</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            // onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete user</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete User</TooltipContent>
      </Tooltip>
    </div>
  )
}
