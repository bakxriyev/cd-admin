"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Eye,
  Download,
  FileText,
  Trophy,
  Clock,
  Target,
  CalendarIcon,
  Calculator,
  Filter,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react"
import { api, type Result, type Exam, secureStorage, USER_DATA_KEY, USER_TYPE_KEY } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ExamResultWithDetails extends Result {
  exam?: {
    id: string
    title: string
    exam_type: string
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResultWithDetails[]>([])
  const [filteredResults, setFilteredResults] = useState<ExamResultWithDetails[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [examTypeFilter, setExamTypeFilter] = useState("all")
  const [examFilter, setExamFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedResult, setSelectedResult] = useState<ExamResultWithDetails | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [locationFilter, setLocationFilter] = useState("REI")
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [userType, setUserType] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [currentUserLocation, setCurrentUserLocation] = useState<string>("")

  const [detailedAnswers, setDetailedAnswers] = useState<any>(null)
  const [answersLoading, setAnswersLoading] = useState(false)
  const [detailedAnswersModalOpen, setDetailedAnswersModalOpen] = useState(false)
  const [selectedResultForAnswers, setSelectedResultForAnswers] = useState<ExamResultWithDetails | null>(null)

  const handleViewDetail = async (result: ExamResultWithDetails) => {
    setSelectedResult(result)
    setDetailModalOpen(true)
  }

  const handleViewAnswers = async (result: ExamResultWithDetails) => {
    setSelectedResultForAnswers(result)
    setAnswersLoading(true)

    try {
      const answers = await api.results.getAnswers(result.user_id, result.exam_id)
      console.log("[v0] Fetched answers:", answers)
      setDetailedAnswers(answers)
    } catch (error) {
      console.error("[v0] Failed to fetch answers:", error)
      setDetailedAnswers(null)
    } finally {
      setAnswersLoading(false)
    }

    setDetailedAnswersModalOpen(true)
  }

  useEffect(() => {
    const type = secureStorage.getItem(USER_TYPE_KEY)
    const userData = secureStorage.getItem(USER_DATA_KEY)

    if (type) {
      setUserType(type)
      if (type === "admin") {
        const user = JSON.parse(userData || "{}")
        setUserRole(user.role || "admin")
      } else if (type === "client") {
        const client = JSON.parse(userData || "{}")
        setCurrentUserLocation(client.location || "")
        setLocationFilter(client.location || "REI")
      }
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")

    try {
      const [resultsResponse, examsResponse] = await Promise.all([api.results.getAll(), api.exams.getAll()])
      setResults(resultsResponse)
      setFilteredResults(resultsResponse)
      setExams(examsResponse)

      const locations = new Set<string>()
      resultsResponse.forEach((result) => {
        if (result.user_id) {
          const match = result.user_id.match(/^([A-Z]+)/)
          if (match) {
            locations.add(match[1])
          }
        }
      })
      setAvailableLocations(Array.from(locations).sort())
    } catch (error: any) {
      console.error("Failed to fetch data:", error)
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateAll = async () => {
    try {
      setCalculating(true)
      await api.results.recalculateAll()
      await fetchData()
    } catch (error) {
      console.error("Failed to recalculate results:", error)
      setError("Natijalarni qayta hisoblashda xatolik yuz berdi")
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    let filtered = results

    if (userType === "client" && currentUserLocation) {
      filtered = filtered.filter((result) => result.user_id && result.user_id.startsWith(currentUserLocation))
    } else if (userType === "admin" && locationFilter !== "all") {
      filtered = filtered.filter((result) => result.user_id && result.user_id.startsWith(locationFilter))
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.user_id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.exam?.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (examTypeFilter !== "all") {
      filtered = filtered.filter((result) => result.exam?.exam_type === examTypeFilter)
    }

    if (examFilter !== "all") {
      filtered = filtered.filter((result) => result.exam_id === examFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter((result) => new Date(result.taken_at) >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter((result) => new Date(result.taken_at) <= dateTo)
    }

    setFilteredResults(filtered)
  }, [results, searchTerm, examTypeFilter, examFilter, dateFrom, dateTo, locationFilter, userType, currentUserLocation])

  const exportToExcel = () => {
    const headers = [
      "User ID",
      "Listening Band",
      "Reading Band",
      "Writing Part 1",
      "Writing Part 2",
      "Writing Band",
      "Speaking",
      "Overall Band",
      "Sana",
    ]

    const rows = filteredResults.map((result) => [
      result.user_id,
      result.listening_band_score?.toFixed(1) || "0.0",
      result.reading_band_score?.toFixed(1) || "0.0",
      result.writing_part1_score?.toFixed(1) || "N/A",
      result.writing_part2_score?.toFixed(1) || "N/A",
      result.writing_band_score?.toFixed(1) || "N/A",
      result.speaking_score?.toFixed(1) || "N/A",
      result.overall_band_score?.toFixed(1) || "N/A",
      new Date(result.taken_at).toLocaleDateString("uz-UZ"),
    ])

    let csvContent = headers.join(",") + "\n"
    rows.forEach((row) => {
      csvContent += row.join(",") + "\n"
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `ielts-results-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IELTS Results Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>IELTS Results Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Results: ${filteredResults.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2">USER ID</th>
                <th rowspan="2">LISTENING</th>
                <th rowspan="2">READING</th>
                <th colspan="3">WRITING</th>
                <th rowspan="2">SPEAKING</th>
                <th rowspan="2">OVERALL</th>
                <th rowspan="2">DATE</th>
              </tr>
              <tr>
                <th>Part 1</th>
                <th>Part 2</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              ${filteredResults
                .map((result) => {
                  return `
                  <tr>
                    <td><strong>${result.user_id}</strong></td>
                    <td>${result.listening_band_score?.toFixed(1) || "0.0"}</td>
                    <td>${result.reading_band_score?.toFixed(1) || "0.0"}</td>
                    <td>${result.writing_part1_score?.toFixed(1) || "N/A"}</td>
                    <td>${result.writing_part2_score?.toFixed(1) || "N/A"}</td>
                    <td>${result.writing_band_score?.toFixed(1) || "N/A"}</td>
                    <td>${result.speaking_score?.toFixed(1) || "N/A"}</td>
                    <td><strong>${result.overall_band_score?.toFixed(1) || "N/A"}</strong></td>
                    <td>${new Date(result.taken_at).toLocaleDateString("uz-UZ")}</td>
                  </tr>
                `
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getCorrectAnswer = (item: any): { text: string; key?: string } => {
    // First, get the user's question key
    let userQuestionKey: string | null = null
    if (item.user_answer && typeof item.user_answer === "object" && item.user_answer !== null) {
      const keys = Object.keys(item.user_answer)
      if (keys.length > 0) {
        userQuestionKey = keys[0]
      }
    }

    // Try correct_answer first only if it's not empty
    if (item.correct_answer && Array.isArray(item.correct_answer) && item.correct_answer.length > 0) {
      return { text: item.correct_answer[0] }
    }

    if (item.correct_answer && typeof item.correct_answer === "object" && !Array.isArray(item.correct_answer)) {
      // If we have a user question key, use it to get the answer
      if (userQuestionKey && userQuestionKey in item.correct_answer) {
        return { text: String(item.correct_answer[userQuestionKey]), key: userQuestionKey }
      }
      // Otherwise get first value
      const values = Object.values(item.correct_answer)
      if (values.length > 0) {
        const [key, value] = Object.entries(item.correct_answer)[0]
        return { text: String(value), key }
      }
    }

    // Fall back to answers field if correct_answer is empty or doesn't exist
    if (item.answers) {
      if (Array.isArray(item.answers)) {
        if (item.answers.length > 0) {
          return { text: item.answers[0] }
        }
      }
      if (typeof item.answers === "object" && item.answers !== null) {
        if (userQuestionKey && userQuestionKey in item.answers) {
          return { text: String(item.answers[userQuestionKey]), key: userQuestionKey }
        }
        // Otherwise get first value
        const values = Object.values(item.answers)
        if (values.length > 0) {
          const [key, value] = Object.entries(item.answers)[0]
          return { text: String(value), key }
        }
      }
      if (typeof item.answers === "string") {
        return { text: item.answers }
      }
    }

    return { text: "N/A" }
  }

  const getUserAnswer = (item: any): { text: string; key?: string } => {
    if (!item.user_answer) {
      return { text: "" }
    }

    if (typeof item.user_answer === "object" && item.user_answer !== null) {
      const entries = Object.entries(item.user_answer)
      if (entries.length > 0) {
        const [key, value] = entries[0]
        return { text: String(value), key }
      }
    }

    return { text: String(item.user_answer) }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Natijalar yuklanmoqda...</div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Imtihon Natijalari</h1>
            <p className="text-slate-400 mt-2">Barcha imtihon natijalarini ko'ring va tahlil qiling</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRecalculateAll}
              disabled={calculating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {calculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Hisoblanmoqda...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Ma'lumotlarni Yangilash
                </>
              )}
            </Button>
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="border-slate-600 text-slate-300 bg-transparent"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={exportToPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Natijalar</p>
                  <p className="text-xl font-bold text-white">{filteredResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">O'rtacha Overall</p>
                  <p className="text-xl font-bold text-white">
                    {filteredResults.length > 0
                      ? (
                          filteredResults.reduce((sum, r) => sum + (r.overall_band_score || 0), 0) /
                          filteredResults.filter((r) => r.overall_band_score).length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Writing O'rtacha</p>
                  <p className="text-xl font-bold text-white">
                    {filteredResults.length > 0
                      ? (
                          filteredResults.reduce((sum, r) => sum + (r.writing_band_score || 0), 0) /
                          filteredResults.filter((r) => r.writing_band_score).length
                        ).toFixed(1)
                      : "0.0"}
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
                  <p className="text-sm text-slate-400">Bugun</p>
                  <p className="text-xl font-bold text-white">
                    {results.filter((r) => new Date(r.taken_at).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="User ID bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {userType === "admin" && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Barcha locationlar</SelectItem>
                    {availableLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Imtihon turi" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="IELTS">IELTS</SelectItem>
                  <SelectItem value="TOEFL">TOEFL</SelectItem>
                  <SelectItem value="PTE">PTE</SelectItem>
                </SelectContent>
              </Select>

              <Select value={examFilter} onValueChange={setExamFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Imtihon" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Barcha imtihonlar</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600",
                        !dateFrom && "text-slate-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Dan"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600",
                        !dateTo && "text-slate-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Gacha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(searchTerm ||
              examTypeFilter !== "all" ||
              examFilter !== "all" ||
              dateFrom ||
              dateTo ||
              (userType === "admin" && locationFilter !== "REI")) && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm("")
                    setExamTypeFilter("all")
                    setExamFilter("all")
                    setDateFrom(undefined)
                    setDateTo(undefined)
                    if (userType === "admin") {
                      setLocationFilter("REI")
                    }
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrlarni tozalash
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Imtihon Natijalari ({filteredResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">User ID</TableHead>
                    <TableHead className="text-slate-300">Listening</TableHead>
                    <TableHead className="text-slate-300">Reading</TableHead>
                    <TableHead className="text-slate-300">Writing</TableHead>
                    <TableHead className="text-slate-300">Speaking</TableHead>
                    <TableHead className="text-slate-300">Overall</TableHead>
                    <TableHead className="text-slate-300">Sana</TableHead>
                    <TableHead className="text-slate-300">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => {
                    return (
                      <TableRow key={result.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-white font-bold">{result.user_id}</TableCell>
                        <TableCell className="text-slate-300 font-medium">
                          {result.listening_band_score?.toFixed(1) || "0.0"}
                        </TableCell>
                        <TableCell className="text-slate-300 font-medium">
                          {result.reading_band_score?.toFixed(1) || "0.0"}
                        </TableCell>
                        <TableCell className="text-slate-300 font-medium">
                          {result.writing_band_score?.toFixed(1) || "Baholanmagan"}
                        </TableCell>
                        <TableCell className="text-slate-300 font-medium">
                          {result.speaking_score?.toFixed(1) || "Baholanmagan"}
                        </TableCell>
                        <TableCell className="text-emerald-400 font-bold text-lg">
                          {result.overall_band_score?.toFixed(1) || "Baholanmagan"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(result.taken_at).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-white"
                              onClick={() => handleViewDetail(result)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-white"
                              onClick={() => handleViewAnswers(result)}
                              title="Javoblarni Ko'rish"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Natija - {selectedResult?.user_id}</DialogTitle>
            </DialogHeader>

            {selectedResult && (
              <div className="space-y-6">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Listening</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {selectedResult.listening_band_score?.toFixed(1) || "0.0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Reading</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {selectedResult.reading_band_score?.toFixed(1) || "0.0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Writing</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {selectedResult.writing_band_score?.toFixed(1) || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Overall</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {selectedResult.overall_band_score?.toFixed(1) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={detailedAnswersModalOpen} onOpenChange={setDetailedAnswersModalOpen}>
          <DialogContent className="max-w-6xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Javob Tahlili - {selectedResultForAnswers?.user_id}
              </DialogTitle>
            </DialogHeader>

            {selectedResultForAnswers && (
              <div className="space-y-6">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4">
                    {detailedAnswers ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Jami Natija</p>
                          <p className="text-3xl font-bold text-emerald-400">
                            {(detailedAnswers.listening?.filter((q: any) => q.is_correct).length || 0) +
                              (detailedAnswers.reading?.filter((q: any) => q.is_correct).length || 0) +
                              " / 40"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Overall Band</p>
                          <p className="text-3xl font-bold text-emerald-400">
                            {selectedResultForAnswers.overall_band_score?.toFixed(1) || "N/A"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400">Ma'lumotlar yuklanmoqda...</p>
                    )}
                  </CardContent>
                </Card>

                {answersLoading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">Javoblar yuklanmoqda...</p>
                  </div>
                ) : detailedAnswers ? (
                  <div className="space-y-6">
                    {detailedAnswers.listening && detailedAnswers.listening.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4">
                          Listening (Savollar 1-{detailedAnswers.listening.length})
                        </h3>
                        <Card className="bg-slate-700/30 border-slate-600">
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-600">
                                    <TableHead className="text-slate-300 w-16">Savol</TableHead>
                                    <TableHead className="text-slate-300">Sizning Javob</TableHead>
                                    <TableHead className="text-slate-300">To'g'ri Javob</TableHead>
                                    <TableHead className="text-slate-300 w-32">Natija</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detailedAnswers.listening.map((item: any, idx: number) => {
                                    const userAnswerData = getUserAnswer(item)
                                    const correctAnswerData = getCorrectAnswer(item)
                                    const isCorrect = item.is_correct
                                    const questionNum = idx + 1

                                    return (
                                      <TableRow
                                        key={`listening_${idx}`}
                                        className="border-slate-600 hover:bg-slate-600/30"
                                      >
                                        <TableCell className="text-white font-bold">{questionNum}</TableCell>
                                        <TableCell className="text-slate-300">
                                          {userAnswerData.text ? (
                                            <span className="bg-blue-500/20 px-2 py-1 rounded text-blue-300 text-sm">
                                              {userAnswerData.text}
                                              {userAnswerData.key && (
                                                <sub className="ml-1 text-xs opacity-70">{userAnswerData.key}</sub>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 italic">Not Answered</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                          <div className="text-sm">
                                            <p className="font-medium">
                                              {correctAnswerData.text}
                                              {correctAnswerData.key && (
                                                <sub className="ml-1 text-xs opacity-70">{correctAnswerData.key}</sub>
                                              )}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {!userAnswerData.text ? (
                                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                              Not Answered
                                            </Badge>
                                          ) : isCorrect ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                              ✓ Correct
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                              ✕ Incorrect
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {detailedAnswers.reading && detailedAnswers.reading.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4">
                          Reading (Savollar {(detailedAnswers.listening?.length || 0) + 1}-
                          {(detailedAnswers.listening?.length || 0) + detailedAnswers.reading.length})
                        </h3>
                        <Card className="bg-slate-700/30 border-slate-600">
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-600">
                                    <TableHead className="text-slate-300 w-16">Savol</TableHead>
                                    <TableHead className="text-slate-300">Sizning Javob</TableHead>
                                    <TableHead className="text-slate-300">To'g'ri Javob</TableHead>
                                    <TableHead className="text-slate-300 w-32">Natija</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detailedAnswers.reading.map((item: any, idx: number) => {
                                    const userAnswerData = getUserAnswer(item)
                                    const correctAnswerData = getCorrectAnswer(item)
                                    const isCorrect = item.is_correct
                                    const questionNum = (detailedAnswers.listening?.length || 0) + idx + 1

                                    return (
                                      <TableRow
                                        key={`reading_${idx}`}
                                        className="border-slate-600 hover:bg-slate-600/30"
                                      >
                                        <TableCell className="text-white font-bold">{questionNum}</TableCell>
                                        <TableCell className="text-slate-300">
                                          {userAnswerData.text ? (
                                            <span className="bg-blue-500/20 px-2 py-1 rounded text-blue-300 text-sm">
                                              {userAnswerData.text}
                                              {userAnswerData.key && (
                                                <sub className="ml-1 text-xs opacity-70">{userAnswerData.key}</sub>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 italic">Not Answered</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                          <div className="text-sm">
                                            <p className="font-medium">
                                              {correctAnswerData.text}
                                              {correctAnswerData.key && (
                                                <sub className="ml-1 text-xs opacity-70">{correctAnswerData.key}</sub>
                                              )}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {!userAnswerData.text ? (
                                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                              Not Answered
                                            </Badge>
                                          ) : isCorrect ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                              ✓ Correct
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                              ✕ Incorrect
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-red-400">Javoblarni yuklashda xatolik yuz berdi</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
