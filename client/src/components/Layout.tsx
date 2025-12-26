import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function Layout({ children, title, showBack }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'ראשי', icon: '🏠' },
    { path: '/events', label: 'אירועים', icon: '📅' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      {/* Top Header */}
      <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                aria-label="חזרה"
              >
                <svg className="w-6 h-6 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {title ? (
              <h1 className="text-xl font-bold text-white">{title}</h1>
            ) : (
              <Link to="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span className="font-bold text-lime-400 text-lg">הסכם דיגיטלי</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-gray-300 hidden md:inline font-medium">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-400 hover:text-red-300 font-bold px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all"
                >
                  התנתק
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 md:hidden z-40 safe-area-pb">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl mx-1 transition-all ${
                  isActive
                    ? 'bg-lime-500/20 text-lime-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-red-400 rounded-2xl mx-1 transition-all"
          >
            <span className="text-2xl mb-1">🚪</span>
            <span className="text-xs font-bold">יציאה</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
