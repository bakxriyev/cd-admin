"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bold, List, Type } from "lucide-react"
import { api } from "@/lib/api"

interface CreatePassageModalProps {
  isOpen: boolean
  onClose: () => void
  readingId: string
  onPassageCreated: () => void
  editingPassage?: any
}

export function CreatePassageModal({
  isOpen,
  onClose,
  readingId,
  onPassageCreated,
  editingPassage,
}: CreatePassageModalProps) {
  const [part, setPart] = useState<string>("PART1")
  const [type, setType] = useState<string>("default")
  const [readingText, setReadingText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (editingPassage) {
      setPart(editingPassage.part || "PART1")
      setType(editingPassage.type || "default")
      setReadingText(editingPassage.reading_text || "")
    } else {
      setPart("PART1")
      setType("default")
      setReadingText("")
    }
  }, [editingPassage, isOpen])

  const insertFormatting = (format: "bold" | "paragraph" | "heading") => {
    const textarea = document.getElementById("reading-text") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = readingText.substring(start, end)
    let newText = ""

    switch (format) {
      case "bold":
        newText = readingText.substring(0, start) + `<b>${selectedText}</b>` + readingText.substring(end)
        break
      case "paragraph":
        newText = readingText.substring(0, start) + `\n\n${selectedText}\n\n` + readingText.substring(end)
        break
      case "heading":
        newText = readingText.substring(0, start) + `<h3>${selectedText}</h3>` + readingText.substring(end)
        break
    }

    setReadingText(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + newText.length - readingText.length,
        start + newText.length - readingText.length,
      )
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!readingText.trim()) {
      setError("Matn kiritish majburiy")
      return
    }

    try {
      setLoading(true)

      const passageData = {
        reading_id: Number.parseInt(readingId),
        reading_text: readingText,
        part,
        type,
      }

      if (editingPassage) {
        await api.passages.update(editingPassage.id.toString(), passageData)
      } else {
        await api.passages.create(passageData)
      }

      onPassageCreated()
      onClose()
    } catch (error: any) {
      console.error("Failed to save passage:", error)
      setError(error.message || "Passage saqlashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-balance">
            {editingPassage ? "Passage Tahrirlash" : "Yangi Passage Qo'shish"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part" className="text-slate-300">
                Part
              </Label>
              <Select value={part} onValueChange={setPart}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Part tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="PART1" className="text-white hover:bg-slate-700">
                    PART 1
                  </SelectItem>
                  <SelectItem value="PART2" className="text-white hover:bg-slate-700">
                    PART 2
                  </SelectItem>
                  <SelectItem value="PART3" className="text-white hover:bg-slate-700">
                    PART 3
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-slate-300">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Type tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="default" className="text-white hover:bg-slate-700">
                    Default
                  </SelectItem>
                  <SelectItem value="matching" className="text-white hover:bg-slate-700">
                    Matching
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading-text" className="text-slate-300">
              Reading Text
            </Label>
            <div className="flex items-center gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                onClick={() => insertFormatting("bold")}
              >
                <Bold className="w-4 h-4 mr-1" />
                Qalin
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                onClick={() => insertFormatting("paragraph")}
              >
                <List className="w-4 h-4 mr-1" />
                Abzats
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                onClick={() => insertFormatting("heading")}
              >
                <Type className="w-4 h-4 mr-1" />
                Sarlavha
              </Button>
            </div>
            <Textarea
              id="reading-text"
              value={readingText}
              onChange={(e) => setReadingText(e.target.value)}
              placeholder="Reading matnini kiriting..."
              className="bg-slate-700/50 border-slate-600 text-white min-h-[300px]"
              required
            />
            <p className="text-xs text-slate-400">
              Matnni formatlash uchun matnni belgilang va yuqoridagi tugmalarni bosing
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 bg-transparent"
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Saqlanmoqda..." : editingPassage ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
