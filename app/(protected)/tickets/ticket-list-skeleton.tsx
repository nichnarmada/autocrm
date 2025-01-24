"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TicketListSkeleton() {
  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" /> {/* "Tickets" heading */}
        <div className="flex items-center gap-4">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <Skeleton className="h-8 w-[100px]" /> {/* Tabs */}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <Skeleton className="h-8 w-[250px]" /> {/* Search input */}
            <Skeleton className="h-8 w-[100px]" /> {/* Status filter */}
            <Skeleton className="h-8 w-[100px]" /> {/* Priority filter */}
          </div>
          <Skeleton className="h-8 w-[70px]" /> {/* View options */}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[80px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[120px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[80px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" /> {/* Selected rows count */}
          <div className="flex items-center space-x-6">
            <Skeleton className="h-8 w-[100px]" /> {/* Rows per page */}
            <Skeleton className="h-8 w-[100px]" /> {/* Page count */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" /> {/* First page */}
              <Skeleton className="h-8 w-8" /> {/* Previous page */}
              <Skeleton className="h-8 w-8" /> {/* Next page */}
              <Skeleton className="h-8 w-8" /> {/* Last page */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
