"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Writing, secureStorage, USER_TYPE_KEY } from "@/lib/api"
import { PenTool, ArrowLeft, Clock, FileText, ImageIcon, Edit, Trash2 } from "lucide-react"
import { EditWritingModal } from "@/components/edit-writing-modal"

export default function WritingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [writing, setWriting] = useState<Writing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userType, setUserType] = useState<string>("")
  const [showEditModal, setShowEditModal] = useState(false)

  const examId = params.id as string
  const writingId = params.writingId as string

  useEffect(() => {
    const type = secureStorage.getItem(USER_TYPE_KEY)
    setUserType(type || "")
    fetchWriting()
  }, [writingId])

  const fetchWriting = async () => {
    try {
      setLoading(true)
      const data = await api.writing.getById(writingId)
      setWriting(data)
    } catch (error: any) {
      console.error("Failed to fetch writing:", error)
      setError("Writing ma'lumotlarini yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bu writing bo'limini o'chirishni xohlaysizmi?")) return

    try {
      await api.writing.delete(writingId)
      router.back()
    } catch (error) {
      console.error("Failed to delete writing:", error)
      alert("O'chirishda xatolik yuz berdi")
    }
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchWriting()
  }

  const canEdit = userType === "superadmin" || userType === "admin"

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !writing) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <PenTool className="w-16 h-16 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-300">Writing topilmadi</h2>
          <p className="text-slate-400 text-center">{error || "So'ralgan writing mavjud emas"}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Orqaga
          </Button>
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
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Orqaga
            </Button>
            <div className="flex items-center gap-3">
              <PenTool className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white text-balance">{writing.part}</h1>
                <p className="text-slate-400">Writing Bo'limi</p>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowEditModal(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Tahrirlash
              </Button>
              <Button
                onClick={handleDelete}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-700/20 bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                O'chirish
              </Button>
            </div>
          )}
        </div>

        {/* Writing Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Writing Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Exam ID</p>
                <Badge variant="outline" className="border-slate-500 text-slate-300">
                  {writing.exam_id}
                </Badge>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Yaratilgan</p>
                <p className="text-white flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(writing.created_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Content */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Vazifa Matni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-pretty">{writing.task_text}</p>
            </div>
          </CardContent>
        </Card>

        {/* Task Image */}
        {writing.task_image && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Vazifa Rasmi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/writing/${writing.task_image}`}
                  alt="Writing task image"
                  className="max-w-full h-auto rounded-lg border border-slate-600"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {canEdit && (
        <EditWritingModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          writing={writing}
          onSuccess={handleEditSuccess}
        />
      )}
    </DashboardLayout>
  )
}
