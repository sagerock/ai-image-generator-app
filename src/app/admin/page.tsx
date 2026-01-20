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

interface MigrationResult {
  success: boolean;
  dryRun: boolean;
  summary: {
    fixed: number;
    alreadyCorrect: number;
    skipped: number;
    errors: number;
    total: number;
  };
  details: string[];
}

const AdminDashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

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

      await fetchAdminData();
      setEditingUserId(null);
      setNewCredits(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update credits');
    }
  };

  const runMigration = async (dryRun: boolean) => {
    if (!user) return;

    setIsMigrating(true);
    setMigrationResult(null);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'migrate-images',
          dryRun
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run migration');
      }

      const result = await response.json();
      setMigrationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run migration');
    } finally {
      setIsMigrating(false);
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-600 mx-auto mb-4"></div>
          <p className="text-stone-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Admin Access</h1>
            <p className="text-stone-600">Please sign in with admin credentials</p>
          </div>
          <Auth />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Admin Dashboard</h1>
          <p className="text-stone-600">Signed in as: {user.email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {adminData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-2xl font-bold text-stone-900">{adminData.totalUsers}</div>
              <div className="text-sm text-stone-500">Total Users</div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-2xl font-bold text-stone-900">{adminData.totalImages}</div>
              <div className="text-sm text-stone-500">Images Generated</div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-2xl font-bold text-stone-900">{adminData.totalCredits}</div>
              <div className="text-sm text-stone-500">Total Credits</div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-2xl font-bold text-stone-900">{adminData.totalCreditsUsed}</div>
              <div className="text-sm text-stone-500">Credits Used</div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        {/* Image Migration Tool */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Image Format Migration</h2>
          <p className="text-sm text-stone-600 mb-4">
            Fix images that were saved with incorrect file extensions. This detects the actual format and renames files accordingly.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => runMigration(true)}
              disabled={isMigrating}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isMigrating ? 'Running...' : 'Preview (Dry Run)'}
            </button>
            <button
              onClick={() => runMigration(false)}
              disabled={isMigrating}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isMigrating ? 'Running...' : 'Run Migration'}
            </button>
          </div>

          {migrationResult && (
            <div className={`p-4 rounded-lg ${migrationResult.dryRun ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="font-medium mb-2">
                {migrationResult.dryRun ? 'Dry Run Results (no changes made)' : 'Migration Complete'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-3">
                <div>
                  <span className="text-stone-500">Total:</span>{' '}
                  <span className="font-medium">{migrationResult.summary.total}</span>
                </div>
                <div>
                  <span className="text-stone-500">To Fix:</span>{' '}
                  <span className="font-medium text-amber-600">{migrationResult.summary.fixed}</span>
                </div>
                <div>
                  <span className="text-stone-500">Already OK:</span>{' '}
                  <span className="font-medium text-green-600">{migrationResult.summary.alreadyCorrect}</span>
                </div>
                <div>
                  <span className="text-stone-500">Skipped:</span>{' '}
                  <span className="font-medium">{migrationResult.summary.skipped}</span>
                </div>
                <div>
                  <span className="text-stone-500">Errors:</span>{' '}
                  <span className="font-medium text-red-600">{migrationResult.summary.errors}</span>
                </div>
              </div>
              {migrationResult.details.length > 0 && (
                <div>
                  <div className="text-sm text-stone-500 mb-1">Changes:</div>
                  <div className="max-h-40 overflow-y-auto text-xs font-mono bg-white/50 rounded p-2">
                    {migrationResult.details.map((detail, i) => (
                      <div key={i}>{detail}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Users Table */}
        {adminData && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200">
              <h2 className="text-lg font-semibold text-stone-900">User Management</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Credits</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Used</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Images</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {adminData.users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-stone-50">
                      <td className="px-5 py-4 text-sm text-stone-900">{userData.email}</td>
                      <td className="px-5 py-4 text-sm">
                        {editingUserId === userData.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newCredits}
                              onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-stone-300 rounded text-stone-900 text-sm"
                            />
                            <button
                              onClick={() => updateUserCredits(userData.id, newCredits)}
                              className="px-2 py-1 bg-sage-500 hover:bg-sage-600 text-white text-xs rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            userData.credits > 5
                              ? 'bg-sage-100 text-sage-600'
                              : userData.credits > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {userData.credits}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600">{userData.creditsUsed || 0}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{userData.imageCount}</td>
                      <td className="px-5 py-4 text-sm text-stone-500">{formatDate(userData.createdAt)}</td>
                      <td className="px-5 py-4 text-sm">
                        {editingUserId !== userData.id && (
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => startEditing(userData.id, userData.credits)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => updateUserCredits(userData.id, userData.credits + 50)}
                              className="px-2 py-1 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs rounded transition-colors"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => updateUserCredits(userData.id, userData.credits + 100)}
                              className="px-2 py-1 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs rounded transition-colors"
                            >
                              +100
                            </button>
                            <button
                              onClick={() => updateUserCredits(userData.id, userData.credits + 500)}
                              className="px-2 py-1 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs rounded transition-colors"
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
            <h3 className="text-lg font-semibold text-stone-900 mb-2">No Users Yet</h3>
            <p className="text-stone-600">Users will appear here once they start signing up</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
