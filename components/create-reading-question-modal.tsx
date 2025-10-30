"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, type ReadingQuestion } from "@/lib/api"
import { Plus, X, HelpCircle } from "lucide-react"

const QUESTION_TYPES = {
  TFNG: "TRUE_FALSE_NOT_GIVEN",
  MCQ_SINGLE: "MULTIPLE_CHOICE_SINGLE",
  MCQ_MULTI: "MULTIPLE_CHOICE_MULTI",
  SENTENCE_COMPLETION: "SENTENCE_COMPLETION",
  TABLE_COMPLETION: "TABLE_COMPLETION",
  MATCHING_INFORMATION: "MATCHING_INFORMATION",
  MATCHING_HEADINGS: "MATCHING_HEADINGS",
  SUMMARY_COMPLETION: "SUMMARY_COMPLETION",
  SUMMARY_DRAG: "SUMMARY_DRAG",
  SENTENCE_ENDINGS: "SENTENCE_ENDINGS",
  FLOW_CHART: "FLOW_CHART",
  NOTE_COMPLETION: "NOTE_COMPLETION",
  MAP_LABELING: "MAP_LABELING",
}

interface CreateReadingQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  readingQuestionsId: string
  onQuestionCreated: () => void
  editingQuestion?: ReadingQuestion | null
  copyingQuestion?: ReadingQuestion | null
}

