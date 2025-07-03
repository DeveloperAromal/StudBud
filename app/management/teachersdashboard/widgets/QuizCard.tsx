import {
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  Eye,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

// --- Type Definitions ---

// Define the structure for normal questions within the quiz object
interface NormalQuestions {
  [key: string]: string;
}

// Define the structure for multiple-choice questions within the quiz object
interface MultipleChoiceOption {
  question: string;
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  correct: `choice${1 | 2 | 3 | 4}`;
}

// Define the overall structure for the 'question' object within the quiz
interface QuizQuestions {
  normalQuestions?: NormalQuestions; // Optional, as it might not always exist or be empty
  multiplechoice?: {
    [key: string]: MultipleChoiceOption; // Optional, as it might not always exist or be empty
  };
}

// Define the expected structure of the 'quiz' prop
interface QuizCardProps {
  quiz: {
    title: string;
    classname: number;
    subject: string;
    duration: string;
    question?: QuizQuestions; // Make it optional since it's accessed with `?.`
    created_at?: string; // Assuming your API sends this as a string date
    examId: string; // Assuming there's an examId for the Link href
    // Add any other properties that your quiz object might contain
  };
}

// --- QuizCard Component ---

export default function QuizCard({ quiz }: QuizCardProps) {
  // Safely calculate total questions using optional chaining and nullish coalescing
  const totalQuestions =
    Object.keys(quiz.question?.normalQuestions || {}).length +
    Object.keys(quiz.question?.multiplechoice || {}).length;

  useEffect(() => {
    // Only log the quiz object if it's necessary for debugging.
    // In production, you might want to remove or conditionally enable this.
    console.log(quiz);
  }, [quiz]); // Added quiz to dependency array to ensure it re-logs if quiz object changes

  return (
    <div className="flex justify-between items-center p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="space-y-2">
        {/* Title and Tags */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            EXAM
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
            SCHEDULED
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span>Class {quiz.classname}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{quiz.subject}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4" />
            <span>
              {/* Safely display date, provide fallback if created_at is undefined */}
              {quiz.created_at
                ? new Date(quiz.created_at).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>10:00 AM ({quiz.duration} minutes)</span>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="text-sm text-gray-500">
          <span className="mr-4">—</span> {/* Placeholder separator */}
          <span>{totalQuestions} questions</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 text-gray-900">
        <Link
          href={`/management/teachersdashboard/tabs/examandtests/e&t/${quiz.examId}`}
          passHref // Important for Next.js Link when wrapping custom components
        >
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center gap-1">
            <Eye className="w-4 h-4" />
            View
          </button>
        </Link>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center gap-1">
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
