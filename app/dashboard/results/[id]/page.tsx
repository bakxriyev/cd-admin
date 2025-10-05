"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Download, User, FileText, Clock, Calendar, Trophy, Target } from "lucide-react"

interface ResultDetail {
  id: string
  userId: string
  userName: string
  userEmail: string
  examId: string
  examName: string
  examType: "IELTS" | "TOEFL" | "PTE"
  overallScore: number
  maxScore: number
  sections: {
    name: string
    score: number
    maxScore: number
    details?: string
  }[]
  completedAt: string
  duration: number
  status: "completed" | "in_progress" | "abandoned"
  partnerId?: string
  partnerName?: string
  avatar?: string
  feedback?: string
  recommendations?: string[]
}

export default function ResultDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [result, setResult] = useState<ResultDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResultDetail = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock data - replace with actual API call
      const mockResult: ResultDetail = {
        id: params.id as string,
        userId: "1",
        userName: "Aziz Karimov",
        userEmail: "aziz.karimov@email.com",
        examId: "1",
        examName: "IELTS Academic Writing Task 1",
        examType: "IELTS",
        overallScore: 8.0,
        maxScore: 9.0,
        sections: [
          {
            name: "Task Achievement",
            score: 8.0,
            maxScore: 9.0,
            details: "Vazifani to'liq bajargan, barcha asosiy ma'lumotlarni yoritgan",
          },
          {
            name: "Coherence & Cohesion",
            score: 7.5,
            maxScore: 9.0,
            details: "Matn mantiqiy tuzilgan, lekin ba'zi bog'lovchilar kamroq ishlatilgan",
          },
          {
            name: "Lexical Resource",
            score: 8.5,
            maxScore: 9.0,
            details: "Keng so'z boyligi, to'g'ri va aniq so'z tanlovi",
          },
          {
            name: "Grammar",
            score: 8.0,
            maxScore: 9.0,
            details: "Grammatika qoidalari asosan to'g'ri qo'llanilgan",
          },
        ],
        completedAt: "2024-01-20",
        duration: 58,
        status: "completed",
        partnerId: "1",
        partnerName: "Jasur Abdullayev",
        feedback:
          "Umumiy natija juda yaxshi. Writing ko'nikmalari yuqori darajada. Coherence & Cohesion bo'limida biroz yaxshilash kerak.",
        recommendations: [
          "Ko'proq bog'lovchi so'zlardan foydalaning",
          "Paragraflar orasidagi bog'lanishni kuchaytiring",
          "Grammatik strukturalarni xilma-xillashtirishga harakat qiling",
        ],
      }

      setResult(mockResult)
      setLoading(false)
    }

    fetchResultDetail()
  }, [params.id])

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      abandoned: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return variants[status as keyof typeof variants] || variants.completed
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 85) return "text-emerald-400"
    if (percentage >= 70) return "text-blue-400"
    if (percentage >= 50) return "text-yellow-400"
    return "text-red-400"
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
          <div className="text-white">Natija ma'lumotlari yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!result) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Natija topilmadi</div>
        </div>
      </DashboardLayout>
    )
  }

  const overallPercentage = (result.overallScore / result.maxScore) * 100

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
            <div>
              <h1 className="text-3xl font-bold text-white">Imtihon Natijasi</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusBadge(result.status)}>
                  {result.status === "completed"
                    ? "Yakunlangan"
                    : result.status === "in_progress"
                      ? "Jarayonda"
                      : "Tashlab ketilgan"}
                </Badge>
                <span className="text-slate-400">ID: {result.id}</span>
              </div>
            </div>
          </div>

          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Yuklab olish
          </Button>
        </div>

        {/* Student and Exam Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Talaba Ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={result.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-slate-700 text-slate-300 text-lg">
                    {getInitials(result.userName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-white">{result.userName}</h3>
                  <p className="text-slate-400">{result.userEmail}</p>
                  {result.partnerName && <p className="text-sm text-slate-400 mt-1">Hamkor: {result.partnerName}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Imtihon Ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Imtihon nomi</p>
                  <p className="text-white font-medium">{result.examName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Turi</p>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {result.examType}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Davomiyligi</p>
                  <p className="text-white font-medium">{result.duration} daqiqa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Yakunlangan sana</p>
                  <p className="text-white font-medium">{result.completedAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Score */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Umumiy Natija
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-white">
                  <span className={getScoreColor(result.overallScore, result.maxScore)}>{result.overallScore}</span>
                  <span className="text-slate-400">/{result.maxScore}</span>
                </p>
                <p className="text-slate-400">Umumiy ball</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getScoreColor(result.overallScore, result.maxScore)}`}>
                  {overallPercentage.toFixed(1)}%
                </p>
                <p className="text-slate-400">Foiz</p>
              </div>
            </div>
            <Progress value={overallPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Section Scores */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Bo'limlar bo'yicha Natijalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {result.sections.map((section, index) => {
                const sectionPercentage = (section.score / section.maxScore) * 100
                return (
                  <div key={index} className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{section.name}</h4>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getScoreColor(section.score, section.maxScore)}`}>
                          {section.score}
                        </span>
                        <span className="text-slate-400">/{section.maxScore}</span>
                        <span className={`ml-2 text-sm ${getScoreColor(section.score, section.maxScore)}`}>
                          ({sectionPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={sectionPercentage} className="h-2 mb-3" />
                    {section.details && <p className="text-sm text-slate-400">{section.details}</p>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feedback and Recommendations */}
        {(result.feedback || result.recommendations) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.feedback && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Umumiy Baholash</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{result.feedback}</p>
                </CardContent>
              </Card>
            )}

            {result.recommendations && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Tavsiyalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-slate-300">{recommendation}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
