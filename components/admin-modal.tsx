"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface Admin {
  id: number
  full_name: string
  email: string
  password: string
  phone_number: string
  created_at: string
}

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  admin?: Admin | null
  mode: "create" | "edit" | "view"
}

export function AdminModal({ isOpen, onClose, onSuccess, admin, mode }: AdminModalProps) {
  const [formData, setFormData] = useState({
    full_name: admin?.full_name || "",
    email: admin?.email || "",
    password: "",
    phone_number: admin?.phone_number || "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.full_name.trim()) {
        toast.error("To'liq ism kiritilishi shart")
        setLoading(false)
        return
      }

      if (!formData.email.trim()) {
        toast.error("Email kiritilishi shart")
        setLoading(false)
        return
      }

      if (!formData.phone_number.trim()) {
        toast.error("Telefon raqami kiritilishi shart")
        setLoading(false)
        return
      }

      if (mode === "create" && !formData.password.trim()) {
        toast.error("Parol kiritilishi shart")
        setLoading(false)
        return
      }

      const submitData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        ...(formData.password.trim() && { password: formData.password.trim() }),
      }

      console.log("[v0] Form data before submit:", formData)
      console.log("[v0] Submit data being sent:", submitData)

      if (mode === "create") {
        console.log("[v0] Creating admin with data:", {
          ...submitData,
          password: formData.password.trim(),
        })
        await api.admins.create({
          ...submitData,
          password: formData.password.trim(),
        })
        toast.success("Admin muvaffaqiyatli yaratildi")
      } else if (mode === "edit" && admin) {
        console.log("[v0] Updating admin with data:", submitData)
        await api.admins.update(admin.id, submitData)
        toast.success("Admin ma'lumotlari yangilandi")
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Admin operation error:", error)
      console.error("[v0] Error details:", error.response || error.message)

      if (error.message && typeof error.message === "object") {
        const errorMessages = Array.isArray(error.message) ? error.message : [error.message]
        toast.error(errorMessages.join(", "))
      } else {
        toast.error(error.message || "Xatolik yuz berdi")
      }
    } finally {
      setLoading(false)
    }
  }

  const isViewMode = mode === "view"
  const title = mode === "create" ? "Yangi Admin" : mode === "edit" ? "Adminni Tahrirlash" : "Admin Ma'lumotlari"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create" && "Yangi admin qo'shish uchun quyidagi ma'lumotlarni to'ldiring"}
            {mode === "edit" && "Admin ma'lumotlarini o'zgartiring"}
            {mode === "view" && "Admin haqida batafsil ma'lumot"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">To'liq Ism</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
            />
          </div>

          {mode !== "view" && (
            <div className="space-y-2">
              <Label htmlFor="password">Parol {mode === "edit" && "(bo'sh qoldiring, o'zgartirmaslik uchun)"}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required={mode === "create"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {mode === "view" && admin && (
            <div className="space-y-2">
              <Label>Parol</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={admin.password} disabled className="pr-10" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone_number">Telefon Raqami</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
            />
          </div>

          {!isViewMode && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saqlanmoqda..." : mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
