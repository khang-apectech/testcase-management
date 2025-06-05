"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Assignment {
  id: string
  name: string
  email: string
  total_executions: number
  total_issues: number
}

interface AssignTestersProps {
  testCaseId: string
  onAssigned?: () => void
}

export function AssignTesters({ testCaseId, onAssigned }: AssignTestersProps) {
  const { toast } = useToast()
  const { fetchWithAuth } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    setLoading(true)
    try {
      // Load users
      const usersResponse = await fetchWithAuth("/api/users")
      const usersData = await usersResponse.json()
      if (usersResponse.ok) {
        setUsers(usersData.users.filter((user: User) => user.role === "tester"))
      }

      // Load current assignments
      const assignmentsResponse = await fetchWithAuth(`/api/test-cases/${testCaseId}/assign`)
      const assignmentsData = await assignmentsResponse.json()
      if (assignmentsResponse.ok) {
        setAssignments(assignmentsData.assignments)
        setSelectedUsers(assignmentsData.assignments.map((a: Assignment) => a.id))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetchWithAuth(`/api/test-cases/${testCaseId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Testers assigned successfully",
        })
        setAssignments(data.assignments)
        setOpen(false)
        if (onAssigned) onAssigned()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to assign testers",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign testers",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Icons.users className="mr-2 h-4 w-4" />
          Phân công test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Phân công người test</DialogTitle>
          <DialogDescription>
            Chọn những người sẽ thực hiện test case này
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Đã test</TableHead>
                    <TableHead className="text-center">Lỗi phát hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const assignment = assignments.find((a) => a.id === user.id)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-center">
                          {assignment?.total_executions || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {assignment?.total_issues || 0}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Không có người test nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 