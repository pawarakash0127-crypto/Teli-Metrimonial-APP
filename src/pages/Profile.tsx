import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, getDoc, setDoc, updateDoc, storage, ref, uploadBytes, getDownloadURL, collection, query, where, getDocs, onSnapshot } from '../lib/firebase';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Upload, X, MapPin, Briefcase, GraduationCap, Users, Phone, User, Heart, CheckCircle, ShieldCheck, AlertCircle, KeyRound, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageCarousel from '../components/ImageCarousel';
import { validateAndFormatPhone, MANDATORY_PROFILE_FIELDS } from '../lib/phoneUtils';
import { SAMPLE_ACCOUNTS } from '../lib/seedProfiles';
import FloatingToast, { ToastMessage } from '../components/FloatingToast';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { sendAccountNotification } from '../lib/notificationUtils';
import { HIGHEST_EDUCATION_CATEGORIES } from '../types';

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
              <h3 className="text-white font-serif font-bold text-xl">{profile.firstName} {profile.lastName}</h3>
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
              {profile.firstName} {profile.lastName}
            </h3>
            <div className="flex flex-wrap gap-2.5 mb-5">
              <span className="px-4 py-1.5 bg-saffron/10 text-saffron rounded-full text-sm font-bold">
                {profile.age} yrs • {profile.height}
              </span>
              <span className="px-4 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm font-bold">
                {profile.gender}
              </span>
              <span className="px-4 py-1.5 bg-maroon/10 text-maroon rounded-full text-sm font-bold">
                {profile.maritalStatus || 'Never Married'}
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
                    <p className="text-stone-900 font-bold text-lg">{profile.education || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <div className="w-6 h-6 flex items-center justify-center text-saffron font-bold text-xl">₹</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Annual Income</p>
                    <p className="text-stone-900 font-bold text-lg">{profile.income || 'N/A'}</p>
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
                          <span className="font-bold">{profile.fatherName}</span>
                        </p>
                      )}
                      {profile.motherName && (
                        <p className="text-stone-900 text-sm flex justify-between items-center">
                          <span className="text-stone-500 font-medium">Mother's Name</span>
                          <span className="font-bold">{profile.motherName}</span>
                        </p>
                      )}
                      {profile.parentsOccupation && (
                        <p className="text-stone-900 text-sm flex justify-between items-center">
                          <span className="text-stone-500 font-medium">Occupation</span>
                          <span className="font-bold">{profile.parentsOccupation}</span>
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
  const { user, profile: authProfile, loading: authLoading } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'preview' | 'favorites'>('preview');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [siblings, setSiblings] = useState<{name: string, type: string, occupation: string, maritalStatus: string}[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    timeOfBirth: '',
    birthplace: '',
    isManglik: 'No',
    height: '',
    highestEducation: 'Engineering',
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
    maritalStatus: 'Never Married',
    fatherTitle: 'Mr.',
    fatherName: '',
    motherTitle: 'Mrs.',
    motherName: '',
    parentsHometown: '',
    address: '',
    maternalUncleName: '',
    maternalUncleGotraKul: '',
    maternalUnclePlace: '',
    maternalUnclePhone: '',
    parentsOccupation: '',
    parentsContact: '',
    contactNumber: '',
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

    if (!user) return;
    const targetUid = id && authProfile?.role === 'admin' ? id : user.uid;
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

        setFormData(prev => ({
          ...prev,
          ...data,
          contactNumber: extract10Digits(data.contactNumber),
          parentsContact: extract10Digits(data.parentsContact),
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
        // Doc snap does not exist for targetUid. Check if there is profile data matching user's email
        (async () => {
          let foundData: any = null;
          if (user.email) {
            const userEmailLower = user.email.toLowerCase();
            // 1. Search Firestore profiles by email
            try {
              const q = query(collection(db, 'profiles'), where('email', '==', userEmailLower));
              const snap = await getDocs(q);
              if (!snap.empty) {
                foundData = snap.docs[0].data();
              }
            } catch (err) {
              console.error("Error searching profiles by email:", err);
            }

            // 2. Search SAMPLE_ACCOUNTS if not in Firestore
            if (!foundData) {
              const sample = SAMPLE_ACCOUNTS.find(a => a.email.toLowerCase() === userEmailLower);
              if (sample) {
                foundData = {
                  ...sample,
                  status: 'approved',
                  isFeatured: true,
                  createdAt: new Date().toISOString(),
                  partnerPreferences: {
                    ageMin: sample.age - 5 > 18 ? sample.age - 5 : 18,
                    ageMax: sample.age + 5,
                    education: '',
                    profession: '',
                    location: ''
                  }
                };
              }
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

    // Strict numeric filtering for phone numbers (max 10 digits)
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
          [prefName]: prefName === 'ageMin' || prefName === 'ageMax' ? parseInt(value) || 0 : value
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
        const val = formData[field.key as keyof typeof formData];
        if (!val || String(val).trim() === '') {
          const fieldLabel = t(`profile.${field.key}`, field.label);
          const errMsg = `Please fill in required field: ${fieldLabel}`;
          setMessage({ type: 'error', text: errMsg });
          setSaving(false);
          focusAndHighlightElement(field.key);
          return; // STOP submission immediately!
        }
      }

      // 2. Strict Phone Validation (+91 & 10 numeric digits)
      const phoneResult = validateAndFormatPhone(formData.contactNumber);
      if (!phoneResult.isValid) {
        const errMsg = `Contact Number error: ${phoneResult.error || 'Must be a valid 10-digit mobile number.'}`;
        setMessage({ type: 'error', text: errMsg });
        setSaving(false);
        focusAndHighlightElement('contactNumber');
        return; // STOP submission immediately!
      }

      // Format optional phones if entered
      let formattedParentsContact = '';
      if (formData.parentsContact && formData.parentsContact.trim()) {
        const pcDigits = formData.parentsContact.replace(/[^\d]/g, '');
        if (pcDigits.length >= 10) {
          formattedParentsContact = `+91 ${pcDigits.slice(-10)}`;
        } else if (pcDigits.length > 0) {
          setMessage({ type: 'error', text: "Parents' contact number must be a valid 10-digit mobile number." });
          setSaving(false);
          focusAndHighlightElement('parentsContact');
          return;
        }
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

      const syncedEducation = formData.degreeDetails 
        ? `${formData.degreeDetails}${formData.highestEducation ? ` (${formData.highestEducation})` : ''}` 
        : (formData.highestEducation || formData.education || '');

      // Clean up data before saving
      const profileData: any = {
        ...formData,
        education: syncedEducation,
        highestEducation: formData.highestEducation || 'Engineering',
        contactNumber: phoneResult.formatted,
        parentsContact: formattedParentsContact,
        maternalUnclePhone: formattedUnclePhone,
        uid: targetUid,
        age,
        siblings: JSON.stringify(siblings.filter(s => s.name.trim() !== '')),
        // Keep original status or default to approved so preference updates don't reset approved status
        status: originalStatus || 'approved',
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
      
      // Immediately update local form state so UI reflects instantly
      setFormData({
        ...profileData,
        contactNumber: phoneResult.raw10
      });
      setMessage({ type: 'success', text: isAdminEditing ? 'Profile updated successfully!' : 'Profile saved successfully! It is pending admin approval.' });
      
      setIsEditing(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      let errMsg = error.message || 'Failed to save profile.';
      if (errMsg.includes('permission') || errMsg.includes('Missing or insufficient')) {
        errMsg = 'Permission error saving profile. Please ensure all required fields (First Name, Last Name, Date of Birth, Gender, Contact Number) are correctly completed.';
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

      await updateDoc(pRef, {
        deletionRequested: true,
        deletionReason: deletionReason.trim() || 'No reason provided',
        deletionRequestedAt: new Date().toISOString(),
        status: 'deletion_pending'
      });

      await updateDoc(uRef, {
        deletionRequested: true
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
      {/* Floating Toast Notification */}
      <FloatingToast 
        message={message.text ? { type: message.type as any, text: message.text } : null} 
        onClose={() => setMessage({ type: '', text: '' })} 
      />

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
            As an Administrator, you do not need a personal matrimonial profile to manage the site. You can review pending member registrations, manage user profiles, and add admin users.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/admin" className="bg-saffron hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md text-sm transition-all">
              Open Admin Control Portal
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          {id && authProfile?.role === 'admin' 
            ? 'Edit Member Profile' 
            : (authProfile?.role === 'admin' ? t('profile.adminProfileTitle', 'My Profile') : t('profile.title', 'My Matrimonial Profile'))}
        </h1>
        
        {originalCreatedAt && (
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preview' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'favorites' ? 'bg-white text-saffron shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                <Heart className="w-4 h-4" />
                Favorites
              </button>
            </div>
            <Link
              to={`/profile/${user?.uid}`}
              className="px-5 py-2 bg-saffron/10 text-saffron rounded-xl text-sm font-medium hover:bg-saffron/20 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              View Public Profile
            </Link>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-stone-200 shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-saffron" />
              Change Password
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-red-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              Delete Account
            </button>
          </div>
        )}
      </div>

      {(((formData as any).isArchived || formData.status === 'archived')) && (
        <div className="bg-red-600 text-white p-6 rounded-3xl mb-8 shadow-2xl border-2 border-red-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-2xl shrink-0 mt-1">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-white">Profile Archived / Scheduled For Deletion</h3>
              <p className="text-sm text-white/95 mt-1 font-medium leading-relaxed">
                Your profile was archived on {((formData as any).archivedAt ? new Date((formData as any).archivedAt) : new Date()).toLocaleDateString()}. It is currently hidden from search and other members. You have <span className="font-extrabold underline text-amber-200">
                {Math.max(0, 30 - Math.floor((Date.now() - new Date((formData as any).archivedAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))} days remaining
                </span> to recover your profile before permanent removal.
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
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 p-5 rounded-2xl mb-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-base">Account Deletion Pending Review</h4>
              <p className="text-xs text-amber-800 font-medium">You have submitted an account removal request. An administrator will review and process it shortly.</p>
            </div>
          </div>
          <button 
            onClick={handleCancelDeletionRequest}
            className="px-4 py-2 bg-white text-amber-900 font-bold text-xs rounded-xl border border-amber-300 hover:bg-amber-100 transition-all shadow-xs"
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
            {/* Main Photo */}
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

            {/* Additional Photos */}
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

            {/* Upload Button */}
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
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.firstName')} *</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
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
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.timeOfBirth')}</label>
              <input type="time" name="timeOfBirth" value={formData.timeOfBirth} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.birthplace')}</label>
              <input type="text" name="birthplace" value={formData.birthplace} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" placeholder="City, State" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.height')} *</label>
              <input required type="text" name="height" placeholder="e.g., 5'8&quot;" value={formData.height} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">{t('profile.maritalStatus')} *</label>
              <select required name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all">
                <option value="Never Married">Never Married</option>
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
              <select required name="isManglik" value={formData.isManglik} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all">
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
                value={formData.highestEducation || 'Engineering'} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border bg-white transition-all font-medium"
              >
                {HIGHEST_EDUCATION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Degree / Specialization *</label>
              <input 
                required 
                type="text" 
                name="degreeDetails" 
                placeholder="e.g., B.E. Computer Science, B.Tech Electrical" 
                value={formData.degreeDetails || formData.education || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">University / Institute</label>
              <input 
                type="text" 
                name="university" 
                placeholder="e.g., Pune University, IIT Bombay" 
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
              <label className="block text-sm font-bold text-stone-700 mb-1">Annual Income *</label>
              <input required type="text" name="income" placeholder="e.g., 10-15 Lakhs" value={formData.income} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
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
              <label className="block text-sm font-bold text-stone-700 mb-1">Parents' Occupation</label>
              <input type="text" name="parentsOccupation" value={formData.parentsOccupation} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Parents' Contact Details</label>
              <input type="text" name="parentsContact" value={formData.parentsContact} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" />
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
            <label className="block text-sm font-bold text-stone-700 mb-1">Address</label>
            <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" placeholder="Complete address"></textarea>
          </div>
        </div>
        )}

        {/* Partner Preferences */}
        {(!editSection || editSection === 'preferences') && (
        <div id="preferences">
          <h2 className="text-xl font-serif font-bold text-maroon mb-4 border-b-2 border-saffron/20 pb-2">Partner Preferences (Optional)</h2>
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
              <label className="block text-sm font-bold text-stone-700 mb-1">Preferred Education</label>
              <input 
                type="text" 
                name="pref_education" 
                value={formData.partnerPreferences.education || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                placeholder="e.g., Graduate, Engineering, Any" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-stone-700 mb-1">Preferred Location</label>
              <input 
                type="text" 
                name="pref_location" 
                value={formData.partnerPreferences.location || ''} 
                onChange={handleChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" 
                placeholder="e.g., Nashik, Pune, Maharashtra, Any" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Partner Expectations</label>
            <textarea name="partnerExpectations" rows={3} value={formData.partnerExpectations} onChange={handleChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-3 border transition-all" placeholder="Describe what you are looking for in a partner..."></textarea>
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
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900">Request Account Deletion</h3>
            </div>
            
            <p className="text-sm text-stone-600 mb-4 leading-relaxed">
              Submitting an account deletion request will notify the system Administrator. Upon approval, your profile and personal data will be permanently deleted.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Reason for Deletion (Optional)
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="e.g., Found a life partner via Teli Samaj Matrimony, privacy preference..."
                className="w-full border-stone-200 rounded-xl p-3 text-sm border focus:ring-red-500 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestingDeletion}
                onClick={handleRequestAccountDeletion}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {requestingDeletion ? 'Submitting...' : 'Confirm Deletion Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
