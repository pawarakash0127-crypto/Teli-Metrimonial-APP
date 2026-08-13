import React, { useState } from 'react';
import { db, doc, updateDoc, setDoc, collection, query, where, getDocs, auth } from '../lib/firebase';
import { updateEmail } from 'firebase/auth';
import { Mail, CheckCircle, X, AlertCircle } from 'lucide-react';
import { triggerWelcomeEmail } from '../lib/welcomeEmail';

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEmail: string) => void;
  currentUid: string;
  userName?: string;
}

export default function AddEmailModal({ isOpen, onClose, onSuccess, currentUid, userName }: AddEmailModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    try {
      setLoading(true);

      // 1. Check if email already exists in users or profiles collection
      const qUser = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        const existingUid = snapUser.docs[0].id;
        if (existingUid !== currentUid) {
          setError('This email address is already associated with another account. Please use a different email.');
          setLoading(false);
          return;
        }
      }

      const qProfile = query(collection(db, 'profiles'), where('email', '==', cleanEmail));
      const snapProfile = await getDocs(qProfile);
      if (!snapProfile.empty) {
        const existingUid = snapProfile.docs[0].id;
        if (existingUid !== currentUid) {
          setError('This email address is already associated with another matrimonial profile.');
          setLoading(false);
          return;
        }
      }

      // 2. Try to update Auth currentUser email if supported
      if (auth.currentUser && !auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, cleanEmail);
        } catch (authErr: any) {
          console.warn("Notice updating Firebase Auth user email:", authErr?.message || authErr);
          // Proceed with updating Firestore profile & user doc so the profile retains the email
        }
      }

      // 3. Update Firestore profile & user document
      const profileRef = doc(db, 'profiles', currentUid);
      const userRef = doc(db, 'users', currentUid);

      await setDoc(profileRef, {
        email: cleanEmail,
        isEmailVerified: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await setDoc(userRef, {
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 4. Optionally trigger welcome email
      triggerWelcomeEmail({
        uid: currentUid,
        email: cleanEmail,
        userName: userName || 'Member'
      }).catch(err => console.warn("Welcome email notification trigger warning:", err));

      onSuccess(cleanEmail);
      onClose();
      setEmailInput('');
    } catch (err: any) {
      console.error("Error adding email to profile:", err);
      setError(err.message || 'Failed to add email address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border-2 border-saffron/20 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3.5 bg-saffron/10 text-saffron rounded-2xl shrink-0">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-serif font-bold text-stone-900">Add Email Address</h3>
            <p className="text-xs text-stone-500 mt-0.5">Link an email to receive profile matches & updates</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddEmail} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full border-stone-200 rounded-xl shadow-xs focus:border-saffron focus:ring-saffron p-3.5 border transition-all text-sm font-medium"
            />
            <p className="text-2xs text-stone-500 mt-1.5 ml-1">
              Your profile ID and existing profile data will remain unchanged.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-saffron hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-saffron/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
