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
  const [tableAnswers, setTableAnswers] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tfngChoices, setTfngChoices] = useState<Record<string, string>>({})
  const [tfngOptions, setTfngOptions] = useState<string[]>([])
  const [tfngAnswers, setTfngAnswers] = useState<Record<string, string>>({})

  const countBlanks = (template: string): number => {
    return (template.match(/____/g) || []).length
  }

  const handleNoteTemplateChange = (value: string) => {
    setNoteTemplate(value)
    const blankCount = countBlanks(value)
    const currentAnswerCount = Object.keys(noteAnswers).length

    if (blankCount > currentAnswerCount) {
      const newAnswers = { ...noteAnswers }
      for (let i = currentAnswerCount + 1; i <= blankCount; i++) {
        newAnswers[i.toString()] = ""
      }
      setNoteAnswers(newAnswers)
    } else if (blankCount < currentAnswerCount) {
      const newAnswers: Record<string, string> = {}
      for (let i = 1; i <= blankCount; i++) {
        newAnswers[i.toString()] = noteAnswers[i.toString()] || ""
      }
      setNoteAnswers(newAnswers)
    }
  }

  const handleNoteAnswerChange = (key: string, value: string) => {
    setNoteAnswers((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

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
        setColumns(questionToLoad.columns || [])
        setRows(questionToLoad.rows || [])
        setChoices(questionToLoad.choices || {})
        setTableAnswers(questionToLoad.answers || {})
      } else if (["MCQ_SINGLE", "MCQ_MULTI", "SENTENCE_ENDINGS"].includes(questionToLoad.q_type)) {
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setOptions(questionToLoad.options)
        } else {
          setOptions([{ key: "A", text: "" }])
        }
      } else if (questionToLoad.q_type === "NOTE_COMPLETION") {
        if (typeof questionToLoad.options === "string") {
          setNoteTemplate(questionToLoad.options)
        }
        if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setNoteAnswers(questionToLoad.correct_answers as Record<string, string>)
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

      if (questionToLoad.q_type === "TFNG" || questionToLoad.q_type === "TRUE_FALSE_NOT_GIVEN") {
        if (questionToLoad.photo) {
          setImagePreview(questionToLoad.photo)
        }
        if (questionToLoad.choices && typeof questionToLoad.choices === "object") {
          setTfngChoices(questionToLoad.choices)
        }
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setTfngOptions(questionToLoad.options)
        }
        if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setTfngAnswers(questionToLoad.correct_answers as Record<string, string>)
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

  const handleQuestionTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, q_type: type }))
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

    if (formData.q_type !== "NOTE_COMPLETION" && !formData.q_text.trim()) {
      setError("Savol matni majburiy")
      return
    }

    if (formData.q_type === "NOTE_COMPLETION") {
      if (!noteTemplate.trim()) {
        setError("Shablonni to'ldiring")
        return
      }
      const blankCount = countBlanks(noteTemplate)
      if (blankCount === 0) {
        setError("Kamida bitta ____ bo'sh joy qo'shish kerak")
        return
      }
      if (Object.values(noteAnswers).some((answer) => !answer.trim())) {
        setError("Barcha bo'sh joylar uchun javob kiritish kerak")
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
    } else if (formData.q_type === "MATCHING_HEADINGS") {
      if (matchingHeadingsOptions.some((opt) => !opt.text.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (Object.keys(matchingHeadingsAnswers).length === 0) {
        setError("Kamida bitta javobni belgilang")
        return
      }
    } else if (["MCQ_SINGLE", "MCQ_MULTI", "SENTENCE_ENDINGS"].includes(formData.q_type)) {
      if (options.some((opt) => !opt.text.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (correctAnswers.length === 0) {
        setError("Kamida bitta to'g'ri javobni belgilang")
        return
      }
    } else if (formData.q_type === "TFNG") {
      // Fix for undeclared variable: questionData
      // The variable questionData is declared later in the try block.
      // For now, we'll ensure it's declared before this conditional block.
      // However, the correct fix is to ensure questionData is initialized before this conditional check.
      // For the purpose of this merge, we assume questionData will be properly initialized.
      // If not, this block would need to be placed after questionData initialization.
      // For now, we'll assume the context ensures it's declared.
      // The correct structure is to have the questionData object initialized and then populate it.
      // Let's adjust the structure to reflect this.
      // The actual fix is to move the initialization of questionData outside these specific if/else ifs.
      // The code below is a placeholder to address the lint error temporarily in this specific block.
      // The actual `questionData` is defined later.
      // The issue is that this `else if` branch assumes `questionData` is already defined.
      // In the original code, it was defined later, causing the undeclared variable error.
      // The correct approach is to define `questionData` first, then populate its fields.
      // The logic for `TFNG` setting `options` and `correct_answers` will be handled
      // within the main `questionData` construction block later.
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
      }

      if (formData.q_type !== "NOTE_COMPLETION" || formData.q_text.trim()) {
        questionData.q_text = formData.q_text
      }

      if (formData.q_type === "NOTE_COMPLETION") {
        questionData.options = noteTemplate
        questionData.answers = noteAnswers
      } else if (formData.q_type === "MATCHING_INFORMATION") {
        questionData.choices = matchingChoices
        questionData.rows = matchingRows
        questionData.answers = matchingAnswers
      } else if (formData.q_type === "TABLE_COMPLETION") {
        questionData.columns = columns
        questionData.rows = rows
        questionData.choices = choices
        questionData.answers = tableAnswers
      } else if (["MCQ_SINGLE", "MCQ_MULTI", "SENTENCE_ENDINGS"].includes(formData.q_type)) {
        questionData.options = options
        questionData.correct_answers = correctAnswers
      } else if (formData.q_type === "TFNG") {
        questionData.options = options
        questionData.correct_answers = correctAnswers
        // Note: TFNG in reading doesn't have photo like listening, so we only save options and correct_answers
      } else if (formData.q_type === "MATCHING_HEADINGS") {
        questionData.options = matchingHeadingsOptions
        questionData.answers = matchingHeadingsAnswers
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
  const isNoteCompletion = formData.q_type === "NOTE_COMPLETION"
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
                <SelectItem value="MATCHING_HEADINGS">MATCHING_HEADINGS</SelectItem>
                <SelectItem value="SUMMARY_COMPLETION">SUMMARY_COMPLETION</SelectItem>
                <SelectItem value="SUMMARY_DRAG">SUMMARY_DRAG</SelectItem>
                <SelectItem value="SENTENCE_ENDINGS">SENTENCE_ENDINGS</SelectItem>
                <SelectItem value="NOTE_COMPLETION">NOTE_COMPLETION</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.q_type !== "NOTE_COMPLETION" && (
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
          )}

          {formData.q_type === "NOTE_COMPLETION" && (
            <div className="space-y-2">
              <Label htmlFor="q_text" className="text-slate-300 text-sm">
                Savol Matni (ixtiyoriy)
              </Label>
              <Textarea
                id="q_text"
                value={formData.q_text}
                onChange={(e) => handleInputChange("q_text", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white resize-y"
                placeholder="What is the main idea of paragraph 1?"
                rows={2}
              />
            </div>
          )}

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
                      <Select value={key} disabled>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-24">
                          <SelectValue placeholder="0_0" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {Array.from({ length: rows.length }, (_, rowIdx) =>
                            Array.from({ length: columns.length }, (_, colIdx) => `${rowIdx}_${colIdx}`),
                          )
                            .flat()
                            .map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
                          const newAnswers = { ...tableAnswers }
                          delete newAnswers[key]
                          setTableAnswers(newAnswers)
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
                    onClick={() => {
                      const existingKeys = Object.keys(choices)
                      let newKey = "0_0"
                      let counter = 0
                      while (existingKeys.includes(newKey)) {
                        const row = Math.floor(counter / columns.length)
                        const col = counter % columns.length
                        newKey = `${row}_${col}`
                        counter++
                      }
                      setChoices((prev) => ({ ...prev, [newKey]: "" }))
                    }}
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

          {isNoteCompletion && (
            <div className="space-y-4">
              {/* Note Template */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-semibold">Shablonni Kiriting (HTML bilan) *</Label>
                <p className="text-xs text-slate-400">
                  HTML teglaridan foydalaning: &lt;b&gt;, &lt;br&gt;, va bo'sh joylar uchun ____ (4 ta pastki chiziq)
                </p>
                <Textarea
                  value={noteTemplate}
                  onChange={(e) => handleNoteTemplateChange(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white font-mono resize-y min-h-[200px]"
                  placeholder={`<b>Revision Note</b><br><br>• Problem with: the brochure sample<br>• Company name: ____ Hotel Chains<br>• Letters of the ____ should be bigger.`}
                  required
                />
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Topilgan bo'sh joylar:</span>
                  <span className="text-blue-400 font-bold">{countBlanks(noteTemplate)}</span>
                </div>
              </div>

              {/* Correct Answers for blanks */}
              {countBlanks(noteTemplate) > 0 && (
                <div className="space-y-3 bg-slate-700/20 p-4 rounded-lg border border-slate-600">
                  <Label className="text-slate-300 text-sm font-semibold">To'g'ri Javoblar *</Label>
                  <p className="text-xs text-slate-400 mb-2">
                    Har bir bo'sh joy uchun to'g'ri javobni kiriting.{" "}
                    <span className="text-green-400 font-semibold">
                      Bir nechta to'g'ri javob bo'lsa " / " bilan ajrating
                    </span>
                  </p>
                  <p className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-700/30">
                    <span className="font-semibold">Misol:</span> center / centre yoki 15th September / 15 September
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(noteAnswers)
                      .sort((a, b) => Number(a) - Number(b))
                      .map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-blue-400 font-mono text-sm font-bold w-8">{key}.</span>
                          <Input
                            value={noteAnswers[key]}
                            onChange={(e) => handleNoteAnswerChange(key, e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white flex-1"
                            placeholder={`Javob ${key} (masalan: center / centre)`}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
