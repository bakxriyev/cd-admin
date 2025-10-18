"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, type ReadingQuestion, type Passage } from "@/lib/api"
import { Plus, X, HelpCircle } from "lucide-react"

const QUESTION_TYPES = {
  TFNG: "TRUE_FALSE_NOT_GIVEN",
  MCQ_SINGLE: "MULTIPLE_CHOICE_SINGLE",
  MCQ_MULTI: "MULTIPLE_CHOICE_MULTI",
  SENTENCE_COMPLETION: "SENTENCE_COMPLETION",
  TABLE_COMPLETION: "TABLE_COMPLETION",
  MATCHING_INFORMATION: "MATCHING_INFORMATION",
  SUMMARY_COMPLETION: "SUMMARY_COMPLETION",
  SUMMARY_DRAG: "SUMMARY_DRAG",
  SENTENCE_ENDINGS: "SENTENCE_ENDINGS",
  MATCHING_HEADINGS: "MATCHING_HEADINGS",
  NOTE_COMPLETION: "NOTE_COMPLETION",
}

interface CreateReadingQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  readingQuestionsId: string
  onQuestionCreated: () => void
  editingQuestion?: ReadingQuestion | null
  copyingQuestion?: ReadingQuestion | null
  passages?: Passage[]
}

export function CreateReadingQuestionModal({
  isOpen,
  onClose,
  readingQuestionsId,
  onQuestionCreated,
  editingQuestion,
  copyingQuestion,
  passages = [],
}: CreateReadingQuestionModalProps) {
  const [formData, setFormData] = useState({
    q_type: "MCQ_SINGLE" as ReadingQuestion["q_type"],
    q_text: "",
    photo: "",
  })
  const [options, setOptions] = useState([{ key: "A", text: "" }])
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [columns, setColumns] = useState<string[]>([""])
  const [rows, setRows] = useState<Array<{ label: string; cells: string[] }>>([{ label: "", cells: [""] }])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [matchingChoices, setMatchingChoices] = useState<Record<string, string>>({ A: "" })
  const [matchingRows, setMatchingRows] = useState<string[]>([""])
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({})
  const [matchingHeadingsOptions, setMatchingHeadingsOptions] = useState<Array<{ key: string; text: string }>>([
    { key: "A", text: "" },
  ])
  const [matchingHeadingsInputCount, setMatchingHeadingsInputCount] = useState(1)
  const [matchingHeadingsAnswers, setMatchingHeadingsAnswers] = useState<Record<string, string>>({})
  const [noteTemplate, setNoteTemplate] = useState("")
  const [noteAnswers, setNoteAnswers] = useState<Record<string, string>>({})
  const [summaryDragRows, setSummaryDragRows] = useState<string[]>(["", ""])
  const [summaryDragChoices, setSummaryDragChoices] = useState<Record<string, string>>({})
  const [summaryDragOptions, setSummaryDragOptions] = useState<string[]>([""])
  const [summaryDragAnswers, setSummaryDragAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const questionToLoad = editingQuestion || copyingQuestion

    if (questionToLoad) {
      setFormData({
        q_type: questionToLoad.q_type,
        q_text: questionToLoad.q_text || "",
        photo: questionToLoad.photo || "",
      })

      if (questionToLoad.q_type === "MATCHING_INFORMATION") {
        if (questionToLoad.choices && typeof questionToLoad.choices === "object") {
          setMatchingChoices(questionToLoad.choices)
        }
        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          setMatchingRows(questionToLoad.rows)
        }
        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setMatchingAnswers(questionToLoad.answers)
        }
      } else if (questionToLoad.q_type === "MATCHING_HEADINGS") {
        if (questionToLoad.options) {
          if (Array.isArray(questionToLoad.options)) {
            setMatchingHeadingsOptions(questionToLoad.options)
          } else if (typeof questionToLoad.options === "object") {
            const optionsArray = Object.entries(questionToLoad.options).map(([key, text], index) => ({
              key: String.fromCharCode(65 + index),
              text: text as string,
            }))
            setMatchingHeadingsOptions(optionsArray)
          }
        }
        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setMatchingHeadingsAnswers(questionToLoad.answers)
          const inputCount = Object.keys(questionToLoad.answers).length
          setMatchingHeadingsInputCount(inputCount > 0 ? inputCount : 1)
        }
      } else if (questionToLoad.q_type === "TABLE_COMPLETION") {
        setColumns(questionToLoad.columns || [""])
        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          if (
            questionToLoad.rows.length > 0 &&
            typeof questionToLoad.rows[0] === "object" &&
            "label" in questionToLoad.rows[0]
          ) {
            setRows(questionToLoad.rows as Array<{ label: string; cells: string[] }>)
          } else {
            setRows([{ label: "", cells: (questionToLoad.rows[0] as string[]) || [""] }])
          }
        } else {
          setRows([{ label: "", cells: [""] }])
        }
        setChoices(questionToLoad.choices || {})
      } else if (
        ["MCQ_SINGLE", "MCQ_MULTI", "TFNG", "SUMMARY_DRAG", "SENTENCE_ENDINGS"].includes(questionToLoad.q_type)
      ) {
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setOptions(questionToLoad.options)
        } else {
          setOptions([{ key: "A", text: "" }])
        }
      } else if (questionToLoad.q_type === "NOTE_COMPLETION") {
        // Load NOTE_COMPLETION data
        setNoteTemplate(questionToLoad.options || "")
        if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setNoteAnswers(questionToLoad.correct_answers)
        } else {
          setNoteAnswers({})
        }
      }
      if (questionToLoad.q_type === "SUMMARY_DRAG") {
        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          setSummaryDragRows(questionToLoad.rows)
        }
        if (questionToLoad.choices && typeof questionToLoad.choices === "object") {
          setSummaryDragChoices(questionToLoad.choices)
        }
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setSummaryDragOptions(questionToLoad.options)
        }
        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setSummaryDragAnswers(questionToLoad.answers)
        }
      }

      if (questionToLoad.correct_answers && Array.isArray(questionToLoad.correct_answers)) {
        setCorrectAnswers(questionToLoad.correct_answers)
      } else {
        setCorrectAnswers([])
      }
    } else {
      setFormData({
        q_type: "MCQ_SINGLE",
        q_text: "",
        photo: "",
      })
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns([""])
      setRows([{ label: "", cells: [""] }])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMatchingHeadingsOptions([{ key: "A", text: "" }])
      setMatchingHeadingsInputCount(1)
      setMatchingHeadingsAnswers({})
      setNoteTemplate("")
      setNoteAnswers({})
      setSummaryDragRows(["", ""])
      setSummaryDragChoices({})
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
    }
  }, [editingQuestion, copyingQuestion, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuestionTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, q_type: value as ReadingQuestion["q_type"] }))

    if (value === "TABLE_COMPLETION") {
      setColumns([""])
      setRows([{ label: "", cells: [""] }])
      setChoices({})
      setOptions([])
      setCorrectAnswers([])
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
    } else if (value === "NOTE_COMPLETION") {
      setNoteTemplate("")
      setNoteAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMatchingHeadingsOptions([{ key: "A", text: "" }])
      setMatchingHeadingsInputCount(1)
      setMatchingHeadingsAnswers({})
    } else if (value === "MATCHING_INFORMATION") {
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
    } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(value)) {
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
    } else if (value === "MATCHING_HEADINGS") {
      const matchingPassages = passages.filter((p) => p.type === "matching")
      let inputCount = 1

      if (matchingPassages.length > 0) {
        const passageText = matchingPassages[0].reading_text
        const inputMatches = passageText.match(/\b(\d+)\./g) || []
        inputCount = inputMatches.length > 0 ? inputMatches.length : 1
      }

      setMatchingHeadingsInputCount(inputCount)
      setMatchingHeadingsOptions([{ key: "A", text: "" }])
      setMatchingHeadingsAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
    } else if (["MCQ_SINGLE", "MCQ_MULTI", "TFNG", "SUMMARY_DRAG", "SENTENCE_ENDINGS"].includes(value)) {
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
    } else if (value === "SUMMARY_DRAG") {
      setSummaryDragRows(["", ""])
      setSummaryDragChoices({})
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
    }
  }

  const handleAddOption = () => {
    if (formData.q_type === "MATCHING_HEADINGS") {
      const nextKey = (options.length + 1).toString()
      setOptions([...options, { key: nextKey, text: "" }])
    } else {
      const nextKey = String.fromCharCode(65 + options.length) // A, B, C, D...
      setOptions([...options, { key: nextKey, text: "" }])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index)
      const reassignedOptions = newOptions.map((option, i) => ({
        ...option,
        key: formData.q_type === "MATCHING_HEADINGS" ? (i + 1).toString() : String.fromCharCode(65 + i),
      }))
      setOptions(reassignedOptions)

      const removedKey = options[index].key
      setCorrectAnswers(correctAnswers.filter((answer) => answer !== removedKey))
    }
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const handleCorrectAnswerToggle = (key: string) => {
    if (formData.q_type === "MCQ_SINGLE" || formData.q_type === "TFNG") {
      setCorrectAnswers([key])
    } else {
      setCorrectAnswers((prev) => (prev.includes(key) ? prev.filter((answer) => answer !== key) : [...prev, key]))
    }
  }

  const handleAddCorrectAnswer = () => {
    setCorrectAnswers([...correctAnswers, ""])
  }

  const handleRemoveCorrectAnswer = (index: number) => {
    if (correctAnswers.length > 1) {
      setCorrectAnswers(correctAnswers.filter((_, i) => i !== index))
    }
  }

  const handleCorrectAnswerChange = (index: number, value: string) => {
    const newAnswers = [...correctAnswers]
    newAnswers[index] = value
    setCorrectAnswers(newAnswers)
  }

  const handleAddColumn = () => {
    const newColumns = [...columns, ""]
    setColumns(newColumns)

    const newRows = rows.map((row) => ({
      ...row,
      cells: [...row.cells, ""],
    }))
    setRows(newRows)
  }

  const handleRemoveColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_, i) => i !== index)
      setColumns(newColumns)

      const newRows = rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== index),
      }))
      setRows(newRows)

      const newChoices = { ...choices }
      Object.keys(newChoices).forEach((key) => {
        const [rowIndex, colIndex] = key.split("_").map(Number)
        if (colIndex === index) {
          delete newChoices[key]
        } else if (colIndex > index) {
          const newKey = `${rowIndex}_${colIndex - 1}`
          newChoices[newKey] = newChoices[key]
          delete newChoices[key]
        }
      })
      setChoices(newChoices)
    }
  }

  const handleColumnChange = (index: number, value: string) => {
    const newColumns = [...columns]
    newColumns[index] = value
    setColumns(newColumns)
  }

  const handleAddRow = () => {
    setRows([...rows, { label: "", cells: new Array(columns.length).fill("") }])
  }

  const handleRemoveRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index))

      const newChoices = { ...choices }
      Object.keys(newChoices).forEach((key) => {
        const [rowIndex, colIndex] = key.split("_").map(Number)
        if (rowIndex === index) {
          delete newChoices[key]
        } else if (rowIndex > index) {
          const newKey = `${rowIndex - 1}_${colIndex}`
          newChoices[newKey] = newChoices[key]
          delete newChoices[key]
        }
      })
      setChoices(newChoices)
    }
  }

  const handleRowLabelChange = (rowIndex: number, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex].label = value
    setRows(newRows)
  }

  const handleRowCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex].cells[cellIndex] = value
    setRows(newRows)
  }

  const handleChoiceChange = (key: string, value: string) => {
    setChoices((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddMatchingChoice = () => {
    const keys = Object.keys(matchingChoices)
    const nextKey = String.fromCharCode(65 + keys.length) // A, B, C, D...
    setMatchingChoices((prev) => ({ ...prev, [nextKey]: "" }))
  }

  const handleRemoveMatchingChoice = (key: string) => {
    if (Object.keys(matchingChoices).length > 1) {
      const newChoices = { ...matchingChoices }
      delete newChoices[key]
      setMatchingChoices(newChoices)

      const newAnswers = { ...matchingAnswers }
      Object.keys(newAnswers).forEach((answerKey) => {
        if (newAnswers[answerKey] === key) {
          delete newAnswers[answerKey]
        }
      })
      setMatchingAnswers(newAnswers)
    }
  }

  const handleMatchingChoiceChange = (key: string, value: string) => {
    setMatchingChoices((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddMatchingRow = () => {
    setMatchingRows((prev) => [...prev, ""])
  }

  const handleRemoveMatchingRow = (index: number) => {
    if (matchingRows.length > 1) {
      setMatchingRows((prev) => prev.filter((_, i) => i !== index))

      const newAnswers = { ...matchingAnswers }
      delete newAnswers[(index + 1).toString()]

      const shiftedAnswers: Record<string, string> = {}
      Object.keys(newAnswers).forEach((key) => {
        const numKey = Number.parseInt(key)
        if (numKey > index + 1) {
          shiftedAnswers[(numKey - 1).toString()] = newAnswers[key]
        } else {
          shiftedAnswers[key] = newAnswers[key]
        }
      })
      setMatchingAnswers(shiftedAnswers)
    }
  }

  const handleMatchingRowChange = (index: number, value: string) => {
    const newRows = [...matchingRows]
    newRows[index] = value
    setMatchingRows(newRows)
  }

  const handleMatchingAnswerChange = (rowIndex: number, choiceKey: string) => {
    setMatchingAnswers((prev) => ({
      ...prev,
      [(rowIndex + 1).toString()]: choiceKey,
    }))
  }

  const handleAddMatchingHeadingsOption = () => {
    const nextKey = String.fromCharCode(65 + matchingHeadingsOptions.length)
    setMatchingHeadingsOptions((prev) => [...prev, { key: nextKey, text: "" }])
  }

  const handleRemoveMatchingHeadingsOption = (index: number) => {
    if (matchingHeadingsOptions.length > 1) {
      const removedKey = matchingHeadingsOptions[index].key
      const newOptions = matchingHeadingsOptions.filter((_, i) => i !== index)
      const reassignedOptions = newOptions.map((option, i) => ({
        ...option,
        key: String.fromCharCode(65 + i),
      }))
      setMatchingHeadingsOptions(reassignedOptions)

      const newAnswers = { ...matchingHeadingsAnswers }
      Object.keys(newAnswers).forEach((answerKey) => {
        if (newAnswers[answerKey] === removedKey) {
          delete newAnswers[answerKey]
        }
      })
      setMatchingHeadingsAnswers(newAnswers)
    }
  }

  const handleMatchingHeadingsOptionChange = (index: number, value: string) => {
    const newOptions = [...matchingHeadingsOptions]
    newOptions[index].text = value
    setMatchingHeadingsOptions(newOptions)
  }

  const handleMatchingHeadingsAnswerChange = (inputNumber: string, optionKey: string) => {
    setMatchingHeadingsAnswers((prev) => ({
      ...prev,
      [inputNumber]: optionKey,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!readingQuestionsId) return

    if (!formData.q_text.trim()) {
      setError("Savol matni majburiy")
      return
    }

    if (formData.q_type === "NOTE_COMPLETION") {
      if (!noteTemplate.trim()) {
        setError("Shablonni to'ldiring")
        return
      }
      const blankCount = (noteTemplate.match(/____/g) || []).length
      if (blankCount === 0) {
        setError("Kamida bitta ____ bo'sh joy qo'shish kerak")
        return
      }
    } else if (formData.q_type === "MATCHING_INFORMATION") {
      if (Object.values(matchingChoices).some((choice) => !choice.trim())) {
        setError("Barcha tanlov variantlarini to'ldiring")
        return
      }
      if (matchingRows.some((row) => !row.trim())) {
        setError("Barcha qatorlarni to'ldiring")
        return
      }
      if (Object.keys(matchingAnswers).length === 0) {
        setError("Kamida bitta javobni belgilang")
        return
      }
    } else if (["MCQ_SINGLE", "MCQ_MULTI", "TFNG", "SUMMARY_DRAG", "SENTENCE_ENDINGS"].includes(formData.q_type)) {
      if (options.some((opt) => !opt.text.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (correctAnswers.length === 0) {
        setError("Kamida bitta to'g'ri javobni belgilang")
        return
      }
    } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.q_type)) {
      if (correctAnswers.length === 0 || correctAnswers.some((answer) => !answer.trim())) {
        setError("Kamida bitta to'g'ri javobni kiriting")
        return
      }
    } else if (formData.q_type === "TABLE_COMPLETION") {
      if (
        columns.some((col) => !col.trim()) ||
        rows.some((row) => !row.label.trim() || row.cells.some((cell) => cell === null || cell === undefined))
      ) {
        setError("Barcha jadval maydonlarini to'ldiring")
        return
      }
    } else if (formData.q_type === "SUMMARY_DRAG") {
      if (summaryDragRows.some((row) => !row.trim())) {
        setError("Barcha qatorlarni to'ldiring")
        return
      }
      if (summaryDragOptions.some((opt) => !opt.trim())) {
        setError("Barcha optionlarni to'ldiring")
        return
      }
      if (Object.keys(summaryDragAnswers).length === 0) {
        setError("Kamida bitta to'g'ri javobni belgilang")
        return
      }
    }

    setLoading(true)
    setError("")

    try {
      const questionData: any = {
        reading_questions_id: Number.parseInt(readingQuestionsId),
        q_type: formData.q_type,
        q_text: formData.q_text,
        photo: formData.photo || undefined,
      }

      if (formData.q_type === "NOTE_COMPLETION") {
        questionData.options = noteTemplate
        questionData.correct_answers = noteAnswers
      } else if (formData.q_type === "MATCHING_INFORMATION") {
        questionData.choices = matchingChoices
        questionData.rows = matchingRows
        questionData.answers = matchingAnswers
      } else if (formData.q_type === "TABLE_COMPLETION") {
        questionData.columns = columns
        questionData.rows = rows
        questionData.choices = choices
      } else if (["MCQ_SINGLE", "MCQ_MULTI", "TFNG", "SUMMARY_DRAG", "SENTENCE_ENDINGS"].includes(formData.q_type)) {
        questionData.options = options
        questionData.correct_answers = correctAnswers
      } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.q_type)) {
        questionData.correct_answers = correctAnswers
      }
      if (formData.q_type === "SUMMARY_DRAG") {
        questionData.rows = summaryDragRows
        questionData.choices = summaryDragChoices
        questionData.options = summaryDragOptions
        questionData.answers = summaryDragAnswers
      }

      if (editingQuestion && !copyingQuestion) {
        await api.rQuestions.update(editingQuestion.id.toString(), questionData)
      } else {
        await api.rQuestions.create(questionData)
      }

      onQuestionCreated()

      setFormData({
        q_type: "MCQ_SINGLE",
        q_text: "",
        photo: "",
      })
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns([""])
      setRows([{ label: "", cells: [""] }])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMatchingHeadingsOptions([{ key: "A", text: "" }])
      setMatchingHeadingsInputCount(1)
      setMatchingHeadingsAnswers({})
      setNoteTemplate("")
      setNoteAnswers({})
      // Reset SUMMARY_DRAG states after submission
      setSummaryDragRows(["", ""])
      setSummaryDragChoices({})
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
    } catch (error: any) {
      console.error("Failed to save reading question:", error)
      setError("Savol saqlashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const needsOptions = ["MCQ_SINGLE", "MCQ_MULTI", "TFNG", "SUMMARY_DRAG", "SENTENCE_ENDINGS"].includes(formData.q_type)
  const needsCorrectAnswers = ["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.q_type)
  const isTableCompletion = formData.q_type === "TABLE_COMPLETION"
  const isMatchingInformation = formData.q_type === "MATCHING_INFORMATION"
  const isMatchingHeadings = formData.q_type === "MATCHING_HEADINGS"
  // Added isNoteCompletion flag
  const isNoteCompletion = formData.q_type === "NOTE_COMPLETION"
  // Added isSummaryDrag flag
  const isSummaryDrag = formData.q_type === "SUMMARY_DRAG"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            {editingQuestion
              ? "Reading Savolini Tahrirlash"
              : copyingQuestion
                ? "Reading Savolini Nusxalash"
                : "Reading Savoli Qo'shish"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isMatchingHeadings && (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 space-y-2">
              <p className="text-blue-400 text-sm font-semibold">Matching Headings uchun muhim ma'lumot:</p>
              <ul className="text-blue-300 text-xs space-y-1 list-disc list-inside">
                <li>Optionlar inputlar sonidan ko'p bo'lishi mumkin</li>
                <li>Har bir input uchun to'g'ri optionni tanlang</li>
                <li>Optionlar harflar bilan belgilanadi: A, B, C, D...</li>
                <li>To'g'ri javob - option harfi (masalan: input 1 uchun option C to'g'ri bo'lsa, javob "C")</li>
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="q_type" className="text-slate-300 text-sm">
              Savol Turi *
            </Label>
            <Select value={formData.q_type} onValueChange={handleQuestionTypeChange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="TFNG">TRUE_FALSE_NOT_GIVEN</SelectItem>
                <SelectItem value="MCQ_SINGLE">MULTIPLE_CHOICE_SINGLE</SelectItem>
                <SelectItem value="MCQ_MULTI">MULTIPLE_CHOICE_MULTI</SelectItem>
                <SelectItem value="SENTENCE_COMPLETION">SENTENCE_COMPLETION</SelectItem>
                <SelectItem value="TABLE_COMPLETION">TABLE_COMPLETION</SelectItem>
                <SelectItem value="MATCHING_INFORMATION">MATCHING_INFORMATION</SelectItem>
                <SelectItem value="SUMMARY_COMPLETION">SUMMARY_COMPLETION</SelectItem>
                <SelectItem value="SUMMARY_DRAG">SUMMARY_DRAG</SelectItem>
                <SelectItem value="SENTENCE_ENDINGS">SENTENCE_ENDINGS</SelectItem>
                {/* Add NOTE_COMPLETION to question type selector */}
                <SelectItem value="NOTE_COMPLETION">NOTE_COMPLETION</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q_text" className="text-slate-300 text-sm">
              Savol Matni *
            </Label>
            <Textarea
              id="q_text"
              value={formData.q_text}
              onChange={(e) => handleInputChange("q_text", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white resize-y"
              placeholder="What is the main idea of paragraph 1?"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-slate-300 text-sm">
              Rasm URL (ixtiyoriy)
            </Label>
            <Input
              id="photo"
              value={formData.photo}
              onChange={(e) => handleInputChange("photo", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="uploads/questions/diagram.png"
            />
          </div>

          {(needsOptions || formData.q_type === "MATCHING_HEADINGS") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">
                  Javob Variantlari *
                  {formData.q_type === "MATCHING_HEADINGS" && (
                    <span className="text-xs text-blue-400 ml-2">
                      (Harflar bilan: A, B, C... - to'g'ri javob sifatida saqlanadi)
                    </span>
                  )}
                </Label>
                {formData.q_type !== "MATCHING_HEADINGS" && (
                  <Button
                    type="button"
                    onClick={handleAddOption}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Variant
                  </Button>
                )}
              </div>

              {formData.q_type !== "MATCHING_HEADINGS" && (
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className={`font-mono text-sm w-6 ${
                            formData.q_type === "MATCHING_HEADINGS" ? "text-blue-400 font-bold" : "text-slate-300"
                          }`}
                        >
                          {option.key}:
                        </span>
                        <Input
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white flex-1"
                          placeholder={
                            formData.q_type === "MATCHING_HEADINGS"
                              ? `Heading ${option.key} (to'g'ri javob: ${option.key})`
                              : `Option ${option.key}`
                          }
                          required
                        />
                        <Button
                          type="button"
                          onClick={() => handleCorrectAnswerToggle(option.key)}
                          variant={correctAnswers.includes(option.key) ? "default" : "outline"}
                          size="sm"
                          className={
                            correctAnswers.includes(option.key)
                              ? "bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7 min-w-[60px]"
                              : "border-slate-600 text-slate-300 hover:bg-slate-700 text-xs px-2 py-1 h-7 min-w-[60px]"
                          }
                        >
                          {correctAnswers.includes(option.key)
                            ? formData.q_type === "MATCHING_HEADINGS"
                              ? `✓ ${option.key}`
                              : "To'g'ri"
                            : formData.q_type === "MATCHING_HEADINGS"
                              ? option.key
                              : "Belgilash"}
                        </Button>
                      </div>
                      {options.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {formData.q_type === "MATCHING_HEADINGS" && correctAnswers.length > 0 && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-2 mt-2">
                  <p className="text-green-400 text-xs">
                    <span className="font-semibold">To'g'ri javoblar:</span> {correctAnswers.join(", ")}
                  </p>
                  <p className="text-green-300 text-xs mt-1">Bu raqamlar to'g'ri javob sifatida saqlanadi</p>
                </div>
              )}
            </div>
          )}

          {needsCorrectAnswers && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">To'g'ri Javoblar *</Label>
                <Button
                  type="button"
                  onClick={handleAddCorrectAnswer}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Javob
                </Button>
              </div>

              <div className="space-y-2">
                {correctAnswers.map((answer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={answer}
                      onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white flex-1"
                      placeholder={`To'g'ri javob ${index + 1}`}
                      required
                    />
                    {correctAnswers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveCorrectAnswer(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isTableCompletion && (
            <div className="space-y-4">
              {/* Columns */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Jadval Ustunlari *</Label>
                  <Button
                    type="button"
                    onClick={handleAddColumn}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ustun
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {columns.map((column, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs w-12">#{index + 1}:</span>
                      <Input
                        value={column}
                        onChange={(e) => handleColumnChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Ustun ${index + 1}`}
                        required
                      />
                      {columns.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveColumn(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Jadval Qatorlari *</Label>
                  <Button
                    type="button"
                    onClick={handleAddRow}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Qator
                  </Button>
                </div>
                <div className="space-y-3">
                  {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="border border-slate-600 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs w-16">Qator {rowIndex + 1}:</span>
                        <Input
                          value={row.label}
                          onChange={(e) => handleRowLabelChange(rowIndex, e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white flex-1"
                          placeholder="Qator nomi (masalan: Preferred climate)"
                          required
                        />
                        {rows.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveRow(rowIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                        {row.cells.map((cell, cellIndex) => (
                          <div key={cellIndex} className="space-y-1">
                            <Label className="text-xs text-slate-400">
                              {columns[cellIndex] || `Ustun ${cellIndex + 1}`}
                            </Label>
                            <Input
                              value={cell}
                              onChange={(e) => handleRowCellChange(rowIndex, cellIndex, e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white"
                              placeholder={`Bo'sh joy uchun "" qoldiring`}
                            />
                            <div className="text-xs text-slate-500">
                              Bo'sh joy: {rowIndex}_{cellIndex}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Choices */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Tanlov Variantlari (bo'sh joylar uchun)</Label>
                <div className="text-xs text-slate-400 mb-2">
                  Format: qator_ustun (masalan: 0_2 - 1-qator, 3-ustun uchun). Bo'sh joylar uchun tanlov variantlarini
                  kiriting.
                </div>
                <div className="space-y-2">
                  {Object.entries(choices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newChoices = { ...choices }
                          delete newChoices[key]
                          if (e.target.value) {
                            newChoices[e.target.value] = value
                          }
                          setChoices(newChoices)
                        }}
                        className="bg-slate-700/50 border-slate-600 text-white w-20"
                        placeholder="0_2"
                      />
                      <span className="text-slate-400">:</span>
                      <Input
                        value={value}
                        onChange={(e) => handleChoiceChange(key, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder="Tanlov varianti (masalan: warm)"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const newChoices = { ...choices }
                          delete newChoices[key]
                          setChoices(newChoices)
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => setChoices((prev) => ({ ...prev, "0_0": "" }))}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Tanlov Qo'shish
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isMatchingInformation && (
            <div className="space-y-4">
              {/* Matching Choices */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Tanlov Variantlari *</Label>
                  <Button
                    type="button"
                    onClick={handleAddMatchingChoice}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(matchingChoices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-300 font-mono text-sm w-4">{key}:</span>
                      <Input
                        value={value}
                        onChange={(e) => handleMatchingChoiceChange(key, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`${key} varianti (masalan: the Chinese)`}
                        required
                      />
                      {Object.keys(matchingChoices).length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveMatchingChoice(key)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Matching Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Moslashtiriladigan Elementlar *</Label>
                  <Button
                    type="button"
                    onClick={handleAddMatchingRow}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Element
                  </Button>
                </div>
                <div className="space-y-2">
                  {matchingRows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-8">{index + 1}.</span>
                      <Input
                        value={row}
                        onChange={(e) => handleMatchingRowChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Element ${index + 1} (masalan: black powder)`}
                        required
                      />
                      <Select
                        value={matchingAnswers[(index + 1).toString()] || ""}
                        onValueChange={(value) => handleMatchingAnswerChange(index, value)}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-20">
                          <SelectValue placeholder="?" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {Object.keys(matchingChoices).map((key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {matchingRows.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveMatchingRow(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isMatchingHeadings && (
            <div className="space-y-4">
              {/* Input Count */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Inputlar soni (passagedagi tartib raqamlar)</Label>
                <Input
                  type="number"
                  min="1"
                  value={matchingHeadingsInputCount}
                  onChange={(e) => setMatchingHeadingsInputCount(Number.parseInt(e.target.value) || 1)}
                  className="bg-slate-700/50 border-slate-600 text-white w-32"
                />
                <p className="text-xs text-slate-400">Passageda nechta tartib raqam bor? (1., 2., 3., ...)</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Optionlar (headings) *</Label>
                  <Button
                    type="button"
                    onClick={handleAddMatchingHeadingsOption}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {matchingHeadingsOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold font-mono text-sm w-8">{option.key}:</span>
                      <Input
                        value={option.text}
                        onChange={(e) => handleMatchingHeadingsOptionChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Option ${option.key} (masalan: The importance of...)`}
                        required
                      />
                      {matchingHeadingsOptions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveMatchingHeadingsOption(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answers Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">To'g'ri javoblarni belgilang *</Label>
                <div className="space-y-2">
                  {Array.from({ length: matchingHeadingsInputCount }, (_, i) => i + 1).map((inputNum) => (
                    <div key={inputNum} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-24">Input {inputNum}:</span>
                      <Select
                        value={matchingHeadingsAnswers[inputNum.toString()] || ""}
                        onValueChange={(value) => handleMatchingHeadingsAnswerChange(inputNum.toString(), value)}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1">
                          <SelectValue placeholder="Option tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {matchingHeadingsOptions.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.key}: {option.text.substring(0, 50)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {matchingHeadingsAnswers[inputNum.toString()] && (
                        <span className="text-green-400 text-sm font-bold w-12">
                          ✓ {matchingHeadingsAnswers[inputNum.toString()]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {Object.keys(matchingHeadingsAnswers).length > 0 && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 text-sm font-semibold mb-2">To'g'ri javoblar:</p>
                  <div className="space-y-1">
                    {Object.entries(matchingHeadingsAnswers)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([inputNum, optionKey]) => (
                        <p key={inputNum} className="text-green-300 text-xs">
                          Input {inputNum} → Option {optionKey}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add NOTE_COMPLETION UI section */}
          {isNoteCompletion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Shablonni Kiriting (HTML bilan) *</Label>
                <Textarea
                  value={noteTemplate}
                  onChange={(e) => setNoteTemplate(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white resize-y font-mono text-xs"
                  placeholder="<b>Revision Note</b><br>• Problem with: ____<br>• Company name: ____"
                  rows={4}
                  required
                />
                <p className="text-xs text-slate-400">
                  ____ (to'rt chiziq) bilan bo'sh joylarni belgilang. HTML taglardan foydalanishingiz mumkin: &lt;b&gt;,
                  &lt;br&gt;, &lt;i&gt;, va boshqalar.
                </p>
              </div>

              {/* Correct Answers for blanks */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Bo'sh Joylar uchun To'g'ri Javoblar</Label>
                <div className="text-xs text-slate-400 mb-2">
                  Shablonda nechta ____ bor, shunaqa ko'p javob kiritish kerak. Bir nechta javoblar uchun " / " bilan
                  ajrating.
                </div>
                <div className="space-y-2">
                  {Array.from({ length: (noteTemplate.match(/____/g) || []).length }, (_, i) => i + 1).map((num) => (
                    <div key={num} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-16">Javob {num}:</span>
                      <Input
                        value={noteAnswers[num.toString()] || ""}
                        onChange={(e) =>
                          setNoteAnswers((prev) => ({
                            ...prev,
                            [num.toString()]: e.target.value,
                          }))
                        }
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder="Masalan: Sunrise yoki center / centre"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUMMARY_DRAG UI section */}
          {isSummaryDrag && (
            <div className="space-y-4">
              {/* Column Headers */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Ustun Sarlavhalari (2 ta) *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {summaryDragRows.map((row, index) => (
                    <Input
                      key={index}
                      value={row}
                      onChange={(e) => {
                        const newRows = [...summaryDragRows]
                        newRows[index] = e.target.value
                        setSummaryDragRows(newRows)
                      }}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder={index === 0 ? "Masalan: People" : "Masalan: Staff Responsibilities"}
                      required
                    />
                  ))}
                </div>
              </div>

              {/* Left Column Items (Choices) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Chap Ustun Elementlari ({summaryDragRows[0]}) *</Label>
                  <Button
                    type="button"
                    onClick={() =>
                      setSummaryDragChoices((prev) => ({ ...prev, [(Object.keys(prev).length + 1).toString()]: "" }))
                    }
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Element
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(summaryDragChoices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-300 font-mono text-sm w-8">{key}.</span>
                      <Input
                        value={value}
                        onChange={(e) =>
                          setSummaryDragChoices((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Element ${key} (masalan: Mary Brown)`}
                        required
                      />
                      {Object.keys(summaryDragChoices).length > 1 && (
                        <Button
                          type="button"
                          onClick={() => {
                            const newChoices = { ...summaryDragChoices }
                            delete newChoices[key]
                            setSummaryDragChoices(newChoices)
                            const newAnswers = { ...summaryDragAnswers }
                            delete newAnswers[key]
                            setSummaryDragAnswers(newAnswers)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column Items (Options) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">O'ng Ustun Elementlari ({summaryDragRows[1]}) *</Label>
                  <Button
                    type="button"
                    onClick={() => setSummaryDragOptions((prev) => [...prev, ""])}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {summaryDragOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...summaryDragOptions]
                          newOptions[index] = e.target.value
                          setSummaryDragOptions(newOptions)
                        }}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Option ${index + 1} (masalan: Finance)`}
                        required
                      />
                      {summaryDragOptions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => {
                            const newOptions = summaryDragOptions.filter((_, i) => i !== index)
                            setSummaryDragOptions(newOptions)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answers */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">To'g'ri Javoblarni Belgilang *</Label>
                <div className="space-y-2">
                  {Object.entries(summaryDragChoices).map(([choiceKey, choiceValue]) => (
                    <div key={choiceKey} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-32">{choiceValue}:</span>
                      <Select
                        value={summaryDragAnswers[choiceKey] || ""}
                        onValueChange={(value) =>
                          setSummaryDragAnswers((prev) => ({
                            ...prev,
                            [choiceKey]: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1">
                          <SelectValue placeholder="Option tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {summaryDragOptions.map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {summaryDragAnswers[choiceKey] && <span className="text-green-400 text-sm font-bold">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading
                ? "Saqlanmoqda..."
                : editingQuestion
                  ? "Saqlash"
                  : copyingQuestion
                    ? "Nusxa Yaratish"
                    : "Yaratish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
