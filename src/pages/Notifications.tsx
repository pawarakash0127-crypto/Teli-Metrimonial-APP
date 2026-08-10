import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, onSnapshot } from '../lib/firebase';
import { InterestNotification, respondToInterest, withdrawInterest, markInterestAsRead, markRequesterNotified } from '../lib/interests';
import { Bell, Heart, Check, X, User, ArrowRight, ShieldCheck, Clock, Sparkles, PartyPopper } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [receivedInterests, setReceivedInterests] = useState<InterestNotification[]>([]);
  const [sentInterests, setSentInterests] = useState<InterestNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!user) return;

    // Listen to Received Interests
    const qReceived = query(collection(db, 'interests'), where('toUid', '==', user.uid));
    const unsubReceived = onSnapshot(qReceived, (snapshot) => {
      const docs: InterestNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as InterestNotification;
        docs.push(data);
        // Automatically mark as read when user views page
        if (!data.read) {
          markInterestAsRead(data.id);
        }
      });
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReceivedInterests(docs);
      setLoading(false);
    }, (error) => {
      console.warn("Received interests listener error:", error.message);
      setLoading(false);
    });

    // Listen to Sent Interests
    const qSent = query(collection(db, 'interests'), where('fromUid', '==', user.uid));
    const unsubSent = onSnapshot(qSent, (snapshot) => {
      const docs: InterestNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as InterestNotification;
        docs.push(data);
        if (data.status === 'accepted' && data.requesterNotified === false) {
          markRequesterNotified(data.id);
        }
      });
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSentInterests(docs);
    }, (error) => {
      console.warn("Sent interests listener error:", error.message);
    });

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [user, authLoading, navigate]);

  const handleResponse = async (interestId: string, status: 'accepted' | 'declined') => {
    try {
      await respondToInterest(interestId, status);
    } catch (error) {
      console.error('Error responding to interest:', error);
    }
  };

  const handleWithdraw = async (fromUid: string, toUid: string) => {
    try {
      await withdrawInterest(fromUid, toUid);
    } catch (error) {
      console.error('Error withdrawing interest:', error);
    }
  };

  const unreadCount = receivedInterests.filter(i => !i.read || i.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-saffron" />
            Interests & Notifications
          </h1>
          <p className="text-stone-500 text-sm mt-1">Manage profile interests and match requests</p>
        </div>

        <div className="flex bg-stone-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'received' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Received
            {unreadCount > 0 && (
              <span className="bg-saffron text-white px-2 py-0.5 rounded-full text-xs font-black">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sent' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sent ({sentInterests.length})
          </button>
        </div>
      </div>

      {/* Prominent Accepted Interest Notifications Banner */}
      {sentInterests.filter(i => i.status === 'accepted').length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
            <PartyPopper className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif">Accepted Interest Alerts!</h2>
                <p className="text-emerald-100 text-xs">Members who accepted your request and want to connect</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {sentInterests.filter(i => i.status === 'accepted').map((item) => (
                <div key={item.id} className="bg-white text-stone-900 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-emerald-200">
                      {item.toPhotoUrl ? (
                        <img src={item.toPhotoUrl} alt={item.toName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-base">{item.toName}</h4>
                      <p className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Accepted your interest!
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/profile/${item.toUid}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1"
                  >
                    View Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedInterests.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-stone-200 shadow-sm">
              <Heart className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Received Interests Yet</h3>
              <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
                When other members express interest in your profile, their requests will appear here. Keep your profile updated to get more responses!
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 bg-saffron text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-orange-600 transition-all"
              >
                Browse Profiles
              </Link>
            </div>
          ) : (
            receivedInterests.map((interest) => (
              <div
                key={interest.id}
                className="bg-white p-6 rounded-3xl border-2 border-stone-100 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 border-2 border-saffron/20 shadow-sm">
                    {interest.fromPhotoUrl ? (
                      <img src={interest.fromPhotoUrl} alt={interest.fromName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-serif font-bold text-stone-900">{interest.fromName}</h3>
                      {interest.status === 'accepted' && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          Accepted
                        </span>
                      )}
                      {interest.status === 'declined' && (
                        <span className="bg-stone-100 text-stone-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          Declined
                        </span>
                      )}
                      {interest.status === 'pending' && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          New Request
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 text-sm mt-0.5">
                      {interest.fromAge ? `${interest.fromAge} yrs` : ''} {interest.fromProfession ? `• ${interest.fromProfession}` : ''} {interest.fromLocation ? `• ${interest.fromLocation}` : ''}
                    </p>
                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(interest.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <Link
                    to={`/profile/${interest.fromUid}`}
                    className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    View Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {interest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResponse(interest.id, 'accepted')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleResponse(interest.id, 'declined')}
                        className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}

                  {interest.status === 'accepted' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> You accepted interest
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentInterests.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-stone-200 shadow-sm">
              <Heart className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Sent Interests</h3>
              <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
                You haven't expressed interest in any profiles yet. Browse member profiles and click "Express Interest" to connect!
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 bg-saffron text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-orange-600 transition-all"
              >
                Find Matches
              </Link>
            </div>
          ) : (
            sentInterests.map((interest) => (
              <div
                key={interest.id}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">{interest.toName}</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Sent on {new Date(interest.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      interest.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : interest.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {interest.status === 'accepted' ? 'Accepted 💕' : interest.status === 'declined' ? 'Declined' : 'Pending Response'}
                  </span>

                  <Link
                    to={`/profile/${interest.toUid}`}
                    className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-bold transition-all"
                  >
                    View Profile
                  </Link>

                  {interest.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(interest.fromUid, interest.toUid)}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
