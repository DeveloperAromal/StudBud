"use client";

import { useEffect, useState } from "react";
import axios from "axios";
// Assuming QuizCard is a React component and has its own types defined
import QuizCard from "../widgets/QuizCard";

// --- Type Definitions ---

interface NormalQuestions {
  [key: string]: string;
}

interface MultipleChoiceOption {
  question: string;
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  correct: `choice${1 | 2 | 3 | 4}`; // Enforces 'choice1', 'choice2', etc.
}

interface QuestionsState {
  normalQuestions: NormalQuestions;
  multiplechoice: {
    [key: string]: MultipleChoiceOption;
  };
}

interface TestMeta {
  title: string;
  class: string;
  subject: string;
  duration: string;
  time: string;
}

/**
 * @interface QuizItem
 * Defines the structure of a quiz item fetched from the API and passed to QuizCard.
 * This interface now aligns with the expected props of QuizCard.
 */
interface QuizItem {
  title: string;
  classname: number;
  subject: string;
  duration: string;
  question: QuestionsState;
  subdomain: string;
  _id: string; // From MongoDB, typically
  createdAt: string; // The backend should provide this (e.g., '2025-07-02T12:00:00Z')
  examId: string; // This is crucial for the QuizCard's Link href
}

// --- Component Definition ---

