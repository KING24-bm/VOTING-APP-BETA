import { LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

export default function TeacherLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="max-w-2xl w-full">

          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Administrator Portal
            </h1>

            <p className="text-xl text-gray-600">
              Manage your school's voting system
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Login */}
            <button
              type="button"
              onClick={() => navigate("/TeacherLogin")}
              className="bg-white rounded-2xl shadow-xl p-12 hover:shadow-2xl transition transform hover:-translate-y-2"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-6 rounded-full">
                  <LogIn className="w-16 h-16 text-blue-600" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                Login
              </h2>

              <p className="text-gray-600 text-center text-lg">
                Sign in to your existing administrator account
              </p>
            </button>

            {/* Sign Up */}
            <button
              type="button"
              onClick={() => navigate("/TeacherSignup")}
              className="bg-white rounded-2xl shadow-xl p-12 hover:shadow-2xl transition transform hover:-translate-y-2"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-6 rounded-full">
                  <UserPlus className="w-16 h-16 text-green-600" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                Sign Up
              </h2>

              <p className="text-gray-600 text-center text-lg">
                Create a new administrator account
              </p>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}