export function CreateReadingQuestionModal({
  isOpen,
  onClose,
  readingQuestionsId,
  onQuestionCreated,
  editingQuestion,
  copyingQuestion,
}: CreateReadingQuestionModalProps) {
  const [formData, setFormData] = useState({
    q_type: "MCQ_SINGLE" as ReadingQuestion["q_type"],
    q_text: "",
  })
  const [options, setOptions] = useState([{ key: "A", text: "" }])
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [columns, setColumns] = useState<string[]>(["", "", ""]) // First element is corner label, rest are column headers
  const [rows, setRows] = useState<Array<{ label: string; cells: string[] }>>([{ label: "", cells: ["", ""] }])
  const [detectedBlanks, setDetectedBlanks] = useState<
    Array<{ type: string; row?: number; col?: number; key: string; blankIndex?: number; displayLabel?: string }>
  >([])
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({})
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
  const [summaryDragRows, setSummaryDragRows] = useState<Array<{ label: string; value: string }>>([
    { label: "People", value: "" },
    { label: "Staff Responsibilities", value: "" },
  ])
  const [summaryDragChoices, setSummaryDragChoices] = useState<Record<string, string>>({ "1": "" })
  const [summaryDragOptions, setSummaryDragOptions] = useState<string[]>([""])
  const [summaryDragAnswers, setSummaryDragAnswers] = useState<Record<string, string>>({})

  const [sentenceEndingsOptions, setSentenceEndingsOptions] = useState<Record<string, string>>({})
  const [sentenceEndingsChoices, setSentenceEndingsChoices] = useState<Record<string, string>>({})
  const [sentenceEndingsAnswers, setSentenceEndingsAnswers] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tableAnswers, setTableAnswers] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const countBlanks = (template: string): number => {
    return (template.match(/____/g) || []).length
  }

  const detectBlanksInTable = (tableColumns: string[], tableRows: Array<{ label: string; cells: string[] }>) => {
    const blanks: Array<{
      type: string
      row?: number
      col?: number
      key: string
      blankIndex?: number
      displayLabel?: string
    }> = []

    // Row 0 = header row (corner + columns)
    // Row 1+ = data rows
    // Column 0 = labels column (corner + row labels)
    // Column 1+ = data columns

    // Check corner label (columns[0]) - position [0,0]
    const cornerLabel = tableColumns[0] || ""
    const cornerMatches = cornerLabel.match(/____/g) || []
    cornerMatches.forEach((_, blankIdx) => {
      const key = `0_0_${blankIdx + 1}`
      blanks.push({
        type: "corner",
        row: 0,
        col: 0,
        key,
        blankIndex: blankIdx + 1,
        displayLabel: `Burchak [0,0] (Bo'sh joy #${blankIdx + 1})`,
      })
    })

    // Check column headers (columns[1+]) - position [0, columnIndex]
    tableColumns.slice(1).forEach((col, idx) => {
      const colIndex = idx + 1 // Real column index (1, 2, 3, ...)
      const blankMatches = col.match(/____/g) || []
      blankMatches.forEach((_, blankIdx) => {
        const key = `0_${colIndex}_${blankIdx + 1}`
        blanks.push({
          type: "column",
          row: 0,
          col: colIndex,
          key,
          blankIndex: blankIdx + 1,
          displayLabel: `Ustun [0,${colIndex}] (Bo'sh joy #${blankIdx + 1})`,
        })
      })
    })

    // Check row labels and cells
    tableRows.forEach((row, rowIdx) => {
      const rowIndex = rowIdx + 1 // Real row index (1, 2, 3, ...)

      // Check row label - position [rowIndex, 0]
      const rowLabelMatches = row.label.match(/____/g) || []
      rowLabelMatches.forEach((_, blankIdx) => {
        const key = `${rowIndex}_0_${blankIdx + 1}`
        blanks.push({
          type: "row",
          row: rowIndex,
          col: 0,
          key,
          blankIndex: blankIdx + 1,
          displayLabel: `Qator [${rowIndex},0] (Bo'sh joy #${blankIdx + 1})`,
        })
      })

      // Check cells - position [rowIndex, columnIndex]
      row.cells.forEach((cell, cellIdx) => {
        const colIndex = cellIdx + 1 // Real column index (1, 2, 3, ...)
        const cellMatches = cell.match(/____/g) || []
        cellMatches.forEach((_, blankIdx) => {
          const key = `${rowIndex}_${colIndex}_${blankIdx + 1}`
          blanks.push({
            type: "cell",
            row: rowIndex,
            col: colIndex,
            key,
            blankIndex: blankIdx + 1,
            displayLabel: `Hujayra [${rowIndex},${colIndex}] (Bo'sh joy #${blankIdx + 1})`,
          })
        })
      })
    })

    setDetectedBlanks(blanks)

    // Preserve existing answers, add new blank entries
    const newAnswers: Record<string, string> = {}
    blanks.forEach((blank) => {
      newAnswers[blank.key] = blankAnswers[blank.key] || ""
    })
    setBlankAnswers(newAnswers)
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
      const newAnswers = { ...noteAnswers }
      for (let i = blankCount + 1; i <= currentAnswerCount; i++) {
        delete newAnswers[i.toString()]
      }
      setNoteAnswers(newAnswers)
    }
  }

  const handleNoteAnswerChange = (key: string, value: string) => {
    setNoteAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSentenceEndingsOptionChange = (key: string, value: string) => {
    setSentenceEndingsOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddSentenceEndingsOption = () => {
    const nextKey = (Object.keys(sentenceEndingsOptions).length + 1).toString()
    setSentenceEndingsOptions((prev) => ({ ...prev, [nextKey]: "" }))
  }

  const handleRemoveSentenceEndingsOption = (key: string) => {
    if (Object.keys(sentenceEndingsOptions).length > 1) {
      const newOptions = { ...sentenceEndingsOptions }
      delete newOptions[key]
      setSentenceEndingsOptions(newOptions)
      const newAnswers = { ...sentenceEndingsAnswers }
      delete newAnswers[key]
      setSentenceEndingsAnswers(newAnswers)
    }
  }

  const handleSentenceEndingsChoiceChange = (key: string, value: string) => {
    setSentenceEndingsChoices((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddSentenceEndingsChoice = () => {
    const nextKey = String.fromCharCode(65 + Object.keys(sentenceEndingsChoices).length)
    setSentenceEndingsChoices((prev) => ({ ...prev, [nextKey]: "" }))
  }

  const handleRemoveSentenceEndingsChoice = (key: string) => {
    if (Object.keys(sentenceEndingsChoices).length > 1) {
      const newChoices = { ...sentenceEndingsChoices }
      delete newChoices[key]
      setSentenceEndingsChoices(newChoices)
      const newAnswers = { ...sentenceEndingsAnswers }
      Object.keys(newAnswers).forEach((answerKey) => {
        if (newAnswers[answerKey] === key) {
          delete newAnswers[answerKey]
        }
      })
      setSentenceEndingsAnswers(newAnswers)
    }
  }

  const handleSentenceEndingsAnswerChange = (optionKey: string, choiceKey: string) => {
    setSentenceEndingsAnswers((prev) => ({
      ...prev,
      [optionKey]: choiceKey,
    }))
  }

  useEffect(() => {
    const questionToLoad = editingQuestion || copyingQuestion

    if (questionToLoad) {
      setFormData({
        q_type: questionToLoad.q_type,
        q_text: questionToLoad.q_text || "",
      })

      if (questionToLoad.q_type === "SENTENCE_ENDINGS") {
        if (
          questionToLoad.options &&
          typeof questionToLoad.options === "object" &&
          !Array.isArray(questionToLoad.options)
        ) {
          setSentenceEndingsOptions(questionToLoad.options as Record<string, string>)
        }
        if (questionToLoad.choices && typeof questionToLoad.choices === "object") {
          setSentenceEndingsChoices(questionToLoad.choices as Record<string, string>)
        }
        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setSentenceEndingsAnswers(questionToLoad.answers as Record<string, string>)
        }
      } else if (questionToLoad.q_type === "NOTE_COMPLETION") {
        if (typeof questionToLoad.options === "string") {
          setNoteTemplate(questionToLoad.options)
        }
        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setNoteAnswers(questionToLoad.answers as Record<string, string>)
        } else if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setNoteAnswers(questionToLoad.correct_answers as Record<string, string>)
        }
      } else if (questionToLoad.q_type === "SUMMARY_DRAG") {
        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          setSummaryDragRows(questionToLoad.rows as Array<{ label: string; value: string }>)
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
      } else if (["MCQ_SINGLE", "MCQ_MULTI"].includes(questionToLoad.q_type)) {
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setOptions(questionToLoad.options)
        }
        if (questionToLoad.correct_answers && Array.isArray(questionToLoad.correct_answers)) {
          setCorrectAnswers(questionToLoad.correct_answers)
        }
      } else if (questionToLoad.q_type === "TABLE_COMPLETION") {
        if (questionToLoad.columns && Array.isArray(questionToLoad.columns)) {
          setColumns(questionToLoad.columns.length > 0 ? questionToLoad.columns : ["", "", ""])
        } else {
          setColumns(["", "", ""])
        }

        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          setRows(questionToLoad.rows)
        } else {
          setRows([{ label: "", cells: ["", ""] }])
        }

        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setBlankAnswers(questionToLoad.answers as Record<string, string>)
        }

        if (questionToLoad.columns && questionToLoad.rows) {
          setTimeout(() => {
            const actualColumns = questionToLoad.columns!.slice(1)
            detectBlanksInTable(actualColumns, questionToLoad.rows as Array<{ label: string; cells: string[] }>)
          }, 100)
        }
      } else if (questionToLoad.q_type === "MATCHING_INFORMATION") {
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
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          const headingsOptions = questionToLoad.options.map((text, index) => ({
            key: String.fromCharCode(65 + index),
            text,
          }))
          setMatchingHeadingsOptions(headingsOptions)
        }
        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          setMatchingHeadingsInputCount(questionToLoad.rows.length)
        }
        if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setMatchingHeadingsAnswers(questionToLoad.correct_answers as Record<string, string>)
        }
      }
    } else {
      setFormData({
        q_type: "MCQ_SINGLE",
        q_text: "",
      })
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns(["", "", ""])
      setRows([{ label: "", cells: ["", ""] }])
      setBlankAnswers({})
      setDetectedBlanks([])
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMatchingHeadingsOptions([{ key: "A", text: "" }])
      setMatchingHeadingsInputCount(1)
      setMatchingHeadingsAnswers({})
      setNoteTemplate("")
      setNoteAnswers({})
      setSummaryDragRows([
        { label: "People", value: "" },
        { label: "Staff Responsibilities", value: "" },
      ])
      setSummaryDragChoices({ "1": "" })
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
      setSentenceEndingsOptions({})
      setSentenceEndingsChoices({})
      setSentenceEndingsAnswers({})
      setImagePreview(null)
      setPhotoFile(null)
    }
  }, [editingQuestion, copyingQuestion, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuestionTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, q_type: value as ReadingQuestion["q_type"] }))

    if (value === "NOTE_COMPLETION") {
      setNoteTemplate("")
      setNoteAnswers({})
    } else if (value === "SENTENCE_ENDINGS") {
      setSentenceEndingsOptions({})
      setSentenceEndingsChoices({})
      setSentenceEndingsAnswers({})
    } else if (value === "SUMMARY_DRAG") {
      setSummaryDragRows([
        { label: "People", value: "" },
        { label: "Staff Responsibilities", value: "" },
      ])
      setSummaryDragChoices({ "1": "" })
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
    } else if (value === "TABLE_COMPLETION") {
      setColumns(["", "", ""])
      setRows([{ label: "", cells: ["", ""] }])
      setBlankAnswers({})
      setDetectedBlanks([])
    } else if (value === "MATCHING_INFORMATION") {
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
    } else if (value === "MATCHING_HEADINGS") {
      setMatchingHeadingsOptions([{ key: "A", text: "" }])
      setMatchingHeadingsInputCount(1)
      setMatchingHeadingsAnswers({})
    } else if (["MCQ_SINGLE", "MCQ_MULTI"].includes(value)) {
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddOption = () => {
    const nextKey = String.fromCharCode(65 + options.length)
    setOptions([...options, { key: nextKey, text: "" }])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index)
      const reassignedOptions = newOptions.map((option, i) => ({
        ...option,
        key: String.fromCharCode(65 + i),
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
    if (formData.q_type === "MCQ_SINGLE") {
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
    if (index === 0 || columns.length <= 2) return

    const newColumns = columns.filter((_, i) => i !== index)
    setColumns(newColumns)

    // Adjust cell index (subtract 1 because columns[0] is corner label)
    const cellIndex = index - 1
    const newRows = rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== cellIndex),
    }))
    setRows(newRows)

    // Detect blanks with actual columns (skip corner label)
    detectBlanksInTable(newColumns.slice(1), newRows)
  }

  const handleColumnChange = (index: number, value: string) => {
    const newColumns = [...columns]
    newColumns[index] = value
    setColumns(newColumns)

    if (index > 0) {
      detectBlanksInTable(newColumns.slice(1), rows)
    }
  }

  const handleAddRow = () => {
    setRows([...rows, { label: "", cells: new Array(columns.length - 1).fill("") }])
  }

  const handleRemoveRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index)
      setRows(newRows)
      detectBlanksInTable(columns.slice(1), newRows) // Pass actual columns
    }
  }

  const handleRowLabelChange = (rowIndex: number, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex].label = value
    setRows(newRows)
    detectBlanksInTable(columns.slice(1), newRows) // Pass actual columns
  }

  const handleRowCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex].cells[cellIndex] = value
    setRows(newRows)
    detectBlanksInTable(columns.slice(1), newRows) // Pass actual columns
  }

  const handleBlankAnswerChange = (key: string, value: string) => {
    setBlankAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleChoiceChange = (key: string, value: string) => {
    setChoices((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddMatchingChoice = () => {
    const keys = Object.keys(matchingChoices)
    const nextKey = String.fromCharCode(65 + keys.length)
    setMatchingChoices((prev) => ({ ...prev, [nextKey]: "" }))
  }

  const handleRemoveMatchingChoice = (key: string) => {
    if (Object.keys(matchingChoices).length > 1) {
      const newChoices = { ...matchingChoices }
      delete newChoices[key]
      setMatchingChoices(newChoices)
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
    setMatchingHeadingsOptions([...matchingHeadingsOptions, { key: nextKey, text: "" }])
  }

  const handleRemoveMatchingHeadingsOption = (index: number) => {
    if (matchingHeadingsOptions.length > 1) {
      const newOptions = matchingHeadingsOptions.filter((_, i) => i !== index)
      const reassignedOptions = newOptions.map((option, i) => ({
        ...option,
        key: String.fromCharCode(65 + i),
      }))
      setMatchingHeadingsOptions(reassignedOptions)
    }
  }

  const handleMatchingHeadingsOptionChange = (index: number, text: string) => {
    const newOptions = [...matchingHeadingsOptions]
    newOptions[index].text = text
    setMatchingHeadingsOptions(newOptions)
  }

  const handleAddMatchingHeadingsInput = () => {
    setMatchingHeadingsInputCount((prev) => prev + 1)
  }

  const handleRemoveMatchingHeadingsInput = () => {
    if (matchingHeadingsInputCount > 1) {
      setMatchingHeadingsInputCount((prev) => prev - 1)
      const newAnswers = { ...matchingHeadingsAnswers }
      delete newAnswers[matchingHeadingsInputCount.toString()]
      setMatchingHeadingsAnswers(newAnswers)
    }
  }

  const handleMatchingHeadingsAnswerChange = (inputIndex: number, optionKey: string) => {
    setMatchingHeadingsAnswers((prev) => ({
      ...prev,
      [inputIndex.toString()]: optionKey,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!readingQuestionsId) return

    if (formData.q_type === "TABLE_COMPLETION") {
      if (columns.slice(1).length === 0 || rows.length === 0) {
        // Skip corner label for column check
        setError("Jadvalda kamida bitta ustun va qator bo'lishi kerak")
        return
      }
      if (detectedBlanks.length === 0) {
        setError("Jadvalda kamida bitta bo'sh joy (____ bilan belgilang) bo'lishi kerak")
        return
      }
      if (Object.values(blankAnswers).some((answer) => !answer.trim())) {
        setError("Barcha bo'sh joylar uchun javoblarni to'ldiring")
        return
      }
    } else if (formData.q_type === "SENTENCE_ENDINGS") {
      if (Object.values(sentenceEndingsOptions).some((opt) => !opt.trim())) {
        setError("Barcha sentence beginninglarni to'ldiring")
        return
      }
      if (Object.values(sentenceEndingsChoices).some((choice) => !choice.trim())) {
        setError("Barcha sentence endinglarni to'ldiring")
        return
      }
      if (Object.keys(sentenceEndingsAnswers).length === 0) {
        setError("Kamida bitta javobni belgilang")
        return
      }
    } else if (formData.q_type === "NOTE_COMPLETION") {
      if (!noteTemplate.trim()) {
        setError("Shablonni to'ldiring")
        return
      }
      const emptyAnswers = Object.entries(noteAnswers).filter(([_, value]) => !value.trim())
      if (emptyAnswers.length > 0) {
        setError("Barcha javoblarni to'ldiring. Bo'sh javoblar mavjud!")
        return
      }
    } else if (formData.q_type === "SUMMARY_DRAG") {
      if (Object.values(summaryDragChoices).some((choice) => !choice.trim())) {
        setError("Barcha tanlov variantlarini to'ldiring")
        return
      }
      if (summaryDragOptions.some((opt) => !opt.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (Object.keys(summaryDragAnswers).length === 0) {
        setError("Kamida bitta to'g'ri javobni belgilang")
        return
      }
    } else if (["MCQ_SINGLE", "MCQ_MULTI"].includes(formData.q_type)) {
      if (options.some((opt) => !opt.text.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (correctAnswers.length === 0) {
        setError("Kamida bitta to'g'ri javobni belgilang")
        return
      }
    } else if (formData.q_type === "TABLE_COMPLETION") {
      if (columns.slice(1).some((col) => !col.trim()) || rows.some((row) => !row.label.trim())) {
        // Skip corner label for column check
        setError("Barcha jadval maydonlarini to'ldiring")
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
        setError("Barcha sarlavhalarni to'ldiring")
        return
      }
      if (Object.keys(matchingHeadingsAnswers).length === 0) {
        setError("Kamida bitta javobni belgilang")
        return
      }
    } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.q_type)) {
      if (correctAnswers.length === 0 || correctAnswers.some((answer) => !answer.trim())) {
        setError("Kamida bitta to'g'ri javobni kiriting")
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

      if (formData.q_text.trim()) {
        questionData.q_text = formData.q_text
      }

      if (formData.q_type === "SENTENCE_ENDINGS") {
        questionData.options = sentenceEndingsOptions
        questionData.choices = sentenceEndingsChoices
        questionData.answers = sentenceEndingsAnswers
      } else if (formData.q_type === "NOTE_COMPLETION") {
        questionData.options = noteTemplate
        questionData.answers = noteAnswers
      } else if (formData.q_type === "SUMMARY_DRAG") {
        questionData.rows = summaryDragRows
        questionData.choices = summaryDragChoices
        questionData.options = summaryDragOptions
        questionData.answers = summaryDragAnswers
      } else if (["MCQ_SINGLE", "MCQ_MULTI"].includes(formData.q_type)) {
        questionData.options = options
        questionData.correct_answers = correctAnswers
      } else if (formData.q_type === "TABLE_COMPLETION") {
        questionData.columns = columns // [cornerLabel, Column 0, Column 1, ...]
        questionData.rows = rows // [{ label: "Row 0", cells: ["cell", "cell"] }, ...]
        questionData.answers = blankAnswers // { "cell_0_0_1": "answer", ... }
      } else if (formData.q_type === "MATCHING_INFORMATION") {
        questionData.choices = matchingChoices
        questionData.rows = matchingRows
        questionData.answers = matchingAnswers
      } else if (formData.q_type === "MATCHING_HEADINGS") {
        questionData.options = matchingHeadingsOptions.map((opt) => opt.text)
        questionData.rows = Array.from({ length: matchingHeadingsInputCount }, (_, i) => `Input ${i + 1}`)
        questionData.correct_answers = matchingHeadingsAnswers
      } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.q_type)) {
        questionData.correct_answers = correctAnswers
      }

      // columns array structure: [cornerLabel, column1, column2, ...]

      console.log("[v0] API POST Request:", JSON.stringify(questionData, null, 2))

      if (editingQuestion && !copyingQuestion) {
        await api.rQuestions.update(editingQuestion.id.toString(), questionData)
      } else {
        await api.rQuestions.create(questionData)
      }

      onQuestionCreated()
      onClose()
    } catch (err) {
      console.error("[v0] Error:", err)
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const isSentenceEndings = formData.q_type === "SENTENCE_ENDINGS"
  const isNoteCompletion = formData.q_type === "NOTE_COMPLETION"
  const isSummaryDrag = formData.q_type === "SUMMARY_DRAG"
  const isTableCompletion = formData.q_type === "TABLE_COMPLETION"
  const isMatchingInformation = formData.q_type === "MATCHING_INFORMATION"
  const isMatchingHeadings = formData.q_type === "MATCHING_HEADINGS"

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

          <div className="space-y-2">
            <Label htmlFor="q_type" className="text-slate-300 text-sm">
              Savol Turi *
            </Label>
            <Select value={formData.q_type} onValueChange={handleQuestionTypeChange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
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

          <div className="space-y-2">
            <Label htmlFor="q_text" className="text-slate-300 text-sm">
              Savol Matni (ixtiyoriy)
            </Label>
            <Textarea
              id="q_text"
              value={formData.q_text}
              onChange={(e) => handleInputChange("q_text", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white resize-y min-h-[80px]"
              placeholder="Savol matni (ixtiyoriy)"
            />
          </div>

          {/* Conditionally render options based on q_type */}
          {["MCQ_SINGLE", "MCQ_MULTI", "SUMMARY_COMPLETION"].includes(formData.q_type) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">Javob Variantlari *</Label>
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
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-slate-300 font-mono text-sm w-4">{option.key}:</span>
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white flex-1"
                      placeholder={`Option ${option.key}`}
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => handleCorrectAnswerToggle(option.key)}
                      variant={correctAnswers.includes(option.key) ? "default" : "outline"}
                      size="sm"
                      className={
                        correctAnswers.includes(option.key)
                          ? "bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7"
                          : "border-slate-600 text-slate-300 hover:bg-slate-700 text-xs px-2 py-1 h-7"
                      }
                    >
                      {correctAnswers.includes(option.key) ? "To'g'ri" : "Belgilash"}
                    </Button>
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
            </div>
          )}

          {["SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(formData.q_type) && (
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
              <p className="text-xs text-slate-400 mb-2">
                <span className="text-green-400 font-semibold">
                  Bir nechta to'g'ri javob bo'lsa " / " bilan ajrating
                </span>
              </p>
              <p className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-700/30 mb-2">
                <span className="font-semibold">Misol:</span> center / centre yoki 15th September / 15 September
              </p>
              <div className="space-y-2">
                {correctAnswers.map((answer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={answer}
                      onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white flex-1"
                      placeholder={`To'g'ri javob ${index + 1} (masalan: center / centre)`}
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

          {isSentenceEndings && (
            <div className="space-y-4">
              {/* Sentence Beginnings (Options) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm font-semibold">
                    Sentence Beginnings (Cümlə Başlanğıcları) *
                  </Label>
                  <Button
                    type="button"
                    onClick={handleAddSentenceEndingsOption}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Qo'shish
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(sentenceEndingsOptions)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold font-mono text-sm w-6">{key}:</span>
                        <Textarea
                          value={value}
                          onChange={(e) => handleSentenceEndingsOptionChange(key, e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white flex-1"
                          placeholder={`Sentence beginning ${key}`}
                          rows={2}
                          required
                        />
                        {Object.keys(sentenceEndingsOptions).length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveSentenceEndingsOption(key)}
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

              {/* Sentence Endings (Choices) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm font-semibold">Sentence Endings (Cümlə Sonu) *</Label>
                  <Button
                    type="button"
                    onClick={handleAddSentenceEndingsChoice}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Qo'shish
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(sentenceEndingsChoices)
                    .sort(([a], [b]) => a.charCodeAt(0) - b.charCodeAt(0))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-green-400 font-bold font-mono text-sm w-6">{key}:</span>
                        <Textarea
                          value={value}
                          onChange={(e) => handleSentenceEndingsChoiceChange(key, e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white flex-1"
                          placeholder={`Sentence ending ${key}`}
                          rows={2}
                          required
                        />
                        {Object.keys(sentenceEndingsChoices).length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveSentenceEndingsChoice(key)}
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

              {/* Correct Answers (Matching) */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-semibold">To'g'ri Javoblar (Moslashtirish) *</Label>
                <p className="text-xs text-slate-400 mb-2">
                  Har bir sentence beginning uchun to'g'ri sentence ending ni tanlang
                </p>
                <div className="space-y-2">
                  {Object.entries(sentenceEndingsOptions)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([optionKey, optionValue]) => (
                      <div key={optionKey} className="flex items-center gap-2 p-2 bg-slate-700/20 rounded">
                        <span className="text-blue-400 font-bold font-mono text-sm w-6">{optionKey}:</span>
                        <span className="text-slate-300 text-xs flex-1 truncate">
                          {optionValue.substring(0, 50)}...
                        </span>
                        <Select
                          value={sentenceEndingsAnswers[optionKey] || ""}
                          onValueChange={(value) => handleSentenceEndingsAnswerChange(optionKey, value)}
                        >
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-20">
                            <SelectValue placeholder="?" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {Object.entries(sentenceEndingsChoices)
                              .sort(([a], [b]) => a.charCodeAt(0) - b.charCodeAt(0))
                              .map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {key}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {sentenceEndingsAnswers[optionKey] && (
                          <span className="text-green-400 font-bold text-sm">✓</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Summary */}
              {Object.keys(sentenceEndingsAnswers).length > 0 && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 text-sm font-semibold mb-2">To'g'ri javoblar:</p>
                  <div className="space-y-1">
                    {Object.entries(sentenceEndingsAnswers)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([optionKey, choiceKey]) => (
                        <p key={optionKey} className="text-green-300 text-xs">
                          {optionKey} → {choiceKey}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isNoteCompletion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-semibold">Shablonni Kiriting (HTML bilan) *</Label>
                <Textarea
                  value={noteTemplate}
                  onChange={(e) => handleNoteTemplateChange(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white font-mono resize-y min-h-[200px]"
                  placeholder="Shablonni kiriting"
                  required
                />
              </div>

              {countBlanks(noteTemplate) > 0 && (
                <div className="space-y-3 bg-slate-700/20 p-4 rounded-lg border border-slate-600">
                  <Label className="text-slate-300 text-sm font-semibold">To'g'ri Javoblar *</Label>
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
                            placeholder={`Javob ${key}`}
                            required
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
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Qator Sarlavhalari - Ixtiyoriy</Label>
                <div className="space-y-2">
                  {summaryDragRows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm w-20">Qator {index + 1}:</span>
                      <Input
                        value={row.label}
                        onChange={(e) => {
                          const newRows = [...summaryDragRows]
                          newRows[index].label = e.target.value
                          setSummaryDragRows(newRows)
                        }}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder="Qator nomi"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Tanlov Variantlari (Chap Ustun) *</Label>
                  <Button
                    type="button"
                    onClick={() => {
                      const nextKey = (Object.keys(summaryDragChoices).length + 1).toString()
                      setSummaryDragChoices((prev) => ({ ...prev, [nextKey]: "" }))
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(summaryDragChoices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-300 font-mono text-sm w-8">{key}.</span>
                      <Input
                        value={value}
                        onChange={(e) => {
                          setSummaryDragChoices((prev) => ({ ...prev, [key]: e.target.value }))
                        }}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Variant ${key}`}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Variantlar (O'ng Ustun) *</Label>
                  <Button
                    type="button"
                    onClick={() => {
                      setSummaryDragOptions((prev) => [...prev, ""])
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Variant
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
                        placeholder={`Variant ${index + 1}`}
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

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">To'g'ri Javoblarni Belgilang *</Label>
                <div className="space-y-2">
                  {Object.entries(summaryDragChoices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-32">
                        {key}. {value}
                      </span>
                      <Select
                        value={summaryDragAnswers[key] || undefined}
                        onValueChange={(val) => {
                          setSummaryDragAnswers((prev) => ({ ...prev, [key]: val }))
                        }}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1">
                          <SelectValue placeholder="Variant tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {summaryDragOptions
                            .filter((option) => option.trim())
                            .map((option, index) => (
                              <SelectItem key={index} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {summaryDragAnswers[key] && <span className="text-green-400 text-sm font-bold">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isTableCompletion && (
            <div className="space-y-4">
              {/* Control Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  onClick={handleAddColumn}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-400 hover:bg-blue-500/10 bg-transparent text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ustun Qo'shish
                </Button>
                <Button
                  type="button"
                  onClick={handleAddRow}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-400 hover:bg-green-500/10 bg-transparent text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Qator Qo'shish
                </Button>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
                <p className="text-blue-300 text-xs font-semibold mb-2">📝 Ko'rsatmalar:</p>
                <ul className="text-blue-300 text-xs space-y-1 list-disc list-inside">
                  <li>Jadval ustunlari 0-indeksdan boshlanadi (0, 1, 2, ...)</li>
                  <li>Har bir qator ham 0-indeksdan boshlanadi</li>
                  <li>
                    Bo'sh joylar uchun <span className="font-mono bg-blue-800 px-1 rounded">____</span> (4 ta pastki
                    chiziq) yozing
                  </li>
                  <li>Bo'sh joylar ustun sarlavhalarida, qator etiketlarida va hujayralarida bo'lishi mumkin</li>
                  <li>Bir hujayraga bir nechta bo'sh joylar bo'lishi mumkin</li>
                  <li>Chap yuqori burchakdagi maydon ixtiyoriy - bo'sh qoldirish mumkin</li>
                </ul>
              </div>

              <div className="overflow-x-auto bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-2 border-slate-600 bg-slate-700 text-slate-300 p-3 text-sm font-semibold text-left min-w-24">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs text-slate-400">Jadval nomi (ixtiyoriy)</div>
                          <input
                            type="text"
                            value={columns[0] || ""}
                            onChange={(e) => handleColumnChange(0, e.target.value)}
                            className="bg-slate-600/50 border border-slate-500 rounded px-2 py-1 text-slate-200 text-sm outline-none focus:border-blue-400 transition-colors"
                            placeholder="Qator"
                          />
                        </div>
                      </th>
                      {columns.slice(1).map((col, idx) => {
                        const actualIndex = idx + 1 // Real index in columns array
                        return (
                          <th
                            key={actualIndex}
                            className={`border-2 p-3 text-sm font-semibold text-left min-w-32 relative group ${
                              col.includes("____")
                                ? "border-yellow-500 bg-yellow-900/20 text-yellow-300"
                                : "border-slate-600 bg-slate-700 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <div className="text-xs text-slate-400 mb-1">Ustun {idx}</div>
                                <input
                                  type="text"
                                  value={col}
                                  onChange={(e) => handleColumnChange(actualIndex, e.target.value)}
                                  className={`bg-transparent outline-none w-full ${
                                    col.includes("____") ? "text-yellow-300 font-semibold" : "text-slate-300"
                                  }`}
                                  placeholder={`Ustun ${idx}`}
                                />
                              </div>
                              {columns.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColumn(actualIndex)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td
                          className={`border-2 p-3 text-sm font-semibold relative group ${
                            row.label.includes("____")
                              ? "border-yellow-500 bg-yellow-900/20 text-yellow-300"
                              : "border-slate-600 bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-xs text-slate-400 mb-1">Qator {rowIdx}</div>
                              <input
                                type="text"
                                value={row.label}
                                onChange={(e) => handleRowLabelChange(rowIdx, e.target.value)}
                                className={`bg-transparent outline-none w-full ${
                                  row.label.includes("____") ? "text-yellow-300 font-semibold" : "text-slate-300"
                                }`}
                                placeholder={`Qator ${rowIdx}`}
                              />
                            </div>
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(rowIdx)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        {row.cells.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className={`border-2 p-3 text-sm hover:bg-slate-700/50 transition-colors cursor-text ${
                              cell.includes("____")
                                ? "border-yellow-500 bg-yellow-900/20"
                                : "border-slate-600 bg-slate-800"
                            }`}
                          >
                            <div className="text-xs text-slate-500 mb-1">
                              [{rowIdx},{cellIdx}]
                            </div>
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleRowCellChange(rowIdx, cellIdx, e.target.value)}
                              className={`w-full bg-transparent outline-none ${
                                cell.includes("____") ? "text-yellow-300 font-semibold" : "text-slate-200"
                              }`}
                              placeholder={`[${rowIdx},${cellIdx}]`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detectedBlanks.length > 0 && (
                <div className="space-y-3 bg-slate-700/20 p-4 rounded-lg border border-slate-600">
                  <Label className="text-slate-300 text-sm font-semibold">
                    Aniqlangan Bo'sh Joylar ({detectedBlanks.length})
                  </Label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {Object.values(blankAnswers).filter((a) => a.trim()).length} / {detectedBlanks.length}{" "}
                      to'ldirilgan
                    </span>
                  </div>

                  <div className="space-y-2">
                    {detectedBlanks.map((blank) => (
                      <div
                        key={blank.key}
                        className="flex items-center gap-3 p-3 bg-slate-700/50 rounded border border-slate-600"
                      >
                        <div className="flex-shrink-0">
                          <span className="text-yellow-400 font-mono text-sm font-bold bg-yellow-900/30 px-3 py-1 rounded">
                            {blank.key}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-400 text-xs mb-1">
                            {blank.displayLabel || (
                              <>
                                {blank.type === "column" && (
                                  <>
                                    Ustun: <span className="text-slate-300 font-semibold">{blank.col}</span>
                                    {blank.blankIndex && blank.blankIndex > 1 && <> (Bo'sh joy #{blank.blankIndex})</>}
                                  </>
                                )}
                                {blank.type === "row" && (
                                  <>
                                    Qator: <span className="text-slate-300 font-semibold">{blank.row}</span>
                                    {blank.blankIndex && blank.blankIndex > 1 && <> (Bo'sh joy #{blank.blankIndex})</>}
                                  </>
                                )}
                                {blank.type === "cell" && (
                                  <>
                                    Hujayra:{" "}
                                    <span className="text-slate-300 font-semibold">
                                      [{blank.row},{blank.col}]
                                    </span>
                                    {blank.blankIndex && blank.blankIndex > 1 && <> (Bo'sh joy #{blank.blankIndex})</>}
                                  </>
                                )}
                              </>
                            )}
                          </p>
                          <Input
                            value={blankAnswers[blank.key] || ""}
                            onChange={(e) => handleBlankAnswerChange(blank.key, e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white text-sm"
                            placeholder="To'g'ri javobni kiriting"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detectedBlanks.length === 0 && (
                <div className="bg-amber-900/20 border border-amber-700/30 rounded p-3">
                  <p className="text-amber-300 text-xs">
                    ⚠️ Jadvalda bo'sh joy topilmadi. Jadvalga{" "}
                    <span className="font-mono bg-amber-800 px-1 rounded">____</span> yozing.
                  </p>
                </div>
              )}
            </div>
          )}

          {isMatchingInformation && (
            <div className="space-y-4">
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
                        placeholder={`${key} varianti`}
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
                        placeholder={`Element ${index + 1}`}
                        required
                      />
                      <Select
                        value={matchingAnswers[(index + 1).toString()] || undefined}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Sarlavhalar *</Label>
                  <Button
                    type="button"
                    onClick={handleAddMatchingHeadingsOption}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Sarlavha
                  </Button>
                </div>
                <div className="space-y-2">
                  {matchingHeadingsOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-300 font-mono text-sm w-4">{option.key}:</span>
                      <Input
                        value={option.text}
                        onChange={(e) => handleMatchingHeadingsOptionChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Sarlavha ${option.key}`}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Inputlar Soni *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleRemoveMatchingHeadingsInput}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                      disabled={matchingHeadingsInputCount <= 1}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <span className="text-slate-300 text-sm w-8 text-center">{matchingHeadingsInputCount}</span>
                    <Button
                      type="button"
                      onClick={handleAddMatchingHeadingsInput}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {Array.from({ length: matchingHeadingsInputCount }, (_, i) => i + 1).map((inputNum) => (
                    <div key={inputNum} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-16">Input {inputNum}:</span>
                      <Select
                        value={matchingHeadingsAnswers[inputNum.toString()] || undefined}
                        onValueChange={(value) => handleMatchingHeadingsAnswerChange(inputNum, value)}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1">
                          <SelectValue placeholder="Sarlavha tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {matchingHeadingsOptions.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.key}: {option.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {matchingHeadingsAnswers[inputNum.toString()] && (
                        <span className="text-green-400 text-sm font-bold">✓</span>
                      )}
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
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
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
