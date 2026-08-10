import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, onSnapshot } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Briefcase, GraduationCap, User, Heart, ArrowLeft, ChevronLeft, ChevronRight, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  translateText, 
  formatDateOfBirth, 
  formatAgeDisplay, 
  formatHeightDisplay, 
  translateSiblingsList 
} from '../lib/profileTranslator';

interface ProfileData {
  uid: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  height: string;
  education: string;
  profession: string;
  income: string;
  location: string;
  nativePlace: string;
  gotraKul: string;
  maritalStatus: string;
  dob?: string;
  isManglik?: string;
  photoUrl?: string;
  additionalPhotos?: string[];
  timeOfBirth?: string;
  birthplace?: string;
  fatherName?: string;
  motherName?: string;
  parentsHometown?: string;
  address?: string;
  maternalUncleName?: string;
  maternalUncleGotraKul?: string;
  maternalUnclePlace?: string;
  maternalUnclePhone?: string;
  parentsOccupation?: string;
  parentsContact?: string;
  contactNumber?: string;
  siblings?: string;
  partnerExpectations?: string;
  status: string;
  partnerPreferences?: {
    ageMin?: number;
    ageMax?: number;
    education?: string;
    profession?: string;
    location?: string;
  };
}

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const currentLang = i18n.language || 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'mr' ? 'en' : 'mr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) return;
    setLoading(true);

    const docRef = doc(db, 'profiles', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ProfileData;
        setProfile(data);
      } else {
        console.error("Profile not found");
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to profile snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, navigate]);

  useEffect(() => {
    if (authProfile && profile) {
      setIsFavorite(authProfile.favorites?.includes(profile.uid) || false);
    }
  }, [authProfile, profile]);

  const toggleFavorite = async () => {
    if (!user || !authProfile || !profile) return;
    if (profile.uid === user.uid || profile.uid === authProfile.uid) {
      console.warn("Self-profile cannot be added to favorites.");
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentFavs = authProfile.favorites || [];
      let newFavs;
      
      if (isFavorite) {
        newFavs = currentFavs.filter(favId => favId !== profile.uid);
      } else {
        newFavs = [...currentFavs, profile.uid];
      }
      
      await updateDoc(userRef, { favorites: newFavs });
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const formatPhoneDisplay = (phone?: string) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length >= 10) {
      const last10 = cleanPhone.slice(-10);
      return `+91 - ${last10}`;
    }
    return phone;
  };

  if (loading) {
    return <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div></div>;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-stone-800">
          {currentLang === 'mr' ? 'प्रोफाईल आढळले नाही' : 'Profile not found'}
        </h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-saffron hover:text-maroon">
          {currentLang === 'mr' ? 'मागे जा' : 'Go Back'}
        </button>
      </div>
    );
  }

  const allPhotos = [profile.photoUrl, ...(profile.additionalPhotos || [])].filter(Boolean) as string[];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const siblingsList = translateSiblingsList(profile.siblings, currentLang);

  const renderSiblings = () => {
    if (!siblingsList || siblingsList.length === 0) return <p className="text-stone-600">{currentLang === 'mr' ? 'माहिती नाही' : 'None'}</p>;
    return (
      <ul className="list-disc pl-5 text-stone-600 space-y-1">
        {siblingsList.map((sib: any, idx: number) => (
          <li key={idx}>
            <span className="font-bold text-stone-800">{sib.name}</span>
            {sib.type && ` (${sib.type})`}
            {sib.occupation && ` - ${sib.occupation}`}
            {sib.maritalStatus && ` [${sib.maritalStatus}]`}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation and Language Switcher */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-stone-600 hover:text-stone-900 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentLang === 'mr' ? 'मागे जा' : 'Back'}
        </button>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 bg-stone-100 hover:bg-orange-100 text-stone-800 px-4 py-2 rounded-xl text-sm font-bold border border-stone-200 transition-all shadow-sm hover:border-saffron/40"
        >
          <Globe className="w-4 h-4 text-saffron" />
          <span>{currentLang === 'mr' ? 'English मध्ये पहा' : 'मराठीत पहा'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Header & Photos */}
        <div className="flex flex-col md:flex-row">
          {/* Photo Gallery */}
          <div className="md:w-1/3 bg-stone-100 relative">
            {allPhotos.length > 0 ? (
              <div className="relative aspect-[3/4] md:aspect-auto md:h-full w-full group">
                <img 
                  src={allPhotos[currentPhotoIndex]} 
                  alt={`${profile.firstName} ${profile.lastName}`} 
                  className="w-full h-full object-cover cursor-pointer"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                  onClick={() => setIsImageModalOpen(true)}
                />
                
                {allPhotos.length > 1 && (
                  <>
                    <button 
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {allPhotos.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-2 w-2 rounded-full ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[3/4] md:h-full flex items-center justify-center bg-stone-100 text-stone-400">
                <User className="h-20 w-20" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="md:w-2/3 p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-stone-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-lg text-stone-500 mt-1">
                  {formatAgeDisplay(profile.age, currentLang)} • {formatHeightDisplay(profile.height, currentLang)}
                </p>
              </div>
              {user && profile.uid !== user.uid && profile.uid !== authProfile?.uid && (
                <button 
                  onClick={toggleFavorite}
                  className={`p-3 rounded-full transition-colors ${isFavorite ? 'bg-orange-50 text-saffron' : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-saffron'}`}
                  title={isFavorite ? (currentLang === 'mr' ? "आवडीतून काढा" : "Remove from Favorites") : (currentLang === 'mr' ? "आवडीत जोडा" : "Add to Favorites")}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-saffron mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">{currentLang === 'mr' ? 'व्यवसाय' : 'Profession'}</p>
                  <p className="font-medium text-stone-900">{translateText(profile.profession, currentLang)}</p>
                  {profile.income && <p className="text-sm text-stone-600">{translateText(profile.income, currentLang)}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-saffron mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">{currentLang === 'mr' ? 'शिक्षण' : 'Education'}</p>
                  <p className="font-medium text-stone-900">{translateText(profile.education, currentLang)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-saffron mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">{currentLang === 'mr' ? 'ठिकाण' : 'Location'}</p>
                  <p className="font-medium text-stone-900">{translateText(profile.location, currentLang)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-saffron mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">{currentLang === 'mr' ? 'वैवाहिक स्थिती' : 'Marital Status'}</p>
                  <p className="font-medium text-stone-900">{translateText(profile.maritalStatus, currentLang)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Sections */}
        <div className="p-6 md:p-8 border-t border-stone-100 bg-stone-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Background & Roots */}
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                {currentLang === 'mr' ? 'पारंपारिक माहिती व जन्म स्थान' : 'Background & Roots'}
              </h3>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'मूळ गाव' : 'Native Place'}</dt>
                  <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.nativePlace, currentLang)}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'गोत्र / कुळ' : 'Gotra / Kul'}</dt>
                  <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.gotraKul, currentLang)}</dd>
                </div>
                {profile.dob && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'जन्म तारीख' : 'Date of Birth'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{formatDateOfBirth(profile.dob, profile.timeOfBirth, currentLang)}</dd>
                  </div>
                )}
                {profile.birthplace && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'जन्म ठिकाण' : 'Birthplace'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.birthplace, currentLang)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Family Details */}
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                {currentLang === 'mr' ? 'कौटुंबिक माहिती' : 'Family Details'}
              </h3>
              <dl className="space-y-3">
                {profile.fatherName && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'वडिलांचे नाव' : 'Father'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{profile.fatherName}</dd>
                  </div>
                )}
                {profile.motherName && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'आईचे नाव' : 'Mother'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{profile.motherName}</dd>
                  </div>
                )}
                {profile.parentsOccupation && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'पालकांचा व्यवसाय' : 'Occupation'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.parentsOccupation, currentLang)}</dd>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'भावंडे' : 'Siblings'}</dt>
                  <dd className="text-sm text-stone-900 col-span-2">{renderSiblings()}</dd>
                </div>
              </dl>
            </div>

            {/* Maternal Uncle Details */}
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                {currentLang === 'mr' ? 'मामाची माहिती (मातृपक्ष)' : 'Maternal Uncle (Mama)'}
              </h3>
              <dl className="space-y-3">
                {profile.maternalUncleName && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'मामाचे नाव' : 'Name'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{profile.maternalUncleName}</dd>
                  </div>
                )}
                {profile.maternalUncleGotraKul && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'गोत्र / कुळ' : 'Gotra / Kul'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.maternalUncleGotraKul, currentLang)}</dd>
                  </div>
                )}
                {profile.maternalUnclePlace && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'ठिकाण / गाव' : 'Place'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.maternalUnclePlace, currentLang)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Partner Preferences */}
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                {currentLang === 'mr' ? 'जोडीदाराकडून अपेक्षा' : 'Partner Preferences'}
              </h3>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'वयोगट' : 'Age Range'}</dt>
                  <dd className="text-sm text-stone-900 col-span-2">
                    {profile.partnerPreferences?.ageMin || 18} {currentLang === 'mr' ? 'ते' : 'to'} {profile.partnerPreferences?.ageMax || 30} {currentLang === 'mr' ? 'वर्षे' : 'years'}
                  </dd>
                </div>
                {profile.partnerPreferences?.education && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'शिक्षण' : 'Education'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.partnerPreferences.education, currentLang)}</dd>
                  </div>
                )}
                {profile.partnerPreferences?.profession && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'व्यवसाय' : 'Profession'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.partnerPreferences.profession, currentLang)}</dd>
                  </div>
                )}
                {profile.partnerPreferences?.location && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'ठिकाण' : 'Location'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{translateText(profile.partnerPreferences.location, currentLang)}</dd>
                  </div>
                )}
                {profile.partnerExpectations && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'इतर अपेक्षा' : 'Expectations'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2">{profile.partnerExpectations}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Contact Details */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                {currentLang === 'mr' ? 'संपर्क माहिती' : 'Contact Details'}
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.contactNumber && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'मोबाईल' : 'Phone'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2 font-bold">{formatPhoneDisplay(profile.contactNumber)}</dd>
                  </div>
                )}
                {profile.parentsContact && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'पालकांचा फोन' : "Parents' Phone"}</dt>
                    <dd className="text-sm text-stone-900 col-span-2 font-bold">{formatPhoneDisplay(profile.parentsContact)}</dd>
                  </div>
                )}
                {profile.maternalUnclePhone && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-sm font-medium text-stone-500">{currentLang === 'mr' ? 'मामाचा फोन' : 'Maternal Uncle Phone'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2 font-bold">{formatPhoneDisplay(profile.maternalUnclePhone)}</dd>
                  </div>
                )}
                {profile.address && (
                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <dt className="text-sm font-medium text-stone-500 md:col-span-1">{currentLang === 'mr' ? 'पत्ता' : 'Address'}</dt>
                    <dd className="text-sm text-stone-900 col-span-2 md:col-span-5">{translateText(profile.address, currentLang)}</dd>
                  </div>
                )}
              </dl>
            </div>

          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {isImageModalOpen && allPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <button 
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-stone-300 transition-colors bg-black/50 p-2 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={allPhotos[currentPhotoIndex]} 
              alt={`${profile.firstName} ${profile.lastName} full size`} 
              className="max-w-full max-h-full object-contain"
              onContextMenu={(e) => e.preventDefault()}
              draggable="false"
            />
            
            {allPhotos.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
