import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { User, Lock, Shield, Loader2, Check, X } from 'lucide-react';

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const daysRemaining = user?.subscriptionEndsAt
        ? Math.ceil((new Date(user.subscriptionEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(name);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);

        try {
            await userService.changePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] pt-24 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            message.type === 'success'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                    >
                        {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Subscription Status */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-primary-500" size={24} />
                        <h2 className="text-xl font-semibold text-white">Subscription Status</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Status</span>
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    user?.status === 'APPROVED'
                                        ? 'bg-green-500/20 text-green-400'
                                        : user?.status === 'PENDING'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}
                            >
                                {user?.status}
                            </span>
                        </div>

                        {user?.subscriptionEndsAt && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Expires On</span>
                                    <span className="text-white">
                                        {new Date(user.subscriptionEndsAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Days Remaining</span>
                                    <span
                                        className={`font-semibold ${
                                            daysRemaining > 7 ? 'text-green-400' : 'text-red-400'
                                        }`}
                                    >
                                        {daysRemaining} days
                                    </span>
                                </div>

                                {daysRemaining <= 7 && daysRemaining > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-yellow-400 text-sm">
                                            ⚠️ Your subscription is expiring soon. Please contact admin to renew.
                                        </p>
                                    </div>
                                )}

                                {daysRemaining <= 0 && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                        <p className="text-red-400 text-sm">
                                            ❌ Your subscription has expired. Please contact admin to renew.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="text-primary-500" size={24} />
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                            <input
                                type="text"
                                value={user?.role || ''}
                                disabled
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            Update Profile
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="text-primary-500" size={24} />
                        <h2 className="text-xl font-semibold text-white">Change Password</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary-500 outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            Change Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
