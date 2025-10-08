"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Exam } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface EditExamModalProps {
  isOpen: boolean
  onClose: () => void
  exam: Exam
  onExamUpdated: () => void
}

export function EditExamModal({ isOpen, onClose, exam, onExamUpdated }: EditExamModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || "",
        description: exam.description || "",
        duration: exam.duration?.toString() || "",
        password: exam.password || "",
      })
    }
  }, [exam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title.trim()) {
      setError("Imtihon nomini kiriting")
      return
    }

    if (!formData.duration || Number.parseInt(formData.duration) <= 0) {
      setError("To'g'ri davomiylikni kiriting")
      return
    }

    if (!formData.password.trim()) {
      setError("Parolni kiriting")
      return
    }

    setLoading(true)
    try {
      await api.exams.update(exam.id.toString(), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number.parseInt(formData.duration),
        password: formData.password.trim(),
      })
      onExamUpdated()
      onClose()
    } catch (error: any) {
      console.error("Failed to update exam:", error)
      setError(error.message || "Imtihonni yangilashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Imtihonni Tahrirlash</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Imtihon Nomi *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masalan: IELTS Mock Test 1"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Tavsif
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Imtihon haqida qisqacha ma'lumot"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-slate-300">
                Davomiyligi (daqiqa) *
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="150"
                min="1"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Parol *
              </Label>
              <Input
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="mock123"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-slate-600 bg-transparent"
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
