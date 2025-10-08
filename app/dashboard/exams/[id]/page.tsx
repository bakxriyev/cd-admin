"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Exam, type Reading, type Listening, type Writing, secureStorage, USER_TYPE_KEY } from "@/lib/api"
import { BookOpen, Headphones, PenTool, Plus, ArrowLeft, Clock, Key, FileText, Eye, Trash2 } from "lucide-react"
import { CreateSkillModal } from "@/components/create-skill-modal"
import { DeleteExamModal } from "@/components/delete-exam-modal"

interface ExamWithSkills extends Exam {
  readings?: Reading[]
  listenings?: Listening[]
  writings?: Writing[]
}

export default function ExamSkillsPage() {
  const params = useParams()
  const router = useRouter()
  const [exam, setExam] = useState<ExamWithSkills | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeSkillModal, setActiveSkillModal] = useState<"reading" | "listening" | "writing" | null>(null)
  const [selectedWritingPart, setSelectedWritingPart] = useState<"PART1" | "PART2" | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<{ type: string; id: number } | null>(null)
  const [userType, setUserType] = useState<string>("")
  const [userTypeLoading, setUserTypeLoading] = useState(true)
  const [showDeleteExamModal, setShowDeleteExamModal] = useState(false)

  const examId = params?.id as string

  useEffect(() => {
    console.log("[v0] Loading user type from storage...")
    const type = secureStorage.getItem(USER_TYPE_KEY)
    console.log("[v0] User type loaded:", type)
    setUserType(type || "")
    setUserTypeLoading(false)

    if (examId && examId !== "undefined") {
      console.log("[v0] Fetching exam with ID:", examId)
      fetchExamData()
    } else {
      console.error("[v0] Invalid exam ID:", examId)
      setError("Noto'g'ri imtihon ID")
      setLoading(false)
    }
  }, [examId])

  const fetchExamData = async () => {
    if (!examId || examId === "undefined") {
      console.error("[v0] Cannot fetch exam: Invalid ID")
      setError("Noto'g'ri imtihon ID")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("[v0] Making API call to fetch exam:", examId)
      const examData = await api.exams.getById(examId)
      console.log("[v0] Exam data received:", examData)
      setExam(examData)
      setError("")
    } catch (error: any) {
      console.error("[v0] Failed to fetch exam:", error)
      setError(error.message || "Imtihon ma'lumotlarini yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleSkillCreated = () => {
    setActiveSkillModal(null)
    setSelectedWritingPart(null)
    fetchExamData()
  }

  const handleWritingPartSelect = (part: "PART1" | "PART2") => {
    setSelectedWritingPart(part)
    setActiveSkillModal("writing")
  }

  const handleSkillClick = (skillType: string, skillId: number) => {
    router.push(`/dashboard/exams/${examId}/${skillType}/${skillId}`)
  }

  const handleDeleteSkill = async (skillType: string, skillId: number) => {
    if (!confirm(`Bu ${skillType} bo'limini o'chirishni xohlaysizmi?`)) return

    setDeletingSkill({ type: skillType, id: skillId })
    try {
      if (skillType === "reading") {
        await api.reading.delete(skillId.toString())
      } else if (skillType === "listening") {
        await api.listening.delete(skillId.toString())
      } else if (skillType === "writing") {
        await api.writing.delete(skillId.toString())
      }
      fetchExamData()
    } catch (error) {
      console.error("[v0] Failed to delete skill:", error)
      alert("O'chirishda xatolik yuz berdi")
    } finally {
      setDeletingSkill(null)
    }
  }

  const handleExamDeleted = () => {
    router.push("/dashboard/exams")
  }

  const canEdit = !userTypeLoading && userType !== "client"
  const canDelete = !userTypeLoading && (userType === "superadmin" || userType === "admin")
  console.log("[v0] Can edit:", canEdit, "Can delete:", canDelete, "User type:", userType, "Loading:", userTypeLoading)

  if (loading || userTypeLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !exam) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <FileText className="w-16 h-16 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-300">Imtihon topilmadi</h2>
          <p className="text-slate-400 text-center">{error || "So'ralgan imtihon mavjud emas"}</p>
          <Button onClick={() => router.push("/dashboard/exams")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Imtihonlar ro'yxatiga qaytish
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const existingWritings = exam.writings || []
  const existingReadings = exam.readings || []
  const existingListenings = exam.listenings || []

  const hasWritingPart1 = existingWritings.some((w) => w.part === "PART1")
  const hasWritingPart2 = existingWritings.some((w) => w.part === "PART2")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard/exams")}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Orqaga
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white text-balance">{exam.title}</h1>
              <p className="text-slate-400">{canEdit ? "Ko'nikmalarni boshqarish" : "Ko'nikmalarni ko'rish"}</p>
            </div>
          </div>
          {canDelete && (
            <Button
              onClick={() => setShowDeleteExamModal(true)}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-700/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Imtihonni O'chirish
            </Button>
          )}
        </div>

        {/* Exam Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Imtihon Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Davomiyligi</p>
                <p className="text-white flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4" />
                  {exam.duration} daqiqa
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Parol</p>
                <p className="text-white flex items-center gap-2 font-medium">
                  <Key className="w-4 h-4" />
                  {exam.password}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Yaratilgan</p>
                <p className="text-white font-medium">{new Date(exam.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Tavsif</p>
              <p className="text-white text-pretty break-words leading-relaxed">{exam.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Skills Management */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Ko'nikmalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reading */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-full w-fit mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Reading</h3>
                    <p className="text-slate-400 text-sm">O'qish bo'limi</p>
                  </div>

                  <div className="space-y-3">
                    {existingReadings.length > 0 ? (
                      <>
                        {existingReadings.map((reading) => (
                          <div key={reading.id} className="space-y-2">
                            <Button
                              onClick={() => handleSkillClick("reading", reading.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-3 rounded-lg transition-colors font-medium"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              <span className="truncate">{reading.passage_title || reading.title}</span>
                            </Button>
                            {canEdit && (
                              <Button
                                onClick={() => handleDeleteSkill("reading", reading.id)}
                                disabled={deletingSkill?.type === "reading" && deletingSkill?.id === reading.id}
                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2"
                                size="sm"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                O'chirish
                              </Button>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <Button
                            onClick={() => setActiveSkillModal("reading")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-medium"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Yaratish
                          </Button>
                        )}
                        {!canEdit && (
                          <p className="text-slate-400 text-center text-sm italic">Reading bo'limi mavjud emas</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Listening */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-green-500/20 rounded-full w-fit mx-auto mb-4">
                      <Headphones className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Listening</h3>
                    <p className="text-slate-400 text-sm">Tinglash bo'limi</p>
                  </div>

                  <div className="space-y-3">
                    {existingListenings.length > 0 ? (
                      <>
                        {existingListenings.map((listening) => (
                          <div key={listening.id} className="space-y-2">
                            <Button
                              onClick={() => handleSkillClick("listening", listening.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-3 rounded-lg transition-colors font-medium"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              <span className="truncate">{listening.title}</span>
                            </Button>
                            {canEdit && (
                              <Button
                                onClick={() => handleDeleteSkill("listening", listening.id)}
                                disabled={deletingSkill?.type === "listening" && deletingSkill?.id === listening.id}
                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2"
                                size="sm"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                O'chirish
                              </Button>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <Button
                            onClick={() => setActiveSkillModal("listening")}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-medium"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Yaratish
                          </Button>
                        )}
                        {!canEdit && (
                          <p className="text-slate-400 text-center text-sm italic">Listening bo'limi mavjud emas</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Writing */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-full w-fit mx-auto mb-4">
                      <PenTool className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Writing</h3>
                    <p className="text-slate-400 text-sm">Yozish bo'limi</p>
                  </div>

                  <div className="space-y-3">
                    {existingWritings.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {existingWritings.map((writing) => (
                          <div key={writing.id} className="space-y-2">
                            <Button
                              onClick={() => handleSkillClick("writing", writing.id)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-3 rounded-lg transition-colors font-medium"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              <span className="truncate">{writing.part}</span>
                            </Button>
                            {canEdit && (
                              <Button
                                onClick={() => handleDeleteSkill("writing", writing.id)}
                                disabled={deletingSkill?.type === "writing" && deletingSkill?.id === writing.id}
                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2"
                                size="sm"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                O'chirish
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {canEdit && (
                      <>
                        {!hasWritingPart1 && (
                          <Button
                            onClick={() => handleWritingPartSelect("PART1")}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors font-medium"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            PART 1 Yaratish
                          </Button>
                        )}
                        {!hasWritingPart2 && (
                          <Button
                            onClick={() => handleWritingPartSelect("PART2")}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors font-medium"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            PART 2 Yaratish
                          </Button>
                        )}
                        {hasWritingPart1 && hasWritingPart2 && existingWritings.length === 0 && (
                          <p className="text-slate-400 text-center text-xs italic">
                            Barcha writing qismlari qo'shilgan
                          </p>
                        )}
                      </>
                    )}
                    {!canEdit && existingWritings.length === 0 && (
                      <p className="text-slate-400 text-center text-sm italic">Writing bo'limi mavjud emas</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <CreateSkillModal
          isOpen={activeSkillModal !== null}
          onClose={() => {
            setActiveSkillModal(null)
            setSelectedWritingPart(null)
          }}
          skillType={activeSkillModal}
          examId={examId}
          onSkillCreated={handleSkillCreated}
          writingPart={selectedWritingPart}
        />
      )}

      {canDelete && (
        <DeleteExamModal
          isOpen={showDeleteExamModal}
          onClose={() => setShowDeleteExamModal(false)}
          examId={examId}
          examTitle={exam?.title || ""}
          onExamDeleted={handleExamDeleted}
        />
      )}
    </DashboardLayout>
  )
}
