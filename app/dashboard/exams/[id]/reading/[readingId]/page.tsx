"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Reading, type ReadingQuestions, type ReadingQuestion, type Passage } from "@/lib/api"
import { CreateReadingSectionModal } from "@/components/create-reading-section-modal"
import { CreateReadingQuestionModal } from "@/components/create-reading-question-modal"
import { CreatePassageModal } from "../../../../../../components/create-passage-modal"
import { PassageRenderer } from "../../../../../../components/passage-render"
import { Plus, BookOpen } from "lucide-react"

interface ReadingWithQuestions extends Reading {
  questions?: Array<ReadingQuestions & { r_questions: ReadingQuestion[] }>
  passages?: Passage[]
}

export default function ReadingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [reading, setReading] = useState<ReadingWithQuestions | null>(null)
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showPassageModal, setShowPassageModal] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [editingSection, setEditingSection] = useState<ReadingQuestions | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<ReadingQuestion | null>(null)
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null)

  const examId = params.id as string
  const readingId = params.readingId as string

  useEffect(() => {
    fetchReadingData()
  }, [readingId])

  const fetchReadingData = async () => {
    try {
      setLoading(true)
      const [readingData, passagesData] = await Promise.all([
        api.reading.getById(readingId),
        api.passages.getByReadingId(readingId),
      ])
      setReading(readingData)
      setPassages(Array.isArray(passagesData) ? passagesData : [])
    } catch (error: any) {
      console.error("Failed to fetch reading data:", error)
      setError("Reading ma'lumotlarini yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleSectionCreated = () => {
    setShowSectionModal(false)
    setEditingSection(null)
    fetchReadingData()
  }

  const handleQuestionCreated = () => {
    setShowQuestionModal(false)
    setEditingQuestion(null)
    setSelectedSectionId("")
    fetchReadingData()
  }

  const handlePassageCreated = () => {
    setShowPassageModal(false)
    setEditingPassage(null)
    fetchReadingData()
  }

  const handleAddQuestion = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    setShowQuestionModal(true)
  }

  const handleEditSection = (section: ReadingQuestions) => {
    setEditingSection(section)
    setShowSectionModal(true)
  }

  const handleEditQuestion = (question: ReadingQuestion) => {
    setEditingQuestion(question)
    setSelectedSectionId(question.reading_questions_id.toString())
    setShowQuestionModal(true)
  }

  const handleEditPassage = (passage: Passage) => {
    setEditingPassage(passage)
    setShowPassageModal(true)
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Bu bo'limni o'chirishni xohlaysizmi?")) return

    try {
      await api.readingQuestions.delete(sectionId)
      fetchReadingData()
    } catch (error) {
      console.error("Failed to delete section:", error)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Bu savolni o'chirishni xohlaysizmi?")) return

    try {
      await api.rQuestions.delete(questionId)
      fetchReadingData()
    } catch (error) {
      console.error("Failed to delete question:", error)
    }
  }

  const handleDeletePassage = async (passageId: string) => {
    if (!confirm("Bu passage'ni o'chirishni xohlaysizmi?")) return

    try {
      await api.passages.delete(passageId)
      fetchReadingData()
    } catch (error) {
      console.error("Failed to delete passage:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !reading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 bg-slate-400 rounded" />
          <h2 className="text-xl font-semibold text-slate-300">Reading topilmadi</h2>
          <p className="text-slate-400 text-center">{error || "So'ralgan reading mavjud emas"}</p>
          <Button onClick={() => router.back()} variant="outline">
            ← Orqaga
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const sections = reading.questions || []

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              ← Orqaga
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-400 rounded" />
              <div>
                <h1 className="text-lg font-bold text-white text-balance">{reading.title}</h1>
                <p className="text-slate-400 text-sm">Reading Bo'limi</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPassageModal(true)}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Passage Qo'shish
            </Button>
            <Button
              onClick={() => setShowSectionModal(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Bo'lim Qo'shish
            </Button>
          </div>
        </div>

        {passages.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Passages</h2>
            <div className="grid gap-3">
              {passages.map((passage) => (
                <Card key={passage.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                          {passage.part}
                        </Badge>
                        <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs">
                          {passage.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleEditPassage(passage)}
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs px-2 py-1 h-7"
                        >
                          Tahrirlash
                        </Button>
                        <Button
                          onClick={() => handleDeletePassage(passage.id.toString())}
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-700/20 text-xs px-2 py-1 h-7"
                        >
                          O'chirish
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <PassageRenderer text={passage.reading_text} className="text-slate-200 text-sm" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Original Reading Passage (kept for backward compatibility) */}
        {reading.passage_text && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base text-balance">{reading.passage_title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-pretty text-sm">
                  {reading.passage_text}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reading Sections */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Reading Bo'limlari</h2>

          {sections.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="text-center py-6">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Hozircha bo'limlar mavjud emas</p>
                <p className="text-slate-500 text-xs mt-1">
                  Birinchi bo'limni yaratish uchun yuqoridagi tugmani bosing
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sections.map((section) => {
                const sectionQuestions = section.r_questions || []
                return (
                  <Card key={section.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                            {section.part}
                          </Badge>
                          {section.title && <h3 className="text-white font-medium text-sm">{section.title}</h3>}
                          <span className="text-slate-400 text-xs">({sectionQuestions.length} savol)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => handleAddQuestion(section.id.toString())}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Savol
                          </Button>
                          <Button
                            onClick={() => handleEditSection(section)}
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs px-2 py-1 h-7"
                          >
                            Tahrirlash
                          </Button>
                          <Button
                            onClick={() => handleDeleteSection(section.id.toString())}
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-700/20 text-xs px-2 py-1 h-7"
                          >
                            O'chirish
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {section.instruction && <p className="text-slate-300 text-xs">{section.instruction}</p>}

                      {/* Questions for this section */}
                      <div className="space-y-2">
                        {sectionQuestions.length > 0 ? (
                          <div className="grid gap-2">
                            {sectionQuestions.map((question, index) => (
                              <div key={question.id} className="bg-slate-700/50 rounded-lg p-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-slate-200 text-xs">
                                      <span className="font-mono text-slate-400">Q{index + 1}:</span> {question.q_text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs">
                                        {question.q_type}
                                      </Badge>
                                      {question.correct_answers && question.correct_answers.length > 0 && (
                                        <span className="text-green-400 text-xs">
                                          To'g'ri: {question.correct_answers.join(", ")}
                                        </span>
                                      )}
                                    </div>
                                    {question.options && question.options.length > 0 && (
                                      <div className="mt-1 text-xs text-slate-300">
                                        {question.options.map((opt: any, i: number) => (
                                          <span key={i} className="mr-2">
                                            {opt.key}: {opt.text}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      onClick={() => handleEditQuestion(question)}
                                      size="sm"
                                      variant="outline"
                                      className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs px-1 py-0 h-6"
                                    >
                                      Tahrirlash
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteQuestion(question.id.toString())}
                                      size="sm"
                                      variant="outline"
                                      className="border-red-600 text-red-400 hover:bg-red-700/20 text-xs px-1 py-0 h-5"
                                    >
                                      O'chirish
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs">Hozircha savollar mavjud emas</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateReadingSectionModal
        isOpen={showSectionModal}
        onClose={() => {
          setShowSectionModal(false)
          setEditingSection(null)
        }}
        readingId={readingId}
        onSectionCreated={handleSectionCreated}
        editingSection={editingSection}
      />

      <CreateReadingQuestionModal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false)
          setEditingQuestion(null)
          setSelectedSectionId("")
        }}
        readingQuestionsId={selectedSectionId}
        onQuestionCreated={handleQuestionCreated}
        editingQuestion={editingQuestion}
      />

      <CreatePassageModal
        isOpen={showPassageModal}
        onClose={() => {
          setShowPassageModal(false)
          setEditingPassage(null)
        }}
        readingId={readingId}
        onPassageCreated={handlePassageCreated}
        editingPassage={editingPassage}
      />
    </DashboardLayout>
  )
}
