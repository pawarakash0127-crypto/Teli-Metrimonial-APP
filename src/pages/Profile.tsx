import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from '../lib/firebase';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Upload, X, MapPin, Briefcase, GraduationCap, Users, Phone, User, Heart, CheckCircle, ShieldCheck, AlertCircle, KeyRound, Calendar, Trash2, RefreshCw, Mail, Lock, Sparkles, CreditCard, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageCarousel from '../components/ImageCarousel';
import { validateAndFormatPhone, MANDATORY_PROFILE_FIELDS } from '../lib/phoneUtils';
import { SAMPLE_ACCOUNTS } from '../lib/seedProfiles';
import FloatingToast, { ToastMessage } from '../components/FloatingToast';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CompleteProfileModal from '../components/CompleteProfileModal';
import UploadPhotosPromptModal from '../components/UploadPhotosPromptModal';
import AddEmailModal from '../components/AddEmailModal';
import { sendAccountNotification } from '../lib/notificationUtils';
import { HIGHEST_EDUCATION_CATEGORIES, ANNUAL_INCOME_OPTIONS, TITLE_PREFIXES } from '../types';
import { capitalizeWords } from '../lib/capitalizationUtils';
import { getDisplayProfileId } from '../lib/profileIdUtils';
import { formatHeightDisplay, formatHeightInput, translateText } from '../lib/profileTranslator';
import { getSubscriptionDetails, activateSubscriptionInFirestore, deactivateSubscriptionInFirestore, ANNUAL_SUBSCRIPTION_PRICE } from '../lib/subscriptionService';

