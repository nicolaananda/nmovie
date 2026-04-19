import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { Check, Trash2, Loader2, Shield } from 'lucide-react';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = id ? parseInt(id) : NaN;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUserDetails(userId);
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch user details', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'APPROVED' | 'REJECTED', durationMonths?: number) => {
    if (!userId) return;
    setUpdating(true);
    try {
      await adminService.updateUserStatus(userId, status, durationMonths);
      fetchUserDetails();
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdating(false);
    }
  };

  const updateRole = async (role: string) => {
    if (!userId) return;
    try {
      await adminService.updateUserRole(userId, role);
      fetchUserDetails();
    } catch (e) {
      console.error('Failed to update role', e);
    }
  };


  const deleteUser = async () => {
    if (!userId) return;
    if (!confirm('Delete this user?')) return;
    try {
      await adminService.deleteUser(userId);
      navigate('/admin');
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" size={48} /> Loading user details...
      </div>
    );
  }

  if (!user) {
    return <div className="text-white">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 px-4 md:px-8 pb-20 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="p-6 bg-white/5 rounded-xl shadow-md">
          <div className="flex items-center gap-4">
            <Shield size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold">User Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Name</div>
              <div className="text-lg font-semibold">{user.name}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Email</div>
              <div className="text-lg">{user.email}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Role</div>
              <select
                value={user.role}
                onChange={(e) => updateRole(e.target.value)}
                className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white mt-2"
              >
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Status</div>
              <div className="text-lg font-semibold">{user.status}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">Watch history (recent 20)</h3>
            <div className="overflow-x-auto" style={{ maxHeight: 240 }}>
              <table className="w-full text-sm text-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left">Content</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Progress</th>
                    <th className="px-2 py-2">Last Watched</th>
                  </tr>
                </thead>
                <tbody>
                  {user.watchHistory?.slice(0, 20).map((w: any) => (
                    <tr key={w.id}>
                      <td className="px-2 py-2">{w.name}</td>
                      <td className="px-2 py-2">{w.type}</td>
                      <td className="px-2 py-2">{w.progress}%</td>
                      <td className="px-2 py-2">{new Date(w.lastWatchedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">Activity</h3>
            <div className="space-y-2 h-48 overflow-auto pr-2">
              {user.activityLogs?.slice(0, 20).map((a: any) => (
                <div key={a.id} className="text-sm text-gray-300">{a.type}: {a.description} at {new Date(a.createdAt).toLocaleString()} from {a.ip || 'unknown'}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-green-500/10 text-green-400 border border-green-500/20" onClick={() => updateStatus('APPROVED', 1)} disabled={updating}>
            <Check size={16} /> Approve
          </button>
          <button className="px-4 py-2 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" onClick={() => updateStatus('APPROVED')} disabled={updating}>
            <Check size={16} /> Extend
          </button>
          <button className="px-4 py-2 rounded bg-red-500/10 text-red-400 border border-red-500/20" onClick={deleteUser} disabled={updating}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
