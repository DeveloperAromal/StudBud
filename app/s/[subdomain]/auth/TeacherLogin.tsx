"use client";

import { User, Lock, ArrowRight } from "lucide-react"; // Added ArrowRight for the button
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

// Define the JWT payload type more accurately
type JwtPayload = {
  exp?: number; // Expiration time in Unix timestamp (seconds)
  iat?: number; // Issued at time in Unix timestamp (seconds)
  sub?: string; // Subject (e.g., user ID)
  // Add any other expected properties from your JWT here
  role?: string; // Example: if your token has a user role
};

export default function Login() {
  const [formData, setFormData] = useState({
    phonenumber: "", // Assuming 'phonenumber' is your username field
    password: "",
  });
  const [error, setError] = useState<string | null>(null); // State for displaying login errors
  const [loading, setLoading] = useState(false); // State for showing loading indicator

  const router = useRouter();

  // Helper function to decode and check token validity
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      // Check if 'exp' exists and if the token has not expired
      if (decoded.exp && Date.now() / 1000 < decoded.exp) {
        return true;
      }
      return false;
    } catch (e) {
      console.error("Token decode error or invalid token:", e);
      return false;
    }
  };

  // Effect to check for existing valid token on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenValid(token)) {
      router.push("/management/teachersdashboard");
    }
  }, [router]); // `router` is a dependency here

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null); // Clear error message when user starts typing
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear any previous errors
    setLoading(true); // Start loading animation

    try {
      // Use NEXT_PUBLIC_APP_BASE_URL for client-side environment variables
      const { data } = await axios.post<{ token: string }>(
        `${
          process.env.NEXT_PUBLIC_APP_BASE_URL ||
          "https://studbud-backend-server.onrender.com"
        }/api/v1/user/loginTeacher`,
        formData
      );

      const token = data.token;
      if (token) {
        localStorage.setItem("token", token);
        router.push("/management/teachersdashboard");
      } else {
        // This case should ideally not happen if the API always sends a token on success
        setError("Login successful, but no token received.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (axios.isAxiosError(err) && err.response) {
        // Handle specific API error messages
        setError(
          err.response.data.message || "Invalid credentials. Please try again."
        );
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false); // End loading animation
    }
  };

  return (
    <section className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-purple-100 animate-gradient-xy">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200 backdrop-blur-sm bg-opacity-90 transition-all duration-500 hover:shadow-2xl">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-4 tracking-tight">
          Welcome Back!
        </h1>
        <p className="text-center text-gray-600 mb-8 text-lg">
          Sign in to your teacher dashboard.
        </p>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Phone Number Input */}
          <div>
            <label
              htmlFor="phonenumber"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Phone Number
            </label>
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent transition-all duration-200">
              <User className="w-5 h-5 text-gray-500 mr-3" />
              <input
                id="phonenumber" // Added id for label association
                type="text"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                placeholder="e.g., 09123456789"
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                required // Added required attribute
                autoComplete="tel" // Semantic autocomplete
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent transition-all duration-200">
              <Lock className="w-5 h-5 text-gray-500 mr-3" />
              <input
                id="password" // Added id for label association
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                required // Added required attribute
                autoComplete="current-password" // Semantic autocomplete
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-600 text-sm text-center -mt-2">{error}</p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            disabled={loading} // Disable button when loading
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              <>
                Login
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>

          {/* Signup Link */}
          <p className="text-center text-gray-600 text-sm mt-4">
            Don't have an account?{" "}
            <Link
              href="/auth/teachersignup" // Corrected typo from 'sigup' to 'signup'
              className="text-sky-600 font-semibold hover:underline hover:text-sky-700 transition-colors duration-200"
            >
              Sign up here
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
