"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { formatDistanceToNow } from "date-fns"
import type { Ticket } from "@/types/tickets"
import type { Team } from "@/types/teams"
import type { Profile } from "@/types/users"
// import { Checkbox } from "@/components/ui/checkbox"

declare module "@tanstack/table-core" {
  interface TableMeta<TData> {
    teams: Team[]
    agents: Profile[]
    userId: string
  }
}

export const columns: ColumnDef<Ticket>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "new" ? "default" : "secondary"}>
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return <Badge variant="outline">{category.replace("_", " ")}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "team",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Team" />
    ),
    cell: ({ row }) =>
      row.original.team_id?.name || (
        <span className="text-muted-foreground">No team</span>
      ),
  },
  {
    accessorKey: "assignedTo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned To" />
    ),
    cell: ({ row }) =>
      row.original.assigned_to?.full_name || (
        <span className="text-muted-foreground">Unassigned</span>
      ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) =>
      formatDistanceToNow(new Date(row.getValue("created_at")), {
        addSuffix: true,
      }),
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <DataTableRowActions
        row={row}
        teams={table.options.meta?.teams || []}
        agents={table.options.meta?.agents || []}
        userId={table.options.meta?.userId || ""}
      />
    ),
  },
]
