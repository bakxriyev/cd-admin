"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Writing } from "@/lib/api"
import { Upload, X, PenTool, FileText, Trash2 } from "lucide-react"

interface EditWritingModalProps {
  isOpen: boolean
  onClose: () => void
  writing: Writing
  onSuccess: () => void
}

export function EditWritingModal({ isOpen, onClose, writing, onSuccess }: EditWritingModalProps) {
  const [formData, setFormData] = useState({
    part: "",
    task_text: "",
  })
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (writing) {
      setFormData({
        part: writing.part,
        task_text: writing.task_text,
      })
      setRemoveImage(false)
      setTaskImage(null)
    }
  }, [writing])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTaskImage(file)
      setRemoveImage(false)
    }
  }

  const handleRemoveImage = () => {
    setTaskImage(null)
    setRemoveImage(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!formData.part.trim() || !formData.task_text.trim()) {
        setError("Barcha majburiy maydonlarni to'ldiring")
        setLoading(false)
        return
      }

      const writingData = new FormData()
      writingData.append("part", formData.part)
      writingData.append("task_text", formData.task_text)

      if (taskImage) {
        writingData.append("task_image", taskImage)
      } else if (removeImage) {
        writingData.append("remove_image", "true")
      }

      await api.writing.update(writing.id.toString(), writingData)

      onSuccess()
    } catch (error: any) {
      console.error("Failed to update writing:", error)
      setError("Writing yangilashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      part: writing.part,
      task_text: writing.task_text,
    })
    setTaskImage(null)
    setRemoveImage(false)
    setError("")
    onClose()
  }

  const currentImageUrl = writing.task_image
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/writing/${writing.task_image}`
    : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-2xl">
            <PenTool className="w-6 h-6 text-purple-400" />
            Writing Tahrirlash
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Label htmlFor="part" className="text-slate-300 text-base">
              Qism *
            </Label>
            <Input
              id="part"
              value={formData.part}
              onChange={(e) => handleInputChange("part", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white h-12"
              placeholder="Task 1"
              required
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="task_text" className="text-slate-300 text-base">
              Vazifa Matni *
            </Label>
            <Textarea
              id="task_text"
              value={formData.task_text}
              onChange={(e) => handleInputChange("task_text", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white resize-y min-h-[200px]"
              placeholder="Vazifa matnini kiriting..."
              rows={10}
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-slate-300 text-base">Vazifa Rasmi</Label>

            {currentImageUrl && !removeImage && !taskImage && (
              <div className="space-y-3">
                <div className="relative border border-slate-600 rounded-lg overflow-hidden">
                  <img src={currentImageUrl || "/placeholder.svg"} alt="Current task image" className="w-full h-auto" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                  className="w-full border-red-600 text-red-400 hover:bg-red-700/20 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Rasmni O'chirish
                </Button>
              </div>
            )}

            {(removeImage || !currentImageUrl) && !taskImage && (
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-slate-500 transition-colors">
                <label className="flex flex-col items-center cursor-pointer group">
                  <div className="p-6 bg-slate-700/30 rounded-full group-hover:bg-slate-700/50 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-slate-300" />
                  </div>
                  <span className="text-base text-slate-400 text-center group-hover:text-slate-300">
                    Rasm yuklash uchun bosing
                  </span>
                  <span className="text-sm text-slate-500 mt-2">PNG, JPG, JPEG (max 5MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            )}

            {taskImage && (
              <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-300 truncate">{taskImage.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTaskImage(null)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-600">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
