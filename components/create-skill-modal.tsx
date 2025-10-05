"use client"

import { useState } from "react"

import type React from "react"
import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { Upload, X, BookOpen, Headphones, PenTool, FileText } from "lucide-react"

interface CreateSkillModalProps {
  isOpen: boolean
  onClose: () => void
  skillType: "reading" | "listening" | "writing" | null
  examId: string | undefined
  onSkillCreated: () => void
  writingPart?: "PART1" | "PART2" | null // Added writingPart prop
}

export function CreateSkillModal({
  isOpen,
  onClose,
  skillType,
  examId,
  onSkillCreated,
  writingPart,
}: CreateSkillModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    passage_title: "",
    part: "",
    task_text: "",
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (writingPart && skillType === "writing") {
      setFormData((prev) => ({ ...prev, part: writingPart === "PART1" ? "Task 1" : "Task 2" }))
    }
  }, [writingPart, skillType])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTaskImage(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examId || !skillType) return

    setLoading(true)
    setError("")

    try {
      let response

      if (skillType === "listening") {
        if (!formData.title.trim() || !formData.description.trim() || !audioFile) {
          setError("Barcha majburiy maydonlarni to'ldiring")
          setLoading(false)
          return
        }

        const listeningData = new FormData()
        listeningData.append("exam_id", examId)
        listeningData.append("title", formData.title)
        listeningData.append("description", formData.description)
        listeningData.append("audio_url", audioFile.name)
        listeningData.append("audio_file", audioFile)

        response = await api.listening.create(listeningData)
      } else if (skillType === "reading") {
        if (!formData.passage_title.trim()) {
          setError("Matn sarlavhasini kiriting")
          setLoading(false)
          return
        }

        const readingData = {
          exam_id: Number.parseInt(examId),
          passage_title: formData.passage_title,
        }

        response = await api.reading.create(readingData)
      } else if (skillType === "writing") {
        if (!formData.part.trim() || !formData.task_text.trim()) {
          setError("Barcha majburiy maydonlarni to'ldiring")
          setLoading(false)
          return
        }

        const writingData = new FormData()
        writingData.append("exam_id", examId)
        writingData.append("part", formData.part)
        writingData.append("task_text", formData.task_text)

        if (taskImage) {
          writingData.append("task_image", taskImage)
        }

        response = await api.writing.create(writingData)
      }

      onSkillCreated()

      setFormData({
        title: "",
        description: "",
        passage_title: "",
        part: "",
        task_text: "",
      })
      setAudioFile(null)
      setTaskImage(null)
    } catch (error: any) {
      console.error(`Failed to create ${skillType}:`, error)
      setError(`${skillType} yaratishda xatolik yuz berdi`)
    } finally {
      setLoading(false)
    }
  }

  const getModalTitle = () => {
    switch (skillType) {
      case "reading":
        return "Reading Bo'limi Qo'shish"
      case "listening":
        return "Listening Bo'limi Qo'shish"
      case "writing":
        return writingPart ? `Writing ${writingPart} Qo'shish` : "Writing Bo'limi Qo'shish"
      default:
        return ""
    }
  }

  const getIcon = () => {
    switch (skillType) {
      case "reading":
        return <BookOpen className="w-5 h-5 text-blue-400" />
      case "listening":
        return <Headphones className="w-5 h-5 text-green-400" />
      case "writing":
        return <PenTool className="w-5 h-5 text-purple-400" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-7xl w-[98vw] max-h-[98vh] overflow-y-auto">
        <DialogHeader className="pb-8">
          <DialogTitle className="text-white flex items-center gap-4 text-3xl font-bold">
            {getIcon()}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-5">
              <p className="text-red-400 text-base font-medium">{error}</p>
            </div>
          )}

          {/* Reading Fields */}
          {skillType === "reading" && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <Label htmlFor="passage_title" className="text-slate-300 text-lg font-semibold">
                  Matn Sarlavhasi *
                </Label>
                <Input
                  id="passage_title"
                  value={formData.passage_title}
                  onChange={(e) => handleInputChange("passage_title", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white h-14 text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                  placeholder="The History of AI"
                  required
                />
                <p className="text-slate-400 text-base leading-relaxed">
                  Reading bo'limi uchun matn sarlavhasini kiriting
                </p>
              </div>
            </div>
          )}

          {/* Listening Fields */}
          {skillType === "listening" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="title" className="text-slate-300 text-lg font-semibold">
                    Sarlavha *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white h-14 text-lg focus:border-green-500 focus:ring-green-500/20 rounded-lg"
                    placeholder="Listening sarlavhasini kiriting"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="description" className="text-slate-300 text-lg font-semibold">
                    Tavsif *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white resize-y break-words text-lg min-h-[160px] leading-relaxed focus:border-green-500 focus:ring-green-500/20 rounded-lg"
                    placeholder="Listening tavsifini kiriting"
                    rows={7}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-300 text-lg font-semibold">Audio Fayl *</Label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-10 hover:border-slate-500 transition-colors">
                  {audioFile ? (
                    <div className="flex items-center justify-between bg-slate-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-5">
                        <div className="p-4 bg-green-500/20 rounded-xl">
                          <Headphones className="w-8 h-8 text-green-400" />
                        </div>
                        <span className="text-lg text-slate-300 truncate">{audioFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAudioFile(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 p-3"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer group">
                      <div className="p-8 bg-slate-700/30 rounded-full group-hover:bg-slate-700/50 transition-colors mb-6">
                        <Upload className="w-16 h-16 text-slate-400 group-hover:text-slate-300" />
                      </div>
                      <span className="text-lg text-slate-400 text-center group-hover:text-slate-300 font-semibold">
                        Audio fayl yuklash uchun bosing
                      </span>
                      <span className="text-base text-slate-500 mt-3">MP3, WAV, M4A (max 50MB)</span>
                      <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Writing Fields */}
          {skillType === "writing" && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label htmlFor="part" className="text-slate-300 text-lg font-semibold">
                    Qism *
                  </Label>
                  <Input
                    id="part"
                    value={formData.part}
                    onChange={(e) => handleInputChange("part", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white h-14 text-lg focus:border-purple-500 focus:ring-purple-500/20 rounded-lg"
                    placeholder={writingPart === "PART1" ? "Task 1" : writingPart === "PART2" ? "Task 2" : "Task 1"}
                    required
                  />
                  <p className="text-slate-400 text-base leading-relaxed">
                    {writingPart === "PART1"
                      ? "Grafik, jadval yoki diagramma tahlili uchun"
                      : writingPart === "PART2"
                        ? "Esse yozish vazifasi uchun"
                        : "Vazifa turini kiriting"}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-slate-300 text-lg font-semibold">Vazifa Rasmi (ixtiyoriy)</Label>
                  <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-slate-500 transition-colors">
                    {taskImage ? (
                      <div className="flex items-center justify-between bg-slate-700/50 rounded-xl p-5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-purple-500/20 rounded-lg">
                            <FileText className="w-6 h-6 text-purple-400" />
                          </div>
                          <span className="text-base text-slate-300 truncate">{taskImage.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskImage(null)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 p-2"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer group">
                        <div className="p-6 bg-slate-700/30 rounded-full group-hover:bg-slate-700/50 transition-colors mb-4">
                          <Upload className="w-12 h-12 text-slate-400 group-hover:text-slate-300" />
                        </div>
                        <span className="text-base text-slate-400 text-center group-hover:text-slate-300 font-medium">
                          {writingPart === "PART1"
                            ? "Grafik, jadval yoki diagramma rasmini yuklang"
                            : "Rasm yuklash uchun bosing"}
                        </span>
                        <span className="text-sm text-slate-500 mt-2">PNG, JPG, JPEG (max 5MB)</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="task_text" className="text-slate-300 text-lg font-semibold">
                  Vazifa Matni *
                </Label>
                <Textarea
                  id="task_text"
                  value={formData.task_text}
                  onChange={(e) => handleInputChange("task_text", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white resize-y min-h-[300px] break-words text-lg leading-relaxed focus:border-purple-500 focus:ring-purple-500/20 rounded-lg"
                  placeholder={
                    writingPart === "PART1"
                      ? "Quyidagi grafik/jadval/diagrammani tahlil qiling va asosiy ma'lumotlarni tasvirlab bering..."
                      : writingPart === "PART2"
                        ? "Quyidagi mavzu bo'yicha esse yozing. O'z fikringizni dalillar bilan asoslang..."
                        : "Vazifa matnini kiriting..."
                  }
                  rows={12}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-8 pt-10 border-t border-slate-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent py-5 text-lg font-semibold h-auto rounded-lg"
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 text-lg font-semibold h-auto rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Yaratilmoqda...
                </div>
              ) : (
                "Yaratish"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
