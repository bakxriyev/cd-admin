"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, type ListeningQuestion } from "@/lib/api"
import { Plus, X, Headphones, Upload, MapPin } from "lucide-react"

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
  SHORT_ANSWER: "SHORT_ANSWER",
  FLOW_CHART: "FLOW_CHART",
  NOTE_COMPLETION: "NOTE_COMPLETION",
  MAP_LABELING: "MAP_LABELING",
}

interface CreateListeningQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  listeningQuestionsId: string
  onQuestionCreated: () => void
  editingQuestion?: ListeningQuestion | null
  copyingQuestion?: ListeningQuestion | null
}

export function CreateListeningQuestionModal({
  isOpen,
  onClose,
  listeningQuestionsId,
  onQuestionCreated,
  editingQuestion,
  copyingQuestion,
}: CreateListeningQuestionModalProps) {
  const [formData, setFormData] = useState({
    q_type: "MCQ_SINGLE" as ListeningQuestion["q_type"],
    q_text: "",
  })
  const [options, setOptions] = useState([{ key: "A", text: "" }])
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [columns, setColumns] = useState<string[]>([""])
  const [rows, setRows] = useState<Array<{ label: string; cells: string[] }>>([{ label: "", cells: [""] }])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [matchingChoices, setMatchingChoices] = useState<Record<string, string>>({ A: "" })
  const [matchingRows, setMatchingRows] = useState<string[]>([""])
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({})
  const [flowChartChoices, setFlowChartChoices] = useState<Record<string, string>>({ "1": "" })
  const [flowChartOptions, setFlowChartOptions] = useState<string[]>([""])
  const [flowChartAnswers, setFlowChartAnswers] = useState<Record<string, string>>({})
  const [noteTemplate, setNoteTemplate] = useState("")
  const [noteAnswers, setNoteAnswers] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [mapPositions, setMapPositions] = useState<Record<string, { x: string; y: string }>>({})
  const [imagePreview, setImagePreview] = useState<string>("")
  const imageRef = useRef<HTMLImageElement>(null)

  const [tfngPhoto, setTfngPhoto] = useState<File | null>(null)
  const [tfngChoices, setTfngChoices] = useState<Record<string, string>>({ "1": "" })
  const [tfngOptions, setTfngOptions] = useState<string[]>(["A", "B", "C", "D", "E", "F", "G", "H"])
  const [tfngAnswers, setTfngAnswers] = useState<Record<string, string>>({})

  const [summaryDragRows, setSummaryDragRows] = useState<Array<{ label: string; value: string }>>([
    { label: "People", value: "" },
    { label: "Staff Responsibilities", value: "" },
  ])
  const [summaryDragChoices, setSummaryDragChoices] = useState<Record<string, string>>({ "1": "" })
  const [summaryDragOptions, setSummaryDragOptions] = useState<string[]>([""])
  const [summaryDragAnswers, setSummaryDragAnswers] = useState<Record<string, string>>({})

  const [tableAnswers, setTableAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    const questionToLoad = editingQuestion || copyingQuestion

    if (questionToLoad) {
      console.log("[v0] Loading question:", questionToLoad.q_type)
      console.log("[v0] Question data:", questionToLoad)

      setFormData({
        q_type: questionToLoad.q_type,
        q_text: questionToLoad.q_text || "",
      })

      if (questionToLoad.q_type === "NOTE_COMPLETION") {
        if (typeof questionToLoad.options === "string") {
          setNoteTemplate(questionToLoad.options)
        }
        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          setNoteAnswers(questionToLoad.answers as Record<string, string>)
        } else if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setNoteAnswers(questionToLoad.correct_answers as Record<string, string>)
        }
      } else if (questionToLoad.q_type === "FLOW_CHART") {
        if (questionToLoad.choices && typeof questionToLoad.choices === "object") {
          setFlowChartChoices(questionToLoad.choices)
        }
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setFlowChartOptions(questionToLoad.options)
        }
        if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          setFlowChartAnswers(questionToLoad.correct_answers as Record<string, string>)
        }
      } else if (questionToLoad.q_type === "MAP_LABELING") {
        if (questionToLoad.choices && typeof questionToLoad.choices === "object") {
          // Type 2: has choices (numbered statements)
          // Removed mapType state and related logic
          if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
            // setMapType2Options(questionToLoad.options)
          }
          if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
            // setMapType2Answers(questionToLoad.correct_answers as Record<string, string>)
          }
        } else {
          // Type 1: has rows (positions)
          // Removed mapType state and related logic
          if (questionToLoad.rows && typeof questionToLoad.rows === "object") {
            setMapPositions(questionToLoad.rows as Record<string, { x: string; y: string }>)
          }
          if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
            setOptions(questionToLoad.options)
          }
          if (questionToLoad.correct_answers && Array.isArray(questionToLoad.correct_answers)) {
            setCorrectAnswers(questionToLoad.correct_answers)
          }
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
      } else if (questionToLoad.q_type === "TABLE_COMPLETION") {
        setColumns(questionToLoad.columns || [])
        setRows(questionToLoad.rows || [])
        setChoices(questionToLoad.choices || {})
        setTableAnswers(questionToLoad.answers || {})
      } else if (
        ["MCQ_SINGLE", "MCQ_MULTI", "MATCHING", "SENTENCE_ENDINGS", "MATCHING_HEADINGS", "MULTIPLE_CHOICE"].includes(
          questionToLoad.q_type,
        )
      ) {
        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          setOptions(questionToLoad.options)
        } else {
          setOptions([{ key: "A", text: "" }])
        }
      }

      if (questionToLoad.correct_answers && Array.isArray(questionToLoad.correct_answers)) {
        setCorrectAnswers(questionToLoad.correct_answers)
      } else if (questionToLoad.answers && Array.isArray(questionToLoad.answers)) {
        setCorrectAnswers(questionToLoad.answers)
      } else {
        setCorrectAnswers([])
      }
      // Load TFNG specific data
      if (questionToLoad.q_type === "TFNG" || questionToLoad.q_type === "TRUE_FALSE_NOT_GIVEN") {
        if (questionToLoad.photo) {
          setImagePreview(questionToLoad.photo)
        }

        if (questionToLoad.choices) {
          try {
            const parsedChoices =
              typeof questionToLoad.choices === "string" ? JSON.parse(questionToLoad.choices) : questionToLoad.choices
            setTfngChoices(parsedChoices)
          } catch (e) {
            console.error("[v0] Failed to parse TFNG choices:", e)
          }
        }

        if (questionToLoad.options) {
          try {
            const parsedOptions =
              typeof questionToLoad.options === "string" ? JSON.parse(questionToLoad.options) : questionToLoad.options
            setTfngOptions(parsedOptions)
          } catch (e) {
            console.error("[v0] Failed to parse TFNG options:", e)
          }
        }

        if (questionToLoad.correct_answers) {
          try {
            const parsedAnswers =
              typeof questionToLoad.correct_answers === "string"
                ? JSON.parse(questionToLoad.correct_answers)
                : questionToLoad.correct_answers
            setTfngAnswers(parsedAnswers as Record<string, string>)
          } catch (e) {
            console.error("[v0] Failed to parse TFNG answers:", e)
          }
        }
      }

      if (questionToLoad.q_type === "SUMMARY_DRAG") {
        // API returns: rows (array of objects), choices (object), options (array), answers (object)

        if (questionToLoad.rows && Array.isArray(questionToLoad.rows)) {
          // Load rows directly as array of objects
          setSummaryDragRows(questionToLoad.rows)
        }

        if (
          questionToLoad.choices &&
          typeof questionToLoad.choices === "object" &&
          !Array.isArray(questionToLoad.choices)
        ) {
          // Load choices as object with numbered keys
          setSummaryDragChoices(questionToLoad.choices)
        }

        if (questionToLoad.options && Array.isArray(questionToLoad.options)) {
          // Load options as array of strings
          setSummaryDragOptions(questionToLoad.options)
        }

        if (questionToLoad.answers && typeof questionToLoad.answers === "object") {
          // Load answers as object
          setSummaryDragAnswers(questionToLoad.answers)
        } else if (questionToLoad.correct_answers && typeof questionToLoad.correct_answers === "object") {
          // Fallback to correct_answers if answers is not available
          setSummaryDragAnswers(questionToLoad.correct_answers)
        }
      }
    } else {
      setFormData({
        q_type: "MCQ_SINGLE",
        q_text: "",
      })
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns([""])
      setRows([{ label: "", cells: [""] }])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setFlowChartChoices({ "1": "" })
      setFlowChartOptions([""])
      setFlowChartAnswers({})
      setMapPositions({})
      setImagePreview("")
      setNoteTemplate("")
      setNoteAnswers({})
      // Reset MAP_LABELING specific states
      // Removed mapType reset and related states
      // Reset TFNG specific states
      setTfngPhoto(null)
      setTfngChoices({ "1": "" })
      setTfngOptions(["A", "B", "C", "D", "E", "F", "G", "H"])
      setTfngAnswers({})
      setSummaryDragRows([
        { label: "People", value: "" },
        { label: "Staff Responsibilities", value: "" },
      ])
      setSummaryDragChoices({ "1": "" })
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
      setTableAnswers({})
    }
    setPhotoFile(null)
  }, [editingQuestion, copyingQuestion, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuestionTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, q_type: value as ListeningQuestion["q_type"] }))

    if (value === "TFNG") {
      setTfngPhoto(null)
      setTfngChoices({ "1": "" })
      setTfngOptions(["A", "B", "C", "D", "E", "F", "G", "H"])
      setTfngAnswers({})
    } else if (value === "NOTE_COMPLETION") {
      setNoteTemplate("")
      setNoteAnswers({})
    } else if (value === "FLOW_CHART") {
      setFlowChartChoices({ "1": "" })
      setFlowChartOptions([""])
      setFlowChartAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMapPositions({})
      setImagePreview("")
    } else if (value === "TABLE_COMPLETION") {
      setColumns([""])
      setRows([{ label: "", cells: [""] }])
      setChoices({})
      setTableAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMapPositions({})
      setImagePreview("")
    } else if (value === "MATCHING_INFORMATION") {
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMapPositions({})
      setImagePreview("")
    } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "SHORT_ANSWER"].includes(value)) {
      setOptions([])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMapPositions({})
      setImagePreview("")
    } else if (
      [
        "MCQ_SINGLE",
        "MCQ_MULTI",
        "MATCHING",
        "MAP_LABELING",
        "TFNG",
        "SUMMARY_DRAG",
        "SENTENCE_ENDINGS",
        "MATCHING_HEADINGS",
        "MULTIPLE_CHOICE",
      ].includes(value)
    ) {
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns([])
      setRows([])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setMapPositions({})
      setImagePreview("")
      // Removed mapType2 options reset
    }
    if (value === "SUMMARY_DRAG") {
      setSummaryDragRows([
        { label: "People", value: "" },
        { label: "Staff Responsibilities", value: "" },
      ])
      setSummaryDragChoices({ "1": "" })
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
      setMapPositions({})
      setImagePreview("")
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

  const handleTfngPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTfngPhoto(file)
      // Optionally, you might want to preview this image too if it's displayed
      // const reader = new FileReader()
      // reader.onloadend = () => { setImagePreview(reader.result as string) } // Or a separate preview state for TFNG
      // reader.readAsDataURL(file)
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const nextIndex = (Object.keys(mapPositions).length + 1).toString()
    setMapPositions((prev) => ({
      ...prev,
      [nextIndex]: {
        x: `${x.toFixed(1)}%`,
        y: `${y.toFixed(1)}%`,
      },
    }))
  }

  const handleRemovePosition = (key: string) => {
    const newPositions = { ...mapPositions }
    delete newPositions[key]

    // Reassign keys to maintain sequential order
    const reassigned: Record<string, { x: string; y: string }> = {}
    Object.values(newPositions).forEach((pos, index) => {
      reassigned[(index + 1).toString()] = pos
    })

    setMapPositions(reassigned)
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
      // If it's a MAP_LABELING question, remove corresponding answer
      if (formData.q_type === "MAP_LABELING") {
        setCorrectAnswers((prev) =>
          !prev.includes(`${index + 1}:${removedKey}`)
            ? prev
            : prev.filter((answer) => !answer.startsWith(`${index + 1}:`)),
        )
      }
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

  const handleAddTfngChoice = () => {
    const nextNum = Math.max(...Object.keys(tfngChoices).map(Number), 0) + 1
    setTfngChoices((prev) => ({ ...prev, [nextNum.toString()]: "" }))
  }

  const handleRemoveTfngChoice = (key: string) => {
    if (Object.keys(tfngChoices).length > 1) {
      const newChoices = { ...tfngChoices }
      delete newChoices[key]
      setTfngChoices(newChoices)

      const newAnswers = { ...tfngAnswers }
      delete newAnswers[key]
      setTfngAnswers(newAnswers)
    }
  }

  const handleTfngChoiceChange = (key: string, value: string) => {
    setTfngChoices((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddTfngOption = () => {
    const nextLetter = String.fromCharCode(65 + tfngOptions.length)
    setTfngOptions((prev) => [...prev, nextLetter])
  }

  const handleRemoveTfngOption = (index: number) => {
    if (tfngOptions.length > 1) {
      const removedOption = tfngOptions[index]
      const newOptions = tfngOptions.filter((_, i) => i !== index)
      setTfngOptions(newOptions)

      const newAnswers = { ...tfngAnswers }
      Object.keys(newAnswers).forEach((key) => {
        if (newAnswers[key] === removedOption) {
          delete newAnswers[key]
        }
      })
      setTfngAnswers(newAnswers)
    }
  }

  const handleTfngOptionChange = (index: number, value: string) => {
    const newOptions = [...tfngOptions]
    newOptions[index] = value
    setTfngOptions(newOptions)
  }

  const handleTfngAnswerChange = (choiceKey: string, optionLetter: string) => {
    setTfngAnswers((prev) => ({
      ...prev,
      [choiceKey]: optionLetter,
    }))
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

  const handleAddFlowChartChoice = () => {
    const keys = Object.keys(flowChartChoices)
    const nextKey = (keys.length + 1).toString()
    setFlowChartChoices((prev) => ({ ...prev, [nextKey]: "" }))
  }

  const handleRemoveFlowChartChoice = (key: string) => {
    if (Object.keys(flowChartChoices).length > 1) {
      const newChoices = { ...flowChartChoices }
      delete newChoices[key]

      // Reassign keys to maintain sequential order
      const reassigned: Record<string, string> = {}
      Object.values(newChoices).forEach((value, index) => {
        reassigned[(index + 1).toString()] = value
      })
      setFlowChartChoices(reassigned)

      // Update answers to match new keys
      const newAnswers = { ...flowChartAnswers }
      delete newAnswers[key]
      const reassignedAnswers: Record<string, string> = {}
      Object.entries(newAnswers).forEach(([answerKey, value]) => {
        const numKey = Number.parseInt(answerKey)
        const keyNum = Number.parseInt(key)
        if (numKey > keyNum) {
          reassignedAnswers[(numKey - 1).toString()] = value
        } else {
          reassignedAnswers[answerKey] = value
        }
      })
      setFlowChartAnswers(reassignedAnswers)
    }
  }

  const handleFlowChartChoiceChange = (key: string, value: string) => {
    setFlowChartChoices((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddFlowChartOption = () => {
    setFlowChartOptions((prev) => [...prev, ""])
  }

  const handleRemoveFlowChartOption = (index: number) => {
    if (flowChartOptions.length > 1) {
      const removedOption = flowChartOptions[index]
      setFlowChartOptions((prev) => prev.filter((_, i) => i !== index))

      // Remove answers that reference this option
      const newAnswers = { ...flowChartAnswers }
      Object.keys(newAnswers).forEach((key) => {
        if (newAnswers[key] === removedOption) {
          delete newAnswers[key]
        }
      })
      setFlowChartAnswers(newAnswers)
    }
  }

  const handleFlowChartOptionChange = (index: number, value: string) => {
    const newOptions = [...flowChartOptions]
    newOptions[index] = value
    setFlowChartOptions(newOptions)
  }

  const handleFlowChartAnswerChange = (choiceKey: string, optionValue: string) => {
    setFlowChartAnswers((prev) => ({
      ...prev,
      [choiceKey]: optionValue,
    }))
  }

  const countBlanks = (text: string): number => {
    const matches = text.match(/____/g)
    return matches ? matches.length : 0
  }

  const handleNoteTemplateChange = (value: string) => {
    setNoteTemplate(value)

    // Auto-create answer fields based on number of blanks
    const blankCount = countBlanks(value)
    const currentAnswerKeys = Object.keys(noteAnswers)
    const newAnswers: Record<string, string> = {}

    // Add existing answers if they are still relevant (i.e., within the new blank count)
    for (let i = 1; i <= blankCount; i++) {
      const key = i.toString()
      if (currentAnswerKeys.includes(key)) {
        newAnswers[key] = noteAnswers[key]
      } else {
        newAnswers[key] = ""
      }
    }
    setNoteAnswers(newAnswers)
  }

  const handleNoteAnswerChange = (key: string, value: string) => {
    setNoteAnswers((prev) => ({ ...prev, [key]: value }))
  }

  // Removed mapType2 handler functions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listeningQuestionsId) return

    if (formData.q_type === "TFNG") {
      if (!tfngPhoto) {
        setError("Rasm majburiy")
        return
      }
      if (Object.values(tfngChoices).some((choice) => !choice.trim())) {
        setError("Barcha tanlov variantlarini to'ldiring")
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
    } else if (formData.q_type === "FLOW_CHART") {
      if (Object.values(flowChartChoices).some((choice) => !choice.trim())) {
        setError("Barcha tanlov variantlarini to'ldiring")
        return
      }
      if (flowChartOptions.some((opt) => !opt.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (Object.keys(flowChartAnswers).length === 0) {
        setError("Kamida bitta javobni belgilang")
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
    } else if (
      [
        "MCQ_SINGLE",
        "MCQ_MULTI",
        "MATCHING",
        "TFNG",
        "SENTENCE_ENDINGS",
        "MATCHING_HEADINGS",
        "MULTIPLE_CHOICE",
      ].includes(formData.q_type)
    ) {
      if (options.some((opt) => !opt.text.trim())) {
        setError("Barcha variantlarni to'ldiring")
        return
      }
      if (correctAnswers.length === 0) {
        setError("Kamida bitta to'g'ri javobni belgilang")
        return
      }
    } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "SHORT_ANSWER"].includes(formData.q_type)) {
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
    } else if (formData.q_type === "MAP_LABELING") {
      if (!photoFile && !editingQuestion && !copyingQuestion) {
        setError("MAP_LABELING turi uchun rasm majburiy")
        return
      }

      // Removed mapType2 validation
      // Type 1 validation
      if (Object.keys(mapPositions).length === 0) {
        setError("Rasmda kamida bitta pozitsiyani belgilang")
        return
      }
      if (options.some((opt) => !opt.text.trim())) {
        setError("Barcha tanlov variantlarini to'ldiring")
        return
      }
    }

    if (formData.q_type === "SUMMARY_DRAG") {
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
    }

    setLoading(true)
    setError("")

    try {
      const questionData: any = {
        listening_questions_id: Number.parseInt(listeningQuestionsId),
        q_type: formData.q_type,
      }

      if (formData.q_text && formData.q_text.trim()) {
        questionData.q_text = formData.q_text
      }

      if (formData.q_type === "SUMMARY_DRAG") {
        questionData.rows = summaryDragRows
        questionData.choices = summaryDragChoices
        questionData.options = summaryDragOptions
        questionData.answers = summaryDragAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else if (formData.q_type === "TFNG") {
        const formDataWithFile = new FormData()
        formDataWithFile.append("listening_questions_id", listeningQuestionsId)
        formDataWithFile.append("q_type", "TFNG")
        if (formData.q_text && formData.q_text.trim()) {
          formDataWithFile.append("q_text", formData.q_text)
        }
        formDataWithFile.append("photo", tfngPhoto!)
        formDataWithFile.append("choices", JSON.stringify(tfngChoices))
        formDataWithFile.append("options", JSON.stringify(tfngOptions))
        formDataWithFile.append("correct_answers", JSON.stringify(tfngAnswers))

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), formDataWithFile)
        } else {
          await api.lQuestions.create(formDataWithFile)
        }
      } else if (formData.q_type === "NOTE_COMPLETION") {
        questionData.options = noteTemplate
        questionData.correct_answers = noteAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else if (formData.q_type === "MATCHING_INFORMATION") {
        questionData.choices = matchingChoices
        questionData.rows = matchingRows
        questionData.answers = matchingAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else if (formData.q_type === "TABLE_COMPLETION") {
        questionData.columns = columns
        questionData.rows = rows
        questionData.choices = choices
        questionData.answers = tableAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else if (formData.q_type === "MAP_LABELING") {
        if (!photoFile && !editingQuestion && !copyingQuestion) {
          setError("MAP_LABELING turi uchun rasm majburiy")
          setLoading(false)
          return
        }

        const formDataWithFile = new FormData()
        formDataWithFile.append("listening_questions_id", listeningQuestionsId)
        formDataWithFile.append("q_type", formData.q_type)
        if (formData.q_text && formData.q_text.trim()) {
          formDataWithFile.append("q_text", formData.q_text)
        }
        if (photoFile) {
          formDataWithFile.append("photo", photoFile)
        }

        // Removed mapType2 submission logic
        // Type 1 submission
        formDataWithFile.append("rows", JSON.stringify(mapPositions))
        formDataWithFile.append("options", JSON.stringify(options))
        formDataWithFile.append("answers", JSON.stringify(correctAnswers))

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), formDataWithFile)
        } else {
          await api.lQuestions.create(formDataWithFile)
        }
      } else if (
        [
          "MCQ_SINGLE",
          "MCQ_MULTI",
          "MATCHING",
          "TFNG",
          "SENTENCE_ENDINGS",
          "MATCHING_HEADINGS",
          "MULTIPLE_CHOICE",
        ].includes(formData.q_type)
      ) {
        questionData.options = options
        questionData.correct_answers = correctAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else if (["SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "SHORT_ANSWER"].includes(formData.q_type)) {
        questionData.correct_answers = correctAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else if (formData.q_type === "FLOW_CHART") {
        questionData.choices = flowChartChoices
        questionData.options = flowChartOptions
        questionData.correct_answers = flowChartAnswers

        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      } else {
        // Default case for other types, assuming they might use JSON payload
        // This part might need refinement based on specific type requirements
        if (editingQuestion && !copyingQuestion) {
          await api.lQuestions.update(editingQuestion.id.toString(), questionData)
        } else {
          await api.lQuestions.create(questionData)
        }
      }

      onQuestionCreated()

      setFormData({
        q_type: "MCQ_SINGLE",
        q_text: "",
      })
      setOptions([{ key: "A", text: "" }])
      setCorrectAnswers([])
      setColumns([""])
      setRows([{ label: "", cells: [""] }])
      setChoices({})
      setMatchingChoices({ A: "" })
      setMatchingRows([""])
      setMatchingAnswers({})
      setFlowChartChoices({ "1": "" })
      setFlowChartOptions([""])
      setFlowChartAnswers({})
      setMapPositions({})
      setImagePreview("")
      setPhotoFile(null)
      setNoteTemplate("")
      setNoteAnswers({})
      // Reset MAP_LABELING specific states
      // Removed mapType reset and related states
      // Reset TFNG specific states
      setTfngPhoto(null)
      setTfngChoices({ "1": "" })
      setTfngOptions(["A", "B", "C", "D", "E", "F", "G", "H"])
      setTfngAnswers({})
      setSummaryDragRows([
        { label: "People", value: "" },
        { label: "Staff Responsibilities", value: "" },
      ])
      setSummaryDragChoices({ "1": "" })
      setSummaryDragOptions([""])
      setSummaryDragAnswers({})
      setTableAnswers({})
    } catch (error: any) {
      console.error("Failed to save listening question:", error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          setError(error.response.data.message.join(", "))
        } else {
          setError(error.response.data.message)
        }
      } else if (error.message) {
        setError(error.message)
      } else {
        setError("Savol saqlashda xatolik yuz berdi")
      }
    } finally {
      setLoading(false)
    }
  }

  const needsOptions = [
    "MCQ_SINGLE",
    "MCQ_MULTI",
    "MATCHING",
    "MAP_LABELING",
    "SENTENCE_ENDINGS",
    "MATCHING_HEADINGS",
    "MULTIPLE_CHOICE",
  ].includes(formData.q_type)
  const needsCorrectAnswers = ["SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "SHORT_ANSWER"].includes(formData.q_type)
  const isTableCompletion = formData.q_type === "TABLE_COMPLETION"
  const isMatchingInformation = formData.q_type === "MATCHING_INFORMATION"
  const isFlowChart = formData.q_type === "FLOW_CHART"
  const isNoteCompletion = formData.q_type === "NOTE_COMPLETION"
  const needsPhoto = ["MAP_LABELING", "TFNG"].includes(formData.q_type) // TFNG also needs photo
  const isSummaryDrag = formData.q_type === "SUMMARY_DRAG"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-green-400" />
              {editingQuestion
                ? "Listening Savolini Tahrirlash"
                : copyingQuestion
                  ? "Listening Savolini Nusxalash"
                  : "Listening Savoli Qo'shish"}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" type="button">
              ✕
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                <SelectItem value="TFNG">TRUE_FALSE_NOT_GIVEN</SelectItem>
                <SelectItem value="MCQ_SINGLE">MULTIPLE_CHOICE_SINGLE</SelectItem>
                <SelectItem value="MCQ_MULTI">MULTIPLE_CHOICE_MULTI</SelectItem>
                <SelectItem value="SENTENCE_COMPLETION">SENTENCE_COMPLETION</SelectItem>
                <SelectItem value="TABLE_COMPLETION">TABLE_COMPLETION</SelectItem>
                <SelectItem value="MATCHING_INFORMATION">MATCHING_INFORMATION</SelectItem>
                <SelectItem value="SUMMARY_COMPLETION">SUMMARY_COMPLETION</SelectItem>
                <SelectItem value="SUMMARY_DRAG">SUMMARY_DRAG</SelectItem>
                <SelectItem value="SENTENCE_ENDINGS">SENTENCE_ENDINGS</SelectItem>
                <SelectItem value="SHORT_ANSWER">SHORT_ANSWER</SelectItem>
                <SelectItem value="FLOW_CHART">FLOW_CHART</SelectItem>
                <SelectItem value="NOTE_COMPLETION">NOTE_COMPLETION</SelectItem>
                <SelectItem value="MAP_LABELING">MAP_LABELING</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditionally render q_text based on q_type */}
          {formData.q_type !== "NOTE_COMPLETION" && (
            <div className="space-y-2">
              <Label htmlFor="q_text" className="text-slate-300 text-sm">
                Savol Matni (ixtiyoriy)
              </Label>
              <Textarea
                id="q_text"
                value={formData.q_text}
                onChange={(e) => handleInputChange("q_text", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white resize-y"
                placeholder="What is the speaker's main point? (MAP turi uchun ___ belgilarini ishlating)"
                rows={2}
              />
              {formData.q_type === "MAP_LABELING" && (
                <p className="text-xs text-slate-400">
                  MAP savollari uchun: Matnda ___ belgilarini qo'ying, ular frontendda input maydonlari bo'lib ko'rinadi
                </p>
              )}
            </div>
          )}

          {formData.q_type === "MAP_LABELING" && (
            <div className="space-y-2 bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
              <Label className="text-slate-300 text-sm font-semibold">MAP Turi *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  // Removed mapType state change
                  variant={false ? "default" : "outline"}
                  className={
                    false
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  }
                >
                  Type 1: Pozitsiya Belgilash
                </Button>
                <Button
                  type="button"
                  // Removed mapType state change
                  variant={false ? "default" : "outline"}
                  className={
                    false
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  }
                >
                  Type 2: Bayonot Moslashtirish
                </Button>
              </div>
              {/* Removed mapType description */}
            </div>
          )}

          {needsPhoto && (
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">
                {formData.q_type === "MAP_LABELING" ? "Rasm (Map uchun majburiy)" : "Rasm (TFNG uchun majburiy)"} *
              </Label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-3">
                {/* Conditionally render based on mapType or tfngPhoto */}
                {(formData.q_type === "MAP_LABELING" && (photoFile || imagePreview)) ||
                (formData.q_type === "TFNG" && tfngPhoto) ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 truncate">
                        {formData.q_type === "MAP_LABELING" ? photoFile?.name || "Mavjud rasm" : tfngPhoto?.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (formData.q_type === "MAP_LABELING") {
                            setPhotoFile(null)
                            setImagePreview("")
                            setMapPositions({})
                          } else if (formData.q_type === "TFNG") {
                            setTfngPhoto(null)
                            // Clear related TFNG states if needed
                          }
                        }}
                        className="text-red-400 hover:text-red-300 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Image Preview for Map Labeling Type 1 */}
                    {formData.q_type === "MAP_LABELING" && imagePreview && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Rasmda drag qo'yish joylarini belgilash uchun bosing:</p>
                        <div className="relative inline-block border border-slate-600 rounded-lg overflow-hidden">
                          <img
                            ref={imageRef}
                            src={imagePreview || "/placeholder.svg"}
                            alt="Map preview"
                            className="max-w-full h-auto cursor-crosshair"
                            onClick={handleImageClick}
                          />
                          {/* Position markers */}
                          {Object.entries(mapPositions).map(([key, pos]) => (
                            <div
                              key={key}
                              className="absolute w-8 h-8 -ml-4 -mt-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg"
                              style={{
                                left: pos.x,
                                top: pos.y,
                              }}
                            >
                              {key}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-400 text-center">
                      {formData.q_type === "MAP_LABELING"
                        ? "Map rasmi yuklash uchun bosing"
                        : "TFNG uchun rasm yuklash uchun bosing"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={formData.q_type === "MAP_LABELING" ? handlePhotoChange : handleTfngPhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {formData.q_type === "MAP_LABELING" && Object.keys(mapPositions).length > 0 && (
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Belgilangan Pozitsiyalar</Label>
              <div className="space-y-2">
                {Object.entries(mapPositions).map(([key, pos]) => (
                  <div key={key} className="flex items-center gap-2 bg-slate-700/30 p-2 rounded">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-slate-300 font-mono text-sm">
                      #{key}: x={pos.x}, y={pos.y}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemovePosition(key)}
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed MAP Type 2 UI section */}

          {/* Conditionally render options based on q_type */}
          {(needsOptions || formData.q_type === "MAP_LABELING") && (
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">
                {formData.q_type === "MAP_LABELING" ? "Tanlov Variantlari (A, B, C, D...) *" : "Javob Variantlari *"}
              </Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-slate-300 font-mono text-sm w-4">{option.key}:</span>
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={
                          formData.q_type === "MAP_LABELING"
                            ? `${option.key} varianti (masalan: Library)`
                            : `Option ${option.key}`
                        }
                        required
                      />
                      {formData.q_type === "MAP_LABELING" && (
                        <Select
                          value={
                            correctAnswers.includes(`${index + 1}:${option.key}`) ? `${index + 1}:${option.key}` : ""
                          }
                          onValueChange={(value) => {
                            const positionNum = value.split(":")[0]
                            const choiceKey = value.split(":")[1]
                            const newAnswers = correctAnswers.filter((a) => !a.startsWith(`${positionNum}:`))
                            setCorrectAnswers([...newAnswers, `${positionNum}:${choiceKey}`])
                          }}
                        >
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-24">
                            <SelectValue placeholder="Pozitsiya" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {Object.keys(mapPositions).map((posKey) => (
                              <SelectItem key={posKey} value={`${posKey}:${option.key}`}>
                                #{posKey}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {formData.q_type !== "MAP_LABELING" && (
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
                      )}
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
              {formData.q_type !== "MAP_LABELING" && (
                <Button
                  type="button"
                  onClick={handleAddOption}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs mt-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Variant
                </Button>
              )}
              {formData.q_type === "MAP_LABELING" && (
                <p className="text-xs text-slate-400">Har bir tanlov uchun qaysi pozitsiyaga mos kelishini tanlang</p>
              )}
            </div>
          )}

          {/* MAP_LABELING Type 1 options and answers */}
          {formData.q_type === "MAP_LABELING" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">Tanlov Variantlari (A, B, C, D...) *</Label>
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
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-slate-300 font-mono text-sm w-4">{option.key}:</span>
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`${option.key} varianti (masalan: Library)`}
                        required
                      />
                      <Select
                        value={
                          correctAnswers.includes(`${index + 1}:${option.key}`) ? `${index + 1}:${option.key}` : ""
                        }
                        onValueChange={(value) => {
                          const positionNum = value.split(":")[0]
                          const choiceKey = value.split(":")[1]
                          const newAnswers = correctAnswers.filter((a) => !a.startsWith(`${positionNum}:`))
                          setCorrectAnswers([...newAnswers, `${positionNum}:${choiceKey}`])
                        }}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-24">
                          <SelectValue placeholder="Pozitsiya" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {Object.keys(mapPositions).map((posKey) => (
                            <SelectItem key={posKey} value={`${posKey}:${option.key}`}>
                              #{posKey}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
              <p className="text-xs text-slate-400">Har bir tanlov uchun qaysi pozitsiyaga mos kelishini tanlang</p>
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
                        <span className="text-slate-400 text-sm w-16">Qator {rowIndex + 1}:</span>
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

          {isFlowChart && (
            <div className="space-y-4">
              {/* Flow Chart Choices (numbered statements with blanks) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm font-semibold">Bo'sh Joylar (____) *</Label>
                  <Button
                    type="button"
                    onClick={handleAddFlowChartChoice}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Bo'sh Joy
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Har bir gapda ____ belgisini qo'ying, bu yerga javob kiritiladi
                </p>
                <div className="space-y-2">
                  {Object.entries(flowChartChoices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-blue-400 font-mono text-sm font-bold w-8">{key}.</span>
                      <Input
                        value={value}
                        onChange={(e) => handleFlowChartChoiceChange(key, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Gapni kiriting (masalan: The rover is directed to a ____ which has organic material.)`}
                        required
                      />
                      {Object.keys(flowChartChoices).length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveFlowChartChoice(key)}
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

              {/* Flow Chart Options (possible answers) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm font-semibold">Tanlov Variantlari *</Label>
                  <Button
                    type="button"
                    onClick={handleAddFlowChartOption}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Variant
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Bo'sh joylarga to'ldirish uchun mumkin bo'lgan javoblar ro'yxati.{" "}
                  <span className="text-green-400 font-semibold">
                    Bir nechta to'g'ri javob bo'lsa " / " bilan ajrating
                  </span>
                </p>
                <p className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-700/30">
                  <span className="font-semibold">Misol:</span> center / centre yoki 15th September / 15 September
                </p>
                <div className="space-y-2">
                  {flowChartOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm w-8">•</span>
                      <Input
                        value={option}
                        onChange={(e) => handleFlowChartOptionChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Variant ${index + 1} (masalan: fossils / fossil)`}
                        required
                      />
                      {flowChartOptions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveFlowChartOption(index)}
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

              {/* Flow Chart Correct Answers */}
              <div className="space-y-3 bg-slate-700/20 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm font-semibold">To'g'ri Javoblar (Ixtiyoriy)</Label>
                  <span className="text-xs text-slate-400 italic">Ba'zi bo'sh joylar oddiy matn bo'lishi mumkin</span>
                </div>
                <p className="text-xs text-slate-400">
                  Har bir bo'sh joy uchun to'g'ri variantni tanlang. Agar bo'sh joy oddiy matn bo'lsa, javob
                  tanlamasangiz ham bo'ladi.
                </p>
                <div className="space-y-3">
                  {Object.keys(flowChartChoices).map((choiceKey) => (
                    <div
                      key={choiceKey}
                      className="flex items-start gap-3 bg-slate-800/50 p-3 rounded border border-slate-600"
                    >
                      <span className="text-blue-400 font-mono text-sm font-bold w-8 mt-2">{choiceKey}.</span>
                      <div className="flex-1 space-y-2">
                        <p className="text-slate-300 text-sm">{flowChartChoices[choiceKey]}</p>
                        <Select
                          value={flowChartAnswers[choiceKey] || undefined}
                          onValueChange={(value) => handleFlowChartAnswerChange(choiceKey, value)}
                        >
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-full">
                            <SelectValue placeholder="Javobni tanlang (ixtiyoriy)" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {flowChartOptions
                              .filter((option) => option.trim() !== "")
                              .map((option, index) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {flowChartAnswers[choiceKey] && (
                          <div className="flex items-center gap-2 text-xs text-green-400">
                            <span>✓ Tanlangan: {flowChartAnswers[choiceKey]}</span>
                            <Button
                              type="button"
                              onClick={() => {
                                const newAnswers = { ...flowChartAnswers }
                                delete newAnswers[choiceKey]
                                setFlowChartAnswers(newAnswers)
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-5 px-2 text-red-400 hover:text-red-300"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Update NOTE_COMPLETION UI (remove q_text requirement) */}
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

          {/* Add TFNG UI section in the form */}
          {formData.q_type === "TFNG" && (
            <div className="space-y-4">
              {/* Photo Upload is handled above by needsPhoto */}

              {/* Choices */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Tanlov Variantlari *</Label>
                  <Button
                    type="button"
                    onClick={handleAddTfngChoice}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(tfngChoices).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-300 font-mono text-sm w-8">{key}.</span>
                      <Input
                        value={value}
                        onChange={(e) => handleTfngChoiceChange(key, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white flex-1"
                        placeholder={`Variant ${key}`}
                        required
                      />
                      {Object.keys(tfngChoices).length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveTfngChoice(key)}
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

              {/* Options (Letters) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">Harflar (A, B, C...) *</Label>
                  <Button
                    type="button"
                    onClick={handleAddTfngOption}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Harf
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {tfngOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Input
                        value={option}
                        onChange={(e) => handleTfngOptionChange(index, e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white text-center font-bold"
                        maxLength={1}
                        required
                      />
                      {tfngOptions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveTfngOption(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 p-0 h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answers */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">To'g'ri Javoblarni Belgilang</Label>
                <div className="space-y-2">
                  {Object.entries(tfngChoices).map(([choiceKey, choiceText]) => (
                    <div key={choiceKey} className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm w-24">Variant {choiceKey}:</span>
                      <Select
                        value={tfngAnswers[choiceKey] || undefined}
                        onValueChange={(value) => handleTfngAnswerChange(choiceKey, value)}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1">
                          <SelectValue placeholder="Harf tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {tfngOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {tfngAnswers[choiceKey] && <span className="text-green-400 text-sm font-bold w-8">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isSummaryDrag && (
            <div className="space-y-4">
              {/* Column Headers */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Qator Sarlavhalari (Ustun Nomlari) - Ixtiyoriy</Label>
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
                        placeholder={index === 0 ? "People" : "Staff Responsibilities"}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Choices (Left Column Items) */}
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
                        placeholder={`Variant ${key} (masalan: Mary Brown)`}
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

              {/* Options (Right Column Items) */}
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
                        placeholder={`Variant ${index + 1} (masalan: Finance)`}
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
