"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Shield,
} from "lucide-react"
import { api, secureStorage, USER_DATA_KEY, USER_TYPE_KEY } from "@/lib/api"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [userType, setUserType] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
        setUserName(user.full_name || user.username || "User")
        setIsAuthenticated(true)

        setUserRole(user.role || "admin")
      } else {
        router.push("/")
      }
    }

    validateAuth()
  }, [router])

  const handleLogout = () => {
    api.auth.logout()
  }

  const getFilteredNavigation = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Imtihonlar", href: "/dashboard/exams", icon: FileText },
      { name: "Foydalanuvchilar", href: "/dashboard/users", icon: Users },
      { name: "Natijalar", href: "/dashboard/results", icon: BarChart3 },
      { name: "Baholash", href: "/dashboard/assessment", icon: ClipboardCheck },
    ]

    if (userRole === "superadmin") {
      return [
        ...baseNavigation,
        { name: "Hamkorlar", href: "/dashboard/partners", icon: UserCheck },
        { name: "Adminlar", href: "/dashboard/admins", icon: Shield },
        { name: "Balans To'ldirish", href: "/dashboard/add-balance", icon: CreditCard },
      ]
    }

    return baseNavigation
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Yuklanmoqda...</div>
      </div>
    )
  }

  const navigation = getFilteredNavigation()

  return (
    <div className="min-h-screen bg-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
            <h1 className="text-xl font-bold text-white">RealExamIELTS</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Bell className="w-5 h-5" />
            </Button>
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <div className="text-sm text-slate-300">
              {userName} ({userType === "admin" ? userRole : "mijoz"})
            </div>
          </div>
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