const FavoritesList = ({ favoriteIds }: { favoriteIds: string[] }) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!favoriteIds || favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      try {
        const chunks = [];
        for (let i = 0; i < favoriteIds.length; i += 10) {
          chunks.push(favoriteIds.slice(i, i + 10));
        }
        
        let allFavorites: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'profiles'), where('__name__', 'in', chunk));
          const snapshot = await getDocs(q);
          const chunkProfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          allFavorites = [...allFavorites, ...chunkProfiles];
        }
        setFavorites(allFavorites);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [favoriteIds]);

  if (loading) return <div className="text-center py-8">Loading favorites...</div>;
  if (favorites.length === 0) return <div className="text-center py-8 text-stone-500">No favorite profiles yet.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {favorites.map(profile => (
        <div key={profile.id} className="bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden hover:shadow-xl transition-all group">
          <div className="aspect-[4/5] relative bg-stone-100 overflow-hidden">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.firstName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                <User className="h-20 w-20" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
              <h3 className="text-white font-serif font-bold text-xl">{profile.titlePrefix ? `${profile.titlePrefix} ` : ''}{profile.firstName} {profile.lastName}</h3>
              <p className="text-white/90 text-sm font-medium">{profile.age} yrs • {profile.height}</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <Briefcase className="w-4 h-4 text-saffron" />
              <span className="truncate font-medium">{profile.profession}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <MapPin className="w-4 h-4 text-saffron" />
              <span className="truncate font-medium">{profile.location}</span>
            </div>
            <div className="pt-3">
              <Link to={`/profile/${profile.id}`} className="block w-full text-center bg-stone-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-saffron transition-all shadow-md">
                View Profile
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfilePreview = ({ profile, onEdit }: { profile: any, onEdit: (section: string) => void }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-2 border-saffron/10 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-saffron via-gold to-saffron"></div>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row gap-8 mb-10 relative">
          <button onClick={() => onEdit('personal')} className="absolute top-0 right-0 bg-saffron/10 text-saffron px-4 py-1.5 rounded-full text-xs font-bold hover:bg-saffron hover:text-white transition-all">Edit Details</button>
          <div className="flex flex-col gap-4">
            <div className="w-48 h-48 rounded-3xl overflow-hidden bg-stone-100 flex-shrink-0 border-4 border-white shadow-lg">
              <ImageCarousel 
                images={[profile.photoUrl, ...(profile.additionalPhotos || [])].filter(Boolean) as string[]} 
                altText={profile.firstName} 
              />
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-3xl font-serif font-bold text-stone-900 mb-3">
              {profile.titlePrefix ? `${profile.titlePrefix} ` : ''}{profile.firstName} {profile.middleName ? `${profile.middleName} ` : ''}{profile.lastName}
            </h3>
            <div className="flex flex-wrap gap-2.5 mb-5">
              <span className="px-4 py-1.5 bg-saffron/10 text-saffron rounded-full text-sm font-bold">
                {profile.age} yrs • {formatHeightDisplay(profile.height, currentLang)}
              </span>
              <span className="px-4 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm font-bold">
                {profile.gender}
              </span>
              <span className="px-4 py-1.5 bg-maroon/10 text-maroon rounded-full text-sm font-bold">
                {profile.maritalStatus || 'Unmarried'}
              </span>
              {profile.isManglik === 'Yes' && (
                <span className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-sm font-bold shadow-md">
                  Manglik
                </span>
              )}
            </div>
            <button onClick={() => onEdit('photos')} className="text-saffron hover:text-orange-600 text-sm font-bold flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Manage Photos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="relative">
              <button onClick={() => onEdit('education')} className="absolute top-0 right-0 text-saffron hover:underline text-sm font-bold z-10">Edit</button>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-stone-200"></span> Professional Details
              </h4>
              <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 space-y-5">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <Briefcase className="w-6 h-6 text-saffron" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Profession</p>
                    <p className="text-stone-900 font-bold text-lg">{profile.profession || 'N/A'}</p>
                    {profile.companyName && (
                      <p className="text-stone-500 text-sm font-medium">at {profile.companyName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <GraduationCap className="w-6 h-6 text-saffron" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Education</p>
                    <p className="text-stone-900 font-bold text-lg">
                      {profile.highestEducation === 'Others' ? (profile.customEducation || profile.education) : (profile.highestEducation || profile.education || 'N/A')}
                    </p>
                    {profile.degreeDetails && profile.highestEducation !== profile.degreeDetails && (
                      <p className="text-stone-500 text-xs font-medium">{profile.degreeDetails}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <div className="w-6 h-6 flex items-center justify-center text-saffron font-bold text-xl">₹</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Annual Income</p>
                    <p className="text-stone-900 font-bold text-lg">{profile.income || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <button onClick={() => onEdit('location')} className="absolute top-0 right-0 text-saffron hover:underline text-sm font-bold z-10">Edit</button>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-stone-200"></span> Location & Roots
              </h4>
              <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 space-y-5">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <MapPin className="w-6 h-6 text-saffron" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Current Location</p>
                    <p className="text-stone-900 font-bold text-lg">{profile.location || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <Users className="w-6 h-6 text-saffron" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Gotra/Kul & Native</p>
                    <p className="text-stone-900 font-bold text-lg">{profile.gotraKul || 'N/A'} • {profile.nativePlace || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <User className="w-6 h-6 text-saffron" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Manglik Status</p>
                    <p className="text-stone-900 font-bold text-lg">{profile.isManglik || 'No'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <MapPin className="w-6 h-6 text-saffron" />
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Birth Details</p>
                    <p className="text-stone-900 font-bold text-lg">
                      {profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB') : 'N/A'} 
                      {profile.timeOfBirth ? ` • ${formatTime(profile.timeOfBirth)}` : ''}
                    </p>
                    {profile.birthplace && (
                      <p className="text-stone-500 text-sm font-medium">Place: {profile.birthplace}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <button onClick={() => onEdit('family')} className="absolute top-0 right-0 text-saffron hover:underline text-sm font-bold z-10">Edit</button>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-stone-200"></span> Family Details
              </h4>
              <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 space-y-6">
                
                {(profile.fatherName || profile.motherName || profile.parentsOccupation || profile.parentsContact || profile.parentsHometown) && (
                  <div className="bg-saffron/5 p-5 rounded-2xl border border-saffron/10">
                    <p className="text-[10px] text-saffron uppercase tracking-widest font-bold mb-4">Parents Details</p>
                    <div className="space-y-3">
                      {profile.fatherName && (
                        <p className="text-stone-900 text-sm flex justify-between items-center">
                          <span className="text-stone-500 font-medium">Father's Name</span>
                          <span className="font-bold">{profile.fatherTitle ? `${profile.fatherTitle} ` : ''}{profile.fatherName}</span>
                        </p>
                      )}
                      {profile.motherName && (
                        <p className="text-stone-900 text-sm flex justify-between items-center">
                          <span className="text-stone-500 font-medium">Mother's Name</span>
                          <span className="font-bold">{profile.motherTitle ? `${profile.motherTitle} ` : ''}{profile.motherName}</span>
                        </p>
                      )}
                      {(profile.fatherOccupationCompany || profile.parentsOccupation) && (
                        <p className="text-stone-900 text-sm flex justify-between items-center">
                          <span className="text-stone-500 font-medium">Parent Occupation</span>
                          <span className="font-bold">{profile.fatherOccupationCompany || profile.parentsOccupation}</span>
                        </p>
                      )}
                      {profile.parentsContact && (
                        <p className="text-stone-900 text-sm flex justify-between items-center">
                          <span className="text-stone-500 font-medium">Contact</span>
                          <span className="font-bold text-saffron">
                            {profile.parentsContact.replace(/\D/g, '').length === 10 
                              ? `+91 - ${profile.parentsContact.replace(/\D/g, '')}` 
                              : profile.parentsContact}
                          </span>
                        </p>
                      )}
                      {profile.parentsHometown && (
                        <p className="text-stone-500 text-xs mt-3 italic text-right border-t border-saffron/10 pt-2">Hometown: {profile.parentsHometown}</p>
                      )}
                    </div>
                  </div>
                )}

                {profile.siblings && (
                  <div className="pt-2">
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-4">Siblings</p>
                    <div className="space-y-3">
                      {(() => {
                        try {
                          const parsedSiblings = typeof profile.siblings === 'string' ? JSON.parse(profile.siblings) : profile.siblings;
                          const validSiblings = (parsedSiblings || []).filter((s: any) => s && (s.name || s.type || s.occupation || s.maritalStatus));
                          if (validSiblings.length === 0) return <p className="text-stone-500 text-sm italic">No siblings added.</p>;
                          return validSiblings.map((sibling: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                              {sibling.name ? <span className="font-bold text-stone-900 block mb-2">{sibling.name}</span> : null}
                              <div className="flex flex-wrap gap-2 text-[10px] text-stone-500 font-bold uppercase">
                                {sibling.type && <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">{sibling.type}</span>}
                                {sibling.occupation && <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">{sibling.occupation}</span>}
                                {sibling.maritalStatus && <span className="bg-saffron/10 text-saffron px-2.5 py-1 rounded-lg border border-saffron/10">{sibling.maritalStatus}</span>}
                              </div>
                            </div>
                          ));
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-100 relative">
                  <button onClick={() => onEdit('uncle')} className="absolute top-4 right-0 text-saffron hover:underline text-[10px] font-bold">Edit Uncle</button>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-4">Maternal Uncle (Mama)</p>
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm space-y-3">
                    <p className="text-stone-900 text-sm flex justify-between items-center">
                      <span className="text-stone-500 font-medium">Uncle Name</span>
                      <span className="font-bold">{profile.maternalUncleName || 'N/A'}</span>
                    </p>
                    {profile.maternalUncleGotraKul && (
                      <p className="text-stone-900 text-sm flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Gotra/Kul</span>
                        <span className="font-bold">{profile.maternalUncleGotraKul}</span>
                      </p>
                    )}
                    {profile.maternalUnclePlace && (
                      <p className="text-stone-900 text-sm flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Location</span>
                        <span className="font-bold">{profile.maternalUnclePlace}</span>
                      </p>
                    )}
                    {profile.maternalUnclePhone && (
                      <p className="text-stone-900 text-sm flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Contact</span>
                        <span className="font-bold text-saffron">
                          {profile.maternalUnclePhone.replace(/\D/g, '').length === 10 
                            ? `+91 - ${profile.maternalUnclePhone.replace(/\D/g, '')}` 
                            : profile.maternalUnclePhone}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <button onClick={() => onEdit('preferences')} className="absolute top-0 right-0 text-saffron hover:underline text-sm font-bold z-10">Edit</button>
              {profile.partnerExpectations && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-stone-200"></span> Partner Expectations
                  </h4>
                  <div className="relative">
                    <span className="absolute -top-3 -left-3 text-5xl text-saffron/20 font-serif">“</span>
                    <p className="text-stone-700 leading-relaxed bg-saffron/5 p-6 rounded-3xl italic font-serif text-xl border-l-4 border-saffron">
                      {profile.partnerExpectations}
                    </p>
                    <span className="absolute -bottom-6 -right-3 text-5xl text-saffron/20 font-serif">”</span>
                  </div>
                </div>
              )}

              {profile.partnerPreferences && (
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-stone-200"></span> Partner Preferences
                  </h4>
                  <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 space-y-5">
                    <div className="grid grid-cols-1 gap-4">
                      {profile.partnerPreferences.preferredBirthYear && (
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                            <Calendar className="w-6 h-6 text-saffron" />
                          </div>
                          <div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Preferred Birth Year</p>
                            <p className="text-stone-900 font-bold text-lg">{profile.partnerPreferences.preferredBirthYear} born & later</p>
                          </div>
                        </div>
                      )}
                      {profile.partnerPreferences.education && (
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                            <GraduationCap className="w-6 h-6 text-saffron" />
                          </div>
                          <div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Preferred Education</p>
                            <p className="text-stone-900 font-bold text-lg">{profile.partnerPreferences.education}</p>
                          </div>
                        </div>
                      )}
                      {profile.partnerPreferences.location && (
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                            <MapPin className="w-6 h-6 text-saffron" />
                          </div>
                          <div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Preferred Location</p>
                            <p className="text-stone-900 font-bold text-lg">{profile.partnerPreferences.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => onEdit('contact')} className="absolute top-0 right-0 text-saffron hover:underline text-sm font-bold z-10">Edit</button>
              {(profile.contactNumber || profile.address) && (
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-stone-200"></span> Contact & Address
                  </h4>
                  <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 space-y-5">
                    {profile.contactNumber && (
                      <div className="flex items-center gap-5 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100">
                          <Phone className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Phone Number</p>
                          <p className="text-emerald-900 font-bold text-lg">
                            {profile.contactNumber.replace(/\D/g, '').length === 10 
                              ? `+91 - ${profile.contactNumber.replace(/\D/g, '')}` 
                              : profile.contactNumber}
                          </p>
                        </div>
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-center gap-5 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100">
                          <MapPin className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Address</p>
                          <p className="text-emerald-900 text-sm font-bold">{profile.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { 
    user, 
    profile: authProfile, 
    isProfileComplete, 
    missingMandatoryFields, 
    profileCompletenessResult, 
    loading: authLoading 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const [originalIsFeatured, setOriginalIsFeatured] = useState<boolean | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'account' | 'favorites'>('preview');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCompletionModalDismissed, setIsCompletionModalDismissed] = useState(false);
  const [showUploadPromptModal, setShowUploadPromptModal] = useState(false);
  const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [siblings, setSiblings] = useState<{name: string, type: string, occupation: string, maritalStatus: string}[]>([]);
  
  const targetUid = (id && authProfile?.role === 'admin') ? id : (user?.uid || '');

  const [formData, setFormData] = useState({
    titlePrefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    timeOfBirth: '',
    birthplace: '',
    isManglik: '',
    height: '',
    highestEducation: '',
    customEducation: '',
    degreeDetails: '',
    university: '',
    completionYear: '',
    education: '',
    profession: '',
    companyName: '',
    income: '',
    location: '',
    nativePlace: '',
    gotraKul: '',
    maritalStatus: '',
    fatherTitle: 'Mr.',
    fatherName: '',
    motherTitle: 'Mrs.',
    motherName: '',
    fatherOccupationCompany: '',
    motherOccupationCompany: '',
    parentsHometown: '',
    address: '',
    maternalUncleName: '',
    maternalUncleGotraKul: '',
    maternalUnclePlace: '',
    maternalUnclePhone: '',
    parentsOccupation: '',
    parentsContact: '',
    contactNumber: '',
    email: '',
    partnerExpectations: '',
    photoUrl: '',
    additionalPhotos: [] as string[],
    favorites: [] as string[],
    partnerPreferences: {
      preferredBirthYear: '',
      education: '',
      location: ''
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!user || !targetUid) return;
    const docRef = doc(db, 'profiles', targetUid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOriginalCreatedAt(data.createdAt);
        setOriginalStatus(data.status);
        if (data.isFeatured !== undefined) {
          setOriginalIsFeatured(data.isFeatured);
        }
        const extract10Digits = (str?: string) => {
          if (!str) return '';
          const digits = str.replace(/[^\d]/g, '');
          if (digits.length >= 10) return digits.slice(-10);
          return digits;
        };

        const authPhone = user.phoneNumber || (user as any).phone || (authProfile as any)?.phoneNumber || (authProfile as any)?.contactNumber || '';

        setFormData(prev => ({
          ...prev,
          ...data,
          email: data.email || user.email || '',
          contactNumber: extract10Digits(data.contactNumber || authPhone),
          parentsContact: extract10Digits(data.parentsContact || authPhone),
          maternalUnclePhone: extract10Digits(data.maternalUnclePhone),
          gotraKul: data.gotraKul || data.gotra || '',
          partnerPreferences: {
            ...prev.partnerPreferences,
            ...(data.partnerPreferences || {})
          }
        }));
        
        if (data.siblings) {
          try {
            const parsed = typeof data.siblings === 'string' ? JSON.parse(data.siblings) : data.siblings;
            setSiblings(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            console.error("Error parsing siblings:", e);
            setSiblings([]);
          }
        }
      } else {
        (async () => {
          let foundData: any = null;
          if (user.email) {
            const userEmailLower = user.email.toLowerCase();
            try {
              const q = query(collection(db, 'profiles'), where('email', '==', userEmailLower));
              const snap = await getDocs(q);
              if (!snap.empty) {
                foundData = snap.docs[0].data();
              }
            } catch (err) {
              console.error("Error searching profiles by email:", err);
            }
          }

          if (foundData) {
            const newProfileDoc = {
              ...foundData,
              uid: targetUid,
              email: user.email ? user.email.toLowerCase() : foundData.email,
              updatedAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'profiles', targetUid), newProfileDoc, { merge: true });
            } catch (err) {
              console.error("Error setting merged profile doc:", err);
            }

            setOriginalCreatedAt(newProfileDoc.createdAt);
            setOriginalStatus(newProfileDoc.status || 'approved');
            if (newProfileDoc.isFeatured !== undefined) {
              setOriginalIsFeatured(newProfileDoc.isFeatured);
            }

            const extract10Digits = (str?: string) => {
              if (!str) return '';
              const digits = str.replace(/[^\d]/g, '');
              if (digits.length >= 10) return digits.slice(-10);
              return digits;
            };

            setFormData(prev => ({
              ...prev,
              ...newProfileDoc,
              contactNumber: extract10Digits(newProfileDoc.contactNumber),
              parentsContact: extract10Digits(newProfileDoc.parentsContact),
              maternalUnclePhone: extract10Digits(newProfileDoc.maternalUnclePhone),
              gotraKul: newProfileDoc.gotraKul || newProfileDoc.gotra || '',
              partnerPreferences: {
                ...prev.partnerPreferences,
                ...(newProfileDoc.partnerPreferences || {})
              }
            }));

            if (newProfileDoc.siblings) {
              try {
                const parsed = typeof newProfileDoc.siblings === 'string' ? JSON.parse(newProfileDoc.siblings) : newProfileDoc.siblings;
                setSiblings(Array.isArray(parsed) ? parsed : []);
              } catch (e) {
                console.error("Error parsing siblings:", e);
                setSiblings([]);
              }
            }
            setIsEditing(false);
          } else {
            setIsEditing(true);
            if (location.state) {
              setFormData(prev => ({
                ...prev,
                firstName: location.state.firstName || '',
                lastName: location.state.lastName || '',
                dob: location.state.dob || '',
                gender: location.state.gender || 'Male',
              }));
            }
          }
        })();
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching profile snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, navigate, id, authProfile]);

  const calculateAge = (dobString: string) => {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'contactNumber' || name === 'parentsContact' || name === 'maternalUnclePhone') {
      const numericOnly = value.replace(/[^\d]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericOnly }));
      return;
    }

    if (name.startsWith('pref_')) {
      const prefName = name.replace('pref_', '');
      setFormData(prev => ({
        ...prev,
        partnerPreferences: {
          ...prev.partnerPreferences,
          [prefName]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 10MB' });
      return;
    }

    if (formData.photoUrl && formData.additionalPhotos && formData.additionalPhotos.length >= 2) {
      setMessage({ type: 'error', text: 'You can only upload up to 3 photos.' });
      return;
    }

    setUploadingImage(true);
    setMessage({ type: '', text: '' });

    try {
      const base64Image = await compressImage(file);
      if (!formData.photoUrl) {
        setFormData(prev => ({ ...prev, photoUrl: base64Image }));
      } else {
        setFormData(prev => ({ ...prev, additionalPhotos: [...(prev.additionalPhotos || []), base64Image] }));
      }
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    if (index === -1) {
      if (formData.additionalPhotos && formData.additionalPhotos.length > 0) {
        const newAdditional = [...formData.additionalPhotos];
        const newMain = newAdditional.shift()!;
        setFormData(prev => ({ ...prev, photoUrl: newMain, additionalPhotos: newAdditional }));
      } else {
        setFormData(prev => ({ ...prev, photoUrl: '' }));
      }
    } else {
      const newAdditional = [...(formData.additionalPhotos || [])];
      newAdditional.splice(index, 1);
      setFormData(prev => ({ ...prev, additionalPhotos: newAdditional }));
    }
  };

  const setMainPhoto = (index: number) => {
    if (index >= 0 && formData.additionalPhotos && formData.additionalPhotos.length > index) {
      const currentMain = formData.photoUrl;
      const newMain = formData.additionalPhotos[index];
      const newAdditional = [...formData.additionalPhotos];
      newAdditional[index] = currentMain;
      setFormData(prev => ({ ...prev, photoUrl: newMain, additionalPhotos: newAdditional }));
    }
  };

  const addSibling = () => {
    setSiblings([...siblings, { name: '', type: '', occupation: '', maritalStatus: '' }]);
  };

  const updateSibling = (index: number, field: string, value: string) => {
    const newSiblings = [...siblings];
    newSiblings[index] = { ...newSiblings[index], [field]: value };
    setSiblings(newSiblings);
  };

  const removeSibling = (index: number) => {
    setSiblings(siblings.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    const focusAndHighlightElement = (fieldName: string) => {
      setTimeout(() => {
        const element = (document.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName)) as HTMLElement;
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-red-400', 'border-red-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-red-400', 'border-red-500');
          }, 4000);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    };
    
    try {
      // 1. Mandatory Fields Validation
      for (const field of MANDATORY_PROFILE_FIELDS) {
        let val = formData[field.key as keyof typeof formData];
        if (field.key === 'education') {
          val = formData.education || formData.highestEducation || formData.customEducation || formData.degreeDetails;
        } else if (field.key === 'gotraKul') {
          val = formData.gotraKul || (formData as any).gotra;
        }

        if (!val || String(val).trim() === '') {
          const fieldLabel = field.key === 'education' ? 'Education' : t(`profile.${field.key}`, field.label);
          const errMsg = `Please fill in required field: ${fieldLabel}`;
          setMessage({ type: 'error', text: errMsg });
          setSaving(false);
          focusAndHighlightElement(field.key === 'education' ? 'highestEducation' : field.key);
          return;
        }
      }

      // 2. Strict Phone Validation for Contact Number (auto-fallback to user's registered phone)
      const contactPhoneInput = formData.contactNumber || user?.phoneNumber || (user as any)?.phone || (authProfile as any)?.phoneNumber || '';
      const phoneResult = validateAndFormatPhone(contactPhoneInput);
      if (!phoneResult.isValid) {
        const errMsg = `Contact Number error: ${phoneResult.error || 'Must be a valid 10-digit mobile number.'}`;
        setMessage({ type: 'error', text: errMsg });
        setSaving(false);
        focusAndHighlightElement('contactNumber');
        return;
      }

      // 3. Strict Validation for Mandatory Parents Contact
      if (!formData.parentsContact || !formData.parentsContact.trim()) {
        setMessage({ type: 'error', text: "Please enter Parents' Contact Number (Required)." });
        setSaving(false);
        focusAndHighlightElement('parentsContact');
        return;
      }
      const parentsPhoneResult = validateAndFormatPhone(formData.parentsContact);
      if (!parentsPhoneResult.isValid) {
        setMessage({ type: 'error', text: `Parents' Contact error: ${parentsPhoneResult.error || "Parents' contact number must be a valid 10-digit mobile number."}` });
        setSaving(false);
        focusAndHighlightElement('parentsContact');
        return;
      }
      const formattedParentsContact = parentsPhoneResult.formatted;

      // 4. Strict Validation for Address
      if (!formData.address || !formData.address.trim()) {
        setMessage({ type: 'error', text: "Please enter Address (Required)." });
        setSaving(false);
        focusAndHighlightElement('address');
        return;
      }

      // 5. Strict Validation for Partner Expectations
      if (!formData.partnerExpectations || !formData.partnerExpectations.trim()) {
        setMessage({ type: 'error', text: "Please describe your Partner Expectations (Required)." });
        setSaving(false);
        focusAndHighlightElement('partnerExpectations');
        return;
      }

      let formattedUnclePhone = '';
      if (formData.maternalUnclePhone && formData.maternalUnclePhone.trim()) {
        const ucDigits = formData.maternalUnclePhone.replace(/[^\d]/g, '');
        if (ucDigits.length >= 10) {
          formattedUnclePhone = `+91 ${ucDigits.slice(-10)}`;
        } else if (ucDigits.length > 0) {
          setMessage({ type: 'error', text: "Mama's contact number must be a valid 10-digit mobile number." });
          setSaving(false);
          focusAndHighlightElement('maternalUnclePhone');
          return;
        }
      }

      const age = calculateAge(formData.dob);
      if (age < 18) {
        setMessage({ type: 'error', text: "Date of Birth error: You must be at least 18 years old to register." });
        setSaving(false);
        focusAndHighlightElement('dob');
        return;
      }

      const targetUid = id && authProfile?.role === 'admin' ? id : user.uid;
      const isAdminEditing = id && authProfile?.role === 'admin';

      const syncedEducation = formData.highestEducation === 'Others' 
        ? (formData.customEducation || formData.degreeDetails || 'Graduate')
        : `${formData.highestEducation}${formData.degreeDetails ? ` - ${formData.degreeDetails}` : ''}`;

      // Apply intelligent capitalization
      const profileData: any = {
        ...formData,
        firstName: capitalizeWords(formData.firstName),
        middleName: capitalizeWords(formData.middleName),
        lastName: capitalizeWords(formData.lastName),
        fatherName: capitalizeWords(formData.fatherName),
        motherName: capitalizeWords(formData.motherName),
        location: capitalizeWords(formData.location),
        nativePlace: capitalizeWords(formData.nativePlace),
        birthplace: capitalizeWords(formData.birthplace),
        maternalUncleName: capitalizeWords(formData.maternalUncleName),
        maternalUnclePlace: capitalizeWords(formData.maternalUnclePlace),
        parentsHometown: capitalizeWords(formData.parentsHometown),
        education: syncedEducation,
        highestEducation: formData.highestEducation || 'B.E. / B.Tech.',
        income: formData.income || 'Prefer not to say',
        contactNumber: phoneResult.formatted,
        parentsContact: formattedParentsContact,
        maternalUnclePhone: formattedUnclePhone,
        uid: targetUid,
        age,
        siblings: JSON.stringify(siblings.filter(s => s.name.trim() !== '')),
        status: originalStatus || 'approved',
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      if (originalIsFeatured !== null) {
        profileData.isFeatured = originalIsFeatured;
      }

      const docRef = doc(db, 'profiles', targetUid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        profileData.createdAt = originalCreatedAt || new Date().toISOString();
        await updateDoc(docRef, profileData);
      } else {
        await setDoc(docRef, {
          ...profileData,
          createdAt: new Date().toISOString()
        });
      }
      
      setFormData({
        ...profileData,
        contactNumber: phoneResult.raw10
      });
      setMessage({ type: 'success', text: isAdminEditing ? 'Profile updated successfully!' : 'Profile saved successfully!' });
      
      // Re-enable floating membership notification if not already subscribed
      sessionStorage.removeItem('nashik_membership_prompt_dismissed');

      setIsEditing(false);
      
      const totalPhotosUploaded = (profileData.photoUrl ? 1 : 0) + (profileData.additionalPhotos ? profileData.additionalPhotos.length : 0);
      if (totalPhotosUploaded === 0) {
        setShowUploadPromptModal(true);
      } else {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      let errMsg = error.message || 'Failed to save profile.';
      if (errMsg.includes('permission') || errMsg.includes('Missing or insufficient')) {
        errMsg = 'Permission error saving profile. Please ensure all required fields are correctly completed.';
      }
      setMessage({ type: 'error', text: errMsg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestAccountDeletion = async () => {
    if (!user) return;
    setRequestingDeletion(true);
    try {
      const pRef = doc(db, 'profiles', user.uid);
      const uRef = doc(db, 'users', user.uid);

      const nowIso = new Date().toISOString();
      await updateDoc(pRef, {
        deletionRequested: true,
        deletionReason: deletionReason.trim() || 'No reason provided',
        deletionRequestedAt: nowIso,
        deletionDate: nowIso,
        status: 'deletion_pending'
      });

      await updateDoc(uRef, {
        deletionRequested: true,
        deletionDate: nowIso
      });

      sendAccountNotification('deletion_request', {
        userName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.contactNumber,
        reason: deletionReason
      });

      setMessage({ type: 'success', text: 'Account deletion request submitted to Admin successfully.' });
      setIsDeleteModalOpen(false);
      setToast({ type: 'success', text: 'Deletion request submitted to Admin for review.' });
    } catch (err: any) {
      console.error("Error submitting deletion request:", err);
      setToast({ type: 'error', text: err.message || 'Failed to submit deletion request.' });
    } finally {
      setRequestingDeletion(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const pRef = doc(db, 'profiles', user.uid);
      const uRef = doc(db, 'users', user.uid);

      await updateDoc(pRef, {
        deletionRequested: false,
        deletionReason: '',
        status: 'approved'
      });

      await updateDoc(uRef, {
        deletionRequested: false
      });

      setToast({ type: 'success', text: 'Account deletion request cancelled.' });
    } catch (err: any) {
      console.error("Error cancelling deletion request:", err);
      setToast({ type: 'error', text: 'Failed to cancel deletion request.' });
    }
  };

  const handleRecoverProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const targetUid = id && authProfile?.role === 'admin' ? id : user.uid;
      const pRef = doc(db, 'profiles', targetUid);
      const uRef = doc(db, 'users', targetUid);

      await updateDoc(pRef, {
        status: 'approved',
        isArchived: false,
        archivedAt: null,
        deletionRequested: false,
        updatedAt: new Date().toISOString()
      });

      try {
        await updateDoc(uRef, {
          deletionRequested: false
        });
      } catch (e) {
        console.warn("Could not update user doc on profile recovery:", e);
      }

      setFormData(prev => ({
        ...prev,
        status: 'approved',
        isArchived: false,
        archivedAt: null
      }));

      setMessage({
        type: 'success',
        text: '🎉 Profile recovered successfully! Your profile is active and visible on Nashik Teli Samaj Matrimony.'
      });
      setToast({ type: 'success', text: 'Profile recovered and brought back online!' });
    } catch (error: any) {
      console.error("Error recovering profile:", error);
      setMessage({ type: 'error', text: 'Failed to recover profile: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <FloatingToast 
        message={message.text ? { type: message.type as any, text: message.text } : null} 
        onClose={() => setMessage({ type: '', text: '' })} 
      />

      {/* Floating Modal for Mandatory Profile Completion */}
      {authProfile?.role !== 'admin' && (
        <CompleteProfileModal
          isOpen={!isProfileComplete && !isCompletionModalDismissed}
          onClose={() => setIsCompletionModalDismissed(true)}
          onStartCompleting={() => {
            setIsCompletionModalDismissed(true);
            setIsEditing(true);
            setTimeout(() => {
              const el = document.getElementById('mandatory-fields-section') || document.querySelector('form');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          missingFields={missingMandatoryFields}
          completedCount={profileCompletenessResult?.completedCount || 0}
          totalCount={profileCompletenessResult?.totalCount || MANDATORY_PROFILE_FIELDS.length}
          percentage={profileCompletenessResult?.percentage || 0}
        />
      )}

      {/* Upload Photos Prompt Modal */}
      <UploadPhotosPromptModal
        isOpen={showUploadPromptModal}
        onClose={() => setShowUploadPromptModal(false)}
        onUploadNow={() => {
          setIsEditing(true);
          setTimeout(() => {
            const el = document.getElementById('photo-upload') || fileInputRef.current;
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (typeof el.click === 'function') el.click();
            }
          }, 200);
        }}
        photosCount={(formData.photoUrl ? 1 : 0) + (formData.additionalPhotos ? formData.additionalPhotos.length : 0)}
      />

      {/* Prominent Banner when Profile is Incomplete */}
      {authProfile?.role !== 'admin' && !isProfileComplete && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-saffron/50 p-6 rounded-3xl mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-saffron text-white rounded-2xl shrink-0 mt-0.5 shadow-md">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Mandatory Profile Completion Required
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed">
                  Please complete all mandatory details below to get better matches and unlock full access to Home, Profile Search, and Matching pages.
                </p>
                {missingMandatoryFields.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Remaining Mandatory Details ({missingMandatoryFields.length}):</span>
                    {missingMandatoryFields.map(f => (
                      <span key={f.key} className="bg-white border border-amber-300 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                        {f.label} *
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setTimeout(() => {
                    const el = document.getElementById('mandatory-fields-section') || document.querySelector('form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="bg-saffron hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-saffron/20 transition-all text-sm whitespace-nowrap self-stretch md:self-auto active:scale-95"
              >
                Complete Profile Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Admin User Account Card */}
      {authProfile?.role === 'admin' && !id && (
        <div className="bg-stone-900 text-white rounded-3xl p-8 mb-8 shadow-xl border border-gold/30">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-8 w-8 text-saffron" />
            <div>
              <h2 className="text-2xl font-serif font-bold text-gold">Administrator Portal Account</h2>
              <p className="text-xs text-stone-300">Logged in as System Administrator &bull; {user?.email}</p>
            </div>
          </div>
          <p className="text-sm text-stone-300 mb-6 leading-relaxed">
            As an Administrator, you can review pending member registrations, manage user profiles, and view contact queries.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/admin" className="bg-saffron hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md text-sm transition-all">
              Open Admin Control Portal
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            {id && authProfile?.role === 'admin' 
              ? 'Edit Member Profile' 
              : (authProfile?.role === 'admin' ? t('profile.adminProfileTitle', 'My Profile') : t('profile.title', 'My Matrimonial Profile'))}
          </h1>
          <div className="bg-saffron text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold font-mono inline-flex items-center gap-1.5 shadow-md shrink-0 w-fit">
            <ShieldCheck className="w-4 h-4 text-amber-200" />
            <span>ID:</span>
            <span className="font-black tracking-wide">{(formData as any).vaduVarNumber || formData.profileId || getDisplayProfileId(formData)}</span>
          </div>
        </div>
        
        {originalCreatedAt && (
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'preview' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'account' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                <User className="w-4 h-4" />
                Account Details
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'favorites' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                <Heart className="w-4 h-4" />
                Favorites
              </button>
            </div>
            <Link
              to={`/profile/${targetUid}`}
              className="px-4 py-2 bg-saffron/10 text-saffron rounded-xl text-sm font-bold hover:bg-saffron/20 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Public View
            </Link>
          </div>
        )}
      </div>

      {/* Account Details View */}
      {!isEditing && activeTab === 'account' && (
        <div className="bg-white rounded-3xl p-8 border-2 border-stone-200/80 shadow-md space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-100 pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-50 text-saffron rounded-2xl">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {formData.firstName} {formData.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-md">UID: {targetUid}</span>
                  <span className="text-xs font-mono font-bold bg-saffron/10 text-saffron px-2.5 py-0.5 rounded-md border border-saffron/30">
                    ID: {(formData as any).vaduVarNumber || formData.profileId || getDisplayProfileId(formData)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2.5 bg-saffron text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-md flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-all border border-red-200 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Delete Account
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
              <span className="text-stone-400 font-bold text-xs uppercase block">Matrimonial Profile ID (Vadu / Var ID)</span>
              <span className="font-mono font-black text-saffron text-lg block">
                {(formData as any).vaduVarNumber || formData.profileId || getDisplayProfileId(formData)}
              </span>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
              <span className="text-stone-400 font-bold text-xs uppercase block">Registered Email</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">{formData.email || user?.email || 'Not Provided'}</span>
                {formData.email || user?.email ? (
                  formData.isEmailVerified ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">Unverified</span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddEmailModalOpen(true)}
                    className="bg-saffron hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    + Add Email
                  </button>
                )}
              </div>
              {(!formData.email && !user?.email) && (
                <div className="pt-1">
                  <p className="text-xs text-amber-700 font-medium">No email address is linked. Click above to add an email.</p>
                </div>
              )}
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
              <span className="text-stone-400 font-bold text-xs uppercase block">Registered Mobile (Marriage Contact)</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">
                  {formData.contactNumber ? `+91 ${formData.contactNumber}` : 'N/A'}
                </span>
                {formData.isPhoneVerified ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="bg-stone-200 text-stone-700 text-xs px-2.5 py-1 rounded-full font-bold">SMS Mobile</span>
                )}
              </div>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
              <span className="text-stone-400 font-bold text-xs uppercase block">Account Status</span>
              <span className={`inline-block font-bold text-xs px-3 py-1 rounded-full uppercase ${
                formData.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {formData.status || 'Approved'}
              </span>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
              <span className="text-stone-400 font-bold text-xs uppercase block">Registration Date</span>
              <span className="font-bold text-stone-900">
                {originalCreatedAt ? new Date(originalCreatedAt).toLocaleDateString('en-GB') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Dedicated Membership & Subscription Section */}
          {(() => {
            const subInfo = getSubscriptionDetails(formData);
            const isSelfOrAdmin = targetUid === user?.uid || authProfile?.role === 'admin';

            return (
              <div className="mt-8 pt-6 border-t border-stone-200 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-saffron rounded-2xl border border-amber-300">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-serif font-bold text-stone-900">
                        Membership & Subscription Details
                      </h4>
                      <p className="text-xs text-stone-500">
                        Official Nashik Teli Samaj Matrimony Annual Subscription Status
                      </p>
                    </div>
                  </div>

                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${subInfo.badgeColor}`}>
                    <ShieldCheck className="w-4 h-4" />
                    {subInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-stone-400 font-bold text-[11px] uppercase block">Subscription Plan</span>
                    <span className="font-bold text-stone-900 block text-base">Annual Matrimony Plan</span>
                    <span className="text-xs text-saffron font-bold">₹{ANNUAL_SUBSCRIPTION_PRICE} / Year</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-stone-400 font-bold text-[11px] uppercase block">Start Date</span>
                    <span className="font-bold text-stone-900 block">{subInfo.startDate || 'Not Subscribed'}</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-stone-400 font-bold text-[11px] uppercase block">Expiry Date</span>
                    <span className="font-bold text-stone-900 block">{subInfo.endDate || 'Not Subscribed'}</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-stone-400 font-bold text-[11px] uppercase block">Days Remaining</span>
                    <span className={`font-bold block ${subInfo.isActive ? 'text-emerald-700' : 'text-stone-500'}`}>
                      {subInfo.isActive ? `${subInfo.daysRemaining} Days` : 'Expired / Inactive'}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-stone-400 font-bold text-[11px] uppercase block">Payment Status</span>
                    <span className={`font-bold uppercase text-xs px-2.5 py-0.5 rounded-md inline-block ${
                      formData.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {formData.paymentStatus || (subInfo.isActive ? 'Paid' : 'Unpaid')}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-stone-400 font-bold text-[11px] uppercase block">Transaction / Order ID</span>
                    <span className="font-mono text-xs font-bold text-stone-700 truncate block">
                      {formData.paymentId || formData.razorpayOrderId || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Member / Admin Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-500 max-w-md">
                    An active membership unlocks direct family mobile numbers, WhatsApp contact options, and priority match proposals across the portal.
                  </p>

                  <div className="flex items-center gap-3">
                    <Link
                      to="/subscription"
                      className="px-5 py-2.5 bg-saffron hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      {subInfo.isActive ? 'Renew / View Subscription' : 'Upgrade / Subscribe Now (₹799)'}
                    </Link>

                    {/* Admin Manual Override Controls */}
                    {authProfile?.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setSaving(true);
                              await activateSubscriptionInFirestore(
                                targetUid,
                                {
                                  success: true,
                                  transactionId: `ADMIN_GRANT_${Date.now()}`,
                                  orderId: `ADMIN_ORD_${Date.now()}`,
                                  amount: 799,
                                  currency: 'INR',
                                  provider: 'admin_manual',
                                  paymentDate: new Date().toISOString(),
                                  message: 'Manually granted by Administrator'
                                },
                                'admin',
                                (formData as any).vaduVarNumber || formData.profileId
                              );
                              setToast({ type: 'success', text: '1-Year Subscription manually granted to member!' });
                            } catch (err: any) {
                              setToast({ type: 'error', text: err.message || 'Failed to grant subscription.' });
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          {subInfo.isActive ? 'Extend 1 Year (Admin)' : 'Grant Subscription (Admin)'}
                        </button>

                        {subInfo.isActive && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setSaving(true);
                                await deactivateSubscriptionInFirestore(targetUid, 'Cancelled by Administrator');
                                setToast({ type: 'success', text: 'Subscription revoked by Administrator.' });
                              } catch (err: any) {
                                setToast({ type: 'error', text: err.message || 'Failed to revoke subscription.' });
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all border border-red-200"
                          >
                            Revoke Membership
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {(((formData as any).isArchived || formData.status === 'archived')) && (
        <div className="bg-red-600 text-white p-6 rounded-3xl mb-8 shadow-2xl border-2 border-red-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-2xl shrink-0 mt-1">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-white">Profile Archived / Scheduled For Deletion</h3>
              <p className="text-sm text-white/95 mt-1 font-medium leading-relaxed">
                Your profile was archived on {((formData as any).archivedAt ? new Date((formData as any).archivedAt) : new Date()).toLocaleDateString()}. It is currently hidden from search and other members.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRecoverProfile}
            disabled={saving}
            className="px-6 py-3.5 bg-white text-red-700 font-bold text-sm rounded-2xl hover:bg-red-50 transition-all shadow-xl shrink-0 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 text-red-600" />
            {saving ? 'Recovering...' : 'Recover My Profile'}
          </button>
        </div>
      )}

      {((formData as any).deletionRequested || formData.status === 'deletion_pending') && (
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-base">Account Deletion Pending Review</h4>
              <p className="text-xs text-amber-800 font-medium">
                You have submitted an account removal request.
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="bg-amber-200 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  ⏱️ {(() => {
                    const dDate = (formData as any).deletionDate || (formData as any).deletionRequestedAt || (formData as any).archivedAt;
                    if (!dDate) return '30 / 30 Days Remaining';
                    const passed = Math.floor((Date.now() - new Date(dDate).getTime()) / (1000 * 60 * 60 * 24));
                    const rem = Math.max(0, 30 - passed);
                    return `${rem} / 30 Days Remaining`;
                  })()}
                </span>
                <span className="text-[11px] text-amber-700">Decreasing automatically day by day</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleCancelDeletionRequest}
            className="px-4 py-2 bg-white text-amber-900 font-bold text-xs rounded-xl border border-amber-300 hover:bg-amber-100 transition-all shadow-xs shrink-0"
          >
            Cancel Request
          </button>
        </div>
      )}
      
      {message.text && (
        <div className={`p-4 rounded-lg mb-8 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {!isEditing && activeTab === 'preview' && originalCreatedAt && (
        <ProfilePreview 
          profile={formData} 
          onEdit={(section) => {
            setIsEditing(true);
            setEditSection(section);
          }} 
        />
      )}

      {!isEditing && activeTab === 'favorites' && originalCreatedAt && (
        <FavoritesList favoriteIds={formData.favorites || []} />
      )}

      {isEditing && (
        <div className={originalCreatedAt ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" : "bg-baarat-overlay min-h-screen py-12 px-4"}>
          <div className={originalCreatedAt ? "bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6 border-2 border-saffron/20" : "max-w-4xl mx-auto"}>
            {originalCreatedAt && (
              <div className="sticky top-0 bg-white pb-4 mb-4 border-b border-stone-100 flex justify-between items-center z-10">
                <h2 className="text-xl font-serif font-bold text-stone-800">Edit Profile</h2>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-stone-100 hover:bg-saffron/10 text-stone-800 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className={`space-y-8 ${!originalCreatedAt ? 'bg-white/95 p-8 rounded-3xl shadow-2xl border-2 border-saffron/20 backdrop-blur-md' : ''}`}>
              {message.text && message.type === 'error' && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-sm font-bold flex-1">{message.text}</span>
                  <button type="button" onClick={() => setMessage({ type: '', text: '' })} className="text-red-600 hover:text-red-900 font-bold text-xs underline">Dismiss</button>
                </div>
              )}

        {/* Profile Photo */}
        {(!editSection || editSection === 'photos') && (
        <div id="photos">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Profile Photos (Max 3)</h2>
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-32 w-32 rounded-3xl overflow-hidden bg-stone-100 border-4 border-white shadow-md flex-shrink-0">
                {formData.photoUrl ? (
                  <>
                    <img src={formData.photoUrl} alt="Main Profile" className="h-full w-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removePhoto(-1)}
                      className="absolute top-0 right-0 bg-maroon text-white p-1 rounded-bl-lg hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-saffron text-white text-[10px] text-center py-0.5 font-bold">
                      MAIN
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-stone-300">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
              </div>
            </div>

            {formData.additionalPhotos?.map((photo, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-stone-100 border-2 border-white shadow-sm flex-shrink-0 mt-4">
                  <img src={photo} alt={`Additional ${index + 1}`} className="h-full w-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removePhoto(index)}
                    className="absolute top-0 right-0 bg-maroon text-white p-1 rounded-bl-lg hover:bg-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMainPhoto(index)}
                  className="text-xs text-saffron hover:text-orange-600 font-bold"
                >
                  Set as Main
                </button>
              </div>
            ))}

            {(!formData.photoUrl || (formData.additionalPhotos && formData.additionalPhotos.length < 2)) && (
              <div className="mt-8">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  ref={fileInputRef}
                  className="hidden" 
                  id="photo-upload"
                />
                <label 
                  htmlFor="photo-upload" 
                  className={`cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${uploadingImage ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-saffron text-white hover:bg-orange-600 active:scale-95'}`}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                </label>
                <p className="text-xs text-stone-500 mt-2 font-medium">JPG, PNG or GIF. Max size 10MB.</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Personal Details */}
        {(!editSection || editSection === 'personal') && (
        <div id="personal">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">{t('profile.personalInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Title / Prefix</label>
              <select name="titlePrefix" value={formData.titlePrefix} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all">
                <option value="">None</option>
                {TITLE_PREFIXES.map(prefix => (
                  <option key={prefix} value={prefix}>{prefix}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.firstName')} *</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Middle Name</label>
              <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.lastName')} *</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.gender')} *</label>
              <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.dob')} *</label>
              <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.timeOfBirth')} *</label>
              <input type="time" name="timeOfBirth" value={formData.timeOfBirth} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.birthplace')}</label>
              <input type="text" name="birthplace" value={formData.birthplace} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" placeholder="City, State" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.height')} *</label>
              <input 
                required 
                type="text" 
                name="height" 
                placeholder="e.g. 5'4 (displays as 5ft 4inc)" 
                value={formData.height} 
                onChange={handleChange} 
                onBlur={(e) => {
                  const formatted = formatHeightInput(e.target.value);
                  setFormData((prev: any) => ({ ...prev, height: formatted }));
                }}
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
              />
              <p className="text-[11px] text-stone-500 mt-1">Type e.g. 5'4 or 54 or 5.4. Displays as 5ft 4inc.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.maritalStatus')} *</label>
              <select required name="maritalStatus" value={formData.maritalStatus || ''} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all">
                <option value="">-- Select Marital Status --</option>
                <option value="Unmarried">Unmarried</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.gotraKul')} *</label>
              <input required type="text" name="gotraKul" value={formData.gotraKul} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Manglik Status *</label>
              <select required name="isManglik" value={formData.isManglik || ''} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all">
                <option value="">-- Select Manglik Status --</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Don't Know">Don't Know</option>
                <option value="Anshik">Anshik (Partial)</option>
              </select>
            </div>
          </div>
        </div>
        )}

        {/* Professional & Location */}
        {(!editSection || editSection === 'education') && (
        <div id="education">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Education & Career</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Highest Education Level *</label>
              <select 
                required 
                name="highestEducation" 
                value={formData.highestEducation || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all font-medium"
              >
                <option value="">-- Select Highest Education Level --</option>
                {HIGHEST_EDUCATION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {(formData.highestEducation === 'Others' || formData.highestEducation === 'Other') && (
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Custom Education Degree *</label>
                <input 
                  type="text" 
                  name="customEducation" 
                  placeholder="Specify custom qualification" 
                  value={formData.customEducation || ''} 
                  onChange={handleChange} 
                  className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Degree / Specialization</label>
              <input 
                type="text" 
                name="degreeDetails" 
                placeholder="e.g., Computer Science" 
                value={formData.degreeDetails || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">University / Institute</label>
              <input 
                type="text" 
                name="university" 
                placeholder="e.g., Pune University" 
                value={formData.university || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Profession *</label>
              <input required type="text" name="profession" placeholder="e.g., Software Engineer" value={formData.profession} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Company Name</label>
              <input type="text" name="companyName" placeholder="e.g., Google" value={formData.companyName} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Annual Income</label>
              <input 
                type="text" 
                name="income" 
                placeholder="e.g., ₹6 - 8 Lakhs / year, 12 LPA, 50,000 / month" 
                value={formData.income || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all font-medium" 
              />
              <p className="text-[11px] text-stone-400 mt-1">Enter free text or package (e.g. 6-8 LPA, ₹5,00,000/yr)</p>
            </div>
          </div>
        </div>
        )}

        {/* Location & Roots */}
        {(!editSection || editSection === 'location') && (
        <div id="location">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Location & Roots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Current Location *</label>
              <input required type="text" name="location" placeholder="e.g., Pune, Maharashtra" value={formData.location} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Native Place *</label>
              <input required type="text" name="nativePlace" placeholder="e.g., Nashik" value={formData.nativePlace} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
          </div>
        </div>
        )}

        {/* Family Details */}
        {(!editSection || editSection === 'family') && (
        <div id="family">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Family Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Father's Name *</label>
              <div className="flex gap-2">
                <select 
                  name="fatherTitle" 
                  value={(formData as any).fatherTitle || 'Mr.'} 
                  onChange={handleChange}
                  className="border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white text-sm font-bold shrink-0"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Late">Late</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Er.">Er.</option>
                  <option value="Shri">Shri</option>
                </select>
                <input 
                  required 
                  type="text" 
                  name="fatherName" 
                  placeholder="Father's Full Name"
                  value={formData.fatherName} 
                  onChange={handleChange} 
                  className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Mother's Name *</label>
              <div className="flex gap-2">
                <select 
                  name="motherTitle" 
                  value={(formData as any).motherTitle || 'Mrs.'} 
                  onChange={handleChange}
                  className="border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white text-sm font-bold shrink-0"
                >
                  <option value="Mrs.">Mrs.</option>
                  <option value="Smt.">Smt.</option>
                  <option value="Late">Late</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
                <input 
                  required 
                  type="text" 
                  name="motherName" 
                  placeholder="Mother's Full Name"
                  value={formData.motherName} 
                  onChange={handleChange} 
                  className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Parents' Hometown</label>
              <input type="text" name="parentsHometown" value={formData.parentsHometown} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Parents' Occupation / Company</label>
              <input type="text" name="fatherOccupationCompany" placeholder="e.g. Business / Government Service" value={(formData as any).fatherOccupationCompany || formData.parentsOccupation || ''} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Parents' Contact Details *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold text-stone-500 text-sm bg-stone-100 px-2 py-1 rounded-md border border-stone-200">+91</span>
                <input 
                  required 
                  type="tel" 
                  name="parentsContact" 
                  value={formData.parentsContact} 
                  onChange={handleChange} 
                  className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 pl-16 border transition-all" 
                  placeholder="9876543210 (10 digits)" 
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">10-digit mobile number for family communication.</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-stone-700">Sibling Details (Optional)</label>
              <button type="button" onClick={addSibling} className="text-sm text-saffron font-bold hover:text-orange-600">
                + Add Sibling
              </button>
            </div>
            {siblings.map((sibling, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 bg-stone-50 p-4 rounded-2xl relative border border-stone-100">
                <button type="button" onClick={() => removeSibling(index)} className="absolute top-2 right-2 text-stone-400 hover:text-maroon">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-stone-500 mb-1">Name</label>
                  <input type="text" value={sibling.name} onChange={(e) => updateSibling(index, 'name', e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border text-sm transition-all" placeholder="Sibling's Name" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-stone-500 mb-1">Type</label>
                  <select value={sibling.type} onChange={(e) => updateSibling(index, 'type', e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border text-sm bg-white transition-all">
                    <option value="">-- Select Type --</option>
                    <option value="Elder Brother">Elder Brother</option>
                    <option value="Younger Brother">Younger Brother</option>
                    <option value="Elder Sister">Elder Sister</option>
                    <option value="Younger Sister">Younger Sister</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-stone-500 mb-1">Occupation</label>
                  <input type="text" value={sibling.occupation} onChange={(e) => updateSibling(index, 'occupation', e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border text-sm transition-all" placeholder="Occupation" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-stone-500 mb-1">Marital Status</label>
                  <select value={sibling.maritalStatus} onChange={(e) => updateSibling(index, 'maritalStatus', e.target.value)} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border text-sm bg-white transition-all">
                    <option value="">-- Select Marital Status --</option>
                    <option value="Unmarried">Unmarried</option>
                    <option value="Married">Married</option>
                  </select>
                </div>
              </div>
            ))}
            {siblings.length === 0 && (
              <p className="text-sm text-stone-500 italic">No siblings added.</p>
            )}
          </div>
        </div>
        )}

        {/* Maternal Uncle Details */}
        {(!editSection || editSection === 'uncle') && (
        <div id="uncle">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Maternal Uncle (Mama) Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Maternal Uncle Name</label>
              <input type="text" name="maternalUncleName" value={formData.maternalUncleName} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Maternal Uncle Gotra/Kul</label>
              <input type="text" name="maternalUncleGotraKul" value={formData.maternalUncleGotraKul} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Maternal Uncle Place</label>
              <input type="text" name="maternalUnclePlace" value={formData.maternalUnclePlace} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Maternal Uncle Phone</label>
              <input type="text" name="maternalUnclePhone" value={formData.maternalUnclePhone} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
          </div>
        </div>
        )}

        {/* Contact & Address */}
        {(!editSection || editSection === 'contact') && (
        <div id="contact">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Contact & Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Contact Number (For Marriage) *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold text-stone-500 text-sm bg-stone-100 px-2 py-1 rounded-md border border-stone-200">+91</span>
                <input 
                  type="tel" 
                  name="contactNumber" 
                  value={formData.contactNumber} 
                  onChange={handleChange} 
                  className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 pl-16 border transition-all" 
                  placeholder="9876543210 (10 digits)" 
                  required
                />
              </div>
              <p className="text-xs text-stone-400 mt-1 font-medium">Enter 10-digit mobile number. +91 will be added automatically.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Address *</label>
            <textarea 
              required 
              name="address" 
              rows={2} 
              value={formData.address} 
              onChange={handleChange} 
              className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
              placeholder="Complete residential address (Required)"
            ></textarea>
            <p className="text-[11px] text-stone-400 mt-1">Street, Area, City, State, Pincode.</p>
          </div>
        </div>
        )}

        {/* Partner Preferences */}
        {(!editSection || editSection === 'preferences') && (
        <div id="preferences">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Partner Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Preferred Birth Year (e.g. 1998)</label>
              <input 
                type="number" 
                min="1950" 
                max="2010" 
                name="pref_preferredBirthYear" 
                value={formData.partnerPreferences.preferredBirthYear || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                placeholder="e.g. 1998 — will match profiles born in 1998 or later" 
              />
              <p className="text-xs text-stone-400 mt-1 font-medium">Shows profiles born in this year or later (e.g. 1998 born & younger)</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-stone-700">Preferred Education</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    partnerPreferences: { ...prev.partnerPreferences, education: 'Any' }
                  }))}
                  className="text-[11px] font-bold text-saffron bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
                >
                  Set to "Any" (Match All)
                </button>
              </div>
              <input 
                type="text" 
                name="pref_education" 
                value={formData.partnerPreferences.education || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                placeholder="e.g., Any, Graduate, Engineering" 
              />
              <p className="text-[11px] text-stone-400 mt-1">Select or type <strong>"Any"</strong> to match all education qualifications.</p>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-stone-700">Preferred Location</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    partnerPreferences: { ...prev.partnerPreferences, location: 'Any' }
                  }))}
                  className="text-[11px] font-bold text-saffron bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
                >
                  Set to "Any" (Match All)
                </button>
              </div>
              <input 
                type="text" 
                name="pref_location" 
                value={formData.partnerPreferences.location || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                placeholder="e.g., Any, Nashik, Pune, Mumbai, Maharashtra" 
              />
              <p className="text-[11px] text-stone-400 mt-1">Select or type <strong>"Any"</strong> to match profiles across all locations.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Partner Expectations *</label>
            <textarea 
              required 
              name="partnerExpectations" 
              rows={3} 
              value={formData.partnerExpectations} 
              onChange={handleChange} 
              className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
              placeholder="Describe what qualities, education, family values, and lifestyle you expect in a life partner (Required)..."
            ></textarea>
            <p className="text-[11px] text-stone-400 mt-1">Mandatory field: Helps eligible candidates understand your preferences.</p>
          </div>
        </div>
        )}

        {message.text && message.type === 'error' && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-2xl flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm font-bold flex-1">{message.text}</span>
          </div>
        )}

        <div className="pt-6 border-t border-stone-100 flex justify-end gap-4">
          {originalCreatedAt && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-8 py-3 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="bg-maroon text-white px-10 py-3 rounded-xl font-bold hover:bg-red-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-stone-800">
            <div className="bg-emerald-500 rounded-full p-1">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">Success!</span>
              <span className="text-stone-400 text-xs">Your profile details have been saved.</span>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="ml-4 text-stone-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      {/* Account Deletion Request Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-red-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <Trash2 className="w-5 h-5" />
                <span>Request Account Deletion</span>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-4 leading-relaxed">
              Are you sure you want to request account deletion? Your profile will be reviewed by an admin and safely removed.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Reason for leaving (Optional)</label>
              <textarea 
                rows={3} 
                value={deletionReason} 
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="e.g. Found partner through Samaj / No longer needed"
                className="w-full border-stone-200 rounded-xl text-sm p-3 focus:border-red-500 focus:ring-red-200 border"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold text-xs hover:bg-stone-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestAccountDeletion}
                disabled={requestingDeletion}
                className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 shadow-md active:scale-95 disabled:opacity-50"
              >
                {requestingDeletion ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddEmailModal
        isOpen={isAddEmailModalOpen}
        onClose={() => setIsAddEmailModalOpen(false)}
        currentUid={user?.uid || ''}
        userName={`${formData.firstName} ${formData.lastName}`}
        onSuccess={(updatedEmail) => {
          setFormData(prev => ({ ...prev, email: updatedEmail, isEmailVerified: true }));
          setToast({ type: 'success', text: `Email address ${updatedEmail} added successfully!` });
        }}
      />
    </div>
  );
}
