"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Plus, Eye, Calendar, Users, Clock, FileText } from 'lucide-react'
import { api, type Exam, secureStorage, USER_TYPE_KEY } from "@/lib/api"
import { CreateExamModal } from "@/components/create-exam-modal"

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [userType, setUserType] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const type = secureStorage.getItem(USER_TYPE_KEY)
    if (type) {
      setUserType(type)
    }
  }, [])

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await api.exams.getAll()
        setExams(response)
        setFilteredExams(response)
      } catch (error: any) {
        console.error("Failed to fetch exams:", error)
        setError("Imtihonlarni yuklashda xatolik yuz berdi")
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  // Filter exams based on search and filters
  useEffect(() => {
    let filtered = exams

    if (searchTerm) {
      filtered = filtered.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exam.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((exam) => exam.exam_type === typeFilter)
    }

    setFilteredExams(filtered)
  }, [exams, searchTerm, typeFilter])

  const handleExamCreated = (newExam: Exam) => {
    setExams((prev) => [...prev, newExam])
    setIsCreateModalOpen(false)
  }

  const handleExamClick = (exam: Exam) => {
    router.push(`/dashboard/exams/${exam.id}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Imtihonlar yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error}</div>
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
            <h1 className="text-3xl font-bold text-white">Imtihonlar</h1>
            <p className="text-slate-400 mt-2">
              {userType === "client"
                ? "Mavjud imtihonlarni ko'ring"
                : "Barcha imtihonlarni boshqaring va yangilarini yarating"}
            </p>
          </div>
          {userType !== "client" && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Yangi Imtihon
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Imtihonlar</p>
                  <p className="text-xl font-bold text-white">{exams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">IELTS Imtihonlari</p>
                  <p className="text-xl font-bold text-white">
                    {exams.filter((exam) => exam.exam_type === "IELTS").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">TOEFL Imtihonlari</p>
                  <p className="text-xl font-bold text-white">
                    {exams.filter((exam) => exam.exam_type === "TOEFL").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">O'rtacha Vaqt</p>
                  <p className="text-xl font-bold text-white">
                    {exams.length > 0
                      ? Math.round(exams.reduce((sum, exam) => sum + exam.duration, 0) / exams.length)
                      : 0}{" "}
                    min
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
                    placeholder="Imtihon nomi bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Tur bo'yicha" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="IELTS">IELTS</SelectItem>
                  <SelectItem value="TOEFL">TOEFL</SelectItem>
                  <SelectItem value="PTE">PTE</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filtr
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exams Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Imtihonlar ro'yxati ({filteredExams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-300">Nomi</TableHead>
                    <TableHead className="text-slate-300">Turi</TableHead>
                    <TableHead className="text-slate-300">Tavsif</TableHead>
                    <TableHead className="text-slate-300">Vaqt</TableHead>
                    <TableHead className="text-slate-300">Yaratilgan</TableHead>
                    <TableHead className="text-slate-300">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => (
                    <TableRow
                      key={exam.id}
                      className="border-slate-700 hover:bg-slate-700/30 cursor-pointer"
                      onClick={() => handleExamClick(exam)}
                    >
                      <TableCell className="text-slate-300 font-mono text-sm">{exam.id}</TableCell>
                      <TableCell className="text-white font-medium">{exam.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {exam.exam_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">{exam.description}</TableCell>
                      <TableCell className="text-slate-300">{exam.duration} min</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(exam.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {userType !== "client" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-white"
                              onClick={() => handleExamClick(exam)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {userType !== "client" && (
          <CreateExamModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onExamCreated={handleExamCreated}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
