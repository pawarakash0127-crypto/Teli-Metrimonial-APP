import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import ProfileDetails from './pages/ProfileDetails';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import FAQ from './pages/FAQ';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import logoImg from './assets/images/LOGO.jpg';
import { subscribeContactSettings, DEFAULT_CONTACT_SETTINGS, ContactUsSettings } from './lib/contactSettings';

/**
 * Route guard that ensures logged in users complete mandatory profile fields
 * before accessing restricted application areas.
 */
function RequireCompleteProfile({ children }: { children: React.ReactNode }) {
  const { user, profile, isProfileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-saffron border-t-transparent"></div>
      </div>
    );
  }

  // If user is logged in, not an admin, and mandatory profile is incomplete -> redirect to profile page
  if (user && profile?.role !== 'admin' && !isProfileComplete) {
    return <Navigate to="/profile" replace state={{ fromIncompleteProfile: true }} />;
  }

  return <>{children}</>;
}

export default function App() {
  const [contactInfo, setContactInfo] = useState<ContactUsSettings>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    const unsubscribe = subscribeContactSettings((settings) => {
      setContactInfo(settings);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route 
                path="/" 
                element={
                  <RequireCompleteProfile>
                    <Home />
                  </RequireCompleteProfile>
                } 
              />
              <Route 
                path="/search" 
                element={
                  <RequireCompleteProfile>
                    <Search />
                  </RequireCompleteProfile>
                } 
              />
              <Route path="/profile" element={<Profile />} />
              <Route 
                path="/profile/:id" 
                element={
                  <RequireCompleteProfile>
                    <ProfileDetails />
                  </RequireCompleteProfile>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <RequireCompleteProfile>
                    <Notifications />
                  </RequireCompleteProfile>
                } 
              />
              <Route path="/admin/edit/:id" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
            </Routes>
          </main>

          {/* Enhanced Footer */}
          <footer className="bg-maroon text-gold/80 py-12 border-t-4 border-gold/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gold/20 text-center md:text-left">
                {/* Brand */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <img 
                      src={logoImg} 
                      alt="नाशिक तेली समाज स्नेह बंधन" 
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-full object-cover border-2 border-amber-400 bg-white p-0.5 shadow-md shrink-0"
                    />
                    <div className="font-serif font-bold text-2xl text-gold">
                      नाशिक तेली समाज
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-xs mx-auto md:mx-0">
                    नाशिक जिल्हा तेली समाज संचलित स्नेह बंधन विवाह मंडळ. 100% Verified profiles for our community.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="space-y-3">
                  <h4 className="text-gold font-bold text-sm uppercase tracking-wider">Quick Navigation</h4>
                  <ul className="space-y-2 text-xs font-medium text-stone-300">
                    <li><Link to="/" className="hover:text-gold transition-colors">Home</Link></li>
                    <li><Link to="/about" className="hover:text-gold transition-colors">About Us</Link></li>
                  </ul>
                </div>

                {/* Help & Support */}
                <div className="space-y-3">
                  <h4 className="text-gold font-bold text-sm uppercase tracking-wider">Help & Support</h4>
                  <ul className="space-y-2 text-xs font-medium text-stone-300">
                    <li><Link to="/faq" className="hover:text-gold transition-colors">FAQs & Help</Link></li>
                    <li><Link to="/contact" className="hover:text-gold transition-colors">Contact Us & Feedback</Link></li>
                    {contactInfo.email && (
                      <li><a href={`mailto:${contactInfo.email}`} className="hover:text-gold transition-colors">{contactInfo.email}</a></li>
                    )}
                    {contactInfo.phone && (
                      <li className="opacity-80 text-[11px]">Phone: {contactInfo.phone}</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Bottom Copyright */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                <p className="text-xs font-medium tracking-wide">
                  &copy; {new Date().getFullYear()} Nashik Teli Samaj Matrimony. All rights reserved.
                </p>
                <p className="text-xs opacity-60 italic">
                  Preserving Traditions, Building Futures
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

