// API service layer for RealExamIELTS backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 

// Types based on backend schemas
export interface User {
  id: string
  name: string
  email: string
  username: string
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  exam_type: string
  title: string
  description: string
  duration: number
  password: string
  photo?: string
  created_at: string
  updated_at: string
}

export interface Result {
  id: string
  user_id: string
  exam_id: string
  reading_total_questions: number
  reading_correct_answers: number
  reading_band_score: number
  listening_total_questions: number
  listening_correct_answers: number
  listening_band_score: number
  writing_part1_score: number | null
  writing_part2_score: number | null
  writing_band_score: number | null
  writing_score: number
  speaking_score: number | null
  overall_band_score: number | null
  taken_at: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string
    email: string
    username: string
  }
}

export interface Listening {
  id: number
  exam_id: number
  title: string
  description: string
  audio_url: string
  created_at: string
  updated_at: string
}

export interface Reading {
  id: number
  exam_id: number
  passage_title: string
  passage_text: string
  title: string
  created_at: string
  updated_at: string
}

export interface Writing {
  id: number
  exam_id: number
  part: string
  task_text: string
  task_image?: string
  created_at: string
  updated_at: string
}

export interface WritingAnswer {
  id: string
  user_id: string
  exam_id: string
  writing_id: string
  answer_text: string
  score: number
  created_at: string
  updated_at: string
}

// Updated interfaces
export interface Admin {
  id: number
  full_name: string
  email: string
  password: string
  phone_number: string
  type: "admin"
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: number
  full_name: string
  email: string
  password: string
  phone_number: string
  balance: number
  location: string
  mock_price: number
  logo?: string
  createdAt: string
  updatedAt: string
}

export interface ReadingQuestion {
  id: number
  reading_questions_id: number
  q_type:
    | "TFNG"
    | "MCQ_SINGLE"
    | "MCQ_MULTI"
    | "SENTENCE_COMPLETION"
    | "TABLE_COMPLETION"
    | "MATCHING_INFORMATION"
    | "SUMMARY_DRAG"
    | "SHORT_ANSWER"
    | "MULTIPLE_CHOICE"
    | "SENTENCE_ENDINGS"
    | "MATCHING"
    | "MAP_LABELING"
  q_text: string
  options?: Array<{ key: string; text: string }>
  correct_answers?: string[] | string
  match_pairs?: Array<{ left: string; right: string }>
  blanks?: Array<{ index: number; max_words: number }>
  choices?: Record<string, string>
  photo?: string
  columns?: string[]
  rows?: string[][] | string[]
  answers?: Record<string, string>
  created_at: string
  updated_at: string
}

export interface ReadingQuestions {
  id: number
  reading_id: number
  part: string
  title?: string
  instruction?: string
  photo?: string
  created_at: string
  updated_at: string
}

// New interfaces for listening questions
export interface ListeningQuestions {
  id: number
  listening_id: number
  part: string
  title?: string
  instruction?: string
  photo?: string
  created_at: string
  updated_at: string
}

export interface ListeningQuestion {
  id: number
  listening_questions_id: number
  q_type:
    | "TFNG"
    | "MCQ_SINGLE"
    | "MCQ_MULTI"
    | "SENTENCE_COMPLETION"
    | "TABLE_COMPLETION"
    | "MATCHING_INFORMATION"
    | "SUMMARY_DRAG"
    | "SHORT_ANSWER"
    | "MULTIPLE_CHOICE"
    | "SENTENCE_ENDINGS"
    | "MATCHING"
    | "MAP_LABELING"
  q_text: string
  options?: Array<{ key: string; text: string }>
  correct_answers?: string[] | string
  match_pairs?: Array<{ left: string; right: string }>
  blanks?: Array<{ index: number; max_words: number }>
  choices?: Record<string, string>
  photo?: string
  columns?: string[]
  rows?: string[][] | string[]
  answers?: Record<string, string>
  created_at: string
  updated_at: string
}

// Passage interface
export interface Passage {
  id: number
  reading_id: number
  reading_text: string
  part: "PART1" | "PART2" | "PART3"
  type: "default" | "matching"
  created_at: string
  updated_at: string
}

// Secure token storage and validation
const AUTH_TOKEN_KEY = "reit_auth_token"
const USER_DATA_KEY = "reit_user_data"
const USER_TYPE_KEY = "reit_user_type"

