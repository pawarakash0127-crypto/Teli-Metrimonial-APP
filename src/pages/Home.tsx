import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShieldCheck, Users, MapPin, Briefcase, GraduationCap, X, User, Lock, Newspaper, Calendar, ArrowRight, Share2, Globe, ExternalLink, Star, MessageSquare } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { db, collection, getDocs, query, where, limit, doc, getDoc, updateDoc, onSnapshot } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { isOppositeGender } from '../lib/genderUtils';
import { seedSampleProfilesToFirestore } from '../lib/seedProfiles';
import { getOrAssignProfileId, getDisplayProfileId } from '../lib/profileIdUtils';
import { COMMUNITY_NEWS, NewsItem } from '../data/communityNewsData';
import logoImg from '../assets/images/LOGO.jpg';

interface ProfileData {
  uid: string;
  profileId?: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  height: string;
  education: string;
  profession: string;
  companyName?: string;
  location: string;
  photoUrl?: string;
  additionalPhotos?: string[];
  nativePlace?: string;
  gotraKul?: string;
  siblings?: string;
  status?: string;
  favorites?: string[];
}

export default function Home() {
  const { user } = useAuth();
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [targetProfileForModal, setTargetProfileForModal] = useState<ProfileData | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [homeReviews, setHomeReviews] = useState<any[]>([]);
  
  // Homepage Firestore Config & Community News State
  const [homepageConfig, setHomepageConfig] = useState({
    happyMarriagesEnabled: true,
    happyMarriagesTitle: "Millions of Happy Marriages",
    happyMarriagesSubtitle: '"A successful marriage requires falling in love many times, always with the same person."',
    happyMarriagesStories: [
      {
        names: "Rahul & Sneha",
        quote: "We found our perfect match through Nashik Teli Samaj Matrimony. The community focus made all the difference.",
        image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=400"
      },
      {
        names: "Amit & Priya",
        quote: "The verification process gave us peace of mind. Highly recommended for anyone looking for serious commitment.",
        image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400"
      },
      {
        names: "Vikram & Anjali",
        quote: "Simple, traditional, and effective. We are grateful to this platform for bringing our families together.",
        image: "https://images.unsplash.com/photo-1595910129103-57b04739c2ff?auto=format&fit=crop&q=80&w=400"
      }
    ],
    communityNewsEnabled: true
  });
  const [newsList, setNewsList] = useState<NewsItem[]>(COMMUNITY_NEWS);

  const navigate = useNavigate();
  const { t } = useTranslation();

  // Subscribe to Homepage Config in Firestore
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'homepage'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHomepageConfig(prev => ({
          ...prev,
          happyMarriagesEnabled: data.happyMarriagesEnabled !== undefined ? data.happyMarriagesEnabled : prev.happyMarriagesEnabled,
          happyMarriagesTitle: data.happyMarriagesTitle || prev.happyMarriagesTitle,
          happyMarriagesSubtitle: data.happyMarriagesSubtitle || prev.happyMarriagesSubtitle,
          happyMarriagesStories: data.happyMarriagesStories && data.happyMarriagesStories.length > 0 ? data.happyMarriagesStories : prev.happyMarriagesStories,
          communityNewsEnabled: data.communityNewsEnabled !== undefined ? data.communityNewsEnabled : prev.communityNewsEnabled
        }));
      }
    }, (err) => console.warn("Homepage config listener error:", err));

    const unsubNews = onSnapshot(collection(db, 'community_news'), (snapshot) => {
      if (!snapshot.empty) {
        const fetched: NewsItem[] = [];
        snapshot.forEach(d => {
          const item = { id: d.id, ...d.data() } as any;
          if (item.published !== false) {
            fetched.push(item);
          }
        });
        if (fetched.length > 0) {
          setNewsList(fetched);
        }
      }
    }, (err) => console.warn("Community news listener error:", err));

    return () => {
      unsubConfig();
      unsubNews();
    };
  }, []);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubProfiles: (() => void) | null = null;
    let currentGender = '';

    if (user) {
      unsubUser = onSnapshot(doc(db, 'profiles', user.uid), (userDoc) => {
        if (userDoc.exists()) {
          const uData = userDoc.data() as ProfileData;
          setMyProfile(uData);
          currentGender = uData.gender || '';
        }
      }, (err) => {
        console.warn("Error fetching user profile snapshot in Home:", err);
      });
    }

    setLoading(true);
    const q = query(
      collection(db, 'profiles'), 
      where('status', '==', 'approved'), 
      limit(20)
    );

    unsubProfiles = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty || querySnapshot.size < 5) {
        console.log("Auto-seeding sample profiles in Home...");
        try {
          await seedSampleProfilesToFirestore();
        } catch (err) {
          console.error("Auto-seeding error in Home:", err);
        }
      }

      const profiles: ProfileData[] = [];
      querySnapshot.forEach((docSnap) => {
        const p = docSnap.data() as ProfileData;
        if (!p.status || p.status === 'approved') {
          if (!(p as any).isArchived && p.status !== 'archived') {
            if ((p as any).role !== 'admin' && !(p as any).isAdmin) {
              if (!user || p.uid !== user.uid) {
                if (!currentGender || isOppositeGender(currentGender, p.gender)) {
                  profiles.push(p);
                }
              }
            }
          }
        }
      });
      setAllProfiles(profiles);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to Home profiles:", error);
      setLoading(false);
    });

    // Real-time listener for approved home reviews
    const reviewsQ = query(collection(db, 'reviews'), where('showOnHome', '==', true));
    const unsubReviews = onSnapshot(reviewsQ, (snap) => {
      const items: any[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setHomeReviews(items);
    }, (err) => {
      console.error("Error fetching home reviews:", err);
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubProfiles) unsubProfiles();
      if (unsubReviews) unsubReviews();
    };
  }, [user]);

  const [batchIndex, setBatchIndex] = useState(0);

  // Group eligible profiles into non-overlapping chunks of 3 for simultaneous rotation
  const profileBatches = useMemo(() => {
    if (allProfiles.length === 0) return [];
    if (allProfiles.length <= 3) return [allProfiles];

    const chunks: ProfileData[][] = [];
    for (let i = 0; i < allProfiles.length; i += 3) {
      const chunk = allProfiles.slice(i, i + 3);
      if (chunk.length < 3 && allProfiles.length >= 3) {
        const needed = 3 - chunk.length;
        const fill = allProfiles.filter(p => !chunk.some(c => c.uid === p.uid)).slice(0, needed);
        chunks.push([...chunk, ...fill]);
      } else {
        chunks.push(chunk);
      }
    }
    return chunks;
  }, [allProfiles]);

  // Auto-rotation interval: Every 10 seconds, swap all 3 featured profiles simultaneously
  useEffect(() => {
    if (profileBatches.length <= 1) return;
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setBatchIndex((prev) => (prev + 1) % profileBatches.length);
        setIsAnimating(false);
      }, 500);
    }, 10000);

    return () => clearInterval(timer);
  }, [profileBatches]);

  const visibleProfiles = profileBatches.length > 0 ? (profileBatches[batchIndex % profileBatches.length] || []) : [];

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
    <div className="bg-stone-50 relative">
      {/* Global Page Background Image (Subtle) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center z-0"></div>
      
      {/* Hero Section */}
      <div className="relative bg-baarat-overlay overflow-hidden border-b-4 border-saffron">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-traditional-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 flex flex-col items-center text-center relative z-10">
          <div className="relative mb-6 group">
            <img 
              src={logoImg} 
              alt="राष्ट्रीय तेली समाज स्नेह बंधन" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="%23e05600"><circle cx="60" cy="60" r="56" fill="%23fff" stroke="%23e05600" stroke-width="8"/><text x="50%" y="55%" font-size="50" font-weight="bold" fill="%23e05600" text-anchor="middle" dominant-baseline="middle">त</text></svg>';
              }}
              className="h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-4 border-amber-400 shadow-2xl bg-white p-1 hover:scale-105 transition-transform" 
            />
            <div className="absolute -bottom-2 bg-saffron text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider">
              स्नेह बंधन
            </div>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-stone-900 tracking-tight mb-8 drop-shadow-md">
            <span className="text-saffron">नाशिक</span> <span className="text-stone-900">तेली समाज</span>
            <br />
            <span className="text-4xl md:text-6xl mt-4 block text-maroon">Matrimony</span>
          </h1>
          <p className="text-xl md:text-3xl text-stone-800 max-w-3xl mb-6 font-semibold">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px w-12 bg-saffron"></div>
            <p className="text-maroon font-serif italic text-lg md:text-xl font-bold">
              "शुभमंगल सावधान"
            </p>
            <div className="h-px w-12 bg-saffron"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl justify-center">
            {user ? (
              <Link to="/search" className="bg-saffron text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-2xl shadow-saffron/40 flex-1 max-w-md text-center flex items-center justify-center gap-3 transform hover:-translate-y-1 border-b-4 border-orange-700">
                <Search className="h-6 w-6" />
                {t('home.searchProfiles', 'Search Matrimonial Profiles')}
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-saffron text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-2xl shadow-saffron/40 flex-1 text-center transform hover:-translate-y-1 border-b-4 border-orange-700">
                  {t('home.createProfile', 'Create Profile')}
                </Link>
                <Link to="/search" className="bg-white text-saffron border-2 border-saffron/20 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-orange-50 transition-all shadow-xl flex-1 text-center flex items-center justify-center gap-2 transform hover:-translate-y-1">
                  <Search className="h-6 w-6" />
                  {t('home.searchProfiles', 'Search Profiles')}
                </Link>
              </>
            )}
          </div>
          
          <div className="mt-12 flex items-center gap-8 text-stone-800/60 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-saffron" />
              <span>100% Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-saffron" />
              <span>Community Focused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Profiles Section */}
      <div className="py-24 bg-white relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-traditional-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-px w-8 bg-saffron"></div>
              <h2 className="text-4xl font-serif font-bold text-stone-900">{t('home.featuredProfiles')}</h2>
              <div className="h-px w-8 bg-saffron"></div>
            </div>
            <p className="text-stone-500 max-w-2xl mx-auto mb-4">Meet some of our recently joined and verified members from the community.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saffron"></div>
            </div>
          ) : visibleProfiles.length === 0 ? (
            <div className="text-center text-stone-500 py-12">{t('home.noFeaturedProfiles')}</div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              {visibleProfiles.map(profile => {
                const pId = getDisplayProfileId(profile);
                return (
                  <div 
                    key={profile.uid} 
                    onClick={() => handleViewProfile(profile)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-xl transition-all cursor-pointer group relative"
                  >
                    <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-gold to-saffron z-20"></div>
                      
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-stone-900/90 text-amber-300 shadow-md backdrop-blur-md border border-amber-400/30 tracking-wider">
                          {pId}
                        </span>
                      </div>
                    {user && myProfile && profile.uid !== user.uid && profile.uid !== myProfile.uid && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(profile.uid); }}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
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
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                        <User className="h-20 w-20" />
                      </div>
                    )}

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

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-maroon/90 via-maroon/40 to-transparent p-6 z-20">
                      <h3 className="text-white font-bold text-2xl mb-1 drop-shadow">
                        {profile.firstName} {profile.lastName}
                      </h3>
                      <p className="text-gold text-sm font-semibold">{profile.age} yrs • {profile.height}</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-stone-600">
                      <div className="bg-orange-50 p-2 rounded-lg text-saffron"><Briefcase className="h-4 w-4" /></div>
                      <span className="text-sm font-medium">
                        {profile.profession || 'Professional'}
                        {profile.companyName && <span className="text-stone-400 text-xs ml-1">at {profile.companyName}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-600">
                      <div className="bg-orange-50 p-2 rounded-lg text-saffron"><MapPin className="h-4 w-4" /></div>
                      <span className="text-sm font-medium">{profile.location || 'Location available'}</span>
                    </div>
                    {!user && (
                      <button className="w-full mt-2 bg-saffron text-white py-2.5 rounded-xl text-xs font-bold shadow hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> View Full Profile
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Community News & Updates Section */}
      {homepageConfig.communityNewsEnabled && (
        <div className="py-24 bg-gradient-to-b from-stone-50 via-orange-50/40 to-stone-50 relative border-y border-saffron/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-saffron/10 text-saffron px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-saffron/20">
                <Newspaper className="w-4 h-4" />
                <span>नाशिक तेली समाज बातमी पत्र / समाज घडामोडी</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
                Community News & Updates
              </h2>
              <p className="text-stone-600 max-w-2xl mx-auto">
                Real news and updates regarding Nashik Teli Samaj matrimonial meets, student awards, and community developments fetched from official news portals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsList.map((news) => (
                <div 
                  key={news.id} 
                  onClick={() => setSelectedNews(news)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5"
                >
                  <div>
                    <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden">
                      <img 
                        src={news.image} 
                        alt={news.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-saffron/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                        {news.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-saffron" />
                          <span>{news.date}</span>
                        </div>
                        {news.sourceUrl && (
                          <a
                            href={news.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron bg-orange-50 hover:bg-saffron hover:text-white px-2.5 py-1 rounded-lg border border-saffron/20 transition-all shadow-xs"
                            title={`Visit ${news.sourceName}`}
                          >
                            <Globe className="w-3 h-3" />
                            <span>{news.sourceName || 'Source'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <h3 className="font-bold text-stone-900 text-base leading-snug mb-3 line-clamp-2 group-hover:text-saffron transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-stone-600 text-xs leading-relaxed line-clamp-3 mb-4">
                        {news.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-stone-100 mt-2 pt-4">
                    <div className="flex items-center gap-1.5 text-saffron text-xs font-bold group-hover:gap-2.5 transition-all">
                      <span>Read Preview & Source</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    {news.sourceUrl && (
                      <a
                        href={news.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-stone-500 hover:text-stone-900 underline flex items-center gap-1"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* News Detail Modal with Source Website Link */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-stone-200">
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 z-20 bg-stone-100 hover:bg-stone-200 text-stone-700 p-2.5 rounded-full transition-colors shadow-sm"
              aria-label="Close news modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[16/9] relative overflow-hidden rounded-t-3xl">
              <img 
                src={selectedNews.image} 
                alt={selectedNews.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-saffron text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                {selectedNews.category}
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 text-stone-500 text-xs font-semibold mb-4 border-b pb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-saffron font-bold">
                    <Calendar className="w-4 h-4" /> {selectedNews.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-stone-600">
                    <MapPin className="w-4 h-4 text-saffron" /> {selectedNews.location}
                  </span>
                </div>
                <a
                  href={selectedNews.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-saffron text-saffron hover:text-white px-3 py-1.5 rounded-xl border border-saffron/30 font-bold transition-all shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>स्रोत: {selectedNews.sourceName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight">
                {selectedNews.title}
              </h2>
              <p className="text-stone-500 font-medium text-sm mb-6 italic">
                {selectedNews.titleEn}
              </p>

              <div className="bg-orange-50/60 p-5 rounded-2xl border border-saffron/20 mb-6 text-stone-800 text-sm leading-relaxed font-medium">
                {selectedNews.summary}
              </div>

              <p className="text-stone-700 text-base leading-relaxed whitespace-pre-line font-normal mb-8">
                {selectedNews.fullText}
              </p>

              {/* Source Website Callout Box */}
              <div className="bg-stone-900 text-white p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-saffron/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-saffron text-white rounded-xl">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-300">मूळ बातमीचा स्त्रोत (Original News Source)</h4>
                    <p className="text-xs text-stone-300">Published by {selectedNews.sourceName}</p>
                  </div>
                </div>
                <a
                  href={selectedNews.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-saffron hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <span>संकेतस्थळावर जा (Visit Website)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="bg-stone-200 text-stone-800 px-6 py-3 rounded-xl font-bold text-sm hover:bg-stone-300 transition-all"
                >
                  बंद करा (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heritage Section */}
      <div className="py-24 bg-maroon text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-traditional-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 text-gold">Our Heritage & Values</h2>
              <p className="text-stone-200 text-xl leading-relaxed mb-8">
                We honor the legacy of <span className="text-gold font-bold">Santaji Maharaj</span>, whose life and teachings continue to inspire the Teli Samaj. The <span className="italic">Tel Ghana</span> (traditional oil press) symbolizes our community's industrious spirit, resilience, and deep-rooted cultural heritage.
              </p>
              <div className="flex items-center gap-4 text-gold">
                <div className="h-px w-16 bg-gold"></div>
                <span className="font-serif italic text-2xl">Preserving Traditions, Building Futures</span>
              </div>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-gold/30 bg-white">
                <img 
                  src="src/assets/images/heritage_values_image_1786359545319.jpg" 
                  alt="Tel Ghana - Traditional Oil Press & Heritage" 
                  className="w-full h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-gold text-maroon p-6 rounded-2xl shadow-2xl hidden md:block border-2 border-maroon">
                <p className="font-bold text-xl">Tel Ghana & Heritage</p>
                <p className="text-xs opacity-90 font-medium">Santaji Maharaj & Teli Samaj Legacy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      {homepageConfig.happyMarriagesEnabled && (
        <div className="py-24 bg-orange-50/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-traditional-pattern pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6">{homepageConfig.happyMarriagesTitle}</h2>
              <p className="text-stone-600 max-w-2xl mx-auto italic text-lg">{homepageConfig.happyMarriagesSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(homepageConfig.happyMarriagesStories || []).map((story, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-xl border border-saffron/10 hover:shadow-2xl transition-all text-center group">
                  <div className="w-28 h-28 mx-auto mb-6 rounded-full overflow-hidden border-4 border-saffron/20 group-hover:border-saffron transition-colors">
                    <img src={story.image} alt={story.names} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-3">{story.names}</h3>
                  <p className="text-stone-600 italic text-base leading-relaxed">"{story.quote}"</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <div className="inline-block bg-white px-10 py-6 rounded-3xl border-2 border-saffron/20 shadow-lg">
                <p className="text-saffron font-serif italic text-xl font-bold">"Marriage is not just a union of two souls, but a union of two families and traditions."</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How it Works Section */}
      <div className="py-24 bg-white border-y border-stone-100 relative">
        <div className="absolute inset-0 opacity-5 bg-traditional-pattern pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4">How It Works</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Finding your soulmate is simple and secure on our platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Profile",
                desc: "Register for free and add your personal, professional, and family details.",
                icon: <User className="h-6 w-6" />
              },
              {
                step: "02",
                title: "Get Verified",
                desc: "Our admin team manually verifies every profile to ensure authenticity.",
                icon: <ShieldCheck className="h-6 w-6" />
              },
              {
                step: "03",
                title: "Search & Connect",
                desc: "Use advanced filters to find matches and express interest.",
                icon: <Search className="h-6 w-6" />
              }
            ].map((item, idx) => (
              <div key={idx} className="relative p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:border-saffron/30 transition-all group hover:shadow-lg">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-saffron text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shadow-saffron/20">
                  {item.step}
                </div>
                <div className="mb-6 text-saffron bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-24 bg-stone-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-4">Why Choose Us?</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">We combine traditional values with modern technology to help you find your perfect match.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="bg-orange-100 p-5 rounded-2xl mb-6">
                <ShieldCheck className="h-10 w-10 text-saffron" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">100% Verified Profiles</h3>
              <p className="text-stone-600 leading-relaxed">Every profile is manually screened and verified by our team to ensure a safe and genuine experience.</p>
            </div>
            <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="bg-orange-100 p-5 rounded-2xl mb-6">
                <Users className="h-10 w-10 text-saffron" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Community Focused</h3>
              <p className="text-stone-600 leading-relaxed">Exclusively built for the Nashik Teli Samaj, preserving our cultural values, traditions, and family roots.</p>
            </div>
            <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="bg-orange-100 p-5 rounded-2xl mb-6">
                <Heart className="h-10 w-10 text-saffron" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Smart Matchmaking</h3>
              <p className="text-stone-600 leading-relaxed">Our advanced filters and algorithms suggest the most compatible matches based on your specific preferences.</p>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-maroon text-white p-8 rounded-3xl flex items-center gap-6 border-b-4 border-gold/30">
              <div className="bg-white/10 p-4 rounded-2xl">
                <ShieldCheck className="h-8 w-8 text-gold" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-1">Privacy Controls</h4>
                <p className="text-stone-300 text-sm">You have full control over who can see your photos and contact details.</p>
              </div>
            </div>
            <div className="bg-saffron text-white p-8 rounded-3xl flex items-center gap-6 border-b-4 border-orange-800">
              <div className="bg-white/10 p-4 rounded-2xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-1">Dedicated Support</h4>
                <p className="text-orange-50 text-sm">Our team is here to help you at every step of your journey to find a life partner.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Feedback & Member Reviews Section */}
      <div className="py-20 bg-stone-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-saffron/20 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-saffron/30">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>सदस्यांचे अभिप्राय (Member Reviews)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
              What Our Community Members Say
            </h2>
            <p className="text-stone-300 text-sm max-w-2xl mx-auto">
              Real feedback and experiences shared by families and candidates using Nashik Teli Samaj Vadhu-Var Parichay.
            </p>
          </div>

          {homeReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-stone-800/90 border border-stone-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-saffron/50 transition-all"
                >
                  <div className="space-y-4">
                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= (rev.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-600 fill-stone-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="text-stone-200 text-sm italic leading-relaxed">
                      "{rev.reviewText}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-700/60 mt-6 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{rev.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Community Member</span>
                      </div>
                    </div>
                    {rev.createdAt && (
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-stone-800/80 border border-stone-700 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-xl">
              <MessageSquare className="w-12 h-12 text-saffron mx-auto" />
              <h3 className="text-xl font-bold text-white">Share Your Experience!</h3>
              <p className="text-stone-300 text-sm leading-relaxed">
                Have you found your life partner or used our platform? We would love to hear your thoughts and feedback.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-saffron text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-orange-600 transition-all shadow-md shadow-saffron/20"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Submit Feedback & Review</span>
              </Link>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-amber-300 hover:text-white text-xs font-bold underline transition-colors"
            >
              <span>Have feedback or suggestions? Click here to submit a review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
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
