"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminModal } from "@/components/admin-modal"
import { Search, Filter, Plus, Eye, Edit, Trash2, Shield, Users, UserCheck, EyeOff, Download } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface Admin {
  id: number
  full_name: string
  email: string
  password: string
  phone_number: string
  created_at: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await api.admins.getAll()
      setAdmins(response)
      setFilteredAdmins(response)
    } catch (error: any) {
      console.error("Error fetching admins:", error)
      toast.error("Adminlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  useEffect(() => {
    let filtered = admins

    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.phone_number.includes(searchTerm),
      )
    }

    setFilteredAdmins(filtered)
  }, [admins, searchTerm])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleCreateAdmin = () => {
    setSelectedAdmin(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleViewAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setModalMode("view")
    setIsModalOpen(true)
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    if (confirm(`${admin.full_name} adminni o'chirishni tasdiqlaysizmi?`)) {
      try {
        await api.admins.delete(admin.id)
        toast.success("Admin muvaffaqiyatli o'chirildi")
        fetchAdmins()
      } catch (error: any) {
        console.error("Error deleting admin:", error)
        toast.error("Adminni o'chirishda xatolik")
      }
    }
  }

  const handleModalSuccess = () => {
    fetchAdmins()
  }

  const togglePasswordVisibility = (adminId: number) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(adminId)) {
        newSet.delete(adminId)
      } else {
        newSet.add(adminId)
      }
      return newSet
    })
  }

  const generateCredentialImage = async (admin: Admin) => {
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 800
      canvas.height = 600

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#1e293b")
      gradient.addColorStop(1, "#0f172a")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(canvas.width / 2 - 100, 80, 200, 80)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("RealExam", canvas.width / 2, 130)

      ctx.fillStyle = "#e2e8f0"
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Bizni tanlaganing uchun rahmat", canvas.width / 2, 220)

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 18px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Sizning ma'lumotlaringiz:", 100, 300)

      ctx.font = "16px Arial"
      ctx.fillStyle = "#cbd5e1"
      ctx.fillText(`Email: ${admin.email}`, 100, 340)
      ctx.fillText(`Parol: ${admin.password}`, 100, 370)
      ctx.fillText(`To'liq ism: ${admin.full_name}`, 100, 400)
      ctx.fillText(`Telefon: ${admin.phone_number}`, 100, 430)

      ctx.fillStyle = "#64748b"
      ctx.font = "14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("RealExam IELTS - Admin Panel", canvas.width / 2, 520)
      ctx.fillText(new Date().toLocaleDateString("uz-UZ"), canvas.width / 2, 540)

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `admin-credentials-${admin.full_name.replace(/\s+/g, "-").toLowerCase()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success("Admin ma'lumotlari yuklab olindi")
        }
      }, "image/png")
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Rasm yaratishda xatolik")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Adminlar yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Adminlar</h1>
            <p className="text-slate-400 mt-2">Tizim adminlarini boshqaring va yangilarini qo'shing</p>
          </div>
          <Button onClick={handleCreateAdmin} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Yangi Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Adminlar</p>
                  <p className="text-xl font-bold text-white">{admins.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Faol Adminlar</p>
                  <p className="text-xl font-bold text-white">{admins.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Yangi Adminlar</p>
                  <p className="text-xl font-bold text-white">
                    {
                      admins.filter((admin) => {
                        const createdDate = new Date(admin.created_at)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return createdDate > weekAgo
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ism, email yoki telefon bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filtr
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Adminlar ro'yxati ({filteredAdmins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Admin</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Parol</TableHead>
                    <TableHead className="text-slate-300">Telefon</TableHead>
                    <TableHead className="text-slate-300">Ro'yxatdan O'tgan</TableHead>
                    <TableHead className="text-slate-300">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {getInitials(admin.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{admin.full_name}</p>
                            <p className="text-xs text-slate-400">ID: {admin.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{admin.email}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {visiblePasswords.has(admin.id) ? admin.password : "••••••••"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white p-1 h-auto"
                            onClick={() => togglePasswordVisibility(admin.id)}
                          >
                            {visiblePasswords.has(admin.id) ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{admin.phone_number}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(admin.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-400 hover:text-green-300"
                            onClick={() => generateCredentialImage(admin)}
                            title="Ma'lumotlarni yuklab olish"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleViewAdmin(admin)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleEditAdmin(admin)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteAdmin(admin)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          admin={selectedAdmin}
          mode={modalMode}
        />
      </div>
    </DashboardLayout>
  )
}
