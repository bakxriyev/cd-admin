"use client"

import { Bell, LogOut, Wallet, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, secureStorage, USER_DATA_KEY } from "@/lib/api"
import { useEffect, useState } from "react"

export function DashboardHeader() {
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const data = secureStorage.getItem(USER_DATA_KEY)
    if (data) {
      setUserData(JSON.parse(data))
    }
  }, [])

  const handleLogout = () => {
    api.auth.logout()
  }

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">RealExamIELTS</h1>
          {userData && (
            <div className="text-sm text-slate-400">
              {userData.full_name} ({userData.type})
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {userData?.type === "client" && (
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">Balans</div>
                  <div className="text-sm font-semibold text-white">${userData.balance?.toFixed(2)}</div>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-600" />
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Mock Price</div>
                  <div className="text-sm font-semibold text-white">${userData.mock_price?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Chiqish
          </Button>
        </div>
      </div>
    </header>
  )
}
