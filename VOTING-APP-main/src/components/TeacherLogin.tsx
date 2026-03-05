import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeacherLogin() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      if (!username.trim() || !password) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      const success = await login(username, password);

      if (!success) {
        setError("Login failed. Please check your credentials and try again.");
      } else {
        navigate('/TeacherDashboard');
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="flex justify-between items-center mb-12">
        <img
          src="/images/euroschool-logo.png"
          alt="EuroSchool North Campus"
          className="h-16 w-16 object-contain cursor-pointer"
          onClick={() => navigate("/")}
        />
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
        </button>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">

          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 dark:bg-blue-700 p-4 rounded-full">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
            Administrator Login
          </h1>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Please log in with your username and password to access the dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}