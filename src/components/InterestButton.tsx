import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, onSnapshot, getDoc } from '../lib/firebase';
import { sendInterest, withdrawInterest } from '../lib/interests';
import { isOppositeGender } from '../lib/genderUtils';
import { Heart, Check, Sparkles, UserCheck, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InterestButtonProps {
  targetProfile: any;
  variant?: 'primary' | 'compact' | 'outline';
}

export default function InterestButton({ targetProfile, variant = 'primary' }: InterestButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myInterest, setMyInterest] = useState<any>(null);
  const [theirInterest, setTheirInterest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user || !targetProfile?.uid) return;

    // Fetch my profile for details
    getDoc(doc(db, 'profiles', user.uid)).then(snap => {
      if (snap.exists()) {
        setMyProfile(snap.data());
      }
    });

    // Listen to interest sent by me
    const sentDocId = `${user.uid}_${targetProfile.uid}`;
    const unsubSent = onSnapshot(doc(db, 'interests', sentDocId), (docSnap) => {
      if (docSnap.exists()) {
        setMyInterest(docSnap.data());
      } else {
        setMyInterest(null);
      }
    }, (err) => {
      console.log("Sent interest listener info:", err.message);
    });

    // Listen to interest sent to me by target
    const receivedDocId = `${targetProfile.uid}_${user.uid}`;
    const unsubReceived = onSnapshot(doc(db, 'interests', receivedDocId), (docSnap) => {
      if (docSnap.exists()) {
        setTheirInterest(docSnap.data());
      } else {
        setTheirInterest(null);
      }
    }, (err) => {
      console.log("Received interest listener info:", err.message);
    });

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [user, targetProfile?.uid]);

  // If viewing own profile, return null
  if (user && targetProfile?.uid === user.uid) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      navigate('/login');
      return;
    }

    // Gender check: Male can only express interest in Female, and Female in Male
    if (myProfile?.gender && targetProfile?.gender) {
      if (!isOppositeGender(myProfile.gender, targetProfile.gender)) {
        const errStr = "Interest can only be expressed between opposite genders (Male to Female or Female to Male).";
        setErrorMessage(errStr);
        alert(errStr);
        return;
      }
    }

    setLoading(true);
    try {
      if (myInterest) {
        // Withdraw interest if already sent
        await withdrawInterest(user.uid, targetProfile.uid);
      } else {
        // Send interest
        await sendInterest(user.uid, myProfile, targetProfile);
      }
    } catch (error) {
      console.error('Error handling interest:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status renderings
  if (theirInterest) {
    if (theirInterest.status === 'pending') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/notifications');
          }}
          className={`flex items-center gap-2 bg-gradient-to-r from-amber-500 to-saffron text-white font-bold rounded-xl shadow-md hover:brightness-105 transition-all ${
            variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'
          }`}
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          Received Interest! (View)
        </button>
      );
    }
    if (theirInterest.status === 'accepted') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 ${
            variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          Connected 💕
        </span>
      );
    }
  }

  if (myInterest) {
    if (myInterest.status === 'accepted') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 ${
            variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <Check className="w-4 h-4 text-emerald-600" />
          Interest Accepted!
        </span>
      );
    }

    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title="Click to withdraw interest"
        className={`flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-xl hover:bg-emerald-100 transition-all ${
          variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'
        }`}
      >
        <Clock className="w-4 h-4 text-emerald-600" />
        {loading ? 'Updating...' : 'Interest Expressed ✓'}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 bg-saffron text-white font-bold px-3 py-1.5 rounded-xl hover:bg-orange-600 transition-all text-xs shadow-sm"
      >
        <Heart className="w-3.5 h-3.5 fill-current" />
        {loading ? '...' : 'Send Interest'}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 border-2 border-saffron text-saffron font-bold px-5 py-2.5 rounded-xl hover:bg-saffron hover:text-white transition-all text-sm shadow-sm"
      >
        <Heart className="w-4 h-4 fill-current" />
        {loading ? 'Sending...' : 'Express Interest'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 bg-gradient-to-r from-saffron to-orange-600 text-white font-bold px-6 py-3 rounded-2xl hover:brightness-105 transition-all text-sm shadow-lg shadow-saffron/20 active:scale-95"
    >
      <Heart className="w-4 h-4 fill-current text-white animate-pulse" />
      {loading ? 'Sending...' : 'Express Interest'}
    </button>
  );
}
