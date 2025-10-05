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
import { Upload, X } from "lucide-react"

interface Client {
  id: number
  full_name: string
  email: string
  phone_number: string
  balance: number
  logo?: string
  created_at: string
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
  })
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(client?.logo || null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "balance" ? Number(value) : value,
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

    try {
      const submitData = new FormData()
      submitData.append("full_name", formData.full_name)
      submitData.append("email", formData.email)
      if (formData.password) {
        submitData.append("password", formData.password)
      }
      submitData.append("phone_number", formData.phone_number)
      submitData.append("balance", formData.balance.toString())
      if (logo) {
        submitData.append("logo", logo)
      }

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
      console.error("Client operation error:", error)
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

          {mode !== "view" && (
            <div className="space-y-2">
              <Label htmlFor="password">Parol {mode === "edit" && "(bo'sh qoldiring, o'zgartirmaslik uchun)"}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={mode === "create"}
              />
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
