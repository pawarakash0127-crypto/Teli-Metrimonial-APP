import React, { useState, useEffect } from 'react';
import { db, doc, updateDoc } from '../lib/firebase';
import { Mail, Lock, Phone, User, ShieldCheck, X, Check, RefreshCw } from 'lucide-react';
import FloatingToast, { ToastMessage } from './FloatingToast';

interface AdminUpdateUserCredentialsModalProps {
  isOpen: boolean;
  userProfile: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminUpdateUserCredentialsModal({
  isOpen,
  userProfile,
  onClose,
  onSuccess
}: AdminUpdateUserCredentialsModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [status, setStatus] = useState('approved');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (userProfile) {
      setEmail(userProfile.email || '');
      setPassword(userProfile.password || 'Password123!');
      setContactNumber(userProfile.contactNumber || '');
      setStatus(userProfile.status || 'approved');
    }
  }, [userProfile]);

  if (!isOpen || !userProfile) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setToast({ type: 'error', text: 'Email address cannot be empty.' });
      return;
    }

    setLoading(true);
    try {
      const uid = userProfile.uid;
      const cleanEmail = email.trim().toLowerCase();

      // Update Firestore Profile document
      await updateDoc(doc(db, 'profiles', uid), {
        email: cleanEmail,
        password: password,
        contactNumber: contactNumber,
        status: status,
        updatedAt: new Date().toISOString()
      }).catch(() => {});

      // Update Firestore User document
      await updateDoc(doc(db, 'users', uid), {
        email: cleanEmail,
        password: password,
        updatedAt: new Date().toISOString()
      }).catch(() => {});

      setToast({
        type: 'success',
        text: `Updated email & password credentials for ${userProfile.firstName} ${userProfile.lastName}`
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error updating credentials:", err);
      setToast({ type: 'error', text: 'Failed to update credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <FloatingToast message={toast} onClose={() => setToast(null)} />

      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden border-2 border-saffron/20">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-saffron via-gold to-saffron"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-saffron/10 text-saffron rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Update User Credentials</h2>
            <p className="text-stone-500 text-xs">
              Admin Access: Modify login email & password for <span className="font-bold text-stone-800">{userProfile.firstName} {userProfile.lastName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-1 mb-4">
            <p className="text-stone-500"><span className="font-bold text-stone-700">User ID:</span> {userProfile.uid}</p>
            <p className="text-stone-500"><span className="font-bold text-stone-700">Full Name:</span> {userProfile.firstName} {userProfile.lastName}</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-saffron" /> Login Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 border border-stone-200 rounded-xl focus:border-saffron focus:ring-saffron font-medium text-stone-900"
              placeholder="user@telisamaj.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-saffron" /> Account Password
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 border border-stone-200 rounded-xl focus:border-saffron focus:ring-saffron font-mono font-bold text-stone-900"
              placeholder="Password123!"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-saffron" /> Contact Phone Number
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-3.5 border border-stone-200 rounded-xl focus:border-saffron focus:ring-saffron font-medium text-stone-900"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 ml-1">
              Account Approval Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3.5 border border-stone-200 rounded-xl focus:border-saffron focus:ring-saffron font-bold text-stone-900"
            >
              <option value="approved">Approved (Visible in Search)</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 text-stone-700 py-3.5 rounded-xl font-bold hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-saffron text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
