"use client"

import { useEffect, useState } from "react"
import type { Database } from "@/types/supabase"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"

type Tables = Database["public"]["Tables"]
type Profile = Tables["profiles"]["Row"]

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <InviteUserDialog onSuccess={fetchUsers} />
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-3 pl-4 pr-3 text-left text-sm font-medium">
                Name
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-3 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-3 py-3 text-left text-sm font-medium">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="py-4 pl-4 pr-3">
                  <div className="font-medium">{user.full_name}</div>
                </td>
                <td className="px-3 py-4 text-sm">{user.email}</td>
                <td className="px-3 py-4 text-sm capitalize">{user.role}</td>
                <td className="px-3 py-4 text-sm">
                  {new Date(user.created_at!).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
