import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, db, doc, getDoc, setDoc, collection, query, where, getDocs } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Mail, Phone, KeyRound } from 'lucide-react';
import FloatingToast from '../components/FloatingToast';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { SAMPLE_ACCOUNTS } from '../lib/seedProfiles';
import { useTranslation } from 'react-i18next';
import { triggerWelcomeEmail } from '../lib/welcomeEmail';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const from = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const checkArchivedOrAdminAndNavigate = async (uid: string, defaultPath: string) => {
    try {
      // Check profile status
      const profileDoc = await getDoc(doc(db, 'profiles', uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        if (data.isArchived || data.status === 'archived') {
          setError("Your profile was deleted/archived. It is within the 30-day recovery window. Please contact Admin at support@nashiktelisamaj.org or use Admin panel to recover your profile.");
          return;
        }
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
    } catch (e) {
      console.error("Error checking role/archived status:", e);
    }
    navigate(defaultPath, { replace: true });
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      await checkArchivedOrAdminAndNavigate(res.user.uid, from);
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = email.trim().toLowerCase();

    try {
      // 1. First attempt normal Firebase Auth sign in
      const res = await signInWithEmailAndPassword(auth, targetEmail, password);
      await checkArchivedOrAdminAndNavigate(res.user.uid, from);
    } catch (err: any) {
      console.log("Normal auth login failed:", err?.code, err?.message);

      // 2. If Auth account doesn't exist yet, check if this is a sample/seeded account or exists in Firestore
      try {
        const matchingSample = SAMPLE_ACCOUNTS.find(a => a.email.toLowerCase() === targetEmail);
        
        // Also check if profile exists in Firestore with this email
        let matchingProfileDoc: any = null;
        if (!matchingSample) {
          const q = query(collection(db, 'profiles'), where('email', '==', targetEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            matchingProfileDoc = snap.docs[0].data();
          }
        }

        if (matchingSample || matchingProfileDoc) {
          console.log("Found sample or Firestore profile for", targetEmail, ". Auto-provisioning Auth user...");
          
          // Auto-create Auth account for sample user
          const newAuthRes = await createUserWithEmailAndPassword(auth, targetEmail, password);
          const newUid = newAuthRes.user.uid;

          // Copy or set profile & user document in Firestore under newUid
          const profileData = matchingSample || matchingProfileDoc;
          
          await setDoc(doc(db, 'users', newUid), {
            uid: newUid,
            email: targetEmail,
            role: 'user',
            createdAt: new Date().toISOString()
          });

          await setDoc(doc(db, 'profiles', newUid), {
            ...profileData,
            uid: newUid,
            email: targetEmail,
            status: profileData.status || 'approved',
            createdAt: profileData.createdAt || new Date().toISOString()
          });

          triggerWelcomeEmail({
            uid: newUid,
            email: targetEmail,
            userName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Member'
          }).catch(e => console.warn("Auto-provision welcome email warning:", e));

          await checkArchivedOrAdminAndNavigate(newUid, from);
          return;
        }
      } catch (provisionErr: any) {
        console.error("Auto-provision error:", provisionErr);
      }

      // If provision didn't handle it, show clean error message
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you forgot your password, please click "Forgot Password" below.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Click "Forgot Password" to reset via mobile OTP.');
      } else {
        setError(err.message || 'Failed to log in with Email');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (/^\d{10}$/.test(cleanPhone)) return `+91${cleanPhone}`;
    if (/^\+91\d{10}$/.test(cleanPhone)) return cleanPhone;
    if (/^91\d{10}$/.test(cleanPhone)) return `+${cleanPhone}`;
    return null;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      const formattedPhone = validatePhone(phone);
      if (!formattedPhone) {
        throw new Error("Please enter a valid 10-digit Indian phone number.");
      }

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const res = await window.confirmationResult.confirm(otp);
      await checkArchivedOrAdminAndNavigate(res.user.uid, from);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      {/* Floating Toast Notification */}
      <FloatingToast message={error ? { type: 'error', text: error } : null} onClose={() => setError('')} />

      <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-saffron/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-saffron via-gold to-saffron"></div>
        <div className="flex flex-col items-center mb-4">
          <img 
            src="/logo.jpg" 
            alt="राष्ट्रीय तेली समाज" 
            className="w-16 h-16 rounded-full object-cover border-2 border-saffron shadow-md bg-white p-0.5" 
          />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-2 text-center text-stone-900">{t('auth.loginTitle', 'Welcome Back')}</h1>
        <p className="text-stone-500 text-center mb-8">Login to your Nashik Teli Samaj account</p>
        
        <div className="flex mb-6 bg-stone-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${authMethod === 'email' ? 'bg-white text-saffron shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${authMethod === 'phone' ? 'bg-white text-saffron shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Phone className="w-4 h-4" /> Phone
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-6 font-medium">
            {error}
          </div>
        )}

        {authMethod === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">{t('auth.email', 'Email Address')}</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all font-medium" placeholder="Email" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-sm font-bold text-stone-700">{t('auth.password', 'Password')}</label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-saffron font-bold hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Forgot Password?
                </button>
              </div>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all font-medium" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-saffron text-white px-4 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 transform active:scale-[0.98]">
              {loading ? 'Signing in...' : t('auth.loginBtn', 'Login with Email')}
            </button>
          </form>
        ) : (
          <div className="space-y-5 mb-6">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">{t('auth.phone', 'Phone Number')}</label>
                  <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all font-medium" placeholder="e.g. 9876543210" />
                  <p className="text-xs text-stone-500 mt-2 ml-1">We'll send you a one-time password via SMS.</p>
                </div>
                <div id="recaptcha-container"></div>
                <button type="submit" disabled={loading} className="w-full bg-saffron text-white px-4 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 transform active:scale-[0.98]">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Enter OTP</label>
                  <input required type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border text-center tracking-widest text-2xl font-bold" placeholder="123456" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-saffron text-white px-4 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 transform active:scale-[0.98]">
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className="w-full text-stone-500 text-sm font-medium hover:text-saffron mt-2 transition-colors">
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-stone-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-stone-100 text-stone-700 px-4 py-3.5 rounded-xl font-bold hover:bg-stone-50 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Google</span>
        </button>

        <div className="pt-8 text-center text-sm text-stone-600 font-medium">
          Don't have an account? <Link to="/register" className="text-saffron font-bold hover:underline ml-1">Register here</Link>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onSuccess={(recoveredEmail) => {
          setEmail(recoveredEmail);
        }}
      />
    </div>
  );
}

