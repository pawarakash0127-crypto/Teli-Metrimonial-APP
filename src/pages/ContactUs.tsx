import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock, Globe, Share2, Facebook, Instagram, Youtube, Linkedin, Twitter, ExternalLink, Star } from 'lucide-react';
import { db, collection, addDoc } from '../lib/firebase';
import { subscribeContactSettings, DEFAULT_CONTACT_SETTINGS, ContactUsSettings, getActiveSocialPlatforms } from '../lib/contactSettings';
import { validateAndFormatPhone, validateEmail } from '../lib/phoneUtils';
import { useAuth } from '../contexts/AuthContext';

export default function ContactUs() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'message' | 'review'>('message');

  // Contact Message Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Query');
  const [message, setMessage] = useState('');
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);
  const [messageError, setMessageError] = useState('');

  // Review / Feedback Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [contactInfo, setContactInfo] = useState<ContactUsSettings>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    const unsubscribe = subscribeContactSettings((settings) => {
      setContactInfo(settings);
    });
    return () => unsubscribe();
  }, []);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (profile || user) {
      const defaultName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : (user?.displayName || '');
      const defaultEmail = profile?.email || user?.email || '';
      const defaultPhone = profile?.contactNumber || user?.phoneNumber || '';

      if (!name) setName(defaultName);
      if (!email) setEmail(defaultEmail);
      if (!phone) setPhone(defaultPhone);

      if (!reviewName) setReviewName(defaultName);
      if (!reviewEmail) setReviewEmail(defaultEmail);
      if (!reviewPhone) setReviewPhone(defaultPhone);
    }
  }, [profile, user]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageError('');

    if (!name.trim()) {
      setMessageError('Please enter your full name.');
      return;
    }

    if (!message.trim()) {
      setMessageError('Please enter your message or query.');
      return;
    }

    // Phone validation (if provided)
    if (phone.trim()) {
      const pRes = validateAndFormatPhone(phone);
      if (!pRes.isValid) {
        setMessageError(pRes.error || 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    // Email validation (if provided)
    if (email.trim()) {
      const eRes = validateEmail(email);
      if (!eRes.isValid) {
        setMessageError(eRes.error || 'Please enter a valid email address.');
        return;
      }
    }

    setSubmittingMessage(true);

    try {
      await addDoc(collection(db, 'contactQueries'), {
        uid: user?.uid || null,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'new'
      });

      setSubmittedMessage(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting query:', err);
      setMessageError('Failed to submit message. Please try again.');
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    if (!reviewName.trim()) {
      setReviewError('Please enter your name.');
      return;
    }

    if (!reviewPhone.trim()) {
      setReviewError('Please enter your mobile phone number.');
      return;
    }

    const pRes = validateAndFormatPhone(reviewPhone);
    if (!pRes.isValid) {
      setReviewError(pRes.error || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (reviewEmail.trim()) {
      const eRes = validateEmail(reviewEmail);
      if (!eRes.isValid) {
        setReviewError(eRes.error || 'Please enter a valid email address.');
        return;
      }
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a star rating between 1 and 5 stars.');
      return;
    }

    if (!reviewText.trim()) {
      setReviewError('Please enter your feedback or review text.');
      return;
    }

    setSubmittingReview(true);

    try {
      const reviewDocRef = await addDoc(collection(db, 'reviews'), {
        uid: user?.uid || null,
        name: reviewName.trim(),
        email: reviewEmail.trim(),
        phone: pRes.formatted,
        rating: Number(reviewRating),
        reviewText: reviewText.trim(),
        status: 'pending',
        showOnHome: false,
        createdAt: new Date().toISOString()
      });

      // Real-time admin notification
      await addDoc(collection(db, 'admin_notifications'), {
        type: 'feedback_submission',
        reviewId: reviewDocRef.id,
        userName: reviewName.trim(),
        userEmail: reviewEmail.trim(),
        userPhone: pRes.formatted,
        uid: user?.uid || null,
        rating: Number(reviewRating),
        reviewText: reviewText.trim(),
        read: false,
        createdAt: new Date().toISOString()
      });

      // Contact query entry for feedback filter
      await addDoc(collection(db, 'contactQueries'), {
        uid: user?.uid || null,
        name: reviewName.trim(),
        email: reviewEmail.trim(),
        phone: pRes.formatted,
        subject: 'Website Feedback',
        message: `[Rating: ${reviewRating}/5 Stars] ${reviewText.trim()}`,
        rating: Number(reviewRating),
        reviewId: reviewDocRef.id,
        createdAt: new Date().toISOString(),
        status: 'new'
      });

      setSubmittedReview(true);
      setReviewText('');
      setReviewRating(5);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setReviewError('Failed to submit feedback/review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const platformIconMap = {
    facebook: { icon: Facebook, color: 'text-blue-600' },
    instagram: { icon: Instagram, color: 'text-pink-600' },
    youtube: { icon: Youtube, color: 'text-red-600' },
    linkedin: { icon: Linkedin, color: 'text-blue-700' },
    twitter: { icon: Twitter, color: 'text-sky-500' },
  };

  const activeSocials = getActiveSocialPlatforms(contactInfo).map(p => ({
    ...p,
    icon: platformIconMap[p.platformKey].icon,
    color: platformIconMap[p.platformKey].color
  }));

  const fullAddress = [
    contactInfo.officeName,
    contactInfo.addressLine,
    contactInfo.city,
    contactInfo.state ? `${contactInfo.state} ${contactInfo.pincode || ''}` : '',
    contactInfo.country
  ].filter(Boolean).join(', ');

  return (
    <div className="bg-stone-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-saffron/10 text-saffron px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-saffron/20">
            <Mail className="w-4 h-4" />
            <span>संपर्क साधा (Contact Us)</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
            Contact & Feedback Support
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            {contactInfo.supportNotice || DEFAULT_CONTACT_SETTINGS.supportNotice}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Contact Details Card */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-8 lg:col-span-1">
            <h3 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-100 pb-4">
              Community Helpdesk
            </h3>

            <div className="space-y-6 text-sm text-stone-700">
              {/* Office Address */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-saffron rounded-2xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-1">Office Address</strong>
                  <span className="text-stone-700 leading-relaxed block">{fullAddress}</span>
                  {contactInfo.googleMapsUrl && (
                    <a 
                      href={contactInfo.googleMapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron hover:underline mt-2"
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Email Support */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-saffron rounded-2xl shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-1">Email Support</strong>
                  {contactInfo.email && (
                    <a href={`mailto:${contactInfo.email}`} className="text-saffron font-medium hover:underline block">
                      {contactInfo.email}
                    </a>
                  )}
                  {contactInfo.secondaryEmail && (
                    <a href={`mailto:${contactInfo.secondaryEmail}`} className="text-stone-500 text-xs hover:underline block mt-0.5">
                      {contactInfo.secondaryEmail}
                    </a>
                  )}
                </div>
              </div>

              {/* Contact Phone & WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-saffron rounded-2xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-1">Phone & WhatsApp</strong>
                  {contactInfo.phone && (
                    <div className="font-medium text-stone-900">{contactInfo.phone}</div>
                  )}
                  {contactInfo.secondaryPhone && (
                    <div className="text-stone-500 text-xs">{contactInfo.secondaryPhone}</div>
                  )}
                  {contactInfo.whatsappNumber && (
                    <a 
                      href={`https://wa.me/${contactInfo.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline mt-1 block"
                    >
                      <span>WhatsApp Chat: {contactInfo.whatsappNumber}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Office Hours */}
              {contactInfo.officeHours && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-50 text-saffron rounded-2xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 font-bold mb-1">Office Hours</strong>
                    <span className="text-stone-600 text-xs">{contactInfo.officeHours}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Channels */}
            {activeSocials.length > 0 && (
              <div className="pt-6 border-t border-stone-100 space-y-3">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Social Channels</span>
                <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-stone-600">
                  {activeSocials.map((platform) => (
                    <div key={platform.name} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                      <div className="flex items-center gap-2">
                        <platform.icon className={`w-4 h-4 ${platform.color}`} />
                        <span>{platform.name}</span>
                      </div>
                      <a 
                        href={platform.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-saffron font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Card with Tabs */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs lg:col-span-2 space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                onClick={() => setActiveTab('message')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'message'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-saffron" />
                <span>Send Us a Message</span>
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'review'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Submit Feedback & Review</span>
              </button>
            </div>

            {/* TAB 1: Send Message Form */}
            {activeTab === 'message' && (
              <div>
                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                  Send Us a Message
                </h3>
                <p className="text-stone-500 text-sm mb-6">
                  Have a question or need assistance? Send a direct message to community administrators.
                </p>

                {submittedMessage ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center text-emerald-900 space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="text-xl font-bold">Thank You!</h4>
                    <p className="text-sm text-emerald-800">
                      Your message has been received. Our support team will get back to you shortly.
                    </p>
                    <button
                      onClick={() => setSubmittedMessage(false)}
                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitMessage} className="space-y-5">
                    {messageError && (
                      <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-bold border border-red-200">
                        {messageError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Patil"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                          Subject
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm bg-white"
                        >
                          <option value="General Query">General Query</option>
                          <option value="Profile Verification">Profile Verification</option>
                          <option value="Kundali Matching Query">Kundali Matching Query</option>
                          <option value="Website Support">Website Support</option>
                          <option value="Account Deletion Request">Account Deletion Request</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                        Your Message / Query *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingMessage}
                      className="w-full sm:w-auto px-8 py-3.5 bg-saffron text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md shadow-saffron/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submittingMessage ? 'Submitting...' : 'Submit Message'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Submit Feedback & Review Form */}
            {activeTab === 'review' && (
              <div>
                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                  Submit Feedback & Review
                </h3>
                <p className="text-stone-500 text-sm mb-6">
                  Share your experience with Nashik Teli Samaj Vadhu-Var Parichay. Approved reviews may be featured on our Home Page!
                </p>

                {submittedReview ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-900 space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-amber-600 mx-auto" />
                    <h4 className="text-xl font-bold">Feedback Submitted!</h4>
                    <p className="text-sm text-amber-800">
                      Thank you for your valuable feedback. Your review has been submitted for administrator review.
                    </p>
                    <button
                      onClick={() => setSubmittedReview(false)}
                      className="bg-saffron text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      Submit Another Review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    {reviewError && (
                      <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-bold border border-red-200">
                        {reviewError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Shinde"
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                          Mobile Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={reviewPhone}
                          onChange={(e) => setReviewPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      />
                    </div>

                    {/* Star Rating 1-5 UI */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-2">
                        Rating (1 to 5 Stars) *
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl w-fit">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoverRating || reviewRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1.5 text-amber-400 hover:scale-110 transition-transform focus:outline-hidden"
                              title={`${star} Star${star > 1 ? 's' : ''}`}
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  isFilled
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-stone-300 fill-stone-100'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="ml-3 text-xs font-bold text-stone-700">
                          {reviewRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                        Your Feedback / Review Text *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Share your experience or thoughts about our matrimony platform..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full sm:w-auto px-8 py-3.5 bg-saffron text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md shadow-saffron/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      <span>{submittingReview ? 'Submitting Review...' : 'Submit Feedback & Review'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
