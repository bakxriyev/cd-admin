"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Eye, Loader2, Upload, Zap } from "lucide-react"
import { api, type User, type Admin, type Client, secureStorage, USER_DATA_KEY } from "@/lib/api"
import { toast } from "sonner"
import { InsufficientBalanceModal } from "./balance-modal"

interface UserModalProps {
  mode: "create" | "edit" | "view"
  user?: User | Admin | Client
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function UserModal({ mode, user, trigger, onSuccess }: UserModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<"user" | "admin" | "client">("user")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [quickCreateUserId, setQuickCreateUserId] = useState<string>("")
  const [currentUserData, setCurrentUserData] = useState<any>(null)
  const [insufficientBalanceOpen, setInsufficientBalanceOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    full_name: "",
    email: "",
    username: "",
    password: "",
    phone_number: "",
    balance: 0,
  })

  const fetchFreshClientData = async () => {
    const userData = secureStorage.getItem(USER_DATA_KEY)
    if (!userData) return

    const user = JSON.parse(userData)

    if (user.type === "client" && user.id) {
      try {
        const freshData = await api.clients.getById(user.id)
        const updatedUser = {
          ...user,
          balance: freshData.balance,
          mock_price: freshData.mock_price,
        }
        secureStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser))
        setCurrentUserData(updatedUser)
        window.dispatchEvent(new Event("balanceUpdated"))
      } catch (error) {
        console.error("[v0] Failed to fetch fresh client data:", error)
      }
    } else {
      setCurrentUserData(user)
    }
  }

  const refreshCurrentUserData = () => {
    const userData = secureStorage.getItem(USER_DATA_KEY)
    if (userData) {
      setCurrentUserData(JSON.parse(userData))
    }
  }

  useEffect(() => {
    refreshCurrentUserData()

    const handleBalanceUpdate = () => {
      refreshCurrentUserData()
    }

    window.addEventListener("balanceUpdated", handleBalanceUpdate)

    return () => {
      window.removeEventListener("balanceUpdated", handleBalanceUpdate)
    }
  }, [])

  useEffect(() => {
    if (user && (mode === "edit" || mode === "view")) {
      if ("full_name" in user) {
        setFormData({
          name: "",
          full_name: user.full_name,
          email: user.email,
          username: "",
          password: "",
          phone_number: user.phone_number,
          balance: "balance" in user ? user.balance : 0,
        })
        setUserType("balance" in user ? "client" : "admin")
      } else {
        setFormData({
          name: user.name,
          full_name: "",
          email: user.email,
          username: user.username,
          password: "",
          phone_number: "",
          balance: 0,
        })
        setUserType("user")
      }
    } else {
      setFormData({
        name: "",
        full_name: "",
        email: "",
        username: "",
        password: "",
        phone_number: "",
        balance: 0,
      })
      setUserType("user")
    }
  }, [user, mode, open])

  const canCreateUser = () => {
    const freshUserData = secureStorage.getItem(USER_DATA_KEY)
    const userData = freshUserData ? JSON.parse(freshUserData) : null

    if (!userData || userData.type !== "client") {
      return true
    }
    const balance = userData.balance || 0
    const mockPrice = userData.mock_price || 0
    return balance >= mockPrice
  }

  const handleOpenModal = async () => {
    if (mode === "create") {
      await fetchFreshClientData()

      if (!canCreateUser()) {
        setInsufficientBalanceOpen(true)
        return
      }
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "view") return

    if (mode === "create" && userType === "user") {
      await fetchFreshClientData()

      if (!canCreateUser()) {
        setOpen(false)
        setInsufficientBalanceOpen(true)
        return
      }
    }

    setLoading(true)
    try {
      const currentUserData = secureStorage.getItem(USER_DATA_KEY)
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null

      let location = "REI"
      if (currentUser?.type === "client" && currentUser?.location) {
        location = currentUser.location
      }

      if (mode === "create") {
        if (userType === "admin") {
          await api.admins.create({
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone_number,
          })
          toast.success("Admin muvaffaqiyatli yaratildi")
        } else if (userType === "client") {
          const clientFormData = new FormData()
          clientFormData.append("full_name", formData.full_name)
          clientFormData.append("email", formData.email)
          clientFormData.append("password", formData.password)
          clientFormData.append("phone_number", formData.phone_number)
          clientFormData.append("balance", formData.balance.toString())
          if (logoFile) {
            clientFormData.append("logo", logoFile)
          }
          await api.clients.create(clientFormData)
          toast.success("Mijoz muvaffaqiyatli yaratildi")
        } else {
          if (currentUser?.type === "client") {
            const currentBalance = currentUser.balance || 0
            const mockPrice = currentUser.mock_price || 0

            if (currentBalance < mockPrice) {
              setLoading(false)
              setOpen(false)
              setInsufficientBalanceOpen(true)
              return
            }
          }

          const userData = {
            name: formData.name,
            email: formData.email,
            username: formData.username,
            password: formData.password,
            location: location,
          }

          await api.users.create(userData)

          if (currentUser?.type === "client" && currentUser?.mock_price) {
            const newBalance = currentUser.balance - currentUser.mock_price
            const updateData = new FormData()
            updateData.append("balance", newBalance.toString())

            await api.clients.update(currentUser.id, updateData)

            currentUser.balance = newBalance
            secureStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser))

            window.dispatchEvent(new Event("balanceUpdated"))

            toast.success(`User yaratildi. Yangi balans: $${newBalance.toFixed(2)}`)
          } else {
            toast.success("User muvaffaqiyatli yaratildi")
          }
        }
      } else if (mode === "edit" && user) {
        if ("full_name" in user) {
          if ("balance" in user) {
            const clientFormData = new FormData()
            clientFormData.append("full_name", formData.full_name)
            clientFormData.append("email", formData.email)
            if (formData.password) {
              clientFormData.append("password", formData.password)
            }
            clientFormData.append("phone_number", formData.phone_number)
            clientFormData.append("balance", formData.balance.toString())
            if (logoFile) {
              clientFormData.append("logo", logoFile)
            }
            await api.clients.update(user.id, clientFormData)
          } else {
            await api.admins.update(user.id, {
              full_name: formData.full_name,
              email: formData.email,
              ...(formData.password && { password: formData.password }),
              phone_number: formData.phone_number,
            })
          }
        } else {
          await api.users.update(user.id, {
            name: formData.name,
            email: formData.email,
            username: formData.username,
            ...(formData.password && { password: formData.password }),
          })
        }
      }

      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("User operation failed:", error)
      toast.error(error.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCreate = async () => {
    await fetchFreshClientData()

    if (!canCreateUser()) {
      setInsufficientBalanceOpen(true)
      return
    }

    setLoading(true)
    try {
      const currentUserData = secureStorage.getItem(USER_DATA_KEY)
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null

      if (currentUser?.type === "client") {
        const currentBalance = currentUser.balance || 0
        const mockPrice = currentUser.mock_price || 0

        if (currentBalance < mockPrice) {
          setLoading(false)
          setInsufficientBalanceOpen(true)
          return
        }
      }

      let location = "REI"
      if (currentUser?.type === "client" && currentUser?.location) {
        location = currentUser.location
      }

      const randomId = Math.random().toString(36).substring(2, 10)
      const userData = {
        name: `User_${randomId}`,
        email: `user_${randomId}@temp.com`,
        username: `user_${randomId}`,
        password: `pass_${randomId}`,
        location: location,
      }

      const response = await api.users.create(userData)

      if (currentUser?.type === "client" && currentUser?.mock_price) {
        const newBalance = currentUser.balance - currentUser.mock_price
        const updateData = new FormData()
        updateData.append("balance", newBalance.toString())

        await api.clients.update(currentUser.id, updateData)

        currentUser.balance = newBalance
        secureStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser))

        window.dispatchEvent(new Event("balanceUpdated"))
      }

      setQuickCreateUserId(response.id || randomId)
      setQuickCreateOpen(true)
      onSuccess?.()
    } catch (error: any) {
      console.error("Quick create failed:", error)
      toast.error(error.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Yangi Foydalanuvchi Yaratish"
      case "edit":
        return "Foydalanuvchini Tahrirlash"
      case "view":
        return "Foydalanuvchi Ma'lumotlari"
      default:
        return ""
    }
  }

  const defaultTrigger = (
    <div className="flex gap-2">
      {mode === "create" ? (
        <>
          <Button size="sm" onClick={handleOpenModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Yangi Foydalanuvchi
          </Button>
          <Button
            size="sm"
            onClick={handleQuickCreate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Tez Yaratish
          </Button>
        </>
      ) : (
        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
          {mode === "edit" && <Edit className="w-4 h-4" />}
          {mode === "view" && <Eye className="w-4 h-4" />}
        </Button>
      )}
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {mode !== "create" && <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>}
        {mode === "create" && (trigger || defaultTrigger)}
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{getTitle()}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="userType" className="text-slate-300">
                  Foydalanuvchi Turi
                </Label>
                <Select value={userType} onValueChange={(value: "user" | "admin" | "client") => setUserType(value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="user" className="text-white hover:bg-slate-700">
                      Oddiy Foydalanuvchi
                    </SelectItem>
                    <SelectItem value="admin" className="text-white hover:bg-slate-700">
                      Admin
                    </SelectItem>
                    <SelectItem value="client" className="text-white hover:bg-slate-700">
                      Mijoz
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {userType === "user" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Ism
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={mode === "view"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={mode === "view"}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-300">
                    To'liq Ism
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={mode === "view"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-slate-300">
                    Telefon Raqami
                  </Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={mode === "view"}
                    required
                  />
                </div>

                {userType === "client" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="balance" className="text-slate-300">
                        Balans
                      </Label>
                      <Input
                        id="balance"
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        disabled={mode === "view"}
                        required
                      />
                    </div>

                    {mode !== "view" && (
                      <div className="space-y-2">
                        <Label htmlFor="logo" className="text-slate-300">
                          Logo (ixtiyoriy)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                            className="bg-slate-700/50 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                          />
                          <Upload className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
                disabled={mode === "view"}
                required
              />
            </div>

            {mode !== "view" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  {mode === "create" ? "Parol" : "Yangi Parol (ixtiyoriy)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required={mode === "create"}
                />
              </div>
            )}

            {user && mode === "view" && (
              <div className="space-y-2">
                <Label className="text-slate-300">Ro'yxatdan O'tgan</Label>
                <div className="text-slate-400">{new Date(user.created_at).toLocaleString("uz-UZ")}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {mode === "view" ? "Yopish" : "Bekor qilish"}
              </Button>
              {mode !== "view" && (
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mode === "create" ? "Yaratish" : "Saqlash"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">User Yaratildi</DialogTitle>
            <DialogDescription className="text-slate-400">User muvaffaqiyatli yaratildi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <Label className="text-slate-300">User ID</Label>
              <div className="text-2xl font-bold text-emerald-400 mt-2">{quickCreateUserId}</div>
            </div>
            <Button
              onClick={() => setQuickCreateOpen(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Yopish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InsufficientBalanceModal
        open={insufficientBalanceOpen}
        onOpenChange={setInsufficientBalanceOpen}
        currentBalance={currentUserData?.balance || 0}
        requiredAmount={currentUserData?.mock_price || 0}
      />
    </>
  )
}