export default function TeacherExam() {
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [isCreatingTest, setIsCreatingTest] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);

  const [questionType, setQuestionType] = useState<"normal" | "mcq">("normal");
  const [questions, setQuestions] = useState<QuestionsState>({
    normalQuestions: {},
    multiplechoice: {},
  });

  // Normal Question State
  const [normalQuestion, setNormalQuestion] = useState<string>("");

  // MCQ Question States
  const [mcqQuestion, setMcqQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  // Test Meta State
  const [testMeta, setTestMeta] = useState<TestMeta>({
    title: "",
    class: "",
    subject: "",
    duration: "",
    time: "10:00 AM", // Default value
  });

  // --- Helper Functions ---

  const addNormalQuestion = (): void => {
    if (normalQuestion.trim()) {
      const qCount = Object.keys(questions.normalQuestions).length + 1;
      setQuestions((prev) => ({
        ...prev,
        normalQuestions: {
          ...prev.normalQuestions,
          [`question${qCount}`]: normalQuestion.trim(),
        },
      }));
      setNormalQuestion(""); // Clear input after adding
    }
  };

  const addMcqQuestion = (): void => {
    // Ensure all fields are filled before adding
    if (
      mcqQuestion.trim() &&
      correctIndex !== null &&
      options.every((o) => o.trim())
    ) {
      const qCount = Object.keys(questions.multiplechoice).length + 1;
      setQuestions((prev) => ({
        ...prev,
        multiplechoice: {
          ...prev.multiplechoice,
          [`question${qCount + 4}`]: {
            // Ensure unique keys, adjust logic if needed (consider a global question counter)
            question: mcqQuestion.trim(),
            choice1: options[0],
            choice2: options[1],
            choice3: options[2],
            choice4: options[3],
            correct: `choice${correctIndex + 1}` as `choice${1 | 2 | 3 | 4}`, // Type assertion for 'correct'
          },
        },
      }));
      // Clear inputs after adding
      setMcqQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(null);
    }
  };

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const subdomain = hostname.split(".")[0];

  const fetchExamData = async (): Promise<void> => {
    try {
      // The API response should conform to QuizItem[]
      const res = await axios.get<QuizItem[]>(
        `https://studbud-backend-server.onrender.com/api/v1/get/exam/${subdomain}`
      );
      setQuizData(res.data);
    } catch (error) {
      console.error("Error fetching exams:", error);
      // Optionally, handle error state or display a user-friendly message
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [subdomain]);

  const handlePostTest = async (): Promise<void> => {
    // Basic validation before posting
    if (
      !testMeta.title ||
      !testMeta.class ||
      !testMeta.subject ||
      !testMeta.duration
    ) {
      alert("Please fill in all test details.");
      return;
    }
    if (
      Object.keys(questions.normalQuestions).length === 0 &&
      Object.keys(questions.multiplechoice).length === 0
    ) {
      alert("Please add at least one question.");
      return;
    }

    const payload = {
      title: testMeta.title,
      classname: parseInt(testMeta.class), // Ensure classname is a number
      subject: testMeta.subject,
      duration: testMeta.duration,
      question: questions,
      subdomain,
      // You'll likely get _id and createdAt from the backend response, not send them
      // examId also needs to be generated by the backend or derived
    };

    try {
      console.log("Posting this test to server:", payload);

      // Expect a single QuizItem back from the successful post
      const response = await axios.post<QuizItem>(
        "https://studbud-backend-server.onrender.com/api/v1/create/exam/post",
        payload
      );
      console.log("Success:", response.data);

      // Optimistically update UI with the new quiz data
      // Ensure the response.data directly matches QuizItem,
      // particularly having `_id`, `createdAt`, and `examId`.
      // If your backend doesn't return `examId` on creation,
      // you might need to derive it or re-fetch `quizData`.
      setQuizData((prevQuizData) => [...prevQuizData, response.data]);

      // Reset form states
      setQuestions({
        normalQuestions: {},
        multiplechoice: {},
      });
      setTestMeta({
        title: "",
        class: "",
        subject: "",
        duration: "",
        time: "10:00 AM",
      });
      setStep(1); // Go back to step 1
      setIsCreatingTest(false); // Close the creation form
    } catch (error) {
      console.error("Error posting test:", error);
      alert("Failed to post test. Please try again.");
    }
  };

  // --- Render Logic ---

  return (
    <section className="w-full h-screen bg-gray-100 p-6 sm:ml-18 lg:ml-0 overflow-y-scroll">
      <div className="top flex items-center justify-between mb-6">
        <div className="left">
          <h2 className="text-2xl font-black text-black">Tests & Exams</h2>
          <p className="text-neutral-900">
            Create and manage your tests and examinations
          </p>
        </div>
        {!isCreatingTest && (
          <button
            onClick={() => setIsCreatingTest(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md flex items-center gap-2"
          >
            ＋ Create New Test
          </button>
        )}
      </div>

      {!isCreatingTest && (
        <div className="bottom p-4 space-y-4">
          {quizData.length === 0 ? (
            <p className="text-center text-gray-500">
              No tests available. Click "Create New Test" to add one!
            </p>
          ) : (
            quizData.map((quiz, index) => (
              // The QuizCard expects `quiz.examId` and `quiz.created_at`.
              // Ensure your backend response for both GET and POST requests
              // populates these fields for each QuizItem.
              <QuizCard key={quiz._id || index} quiz={quiz} />
            ))
          )}
        </div>
      )}

      {isCreatingTest && (
        <div className="form bg-white text-neutral-900 p-6 rounded-lg shadow-md space-y-4">
          {step === 1 && (
            <>
              <h3 className="text-xl font-semibold mb-2 text-gray-950">
                Add Questions
              </h3>
              <span className="italic text-gray-400 mb-2">
                Select the type of question you want
              </span>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setQuestionType("normal")}
                  className={`px-4 py-2 rounded ${
                    questionType === "normal"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-400"
                  }`}
                >
                  Normal Question
                </button>
                <button
                  onClick={() => setQuestionType("mcq")}
                  className={`px-4 py-2 rounded ${
                    questionType === "mcq"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-400"
                  }`}
                >
                  Multiple Choice Question
                </button>
              </div>

              {questionType === "normal" && (
                <div>
                  <input
                    type="text"
                    value={normalQuestion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNormalQuestion(e.target.value)
                    }
                    placeholder="Enter normal question"
                    className="w-full border px-3 py-2 rounded mb-2"
                  />
                  <button
                    onClick={addNormalQuestion}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    + Add Question
                  </button>
                </div>
              )}

              {questionType === "mcq" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={mcqQuestion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMcqQuestion(e.target.value)
                    }
                    placeholder="Enter MCQ question"
                    className="w-full border px-3 py-2 rounded"
                  />
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newOpts = [...options];
                          newOpts[idx] = e.target.value;
                          setOptions(newOpts);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 border px-3 py-2 rounded"
                      />
                      <input
                        type="radio"
                        name="correct-option" // Add name for radio button group
                        checked={correctIndex === idx}
                        onChange={() => setCorrectIndex(idx)}
                      />
                      <span className="text-sm text-gray-500">Correct</span>
                    </div>
                  ))}
                  <button
                    onClick={addMcqQuestion}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
                  >
                    + Add Question
                  </button>
                </div>
              )}

              {(Object.keys(questions.normalQuestions).length > 0 ||
                Object.keys(questions.multiplechoice).length > 0) && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2 text-gray-500">
                    Questions Added:
                  </h4>
                  <ul className="space-y-2">
                    {Object.entries(questions.normalQuestions).map(
                      ([key, value]) => (
                        <li
                          key={key}
                          className="text-sm border-2 border-gray-400 p-2 rounded bg-gray-200/50"
                        >
                          <span className="text-gray-700">📝 {value}</span>{" "}
                        </li>
                      )
                    )}

                    {Object.entries(questions.multiplechoice).map(
                      ([key, data]) => (
                        <li
                          key={key}
                          className="text-sm border-2 border-gray-400 p-2 rounded bg-gray-200/50"
                        >
                          <p className="text-gray-700">🔢 {data.question}</p>{" "}
                          <ul className="ml-4 list-decimal text-xs">
                            <li
                              className={
                                data.correct === "choice1"
                                  ? "font-bold text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              {data.choice1}
                            </li>
                            <li
                              className={
                                data.correct === "choice2"
                                  ? "font-bold text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              {data.choice2}
                            </li>
                            <li
                              className={
                                data.correct === "choice3"
                                  ? "font-bold text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              {data.choice3}
                            </li>
                            <li
                              className={
                                data.correct === "choice4"
                                  ? "font-bold text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              {data.choice4}
                            </li>
                          </ul>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md"
                disabled={
                  Object.keys(questions.normalQuestions).length === 0 &&
                  Object.keys(questions.multiplechoice).length === 0
                } // Disable if no questions added
              >
                Proceed →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-xl font-semibold mb-4 text-sky-700">
                Test Details
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={testMeta.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTestMeta({ ...testMeta, title: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Class (e.g., 10A)"
                  value={testMeta.class}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTestMeta({ ...testMeta, class: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={testMeta.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTestMeta({ ...testMeta, subject: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g., 60 minutes)"
                  value={testMeta.duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTestMeta({ ...testMeta, duration: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <button
                onClick={handlePostTest}
                className="mt-6 bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-md"
                disabled={
                  !testMeta.title ||
                  !testMeta.class ||
                  !testMeta.subject ||
                  !testMeta.duration
                } // Disable if any meta field is empty
              >
                Post Test
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
