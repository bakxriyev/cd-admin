"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ClientModal } from "../../../components/client-modal"
import { Search, Filter, Plus, Eye, Edit, Trash2, UserCheck, DollarSign, Users, Download, EyeOff } from "lucide-react"
import { api, type Client } from "@/lib/api"
import { toast } from "sonner"

export default function PartnersPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await api.clients.getAll()
      setClients(response)
      setFilteredClients(response)
    } catch (error: any) {
      console.error("Error fetching clients:", error)
      toast.error("Mijozlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filter clients based on search
  useEffect(() => {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone_number.includes(searchTerm),
      )
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleCreateClient = () => {
    setSelectedClient(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setModalMode("view")
    setIsModalOpen(true)
  }

  const handleDeleteClient = async (client: Client) => {
    if (confirm(`${client.full_name} mijozini o'chirishni tasdiqlaysizmi?`)) {
      try {
        await api.clients.delete(client.id.toString())
        toast.success("Mijoz muvaffaqiyatli o'chirildi")
        fetchClients()
      } catch (error: any) {
        console.error("Error deleting client:", error)
        toast.error("Mijozni o'chirishda xatolik")
      }
    }
  }

  const handleModalSuccess = () => {
    fetchClients()
  }

  const togglePasswordVisibility = (clientId: number) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const generateClientImage = async (client: Client) => {
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size
      canvas.width = 800
      canvas.height = 600

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#1e293b")
      gradient.addColorStop(1, "#0f172a")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add border
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      // RealExam logo text (since we don't have the actual logo)
      ctx.fillStyle = "#10b981"
      ctx.font = "bold 48px Arial"
      ctx.textAlign = "center"
      ctx.fillText("RealExam", canvas.width / 2, 150)

      ctx.fillStyle = "#6b7280"
      ctx.font = "24px Arial"
      ctx.fillText("IELTS", canvas.width / 2, 180)

      // Thank you message
      ctx.fillStyle = "#e2e8f0"
      ctx.font = "28px Arial"
      ctx.fillText("Bizni tanlaganing uchun rahmat!", canvas.width / 2, 250)

      // Divider line
      ctx.strokeStyle = "#475569"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(150, 300)
      ctx.lineTo(canvas.width - 150, 300)
      ctx.stroke()

      // Client credentials title
      ctx.fillStyle = "#f1f5f9"
      ctx.font = "bold 32px Arial"
      ctx.fillText("Sizning ma'lumotlaringiz:", canvas.width / 2, 360)

      // Email
      ctx.fillStyle = "#94a3b8"
      ctx.font = "20px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Email:", 200, 420)

      ctx.fillStyle = "#e2e8f0"
      ctx.font = "bold 24px Arial"
      ctx.fillText(client.email, 280, 420)

      // Password
      ctx.fillStyle = "#94a3b8"
      ctx.font = "20px Arial"
      ctx.fillText("Parol:", 200, 470)

      ctx.fillStyle = "#e2e8f0"
      ctx.font = "bold 24px Arial"
      ctx.fillText(client.password, 280, 470)

      // Footer
      ctx.fillStyle = "#64748b"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Bu ma'lumotlarni xavfsiz saqlang", canvas.width / 2, 540)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${client.full_name.replace(/\s+/g, "_")}_credentials.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success("Rasm muvaffaqiyatli yuklandi!")
        }
      }, "image/png")
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Rasm yaratishda xatolik yuz berdi")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Mijozlar yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Mijozlar</h1>
            <p className="text-slate-400 mt-2">Mijozlarni boshqaring va yangilarini qo'shing</p>
          </div>
          <Button onClick={handleCreateClient} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Yangi Mijoz
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Mijozlar</p>
                  <p className="text-xl font-bold text-white">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Balans</p>
                  <p className="text-xl font-bold text-white">
                    ${clients.reduce((sum, client) => sum + client.balance, 0).toFixed(2)}
                  </p>
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
                  <p className="text-sm text-slate-400">O'rtacha Balans</p>
                  <p className="text-xl font-bold text-white">
                    $
                    {clients.length > 0
                      ? (clients.reduce((sum, client) => sum + client.balance, 0) / clients.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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

        {/* Clients Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Mijozlar ro'yxati ({filteredClients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Mijoz</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Parol</TableHead>
                    <TableHead className="text-slate-300">Telefon</TableHead>
                    <TableHead className="text-slate-300">Balans</TableHead>
                    <TableHead className="text-slate-300">Ro'yxatdan O'tgan</TableHead>
                    <TableHead className="text-slate-300">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={client.logo || "/placeholder.svg"} />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {getInitials(client.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{client.full_name}</p>
                            <p className="text-xs text-slate-400">ID: {client.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{client.email}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {visiblePasswords.has(client.id) ? client.password : "••••••••"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white p-1 h-auto"
                            onClick={() => togglePasswordVisibility(client.id)}
                          >
                            {visiblePasswords.has(client.id) ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{client.phone_number}</TableCell>
                      <TableCell className="text-slate-300 font-medium">${client.balance.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(client.createdAt).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleEditClient(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:text-emerald-300"
                            onClick={() => generateClientImage(client)}
                            title="Ma'lumotlarni rasm sifatida yuklash"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteClient(client)}
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

        {/* Client Modal */}
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          client={selectedClient}
          mode={modalMode}
        />
      </div>
    </DashboardLayout>
  )
}
