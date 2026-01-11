import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showConfirm, showToast } from '../utils/swal';

interface User {
  id: number;
  name: string;
  email: string;
  businessName?: string;
  businessPhone?: string;
  createdAt: string;
  eventCount: number;
  inviteCount: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      setIsLoggedIn(true);
      fetchUsers(token);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      setAdminToken(data.token);
      setIsLoggedIn(true);
      fetchUsers(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Admin ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsUser = async (userId: number, userName: string) => {
    const confirmed = await showConfirm(
      `כניסה כמשתמש ${userName}`,
      'האם אתה בטוח שברצונך להתחבר לחשבון זה?'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/login-as/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!res.ok) {
        throw new Error('Failed to login as user');
      }

      const data = await res.json();

      // Save user token and redirect to dashboard
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showToast.success(`נכנסת כמשתמש ${userName}`);
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      showToast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    const confirmed = await showConfirm(
      `מחיקת משתמש ${userName}`,
      'פעולה זו תמחק את המשתמש וכל האירועים וההסכמים שלו. האם להמשיך?'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!res.ok) {
        throw new Error('Failed to delete user');
      }

      showToast.success(`המשתמש ${userName} נמחק בהצלחה`);
      fetchUsers(adminToken);
    } catch (err: any) {
      showToast.error(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setAdminToken('');
    setUsers([]);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Admin Panel - Login</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <button onClick={handleLogout} className="btn btn-secondary">
            התנתק
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-primary-600">{users.length}</div>
            <div className="text-gray-500">משתמשים</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-green-600">
              {users.reduce((sum, u) => sum + u.eventCount, 0)}
            </div>
            <div className="text-gray-500">סוגי הסכמים</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">
              {users.reduce((sum, u) => sum + u.inviteCount, 0)}
            </div>
            <div className="text-gray-500">הסכמים</div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">רשימת משתמשים</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              אין משתמשים
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">שם</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">אימייל</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">עסק</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">הסכמים</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">תאריך הרשמה</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{user.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.businessName || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {user.eventCount} סוגים
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-1">
                          {user.inviteCount} הסכמים
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoginAsUser(user.id, user.name)}
                            className="bg-primary-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-primary-700 transition-colors"
                          >
                            כניסה
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition-colors"
                          >
                            מחיקה
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
