"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Plus,
  DollarSign,
  CreditCard,
  Building,
  TrendingUp,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react"
import { api, type Client } from "@/lib/api"

interface Transaction {
  id: string
  partnerId: string
  partnerName: string
  amount: number
  type: "credit" | "debit"
  method: "bank_transfer" | "cash" | "online" | "adjustment"
  status: "completed" | "pending" | "failed"
  description: string
  createdAt: string
  processedBy: string
}

interface EnhancedClient extends Client {
  lastBalanceUpdate?: string
}

export default function AddBalancePage() {
  const [clients, setClients] = useState<EnhancedClient[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredClients, setFilteredClients] = useState<EnhancedClient[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactionFilter, setTransactionFilter] = useState("all")
  const [isAddBalanceDialogOpen, setIsAddBalanceDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<EnhancedClient | null>(null)
  const [balanceForm, setBalanceForm] = useState({
    amount: "",
    method: "bank_transfer",
    description: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log("[v0] Fetching clients from API...")
        const clientsData = await api.clients.getAll()
        console.log("[v0] Clients data received:", clientsData)

        const storedTransactions = localStorage.getItem("balance_transactions")
        const storedLastUpdates = localStorage.getItem("balance_last_updates")

        const parsedTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : []
        const parsedLastUpdates = storedLastUpdates ? JSON.parse(storedLastUpdates) : {}

        const enhancedClients = clientsData.map((client: Client) => ({
          ...client,
          lastBalanceUpdate: parsedLastUpdates[client.id.toString()],
        }))

        setClients(enhancedClients)
        setFilteredClients(enhancedClients)
        setTransactions(parsedTransactions)
        setFilteredTransactions(parsedTransactions)
      } catch (error) {
        console.error("[v0] Error fetching clients:", error)
        toast({
          title: "Xatolik",
          description: "Mijozlar ma'lumotlarini yuklashda xatolik yuz berdi",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm])

  useEffect(() => {
    let filtered = transactions

    if (transactionFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === transactionFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, transactionFilter])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleAddBalance = async () => {
    if (!selectedClient || !balanceForm.amount) return

    try {
      const newBalance = selectedClient.balance + Number.parseFloat(balanceForm.amount)

      const formData = new FormData()
      formData.append("balance", newBalance.toString())

      console.log("[v0] Updating client balance:", { clientId: selectedClient.id, newBalance })

      const updatedClient = await api.clients.update(selectedClient.id.toString(), formData)
      console.log("[v0] Client balance updated:", updatedClient)

      const currentDate = new Date().toISOString()

      const updatedClients = clients.map((client) =>
        client.id === selectedClient.id ? { ...client, balance: newBalance, lastBalanceUpdate: currentDate } : client,
      )
      setClients(updatedClients)

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        partnerId: selectedClient.id.toString(),
        partnerName: selectedClient.full_name,
        amount: Number.parseFloat(balanceForm.amount),
        type: "credit",
        method: balanceForm.method as any,
        status: "completed",
        description: balanceForm.description || "Balans to'ldirish",
        createdAt: currentDate,
        processedBy: "Admin",
      }

      const updatedTransactions = [newTransaction, ...transactions]
      setTransactions(updatedTransactions)

      localStorage.setItem("balance_transactions", JSON.stringify(updatedTransactions))

      const lastUpdates = JSON.parse(localStorage.getItem("balance_last_updates") || "{}")
      lastUpdates[selectedClient.id.toString()] = currentDate
      localStorage.setItem("balance_last_updates", JSON.stringify(lastUpdates))

      window.dispatchEvent(new Event("balanceUpdated"))

      toast({
        title: "Muvaffaqiyat",
        description: `${selectedClient.full_name}ning balansi $${balanceForm.amount} ga to'ldirildi`,
      })

      setIsAddBalanceDialogOpen(false)
      setSelectedClient(null)
      setBalanceForm({
        amount: "",
        method: "bank_transfer",
        description: "",
      })
    } catch (error) {
      console.error("[v0] Error updating client balance:", error)
      toast({
        title: "Xatolik",
        description: "Balansni to'ldirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const exportTransactionsToExcel = () => {
    try {
      // Create CSV content
      const headers = ["ID", "Hamkor Nomi", "Miqdor", "Tur", "Usul", "Status", "Tavsif", "Sana", "Bajaruvchi"]

      const csvContent = [
        headers.join(","),
        ...filteredTransactions.map((transaction) =>
          [
            transaction.id,
            `"${transaction.partnerName}"`,
            transaction.amount,
            transaction.type === "credit" ? "Kirim" : "Chiqim",
            transaction.method === "bank_transfer"
              ? "Bank"
              : transaction.method === "cash"
                ? "Naqd"
                : transaction.method === "online"
                  ? "Online"
                  : "Tuzatish",
            transaction.status === "completed"
              ? "Yakunlangan"
              : transaction.status === "pending"
                ? "Kutilmoqda"
                : "Muvaffaqiyatsiz",
            `"${transaction.description}"`,
            new Date(transaction.createdAt).toLocaleDateString(),
            `"${transaction.processedBy}"`,
          ].join(","),
        ),
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `tranzaksiyalar_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Muvaffaqiyat",
        description: "Tranzaksiyalar Excel faylga yuklandi",
      })
    } catch (error) {
      console.error("[v0] Error exporting transactions:", error)
      toast({
        title: "Xatolik",
        description: "Faylni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const openAddBalanceDialog = (client: EnhancedClient) => {
    setSelectedClient(client)
    setIsAddBalanceDialogOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Ma'lumotlar yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Balans To'ldirish</h1>
            <p className="text-slate-400 mt-2">Mijozlarning balansini boshqaring va to'ldiring</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Balans</p>
                  <p className="text-xl font-bold text-white">
                    ${clients.reduce((sum, client) => sum + client.balance, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jami Mijozlar</p>
                  <p className="text-xl font-bold text-white">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Bugungi Tranzaksiyalar</p>
                  <p className="text-xl font-bold text-white">
                    {
                      transactions.filter((t) => new Date(t.createdAt).toDateString() === new Date().toDateString())
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Kutilayotgan To'lovlar</p>
                  <p className="text-xl font-bold text-white">
                    {transactions.filter((t) => t.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="partners" className="data-[state=active]:bg-slate-700">
              Mijozlar Balansi
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-slate-700">
              Tranzaksiya Tarixi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Mijoz nomi, email yoki telefon bo'yicha qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtr
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Mijozlar Balansi ({filteredClients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Mijoz</TableHead>
                        <TableHead className="text-slate-300">Telefon</TableHead>
                        <TableHead className="text-slate-300">Joriy Balans</TableHead>
                        <TableHead className="text-slate-300">Oxirgi To'ldirish</TableHead>
                        <TableHead className="text-slate-300">Yaratilgan</TableHead>
                        <TableHead className="text-slate-300">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id} className="border-slate-700 hover:bg-slate-700/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={client.logo ? `/uploads/${client.logo}` : "/placeholder.svg"} />
                                <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                                  {getInitials(client.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-white font-medium">{client.full_name}</p>
                                <p className="text-xs text-slate-400">{client.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{client.phone_number}</TableCell>
                          <TableCell className="text-white font-bold">${client.balance.toFixed(2)}</TableCell>
                          <TableCell className="text-slate-300">
                            {client.lastBalanceUpdate
                              ? new Date(client.lastBalanceUpdate).toLocaleDateString() +
                                " " +
                                new Date(client.lastBalanceUpdate).toLocaleTimeString()
                              : "Hech qachon"}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(client.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => openAddBalanceDialog(client)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              To'ldirish
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

          <TabsContent value="transactions">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Status bo'yicha" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">Barcha tranzaksiyalar</SelectItem>
                      <SelectItem value="completed">Yakunlangan</SelectItem>
                      <SelectItem value="pending">Kutilmoqda</SelectItem>
                      <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={exportTransactionsToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={filteredTransactions.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel Yuklash
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Tranzaksiya Tarixi ({filteredTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Hamkor</TableHead>
                        <TableHead className="text-slate-300">Miqdor</TableHead>
                        <TableHead className="text-slate-300">Tur</TableHead>
                        <TableHead className="text-slate-300">Usul</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Tavsif</TableHead>
                        <TableHead className="text-slate-300">Sana</TableHead>
                        <TableHead className="text-slate-300">Bajaruvchi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="border-slate-700 hover:bg-slate-700/30">
                          <TableCell className="text-white font-medium">{transaction.partnerName}</TableCell>
                          <TableCell>
                            <span
                              className={`font-bold ${
                                transaction.type === "credit" ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                transaction.type === "credit"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {transaction.type === "credit" ? "Kirim" : "Chiqim"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getMethodBadge(transaction.method)}>
                              {transaction.method === "bank_transfer"
                                ? "Bank"
                                : transaction.method === "cash"
                                  ? "Naqd"
                                  : transaction.method === "online"
                                    ? "Online"
                                    : "Tuzatish"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {transaction.status === "completed" && (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              )}
                              {transaction.status === "pending" && <Clock className="w-4 h-4 text-yellow-400" />}
                              {transaction.status === "failed" && <AlertCircle className="w-4 h-4 text-red-400" />}
                              <Badge className={getTransactionStatusBadge(transaction.status)}>
                                {transaction.status === "completed"
                                  ? "Yakunlangan"
                                  : transaction.status === "pending"
                                    ? "Kutilmoqda"
                                    : "Muvaffaqiyatsiz"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{transaction.description}</TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(transaction.createdAt).toLocaleDateString()}{" "}
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="text-slate-300">{transaction.processedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAddBalanceDialogOpen} onOpenChange={setIsAddBalanceDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Balans To'ldirish</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedClient.logo ? `/uploads/${selectedClient.logo}` : "/placeholder.svg"} />
                      <AvatarFallback className="bg-slate-600 text-slate-300">
                        {getInitials(selectedClient.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{selectedClient.full_name}</p>
                      <p className="text-sm text-slate-400">{selectedClient.email}</p>
                      <p className="text-sm text-slate-400">
                        Joriy balans:{" "}
                        <span className="text-emerald-400 font-medium">${selectedClient.balance.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Oxirgi to'ldirish:{" "}
                        {selectedClient.lastBalanceUpdate
                          ? new Date(selectedClient.lastBalanceUpdate).toLocaleDateString()
                          : "Hech qachon"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-slate-300">
                      Miqdor ($)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={balanceForm.amount}
                      onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="method" className="text-slate-300">
                      To'lov Usuli
                    </Label>
                    <Select
                      value={balanceForm.method}
                      onValueChange={(value) => setBalanceForm({ ...balanceForm, method: value })}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="bank_transfer">Bank O'tkazmasi</SelectItem>
                        <SelectItem value="cash">Naqd Pul</SelectItem>
                        <SelectItem value="online">Online To'lov</SelectItem>
                        <SelectItem value="adjustment">Tuzatish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-300">
                    Tavsif (ixtiyoriy)
                  </Label>
                  <Textarea
                    id="description"
                    value={balanceForm.description}
                    onChange={(e) => setBalanceForm({ ...balanceForm, description: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="To'lov haqida qo'shimcha ma'lumot..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddBalanceDialogOpen(false)}
                    className="border-slate-600 text-slate-300 bg-transparent"
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={handleAddBalance}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!balanceForm.amount || Number.parseFloat(balanceForm.amount) <= 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Balans To'ldirish
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

const getMethodBadge = (method: string) => {
  const variants = {
    bank_transfer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cash: "bg-green-500/20 text-green-400 border-green-500/30",
    online: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    adjustment: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }
  return variants[method as keyof typeof variants] || variants.bank_transfer
}

const getTransactionStatusBadge = (status: string) => {
  const variants = {
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  }
  return variants[status as keyof typeof variants] || variants.pending
}
