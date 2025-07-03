"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Play, CheckCircle } from "lucide-react";
import { Button } from "./ui/button"; // Assuming these are valid imports from your UI library
import { Card } from "./ui/card"; // Assuming these are valid imports from your UI library
import axios from "axios";

// 1. Define the type for a single status entry within the homework item
interface HomeworkStatusEntry {
  s_id: string;
  status: "completed" | "notcompleted";
  duration: number; // Duration of the homework (in minutes, as a number)
  startedAt: string; // ISO string for when the homework was started/completed
  // Add any other properties that might be part of a status entry, e.g., 'completedAt'
}

// 2. Corrected HomeworkItem interface
interface HomeworkItem {
  hwId: number;
  title: string;
  description: string;
  classname: string; // Backend likely sends classname as a string
  subject: string;
  duration: string; // Sticking to string as per current usage, but consider parsing to number
  status: HomeworkStatusEntry[]; // Corrected: An array of status entries
  // Add any other properties that your backend sends for a homework item
}

// 3. Interface for the user validation response
interface UserValidationResponse {
  user: {
    response: Array<{
      s_id: string;
      classname: string; // classname from validation is likely string if it's "1st grade", "2nd grade" etc.
      // Add other user properties if needed
    }>;
  };
}

// 4. Interface for the homework update payload
interface HomeworkUpdatePayload {
  hwId: number;
  status: {
    s_id: string;
    duration: number;
    startedAt: string;
  };
}

