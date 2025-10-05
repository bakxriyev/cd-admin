"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Exam } from "@/lib/api"
import { Upload, X } from "lucide-react"

interface CreateExamModalProps {
  isOpen: boolean
  onClose: () => void
  onExamCreated: (exam: Exam) => void
}

export function CreateExamModal({ isOpen, onClose, onExamCreated }: CreateExamModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    password: "",
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Client-side validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.duration.trim() ||
      !formData.password.trim()
    ) {
      setError("Barcha majburiy maydonlarni to'ldiring")
      setLoading(false)
      return
    }

    try {
      const examData = new FormData()
      examData.append("title", formData.title.trim())
      examData.append("description", formData.description.trim())
      examData.append("duration", formData.duration.trim())
      examData.append("password", formData.password.trim())

      if (photo) {
        examData.append("photo", photo)
      }

      console.log("[v0] Sending exam data:", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: formData.duration.trim(),
        password: formData.password.trim(),
        hasPhoto: !!photo,
      })

      const response = await api.exams.create(examData)
      onExamCreated(response)
      onClose()

      // Reset form
      setFormData({
        title: "",
        description: "",
        duration: "",
        password: "",
      })
      setPhoto(null)
    } catch (error: any) {
      console.error("Failed to create exam:", error)
      setError(error.message || "Imtihon yaratishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Yangi Imtihon Yaratish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Sarlavha *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Imtihon sarlavhasini kiriting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Tavsif *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Imtihon tavsifini kiriting"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-slate-300">
              Davomiyligi (daqiqalarda) *
            </Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="120"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Parol *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Imtihon parolini kiriting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Rasm (ixtiyoriy)</Label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
              {photo ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{photo.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-400">Rasm yuklash uchun bosing</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
              {loading ? "Yaratilmoqda..." : "Yaratish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
