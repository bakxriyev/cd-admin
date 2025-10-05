"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, ArrowRight, Shield, Users } from "lucide-react"
import { api, secureStorage, AUTH_TOKEN_KEY, USER_DATA_KEY, USER_TYPE_KEY } from "@/lib/api"

export default function LoginPage() {
  const [step, setStep] = useState<"select" | "login">("select")
  const [userType, setUserType] = useState<"admin" | "client">("admin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Login page mounted, step:", step)
  }, [step])

  const handleUserTypeSelect = () => {
    console.log("[v0] User type selected:", userType)
    setStep("login")
    setError("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login attempt started for:", userType)
    setIsLoading(true)
    setError("")

    try {
      let response
      let userData

      if (userType === "admin") {
        response = await api.auth.adminLogin({ email, password })
        userData = {
          id: response.admin.id,
          full_name: response.admin.full_name,
          email: response.admin.email,
          phone_number: response.admin.phone_number,
          type: "admin",
          role: response.admin.type || "admin", // admin or superadmin from type field
        }
      } else {
        response = await api.auth.clientLogin({ email, password })
        userData = {
          id: response.client.id,
          full_name: response.client.full_name,
          email: response.client.email,
          phone_number: response.client.phone_number,
          balance: response.client.balance,
          logo: response.client.logo,
          location: response.client.location,
          mock_price: response.client.mock_price,
          type: "client",
        }
      }

      if (response.accessToken) {
        console.log("[v0] Login successful, saving token and redirecting")
        secureStorage.setItem(AUTH_TOKEN_KEY, response.accessToken)
        secureStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
        secureStorage.setItem(USER_TYPE_KEY, userType)

        setIsLoading(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } else {
        setError("Autentifikatsiya xatosi")
      }
    } catch (error: any) {
      console.error("[v0] Login error:", error)

      if (error.message.includes("401")) {
        setError("Noto'g'ri email yoki parol")
      } else if (error.message.includes("500")) {
        setError("Server xatosi. Keyinroq urinib ko'ring")
      } else {
        setError("Kirish jarayonida xatolik yuz berdi")
      }
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    console.log("[v0] Going back to user type selection")
    setStep("select")
    setEmail("")
    setPassword("")
    setError("")
  }

  console.log("[v0] Login page rendering, step:", step, "userType:", userType)

  if (step === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">RealExamIELTS</CardTitle>
              <CardDescription className="text-slate-400">Kirish turini tanlang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-slate-300 text-base">Siz kimsiz?</Label>

                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userType === "admin"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value="admin"
                      checked={userType === "admin"}
                      onChange={(e) => setUserType(e.target.value as "admin")}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <Shield className="w-6 h-6 text-emerald-400" />
                      <div>
                        <div className="text-white font-medium">Admin</div>
                        <div className="text-sm text-slate-400">Tizim administratori</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        userType === "admin" ? "border-emerald-500 bg-emerald-500" : "border-slate-400"
                      }`}
                    >
                      {userType === "admin" && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userType === "client"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value="client"
                      checked={userType === "client"}
                      onChange={(e) => setUserType(e.target.value as "client")}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <Users className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">Mijoz</div>
                        <div className="text-sm text-slate-400">Tizim foydalanuvchisi</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        userType === "client" ? "border-emerald-500 bg-emerald-500" : "border-slate-400"
                      }`}
                    >
                      {userType === "client" && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                    </div>
                  </label>
                </div>
              </div>

              <Button onClick={handleUserTypeSelect} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Davom etish
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
              {userType === "admin" ? (
                <Shield className="w-6 h-6 text-white" />
              ) : (
                <Users className="w-6 h-6 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {userType === "admin" ? "Admin" : "Mijoz"} Kirish
            </CardTitle>
            <CardDescription className="text-slate-400">
              {userType === "admin" ? "Admin" : "Mijoz"} ma'lumotlaringizni kiriting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email kiriting"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Parol
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Parol kiriting"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  disabled={isLoading}
                >
                  Orqaga
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Kirish...
                    </div>
                  ) : (
                    "Kirish"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
