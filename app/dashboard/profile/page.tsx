"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, secureStorage, USER_DATA_KEY, USER_TYPE_KEY, AUTH_TOKEN_KEY } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Shield, User, Phone, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ProfilePage() {
  const router = useRouter()
  const [userType, setUserType] = useState<string>("")
  const [userData, setUserData] = useState<any>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [step, setStep] = useState<"email" | "verify">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const type = secureStorage.getItem(USER_TYPE_KEY)
    const data = secureStorage.getItem(USER_DATA_KEY)

    if (!type || !data) {
      router.push("/")
      return
    }

    setUserType(type)
    setUserData(JSON.parse(data))
  }, [router])

  const handleSendOtp = async () => {
    if (!email) {
      setError("Email kiriting")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (userType === "admin" || userType === "superadmin") {
        await api.otp.sendAdminOtp(email)
      } else {
        await api.otp.sendClientOtp(email)
      }

      setSuccess("Tasdiqlash kodi emailingizga yuborildi")
      setStep("verify")
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || !newPassword) {
      setError("Barcha maydonlarni to'ldiring")
      return
    }

    if (newPassword.length < 5) {
      setError("Parol kamida 5 ta belgidan iborat bo'lishi kerak")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (userType === "admin" || userType === "superadmin") {
        await api.otp.verifyAdminOtp(email, otp, newPassword)
      } else {
        await api.otp.verifyClientOtp(email, otp, newPassword)
      }

      setSuccess("Parol muvaffaqiyatli o'zgartirildi! 3 soniyadan keyin tizimdan chiqasiz...")

      // Wait 3 seconds, then logout and redirect
      setTimeout(() => {
        // Clear all auth data
        secureStorage.removeItem(AUTH_TOKEN_KEY)
        secureStorage.removeItem(USER_DATA_KEY)
        secureStorage.removeItem(USER_TYPE_KEY)

        // Redirect to login page
        router.push("/")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep("email")
    setEmail("")
    setOtp("")
    setNewPassword("")
    setError("")
    setSuccess("")
    setShowPassword(false)
  }

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Profil Sozlamalari</h1>
          <p className="text-slate-400 mt-2">Sizning hisob ma'lumotlaringiz</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Shaxsiy Ma'lumotlar
            </CardTitle>
            <CardDescription className="text-slate-400">Sizning hisob ma'lumotlaringiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  To'liq Ism
                </Label>
                <Input
                  value={userData.full_name || userData.name || ""}
                  disabled
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input value={userData.email || ""} disabled className="bg-slate-700/50 border-slate-600 text-white" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon
                </Label>
                <Input
                  value={userData.phone_number || ""}
                  disabled
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              {(userType === "admin" || userType === "superadmin") && (
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Rol
                  </Label>
                  <Input
                    value={userData.role || userType}
                    disabled
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              )}

              {userType === "client" && userData.location && (
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Manzil
                  </Label>
                  <Input value={userData.location} disabled className="bg-slate-700/50 border-slate-600 text-white" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Xavfsizlik
            </CardTitle>
            <CardDescription className="text-slate-400">Parolingizni o'zgartiring</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPasswordModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Lock className="w-4 h-4 mr-2" />
              Parolni O'zgartirish
            </Button>
          </CardContent>
        </Card>

        <Dialog
          open={showPasswordModal}
          onOpenChange={(open) => {
            setShowPasswordModal(open)
            if (!open) resetModal()
          }}
        >
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Parolni O'zgartirish</DialogTitle>
              <DialogDescription className="text-slate-400">
                {step === "email"
                  ? "Emailingizga tasdiqlash kodi yuboriladi"
                  : "Tasdiqlash kodini kiriting va yangi parol o'rnating"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {step === "email" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="bg-slate-700 border-slate-600 text-white pl-10"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg text-sm">
                      {success}
                    </div>
                  )}

                  <Button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Yuborilmoqda..." : "Tasdiqlash Kodini Yuborish"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tasdiqlash Kodi</Label>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="bg-slate-700 border-slate-600 text-white"
                      maxLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Yangi Parol</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yangi parol"
                        className="bg-slate-700 border-slate-600 text-white pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg text-sm">
                      {success}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setStep("email")
                        setOtp("")
                        setNewPassword("")
                        setError("")
                        setSuccess("")
                      }}
                      variant="outline"
                      className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      Orqaga
                    </Button>
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
