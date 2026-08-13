import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, LogOut, Shield, Globe, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut, auth, db, collection, query, where, onSnapshot } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/LOGO.jpg';

export default function Navbar() {
  const { user, profile, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    let receivedUnreadCount = 0;
    let sentUnreadCount = 0;

    const updateCombinedCount = () => {
      setUnreadNotifications(receivedUnreadCount + sentUnreadCount);
    };

    // Received interests listener
    const qReceived = query(collection(db, 'interests'), where('toUid', '==', user.uid));
    const unsubReceived = onSnapshot(qReceived, (snapshot) => {
      let count = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.read || data.status === 'pending') {
          count++;
        }
      });
      receivedUnreadCount = count;
      updateCombinedCount();
    }, (error) => {
      console.error("Error listening to received interests:", error);
    });

    // Sent interests listener (accepted requests alert)
    const qSent = query(collection(db, 'interests'), where('fromUid', '==', user.uid));
    const unsubSent = onSnapshot(qSent, (snapshot) => {
      let count = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'accepted' && data.requesterNotified === false) {
          count++;
        }
      });
      sentUnreadCount = count;
      updateCombinedCount();
    }, (error) => {
      console.error("Error listening to sent interests:", error);
    });

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-t-4 border-saffron">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand logo & name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative group-hover:scale-105 transition-transform">
              <img 
                src={logoImg} 
                alt="राष्ट्रीय तेली समाज" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="%23e05600"><circle cx="24" cy="24" r="22" fill="%23fff" stroke="%23e05600" stroke-width="4"/><text x="50%" y="55%" font-size="20" font-weight="bold" fill="%23e05600" text-anchor="middle" dominant-baseline="middle">त</text></svg>';
                }}
                className="h-12 w-12 rounded-full object-cover border-2 border-amber-400 shadow-md bg-stone-100" 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg sm:text-xl text-stone-900 leading-none">
                तेली समाज नाशिक 
              </span>
              <span className="text-[10px] sm:text-xs text-saffron font-bold tracking-widest uppercase mt-1">
                स्नेह बंधन विवाह मंडळ
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher Button */}
            <div className="relative group">
              <button
                onClick={toggleLanguage}
                className="p-2.5 sm:p-3 rounded-2xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200/80 shadow-sm active:scale-95 flex items-center justify-center relative"
                aria-label={t('nav.language')}
              >
                <Globe className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-saffron text-white text-[9px] font-black px-1 rounded-md uppercase">
                  {i18n.language === 'en' ? 'मराठी' : 'EN'}
                </span>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1"></div>
                <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  {i18n.language === 'en' ? 'मराठी भाषेत बदला' : 'Switch to English'}
                </span>
              </div>
            </div>

            {user ? (
              <>
                {/* Search Button (Logged-in only) */}
                <div className="relative group">
                  <Link
                    to="/search"
                    state={{ showMatchesPointer: true }}
                    className="p-2.5 sm:p-3 rounded-2xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200/80 shadow-sm active:scale-95 flex items-center justify-center"
                    aria-label={t('nav.search')}
                  >
                    <Search className="h-5 w-5" />
                  </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                    <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1"></div>
                    <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                      {t('nav.search')}
                    </span>
                  </div>
                </div>

                {/* Notifications Button */}
                <div className="relative group">
                  <Link
                    to="/notifications"
                    className="p-2.5 sm:p-3 rounded-2xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200/80 shadow-sm active:scale-95 flex items-center justify-center relative"
                    aria-label={t('nav.notifications')}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md border-2 border-white">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                    <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1"></div>
                    <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                      {t('nav.notifications')}
                    </span>
                  </div>
                </div>

                {/* Profile Button (only for regular users) */}
                {profile?.role !== 'admin' && (
                  <div className="relative group">
                    <Link
                      to="/profile"
                      className={`p-2.5 sm:p-3 rounded-2xl transition-all border shadow-sm active:scale-95 flex items-center justify-center relative ${
                        !isProfileComplete 
                          ? 'text-saffron bg-orange-50 border-saffron/40 ring-2 ring-saffron/20' 
                          : 'text-stone-600 hover:text-saffron hover:bg-orange-50 border-stone-200/80'
                      }`}
                      aria-label={t('nav.profile')}
                    >
                      <User className="h-5 w-5" />
                      {!isProfileComplete && (
                        <span className="absolute -top-1 -right-1 bg-saffron text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-bounce shadow-md">
                          !
                        </span>
                      )}
                    </Link>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1"></div>
                      <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        {!isProfileComplete ? 'Complete Your Profile (Required)' : t('nav.profile')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Admin Button (only if admin) */}
                {profile?.role === 'admin' && (
                  <div className="relative group">
                    <Link
                      to="/admin"
                      className="p-2.5 sm:p-3 rounded-2xl text-saffron bg-orange-50 hover:bg-saffron hover:text-white transition-all border border-saffron/30 shadow-sm active:scale-95 flex items-center justify-center"
                      aria-label={t('nav.admin')}
                    >
                      <Shield className="h-5 w-5" />
                    </Link>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1"></div>
                      <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        {t('nav.admin')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <div className="relative group">
                  <button
                    onClick={handleLogout}
                    className="p-2.5 sm:p-3 rounded-2xl text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all border border-stone-200/80 shadow-sm active:scale-95 flex items-center justify-center"
                    aria-label={t('nav.logout')}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col items-end z-50 pointer-events-none">
                    <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1 mr-3"></div>
                    <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                      {t('nav.logout')}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Logged-out state: "Already a member? LOGIN" button */
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs font-medium text-stone-600">
                  Already a member?
                </span>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-saffron text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-md shadow-saffron/20 active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  <span>LOGIN</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
