"use client"

import { useState, useCallback } from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { List, LayoutGrid } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { columns } from "./columns"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { CreateTicketButton } from "@/components/tickets/create-ticket-button"
import { ticketViews } from "@/constants/tickets/data"
import type { Ticket } from "@/types/tickets"
import type { Team } from "@/types/teams"
import type { Profile } from "@/types/users"

type ViewMode = "list" | "board"

interface TicketsListViewProps {
  tickets: Ticket[]
  teams: Team[]
  agents: Profile[]
  userId: string
  searchParams: { search?: string; tab?: string; view?: string }
}

export function TicketsListView({
  tickets: initialTickets,
  teams,
  agents,
  userId,
  searchParams: initialSearchParams,
}: TicketsListViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Get current view from URL or default to "all"
  const currentView = searchParams.get("view") || "all"

  const table = useReactTable({
    data: initialTickets,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    meta: {
      teams,
      agents,
      userId,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleViewChange = useCallback(
    (value: string) => {
      // Preserve existing search params except view
      const newParams = new URLSearchParams(searchParams.toString())

      // Only add view if it's not "all"
      if (value !== "all") {
        newParams.set("view", value)
      } else {
        newParams.delete("view")
      }

      const queryString = newParams.toString()
      const url = queryString ? `${pathname}?${queryString}` : pathname

      router.push(url, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const handleTabChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("tab", value)
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Tabs value={currentView} onValueChange={handleViewChange}>
            <TabsList>
              {ticketViews.map((view) => (
                <TabsTrigger
                  key={view.id}
                  value={view.id}
                  className="flex items-center gap-2"
                >
                  <view.icon className="h-4 w-4" />
                  {view.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-4">
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as ViewMode)
            }}
          >
            <TabsList>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="board">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Board
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <CreateTicketButton />
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          <DataTableToolbar table={table} />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, {
                            ...cell.getContext(),
                            teams,
                            agents,
                          })}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Board view with drag and drop coming soon...
          </p>
        </div>
      )}
    </>
  )
}
