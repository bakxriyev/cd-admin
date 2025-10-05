"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, UserCheck, CreditCard, ClipboardCheck, TrendingUp, Activity } from "lucide-react"
import { api, type Client, secureStorage, USER_DATA_KEY, USER_TYPE_KEY } from "@/lib/api"

interface DashboardStats {
  totalUsers: number
  activeExams: number
  totalClients: number
  totalBalance: number
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [userType, setUserType] = useState<string>("")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeExams: 0,
    totalClients: 0,
    totalBalance: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const validateAuth = () => {
      if (!api.auth.validateToken()) {
        router.push("/")
        return
      }

      const userData = secureStorage.getItem(USER_DATA_KEY)
      const type = secureStorage.getItem(USER_TYPE_KEY)

      if (userData && type) {
        const user = JSON.parse(userData)
        setUserType(type)
        setIsAuthenticated(true)

        if (type === "admin") {
          setUserRole(user.role || "admin")
        } else {
          setUserRole("client")
        }
        setLoading(false)
      } else {
        router.push("/")
      }
    }

    validateAuth()
  }, [router])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isAuthenticated) return

      setLoading(true)
      try {
        // Fetch data from all endpoints
        const promises = []

        promises.push(api.users.getAll().catch(() => []))
        promises.push(api.exams.getAll().catch(() => []))

        // Only superadmin can see clients data
        if (userType === "admin" && userRole === "superadmin") {
          promises.push(api.clients.getAll().catch(() => []))
        } else {
          promises.push(Promise.resolve([]))
        }

        const [usersData, examsData, clientsData] = await Promise.all(promises)

        // Calculate total balance from clients
        const totalBalance = clientsData.reduce((sum: number, client: Client) => sum + client.balance, 0)

        setStats({
          totalUsers: usersData.length,
          activeExams: examsData.length,
          totalClients: clientsData.length,
          totalBalance: totalBalance,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [isAuthenticated, userType, userRole])

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Yuklanmoqda...</div>
          <div className="text-slate-400 text-sm mt-2">Dashboard tayyorlanmoqda</div>
        </div>
      </div>
    )
  }

  const getFilteredStatsCards = () => {
    const baseCards = [
      {
        title: "Jami Foydalanuvchilar",
        value: loading ? "..." : stats.totalUsers.toString(),
        change: "+12%",
        icon: Users,
        color: "text-blue-400",
      },
      {
        title: "Faol Imtihonlar",
        value: loading ? "..." : stats.activeExams.toString(),
        change: "+8%",
        icon: FileText,
        color: "text-emerald-400",
      },
    ]

    // Only superadmin sees client and balance stats
    if (userType === "admin" && userRole === "superadmin") {
      baseCards.push(
        {
          title: "Mijozlar",
          value: loading ? "..." : stats.totalClients.toString(),
          change: "+3%",
          icon: UserCheck,
          color: "text-purple-400",
        },
        {
          title: "Jami Balans",
          value: loading ? "..." : `$${stats.totalBalance.toFixed(2)}`,
          change: "+15%",
          icon: CreditCard,
          color: "text-yellow-400",
        },
      )
    }

    return baseCards
  }

  const statsCards = getFilteredStatsCards()

  const getFilteredQuickActions = () => {
    const baseActions = [
      {
        title: "Yangi Imtihon",
        description: "Imtihon yaratish",
        icon: FileText,
        color: "text-emerald-400",
        onClick: () => router.push("/dashboard/exams"),
      },
      {
        title: "Baholash",
        description: "Writing baholash",
        icon: ClipboardCheck,
        color: "text-purple-400",
        onClick: () => router.push("/dashboard/assessment"),
      },
    ]

    // Only superadmin gets access to client and balance actions
    if (userType === "admin" && userRole === "superadmin") {
      baseActions.push(
        {
          title: "Mijoz Qo'shish",
          description: "Yangi mijoz",
          icon: UserCheck,
          color: "text-blue-400",
          onClick: () => router.push("/dashboard/partners"),
        },
        {
          title: "Balans To'ldirish",
          description: "Mijoz balansi",
          icon: CreditCard,
          color: "text-yellow-400",
          onClick: () => router.push("/dashboard/add-balance"),
        },
      )
    }

    return baseActions
  }

  const quickActions = getFilteredQuickActions()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">RealExamIELTS admin panel boshqaruv markazi</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-sm text-emerald-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-slate-700/50 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                So'nggi Faoliyat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Yangi foydalanuvchi ro'yxatdan o'tdi</p>
                    <p className="text-xs text-slate-400">5 daqiqa oldin</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Imtihon yakunlandi</p>
                    <p className="text-xs text-slate-400">12 daqiqa oldin</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Mijoz balansi to'ldirildi</p>
                    <p className="text-xs text-slate-400">25 daqiqa oldin</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Tezkor Harakatlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                  >
                    <action.icon className={`w-6 h-6 ${action.color} mb-2`} />
                    <p className="text-sm text-white font-medium">{action.title}</p>
                    <p className="text-xs text-slate-400">{action.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
