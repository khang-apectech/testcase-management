"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "tester"
  created_at: string
  total_executions: number
  total_assigned_tests: number
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { toast } = useToast()

  // Load users on component mount
  useState(() => {
    loadUsers()
  })

  async function loadUsers() {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function addUser(formData: FormData) {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name"),
          password: formData.get("password"),
          role: formData.get("role"),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "User added successfully",
        })
        setShowAddDialog(false)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      })
    }
  }

  async function deleteUser(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        loadUsers()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search users..."
          className="max-w-[300px]"
          type="search"
        />
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Icons.add className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive an email with their login credentials.
              </DialogDescription>
            </DialogHeader>
            <form action={addUser} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email">Email</label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="name">Name</label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="password">Password</label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  className="w-full rounded-md border p-2"
                  required
                >
                  <option value="tester">Tester</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit">Add User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Tests</TableHead>
              <TableHead>Completed Tests</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.total_assigned_tests}</TableCell>
                <TableCell>{user.total_executions}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <Icons.more className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => window.location.href = `/admin/testers/${user.id}`}
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 