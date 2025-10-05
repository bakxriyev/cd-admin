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
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Upload, X, Eye, EyeOff } from "lucide-react"

interface Client {
  id: number
  full_name: string
  email: string
  phone_number: string
  balance: number
  location?: string
  mock_price?: number
  logo?: string
  created_at: string
  password?: string
}

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client | null
  mode: "create" | "edit" | "view"
}

export function ClientModal({ isOpen, onClose, onSuccess, client, mode }: ClientModalProps) {
  const [formData, setFormData] = useState({
    full_name: client?.full_name || "",
    email: client?.email || "",
    password: "",
    phone_number: client?.phone_number || "",
    balance: client?.balance || 0,
    location: client?.location || "",
    mock_price: client?.mock_price || 0,
  })
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(client?.logo || null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "balance" || name === "mock_price" ? Number(value) : value,
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogo(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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

    if (!formData.location.trim()) {
      toast.error("Location kiritilishi shart")
      setLoading(false)
      return
    }

    if (formData.mock_price <= 0) {
      toast.error("Mock price 0 dan katta bo'lishi kerak")
      setLoading(false)
      return
    }

    if (mode === "create" && !formData.password.trim()) {
      toast.error("Parol kiritilishi shart")
      setLoading(false)
      return
    }

    try {
      const submitData = new FormData()
      submitData.append("full_name", formData.full_name.trim())
      submitData.append("email", formData.email.trim())
      if (formData.password.trim()) {
        submitData.append("password", formData.password.trim())
      }
      submitData.append("phone_number", formData.phone_number.trim())
      submitData.append("balance", formData.balance.toString())
      submitData.append("location", formData.location.trim())
      submitData.append("mock_price", formData.mock_price.toString())
      if (logo) {
        submitData.append("logo", logo)
      }

      console.log("[v0] Sending client data:", {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        balance: formData.balance,
        location: formData.location.trim(),
        mock_price: formData.mock_price,
        hasPassword: !!formData.password.trim(),
        hasLogo: !!logo,
      })

      if (mode === "create") {
        await api.clients.create(submitData)
        toast.success("Mijoz muvaffaqiyatli yaratildi")
      } else if (mode === "edit" && client) {
        await api.clients.update(client.id, submitData)
        toast.success("Mijoz ma'lumotlari yangilandi")
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Client operation error:", error)
      toast.error(error.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const isViewMode = mode === "view"
  const title = mode === "create" ? "Yangi Mijoz" : mode === "edit" ? "Mijozni Tahrirlash" : "Mijoz Ma'lumotlari"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create" && "Yangi mijoz qo'shish uchun quyidagi ma'lumotlarni to'ldiring"}
            {mode === "edit" && "Mijoz ma'lumotlarini o'zgartiring"}
            {mode === "view" && "Mijoz haqida batafsil ma'lumot"}
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

          {mode === "view" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={client?.password || ""}
                  disabled
                  className="font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">Parol {mode === "edit" && "(bo'sh qoldiring, o'zgartirmaslik uchun)"}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required={mode === "create"}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Balans</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              min="0"
              step="0.01"
              value={formData.balance}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mock_price">Mock Price</Label>
            <Input
              id="mock_price"
              name="mock_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.mock_price}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
            />
          </div>

          {!isViewMode && (
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                  <Label
                    htmlFor="logo-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    Logo yuklash
                  </Label>
                </div>
                {logoPreview && (
                  <div className="relative">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isViewMode && client?.logo && (
            <div className="space-y-2">
              <Label>Logo</Label>
              <img
                src={client.logo || "/placeholder.svg"}
                alt="Client logo"
                className="w-20 h-20 object-cover rounded-lg border"
              />
            </div>
          )}

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
