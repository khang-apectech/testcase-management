'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, UserPlus, Mail, Phone, Search, X, Trash2, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'

interface TestersPageProps {
  params: Promise<{ project_id: string }>
}

export default function TestersPage({ params }: TestersPageProps) {
  const { fetchWithAuth, user } = useAuth()
  const { toast } = useToast()
  const [testers, setTesters] = useState<any[]>([])
  const [allTesters, setAllTesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedTesters, setSelectedTesters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  
  // Unwrap params using React.use()
  const { project_id: projectId } = use(params)
  
  useEffect(() => {
    fetchTesters()
    if (user?.role === 'admin') {
      fetchAllTesters()
    }
  }, [projectId, fetchWithAuth])

  const fetchTesters = async () => {
    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}/testers`)
      if (response.ok) {
        const data = await response.json()
        setTesters(data)
      } else {
        console.error('Failed to fetch project testers:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
      }
    } catch (error) {
      console.error('Error fetching testers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTesters = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/testers')
      if (response.ok) {
        const data = await response.json()
        // Filter only active testers (not admins)
        setAllTesters(data.filter((t: any) => t.role === 'tester' && t.status === 'active'))
      } else {
        console.error('Failed to fetch testers:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
      }
    } catch (error) {
      console.error('Error fetching all testers:', error)
    }
  }

  const handleAssignTesters = async () => {
    if (selectedTesters.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một tester",
        variant: "destructive"
      })
      return
    }

    try {
      setAssignLoading(true)
      
      const response = await fetchWithAuth(`/api/projects/${projectId}/testers`, {
        method: 'POST',
        body: JSON.stringify({ testerIds: selectedTesters })
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã phân công tester thành công"
        })
        setShowAssignDialog(false)
        setSelectedTesters([])
        fetchTesters()
      } else {
        toast({
          title: "Lỗi",
          description: responseData.error || "Không thể phân công tester",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Assign error:', error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi phân công tester",
        variant: "destructive"
      })
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveTester = async (testerId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tester này khỏi dự án?')) {
      return
    }

    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}/testers`, {
        method: 'DELETE',
        body: JSON.stringify({ testerIds: [testerId] })
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa tester khỏi dự án"
        })
        fetchTesters()
      } else {
        const error = await response.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể xóa tester",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa tester",
        variant: "destructive"
      })
    }
  }

  const availableTesters = allTesters.filter(tester => 
    // Filter out testers who are already assigned to this project
    !testers.some(assignedTester => assignedTester.id === tester.id) &&
    // Apply search filter
    (tester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     tester.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Testers</h1>
          <p className="text-muted-foreground">
            Quản lý các tester được phân công cho dự án này
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowAssignDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Phân công Tester
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {testers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold mt-4">Chưa có tester nào</h3>
                <p className="text-muted-foreground mt-2">
                  Phân công tester cho dự án này để bắt đầu testing.
                </p>
                {user?.role === 'admin' && (
                  <Button className="mt-4" onClick={() => setShowAssignDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Phân công Tester
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testers.map((tester: any) => (
              <Card key={tester.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {tester.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{tester.name}</CardTitle>
                        <CardDescription>{tester.role || 'Tester'}</CardDescription>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTester(tester.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{tester.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {tester.assigned_test_cases || 0} test cases
                      </Badge>
                      <Badge 
                        variant={tester.status === 'active' ? 'default' : 'secondary'}
                      >
                        Hoạt động
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Assign Testers Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Phân công Tester cho dự án</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm tester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {availableTesters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Không tìm thấy tester nào' : 'Tất cả tester đã được phân công'}
                </div>
              ) : (
                availableTesters.map((tester: any) => (
                  <div key={tester.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={tester.id}
                      checked={selectedTesters.includes(tester.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTesters([...selectedTesters, tester.id])
                        } else {
                          setSelectedTesters(selectedTesters.filter(id => id !== tester.id))
                        }
                      }}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {tester.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tester.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{tester.email}</p>
                    </div>
                    <Badge variant="outline">
                      {tester.projects_count || 0} dự án
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleAssignTesters}
              disabled={selectedTesters.length === 0 || assignLoading}
            >
              {assignLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang phân công...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Phân công ({selectedTesters.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}