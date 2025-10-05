"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, type Listening, type ListeningQuestions, type ListeningQuestion } from "@/lib/api"
import { CreateListeningSectionModal } from "@/components/create-listening-section-modal"
import { CreateListeningQuestionModal } from "@/components/create-listening-question-modal"
import { Plus, Headphones, Clock, Volume2, AlertCircle, Edit, Trash2, Upload } from "lucide-react"

interface ListeningWithQuestions extends Listening {
  questions?: Array<ListeningQuestions & { l_questions: ListeningQuestion[] }>
}

export default function ListeningDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [listening, setListening] = useState<ListeningWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showAudioUpdateModal, setShowAudioUpdateModal] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [editingSection, setEditingSection] = useState<ListeningQuestions | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<ListeningQuestion | null>(null)
  const [audioError, setAudioError] = useState<string>("")
  const [audioLoaded, setAudioLoaded] = useState(false)

  const examId = params.id as string
  const listeningId = params.listeningId as string

  useEffect(() => {
    fetchListeningData()
  }, [listeningId])

  const fetchListeningData = async () => {
    try {
      setLoading(true)
      const listeningData = await api.listening.getById(listeningId)
      console.log("[v0] Listening data:", listeningData)
      setListening(listeningData)
    } catch (error: any) {
      console.error("Failed to fetch listening data:", error)
      setError("Listening ma'lumotlarini yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget
    const audioFile = listening?.audio_file || listening?.audio_url || ""
    const fileExtension = audioFile.split(".").pop()?.toLowerCase()

    console.log("[v0] Audio error:", audio.error)
    console.log("[v0] File extension:", fileExtension)
    console.log("[v0] Browser format support:", getSupportedAudioFormats())

    let errorMessage = "Audio yuklashda xatolik"

    if (audio.error) {
      switch (audio.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Audio yuklash bekor qilindi"
          break
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Tarmoq xatoligi - audio faylni yuklab bo'lmadi"
          break
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = `Audio format (${fileExtension}) qo'llab-quvvatlanmaydi yoki fayl buzilgan`
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = `Audio format (${fileExtension}) brauzer tomonidan qo'llab-quvvatlanmaydi`
          break
        default:
          errorMessage = `Noma'lum xatolik: ${audio.error.message}`
      }
    }

    setAudioError(errorMessage)
  }

  const handleAudioLoad = () => {
    console.log("[v0] Audio loaded successfully")
    setAudioLoaded(true)
    setAudioError("")
  }

  const handleAudioLoadStart = () => {
    console.log("[v0] Audio loading started")
    setAudioError("")
  }

  const handleSectionCreated = () => {
    setShowSectionModal(false)
    setEditingSection(null)
    fetchListeningData()
  }

  const handleQuestionCreated = () => {
    setShowQuestionModal(false)
    setEditingQuestion(null)
    setSelectedSectionId("")
    fetchListeningData()
  }

  const handleAddQuestion = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    setShowQuestionModal(true)
  }

  const handleEditSection = (section: ListeningQuestions) => {
    setEditingSection(section)
    setShowSectionModal(true)
  }

  const handleEditQuestion = (question: ListeningQuestion) => {
    setEditingQuestion(question)
    setSelectedSectionId(question.listening_questions_id.toString())
    setShowQuestionModal(true)
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Bu bo'limni o'chirishni xohlaysizmi?")) return

    try {
      await api.listeningQuestions.delete(sectionId)
      fetchListeningData()
    } catch (error) {
      console.error("Failed to delete section:", error)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Bu savolni o'chirishni xohlaysizmi?")) return

    try {
      await api.lQuestions.delete(questionId)
      fetchListeningData()
    } catch (error) {
      console.error("Failed to delete question:", error)
    }
  }

  const handleAudioUpdate = async (formData: FormData) => {
    try {
      await api.listening.update(listeningId, formData)
      setShowAudioUpdateModal(false)
      fetchListeningData()
    } catch (error) {
      console.error("Failed to update audio:", error)
    }
  }

  const handleAudioDelete = async () => {
    if (!confirm("Audio faylni o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.")) return

    try {
      const formData = new FormData()
      formData.append("title", listening?.title || "")
      formData.append("description", listening?.description || "")
      formData.append("exam_id", examId)

      await api.listening.update(listeningId, formData)
      fetchListeningData()
    } catch (error) {
      console.error("Failed to delete audio:", error)
    }
  }

  const getAudioUrl = () => {
    if (!listening) return ""

    const audioFile = listening.audio_file || listening.audio_url || listening.audioFile || listening.audioUrl
    if (!audioFile) return ""

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    const audioUrl = `${baseUrl}${audioFile}`

    console.log("[v0] Constructed audio URL:", audioUrl)
    return audioUrl
  }

  const getSupportedAudioFormats = () => {
    const audio = document.createElement("audio")
    const formats = {
      mp3: audio.canPlayType("audio/mpeg"),
      m4a: audio.canPlayType("audio/mp4"),
      wav: audio.canPlayType("audio/wav"),
      ogg: audio.canPlayType("audio/ogg"),
      webm: audio.canPlayType("audio/webm"),
    }
    return formats
  }

  const sections = listening?.questions || []

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
              <div className="w-6 h-6 bg-green-400 rounded" />
              <div>
                <h1 className="text-lg font-bold text-white text-balance">{listening?.title}</h1>
                <p className="text-slate-400 text-sm">Listening Bo'limi</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowSectionModal(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Bo'lim Qo'shish
          </Button>
        </div>

        {/* Audio Player */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-green-400" />
                Audio Fayl
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAudioUpdateModal(true)}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Audio Yangilash
                </Button>
                {listening && getAudioUrl() && (
                  <Button
                    onClick={handleAudioDelete}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-700/20 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Audio O'chirish
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {listening && getAudioUrl() ? (
              <div className="space-y-3">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <audio
                    controls
                    className="w-full"
                    style={{
                      filter: "invert(1) hue-rotate(180deg)",
                      borderRadius: "8px",
                    }}
                    onError={handleAudioError}
                    onLoadedData={handleAudioLoad}
                    onLoadStart={handleAudioLoadStart}
                    preload="metadata"
                    crossOrigin="anonymous"
                  >
                    <source src={getAudioUrl()} type="audio/mpeg" />
                    <source src={getAudioUrl()} type="audio/mp4" />
                    <source src={getAudioUrl()} type="audio/wav" />
                    <source src={getAudioUrl()} type="audio/ogg" />
                    Brauzeringiz audio elementini qo'llab-quvvatlamaydi.
                  </audio>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-slate-400">
                      Fayl: {listening.audio_file || listening.audio_url || "Noma'lum"}
                      {listening.audio_file && (
                        <span className="ml-2 px-2 py-1 bg-slate-600 rounded text-xs">
                          {listening.audio_file.split(".").pop()?.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span>{audioLoaded ? "Audio yuklandi" : "Audio yuklanmoqda..."}</span>
                    </div>
                  </div>
                  {audioError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 rounded p-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{audioError}</span>
                    </div>
                  )}
                  {process.env.NODE_ENV === "development" && (
                    <div className="text-xs text-slate-500 bg-slate-800 rounded p-2 space-y-1">
                      <p>Debug URL: {getAudioUrl()}</p>
                      <p>
                        Audio file field:{" "}
                        {JSON.stringify({
                          audio_file: listening.audio_file,
                          audio_url: listening.audio_url,
                        })}
                      </p>
                      <p>Browser format support: {JSON.stringify(getSupportedAudioFormats())}</p>
                    </div>
                  )}
                </div>
                {listening.description && (
                  <p className="text-slate-300 text-sm bg-slate-700/30 rounded p-2">{listening.description}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Volume2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Audio fayl mavjud emas</p>
                {process.env.NODE_ENV === "development" && listening && (
                  <p className="text-xs text-slate-500 mt-2">
                    Debug:{" "}
                    {JSON.stringify({
                      audio_file: listening.audio_file,
                      audio_url: listening.audio_url,
                      audioFile: (listening as any).audioFile,
                      audioUrl: (listening as any).audioUrl,
                    })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listening Sections */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Listening Bo'limlari</h2>

          {sections.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="text-center py-6">
                <Headphones className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Hozircha bo'limlar mavjud emas</p>
                <p className="text-slate-500 text-xs mt-1">
                  Birinchi bo'limni yaratish uchun yuqoridagi tugmani bosing
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sections.map((section) => {
                const sectionQuestions = section.l_questions || []
                return (
                  <Card key={section.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
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
                                      {question.correct_answers && (
                                        <span className="text-green-400 text-xs">
                                          To'g'ri:{" "}
                                          {Array.isArray(question.correct_answers)
                                            ? question.correct_answers.join(", ")
                                            : question.correct_answers}
                                        </span>
                                      )}
                                    </div>
                                    {question.options && question.options.length > 0 && (
                                      <div className="mt-1 text-xs text-slate-300">
                                        {Array.isArray(question.options) ? (
                                          question.options.map((opt: any, i: number) => (
                                            <span key={i} className="mr-2">
                                              {typeof opt === "object" && opt.key && opt.text
                                                ? `${opt.key}: ${opt.text}`
                                                : typeof opt === "string"
                                                  ? opt
                                                  : JSON.stringify(opt)}
                                            </span>
                                          ))
                                        ) : (
                                          <span>
                                            {typeof question.options === "object"
                                              ? JSON.stringify(question.options)
                                              : question.options}
                                          </span>
                                        )}
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
      <CreateListeningSectionModal
        isOpen={showSectionModal}
        onClose={() => {
          setShowSectionModal(false)
          setEditingSection(null)
        }}
        listeningId={listeningId}
        onSectionCreated={handleSectionCreated}
        editingSection={editingSection}
      />

      <CreateListeningQuestionModal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false)
          setEditingQuestion(null)
          setSelectedSectionId("")
        }}
        listeningQuestionsId={selectedSectionId}
        onQuestionCreated={handleQuestionCreated}
        editingQuestion={editingQuestion}
      />

      {showAudioUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-white mb-4">Audio Faylni Yangilash</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const audioInput = document.querySelector('input[type="file"]') as HTMLInputElement
                const audioFile = audioInput.files?.[0]
                if (!audioFile) return

                const formData = new FormData()
                formData.append("title", listening?.title || "")
                formData.append("description", listening?.description || "")
                formData.append("exam_id", examId)
                formData.append("audio_file", audioFile)

                await handleAudioUpdate(formData)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Joriy Audio Fayl</label>
                <p className="text-xs text-slate-400 bg-slate-700 rounded p-2">
                  {listening?.audio_file || listening?.audio_url || "Audio fayl mavjud emas"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yangi Audio Fayl *</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer cursor-pointer bg-slate-700 border border-slate-600 rounded"
                  required
                />
              </div>

              <div className="text-xs text-slate-400 bg-slate-700/50 rounded p-2">
                <p className="font-medium mb-1">Qo'llab-quvvatlanadigan formatlar:</p>
                <p>MP3, M4A, WAV, OGG, WEBM</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowAudioUpdateModal(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled={false}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={false}>
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Yangilash
                  </div>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
