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
import { Upload, X, Headphones } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface CreateListeningSectionModalProps {
  isOpen: boolean
  onClose: () => void
  listeningId: string
  onSectionCreated: () => void
  editingSection?: any | null
}

export function CreateListeningSectionModal({
  isOpen,
  onClose,
  listeningId,
  onSectionCreated,
  editingSection,
}: CreateListeningSectionModalProps) {
  const [formData, setFormData] = useState({
    part: "",
    title: "",
    instruction: "",
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (editingSection) {
      setFormData({
        part: editingSection.part || "",
        title: editingSection.title || "",
        instruction: editingSection.instruction || "",
      })
    } else {
      setFormData({
        part: "",
        title: "",
        instruction: "",
      })
    }
    setPhotoFile(null)
  }, [editingSection, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listeningId) return

    if (!formData.part.trim()) {
      setError("Bo'lim nomi majburiy")
      return
    }

    setLoading(true)
    setError("")

    try {
      const sectionData = new FormData()
      sectionData.append("part", formData.part)
      sectionData.append("listening_id", listeningId)

      if (formData.title.trim()) {
        sectionData.append("title", formData.title)
      }

      if (formData.instruction.trim()) {
        sectionData.append("instruction", formData.instruction)
      }

      if (photoFile) {
        sectionData.append("photo", photoFile)
      }

      if (editingSection) {
        await api.listeningQuestions.update(editingSection.id.toString(), sectionData)
      } else {
        await api.listeningQuestions.create(sectionData)
      }

      onSectionCreated()

      // Reset form
      setFormData({
        part: "",
        title: "",
        instruction: "",
      })
      setPhotoFile(null)
    } catch (error: any) {
      console.error("Failed to save listening section:", error)
      setError("Bo'lim saqlashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-green-400" />
            {editingSection ? "Listening Bo'limini Tahrirlash" : "Listening Bo'limi Qo'shish"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="part" className="text-slate-300 text-sm">
              Bo'lim Nomi *
            </Label>
            <Select value={formData.part} onValueChange={(value) => handleInputChange("part", value)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="PART1">PART1</SelectItem>
                <SelectItem value="PART2">PART2</SelectItem>
                <SelectItem value="PART3">PART3</SelectItem>
                <SelectItem value="PART4">PART4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300 text-sm">
              Sarlavha (ixtiyoriy)
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Section title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instruction" className="text-slate-300 text-sm">
              Ko'rsatma (ixtiyoriy)
            </Label>
            <Textarea
              id="instruction"
              value={formData.instruction}
              onChange={(e) => handleInputChange("instruction", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white resize-y"
              placeholder="Section instruction text"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Rasm (ixtiyoriy)</Label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-3">
              {photoFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 truncate">{photoFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhotoFile(null)}
                    className="text-red-400 hover:text-red-300 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-400 text-center">Rasm yuklash uchun bosing</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
              {loading ? "Saqlanmoqda..." : editingSection ? "Saqlash" : "Yaratish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
