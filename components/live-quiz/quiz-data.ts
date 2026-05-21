export type QuizStatus = "Draft" | "Published" | "Closed";
export type StudentStatus = "Submitted" | "In Progress" | "Not Submitted";

export type QuizQuestion = {
  id: string;
  type: "MCQ" | "True/False" | "Fill in the blanks" | "Short Answer";
  text: string;
  options?: string[];
  correctAnswer: string;
  marks: number;
};

export type StudentResult = {
  name: string;
  rollNo: string;
  status: StudentStatus;
  score?: string;
  timeTaken?: string;
  submittedAt?: string;
};

export const quizSummary = {
  title: "Coal and Petroleum Quiz",
  className: "Class 8",
  subject: "Science",
  chapter: "Coal and Petroleum",
  questions: 10,
  timeLimit: "10 Minutes",
  totalMarks: 10,
  link: "https://teachpad.in/quiz/abc123"
};

export const dummyQuestions: QuizQuestion[] = [
  {
    id: "q1",
    type: "MCQ",
    text: "Coal and petroleum are formed from the remains of which organisms?",
    options: ["Plants and animals", "Rocks and soil", "Clouds and rain", "Metals and minerals"],
    correctAnswer: "Plants and animals",
    marks: 1
  },
  {
    id: "q2",
    type: "MCQ",
    text: "Which substance is obtained during the processing of coal to make steel?",
    options: ["Coke", "Kerosene", "Diesel", "Paraffin wax"],
    correctAnswer: "Coke",
    marks: 1
  },
  {
    id: "q3",
    type: "True/False",
    text: "Petroleum is also called black gold.",
    options: ["True", "False"],
    correctAnswer: "True",
    marks: 1
  },
  {
    id: "q4",
    type: "Fill in the blanks",
    text: "The process of separating petroleum into useful fractions is called ____.",
    correctAnswer: "refining",
    marks: 1
  },
  {
    id: "q5",
    type: "Short Answer",
    text: "Why should we use fossil fuels carefully?",
    correctAnswer: "They are exhaustible natural resources and cause pollution when burned.",
    marks: 1
  }
];

export const savedQuizzes = [
  { id: "abc123", title: "Coal and Petroleum Quiz", className: "Class 8", subject: "Science", chapter: "Coal and Petroleum", status: "Published" as QuizStatus, createdAt: "May 21, 2026", attempts: 24 },
  { id: "draft2", title: "Nutrition in Plants Check", className: "Class 7", subject: "Science", chapter: "Nutrition in Plants", status: "Draft" as QuizStatus, createdAt: "May 18, 2026", attempts: 0 },
  { id: "closed3", title: "Integers Practice Quiz", className: "Class 6", subject: "Mathematics", chapter: "Integers", status: "Closed" as QuizStatus, createdAt: "May 14, 2026", attempts: 31 }
];

export const studentResults: StudentResult[] = [
  { name: "Ayaan Ahmad", rollNo: "08", status: "Submitted", score: "8/10", timeTaken: "07:42", submittedAt: "10:12 AM" },
  { name: "Sana Khan", rollNo: "14", status: "In Progress", score: "-", timeTaken: "05:16", submittedAt: "-" },
  { name: "Rahul Sharma", rollNo: "21", status: "Submitted", score: "6/10", timeTaken: "08:30", submittedAt: "10:15 AM" },
  { name: "Mehak", rollNo: "17", status: "Submitted", score: "10/10", timeTaken: "06:05", submittedAt: "10:10 AM" },
  { name: "Zoya", rollNo: "26", status: "Not Submitted", score: "-", timeTaken: "-", submittedAt: "-" }
];

export const questionAnalysis = [
  { question: "Q1. Formation of coal and petroleum", correct: 82, wrong: 18, wrongOption: "Rocks and soil" },
  { question: "Q2. Product used in steel making", correct: 74, wrong: 26, wrongOption: "Diesel" },
  { question: "Q3. Petroleum as black gold", correct: 91, wrong: 9, wrongOption: "False" },
  { question: "Q4. Petroleum refining", correct: 68, wrong: 32, wrongOption: "fractioning" }
];

export function generateQuiz() {
  return new Promise((resolve) => window.setTimeout(resolve, 1400));
}

export function publishQuiz() {
  return new Promise((resolve) => window.setTimeout(resolve, 700));
}

export function submitQuiz() {
  return new Promise((resolve) => window.setTimeout(resolve, 500));
}

export function fetchLiveResults() {
  return Promise.resolve(studentResults);
}
