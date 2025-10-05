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
  Building,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react"

interface PartnerDetail {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: "active" | "inactive" | "pending"
  balance: number
  commission: number
  registeredAt: string
  lastActivity: string
  studentsReferred: number
  totalEarnings: number
  avatar?: string
  location?: string
  bio?: string
  referralHistory: {
    id: string
    studentName: string
    examName: string
    earnings: number
    date: string
  }[]
  statistics: {
    monthlyEarnings: number
    conversionRate: number
    averageEarningsPerStudent: number
    topExamType: string
  }
}

export default function PartnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [partner, setPartner] = useState<PartnerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartnerDetail = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock data - replace with actual API call
      const mockPartner: PartnerDetail = {
        id: params.id as string,
        name: "Jasur Abdullayev",
        email: "jasur.abdullayev@company.com",
        phone: "+998901234567",
        company: "EduCenter Tashkent",
        status: "active",
        balance: 2500.0,
        commission: 15,
        registeredAt: "2024-01-10",
        lastActivity: "2024-01-20",
        studentsReferred: 45,
        totalEarnings: 6750.0,
        location: "Toshkent, O'zbekiston",
        bio: "10 yildan ortiq tajribaga ega IELTS o'qituvchisi. O'z markazida 500 dan ortiq talabalarni muvaffaqiyatli tayyorlagan.",
        referralHistory: [
          {
            id: "1",
            studentName: "Aziz Karimov",
            examName: "IELTS Academic Writing",
            earnings: 45.0,
            date: "2024-01-20",
          },
          {
            id: "2",
            studentName: "Malika Tosheva",
            examName: "IELTS General Training",
            earnings: 30.0,
            date: "2024-01-18",
          },
          {
            id: "3",
            studentName: "Bobur Aliyev",
            examName: "IELTS Listening Test",
            earnings: 25.0,
            date: "2024-01-15",
          },
        ],
        statistics: {
          monthlyEarnings: 1250.0,
          conversionRate: 78.5,
          averageEarningsPerStudent: 150.0,
          topExamType: "IELTS Academic",
        },
      }

      setPartner(mockPartner)
      setLoading(false)
    }

    fetchPartnerDetail()
  }, [params.id])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      inactive: "bg-red-500/20 text-red-400 border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    }
    return variants[status as keyof typeof variants] || variants.pending
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
          <div className="text-white">Hamkor ma'lumotlari yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Hamkor topilmadi</div>
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
                <AvatarImage src={partner.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-lg">
                  {getInitials(partner.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">{partner.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={getStatusBadge(partner.status)}>
                    {partner.status === "active" ? "Faol" : partner.status === "inactive" ? "Nofaol" : "Kutilmoqda"}
                  </Badge>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Building className="w-4 h-4" />
                    <span>{partner.company}</span>
                  </div>
                  <span className="text-slate-400">ID: {partner.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Tahrirlash
            </Button>
            {partner.status === "active" ? (
              <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent">
                <Ban className="w-4 h-4 mr-2" />
                Nofaollashtirish
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
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Joriy Balans</p>
                  <p className="text-xl font-bold text-white">${partner.balance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Talabalar</p>
                  <p className="text-xl font-bold text-white">{partner.studentsReferred}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Daromad</p>
                  <p className="text-xl font-bold text-white">${partner.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Komissiya</p>
                  <p className="text-xl font-bold text-white">{partner.commission}%</p>
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
            <TabsTrigger value="referrals" className="data-[state=active]:bg-slate-700">
              Taklif Tarixi
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
                      <p className="text-white">{partner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Telefon</p>
                      <p className="text-white">{partner.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Kompaniya</p>
                      <p className="text-white">{partner.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Joylashuv</p>
                      <p className="text-white">{partner.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Ro'yxatdan O'tgan</p>
                      <p className="text-white">{partner.registeredAt}</p>
                    </div>
                  </div>
                  {partner.bio && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Bio</p>
                      <p className="text-slate-300">{partner.bio}</p>
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
                    <span className="text-slate-400">Oxirgi Faollik</span>
                    <span className="text-white">{partner.lastActivity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Oylik Daromad</span>
                    <span className="text-emerald-400">${partner.statistics.monthlyEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Konversiya Darajasi</span>
                    <span className="text-white">{partner.statistics.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">O'rtacha Daromad</span>
                    <span className="text-white">${partner.statistics.averageEarningsPerStudent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Eng Ko'p Imtihon</span>
                    <span className="text-white">{partner.statistics.topExamType}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Taklif Tarixi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Talaba</TableHead>
                        <TableHead className="text-slate-300">Imtihon</TableHead>
                        <TableHead className="text-slate-300">Daromad</TableHead>
                        <TableHead className="text-slate-300">Sana</TableHead>
                        <TableHead className="text-slate-300">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partner.referralHistory.map((referral) => (
                        <TableRow key={referral.id} className="border-slate-700">
                          <TableCell className="text-white">{referral.studentName}</TableCell>
                          <TableCell className="text-slate-300">{referral.examName}</TableCell>
                          <TableCell className="text-emerald-400 font-medium">
                            ${referral.earnings.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-slate-300">{referral.date}</TableCell>
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
                  <CardTitle className="text-white">Daromad Statistikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Jami Daromad</span>
                      <span className="text-white font-medium">${partner.totalEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Oylik Daromad</span>
                      <span className="text-white font-medium">${partner.statistics.monthlyEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">O'rtacha Daromad</span>
                      <span className="text-white font-medium">
                        ${partner.statistics.averageEarningsPerStudent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Komissiya Darajasi</span>
                      <span className="text-white font-medium">{partner.commission}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Faollik Statistikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Jami Talabalar</span>
                      <span className="text-white font-medium">{partner.studentsReferred}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Konversiya Darajasi</span>
                      <span className="text-white font-medium">{partner.statistics.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Eng Ko'p Imtihon</span>
                      <span className="text-white font-medium">{partner.statistics.topExamType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Joriy Balans</span>
                      <span className="text-emerald-400 font-medium">${partner.balance.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Hamkor Sozlamalari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Hamkor Holati</h4>
                      <p className="text-sm text-slate-400">Hamkorni faollashtirish yoki nofaollashtirish</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 bg-transparent">
                      Holatni O'zgartirish
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Komissiya Darajasi</h4>
                      <p className="text-sm text-slate-400">Hamkor komissiyasini sozlash</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 bg-transparent">
                      Komissiyani O'zgartirish
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Balans To'ldirish</h4>
                      <p className="text-sm text-slate-400">Hamkor balansini boshqarish</p>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 bg-transparent">
                      Balansni Boshqarish
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
