import { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '../types/auth'; // Ensure this type is exported from types/auth
import { Check, X, Trash2, Loader2, Shield } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get<User[]>('/admin/users');
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED', durationMonths?: number) => {
        setActionLoading(id);
        try {
            await axios.put(`/admin/users/${id}/status`, { status, durationMonths });
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setActionLoading(id);
        try {
            await axios.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            console.error('Failed to delete user', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDateUpdate = async (id: number, dateStr: string) => {
        if (!dateStr) return;
        setActionLoading(id);
        try {
            await axios.put(`/admin/users/${id}/status`, { status: 'APPROVED', subscriptionEndsAt: dateStr });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update date', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] pt-24 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Shield size={32} className="text-primary-500" />
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-xs uppercase font-medium text-gray-200">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Subscription</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white text-base">{user.name}</span>
                                                <span className="text-xs">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700/50 text-gray-300'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                                user.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'APPROVED' ? 'bg-green-400' :
                                                    user.status === 'REJECTED' ? 'bg-red-400' :
                                                        'bg-yellow-400'
                                                    }`}></span>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.status === 'APPROVED' ? (
                                                <input
                                                    type="date"
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-primary-500 outline-none"
                                                    value={user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleDateUpdate(user.id, e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {actionLoading === user.id ? (
                                                    <Loader2 className="animate-spin text-gray-400" size={18} />
                                                ) : (
                                                    <>
                                                        {user.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(user.id, 'APPROVED', 1)}
                                                                    title="Approve for 1 Month"
                                                                    className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/20"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(user.id, 'REJECTED')}
                                                                    title="Reject"
                                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            title="Delete User"
                                                            className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
