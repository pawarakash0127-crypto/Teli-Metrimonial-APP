import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogIn, LogOut, Shield, Globe, Bell, Sparkles, Menu, X, Home, Info, HelpCircle, PhoneCall, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut, auth, db, collection, query, where, onSnapshot } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/LOGO.jpg';

export default function Navbar() {
  const { user, profile, userProfile, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

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
    setMobileMenuOpen(false);
    await signOut(auth);
    navigate('/');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const userName = userProfile?.firstName 
    ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
    : user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <nav ref={menuRef} className="bg-white shadow-md sticky top-0 z-50 border-t-4 border-saffron">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand logo & name */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
            <div className="relative group-hover:scale-105 transition-transform shrink-0">
              <img 
                src={logoImg} 
                alt="राष्ट्रीय तेली समाज" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="%23e05600"><circle cx="24" cy="24" r="22" fill="%23fff" stroke="%23e05600" stroke-width="4"/><text x="50%" y="55%" font-size="20" font-weight="bold" fill="%23e05600" text-anchor="middle" dominant-baseline="middle">त</text></svg>';
                }}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-amber-400 shadow-md bg-stone-100" 
              />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-serif font-bold text-base sm:text-xl text-stone-900 leading-tight truncate">
                तेली समाज नाशिक 
              </span>
              <span className="text-[9px] sm:text-xs text-saffron font-bold tracking-wider uppercase mt-0.5 truncate">
                स्नेह बंधन विवाह मंडळ
              </span>
            </div>
          </Link>

          {/* DESKTOP Navigation Items (Visible on md and larger screens) */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher Button */}
            <div className="relative group">
              <button
                onClick={toggleLanguage}
                className="p-2.5 sm:p-3 rounded-2xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200/80 shadow-xs active:scale-95 flex items-center justify-center relative"
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
                    className="p-2.5 sm:p-3 rounded-2xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200/80 shadow-xs active:scale-95 flex items-center justify-center"
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
                    className="p-2.5 sm:p-3 rounded-2xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200/80 shadow-xs active:scale-95 flex items-center justify-center relative"
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

                {/* Subscription / Membership Button */}
                {profile?.role !== 'admin' && (
                  <div className="relative group">
                    <Link
                      to="/subscription"
                      className="p-2.5 sm:p-3 rounded-2xl text-amber-600 hover:text-saffron bg-amber-50/80 hover:bg-amber-100 transition-all border border-amber-200 shadow-xs active:scale-95 flex items-center justify-center"
                      aria-label="Membership Plan"
                    >
                      <Sparkles className="h-5 w-5 fill-amber-400 text-amber-600" />
                    </Link>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="w-2 h-2 bg-stone-900 rotate-45 -mb-1"></div>
                      <span className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        Membership Plan (₹799/Yr)
                      </span>
                    </div>
                  </div>
                )}

                {/* Profile Button (only for regular users) */}
                {profile?.role !== 'admin' && (
                  <div className="relative group">
                    <Link
                      to="/profile"
                      className={`p-2.5 sm:p-3 rounded-2xl transition-all border shadow-xs active:scale-95 flex items-center justify-center relative ${
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
                      className="p-2.5 sm:p-3 rounded-2xl text-saffron bg-orange-50 hover:bg-saffron hover:text-white transition-all border border-saffron/30 shadow-xs active:scale-95 flex items-center justify-center"
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
                    className="p-2.5 sm:p-3 rounded-2xl text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all border border-stone-200/80 shadow-xs active:scale-95 flex items-center justify-center"
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
                <span className="hidden lg:inline text-xs font-medium text-stone-600">
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

          {/* MOBILE Header Controls (Visible only on < md screens) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Language Button */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl text-stone-600 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200 shadow-2xs flex items-center gap-1"
              aria-label={t('nav.language')}
            >
              <Globe className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase text-saffron">
                {i18n.language === 'en' ? 'MR' : 'EN'}
              </span>
            </button>

            {/* Mobile 3-line Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-stone-700 hover:text-saffron hover:bg-orange-50 transition-all border border-stone-200 shadow-2xs relative flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-stone-900" />
              ) : (
                <Menu className="h-6 w-6 text-stone-900" />
              )}
              {/* Unread notification indicator on burger icon */}
              {user && unreadNotifications > 0 && !mobileMenuOpen && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE COLLAPSIBLE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-200/80 shadow-2xl px-4 py-5 space-y-4 animate-in slide-in-from-top-3 duration-200">
          {user ? (
            /* Logged-In Mobile Menu */
            <div className="space-y-3">
              {/* User Identity Card */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-saffron/10 text-saffron flex items-center justify-center font-bold text-base border border-saffron/20">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-900 leading-tight">
                      {userName}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">
                      {profile?.role === 'admin' ? 'Community Administrator' : (userProfile?.vaduVarNumber || 'Member Profile')}
                    </div>
                  </div>
                </div>

                {profile?.role !== 'admin' && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isProfileComplete 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isProfileComplete ? 'Complete' : 'Pending Action'}
                  </span>
                )}
              </div>

              {/* Navigation Actions List */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {/* Search Profiles */}
                <Link
                  to="/search"
                  state={{ showMatchesPointer: true }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 text-stone-800 hover:text-saffron transition-colors border border-transparent hover:border-orange-200"
                >
                  <div className="flex items-center gap-3 font-semibold text-sm">
                    <div className="p-2 bg-orange-50 text-saffron rounded-lg">
                      <Search className="w-4 h-4" />
                    </div>
                    <span>{t('nav.search')} & Matches</span>
                  </div>
                </Link>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 text-stone-800 hover:text-saffron transition-colors border border-transparent hover:border-orange-200"
                >
                  <div className="flex items-center gap-3 font-semibold text-sm">
                    <div className="p-2 bg-orange-50 text-saffron rounded-lg">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span>{t('nav.notifications')}</span>
                  </div>
                  {unreadNotifications > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {unreadNotifications} new
                    </span>
                  )}
                </Link>

                {/* Subscription / Membership */}
                {profile?.role !== 'admin' && (
                  <Link
                    to="/subscription"
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 hover:bg-amber-100 text-amber-900 transition-colors border border-amber-200"
                  >
                    <div className="flex items-center gap-3 font-semibold text-sm">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                        <Sparkles className="w-4 h-4 fill-amber-400" />
                      </div>
                      <span>Membership Plan</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-md">
                      ₹799/Yr
                    </span>
                  </Link>
                )}

                {/* Profile Link */}
                {profile?.role !== 'admin' && (
                  <Link
                    to="/profile"
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors border ${
                      !isProfileComplete 
                        ? 'bg-orange-50/80 border-saffron/40 text-saffron' 
                        : 'hover:bg-orange-50 text-stone-800 hover:text-saffron border-transparent hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 font-semibold text-sm">
                      <div className={`p-2 rounded-lg ${!isProfileComplete ? 'bg-saffron text-white' : 'bg-orange-50 text-saffron'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span>{t('nav.profile')}</span>
                    </div>
                    {!isProfileComplete && (
                      <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Action Required</span>
                      </span>
                    )}
                  </Link>
                )}

                {/* Admin Dashboard */}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-between p-3 rounded-xl bg-orange-50/70 hover:bg-orange-100 text-saffron font-bold text-sm transition-colors border border-saffron/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-saffron text-white rounded-lg">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span>{t('nav.admin')} Dashboard</span>
                    </div>
                  </Link>
                )}

                {/* Common Informational Links */}
                <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-1 text-xs text-stone-600">
                  <Link to="/about" className="p-2 hover:text-saffron flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5" />
                    <span>About Us</span>
                  </Link>
                  <Link to="/faq" className="p-2 hover:text-saffron flex items-center gap-1.5 font-medium">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>FAQs & Help</span>
                  </Link>
                  <Link to="/contact" className="p-2 hover:text-saffron flex items-center gap-1.5 font-medium col-span-2">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Contact Us & Feedback</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-colors border border-red-200 shadow-2xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged-Out Mobile Menu */
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-saffron text-white font-bold rounded-xl text-sm shadow-md shadow-saffron/20 hover:bg-orange-600 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>LOGIN TO ACCOUNT</span>
                </Link>

                <Link
                  to="/register"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>CREATE FREE PROFILE</span>
                </Link>
              </div>

              {/* Informational Links */}
              <div className="pt-3 border-t border-stone-100 space-y-1">
                <Link
                  to="/"
                  className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-stone-700 hover:bg-stone-50 font-medium"
                >
                  <Home className="w-4 h-4 text-stone-400" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/about"
                  className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-stone-700 hover:bg-stone-50 font-medium"
                >
                  <Info className="w-4 h-4 text-stone-400" />
                  <span>About Us</span>
                </Link>
                <Link
                  to="/faq"
                  className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-stone-700 hover:bg-stone-50 font-medium"
                >
                  <HelpCircle className="w-4 h-4 text-stone-400" />
                  <span>FAQs & Help</span>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-stone-700 hover:bg-stone-50 font-medium"
                >
                  <PhoneCall className="w-4 h-4 text-stone-400" />
                  <span>Contact Us & Feedback</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

