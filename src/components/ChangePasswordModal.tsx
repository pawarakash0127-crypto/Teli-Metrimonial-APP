import React, { useState } from 'react';
import { auth, updatePassword } from '../lib/firebase';
import { KeyRound, Check, X, ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!auth.currentUser) {
      setStatus({ type: 'error', text: 'You must be logged in to change your password.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setStatus({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setStatus({ type: '', text: '' });
      }, 1500);
    } catch (err: any) {
      console.error("Error updating password:", err);
      if (err.code === 'auth/requires-recent-login') {
        setStatus({ type: 'error', text: 'Security requirement: Please log out and log back in before updating your password.' });
      } else {
        setStatus({ type: 'error', text: err.message || 'Failed to update password. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-saffron/20 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-saffron/10 rounded-2xl text-saffron">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900">Account Settings</h3>
            <p className="text-stone-500 text-xs">Update profile password</p>
          </div>
        </div>

        {status.text && (
          <div
            className={`p-4 rounded-2xl mb-6 text-sm flex items-center gap-2.5 font-bold ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border text-stone-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border text-stone-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-500 italic bg-amber-50 p-3 rounded-xl border border-amber-200/60">
            Note: No old password is required to change password. Make sure to remember your new password for logging in next time.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-saffron hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-saffron/20 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
