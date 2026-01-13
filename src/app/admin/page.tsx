'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import Header from '@/components/Header';

interface User {
  id: string;
  email: string;
  credits: number;
  imageCount: number;
  creditsUsed: number;
  createdAt: string | null;
  updatedAt: string | null;
  error?: string;
}

interface AdminData {
  users: User[];
  totalUsers: number;
  totalImages: number;
  totalCredits: number;
  totalCreditsUsed: number;
}

const AdminDashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newCredits, setNewCredits] = useState<number>(0);

  const fetchAdminData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch admin data');
      }

      const data = await response.json();
      setAdminData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserCredits = async (userId: string, credits: number) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-credits',
          userId,
          credits
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update credits');
      }

      // Refresh data
      await fetchAdminData();
      setEditingUserId(null);
      setNewCredits(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update credits');
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchAdminData();
    }
  }, [user, loading]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const startEditing = (userId: string, currentCredits: number) => {
    setEditingUserId(userId);
    setNewCredits(currentCredits);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🔐 Admin Access
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please sign in with admin credentials
            </p>
          </div>
          <Auth />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="max-w-7xl mx-auto p-4">
        {/* Admin Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🛠️ Optic Engine Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Signed in as: {user.email}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {adminData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {adminData.totalUsers}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Total Users</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">🎨</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {adminData.totalImages}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Images Generated</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">💳</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {adminData.totalCredits}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Total Credits</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {adminData.totalCreditsUsed}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Credits Used</div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '🔄 Loading...' : '🔄 Refresh Data'}
          </button>
        </div>

        {/* Users Table */}
        {adminData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                User Management
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Credits Used
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Images Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Join Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {adminData.users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {userData.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingUserId === userData.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={newCredits}
                              onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button
                              onClick={() => updateUserCredits(userData.id, newCredits)}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            userData.credits > 5 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : userData.credits > 0
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            💳 {userData.credits}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          🔥 {userData.creditsUsed || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        🎨 {userData.imageCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(userData.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingUserId !== userData.id && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEditing(userData.id, userData.credits)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => updateUserCredits(userData.id, userData.credits + 50)}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => updateUserCredits(userData.id, userData.credits + 100)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors"
                            >
                              +100
                            </button>
                            <button
                              onClick={() => updateUserCredits(userData.id, userData.credits + 500)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded transition-colors"
                            >
                              +500
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminData && adminData.users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Users Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Users will appear here once they start signing up
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 