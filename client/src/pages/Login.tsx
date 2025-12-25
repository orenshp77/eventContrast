import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/swal';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast.success('התחברת בהצלחה!');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'סיסמה או משתמש לא נכון';
      showToast.error(message);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-3xl font-bold text-gray-900">הסכם דיגיטלי</h1>
          <p className="text-gray-600 mt-2">מערכת הסכמים וחתימות דיגיטליות</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            התחברות
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">אימייל</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="input-label">סיסמה</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  מתחבר...
                </span>
              ) : (
                'התחבר'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              אין לך חשבון?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                הירשם עכשיו
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
