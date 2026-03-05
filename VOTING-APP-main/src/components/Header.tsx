import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex justify-between items-center mb-12">
      <img
        src="/images/euroschool-logo.png"
        alt="EuroSchool North Campus"
        className="h-16 w-16 object-contain cursor-pointer"
        onClick={() => navigate("/")}
      />
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
      </button>
    </div>
  );
}