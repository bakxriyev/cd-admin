"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, CheckCircle, Clock, FileText, Star, Mic } from "lucide-react"
import { api, type WritingAnswer, type Result, secureStorage, USER_DATA_KEY, USER_TYPE_KEY } from "@/lib/api"

interface WritingAssessment extends WritingAnswer {
  user?: {
    id: string
    name: string
    email: string
  }
  exam?: {
    id: string
    title: string
    exam_type: string
  }
  writing?: {
    id: string
    part: string
    task_text: string
  }
}

interface CombinedAssessment {
  userId: string
  examId: string
  user?: {
    id: string
    name: string
    email: string
  }
  exam?: {
    id: string
    title: string
    exam_type: string
  }
  // Writing
  part1?: WritingAssessment
  part2?: WritingAssessment
  writingScore: number
  isWritingAssessed: boolean
  // Speaking
  speakingScore: number
  isSpeakingAssessed: boolean
  resultId?: string
  takenAt: string
}

export default function AssessmentPage() {
  const [writingAnswers, setWritingAnswers] = useState<WritingAssessment[]>([])
  const [speakingResults, setSpeakingResults] = useState<Result[]>([])
  const [combinedAssessments, setCombinedAssessments] = useState<CombinedAssessment[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<CombinedAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("REI")
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [userType, setUserType] = useState<string>("")
  const [currentUserLocation, setCurrentUserLocation] = useState<string>("")

  // Writing Dialog
  const [selectedAssessment, setSelectedAssessment] = useState<CombinedAssessment | null>(null)
  const [isWritingDialogOpen, setIsWritingDialogOpen] = useState(false)
  const [part1Score, setPart1Score] = useState("")
  const [part2Score, setPart2Score] = useState("")

  // Speaking Dialog
  const [isSpeakingDialogOpen, setIsSpeakingDialogOpen] = useState(false)
  const [speakingScore, setSpeakingScore] = useState("")

  useEffect(() => {
    const type = secureStorage.getItem(USER_TYPE_KEY)
    const userData = secureStorage.getItem(USER_DATA_KEY)

    if (type) {
      setUserType(type)
    }

    if (userData) {
      const user = JSON.parse(userData)
      if (type === "client" && user.location) {
        setCurrentUserLocation(user.location)
        setLocationFilter(user.location)
      }
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")

    try {
      const [writingResponse, resultsResponse] = await Promise.all([api.writingAnswers.getAll(), api.results.getAll()])

      setWritingAnswers(writingResponse)
      setSpeakingResults(resultsResponse)

      const combined = combineAssessments(writingResponse, resultsResponse)
      setCombinedAssessments(combined)

      const locations = new Set<string>()
      combined.forEach((assessment) => {
        if (assessment.user?.id) {
          const match = assessment.user.id.match(/^([A-Z]+)/)
          if (match) {
            locations.add(match[1])
          }
        }
      })
      setAvailableLocations(Array.from(locations).sort())

      setFilteredAssessments(combined)
    } catch (error: any) {
      console.error("Failed to fetch data:", error)
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const combineAssessments = (writings: WritingAssessment[], results: Result[]): CombinedAssessment[] => {
    const assessmentMap = new Map<string, CombinedAssessment>()

    writings.forEach((answer) => {
      const key = `${answer.user_id}_${answer.exam_id}`

      if (!assessmentMap.has(key)) {
        assessmentMap.set(key, {
          userId: answer.user_id,
          examId: answer.exam_id,
          user: answer.user,
          exam: answer.exam,
          writingScore: 0,
          isWritingAssessed: false,
          speakingScore: 0,
          isSpeakingAssessed: false,
          takenAt: answer.created_at,
        })
      }

      const assessment = assessmentMap.get(key)!

      if (answer.writing?.part === "PART1") {
        assessment.part1 = answer
      } else if (answer.writing?.part === "PART2") {
        assessment.part2 = answer
      }
    })

    results.forEach((result) => {
      const key = `${result.user_id}_${result.exam_id}`

      if (!assessmentMap.has(key)) {
        assessmentMap.set(key, {
          userId: result.user_id,
          examId: result.exam_id,
          user: result.user,
          exam: result.exam,
          writingScore: 0,
          isWritingAssessed: false,
          speakingScore: result.speaking_score || 0,
          isSpeakingAssessed: (result.speaking_score || 0) > 0,
          resultId: result.id,
          takenAt: result.taken_at,
        })
      } else {
        const assessment = assessmentMap.get(key)!
        assessment.speakingScore = result.speaking_score || 0
        assessment.isSpeakingAssessed = (result.speaking_score || 0) > 0
        assessment.resultId = result.id
      }
    })

    return Array.from(assessmentMap.values()).map((assessment) => {
      const part1Score = assessment.part1?.score || 0
      const part2Score = assessment.part2?.score || 0
      const hasPart1 = !!assessment.part1
      const hasPart2 = !!assessment.part2

      let writingScore = 0
      let isWritingAssessed = false

      if (hasPart1 && hasPart2) {
        if (part1Score > 0 && part2Score > 0) {
          writingScore = (part1Score + part2Score) / 2
          isWritingAssessed = true
        }
      } else if (hasPart1 && part1Score > 0) {
        writingScore = part1Score
        isWritingAssessed = true
      } else if (hasPart2 && part2Score > 0) {
        writingScore = part2Score
        isWritingAssessed = true
      }

      return {
        ...assessment,
        writingScore,
        isWritingAssessed,
      }
    })
  }

  useEffect(() => {
    let filtered = combinedAssessments

    if (userType === "client") {
      filtered = filtered.filter((assessment) => assessment.user?.id?.startsWith(currentUserLocation))
    } else {
      if (locationFilter && locationFilter !== "all") {
        filtered = filtered.filter((assessment) => assessment.user?.id?.startsWith(locationFilter))
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (assessment) =>
          assessment.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assessment.exam?.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      if (statusFilter === "assessed") {
        filtered = filtered.filter((a) => a.isWritingAssessed || a.isSpeakingAssessed)
      } else if (statusFilter === "pending") {
        filtered = filtered.filter((a) => !a.isWritingAssessed || !a.isSpeakingAssessed)
      }
    }

    setFilteredAssessments(filtered)
  }, [combinedAssessments, searchTerm, statusFilter, locationFilter, userType, currentUserLocation])

  const handleWritingAssessment = async () => {
    if (!selectedAssessment) return

    try {
      const updates: Promise<any>[] = []

      if (selectedAssessment.part1 && part1Score) {
        updates.push(
          api.writingAnswers.update(selectedAssessment.part1.id, {
            score: Number.parseFloat(part1Score),
          }),
        )
      }

      if (selectedAssessment.part2 && part2Score) {
        updates.push(
          api.writingAnswers.update(selectedAssessment.part2.id, {
            score: Number.parseFloat(part2Score),
          }),
        )
      }

      await Promise.all(updates)
      await fetchData()

      setIsWritingDialogOpen(false)
      setSelectedAssessment(null)
      setPart1Score("")
      setPart2Score("")
    } catch (error) {
      console.error("Failed to update writing assessment:", error)
      alert("Writing baholashda xatolik yuz berdi")
    }
  }

  const handleSpeakingAssessment = async () => {
    if (!selectedAssessment || !speakingScore) return

    try {
      await api.speaking.create({
        user_id: selectedAssessment.userId,
        exam_id: Number.parseInt(selectedAssessment.examId),
        score: Number.parseFloat(speakingScore),
      })

      await fetchData()

      setIsSpeakingDialogOpen(false)
      setSelectedAssessment(null)
      setSpeakingScore("")
    } catch (error) {
      console.error("Failed to update speaking assessment:", error)
      alert("Speaking baholashda xatolik yuz berdi")
    }
  }

  const openWritingDialog = (assessment: CombinedAssessment) => {
    setSelectedAssessment(assessment)
    setPart1Score(assessment.part1?.score?.toString() || "")
    setPart2Score(assessment.part2?.score?.toString() || "")
    setIsWritingDialogOpen(true)
  }

  const openSpeakingDialog = (assessment: CombinedAssessment) => {
    setSelectedAssessment(assessment)
    setSpeakingScore(assessment.speakingScore?.toString() || "")
    setIsSpeakingDialogOpen(true)
  }

  const getScoreBadge = (score: number) => {
    if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    if (score >= 6.5) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (score >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Ma'lumotlar yuklanmoqda...</div>
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

  const totalAssessed = combinedAssessments.filter((a) => a.isWritingAssessed || a.isSpeakingAssessed).length
  const totalPending = combinedAssessments.filter((a) => !a.isWritingAssessed || !a.isSpeakingAssessed).length
  const avgWriting =
    combinedAssessments.filter((a) => a.isWritingAssessed).length > 0
      ? combinedAssessments.filter((a) => a.isWritingAssessed).reduce((sum, a) => sum + a.writingScore, 0) /
        combinedAssessments.filter((a) => a.isWritingAssessed).length
      : 0
  const avgSpeaking =
    combinedAssessments.filter((a) => a.isSpeakingAssessed).length > 0
      ? combinedAssessments.filter((a) => a.isSpeakingAssessed).reduce((sum, a) => sum + a.speakingScore, 0) /
        combinedAssessments.filter((a) => a.isSpeakingAssessed).length
      : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Baholash</h1>
            <p className="text-slate-400 mt-2">Talabalarning Writing va Speaking javoblarini baholang</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Natijalar</p>
                  <p className="text-xl font-bold text-white">{combinedAssessments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Baholangan</p>
                  <p className="text-xl font-bold text-white">{totalAssessed}</p>
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
                  <p className="text-sm text-slate-400">Kutilmoqda</p>
                  <p className="text-xl font-bold text-white">{totalPending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">O'rtacha Ball</p>
                  <p className="text-xl font-bold text-white">
                    W: {avgWriting.toFixed(1)} / S: {avgSpeaking.toFixed(1)}
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
                    placeholder="Talaba yoki imtihon bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {userType !== "client" && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-slate-700/50 border-slate-600 text-white">
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Status bo'yicha" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Barcha natijalar</SelectItem>
                  <SelectItem value="pending">Kutilmoqda</SelectItem>
                  <SelectItem value="assessed">Baholangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Combined Assessment Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Baholash Natijalari ({filteredAssessments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Talaba</TableHead>
                    <TableHead className="text-slate-300">Imtihon</TableHead>
                    <TableHead className="text-slate-300">Writing</TableHead>
                    <TableHead className="text-slate-300">Speaking</TableHead>
                    <TableHead className="text-slate-300">Sana</TableHead>
                    <TableHead className="text-slate-300">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow
                      key={`${assessment.userId}_${assessment.examId}`}
                      className="border-slate-700 hover:bg-slate-700/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {assessment.user?.name ? getInitials(assessment.user.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{assessment.user?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-400">{assessment.user?.email || ""}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-slate-300">{assessment.exam?.title || "Unknown Exam"}</p>
                          <Badge variant="outline" className="border-slate-600 text-slate-300 mt-1">
                            {assessment.exam?.exam_type || "Unknown"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assessment.isWritingAssessed ? (
                          <Badge className={getScoreBadge(assessment.writingScore)}>
                            {assessment.writingScore.toFixed(1)}/9.0
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Kutilmoqda</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {assessment.isSpeakingAssessed ? (
                          <Badge className={getScoreBadge(assessment.speakingScore)}>
                            {assessment.speakingScore.toFixed(1)}/9.0
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Kutilmoqda</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(assessment.takenAt).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(assessment.part1 || assessment.part2) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-purple-400 hover:text-purple-300"
                              onClick={() => openWritingDialog(assessment)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Writing
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:text-emerald-300"
                            onClick={() => openSpeakingDialog(assessment)}
                          >
                            <Mic className="w-4 h-4 mr-1" />
                            Speaking
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

        {/* Writing Assessment Dialog */}
        <Dialog open={isWritingDialogOpen} onOpenChange={setIsWritingDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Writing Javoblarini Baholash</DialogTitle>
            </DialogHeader>
            {selectedAssessment && (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-slate-600 text-slate-300">
                      {selectedAssessment.user?.name ? getInitials(selectedAssessment.user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedAssessment.user?.name}</h3>
                    <p className="text-slate-400">{selectedAssessment.exam?.title}</p>
                  </div>
                </div>

                {/* PART1 */}
                {selectedAssessment.part1 && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>PART 1</span>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {selectedAssessment.part1.score > 0
                            ? `${selectedAssessment.part1.score}/9.0`
                            : "Baholanmagan"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-slate-300 font-medium">Vazifa:</Label>
                        <div className="mt-2 p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-slate-200 text-sm">{selectedAssessment.part1.writing?.task_text}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 font-medium">Talaba javobi:</Label>
                        <div className="mt-2 p-3 bg-slate-700/50 rounded-lg max-h-40 overflow-y-auto">
                          <p className="text-white whitespace-pre-wrap text-sm">
                            {selectedAssessment.part1.answer_text}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="part1-score" className="text-slate-300">
                          Ball (0-9)
                        </Label>
                        <Input
                          id="part1-score"
                          type="number"
                          min="0"
                          max="9"
                          step="0.5"
                          value={part1Score}
                          onChange={(e) => setPart1Score(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white mt-2"
                          placeholder="0.0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PART2 */}
                {selectedAssessment.part2 && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>PART 2</span>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {selectedAssessment.part2.score > 0
                            ? `${selectedAssessment.part2.score}/9.0`
                            : "Baholanmagan"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-slate-300 font-medium">Vazifa:</Label>
                        <div className="mt-2 p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-slate-200 text-sm">{selectedAssessment.part2.writing?.task_text}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 font-medium">Talaba javobi:</Label>
                        <div className="mt-2 p-3 bg-slate-700/50 rounded-lg max-h-40 overflow-y-auto">
                          <p className="text-white whitespace-pre-wrap text-sm">
                            {selectedAssessment.part2.answer_text}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="part2-score" className="text-slate-300">
                          Ball (0-9)
                        </Label>
                        <Input
                          id="part2-score"
                          type="number"
                          min="0"
                          max="9"
                          step="0.5"
                          value={part2Score}
                          onChange={(e) => setPart2Score(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white mt-2"
                          placeholder="0.0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Overall Score Preview */}
                {part1Score && part2Score && (
                  <Card className="bg-emerald-500/10 border-emerald-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">Writing Umumiy Ball:</span>
                        <span className="text-emerald-400 text-xl font-bold">
                          {((Number.parseFloat(part1Score) + Number.parseFloat(part2Score)) / 2).toFixed(1)}/9.0
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsWritingDialogOpen(false)}
                    className="border-slate-600 text-slate-300 bg-transparent"
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleWritingAssessment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!part1Score && !part2Score}
                  >
                    Baholash
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Speaking Assessment Dialog */}
        <Dialog open={isSpeakingDialogOpen} onOpenChange={setIsSpeakingDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Speaking Baholash</DialogTitle>
            </DialogHeader>
            {selectedAssessment && (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-slate-600 text-slate-300">
                      {selectedAssessment.user?.name ? getInitials(selectedAssessment.user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedAssessment.user?.name}</h3>
                    <p className="text-slate-400">{selectedAssessment.exam?.title}</p>
                  </div>
                </div>

                {/* Speaking Score Input */}
                <Card className="bg-slate-700/30 border-slate-600">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="speaking-score" className="text-slate-300 text-lg font-medium">
                        Speaking Ball (0-9)
                      </Label>
                      <p className="text-slate-400 text-sm mt-1 mb-3">
                        Talabaning speaking ko'nikmalarini baholang va ball kiriting
                      </p>
                      <Input
                        id="speaking-score"
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        value={speakingScore}
                        onChange={(e) => setSpeakingScore(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white text-lg"
                        placeholder="0.0"
                      />
                    </div>

                    {selectedAssessment.speakingScore > 0 && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-slate-300 text-sm">
                          Joriy ball:{" "}
                          <span className="text-blue-400 font-bold">
                            {selectedAssessment.speakingScore.toFixed(1)}/9.0
                          </span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsSpeakingDialogOpen(false)}
                    className="border-slate-600 text-slate-300 bg-transparent"
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleSpeakingAssessment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!speakingScore}
                  >
                    Baholash
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
