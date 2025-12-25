import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/swal';

export default function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessPhone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast.error('הסיסמאות אינן תואמות');
      return;
    }

    if (formData.password.length < 6) {
      showToast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        businessPhone: formData.businessPhone,
      });
      showToast.success('נרשמת בהצלחה!');
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message ||
                      error.message ||
                      'שגיאה בהרשמה - נא לוודא שהשרת פעיל';
      showToast.error(message);
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
          <p className="text-gray-600 mt-2">צור חשבון חדש</p>
        </div>

        {/* Register Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            הרשמה
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">שם מלא *</label>
              <input
                type="text"
                name="name"
                className="input"
                placeholder="ישראל ישראלי"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="input-label">אימייל *</label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">סיסמה *</label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  dir="ltr"
                />
              </div>
              <div>
                <label className="input-label">אימות סיסמה *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="input"
                  placeholder="••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <hr className="my-4" />

            <div>
              <label className="input-label">שם העסק</label>
              <input
                type="text"
                name="businessName"
                className="input"
                placeholder="העסק שלי בע״מ"
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="input-label">טלפון העסק</label>
              <input
                type="tel"
                name="businessPhone"
                className="input"
                placeholder="050-0000000"
                value={formData.businessPhone}
                onChange={handleChange}
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
                  נרשם...
                </span>
              ) : (
                'הירשם'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              כבר יש לך חשבון?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                התחבר
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
