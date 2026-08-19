import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where, limit, doc, getDoc, updateDoc, onSnapshot } from '../lib/firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search as SearchIcon, MapPin, Briefcase, GraduationCap, User, Heart, X, Users, Phone, Lock, Sparkles, Sliders, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageCarousel from '../components/ImageCarousel';
import InterestButton from '../components/InterestButton';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { getOppositeGenderLabel, isOppositeGender, normalizeGender } from '../lib/genderUtils';
import { seedSampleProfilesToFirestore } from '../lib/seedProfiles';
import { HIGHEST_EDUCATION_CATEGORIES } from '../types';
import { calculateMatchScore, calculateProfileCompleteness, ProfileDataForMatching, MatchAnalysis, getProfileBirthYear, DEFAULT_MATCH_THRESHOLD } from '../lib/matchingUtils';
import { translateText, formatAgeDisplay, formatHeightDisplay } from '../lib/profileTranslator';
import { getOrAssignProfileId, getDisplayProfileId, matchesProfileId, extractSequenceNumber } from '../lib/profileIdUtils';
import { isProfileSearchableAndVisible } from '../lib/subscriptionService';

interface ProfileData {
  uid: string;
  profileId?: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  height: string;
  education: string;
  highestEducation?: string;
  customEducation?: string;
  profession: string;
  location: string;
  photoUrl?: string;
  additionalPhotos?: string[];
  status: string;
  isArchived?: boolean;
  nativePlace?: string;
  gotraKul?: string;
  maritalStatus?: string;
  contactNumber?: string;
  partnerExpectations?: string;
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
  siblings?: string;
  favorites?: string[];
  partnerPreferences?: {
    preferredBirthYear?: number | string;
    education?: string;
    location?: string;
    ageMin?: number;
    ageMax?: number;
    profession?: string;
  };
}

