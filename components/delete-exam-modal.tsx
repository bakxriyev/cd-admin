"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Eye, EyeOff } from "lucide-react"
import { api, secureStorage, USER_DATA_KEY } from "@/lib/api"

interface DeleteExamModalProps {
  isOpen: boolean
  onClose: () => void
  examId: string
  examTitle: string
  onExamDeleted: () => void
}

export function DeleteExamModal({ isOpen, onClose, examId, examTitle, onExamDeleted }: DeleteExamModalProps) {
  const [step, setStep] = useState<"confirm" | "password">("confirm")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleConfirm = () => {
    setStep("password")
    setError("")
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get current user data
      const userDataStr = secureStorage.getItem(USER_DATA_KEY)
      if (!userDataStr) {
        setError("Foydalanuvchi ma'lumotlari topilmadi")
        setLoading(false)
        return
      }

      const userData = JSON.parse(userDataStr)
      const userId = userData.id

      // Fetch admin data to verify password
      const adminData = await api.admins.getById(userId.toString())

      // Compare passwords
      if (adminData.password !== password) {
        setError("Parol noto'g'ri. Iltimos, qaytadan urinib ko'ring.")
        setLoading(false)
        return
      }

      // Delete exam
      await api.exams.delete(examId)

      // Success
      onExamDeleted()
      handleClose()
    } catch (error: any) {
      console.error("Failed to delete exam:", error)
      setError(error.message || "Imtihonni o'chirishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("confirm")
    setPassword("")
    setShowPassword(false)
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Imtihonni O'chirish
          </DialogTitle>
        </DialogHeader>

        {step === "confirm" ? (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-slate-200 leading-relaxed">
                Siz <span className="font-bold text-white">"{examTitle}"</span> imtihonini o'chirmoqchisiz. Bu amaldan
                qaytarib bo'lmaydi.
              </p>
            </div>

            <p className="text-slate-300 text-sm">Davom etishni xohlaysizmi?</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                Bekor qilish
              </Button>
              <Button type="button" onClick={handleConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Ha, o'chirish
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-slate-200 text-sm leading-relaxed">Tasdiqlash uchun hisob parolingizni kiriting</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Parol
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                  placeholder="Parolingizni kiriting"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                disabled={loading}
              >
                Bekor qilish
              </Button>
              <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                {loading ? "O'chirilmoqda..." : "O'chirish"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