const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, btoa(value)) // Base64 encode for basic obfuscation
    } catch (error) {
      console.error("Storage error:", error)
    }
  },
  getItem: (key: string): string | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? atob(item) : null // Base64 decode
    } catch (error) {
      console.error("Storage error:", error)
      return null
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
  },
  clear: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    localStorage.removeItem(USER_TYPE_KEY)
  },
}

// API helper function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders: Record<string, string> = {}

  // Only set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json"
  }

  const token = secureStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 401) {
        secureStorage.clear()
        window.location.href = "/"
        throw new Error("Unauthorized access")
      }

      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API Request failed:", error)
    throw error
  }
}

// API endpoints
export const api = {
  // Authentication
  auth: {
    adminLogin: (credentials: { email: string; password: string }) =>
      apiRequest("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    clientLogin: (credentials: { email: string; password: string }) =>
      apiRequest("/auth/client/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    logout: () => {
      secureStorage.clear()
      window.location.href = "/"
    },
    validateToken: () => {
      const token = secureStorage.getItem(AUTH_TOKEN_KEY)
      const userData = secureStorage.getItem(USER_DATA_KEY)
      return token && userData
    },
    getCurrentUser: () => {
      const userData = secureStorage.getItem(USER_DATA_KEY)
      return userData ? JSON.parse(userData) : null
    },
  },

  // Users
  users: {
    getAll: () => apiRequest("/users"),
    getById: (id: string) => apiRequest(`/users/${id}`),
    create: (userData: { name: string; email: string; username: string; password: string; location?: string }) =>
      apiRequest("/users", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    update: (id: string, userData: { name?: string; email?: string; username?: string; password?: string }) =>
      apiRequest(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(userData),
      }),
    delete: (id: string) =>
      apiRequest(`/users/${id}`, {
        method: "DELETE",
      }),
  },

  // Exams
  exams: {
    getAll: () => apiRequest("/exams"),
    getById: (id: string) => apiRequest(`/exams/${id}`),
    create: (examData: FormData) =>
      apiRequest("/exams", {
        method: "POST",
        body: examData,
      }),
    update: (id: string, examData: any) =>
      apiRequest(`/exams/${id}`, {
        method: "PUT",
        body: JSON.stringify(examData),
      }),
    delete: (id: string) =>
      apiRequest(`/exams/${id}`, {
        method: "DELETE",
      }),
  },

  // Results
  results: {
    getAll: () => apiRequest("/results"),
    getById: (id: string) => apiRequest(`/results/${id}`),
    getByUserId: (userId: string) => apiRequest(`/results/user/${userId}`),
    getByDate: (params: { startDate?: string; endDate?: string }) => {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append("start_date", params.startDate)
      if (params.endDate) queryParams.append("end_date", params.endDate)
      return apiRequest(`/results/by-date?${queryParams.toString()}`)
    },
    calculate: (userId: string, examId: string) =>
      apiRequest(`/results/calculate/${userId}/${examId}`, {
        method: "POST",
      }),
    recalculateAll: () =>
      apiRequest("/results/calculate-all", {
        method: "POST",
      }),
    create: (resultData: any) =>
      apiRequest("/results", {
        method: "POST",
        body: JSON.stringify(resultData),
      }),
    update: (id: string, resultData: any) =>
      apiRequest(`/results/${id}`, {
        method: "PUT",
        body: JSON.stringify(resultData),
      }),
    delete: (id: string) =>
      apiRequest(`/results/${id}`, {
        method: "DELETE",
      }),
  },

  // Reading
  reading: {
    getAll: () => apiRequest("/reading"),
    getById: (id: string) => apiRequest(`/reading/${id}`),
    getByExamId: (examId: string) => apiRequest(`/reading?exam_id=${examId}`),
    create: (readingData: any) =>
      apiRequest("/reading", {
        method: "POST",
        body: JSON.stringify(readingData),
      }),
    update: (id: string, readingData: any) =>
      apiRequest(`/reading/${id}`, {
        method: "PUT",
        body: JSON.stringify(readingData),
      }),
    delete: (id: string) =>
      apiRequest(`/reading/${id}`, {
        method: "DELETE",
      }),
    uploadFile: (file: FormData) =>
      apiRequest("/reading/upload", {
        method: "POST",
        body: file,
        headers: {}, // Let browser set Content-Type for FormData
      }),
  },

  // Writing
  writing: {
    getAll: () => apiRequest("/writing"),
    getById: (id: string) => apiRequest(`/writing/${id}`),
    getByExamId: (examId: string) => apiRequest(`/writing?exam_id=${examId}`),
    create: (writingData: FormData | any) => {
      const isFormData = writingData instanceof FormData
      return apiRequest("/writing", {
        method: "POST",
        body: isFormData ? writingData : JSON.stringify(writingData),
        headers: isFormData ? {} : { "Content-Type": "application/json" },
      })
    },
    update: (id: string, writingData: any) =>
      apiRequest(`/writing/${id}`, {
        method: "PUT",
        body: JSON.stringify(writingData),
      }),
    delete: (id: string) =>
      apiRequest(`/writing/${id}`, {
        method: "DELETE",
      }),
  },

  // Writing Answers (for assessment)
  writingAnswers: {
    getAll: () => apiRequest("/writing-answers"),
    getById: (id: string) => apiRequest(`/writing-answers/${id}`),
    create: (answerData: any) =>
      apiRequest("/writing-answers", {
        method: "POST",
        body: JSON.stringify(answerData),
      }),
    update: (id: string, answerData: any) =>
      apiRequest(`/writing-answers/${id}`, {
        method: "PUT",
        body: JSON.stringify(answerData),
      }),
    delete: (id: string) =>
      apiRequest(`/writing-answers/${id}`, {
        method: "DELETE",
      }),
  },

  // Listening
  listening: {
    getAll: () => apiRequest("/listening"),
    getById: (id: string) => apiRequest(`/listening/${id}`),
    getByExamId: (examId: string) => apiRequest(`/listening?exam_id=${examId}`),
    create: (listeningData: FormData | any) => {
      const isFormData = listeningData instanceof FormData
      return apiRequest("/listening", {
        method: "POST",
        body: isFormData ? listeningData : JSON.stringify(listeningData),
        headers: isFormData ? {} : { "Content-Type": "application/json" },
      })
    },
    update: (id: string, listeningData: any) =>
      apiRequest(`/listening/${id}`, {
        method: "PUT",
        body: JSON.stringify(listeningData),
      }),
    delete: (id: string) =>
      apiRequest(`/listening/${id}`, {
        method: "DELETE",
      }),
  },

  // Listening Answers
  listeningAnswers: {
    getAll: () => apiRequest("/listening-answers"),
    getById: (id: string) => apiRequest(`/listening-answers/${id}`),
    create: (answerData: any) =>
      apiRequest("/listening-answers", {
        method: "POST",
        body: JSON.stringify(answerData),
      }),
    update: (id: string, answerData: any) =>
      apiRequest(`/listening-answers/${id}`, {
        method: "PUT",
        body: JSON.stringify(answerData),
      }),
    delete: (id: string) =>
      apiRequest(`/listening-answers/${id}`, {
        method: "DELETE",
      }),
  },

  // Reading Answers
  readingAnswers: {
    getAll: () => apiRequest("/reading-answers"),
    getById: (id: string) => apiRequest(`/reading-answers/${id}`),
    create: (answerData: any) =>
      apiRequest("/reading-answers", {
        method: "POST",
        body: JSON.stringify(answerData),
      }),
    update: (id: string, answerData: any) =>
      apiRequest(`/reading-answers/${id}`, {
        method: "PUT",
        body: JSON.stringify(answerData),
      }),
    delete: (id: string) =>
      apiRequest(`/reading-answers/${id}`, {
        method: "DELETE",
      }),
  },

  // Admin endpoints
  admins: {
    getAll: () => apiRequest("/admins"),
    getById: (id: string) => apiRequest(`/admins/${id}`),
    create: (adminData: { full_name: string; email: string; password: string; phone_number: string; role?: string }) =>
      apiRequest("/admins", {
        method: "POST",
        body: JSON.stringify(adminData),
      }),
    update: (
      id: string,
      adminData: { full_name?: string; email?: string; password?: string; phone_number?: string; role?: string },
    ) =>
      apiRequest(`/admins/${id}`, {
        method: "PUT",
        body: JSON.stringify(adminData),
      }),
    delete: (id: string) =>
      apiRequest(`/admins/${id}`, {
        method: "DELETE",
      }),
  },

  // Client endpoints
  clients: {
    getAll: () => apiRequest("/clients"),
    getById: (id: string) => apiRequest(`/clients/${id}`),
    create: (clientData: FormData) =>
      apiRequest("/clients", {
        method: "POST",
        body: clientData,
        headers: {}, // Let browser set Content-Type for FormData
      }),
    update: (id: string, clientData: FormData) =>
      apiRequest(`/clients/${id}`, {
        method: "PUT",
        body: clientData,
        headers: {}, // Let browser set Content-Type for FormData
      }),
    delete: (id: string) =>
      apiRequest(`/clients/${id}`, {
        method: "DELETE",
      }),
  },

  // Reading Questions endpoints
  readingQuestions: {
    getAll: () => apiRequest("/reading-questions"),
    getById: (id: string) => apiRequest(`/reading-questions/${id}`),
    getByReadingId: (readingId: string) => apiRequest(`/reading-questions?reading_id=${readingId}`),
    create: (data: FormData) =>
      apiRequest("/reading-questions", {
        method: "POST",
        body: data,
      }),
    update: (id: string, data: any) =>
      apiRequest(`/reading-questions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/reading-questions/${id}`, {
        method: "DELETE",
      }),
  },

  // Reading Sub-Questions endpoints
  rQuestions: {
    getAll: () => apiRequest("/r-questions"),
    getById: (id: string) => apiRequest(`/r-questions/${id}`),
    getByReadingQuestionsId: (readingQuestionsId: string) =>
      apiRequest(`/r-questions?reading_questions_id=${readingQuestionsId}`),
    create: (data: any) =>
      apiRequest("/r-questions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/r-questions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/r-questions/${id}`, {
        method: "DELETE",
      }),
  },

  // Listening Questions endpoints
  listeningQuestions: {
    getAll: () => apiRequest("/listening-questions"),
    getById: (id: string) => apiRequest(`/listening-questions/${id}`),
    getByListeningId: (listeningId: string) => apiRequest(`/listening-questions?listening_id=${listeningId}`),
    create: (data: FormData) =>
      apiRequest("/listening-questions", {
        method: "POST",
        body: data,
      }),
    update: (id: string, data: FormData) =>
      apiRequest(`/listening-questions/${id}`, {
        method: "PUT",
        body: data,
      }),
    delete: (id: string) =>
      apiRequest(`/listening-questions/${id}`, {
        method: "DELETE",
      }),
  },

  // Listening Sub-Questions endpoints
  lQuestions: {
    getAll: () => apiRequest("/l-questions"),
    getById: (id: string) => apiRequest(`/l-questions/${id}`),
    getByListeningQuestionsId: (listeningQuestionsId: string) =>
      apiRequest(`/l-questions?listening_questions_id=${listeningQuestionsId}`),
    create: (data: FormData | any) => {
      const isFormData = data instanceof FormData
      return apiRequest("/l-questions", {
        method: "POST",
        body: isFormData ? data : JSON.stringify(data),
        headers: isFormData ? {} : { "Content-Type": "application/json" },
      })
    },
    update: (id: string, data: FormData | any) => {
      const isFormData = data instanceof FormData
      return apiRequest(`/l-questions/${id}`, {
        method: "PUT",
        body: isFormData ? data : JSON.stringify(data),
        headers: isFormData ? {} : { "Content-Type": "application/json" },
      })
    },
    delete: (id: string) =>
      apiRequest(`/l-questions/${id}`, {
        method: "DELETE",
      }),
  },

  // Passages endpoints
  passages: {
    getAll: () => apiRequest("/passages"),
    getById: (id: string) => apiRequest(`/passages/${id}`),
    getByReadingId: (readingId: string) => apiRequest(`/passages?reading_id=${readingId}`),
    create: (passageData: any) =>
      apiRequest("/passages", {
        method: "POST",
        body: JSON.stringify(passageData),
      }),
    update: (id: string, passageData: any) =>
      apiRequest(`/passages/${id}`, {
        method: "PUT",
        body: JSON.stringify(passageData),
      }),
    delete: (id: string) =>
      apiRequest(`/passages/${id}`, {
        method: "DELETE",
      }),
  },

  // Speaking evaluation endpoints
  speaking: {
    create: (speakingData: { user_id: string; exam_id: string; score: number }) =>
      apiRequest("/speaking-answers", {
        method: "POST",
        body: JSON.stringify(speakingData),
      }),
    update: (id: string, speakingData: { user_id: string; exam_id: string; score: number }) =>
      apiRequest(`/speaking-answers/${id}`, {
        method: "PUT",
        body: JSON.stringify(speakingData),
      }),
  },
}

// Export secure storage for use in components
export { secureStorage, AUTH_TOKEN_KEY, USER_DATA_KEY, USER_TYPE_KEY }
