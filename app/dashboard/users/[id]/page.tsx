"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Edit,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Trophy,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react"

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "blocked" | "pending"
  registeredAt: string
  lastLogin: string
  examsCompleted: number
  averageScore: number
  subscription: "free" | "premium" | "pro"
  avatar?: string
  bio?: string
  location?: string
  examHistory: {
    id: string
    examName: string
    score: number
    completedAt: string
    duration: number
  }[]
  statistics: {
    totalTimeSpent: number
    bestScore: number
    worstScore: number
    improvementRate: number
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserDetail = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      setLoading(false)
    }

    fetchUserDetail()
  }, [params.id])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      blocked: "bg-red-500/20 text-red-400 border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getSubscriptionBadge = (subscription: string) => {
    const variants = {
      free: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      premium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      pro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    }
    return variants[subscription as keyof typeof variants] || variants.free
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Foydalanuvchi ma'lumotlari yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Foydalanuvchi topilmadi</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Orqaga
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={getStatusBadge(user.status)}>
                    {user.status === "active" ? "Faol" : user.status === "blocked" ? "Bloklangan" : "Kutilmoqda"}
                  </Badge>
                  <Badge className={getSubscriptionBadge(user.subscription)}>
                    {user.subscription === "free" ? "Bepul" : user.subscription === "premium" ? "Premium" : "Pro"}
                  </Badge>
                  <span className="text-slate-400">ID: {user.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Tahrirlash
            </Button>
            {user.status === "active" ? (
              <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent">
                <Ban className="w-4 h-4 mr-2" />
                Bloklash
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 bg-transparent"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Faollashtirish
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Imtihonlar</p>
                  <p className="text-xl font-bold text-white">{user.examsCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">O'rtacha Ball</p>
                  <p className="text-xl font-bold text-white">{user.averageScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Eng Yuqori Ball</p>
                  <p className="text-xl font-bold text-white">{user.statistics.bestScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Vaqt</p>
                  <p className="text-xl font-bold text-white">{Math.round(user.statistics.totalTimeSpent / 60)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Umumiy Ma'lumot
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-slate-700">
              Imtihon Tarixi
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-slate-700">
              Statistika
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Sozlamalar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Shaxsiy Ma'lumotlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="text-white">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Telefon</p>
                      <p className="text-white">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Ro'yxatdan O'tgan</p>
                      <p className="text-white">{user.registeredAt}</p>
                    </div>
                  </div>
                  {user.location && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Joylashuv</p>
                      <p className="text-white">{user.location}</p>
                    </div>
                  )}
                  {user.bio && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Bio</p>
                      <p className="text-slate-300">{user.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Faollik Ma'lumotlari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Oxirgi Kirish</span>
                    <span className="text-white">{user.lastLogin}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Jami Imtihonlar</span>
                    <span className="text-white">{user.examsCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">O'sish Sur'ati</span>
                    <span className="text-emerald-400">+{user.statistics.improvementRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Eng Past Ball</span>
                    <span className="text-white">{user.statistics.worstScore}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exams">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Imtihon Tarixi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Imtihon Nomi</TableHead>
                        <TableHead className="text-slate-300">Ball</TableHead>
                        <TableHead className="text-slate-300">Vaqt</TableHead>
                        <TableHead className="text-slate-300">Sana</TableHead>
                        <TableHead className="text-slate-300">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.examHistory.map((exam) => (
                        <TableRow key={exam.id} className="border-slate-700">
                          <TableCell className="text-white">{exam.examName}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                exam.score >= 7
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : exam.score >= 6
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }
                            >
                              {exam.score}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{exam.duration} min</TableCell>
                          <TableCell className="text-slate-300">{exam.completedAt}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                              Batafsil
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Natijalar Statistikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">O'rtacha Ball</span>
                      <span className="text-white font-medium">{user.averageScore}/9.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Eng Yuqori Ball</span>
                      <span className="text-white font-medium">{user.statistics.bestScore}/9.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Eng Past Ball</span>
                      <span className="text-white font-medium">{user.statistics.worstScore}/9.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">O'sish Sur'ati</span>
                      <span className="text-emerald-400 font-medium">+{user.statistics.improvementRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Vaqt Statistikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Jami Vaqt</span>
                      <span className="text-white font-medium">{Math.round(user.statistics.totalTimeSpent / 60)}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">O'rtacha Vaqt</span>
                      <span className="text-white font-medium">
                        {Math.round(user.statistics.totalTimeSpent / user.examsCompleted)} min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Imtihonlar Soni</span>
                      <span className="text-white font-medium">{user.examsCompleted}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Foydalanuvchi Sozlamalari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Hisob Holati</h4>
                      <p className="text-sm text-slate-400">Foydalanuvchini faollashtirish yoki bloklash</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 bg-transparent">
                      Holatni O'zgartirish
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Obuna Turi</h4>
                      <p className="text-sm text-slate-400">Foydalanuvchi obunasini boshqarish</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 bg-transparent">
                      Obunani O'zgartirish
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Ma'lumotlarni Eksport</h4>
                      <p className="text-sm text-slate-400">Foydalanuvchi ma'lumotlarini yuklab olish</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 bg-transparent">
                      Eksport Qilish
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
