"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Trash2,
  Wallet,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { api, type User, secureStorage, USER_DATA_KEY } from "@/lib/api"
import { UserModal } from "@/components/user-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ITEMS_PER_PAGE = 10

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientBalance, setClientBalance] = useState<number | null>(null)
  const [clientMockPrice, setClientMockPrice] = useState<number | null>(null)
  const [userType, setUserType] = useState<string>("")
  const [userLocation, setUserLocation] = useState<string>("")
  const [locationFilter, setLocationFilter] = useState<string>("REI")
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

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
        setClientBalance(freshData.balance)
        setClientMockPrice(freshData.mock_price)
        window.dispatchEvent(new Event("balanceUpdated"))
      } catch (error) {
        console.error("[v0] Failed to fetch fresh client data:", error)
      }
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError("")

      try {
        const userData = secureStorage.getItem(USER_DATA_KEY)
        const currentUser = userData ? JSON.parse(userData) : null

        const response = await api.users.getAll()
        setUsers(response)

        const locations = Array.from(new Set(response.map((user) => user.location).filter(Boolean)))
        setAvailableLocations(locations)

        let filtered = response
        if (currentUser?.type === "client" && currentUser?.location) {
          // For clients, show only users whose ID starts with their location
          filtered = response.filter((user) => user.id.startsWith(currentUser.location))
          setLocationFilter(currentUser.location)
        } else {
          // For admin/superadmin, default to REI
          filtered = response.filter((user) => user.location === "REI")
        }

        setFilteredUsers(filtered)
      } catch (error: any) {
        console.error("Failed to fetch users:", error)
        setError("Foydalanuvchilarni yuklashda xatolik yuz berdi")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    fetchFreshClientData()

    const userData = secureStorage.getItem(USER_DATA_KEY)
    if (userData) {
      const user = JSON.parse(userData)
      setUserType(user.type || "")
      setUserLocation(user.location || "")
      if (user.type === "client") {
        setClientBalance(user.balance || 0)
        setClientMockPrice(user.mock_price || 0)
      }
    }

    const handleBalanceUpdate = () => {
      const userData = secureStorage.getItem(USER_DATA_KEY)
      if (userData) {
        const user = JSON.parse(userData)
        if (user.type === "client") {
          setClientBalance(user.balance || 0)
          setClientMockPrice(user.mock_price || 0)
        }
      }
    }

    window.addEventListener("balanceUpdated", handleBalanceUpdate)
    return () => window.removeEventListener("balanceUpdated", handleBalanceUpdate)
  }, [])

  useEffect(() => {
    let filtered = users

    if (userType === "client" && userLocation) {
      // For clients, filter by ID prefix
      filtered = filtered.filter((user) => user.id.startsWith(userLocation))
    } else if (userType === "admin" || userType === "superadmin") {
      // For admin/superadmin, use location filter
      if (locationFilter && locationFilter !== "all") {
        filtered = filtered.filter((user) => user.location === locationFilter)
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [users, searchTerm, statusFilter, locationFilter, userType, userLocation])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const refreshUsers = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await api.users.getAll()
      setUsers(response)

      const locations = Array.from(new Set(response.map((user) => user.location).filter(Boolean)))
      setAvailableLocations(locations)

      await fetchFreshClientData()
    } catch (error: any) {
      console.error("Failed to fetch users:", error)
      setError("Foydalanuvchilarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return

    try {
      await api.users.delete(userId)
      refreshUsers()
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("Foydalanuvchini o'chirishda xatolik yuz berdi")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Foydalanuvchilar yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Foydalanuvchilar</h1>
            <p className="text-slate-400 mt-2">
              {userType === "client" && userLocation
                ? `${userLocation} lokatsiyasidagi foydalanuvchilar`
                : "Barcha foydalanuvchilarni boshqaring va kuzating"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userType === "client" && clientBalance !== null && (
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs text-slate-400">Balans</div>
                    <div className="text-sm font-semibold text-white">${clientBalance.toFixed(2)}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-600" />
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs text-slate-400">Mock Price</div>
                    <div className="text-sm font-semibold text-white">${clientMockPrice?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>
              </div>
            )}
            <UserModal mode="create" onSuccess={refreshUsers} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Foydalanuvchilar</p>
                  <p className="text-xl font-bold text-white">{filteredUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Faol Foydalanuvchilar</p>
                  <p className="text-xl font-bold text-white">{filteredUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <UserX className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Bloklangan</p>
                  <p className="text-xl font-bold text-white">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Yangi (Bu oy)</p>
                  <p className="text-xl font-bold text-white">
                    {
                      filteredUsers.filter(
                        (user) => new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="ID, ism, email yoki username bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {(userType === "admin" || userType === "superadmin") && (
                <div className="w-full sm:w-48">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white hover:bg-slate-700">
                        Barcha Locationlar
                      </SelectItem>
                      {availableLocations.map((location) => (
                        <SelectItem key={location} value={location} className="text-white hover:bg-slate-700">
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Foydalanuvchilar ro'yxati ({filteredUsers.length})
              {userType === "client" && userLocation && (
                <span className="text-sm font-normal text-slate-400 ml-2">- {userLocation}</span>
              )}
              {(userType === "admin" || userType === "superadmin") && locationFilter && locationFilter !== "all" && (
                <span className="text-sm font-normal text-slate-400 ml-2">- {locationFilter}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300 font-semibold">ID</TableHead>
                    <TableHead className="text-slate-300">Foydalanuvchi</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Username</TableHead>
                    <TableHead className="text-slate-300">Password</TableHead>
                    <TableHead className="text-slate-300">Location</TableHead>
                    <TableHead className="text-slate-300">Ro'yxatdan O'tgan</TableHead>
                    <TableHead className="text-slate-300">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="text-blue-400 font-mono text-sm font-semibold">{user.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell className="text-slate-300">{user.username}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{user.password || "••••••••"}</TableCell>
                      <TableCell className="text-slate-300">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {user.location || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(user.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserModal mode="view" user={user} />
                          <UserModal mode="edit" user={user} onSuccess={refreshUsers} />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} / {filteredUsers.length} foydalanuvchi
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-sm text-white">
                    {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
