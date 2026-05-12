import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              DDoS Sentinel
            </h1>
            <div className="hidden md:flex gap-6">
              <a href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Dashboard
              </a>
              <a href="/traffic" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Traffic
              </a>
              <a href="/alerts" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Alerts
              </a>
              <a href="/intel" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Threat Intel
              </a>
              <a href="/reports" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Reports
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
              {user?.username}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>

            <button
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <a href="/dashboard" className="block px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Dashboard
            </a>
            <a href="/traffic" className="block px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Traffic
            </a>
            <a href="/alerts" className="block px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Alerts
            </a>
            <a href="/intel" className="block px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Threat Intel
            </a>
            <a href="/reports" className="block px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Reports
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
