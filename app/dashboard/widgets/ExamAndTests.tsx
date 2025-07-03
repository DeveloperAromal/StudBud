"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
// Assuming SubFinder is correctly typed in its own file
// import { SubFinder } from "@/app/utils/Subdomainfinder"; // Not used in provided snippet, but kept for context

// --- Type Definitions ---

// Define the structure for normal questions
interface NormalQuestions {
  [key: string]: string;
}

// Define the structure for multiple-choice options
interface MultipleChoiceOption {
  question: string;
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  correct: `choice${1 | 2 | 3 | 4}`;
}

// Define the overall structure for the 'question' object within an exam
interface ExamQuestions {
  normalQuestions?: NormalQuestions;
  multiplechoice?: {
    [key: string]: MultipleChoiceOption;
  };
}

/**
 * @interface ExamItem
 * Defines the structure of an individual exam object returned by the API.
 * This interface includes all properties accessed in the component.
 */
interface ExamItem {
  _id: string; // Assuming MongoDB _id for the key
  title: string;
  classname: number; // Assuming classname is a number
  subject: string;
  duration: string; // e.g., "60 minutes"
  created_at: string; // Date string from the backend
  examId: string; // The ID used in the Link href
  question?: ExamQuestions; // The question structure, marked optional as it's accessed with ?.
  // Add any other properties that your API might return for an exam
}

// --- Component Definition ---

export default function ExamAndTests() {
  const [exams, setExams] = useState<ExamItem[]>([]); // Explicitly type as an array of ExamItem
  const [classname, setClassname] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please login.");
        setLoading(false);
        return;
      }

      try {
        // Define the expected response structure for the validation endpoint
        interface AuthValidationResponse {
          user: {
            response: Array<{ classname: string }>; // Assuming response is an array
          };
          // Add other properties if they exist in the validation response
        }

        const res = await axios.get<AuthValidationResponse>(
          `${
            process.env.NEXT_PUBLIC_APP_BASE_URL || // Use NEXT_PUBLIC for client-side env vars
            "https://studbud-backend-server.onrender.com"
          }/api/v1/user/authentication/protect/validate`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Safely access classname with optional chaining
        const cls = res.data?.user?.response?.[0]?.classname;
        if (!cls)
          throw new Error("Classname not found in validation response.");
        setClassname(cls);
      } catch (err: any) {
        // Type 'err' as 'any' for broader error handling
        console.error("Validation error:", err.message || err);
        setError(`User validation failed: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false); // Ensure loading is set to false regardless of success or failure
      }
    };

    validateToken();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (!classname) {
      // If classname is still null (e.g., validation failed or not yet completed),
      // and we are not loading, we can set error if it's not already set.
      if (!loading && !error) {
        setError("Class information not available to fetch exams.");
      }
      return;
    }

    const fetchExams = async () => {
      setLoading(true); // Set loading true before fetching exams
      setError(null); // Clear previous errors

      try {
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        const subdomain = parts[0];

        // Expect an array of ExamItem from the GET request
        const res = await axios.get<ExamItem[]>(
          `https://studbud-backend-server.onrender.com/api/v1/get/exam/${classname}/${subdomain}`
        );
        setExams(res.data);
      } catch (error: any) {
        // Type 'error' as 'any' for broader error handling
        console.error("Error fetching exams:", error.message || error);
        setError(`Failed to fetch exams: ${error.message || "Unknown error"}`);
      } finally {
        setLoading(false); // Set loading false after fetch attempt
      }
    };

    fetchExams();
  }, [classname]); // Re-fetch exams when classname changes

  if (loading) {
    return (
      <section className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading exams...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">Error: {error}</p>
      </section>
    );
  }

  return (
    <section className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        All Exams & Tests
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No exams available for your class yet.
          </p>
        ) : (
          exams.map((exam) => {
            // Safely calculate total questions using optional chaining and nullish coalescing
            const totalQuestions =
              Object.keys(exam.question?.normalQuestions || {}).length +
              Object.keys(exam.question?.multiplechoice || {}).length;

            return (
              <div
                key={exam._id} // Use _id from the ExamItem for a stable key
                className="flex flex-col justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {exam.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>Class {exam.classname}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{exam.subject}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      <span>
                        {/* Safely display date, provide fallback if created_at is undefined */}
                        {exam.created_at
                          ? new Date(exam.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{exam.duration} minutes</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    {totalQuestions} questions
                  </p>
                </div>

                {/* Start Exam Button */}
                <Link href={`/dashboard/tabs/exam/e/${exam.examId}`} passHref>
                  <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                    <PlayCircle className="w-5 h-5" />
                    Start Exam
                  </button>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
