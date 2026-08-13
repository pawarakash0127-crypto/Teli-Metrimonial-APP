import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, db, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from '../lib/firebase';
import { Mail, Phone, CheckCircle } from 'lucide-react';
import FloatingToast from '../components/FloatingToast';
import { validateAndFormatPhone } from '../lib/phoneUtils';
import { sendAccountNotification } from '../lib/notificationUtils';
import { triggerWelcomeEmail } from '../lib/welcomeEmail';
import { capitalizeWords } from '../lib/capitalizationUtils';
import { assignGlobalProfileIdInTransaction } from '../lib/profileIdUtils';
import logoImg from '../assets/images/LOGO.jpg';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Calculate max date allowed for 18+ years
  const today = new Date();
  const maxDobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const validateAge = (dobString: string): boolean => {
    if (!dobString) return false;
    const birthDate = new Date(dobString);
    const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return birthDate <= cutoff;
  };

  const checkEmailOrPhoneUnique = async (emailToCheck?: string, phoneToCheck?: string): Promise<string | null> => {
    try {
      if (emailToCheck) {
        const qEmail = query(collection(db, 'users'), where('email', '==', emailToCheck.toLowerCase().trim()));
        const snap = await getDocs(qEmail);
        if (!snap.empty) {
          return 'An account with this email address already exists. Please login instead.';
        }
      }
      if (phoneToCheck) {
        const qPhone = query(collection(db, 'users'), where('phoneNumber', '==', phoneToCheck.trim()));
        const snap = await getDocs(qPhone);
        if (!snap.empty) {
          return 'An account with this phone number already exists. Please login instead.';
        }
      }
    } catch (err) {
      console.warn("Notice checking account uniqueness in Firestore:", err);
    }
    return null;
  };

  const saveProfileToFirestore = async (uid: string, userEmail: string, userPhone: string) => {
    const calculatedAge = dob ? (new Date().getFullYear() - new Date(dob).getFullYear()) : 25;
    const profileRef = doc(db, 'profiles', uid);
    const userRef = doc(db, 'users', uid);

    const docSnap = await getDoc(profileRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};

    const cleanPhoneDigits = userPhone ? userPhone.replace(/[^\d]/g, '') : '';
    const normPhone = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;

    const capFirstName = capitalizeWords(firstName.trim() || existingData.firstName || (userEmail ? userEmail.split('@')[0] : 'User'));
    const capLastName = capitalizeWords(lastName.trim() || existingData.lastName || 'Member');

    const profileData: any = {
      uid,
      firstName: capFirstName,
      lastName: capLastName,
      gender: gender || existingData.gender || 'Male',
      dob: dob || existingData.dob || '',
      age: calculatedAge >= 18 ? calculatedAge : (existingData.age || 0),
      email: (userEmail || existingData.email || '').toLowerCase().trim(),
      contactNumber: normPhone || existingData.contactNumber || '',
      updatedAt: new Date().toISOString()
    };

    if (!docSnap.exists() || !existingData.profileId) {
      try {
        const assignedId = await assignGlobalProfileIdInTransaction(profileData.gender);
        profileData.profileId = assignedId;
        profileData.vaduVarNumber = assignedId;
      } catch (err) {
        console.warn("Error calculating profileId during registration:", err);
        const prefix = profileData.gender === 'Female' ? 'VADHU' : 'VAR';
        profileData.profileId = `${prefix}-001`;
        profileData.vaduVarNumber = profileData.profileId;
      }

      profileData.status = 'pending';
      profileData.maritalStatus = '';
      profileData.height = '';
      profileData.gotraKul = '';
      profileData.nativePlace = '';
      profileData.location = '';
      profileData.education = '';
      profileData.highestEducation = '';
      profileData.profession = '';
      profileData.companyName = '';
      profileData.income = '';
      profileData.fatherName = '';
      profileData.motherName = '';
      profileData.parentsHometown = '';
      profileData.address = '';
      profileData.contactNumber = normPhone || userPhone || existingData.contactNumber || '';
      profileData.parentsContact = normPhone || userPhone || existingData.parentsContact || '';
      profileData.photoUrl = ''; // Clean start, no auto photo
      profileData.additionalPhotos = [];
      profileData.createdAt = new Date().toISOString();
      profileData.isEmailVerified = Boolean(userEmail);
      profileData.isPhoneVerified = Boolean(userPhone);
      profileData.partnerPreferences = {
        preferredBirthYear: '',
        education: '',
        location: ''
      };

      // Create Admin Notification for new profile registration
      try {
        const isFemale = profileData.gender === 'Female' || profileData.gender === 'female' || profileData.gender === 'bride' || profileData.gender === 'vadhu';
        const categoryLabel = isFemale ? 'Vadhu' : 'Var';
        const regMethod = userPhone ? 'Phone' : userEmail ? 'Email' : 'Google';

        await addDoc(collection(db, 'admin_notifications'), {
          type: 'new_registration',
          userName: `${capFirstName} ${capLastName}`.trim(),
          gender: profileData.gender,
          category: categoryLabel,
          profileId: profileData.profileId,
          registrationMethod: regMethod,
          createdAt: new Date().toISOString(),
          uid,
          read: false
        });
      } catch (notifErr) {
        console.warn("Could not record admin notification:", notifErr);
      }
    }

    await setDoc(profileRef, profileData, { merge: true });
    await setDoc(userRef, {
      uid,
      email: (userEmail || existingData.email || '').toLowerCase().trim(),
      phoneNumber: userPhone || existingData.phoneNumber || '',
      role: existingData.role || 'user',
      vaduVarNumber: profileData.vaduVarNumber || profileData.profileId || '',
      profileId: profileData.profileId || profileData.vaduVarNumber || '',
      createdAt: existingData.createdAt || new Date().toISOString()
    }, { merge: true });
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      
      const displayNameParts = (user.displayName || 'Nashik Member').split(' ');
      const gFirstName = capitalizeWords(firstName || displayNameParts[0] || 'User');
      const gLastName = capitalizeWords(lastName || displayNameParts.slice(1).join(' ') || 'Member');

      await saveProfileToFirestore(user.uid, user.email || '', user.phoneNumber || '');

      triggerWelcomeEmail({
        uid: user.uid,
        email: user.email || '',
        userName: `${gFirstName} ${gLastName}`,
        registrationDateISO: new Date().toISOString()
      }).catch(err => console.warn("Welcome email trigger warning:", err));

      const notif = sendAccountNotification('creation', {
        userName: `${gFirstName} ${gLastName}`,
        email: user.email || '',
        phone: user.phoneNumber || ''
      });
      setSuccessMsg(notif.message);

      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dob || !gender) {
      setError('Please fill in all personal details including gender.');
      return;
    }

    if (!validateAge(dob)) {
      setError('You must be at least 18 years old to register on Nashik Teli Samaj Matrimony.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const uniqueErr = await checkEmailOrPhoneUnique(email, undefined);
      if (uniqueErr) {
        setError(uniqueErr);
        setLoading(false);
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);
      await saveProfileToFirestore(res.user.uid, email, '');

      triggerWelcomeEmail({
        uid: res.user.uid,
        email,
        userName: `${capitalizeWords(firstName)} ${capitalizeWords(lastName)}`,
        registrationDateISO: new Date().toISOString()
      }).catch(err => console.warn("Welcome email trigger warning:", err));

      const notif = sendAccountNotification('creation', {
        userName: `${capitalizeWords(firstName)} ${capitalizeWords(lastName)}`,
        email,
        phone: ''
      });
      setSuccessMsg(notif.message);

      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account with Email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRes = validateAndFormatPhone(phone);
    if (!phoneRes.isValid) {
      setError(phoneRes.error || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const uniqueErr = await checkEmailOrPhoneUnique(undefined, phoneRes.formatted);
      if (uniqueErr) {
        setError(uniqueErr);
        setLoading(false);
        return;
      }

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneRes.formatted, window.recaptchaVerifier);
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
    if (!firstName.trim() || !lastName.trim() || !dob || !gender) {
      setError('Please fill in all personal details including gender.');
      return;
    }

    if (!validateAge(dob)) {
      setError('You must be at least 18 years old to register on Nashik Teli Samaj Matrimony.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await window.confirmationResult.confirm(otp);
      await saveProfileToFirestore(res.user.uid, '', phone);

      triggerWelcomeEmail({
        uid: res.user.uid,
        userName: `${capitalizeWords(firstName)} ${capitalizeWords(lastName)}`
      }).catch(err => console.warn("Welcome email trigger warning:", err));

      const notif = sendAccountNotification('creation', {
        userName: `${capitalizeWords(firstName)} ${capitalizeWords(lastName)}`,
        email: '',
        phone
      });
      setSuccessMsg(notif.message);

      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <FloatingToast message={error ? { type: 'error', text: error } : null} onClose={() => setError('')} />

      <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-saffron/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-saffron via-gold to-saffron"></div>
        <div className="flex flex-col items-center mb-4">
          <img 
            src={logoImg} 
            alt="राष्ट्रीय तेली समाज" 
            className="w-16 h-16 rounded-full object-cover border-2 border-saffron shadow-md bg-white p-0.5" 
          />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-2 text-center text-stone-900">Create Account</h1>
        <p className="text-stone-500 text-center mb-8">Join the Nashik Teli Samaj Matrimony</p>
        
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

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm border border-emerald-200 mb-6 font-medium flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Account Registration Successful!</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-6 font-medium">
            {error}
          </div>
        )}

        {authMethod === 'email' ? (
          <form onSubmit={handleEmailRegister} className="space-y-5 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">First Name</label>
                <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="Akash" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Last Name</label>
                <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="Pawar" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Gender *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-3 px-4 rounded-xl font-bold border transition-all text-sm flex items-center justify-center gap-2 ${
                    gender === 'Male'
                      ? 'bg-saffron text-white border-saffron shadow-md'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-3 px-4 rounded-xl font-bold border transition-all text-sm flex items-center justify-center gap-2 ${
                    gender === 'Female'
                      ? 'bg-saffron text-white border-saffron shadow-md'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Date of Birth </label>
              <input required type="date" max={maxDobDate} value={dob} onChange={e => setDob(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Email Address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="••••••••" />
              <p className="text-xs text-stone-500 mt-2 ml-1">Must be at least 6 characters.</p>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-saffron text-white px-4 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 transform active:scale-[0.98]">
              {loading ? 'Creating account...' : 'Register with Email'}
            </button>
          </form>
        ) : (
          <div className="space-y-5 mb-6">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Phone Number</label>
                  <input required type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="e.g. 9876543210" />
                  <p className="text-xs text-stone-500 mt-2 ml-1">We'll send you a one-time password via SMS.</p>
                </div>
                <div id="recaptcha-container"></div>
                <button type="submit" disabled={loading} className="w-full bg-saffron text-white px-4 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 transform active:scale-[0.98]">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">First Name</label>
                    <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="First Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Last Name</label>
                    <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" placeholder="Last Name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Gender *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`py-3 px-4 rounded-xl font-bold border transition-all text-sm flex items-center justify-center gap-2 ${
                        gender === 'Male'
                          ? 'bg-saffron text-white border-saffron shadow-md'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`py-3 px-4 rounded-xl font-bold border transition-all text-sm flex items-center justify-center gap-2 ${
                        gender === 'Female'
                          ? 'bg-saffron text-white border-saffron shadow-md'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Date of Birth </label>
                  <input required type="date" max={maxDobDate} value={dob} onChange={e => setDob(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border transition-all" />
                  <p className="text-xs text-stone-400 mt-1 ml-1 font-medium">Must be born on or before {maxDobDate} (18 years or older)</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Enter OTP</label>
                  <input required type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3.5 border text-center tracking-widest text-2xl font-bold" placeholder="123456" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-saffron text-white px-4 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20 disabled:opacity-50 transform active:scale-[0.98]">
                  {loading ? 'Verifying...' : 'Verify & Register'}
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
          Already have an account? <Link to="/login" className="text-saffron font-bold hover:underline ml-1">Login here</Link>
        </div>
      </div>
    </div>
  );
}
