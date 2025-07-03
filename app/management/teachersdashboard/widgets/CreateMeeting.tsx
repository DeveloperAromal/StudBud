"use client";

import React, { useState, useEffect, FormEvent } from "react";
import axios from "axios";

// Interface for meeting settings
interface Settings {
  join_before_host: boolean;
  waiting_room: boolean;
}

// Interface for meeting data
interface MeetingData {
  topic: string;
  type: number;
  start_time: string; // ISO 8601 string
  duration: number;
  timezone: string;
  password: string;
  settings: Settings;
}

// Interface for a created meeting (as fetched from the backend)
interface CreatedMeeting {
  meetingData: MeetingData; // The backend might wrap the meeting data
  start_url?: string;
}

// Predefined timezones for the dropdown
const timezones = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
];

const CreateMeeting: React.FC = () => {
  // State for the meeting data to be sent to the backend
  const [meeting, setMeeting] = useState<MeetingData>({
    topic: "",
    type: 2, // Default type
    start_time: "", // Will be an ISO string, derived from selectedDate and selectedTime
    duration: 30, // Default duration
    timezone: "Asia/Kolkata", // Default timezone
    password: "",
    settings: {
      join_before_host: false,
      waiting_room: true,
    },
  });

  // Separate states for date and time input fields to prevent refresh issues
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // State for class name input
  const [className, setClassName] = useState<string>("");
  // State to control visibility of the meeting creation form
  const [showForm, setShowForm] = useState<boolean>(false);
  // State to store the list of created meetings fetched from the backend
  const [meetings, setMeetings] = useState<CreatedMeeting[]>([]);
  // State to store the start URL of a newly created meeting
  const [startUrl, setStartUrl] = useState<string>("");

  // Determine the subdomain from the current hostname
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const subdomain = hostname.split(".")[0];

  // Effect to fetch existing meetings when the component mounts
  useEffect(() => {
    fetchMeetings();
  }, []); // Empty dependency array means this runs once on mount

  // Effect to update selectedDate and selectedTime when meeting.start_time changes
  // This ensures that if start_time is set programmatically (e.g., after form reset),
  // the date and time inputs reflect it correctly.
  useEffect(() => {
    if (meeting.start_time) {
      const datePart = meeting.start_time.split("T")[0];
      const timePart = meeting.start_time.split("T")[1]?.slice(0, 5);
      setSelectedDate(datePart || "");
      setSelectedTime(timePart || "");
    } else {
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [meeting.start_time]);

  /**
   * Fetches the list of meetings from the backend for the current subdomain.
   */
  const fetchMeetings = async () => {
    try {
      const res = await axios.get(
        `https://studbud-backend-server.onrender.com/api/v1/get/meetdata/${subdomain}`
      );
      // Ensure res.data is an array or default to empty array
      setMeetings(res.data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      // Optionally, show a user-friendly message
    }
  };

  /**
   * Checks if a meeting's start time has passed.
   * @param start_time The ISO 8601 start time string of the meeting.
   * @returns True if the meeting has expired, false otherwise.
   */
  const isExpired = (start_time: string) => {
    return new Date(start_time) < new Date();
  };

  /**
   * Handles changes for all input fields except date and time.
   * Updates the `meeting` state accordingly.
   * @param e The change event from the input or select element.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "join_before_host" || name === "waiting_room") {
      // Handle checkbox inputs for settings
      setMeeting((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [name]: (e.target as HTMLInputElement).checked, // Cast to HTMLInputElement for 'checked'
        },
      }));
    } else if (name === "type" || name === "duration") {
      // Handle number inputs (type and duration)
      setMeeting((prev) => ({
        ...prev,
        [name]: Number(value), // Convert value to a number
      }));
    } else {
      // Handle general text/select inputs
      setMeeting((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /**
   * Handles changes for date and time input fields.
   * Updates `selectedDate` or `selectedTime` and then combines them to update `meeting.start_time`.
   * @param e The change event from the date or time input element.
   */
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update the specific date or time state
    if (name === "date") {
      setSelectedDate(value);
    } else if (name === "time") {
      setSelectedTime(value);
    }

    // Combine the current selectedDate and selectedTime to form the ISO string
    // Use the updated value from the event for the current input,
    // and the existing state for the other input to ensure immediate reflection.
    const currentSelectedDate = name === "date" ? value : selectedDate;
    const currentSelectedTime = name === "time" ? value : selectedTime;

    if (currentSelectedDate && currentSelectedTime) {
      // Construct a Date object from the combined date and time
      const combined = new Date(
        `${currentSelectedDate}T${currentSelectedTime}:00`
      );
      // Update the meeting's start_time with the ISO string
      setMeeting((prev) => ({
        ...prev,
        start_time: combined.toISOString(),
      }));
    } else {
      // If either date or time is not yet set, clear start_time
      setMeeting((prev) => ({
        ...prev,
        start_time: "",
      }));
    }
  };

  /**
   * Handles the form submission, sending meeting data to the backend.
   * @param e The form submission event.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (!className.trim()) {
      // Use a custom modal or message box instead of alert
      // For this example, we'll use a simple alert as per original code,
      // but in a real app, replace with a UI component.
      alert("Class name is required.");
      return;
    }

    try {
      const res = await axios.post(
        "https://studbud-backend-server.onrender.com/api/v1/create/meet",
        {
          classname: className.trim(),
          meetingData: meeting,
          subdomain,
        }
      );

      if (res.data.success) {
        alert("Meeting created successfully!");
        setStartUrl(res.data?.start_url || ""); // Set the start URL if available
        // Reset all form fields after successful submission
        setMeeting({
          topic: "",
          type: 2,
          start_time: "", // Clear start_time, which will also clear selectedDate/Time via useEffect
          duration: 30,
          timezone: "Asia/Kolkata",
          password: "",
          settings: {
            join_before_host: false,
            waiting_room: true,
          },
        });
        setClassName("");
        // Re-fetch meetings to update the list
        fetchMeetings();
      } else {
        alert("Meeting creation failed.");
      }
    } catch (error: any) {
      // Handle API errors and display a user-friendly message
      alert(
        "Something went wrong: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="w-full h-screen bg-white text-black p-4 sm:p-8 font-sans overflow-y-scroll">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Meetings</h2>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md"
        >
          {showForm ? "Close Form" : "Add New Meeting"}
        </button>
      </div>

      {/* Display start URL if a meeting was just created */}
      {startUrl && (
        <div className="mb-6 p-4 border border-green-500 rounded-md bg-green-50 text-green-800 shadow-sm">
          <strong>Meeting Created!</strong>{" "}
          <a
            href={startUrl}
            target="_blank"
            rel="noopener noreferrer" // Security best practice for target="_blank"
            className="text-blue-600 underline break-all hover:text-blue-800 transition-colors duration-200"
          >
            Start Meeting
          </a>
        </div>
      )}

      {/* Display list of existing meetings */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {meetings.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-10">
            No meetings found.
          </p>
        ) : (
          meetings.map((m, i) => {
            const expired = isExpired(m.meetingData.start_time);
            return (
              <div
                key={i}
                className={`p-5 rounded-lg border shadow-md bg-white ${
                  expired ? "border-red-400" : "border-green-400"
                } transform transition-transform duration-200 hover:scale-105`}
              >
                <h3 className="text-lg font-semibold mb-1 text-gray-800">
                  {m.meetingData.topic || "Untitled Meeting"}
                </h3>
                <p className="text-sm text-gray-600">
                  <strong>Start:</strong>{" "}
                  {new Date(m.meetingData.start_time).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-sm mt-1">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      expired
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {expired ? "Expired" : "Upcoming"}
                  </span>
                </p>
                {m.start_url && (
                  <a
                    href={m.start_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-600 underline text-sm hover:text-blue-800 transition-colors duration-200"
                  >
                    🔗 Start URL
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Meeting Creation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl mx-auto grid gap-4 p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-lg shadow-lg"
        >
          {/* Meeting Topic */}
          <input
            type="text"
            name="topic"
            value={meeting.topic}
            onChange={handleChange}
            required
            placeholder="Meeting Topic"
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          {/* Meeting Type */}
          <select
            name="type"
            value={meeting.type}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
          >
            <option value={1}>Type 1 (Instant Meeting)</option>
            <option value={2}>Type 2 (Scheduled Meeting)</option>
            <option value={3}>
              Type 3 (Recurring Meeting with No Fixed Time)
            </option>
          </select>

          {/* Date and Time Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="date"
              name="date"
              value={selectedDate} // Bind to selectedDate state
              onChange={handleDateTimeChange}
              required
              className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <input
              type="time"
              name="time"
              value={selectedTime} // Bind to selectedTime state
              onChange={handleDateTimeChange}
              required
              className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Duration */}
          <input
            type="number"
            name="duration"
            value={meeting.duration}
            onChange={handleChange}
            min={1}
            required
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Duration in minutes (e.g., 30)"
          />

          {/* Timezone */}
          <select
            name="timezone"
            value={meeting.timezone}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>

          {/* Password */}
          <input
            type="text"
            name="password"
            value={meeting.password}
            onChange={handleChange}
            placeholder="Meeting Password (optional)"
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />

          {/* Class Name */}
          <input
            type="text"
            name="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
            placeholder="Class Name (e.g., 10A)"
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />

          {/* Settings Checkboxes */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                name="join_before_host"
                checked={meeting.settings.join_before_host}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              Join Before Host
            </label>

            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                name="waiting_room"
                checked={meeting.settings.waiting_room}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              Waiting Room
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors duration-200 mt-4 shadow-md text-lg font-semibold"
          >
            Create Meeting
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateMeeting;