export default function Search() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'matches'>('search');
  
  const [filters, setFilters] = useState({
    profileIdSearch: '',
    gender: 'Any',
    ageMin: 18,
    ageMax: 40,
    preferredBirthYear: '',
    education: '',
    customEducation: '',
    profession: '',
    location: '',
    maritalStatus: 'Any'
  });

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [targetProfileForModal, setTargetProfileForModal] = useState<ProfileData | null>(null);
  const [showMatchesPointer, setShowMatchesPointer] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24;

  // Initialize and check user-specific key for My Matches pointer
  useEffect(() => {
    if (user?.uid) {
      const storageKey = `myMatchesSearchIntroSeen_${user.uid}`;
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setShowMatchesPointer(true);
      } else {
        setShowMatchesPointer(false);
      }
    } else {
      setShowMatchesPointer(false);
    }
  }, [user?.uid]);

  const dismissMatchesPointer = () => {
    if (user?.uid) {
      localStorage.setItem(`myMatchesSearchIntroSeen_${user.uid}`, 'true');
    }
    setShowMatchesPointer(false);
  };

  useEffect(() => {
    if (!user && activeTab === 'matches') {
      setActiveTab('search');
    }
    setCurrentPage(1);
  }, [user, activeTab]);

  // Real-time listener for current user's profile
  useEffect(() => {
    if (!user?.uid) {
      setMyProfile(null);
      return;
    }

    const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const uData = docSnap.data() as ProfileData;
        setMyProfile(uData);
      }
    }, (err) => {
      console.warn("Error fetching profile snapshot in Search:", err);
    });

    return () => unsubProfile();
  }, [user?.uid]);

  // Set default gender filter once opposite gender is known
  useEffect(() => {
    if (myProfile?.gender && filters.gender === 'Any') {
      const oppGender = getOppositeGenderLabel(myProfile.gender);
      setFilters(prev => ({ ...prev, gender: oppGender }));
    }
  }, [myProfile?.gender]);

  // Real-time listener for candidate profiles query
  useEffect(() => {
    setLoading(true);

    // Target query with gender filtering and bound of 150 for 50,000+ profiles
    let profilesQuery;
    if (activeTab === 'matches' && myProfile?.gender) {
      const oppGender = getOppositeGenderLabel(myProfile.gender);
      profilesQuery = query(
        collection(db, 'profiles'),
        where('status', '==', 'approved'),
        where('gender', '==', oppGender),
        limit(150)
      );
    } else if (filters.gender !== 'Any') {
      profilesQuery = query(
        collection(db, 'profiles'),
        where('status', '==', 'approved'),
        where('gender', '==', filters.gender),
        limit(150)
      );
    } else {
      profilesQuery = query(
        collection(db, 'profiles'),
        where('status', '==', 'approved'),
        limit(150)
      );
    }

    const unsubProfiles = onSnapshot(profilesQuery, (querySnapshot) => {
      const fetchedProfiles: ProfileData[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as ProfileData;
        if ((!user || data.uid !== user.uid) && (!myProfile || data.uid !== myProfile.uid)) {
          // Candidate profile must have an active subscription to appear in search & my matches
          if (isProfileSearchableAndVisible(data)) {
            fetchedProfiles.push(data);
          }
        }
      });
      setProfiles(fetchedProfiles);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to profiles snapshot:", error);
      setLoading(false);
    });

    return () => unsubProfiles();
  }, [user?.uid, filters.gender, activeTab, myProfile?.gender, myProfile?.uid]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getProfileBirthYear = (p: ProfileData): number => {
    if ((p as any).dob) {
      const parsed = parseInt((p as any).dob.slice(0, 4));
      if (!isNaN(parsed) && parsed > 1950) return parsed;
    }
    return 2026 - (p.age || 25);
  };

  const checkFlexibleMatch = (prefStr?: string, candidateStr?: string) => {
    if (!prefStr || !prefStr.trim()) return true;
    const prefLower = prefStr.toLowerCase().trim();
    if (prefLower === 'any' || prefLower.includes('any')) return true;
    if (!candidateStr) return false;
    const candLower = candidateStr.toLowerCase().trim();
    
    // Split by comma or slash to support multiple preferred items (e.g. "BE, MBA, BTech" or "Nashik, Pune, Mumbai")
    const tokens = prefLower.split(/[,/]/).map(s => s.trim()).filter(Boolean);
    return tokens.some(tok => tok === 'any' || candLower.includes(tok) || tok.includes(candLower));
  };

  const matchAnalysisMap = React.useMemo(() => {
    const map = new Map<string, MatchAnalysis>();
    if (!myProfile) return map;

    profiles.forEach(p => {
      const analysis = calculateMatchScore(myProfile as any, p as any);
      map.set(p.uid, analysis);
    });
    return map;
  }, [myProfile, profiles]);

  const hasPreferencesSet = React.useMemo(() => {
    if (!myProfile || !myProfile.partnerPreferences) return false;
    const prefs = myProfile.partnerPreferences;
    const hasBirthYear = Boolean(prefs.preferredBirthYear && Number(prefs.preferredBirthYear) > 1950);
    const hasEdu = Boolean(prefs.education && (Array.isArray(prefs.education) ? prefs.education.length > 0 : String(prefs.education).trim() !== ''));
    const hasLoc = Boolean(prefs.location && (Array.isArray(prefs.location) ? prefs.location.length > 0 : String(prefs.location).trim() !== ''));
    const hasMarital = Boolean(prefs.maritalStatus && String(prefs.maritalStatus).trim() !== '');
    const hasProf = Boolean(prefs.profession && String(prefs.profession).trim() !== '');
    return hasBirthYear || hasEdu || hasLoc || hasMarital || hasProf;
  }, [myProfile]);

  const displayProfiles = React.useMemo(() => {
    if (activeTab === 'matches') {
      if (!myProfile || !hasPreferencesSet) return [];

      // Filter eligible candidates according to partner preferences & mandatory eligibility
      const eligible = profiles.filter(p => {
        if ((user && p.uid === user.uid) || (myProfile && p.uid === myProfile.uid)) return false;
        if ((p as any).isArchived || p.status === 'archived' || p.status !== 'approved') return false;
        const analysis = matchAnalysisMap.get(p.uid);
        if (!analysis || !analysis.isEligible) return false;
        
        // Enforce >40% match score or good Kundali/Guna match (>=18/36)
        const isAboveThreshold = analysis.matchPercentage > DEFAULT_MATCH_THRESHOLD || (analysis.gunaResult && analysis.gunaResult.totalScore >= 18);
        return isAboveThreshold;
      });

      // Sort by Match Percentage desc, Profile Completeness desc, Updated Date desc
      return [...eligible].sort((a, b) => {
        const scoreA = matchAnalysisMap.get(a.uid)?.matchPercentage || 0;
        const scoreB = matchAnalysisMap.get(b.uid)?.matchPercentage || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;

        const compA = calculateProfileCompleteness(a as any);
        const compB = calculateProfileCompleteness(b as any);
        if (compB !== compA) return compB - compA;

        const dateA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
        const dateB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Manual Search Filters
    const manualFiltered = profiles.filter(p => {
      if ((user && p.uid === user.uid) || (myProfile && p.uid === myProfile.uid)) return false;
      if ((p as any).isArchived || p.status === 'archived') return false;

      // Direct Profile ID / Vadu-Var Number Search
      if (filters.profileIdSearch && filters.profileIdSearch.trim()) {
        if (!matchesProfileId(p, filters.profileIdSearch)) return false;
      }

      if (filters.gender !== 'Any' && p.gender !== filters.gender) return false;
      if (filters.preferredBirthYear) {
        const prefYear = Number(filters.preferredBirthYear);
        const candYear = getProfileBirthYear(p);
        if (candYear < prefYear) return false;
      }
      if (filters.maritalStatus !== 'Any' && p.maritalStatus !== filters.maritalStatus) return false;

      // Education Filter
      if (filters.education) {
        const eduQuery = (filters.education === 'Others' ? filters.customEducation : filters.education).trim().toLowerCase();
        if (eduQuery) {
          const candEdu = [p.highestEducation, p.customEducation, p.education].filter(Boolean).join(' ').toLowerCase();
          if (!candEdu.includes(eduQuery)) return false;
        }
      }

      if (filters.profession && !p.profession?.toLowerCase().includes(filters.profession.toLowerCase())) return false;
      if (filters.location && !p.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      return true;
    });

    // Sort manual search profiles in strict sequence order (e.g. VAR-001, VAR-002, VAR-003, VADU-001...)
    return [...manualFiltered].sort((a, b) => {
      const seqA = extractSequenceNumber(a.profileId || (a as any).vaduVarNumber || a.uid);
      const seqB = extractSequenceNumber(b.profileId || (b as any).vaduVarNumber || b.uid);
      if (seqA !== seqB && seqA > 0 && seqB > 0) {
        return seqA - seqB;
      }

      const idA = getDisplayProfileId(a);
      const idB = getDisplayProfileId(b);
      if (idA !== idB) return idA.localeCompare(idB);

      const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }, [activeTab, profiles, myProfile, user, hasPreferencesSet, matchAnalysisMap, filters]);

  const handleViewProfile = (profile: ProfileData) => {
    if (!user) {
      setTargetProfileForModal(profile);
      setLoginModalOpen(true);
      return;
    }
    navigate(`/profile/${profile.uid}`);
  };

  const toggleFavorite = async (profileId: string) => {
    if (!user || !myProfile) return;
    if (profileId === user.uid || profileId === myProfile.uid) {
      console.warn("User cannot favorite their own profile.");
      return;
    }
    
    const currentFavorites = myProfile.favorites || [];
    const isFavorite = currentFavorites.includes(profileId);
    
    const newFavorites = isFavorite 
      ? currentFavorites.filter(id => id !== profileId)
      : [...currentFavorites, profileId];
      
    try {
      const userRef = doc(db, 'profiles', user.uid);
      await updateDoc(userRef, { 
        favorites: newFavorites,
        updatedAt: new Date().toISOString()
      });
      setMyProfile({ ...myProfile, favorites: newFavorites });
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-saffron/10 sticky top-24 max-h-[calc(100vh-120px)] flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron to-gold"></div>
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-saffron" />
              <h2 className="text-xl font-serif font-bold text-stone-900">{t('search.filters')}</h2>
            </div>
            {(filters.profileIdSearch || filters.gender !== 'Any' || filters.education || filters.profession || filters.location || filters.preferredBirthYear || filters.maritalStatus !== 'Any') && (
              <button
                onClick={() => setFilters({
                  profileIdSearch: '',
                  gender: 'Any',
                  ageMin: 18,
                  ageMax: 40,
                  preferredBirthYear: '',
                  education: '',
                  customEducation: '',
                  profession: '',
                  location: '',
                  maritalStatus: 'Any'
                })}
                className="text-xs text-saffron font-bold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="space-y-5 overflow-y-auto pr-1 flex-1">
            {/* Search Profile by Vadhu/Var Number */}
            <div className="bg-orange-50/60 p-3 rounded-2xl border border-saffron/20">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Direct Search by Profile ID
              </label>
              <div className="relative">
                <input 
                  disabled={activeTab === 'matches'} 
                  type="text" 
                  name="profileIdSearch" 
                  placeholder="e.g. VAR-001 or VADHU-001" 
                  value={filters.profileIdSearch} 
                  onChange={handleFilterChange} 
                  className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 pl-8 border bg-white disabled:opacity-50 transition-all text-xs font-mono font-bold" 
                />
                <SearchIcon className="w-3.5 h-3.5 text-saffron absolute left-2.5 top-3" />
              </div>
              <p className="text-[10px] text-stone-500 mt-1 ml-0.5">Type 001, VAR-001 or VADHU-002</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">{t('search.gender')}</label>
              <select disabled={activeTab === 'matches'} name="gender" value={filters.gender} onChange={handleFilterChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border bg-white disabled:opacity-50 transition-all text-sm font-medium">
                <option value="Any">{t('search.any')}</option>
                <option value="Male">{t('search.male')}</option>
                <option value="Female">{t('search.female')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Preferred Birth Year (e.g. 1998)</label>
              <input 
                disabled={activeTab === 'matches'} 
                type="number" 
                name="preferredBirthYear" 
                placeholder="e.g. 1998 (1998 & later)" 
                value={filters.preferredBirthYear} 
                onChange={handleFilterChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border disabled:opacity-50 transition-all text-sm" 
              />
              <p className="text-[11px] text-stone-400 mt-1 ml-1 font-medium">Shows profiles born in 1998 or later</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">Marital Status</label>
              <select disabled={activeTab === 'matches'} name="maritalStatus" value={filters.maritalStatus} onChange={handleFilterChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border bg-white disabled:opacity-50 transition-all text-sm font-medium">
                <option value="Any">Any</option>
                <option value="Unmarried">Unmarried</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">{t('search.education')}</label>
              <select 
                disabled={activeTab === 'matches'} 
                name="education" 
                value={filters.education} 
                onChange={handleFilterChange} 
                className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border bg-white disabled:opacity-50 transition-all text-sm font-medium"
              >
                <option value="">-- All Education --</option>
                {HIGHEST_EDUCATION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {filters.education === 'Others' && (
                <div className="mt-2">
                  <input 
                    disabled={activeTab === 'matches'} 
                    type="text" 
                    name="customEducation" 
                    placeholder="Type education degree/field..." 
                    value={filters.customEducation} 
                    onChange={handleFilterChange} 
                    className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border disabled:opacity-50 transition-all text-sm bg-orange-50/30" 
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">{t('search.profession')}</label>
              <input disabled={activeTab === 'matches'} type="text" name="profession" placeholder="e.g. Software" value={filters.profession} onChange={handleFilterChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border disabled:opacity-50 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5 ml-1">{t('search.location')}</label>
              <input disabled={activeTab === 'matches'} type="text" name="location" placeholder="e.g. Nashik" value={filters.location} onChange={handleFilterChange} className="w-full border-stone-200 rounded-xl shadow-sm focus:border-saffron focus:ring-saffron p-2.5 border disabled:opacity-50 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2 text-stone-900">
              {activeTab === 'matches' ? t('search.matchesTitle') : t('search.title')}
            </h1>
            <p className="text-stone-500 font-medium">
              Showing {Math.min(displayProfiles.length, (currentPage - 1) * pageSize + 1)} - {Math.min(displayProfiles.length, currentPage * pageSize)} of {displayProfiles.length} profiles
            </p>
          </div>
          
          <div className="flex bg-stone-100 p-1.5 rounded-2xl w-fit relative">
            <button 
              onClick={() => {
                setActiveTab('search');
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'search' ? 'bg-white text-saffron shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
            >
              <SearchIcon className="h-4 w-4" />
              Manual Search
            </button>
            
            {user && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setActiveTab('matches');
                    dismissMatchesPointer();
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${activeTab === 'matches' ? 'bg-white text-saffron shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <Heart className={`h-4 w-4 ${activeTab === 'matches' ? 'fill-saffron text-saffron' : 'text-red-500 fill-red-500'}`} />
                  <span>My Matches</span>
                  {activeTab === 'search' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron"></span>
                    </span>
                  )}
                </button>

                {/* Small Popup Pointer pointing directly to My Matches */}
                {showMatchesPointer && activeTab === 'search' && (
                  <div className="absolute right-0 top-full mt-3 z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-saffron animate-bounce-subtle">
                    {/* Triangle Arrow pointing up */}
                    <div className="absolute -top-2 right-8 w-4 h-4 bg-stone-900 border-t-2 border-l-2 border-saffron rotate-45"></div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-saffron text-white rounded-xl flex-shrink-0 mt-0.5">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-serif font-bold text-sm text-amber-300">
                            Discover "My Matches"!
                          </h4>
                          <button 
                            onClick={dismissMatchesPointer}
                            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
                            aria-label="Close tooltip"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed font-medium mb-3">
                          Check out top candidates matched to your preferences automatically with high compatibility!
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab('matches');
                            dismissMatchesPointer();
                          }}
                          className="w-full bg-saffron hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <span>Check My Matches</span>
                          <Heart className="w-3.5 h-3.5 fill-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'matches' && !myProfile && !loading && (
          <div className="bg-saffron/5 text-saffron p-5 rounded-2xl border border-saffron/20 mb-8 font-medium">
            Please complete your profile to see personalized matches based on your preferences.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
          </div>
        ) : activeTab === 'matches' && !user ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl text-center border-2 border-stone-100 shadow-sm max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-saffron/10 text-saffron rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900">Login Required for Personalized Matches</h3>
            <p className="text-stone-500 text-sm">
              Please sign in to your account to view automated profile compatibility matches calculated from your saved Partner Preferences.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-saffron text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md active:scale-95"
            >
              Sign In to View Matches
            </button>
          </div>
        ) : activeTab === 'matches' && user && !hasPreferencesSet ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl text-center border-2 border-saffron/20 shadow-md max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 bg-saffron/10 text-saffron rounded-full flex items-center justify-center mx-auto">
              <Sliders className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-stone-900">Add your Partner Preferences to see personalized matches.</h3>
              <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
                Set your preferred birth year, education, and location in your profile to let our intelligent system automatically calculate instant compatibility percentages for candidate profiles.
              </p>
            </div>
            <button
              onClick={() => navigate('/profile', { state: { openSection: 'preferences' } })}
              className="px-8 py-3.5 bg-saffron text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95 inline-flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              Set Partner Preferences
            </button>
          </div>
        ) : displayProfiles.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl text-center border-2 border-stone-100 shadow-sm max-w-2xl mx-auto space-y-4">
            <User className="h-16 w-16 text-stone-200 mx-auto" />
            <h3 className="text-2xl font-serif font-bold text-stone-900">
              {activeTab === 'matches' ? 'No matching profiles found yet.' : t('search.noProfilesFound')}
            </h3>
            {activeTab === 'matches' ? (
              <div className="space-y-4">
                <p className="text-stone-600 text-sm font-medium">
                  We couldn't find any candidate profiles matching all your current Partner Preferences.
                </p>
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/60 text-left text-xs text-amber-900 space-y-1.5 max-w-md mx-auto">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800">Suggestions:</p>
                  <p>• Try specifying a broader location in your Partner Preferences</p>
                  <p>• Adjust your preferred birth-year minimum threshold</p>
                  <p>• Select "Any" for education or profession to see more candidates</p>
                </div>
                <button
                  onClick={() => navigate('/profile', { state: { openSection: 'preferences' } })}
                  className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-saffron transition-all shadow-md text-sm inline-flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4" />
                  Adjust Partner Preferences
                </button>
              </div>
            ) : (
              <p className="text-stone-500 text-sm">Try adjusting your filters to see more results.</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(profile => {
                const matchAnalysis = matchAnalysisMap.get(profile.uid);
                const matchPercentage = matchAnalysis?.matchPercentage || 0;
                const pId = getDisplayProfileId(profile);

                return (
                  <div key={profile.uid} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-stone-100 hover:shadow-xl transition-all group relative">
                    <div 
                      onClick={() => !user && handleViewProfile(profile)}
                      className={`aspect-[4/5] bg-stone-100 relative overflow-hidden ${!user ? 'cursor-pointer' : ''}`}
                    >
                      {/* Profile ID badge top-left (when activeTab is manual search) or next to match */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-stone-900/90 text-amber-300 shadow-md backdrop-blur-md border border-amber-400/30 tracking-wider">
                          {pId}
                        </span>
                        {activeTab === 'matches' && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md flex items-center gap-1 ${
                            matchPercentage >= 80 ? 'bg-emerald-600/90 border border-emerald-400/30' : matchPercentage >= 50 ? 'bg-amber-600/90 border border-amber-400/30' : 'bg-stone-700/90 border border-stone-500/30'
                          }`}>
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            {matchPercentage}% Match
                          </span>
                        )}
                      </div>

                      {user && myProfile && profile.uid !== user.uid && profile.uid !== myProfile.uid && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(profile.uid); }}
                          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white transition-all shadow-md group-hover:scale-110"
                        >
                          <Heart className={`h-5 w-5 ${myProfile.favorites?.includes(profile.uid) ? 'fill-saffron text-saffron' : 'text-stone-400'}`} />
                        </button>
                      )}
                      {profile.photoUrl ? (
                        <img 
                          src={profile.photoUrl} 
                          alt={profile.firstName} 
                          className={`w-full h-full object-cover transition-transform duration-500 ${!user ? 'blur-md scale-105' : 'group-hover:scale-105'}`} 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                          <User className="h-20 w-20" />
                        </div>
                      )}

                      {/* Locked Overlay for Non-Logged-In Users */}
                      {!user && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 text-center z-10">
                          <div className="bg-saffron text-white p-3 rounded-full mb-2 shadow-xl animate-pulse">
                            <Lock className="h-6 w-6" />
                          </div>
                          <span className="text-white font-bold text-sm tracking-wide drop-shadow">Photo Locked</span>
                          <span className="text-xs text-white/90 font-medium bg-black/50 px-3 py-1 rounded-full border border-white/20 mt-1.5 shadow">
                            Click to Unlock
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 z-20">
                        <h3 className="text-white font-serif font-bold text-xl drop-shadow">
                          {profile.firstName} {profile.lastName}
                        </h3>
                        <p className="text-gold text-sm font-semibold">{formatAgeDisplay(profile.age, i18n.language)} • {formatHeightDisplay(profile.height, i18n.language)}</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3 text-sm text-stone-600">
                          <GraduationCap className="h-4 w-4 mt-0.5 flex-shrink-0 text-saffron" />
                          {user ? (
                            <span className="line-clamp-1 font-medium">{translateText(profile.highestEducation || profile.education, i18n.language)}</span>
                          ) : (
                            <span className="text-stone-400 font-mono text-xs flex items-center gap-1">
                              <Lock className="w-3 h-3 text-saffron" /> Education Locked (Login to view)
                            </span>
                          )}
                        </div>
                        <div className="flex items-start gap-3 text-sm text-stone-600">
                          <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0 text-saffron" />
                          {user ? (
                            <span className="line-clamp-1 font-medium">{translateText(profile.profession, i18n.language)}</span>
                          ) : (
                            <span className="text-stone-400 font-mono text-xs flex items-center gap-1">
                              <Lock className="w-3 h-3 text-saffron" /> Profession Locked (Login to view)
                            </span>
                          )}
                        </div>
                        <div className="flex items-start gap-3 text-sm text-stone-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-saffron" />
                          {user ? (
                            <span className="line-clamp-1 font-medium">{translateText(profile.location || profile.nativePlace, i18n.language)}</span>
                          ) : (
                            <span className="text-stone-400 font-mono text-xs flex items-center gap-1">
                              <Lock className="w-3 h-3 text-saffron" /> Location Locked (Login to view)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        {user ? (
                          <>
                            <InterestButton targetProfile={profile} variant="primary" />
                            <button 
                              onClick={() => handleViewProfile(profile)}
                              className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-saffron transition-all shadow-md active:scale-[0.98] text-sm"
                            >
                              View Full Profile
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleViewProfile(profile)}
                            className="w-full bg-saffron text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            Show Profile (Login Required)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {Math.ceil(displayProfiles.length / pageSize) > 1 && (
              <div className="flex items-center justify-between border-t border-stone-200 pt-6 mt-8">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-sm font-semibold text-stone-600">
                  Page <span className="text-saffron font-bold">{currentPage}</span> of <span className="font-bold text-stone-900">{Math.ceil(displayProfiles.length / pageSize)}</span>
                </div>

                <button
                  onClick={() => {
                    setCurrentPage(p => Math.min(Math.ceil(displayProfiles.length / pageSize), p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage >= Math.ceil(displayProfiles.length / pageSize)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <LoginRequiredModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        targetProfileName={targetProfileForModal ? `${targetProfileForModal.firstName} ${targetProfileForModal.lastName}` : ''}
        targetProfileId={targetProfileForModal?.uid}
      />
    </div>
  );
}