export default function Homework() {
  // classname state type changed to string | null based on validation response
  const [classname, setClassname] = useState<string | null>(null);
  const [sId, setSId] = useState<string>("");
  const [homework, setHomework] = useState<HomeworkItem[] | null>(null);

  const [activeHomework, setActiveHomework] = useState<Record<number, boolean>>(
    {}
  );
  const [countdowns, setCountdowns] = useState<Record<number, number>>({});

  // Get student info
  useEffect(() => {
    const getUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. User not authenticated.");
        return;
      }
      try {
        // Explicitly type the axios response
        const res = await axios.get<UserValidationResponse>(
          `${
            process.env.NEXT_PUBLIC_APP_BASE_URL || // Use NEXT_PUBLIC for client-side env vars
            "https://studbud-backend-server.onrender.com"
          }/api/v1/user/authentication/protect/validate`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const user = res.data.user.response[0]; // Access the first element of the response array
        setSId(user?.s_id || "");
        setClassname(user?.classname || null); // Classname is a string here
      } catch (e) {
        console.error("Failed to fetch user info", e);
      }
    };
    getUserInfo();
  }, []);

  // Fetch homework
  useEffect(() => {
    if (!classname) return; // Wait until classname is available
    const fetchHomework = async () => {
      try {
        // Explicitly type the axios response as an array of HomeworkItem
        const res = await axios.get<HomeworkItem[]>(
          `${
            process.env.NEXT_PUBLIC_APP_BASE_URL || // Use NEXT_PUBLIC
            "https://studbud-backend-server.onrender.com"
          }/api/v1/get/homework/${classname}`
        );
        setHomework(res.data);
      } catch (e) {
        console.error("Failed to fetch homework", e);
      }
    };
    fetchHomework();
  }, [classname]); // Dependency on classname

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const updated = { ...prev };
        let anyRunning = false;
        for (const id in updated) {
          if (updated[id] > 0) {
            updated[id] -= 1;
            anyRunning = true;
          }
        }
        // Only return new object if something changed to prevent unnecessary re-renders
        return anyRunning ? updated : prev;
      });
    }, 1000);
    // Clear interval when component unmounts or effect re-runs
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const startHomework = (hwId: number, durationMinutes: string) => {
    const seconds = parseInt(durationMinutes) * 60;
    if (isNaN(seconds)) {
      console.error(`Invalid duration for hwId ${hwId}: ${durationMinutes}`);
      return;
    }
    setActiveHomework((prev) => ({ ...prev, [hwId]: true }));
    setCountdowns((prev) => ({ ...prev, [hwId]: seconds }));
  };

  const markAsCompleted = async (homeworkId: number, duration: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found. Cannot mark homework as completed.");
      return;
    }

    try {
      const parsedDuration = parseInt(duration);
      if (isNaN(parsedDuration)) {
        console.error(`Invalid duration for marking completed: ${duration}`);
        return;
      }

      const statusPayload: HomeworkUpdatePayload["status"] = {
        s_id: sId,
        duration: parsedDuration,
        startedAt: new Date().toISOString(), // Use current time for completion marking
      };

      await axios.post(
        `${
          process.env.NEXT_PUBLIC_APP_BASE_URL || // Use NEXT_PUBLIC
          "https://studbud-backend-server.onrender.com"
        }/api/v1/update/hwstatus`,
        {
          hwId: homeworkId,
          status: statusPayload, // This matches the HomeworkUpdatePayload interface
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state to reflect completion
      setHomework(
        (prev) =>
          prev?.map((hw) => {
            if (hw.hwId === homeworkId) {
              // Ensure hw.status is always an array before adding
              const updatedStatus = hw.status ? [...hw.status] : [];
              const existingStatusIndex = updatedStatus.findIndex(
                (entry) => entry.s_id === sId
              );

              if (existingStatusIndex > -1) {
                // Update existing status for the student
                updatedStatus[existingStatusIndex] = {
                  ...updatedStatus[existingStatusIndex],
                  status: "completed",
                  startedAt: statusPayload.startedAt, // Update startedAt too
                  duration: statusPayload.duration, // Update duration if needed
                };
              } else {
                // Add new status entry for the student
                updatedStatus.push({
                  s_id: sId,
                  status: "completed",
                  startedAt: statusPayload.startedAt,
                  duration: statusPayload.duration,
                });
              }

              return {
                ...hw,
                status: updatedStatus,
              };
            }
            return hw;
          }) || [] // Fallback to an empty array if prev is null
      );
      setActiveHomework((prev) => ({ ...prev, [homeworkId]: false })); // Stop timer/mark inactive
      setCountdowns((prev) => ({ ...prev, [homeworkId]: 0 })); // Reset countdown
    } catch (e) {
      console.error("Failed to update homework status", e);
      alert("Failed to mark homework as completed. Please try again.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white">
      <h2 className="text-4xl font-bold text-black mb-6">Home Work</h2>

      {homework && homework.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {homework.map((hw) => {
            const secondsLeft = countdowns[hw.hwId] || 0;
            const isRunning = activeHomework[hw.hwId];
            // Check if the current student (sId) has completed this homework
            // Use hw.status safely with optional chaining and ensure it's an array
            const isCompleted = hw.status?.some(
              (entry) => entry.s_id === sId && entry.status === "completed"
            );

            return (
              <Card
                key={hw.hwId} // Use hwId as key
                className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all border border-sky-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {hw.title}
                    </h3>
                    <span className="text-sm text-sky-600 font-medium bg-sky-100 px-2 py-1 rounded">
                      {hw.subject}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    Class: {hw.classname} {/* Display classname */}
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4">{hw.description}</p>

                <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Estimated Duration: {hw.duration} mins</span>
                  </div>

                  {isRunning && secondsLeft > 0 && (
                    <div className="flex items-center gap-2 text-red-600 font-semibold">
                      <Clock size={16} />
                      Time Left: {formatTime(secondsLeft)}
                    </div>
                  )}
                  {isRunning &&
                    secondsLeft <= 0 && ( // Display "Time Over!" when countdown finishes
                      <div className="flex items-center gap-2 text-red-600 font-semibold">
                        <Calendar size={16} />{" "}
                        {/* Using Calendar for "Time Over" icon for variety */}
                        Time Over!
                      </div>
                    )}
                </div>

                {/* Action Buttons */}
                {isCompleted ? (
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-center font-medium flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> Completed
                  </div>
                ) : isRunning ? (
                  // If running and time left (or just running)
                  <Button
                    onClick={() => markAsCompleted(hw.hwId, hw.duration)}
                    className="bg-green-600 hover:bg-green-700 w-full flex items-center justify-center gap-2"
                    // Disable if countdown hit zero and it's still marked as running
                    disabled={secondsLeft <= 0}
                  >
                    <CheckCircle size={18} /> Mark as Read
                  </Button>
                ) : (
                  // Not completed and not running
                  <Button
                    onClick={() => startHomework(hw.hwId, hw.duration)}
                    className="bg-sky-500 hover:bg-sky-600 w-full flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> Start
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500">No homework available.</p>
      )}
    </div>
  );
}
