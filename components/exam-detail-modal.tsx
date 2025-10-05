"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Exam, Reading, Listening, Writing } from "@/lib/api"
import { api } from "@/lib/api"
import { BookOpen, Headphones, PenTool, Plus, Clock, Key, FileText, Eye } from "lucide-react"
import { CreateSkillModal } from "@/components/create-skill-modal"
import { useRouter } from "next/navigation"

interface ExamDetailModalProps {
  isOpen: boolean
  onClose: () => void
  exam: Exam | null
}

export function ExamDetailModal({ isOpen, onClose, exam }: ExamDetailModalProps) {
  const [activeSkillModal, setActiveSkillModal] = useState<"reading" | "listening" | "writing" | null>(null)
  const [selectedWritingPart, setSelectedWritingPart] = useState<"PART1" | "PART2" | null>(null)
  const [existingSkills, setExistingSkills] = useState<{
    reading: Reading[]
    listening: Listening[]
    writing: Writing[]
  }>({
    reading: [],
    listening: [],
    writing: [],
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (exam?.id) {
      fetchExistingSkills()
    }
  }, [exam?.id])

  const fetchExistingSkills = async () => {
    if (!exam?.id) return

    setLoading(true)
    try {
      const [readingData, listeningData, writingData] = await Promise.all([
        api.reading.getByExamId(exam.id.toString()),
        api.listening.getByExamId(exam.id.toString()),
        api.writing.getByExamId(exam.id.toString()),
      ])

      setExistingSkills({
        reading: Array.isArray(readingData) ? readingData : [],
        listening: Array.isArray(listeningData) ? listeningData : [],
        writing: Array.isArray(writingData) ? writingData : [],
      })
    } catch (error) {
      console.error("Failed to fetch existing skills:", error)
      setExistingSkills({ reading: [], listening: [], writing: [] })
    } finally {
      setLoading(false)
    }
  }

  const handleSkillCreated = () => {
    setActiveSkillModal(null)
    setSelectedWritingPart(null)
    fetchExistingSkills() // Refresh skills after creation
  }

  const handleWritingPartSelect = (part: "PART1" | "PART2") => {
    setSelectedWritingPart(part)
    setActiveSkillModal("writing")
  }

  const handleSkillClick = (skillType: string, skillId: number) => {
    router.push(`/dashboard/exams/${exam?.id}/${skillType}/${skillId}`)
    onClose()
  }

  const hasWritingPart1 = existingSkills.writing.some((w) => w.part === "PART1")
  const hasWritingPart2 = existingSkills.writing.some((w) => w.part === "PART2")
  const hasReading = existingSkills.reading.length > 0
  const hasListening = existingSkills.listening.length > 0

  if (!exam) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-3xl text-balance font-bold">{exam.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {/* Exam Info */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <FileText className="w-6 h-6" />
                  Imtihon Ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Davomiyligi</p>
                    <p className="text-white flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5" />
                      {exam.duration} daqiqa
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Parol</p>
                    <p className="text-white flex items-center gap-2 text-lg">
                      <Key className="w-5 h-5" />
                      {exam.password}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Yaratilgan</p>
                    <p className="text-white text-lg">{new Date(exam.created_at).toLocaleDateString("uz-UZ")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Tavsif</p>
                  <p className="text-white text-pretty break-words text-base leading-relaxed">{exam.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-xl">Ko'nikmalar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Reading */}
                  <Card className="bg-slate-600/50 border-slate-500 hover:bg-slate-600/70 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-8">
                      <div className="text-center mb-8">
                        <div className="p-4 bg-blue-500/20 rounded-full w-fit mx-auto mb-6">
                          <BookOpen className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-white font-semibold text-xl mb-3">Reading</h3>
                        <p className="text-slate-400 text-base">O'qish bo'limi</p>
                      </div>

                      {existingSkills.reading.length > 0 ? (
                        <div className="space-y-4">
                          {existingSkills.reading.map((reading) => (
                            <Button
                              key={reading.id}
                              onClick={() => handleSkillClick("reading", reading.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-4 rounded-lg transition-colors"
                              size="lg"
                            >
                              <Eye className="w-5 h-5 mr-3" />
                              <span className="truncate">{reading.title}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <Button
                          onClick={() => setActiveSkillModal("reading")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg transition-colors text-base"
                          size="lg"
                        >
                          <Plus className="w-5 h-5 mr-3" />
                          Qo'shish
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Listening */}
                  <Card className="bg-slate-600/50 border-slate-500 hover:bg-slate-600/70 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-8">
                      <div className="text-center mb-8">
                        <div className="p-4 bg-green-500/20 rounded-full w-fit mx-auto mb-6">
                          <Headphones className="w-10 h-10 text-green-400" />
                        </div>
                        <h3 className="text-white font-semibold text-xl mb-3">Listening</h3>
                        <p className="text-slate-400 text-base">Tinglash bo'limi</p>
                      </div>

                      {existingSkills.listening.length > 0 ? (
                        <div className="space-y-4">
                          {existingSkills.listening.map((listening) => (
                            <Button
                              key={listening.id}
                              onClick={() => handleSkillClick("listening", listening.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-4 rounded-lg transition-colors"
                              size="lg"
                            >
                              <Eye className="w-5 h-5 mr-3" />
                              <span className="truncate">{listening.title}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <Button
                          onClick={() => setActiveSkillModal("listening")}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg transition-colors text-base"
                          size="lg"
                        >
                          <Plus className="w-5 h-5 mr-3" />
                          Qo'shish
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Writing */}
                  <Card className="bg-slate-600/50 border-slate-500 hover:bg-slate-600/70 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-8">
                      <div className="text-center mb-8">
                        <div className="p-4 bg-purple-500/20 rounded-full w-fit mx-auto mb-6">
                          <PenTool className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-white font-semibold text-xl mb-3">Writing</h3>
                        <p className="text-slate-400 text-base">Yozish bo'limi</p>
                      </div>

                      {existingSkills.writing.length > 0 && (
                        <div className="space-y-4 mb-6">
                          {existingSkills.writing.map((writing) => (
                            <Button
                              key={writing.id}
                              onClick={() => handleSkillClick("writing", writing.id)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base py-4 rounded-lg transition-colors"
                              size="lg"
                            >
                              <Eye className="w-5 h-5 mr-3" />
                              <span className="truncate">{writing.part}</span>
                            </Button>
                          ))}
                        </div>
                      )}

                      <div className="space-y-4">
                        {!hasWritingPart1 && (
                          <Button
                            onClick={() => handleWritingPartSelect("PART1")}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg transition-colors font-medium text-base"
                            size="lg"
                          >
                            <Plus className="w-5 h-5 mr-3" />
                            PART 1 Qo'shish
                          </Button>
                        )}
                        {!hasWritingPart2 && (
                          <Button
                            onClick={() => handleWritingPartSelect("PART2")}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-lg transition-colors font-medium text-base"
                            size="lg"
                          >
                            <Plus className="w-5 h-5 mr-3" />
                            PART 2 Qo'shish
                          </Button>
                        )}
                        {hasWritingPart1 && hasWritingPart2 && (
                          <p className="text-slate-400 text-center text-sm italic">
                            Barcha writing qismlari qo'shilgan
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      
      <CreateSkillModal
        isOpen={activeSkillModal !== null}
        onClose={() => {
          setActiveSkillModal(null)
          setSelectedWritingPart(null)
        }}
        skillType={activeSkillModal}
        examId={exam?.id?.toString()}
        onSkillCreated={handleSkillCreated}
        writingPart={selectedWritingPart}
      />
    </>
  )
}
