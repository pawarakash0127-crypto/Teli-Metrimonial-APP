import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, where, onSnapshot } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User, Database, Star, Edit, Trash2, ShieldCheck, UserPlus, Search, RefreshCw, BarChart2, KeyRound, Mail, MessageSquare, AlertCircle, Bell, UserX, HelpCircle, Check, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FloatingToast, { ToastMessage } from '../components/FloatingToast';
import { seedSampleProfilesToFirestore, SAMPLE_ACCOUNTS } from '../lib/seedProfiles';
import AdminUpdateUserCredentialsModal from '../components/AdminUpdateUserCredentialsModal';
import WelcomeEmailPreviewModal from '../components/WelcomeEmailPreviewModal';
import { sendAccountNotification } from '../lib/notificationUtils';
import { getOrAssignProfileId, getDisplayProfileId, matchesProfileId, extractSequenceNumber, runCompleteProfileIdMigration } from '../lib/profileIdUtils';
import { ContactUsSettings, getContactSettings, saveContactSettings, DEFAULT_CONTACT_SETTINGS, subscribeContactSettings } from '../lib/contactSettings';
import { MapPin, PhoneCall, Globe, Share2, Facebook, Instagram, Youtube, Linkedin, Twitter, Save } from 'lucide-react';
import { calculateMatchScore, generateNoMatchReason, calculateProfileCompleteness } from '../lib/matchingUtils';
import logoImg from '../assets/images/LOGO.jpg';

interface ProfileData {
  uid: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  status: string;
  createdAt: string;
  location?: string;
  profession?: string;
  education?: string;
  contactNumber?: string;
  email?: string;
  isFeatured?: boolean;
  deletionRequested?: boolean;
  deletionReason?: string;
  deletionRequestedAt?: string;
  partnerPreferences?: any;
  dob?: string;
  timeOfBirth?: string;
}

interface UserData {
  uid: string;
  email?: string;
  role: string;
  createdAt: string;
}

interface ContactQueryData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status?: string;
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserData[]>([]);
  const [contactQueries, setContactQueries] = useState<ContactQueryData[]>([]);
  const [counterData, setCounterData] = useState<{ currentSeq: number; lastNumber: number } | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'members' | 'zeroMatches' | 'adminNotifications' | 'admins' | 'sampleAccounts' | 'deletionRequests' | 'archived' | 'reviews' | 'contactSettings'>('overview');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'queries' | 'feedback' | 'newProfiles' | 'moderation'>('all');

  // Reviews & Feedback State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'home'>('all');

  // Contact Us settings state
  const [contactForm, setContactForm] = useState<ContactUsSettings>(DEFAULT_CONTACT_SETTINGS);
  const [savingContactSettings, setSavingContactSettings] = useState(false);
  
  const deletionProfiles = profiles.filter(p => (p.deletionRequested || p.status === 'deletion_pending') && !p.isArchived && p.status !== 'archived');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [membersPage, setMembersPage] = useState(1);

  useEffect(() => {
    setMembersPage(1);
  }, [searchTerm, genderFilter, statusFilter]);

  // Add new admin user state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Edit user credentials modal state
  const [selectedUserForCredentials, setSelectedUserForCredentials] = useState<any | null>(null);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);

  // Welcome Email Preview modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Non-blocking Modals state for Deletion & Rejection actions
  const [rejectingProfile, setRejectingProfile] = useState<ProfileData | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('Profile account deletion request rejected by Administrator.');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ profile: ProfileData; permanent: boolean } | null>(null);

  // Floating Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (profile?.role !== 'admin') return;

    setLoading(true);

    // Real-time listener for profiles
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), async (profilesSnap) => {
      if (profilesSnap.size < 5) {
        console.log("Admin auto-seeding sample profiles...");
        try {
          await seedSampleProfilesToFirestore();
        } catch (e) {
          console.error("Error auto-seeding sample profiles:", e);
        }
      }

      const fetchedProfiles: ProfileData[] = [];
      profilesSnap.forEach((docSnap) => {
        fetchedProfiles.push(docSnap.data() as ProfileData);
      });
      setProfiles(fetchedProfiles);
      setLoading(false);
    }, (error) => {
      console.error("Error in profiles real-time snapshot:", error);
      setLoading(false);
    });

    // Real-time listener for admin users
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubAdmins = onSnapshot(usersQuery, (usersSnap) => {
      const fetchedAdmins: UserData[] = [];
      usersSnap.forEach((docSnap) => {
        fetchedAdmins.push(docSnap.data() as UserData);
      });
      setAdminUsers(fetchedAdmins);
    }, (error) => {
      console.error("Error in admin users real-time snapshot:", error);
    });

    // Real-time listener for contact and feedback queries
    const unsubQueries = onSnapshot(collection(db, 'contactQueries'), (snap) => {
      const fetched: ContactQueryData[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as ContactQueryData);
      });
      fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setContactQueries(fetched);
    }, (error) => {
      console.warn("Error in contact queries snapshot:", error);
    });

    // Real-time listener for profile counter
    const unsubCounter = onSnapshot(doc(db, 'counters', 'profile_counter'), (counterSnap) => {
      if (counterSnap.exists()) {
        const cData = counterSnap.data();
        setCounterData({
          currentSeq: cData.lastNumber || cData.currentSeq || 0,
          lastNumber: cData.lastNumber || cData.currentSeq || 0
        });
      }
    }, (error) => {
      console.warn("Error in profile counter snapshot:", error);
    });

    // Real-time listener for admin notifications
    const unsubNotifs = onSnapshot(collection(db, 'admin_notifications'), (notifSnap) => {
      const fetchedNotifs: any[] = [];
      notifSnap.forEach((docSnap) => {
        fetchedNotifs.push({ id: docSnap.id, ...docSnap.data() });
      });
      fetchedNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAdminNotifications(fetchedNotifs);
    }, (error) => {
      console.warn("Error in admin notifications snapshot:", error);
    });

    // Real-time listener for contact settings
    const unsubContactSettings = subscribeContactSettings((settings) => {
      setContactForm(settings);
    });

    // Real-time listener for reviews
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
      const items: any[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReviewsList(items);
    }, (err) => {
      console.warn("Error in reviews snapshot:", err);
    });

    return () => {
      unsubProfiles();
      unsubAdmins();
      unsubQueries();
      unsubCounter();
      unsubNotifs();
      unsubContactSettings();
      unsubReviews();
    };
  }, [profile, authLoading, navigate]);

  // Automated 30-day permanent deletion for expired profile deletion requests & archives
  useEffect(() => {
    if (!profiles || profiles.length === 0) return;

    const expiredProfiles = profiles.filter(p => {
      const isPendingDeletion = (p as any).deletionRequested || p.status === 'deletion_pending';
      const isArchived = p.status === 'archived' || (p as any).isArchived;

      if (!isPendingDeletion && !isArchived) return false;

      const dDateStr = (p as any).deletionDate || (p as any).deletionRequestedAt || (p as any).archivedAt;
      if (!dDateStr) return false;

      const daysPassed = Math.floor((Date.now() - new Date(dDateStr).getTime()) / (1000 * 60 * 60 * 24));
      return daysPassed >= 30;
    });

    if (expiredProfiles.length > 0) {
      expiredProfiles.forEach(async (exp) => {
        try {
          console.log(`Auto-deleting expired profile (>30 days): ${exp.uid}`);
          await deleteDoc(doc(db, 'profiles', exp.uid));
          await deleteDoc(doc(db, 'users', exp.uid));
          await deleteDoc(doc(db, 'deletion_requests', exp.uid));
        } catch (err) {
          console.warn(`Error auto-deleting profile ${exp.uid}:`, err);
        }
      });
    }
  }, [profiles]);

  const handleUpdateQueryStatus = async (queryId: string, status: 'reviewed' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'contactQueries', queryId), { status });
      setToast({ type: 'success', text: `Query status updated to ${status}.` });
    } catch (err) {
      console.error("Error updating query status:", err);
      setToast({ type: 'error', text: 'Failed to update query status.' });
    }
  };

  const fetchAdminData = () => {
    handleSyncAllProfileIdsToFirestore(true);
  };

  const handleSyncAllProfileIdsToFirestore = async (showToast = false) => {
    setActionLoading('sync_profile_ids');
    try {
      const res = await runCompleteProfileIdMigration();
      if (showToast || res.updatedCount > 0) {
        setToast({ 
          type: 'success', 
          text: `Firestore DB Migration Complete! Audited ${res.totalCount} profiles across Firestore. Fixed ${res.updatedCount} IDs. Global counter updated to ${res.lastAssignedId}.` 
        });
      }
    } catch (err) {
      console.error("Error migrating profile IDs in Firestore:", err);
      if (showToast) setToast({ type: 'error', text: 'Failed to synchronize profile IDs in Firestore.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContactSettings(true);
    try {
      await saveContactSettings(contactForm);
      setToast({
        type: 'success',
        text: 'Contact Us settings updated in Firestore! All pages are now synced.'
      });
    } catch (err) {
      console.error('Error saving contact settings:', err);
      setToast({
        type: 'error',
        text: 'Failed to update Contact Us details in Firestore.'
      });
    } finally {
      setSavingContactSettings(false);
    }
  };

  const handleStatusChange = async (uid: string, newStatus: string) => {
    setActionLoading(uid);
    try {
      const docRef = doc(db, 'profiles', uid);
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setProfiles(profiles.map(p => p.uid === uid ? { ...p, status: newStatus } : p));
      setToast({ 
        type: 'success', 
        text: newStatus === 'approved' ? 'Profile approved successfully!' : 'Profile status set to ' + newStatus 
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({ type: 'error', text: 'Failed to update profile status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeature = async (uid: string, currentFeatured: boolean) => {
    setActionLoading(uid);
    try {
      const docRef = doc(db, 'profiles', uid);
      await updateDoc(docRef, { 
        isFeatured: !currentFeatured,
        updatedAt: new Date().toISOString()
      });
      setProfiles(profiles.map(p => p.uid === uid ? { ...p, isFeatured: !currentFeatured } : p));
      setToast({ 
        type: 'success', 
        text: !currentFeatured ? 'Profile added to Featured!' : 'Profile removed from Featured.' 
      });
    } catch (error) {
      console.error("Error toggling feature status:", error);
      setToast({ type: 'error', text: 'Failed to update featured status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProfile = (uid: string, name: string) => {
    const target = profiles.find(p => p.uid === uid);
    if (!target) return;
    setConfirmDeleteModal({ profile: target, permanent: false });
  };

  const handleAcceptDeletionRequest = (p: ProfileData, permanent = false) => {
    setConfirmDeleteModal({ profile: p, permanent });
  };

  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'admin_notifications', notifId), { read: true });
    } catch (e) {
      console.warn("Could not mark notification as read:", e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      const unread = adminNotifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, 'admin_notifications', n.id), { read: true });
      }
      setToast({ type: 'success', text: 'All notifications marked as read!' });
    } catch (e) {
      console.warn("Could not mark all notifications read:", e);
    }
  };

  const executeAcceptDeletionRequest = async (p: ProfileData, permanent: boolean) => {
    setActionLoading(p.uid);
    try {
      if (permanent) {
        await deleteDoc(doc(db, 'profiles', p.uid));
        try {
          await deleteDoc(doc(db, 'users', p.uid));
        } catch (e) {
          console.warn("Could not delete user doc:", e);
        }
        try {
          await deleteDoc(doc(db, 'deletion_requests', p.uid));
        } catch (e) {
          console.warn("Could not delete deletion_requests doc:", e);
        }
        setProfiles(profiles.filter(item => item.uid !== p.uid));
        setToast({ type: 'success', text: `Profile for ${p.firstName} ${p.lastName} permanently deleted.` });
      } else {
        const nowIso = new Date().toISOString();
        await updateDoc(doc(db, 'profiles', p.uid), {
          status: 'archived',
          isArchived: true,
          archivedAt: nowIso,
          deletionRequested: false,
          updatedAt: nowIso
        });

        try {
          await updateDoc(doc(db, 'users', p.uid), {
            deletionRequested: false
          });
        } catch (e) {
          console.warn("Could not update user doc:", e);
        }

        setProfiles(profiles.map(item => item.uid === p.uid ? { ...item, status: 'archived', isArchived: true, archivedAt: nowIso, deletionRequested: false } : item));
        setToast({ type: 'success', text: `Profile for ${p.firstName} ${p.lastName} archived for 30 days.` });
      }

      sendAccountNotification('deletion_approval', {
        userName: `${p.firstName} ${p.lastName}`,
        email: p.email,
        phone: p.contactNumber
      });
    } catch (error) {
      console.error("Error processing deletion request:", error);
      setToast({ type: 'error', text: 'Failed to process account deletion request.' });
    } finally {
      setActionLoading(null);
      setConfirmDeleteModal(null);
    }
  };

  const handleRecoverProfile = async (uid: string, name: string) => {
    setActionLoading(uid);
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, 'profiles', uid), {
        status: 'approved',
        isArchived: false,
        archivedAt: null,
        deletionRequested: false,
        updatedAt: nowIso
      });

      try {
        await updateDoc(doc(db, 'users', uid), {
          deletionRequested: false
        });
      } catch (e) {
        console.warn("Could not update user doc on recovery:", e);
      }

      setProfiles(profiles.map(p => p.uid === uid ? { ...p, status: 'approved', isArchived: false, archivedAt: undefined, deletionRequested: false } : p));

      setToast({ type: 'success', text: `Profile for ${name} recovered and brought back online!` });
    } catch (error) {
      console.error("Error recovering profile:", error);
      setToast({ type: 'error', text: 'Failed to recover profile.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeletionRequest = (p: ProfileData) => {
    setRejectingProfile(p);
    setRejectReasonText('Profile account deletion request rejected by Administrator.');
  };

  const executeRejectDeletionRequest = async () => {
    if (!rejectingProfile) return;
    const p = rejectingProfile;
    setActionLoading(p.uid);
    try {
      const pRef = doc(db, 'profiles', p.uid);
      const uRef = doc(db, 'users', p.uid);

      await updateDoc(pRef, {
        deletionRequested: false,
        deletionReason: '',
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      try {
        await updateDoc(uRef, {
          deletionRequested: false
        });
      } catch (e) {
        console.warn("Could not update user doc:", e);
      }

      setProfiles(profiles.map(item => item.uid === p.uid ? { ...item, deletionRequested: false, status: 'approved' } : item));

      sendAccountNotification('deletion_rejection', {
        userName: `${p.firstName} ${p.lastName}`,
        email: p.email,
        phone: p.contactNumber,
        reason: rejectReasonText || 'Deletion request reviewed and rejected by Admin.'
      });

      setToast({ type: 'success', text: `Deletion request rejected for ${p.firstName} ${p.lastName}. Member notified.` });
    } catch (error) {
      console.error("Error rejecting deletion request:", error);
      setToast({ type: 'error', text: 'Failed to reject deletion request.' });
    } finally {
      setActionLoading(null);
      setRejectingProfile(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      setToast({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setAddingAdmin(true);
    try {
      // Find existing user by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', newAdminEmail.trim().toLowerCase()));
      const snap = await getDocs(usersQuery);

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: 'admin'
        });
        setToast({ type: 'success', text: `Granted Admin role to ${newAdminEmail}.` });
      } else {
        // Create user record with admin role
        const newUid = 'admin_' + Date.now();
        await setDoc(doc(db, 'users', newUid), {
          uid: newUid,
          email: newAdminEmail.trim().toLowerCase(),
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        setToast({ type: 'success', text: `Created new Admin user entry for ${newAdminEmail}.` });
      }

      setNewAdminEmail('');
      fetchAdminData();
    } catch (error) {
      console.error("Error adding admin:", error);
      setToast({ type: 'error', text: 'Failed to grant admin access.' });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleToggleReviewHome = async (reviewId: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        showOnHome: !currentVal,
        status: !currentVal ? 'approved' : 'pending',
        updatedAt: new Date().toISOString()
      });
      setToast({ type: 'success', text: !currentVal ? 'Review enabled for Home Page!' : 'Review removed from Home Page.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Failed to update review.' });
    }
  };

  const handleReviewStatus = async (reviewId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setToast({ type: 'success', text: `Review status updated to ${newStatus}!` });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Failed to update review status.' });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setToast({ type: 'success', text: 'Review permanently deleted.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Failed to delete review.' });
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm("This will seed 20 complete sample profiles (10 Male & 10 Female) into the database. Continue?")) return;
    
    setSeeding(true);
    try {
      const res = await seedSampleProfilesToFirestore();
      setToast({ type: 'success', text: `Successfully seeded ${res.count} profiles (10 Male, 10 Female)!` });
      fetchAdminData();
    } catch (error) {
      console.error("Error seeding data:", error);
      setToast({ type: 'error', text: 'Failed to seed sample data.' });
    } finally {
      setSeeding(false);
    }
  };

  // Filtered members list
  const pendingProfiles = profiles.filter(p => p.status === 'pending');
  const approvedProfiles = profiles.filter(p => p.status === 'approved' && !p.isArchived && (p as any).role !== 'admin' && !(p as any).isAdmin);
  const featuredProfiles = profiles.filter(p => p.isFeatured && (p as any).role !== 'admin' && !(p as any).isAdmin);

  // Calculate Approved Users with Zero Matches & Diagnostic Reasons
  const zeroMatchProfiles = approvedProfiles.map(p => {
    const candidatePool = approvedProfiles.filter(cand => cand.uid !== p.uid);
    let matchCount = 0;
    for (const cand of candidatePool) {
      const scoreAnalysis = calculateMatchScore(p as any, cand as any);
      if (scoreAnalysis.isEligible && scoreAnalysis.matchPercentage >= 40) {
        matchCount++;
      }
    }
    const completeness = calculateProfileCompleteness(p as any);
    const diag = generateNoMatchReason(p as any, candidatePool as any);
    const profileId = getDisplayProfileId(p);

    return {
      profile: p,
      profileId,
      completeness,
      matchCount,
      category: diag.category,
      reasonDetail: diag.detail
    };
  }).filter(item => item.matchCount === 0);

  const newQueriesCount = contactQueries.filter(q => q.status === 'new' || !q.status).length;
  const unreadNotifsCount = adminNotifications.filter(n => !n.read).length;
  const maxSeqInList = Math.max(0, ...profiles.map(p => extractSequenceNumber(p.profileId || (p as any).vaduVarNumber)));
  const highestSeq = counterData?.lastNumber || maxSeqInList;
  const nextSeq = highestSeq + 1;
  const nextSeqFormatted = nextSeq <= 999 ? String(nextSeq).padStart(3, '0') : String(nextSeq);
  const nextVadhuId = `VADHU-${nextSeqFormatted}`;
  const nextVarId = `VAR-${nextSeqFormatted}`;

  const filteredMembers = profiles.filter(p => {
    const pId = getDisplayProfileId(p);
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          matchesProfileId(p, searchTerm) ||
                          (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.profession && p.profession.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesGender && matchesStatus;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const seqA = extractSequenceNumber(a.profileId || (a as any).vaduVarNumber || '');
    const seqB = extractSequenceNumber(b.profileId || (b as any).vaduVarNumber || '');
    if (seqA !== seqB) return seqA - seqB;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });

  const membersPageSize = 50;
  const totalMembersPages = Math.ceil(sortedMembers.length / membersPageSize) || 1;
  const currentMembersPage = Math.min(membersPage, totalMembersPages);
  const paginatedMembers = sortedMembers.slice((currentMembersPage - 1) * membersPageSize, currentMembersPage * membersPageSize);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Floating Toast Notification */}
      <FloatingToast message={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-gradient-to-r from-stone-900 via-stone-800 to-maroon text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gold/20">
        <div>
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="राष्ट्रीय तेली समाज" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-saffron shadow-md bg-white p-0.5" 
            />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {t('admin.dashboardTitle', 'Admin Control Portal')}
            </h1>
          </div>
          <p className="text-stone-300 text-xs sm:text-sm mt-1">
            नाशिक तेली समाज | Complete Administration & Member Profile Management System
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleSyncAllProfileIdsToFirestore(true)}
            disabled={actionLoading === 'sync_profile_ids'}
            className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-emerald-400/30 disabled:opacity-50"
            title="Sync unique VAR / VADHU IDs across all profile documents in Firestore"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            {actionLoading === 'sync_profile_ids' ? 'Syncing DB...' : 'Sync Database IDs'}
          </button>
          <button 
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-amber-400/30"
          >
            <Mail className="h-4 w-4 text-amber-300" />
            Welcome Email Preview
          </button>
          <button 
            onClick={fetchAdminData}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm border border-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button 
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-md disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            {seeding ? 'Seeding...' : t('admin.seedDataBtn', 'Seed Sample Profiles')}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
<div className="border-b border-stone-200 mb-8">
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 text-sm font-bold">
    
    {/* Overview */}
    <button
      onClick={() => setActiveTab('overview')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
        activeTab === 'overview'
          ? 'border-saffron text-saffron'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <BarChart2 className="w-4 h-4 shrink-0" />
      <span>{t('admin.systemStats', 'System Overview')}</span>
    </button>

    {/* Pending Approvals */}
    <button
      onClick={() => setActiveTab('pending')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'pending'
          ? 'border-saffron text-saffron'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <Clock className="w-4 h-4 shrink-0" />
      <span>{t('admin.pendingApprovals', 'Pending Approvals')}</span>

      {pendingProfiles.length > 0 && (
        <span className="bg-saffron text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {pendingProfiles.length}
        </span>
      )}
    </button>

    {/* All Members */}
    <button
      onClick={() => setActiveTab('members')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
        activeTab === 'members'
          ? 'border-saffron text-saffron'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <User className="w-4 h-4 shrink-0" />
      <span>
        {t('admin.allProfiles', 'All Member Profiles')} ({profiles.length})
      </span>
    </button>

    {/* Zero Matches */}
    <button
      onClick={() => setActiveTab('zeroMatches')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'zeroMatches'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <UserX className="w-4 h-4 text-orange-600 shrink-0" />
      <span>Users with 0 Matches</span>

      {zeroMatchProfiles.length > 0 && (
        <span className="bg-orange-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {zeroMatchProfiles.length}
        </span>
      )}
    </button>

    {/* Notifications */}
    <button
      onClick={() => setActiveTab('adminNotifications')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'adminNotifications'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <Bell className="w-4 h-4 text-saffron shrink-0" />
      <span>Admin Notifications & Queries</span>

      {(newQueriesCount + unreadNotifsCount) > 0 && (
        <span className="bg-saffron text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {newQueriesCount + unreadNotifsCount}
        </span>
      )}
    </button>

    {/* Admin Users */}
    <button
      onClick={() => setActiveTab('admins')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
        activeTab === 'admins'
          ? 'border-saffron text-saffron'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <UserPlus className="w-4 h-4 shrink-0" />
      <span>{t('admin.adminUsers', 'Admin Users')} ({adminUsers.length})</span>
    </button>

    {/* Sample Accounts */}
    <button
      onClick={() => setActiveTab('sampleAccounts')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
        activeTab === 'sampleAccounts'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <Database className="w-4 h-4 shrink-0" />
      <span>100 Test Accounts Credentials</span>
    </button>

    {/* Deletion Requests */}
    <button
      onClick={() => setActiveTab('deletionRequests')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'deletionRequests'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
      <span>Deletion Requests</span>

      {deletionProfiles.length > 0 && (
        <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {deletionProfiles.length}
        </span>
      )}
    </button>

    {/* Archived */}
    <button
      onClick={() => setActiveTab('archived')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'archived'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
      <span>Archived Profiles (30-Days)</span>

      {profiles.filter(
        p => p.status === 'archived' || (p as any).isArchived
      ).length > 0 && (
        <span className="bg-amber-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {
            profiles.filter(
              p => p.status === 'archived' || (p as any).isArchived
            ).length
          }
        </span>
      )}
    </button>

    {/* Contact Us Settings */}
    <button
      onClick={() => setActiveTab('contactSettings')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'contactSettings'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
      <span>Contact Us Settings</span>
    </button>

    {/* Member Reviews & Feedback */}
    <button
      onClick={() => setActiveTab('reviews')}
      className={`flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap relative ${
        activeTab === 'reviews'
          ? 'border-saffron text-saffron font-bold'
          : 'border-transparent text-stone-500 hover:text-stone-900'
      }`}
    >
      <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
      <span>Member Reviews & Feedback ({reviewsList.length})</span>
      {reviewsList.filter(r => r.status === 'pending').length > 0 && (
        <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          {reviewsList.filter(r => r.status === 'pending').length}
        </span>
      )}
    </button>

  </div>
</div>

      {/* TAB 1: OVERVIEW STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-orange-50 text-saffron rounded-2xl">
                <User className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {t('admin.totalMembers', 'Total Members')}
                </p>
                <p className="text-3xl font-black text-stone-900">{profiles.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {t('admin.pendingCount', 'Awaiting Approval')}
                </p>
                <p className="text-3xl font-black text-amber-600">{pendingProfiles.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {t('admin.approvedCount', 'Active Members')}
                </p>
                <p className="text-3xl font-black text-emerald-600">{approvedProfiles.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl">
                <Star className="h-7 w-7 fill-yellow-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {t('admin.featuredCount', 'Featured Profiles')}
                </p>
                <p className="text-3xl font-black text-yellow-600">{featuredProfiles.length}</p>
              </div>
            </div>
          </div>

          {/* Live Next Sequence & ID Counter Card */}
          <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-800 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-saffron/20 text-saffron rounded-2xl border border-saffron/30">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-white">Live Next ID Sequence (Database Synced)</h3>
                  <p className="text-xs text-stone-400">Atomic global counter maintained in Firestore (<code className="text-amber-300">counters/profile_counter</code>)</p>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                Firestore Synced
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="bg-stone-800/80 p-4.5 rounded-2xl border border-stone-700/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Current Last Sequence</p>
                <p className="text-3xl font-black text-stone-100 mt-1">{highestSeq}</p>
              </div>

              <div className="bg-stone-800/80 p-4.5 rounded-2xl border border-stone-700/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Next Sequence Number</p>
                <p className="text-3xl font-black text-amber-400 mt-1">{nextSeq}</p>
              </div>

              <div className="bg-pink-950/40 p-4.5 rounded-2xl border border-pink-500/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-300">Next Vadhu ID</p>
                <p className="text-3xl font-mono font-black text-pink-300 mt-1">{nextVadhuId}</p>
              </div>

              <div className="bg-blue-950/40 p-4.5 rounded-2xl border border-blue-500/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Next Var ID</p>
                <p className="text-3xl font-mono font-black text-blue-300 mt-1">{nextVarId}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-serif font-bold text-gold">Fast Review & Administration</h3>
              <p className="text-stone-300 text-sm mt-1">
                You have <span className="font-bold text-saffron">{pendingProfiles.length}</span> profiles awaiting verification. Review profile details, verify contact mobile numbers, or approve registrations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('pending')}
                className="bg-saffron text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-md text-sm whitespace-nowrap"
              >
                Review Pending ({pendingProfiles.length})
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-all text-sm whitespace-nowrap"
              >
                Add Admin User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {pendingProfiles.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-stone-200 shadow-sm">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">All Pending Profiles Reviewed!</h3>
              <p className="text-stone-500">There are no profiles currently awaiting approval.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProfiles.map((p) => (
                <div key={p.uid} className="bg-white rounded-3xl shadow-md border border-amber-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900">
                          {p.firstName} {p.lastName}
                        </h3>
                        <p className="text-xs text-stone-500">{p.gender} &bull; {p.age} Yrs &bull; {p.location || 'Nashik'}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1.5 mb-6 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <p><span className="font-bold text-stone-800">Education:</span> {p.education || 'N/A'}</p>
                      <p><span className="font-bold text-stone-800">Profession:</span> {p.profession || 'N/A'}</p>
                      <p><span className="font-bold text-stone-800">Contact:</span> {p.contactNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleStatusChange(p.uid, 'approved')}
                      disabled={actionLoading === p.uid}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(p.uid, 'rejected')}
                      disabled={actionLoading === p.uid}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => navigate(`/admin/edit/${p.uid}`)}
                      className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-all"
                      title="Edit Profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL MEMBERS DIRECTORY */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search name, location, job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-saffron focus:ring-saffron"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-saffron"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male (Groom)</option>
                <option value="Female">Female (Bride)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-saffron"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          {sortedMembers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-stone-200 shadow-sm">
              <User className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Member Profiles Found</h3>
              <p className="text-stone-500">Try adjusting your search query or filter options.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden p-4 sm:p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Profile ID</th>
                      <th className="p-4">Profile</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {paginatedMembers.map((p) => {
                      const pId = getDisplayProfileId(p);
                      return (
                        <tr key={p.uid} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-stone-900 text-amber-300 border border-amber-400/20 shadow-xs">
                              {pId}
                            </span>
                          </td>
                          <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold border shrink-0">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                                {p.firstName} {p.lastName}
                                {p.isFeatured && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                              </p>
                              <p className="text-xs text-stone-400">{p.location || 'Nashik'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-stone-700 font-medium">{p.gender}</td>
                        <td className="p-4 text-stone-700 font-medium">{p.age} Yrs</td>
                        <td className="p-4 text-stone-700 font-mono text-xs">{p.contactNumber || 'N/A'}</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              p.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status !== 'approved' && (
                              <button
                                onClick={() => handleStatusChange(p.uid, 'approved')}
                                disabled={actionLoading === p.uid}
                                className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleFeature(p.uid, !!p.isFeatured)}
                              disabled={actionLoading === p.uid}
                              className={`p-2 rounded-xl transition-all ${
                                p.isFeatured ? 'text-yellow-600 bg-yellow-50' : 'text-stone-400 hover:text-yellow-600 hover:bg-yellow-50'
                              }`}
                              title={p.isFeatured ? "Remove Featured" : "Make Featured"}
                            >
                              <Star className={`h-4 w-4 ${p.isFeatured ? 'fill-yellow-500' : ''}`} />
                            </button>

                             <button
                              onClick={() => {
                                setSelectedUserForCredentials(p);
                                setCredentialsModalOpen(true);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Update Email & Password Credentials"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => navigate(`/admin/edit/${p.uid}`)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Edit Member Profile"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteProfile(p.uid, `${p.firstName} ${p.lastName}`)}
                              disabled={actionLoading === p.uid}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Profile"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <p className="text-xs font-medium text-stone-500">
                  Showing <span className="font-bold text-stone-800">{(currentMembersPage - 1) * membersPageSize + 1}</span> to <span className="font-bold text-stone-800">{Math.min(currentMembersPage * membersPageSize, sortedMembers.length)}</span> of <span className="font-bold text-stone-800">{sortedMembers.length}</span> member profiles
                </p>

                {totalMembersPages > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      disabled={currentMembersPage <= 1}
                      onClick={() => setMembersPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    >
                      Prev
                    </button>

                    {Array.from({ length: totalMembersPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setMembersPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          pageNum === currentMembersPage
                            ? 'bg-saffron text-white shadow-xs'
                            : 'border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      disabled={currentMembersPage >= totalMembersPages}
                      onClick={() => setMembersPage(prev => Math.min(totalMembersPages, prev + 1))}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: USERS WITH NO MATCHES */}
      {activeTab === 'zeroMatches' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-950 via-stone-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-400/30">
                    <UserX className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">Users With No Matches (Diagnostics)</h3>
                </div>
                <p className="text-stone-300 text-sm max-w-2xl">
                  Automated matchmaking diagnostic tool. Analyzes profile completeness, preference constraints (age, location, education), and Guna thresholds to show exact reasons why a user currently has 0 matches.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shrink-0">
                <div className="text-right">
                  <p className="text-xs uppercase font-bold text-stone-300">Zero Match Count</p>
                  <p className="text-2xl font-black text-orange-400">{zeroMatchProfiles.length} Members</p>
                </div>
              </div>
            </div>
          </div>

          {zeroMatchProfiles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-stone-900">Great News! All Active Users Have Matched Candidates</h4>
              <p className="text-stone-500 text-sm mt-1">There are currently no approved member profiles with zero candidate matches.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {zeroMatchProfiles.map(({ profile: p, profileId, completeness, matchCount, category, reasonDetail }) => (
                <div key={p.uid} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-500 shrink-0">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-serif font-bold text-stone-900">{p.firstName} {p.lastName}</h4>
                        <span className="bg-stone-100 text-stone-800 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-stone-300">
                          {profileId}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${p.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {p.gender} • {p.age} Yrs
                        </span>
                        <span className="bg-red-100 text-red-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                          0 Matches
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 font-medium">
                        <span>📍 {p.location || 'Location Not Set'}</span>
                        <span>🎓 {p.education || 'Education Not Set'}</span>
                        <span>💼 {p.profession || 'Profession Not Set'}</span>
                        <span>📞 {p.contactNumber || 'N/A'}</span>
                      </div>

                      {/* Completeness Bar */}
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-600 shrink-0">Completion: {completeness}%</span>
                        <div className="w-36 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                          <div 
                            className={`h-full rounded-full ${completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                      </div>

                      {/* Reason Diagnostic Box */}
                      <div className="mt-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <strong className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">{category}</strong>
                        </div>
                        <p className="text-amber-900 font-medium leading-relaxed">{reasonDetail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto">
                    <button
                      onClick={() => navigate(`/admin/edit/${p.uid}`)}
                      className="w-full lg:w-auto px-5 py-2.5 bg-saffron hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit & Assist Member</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ADMIN NOTIFICATIONS & HELPDESK */}
      {activeTab === 'adminNotifications' && (
        <div className="space-y-6">
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2.5 bg-saffron/20 text-saffron rounded-2xl border border-saffron/30">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">Admin Notifications & Helpdesk</h3>
                </div>
                <p className="text-stone-300 text-sm">
                  System logs for new registrations, Contact Us inquiries, website feedback, and moderation events. (User-to-user interest notifications are excluded).
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={handleMarkAllNotifsRead}
                    className="bg-saffron text-white font-bold text-xs px-3.5 py-1.5 rounded-full hover:bg-orange-600 transition-all shadow-sm"
                  >
                    Mark All Read ({unreadNotifsCount})
                  </button>
                )}
                <span className="bg-stone-800 text-stone-200 font-bold text-xs px-3 py-1.5 rounded-full border border-stone-700">
                  {newQueriesCount} Pending Inquiries
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-6 border-t border-stone-800 mt-6 text-xs font-bold">
              <button
                onClick={() => setNotificationFilter('all')}
                className={`px-4 py-2 rounded-xl transition-all ${notificationFilter === 'all' ? 'bg-saffron text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
              >
                All Records ({contactQueries.length + adminNotifications.length + reviewsList.length})
              </button>
              <button
                onClick={() => setNotificationFilter('queries')}
                className={`px-4 py-2 rounded-xl transition-all ${notificationFilter === 'queries' ? 'bg-saffron text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
              >
                Contact & Support Queries ({contactQueries.filter(q => q.subject !== 'Website Feedback').length})
              </button>
              <button
                onClick={() => setNotificationFilter('feedback')}
                className={`px-4 py-2 rounded-xl transition-all ${notificationFilter === 'feedback' ? 'bg-saffron text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
              >
                Feedback & Reviews Submissions ({reviewsList.length + contactQueries.filter(q => q.subject === 'Website Feedback').length})
              </button>
              <button
                onClick={() => setNotificationFilter('newProfiles')}
                className={`px-4 py-2 rounded-xl transition-all ${notificationFilter === 'newProfiles' ? 'bg-saffron text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
              >
                New Registration Notifications ({adminNotifications.length})
              </button>
            </div>
          </div>

          {/* Submitted Member Feedback & Reviews Stream */}
          {(notificationFilter === 'all' || notificationFilter === 'feedback') && (
            <div className="space-y-4">
              <h4 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Submitted Feedback & Member Reviews ({reviewsList.length})</span>
              </h4>

              {reviewsList.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-stone-200">
                  <Star className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-600 text-sm font-medium">No feedback or reviews submitted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-4 hover:border-saffron/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-serif font-bold text-stone-900 text-lg">{rev.name}</h5>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              rev.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : rev.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {rev.status || 'pending'}
                            </span>
                            {rev.showOnHome && (
                              <span className="bg-saffron text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                                Featured on Home Page
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1 font-medium">
                            <span>📱 {rev.phone || 'N/A'}</span>
                            {rev.email && <span>✉️ {rev.email}</span>}
                            <span>🆔 {rev.uid ? `UID: ${rev.uid}` : 'Guest User'}</span>
                            {rev.createdAt && <span>📅 {new Date(rev.createdAt).toLocaleString('en-IN')}</span>}
                          </div>
                        </div>

                        {/* Star Rating Display */}
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl w-fit">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= (rev.rating || 5)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-stone-300 fill-stone-100'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-amber-900 ml-1.5">
                            {rev.rating || 5}/5
                          </span>
                        </div>
                      </div>

                      {/* Review Text Body */}
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60 text-stone-800 text-sm italic leading-relaxed">
                        "{rev.reviewText}"
                      </div>

                      {/* Action Controls & Show on Home Page Toggle */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer bg-amber-50/80 hover:bg-amber-100/90 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 transition-all border border-amber-300/80 shadow-xs">
                          <input
                            type="checkbox"
                            checked={rev.showOnHome === true}
                            onChange={() => handleToggleReviewHome(rev.id, rev.showOnHome === true)}
                            className="w-4 h-4 accent-saffron rounded cursor-pointer"
                          />
                          <span>Show on Home Page</span>
                        </label>

                        <div className="flex items-center gap-2">
                          {rev.status !== 'approved' && (
                            <button
                              onClick={() => handleReviewStatus(rev.id, 'approved')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                          {rev.status !== 'rejected' && (
                            <button
                              onClick={() => handleReviewStatus(rev.id, 'rejected')}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all border border-red-200 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Database Admin Notifications (New Registrations Alert Stream) */}
          {(notificationFilter === 'all' || notificationFilter === 'newProfiles') && adminNotifications.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-saffron" />
                <span>Live Registration Alerts Stream ({adminNotifications.length})</span>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {adminNotifications.map(n => (
                  <div
                    key={n.id}
                    className={`bg-white rounded-3xl p-5 border shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      !n.read ? 'border-saffron/60 bg-orange-50/30' : 'border-stone-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-3 rounded-2xl font-bold ${!n.read ? 'bg-saffron text-white' : 'bg-stone-100 text-stone-500'}`}>
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="font-serif font-bold text-stone-900 text-base">{n.userName || 'New Member'}</h5>
                          <span className="px-2.5 py-0.5 bg-stone-900 text-amber-300 font-mono text-[11px] font-black rounded-md">
                            {n.profileId || 'PENDING'}
                          </span>
                          {!n.read && (
                            <span className="px-2 py-0.5 bg-saffron text-white text-[10px] font-black uppercase rounded-full tracking-wider animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500">
                          <span>Category: <strong className="text-stone-800">{n.category || (n.gender === 'Female' ? 'Vadhu' : 'Var')}</strong></span> &bull; 
                          <span> Method: <strong className="text-stone-800">{n.registrationMethod || 'Registration'}</strong></span> &bull; 
                          <span> Time: {new Date(n.createdAt || Date.now()).toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {n.uid && (
                        <button
                          onClick={() => navigate(`/admin/edit/${n.uid}`)}
                          className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all"
                        >
                          View Member
                        </button>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => handleMarkNotifRead(n.id)}
                          className="px-3.5 py-1.5 bg-saffron hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Us / Support Queries List */}
          {(notificationFilter === 'all' || notificationFilter === 'queries' || notificationFilter === 'feedback') && (
            <div className="space-y-4">
              <h4 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-saffron" />
                <span>Contact Us & Feedback Messages</span>
              </h4>

              {contactQueries.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-stone-200">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-stone-600 text-sm font-medium">No contact or feedback inquiries received yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {contactQueries
                    .filter(q => {
                      if (notificationFilter === 'feedback') return q.subject === 'Website Feedback';
                      if (notificationFilter === 'queries') return q.subject !== 'Website Feedback';
                      return true;
                    })
                    .map(q => (
                      <div key={q.id} className={`bg-white rounded-3xl p-6 border shadow-sm transition-all ${q.status === 'resolved' ? 'border-stone-200 opacity-75' : q.status === 'reviewed' ? 'border-amber-200 bg-amber-50/20' : 'border-saffron/40 bg-orange-50/20'}`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 text-saffron rounded-2xl font-bold">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-serif font-bold text-stone-900 text-base">{q.name}</h5>
                              <p className="text-xs text-stone-500">
                                {q.email && <span>✉️ {q.email} &bull; </span>}
                                {q.phone && <span>📞 {q.phone} &bull; </span>}
                                {new Date(q.createdAt || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${q.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : q.status === 'reviewed' ? 'bg-amber-100 text-amber-800' : 'bg-saffron text-white'}`}>
                              {q.status || 'New Inquiry'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-stone-200 text-sm text-stone-800 space-y-1 mb-4">
                          <p className="font-bold text-saffron text-xs uppercase tracking-wide">Subject: {q.subject || 'General Inquiry'}</p>
                          <p className="whitespace-pre-wrap text-stone-700">{q.message}</p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                          {q.status !== 'reviewed' && (
                            <button
                              onClick={() => handleUpdateQueryStatus(q.id, 'reviewed')}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all"
                            >
                              Mark as Reviewed
                            </button>
                          )}
                          {q.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateQueryStatus(q.id, 'resolved')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark as Resolved</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* New Profile Registrations */}
          {(notificationFilter === 'all' || notificationFilter === 'newProfiles') && (
            <div className="space-y-4 pt-4">
              <h4 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-saffron" />
                <span>Recent Profile Registrations Log ({profiles.length})</span>
              </h4>

              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm divide-y divide-stone-100">
                {profiles.slice(0, 10).map(p => (
                  <div key={p.uid} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 text-stone-700 rounded-xl font-bold text-xs">
                        {getDisplayProfileId(p)}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-stone-500">Registered: {new Date(p.createdAt || Date.now()).toLocaleDateString()} &bull; {p.gender} &bull; {p.location || 'Nashik'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {p.status}
                      </span>
                      <button
                        onClick={() => navigate(`/admin/edit/${p.uid}`)}
                        className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl"
                      >
                        Review Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ADMIN USERS MANAGEMENT */}
      {activeTab === 'admins' && (
        <div className="space-y-8">
          {/* Add New Admin Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-saffron" />
              {t('admin.addAdminTitle', 'Grant Admin Privileges')}
            </h3>
            <p className="text-stone-500 text-sm mb-6">
              Grant admin management rights to another community coordinator email. They will be able to review, edit, approve, or reject matrimonial profiles.
            </p>

            <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter user email address (e.g. admin@nashikteli.com)"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:border-saffron focus:ring-saffron"
                required
              />
              <button
                type="submit"
                disabled={addingAdmin}
                className="bg-saffron text-white font-bold px-6 py-3 rounded-2xl hover:bg-orange-600 transition-all shadow-md text-sm whitespace-nowrap disabled:opacity-50"
              >
                {addingAdmin ? 'Processing...' : t('admin.grantAdminBtn', 'Grant Admin Access')}
              </button>
            </form>
          </div>

          {/* Existing Admin List */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-6">Active Administrator Accounts</h3>

            {adminUsers.length === 0 ? (
              <p className="text-stone-500 text-sm">No secondary admin accounts registered.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {adminUsers.map((admin) => (
                  <div key={admin.uid} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-saffron/10 text-saffron rounded-2xl">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{admin.email || admin.uid}</p>
                        <p className="text-xs text-stone-400">Role: Administrator &bull; Added: {new Date(admin.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                      Active Admin
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: 20 TEST ACCOUNTS CREDENTIALS */}
      {activeTab === 'sampleAccounts' && (
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">100 Seeded Member Accounts</h3>
              <p className="text-stone-500 text-sm">
                50 Male profiles and 50 Female profiles across Maharashtra with realistic names, educations, professions, gotras, photos, and partner preferences.
              </p>
            </div>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="bg-saffron hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-saffron/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Database className="w-5 h-5" />
              {seeding ? 'Seeding Accounts...' : 'Seed / Re-Seed All 100 Profiles'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <h4 className="font-bold text-stone-800 text-lg">Test Accounts Credentials List</h4>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                Default Password for all: Password123!
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-4">#</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Email ID</th>
                    <th className="p-4">Password</th>
                    <th className="p-4">Occupation</th>
                    <th className="p-4">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {SAMPLE_ACCOUNTS.map((acc, index) => (
                    <tr key={acc.uid} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 font-bold text-stone-400">{index + 1}</td>
                      <td className="p-4 font-bold text-stone-900">{acc.firstName} {acc.lastName}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${acc.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {acc.gender}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-saffron font-bold">{acc.email}</td>
                      <td className="p-4 font-mono text-xs text-stone-800 font-bold">Password123!</td>
                      <td className="p-4 text-xs font-medium">{acc.profession}</td>
                      <td className="p-4 text-xs font-medium">{acc.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DELETION REQUESTS */}
      {activeTab === 'deletionRequests' && (
        <div className="space-y-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-red-600 text-white rounded-2xl shadow-md">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">Account Deletion Requests</h3>
                <p className="text-xs text-stone-600 font-medium mt-0.5">Review member requests to delete their account profile. Accepting will archive their profile for 30 days during which it can be recovered.</p>
              </div>
            </div>
            <span className="bg-red-100 text-red-800 font-bold text-xs px-4 py-2 rounded-full border border-red-200 shrink-0">
              {deletionProfiles.length} Pending Deletion Request(s)
            </span>
          </div>

          {deletionProfiles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-stone-800">No Pending Deletion Requests</h4>
              <p className="text-stone-500 text-sm mt-1">There are currently no active account removal requests from users.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deletionProfiles.map(p => (
                <div key={p.uid} className="bg-white rounded-3xl p-6 border-2 border-red-100 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-red-300 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center font-bold text-stone-400">
                      {(p as any).photoUrl ? (
                        <img src={(p as any).photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-serif font-bold text-stone-900">{p.firstName} {p.lastName}</h4>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${p.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {p.gender} • {p.age} yrs
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 font-medium">
                        <span>📞 {p.contactNumber || 'N/A'}</span>
                        {p.email && <span>✉️ {p.email}</span>}
                        {p.location && <span>📍 {p.location}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                          Reason: {p.deletionReason || 'No specific reason provided'}
                        </p>
                        <span className="text-xs text-red-800 font-black bg-red-100 px-3 py-1.5 rounded-xl border border-red-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-red-600" />
                          {(() => {
                            const dDateStr = (p as any).deletionDate || (p as any).deletionRequestedAt || (p as any).archivedAt;
                            if (!dDateStr) return '30 / 30 Days Remaining';
                            const daysPassed = Math.floor((Date.now() - new Date(dDateStr).getTime()) / (1000 * 60 * 60 * 24));
                            const daysRemaining = Math.max(0, 30 - daysPassed);
                            return `${daysRemaining} / 30 Days Remaining`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                    <button
                      disabled={actionLoading === p.uid}
                      onClick={() => handleRejectDeletionRequest(p)}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all border border-stone-300 disabled:opacity-50"
                      title="Keep profile active and clear deletion request"
                    >
                      Reject Request
                    </button>
                    <button
                      disabled={actionLoading === p.uid}
                      onClick={() => handleAcceptDeletionRequest(p, false)}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                      title="Archive profile for 30 days during which it can be recovered"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {actionLoading === p.uid ? 'Processing...' : 'Accept & Archive (30 Days)'}
                    </button>
                    <button
                      disabled={actionLoading === p.uid}
                      onClick={() => handleAcceptDeletionRequest(p, true)}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      title="Permanently remove profile immediately"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ARCHIVED PROFILES */}
      {activeTab === 'archived' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-amber-600 text-white rounded-2xl shadow-md">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">Archived Profiles (30-Days Grace Period)</h3>
                <p className="text-xs text-stone-600 font-medium mt-0.5">Profiles archived upon deletion request or admin action. These profiles are hidden from search and members. You can recover any profile to bring it back online instantly.</p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-900 font-bold text-xs px-4 py-2 rounded-full border border-amber-300 shrink-0">
              {profiles.filter(p => p.status === 'archived' || (p as any).isArchived).length} Archived Profile(s)
            </span>
          </div>

          {profiles.filter(p => p.status === 'archived' || (p as any).isArchived).length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-stone-800">No Archived Profiles</h4>
              <p className="text-stone-500 text-sm mt-1">There are currently no archived or soft-deleted profiles in the database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {profiles.filter(p => p.status === 'archived' || (p as any).isArchived).map(p => {
                const archivedAtDate = (p as any).archivedAt ? new Date((p as any).archivedAt) : new Date();
                const daysPassed = Math.floor((Date.now() - archivedAtDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysRemaining = Math.max(0, 30 - daysPassed);

                return (
                  <div key={p.uid} className="bg-white rounded-3xl p-6 border-2 border-amber-100 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-amber-300 transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center font-bold text-stone-400">
                        {(p as any).photoUrl ? (
                          <img src={(p as any).photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-serif font-bold text-stone-900">{p.firstName} {p.lastName}</h4>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${p.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                            {p.gender} • {p.age} yrs
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 font-medium">
                          <span>📞 {p.contactNumber || 'N/A'}</span>
                          {p.email && <span>✉️ {p.email}</span>}
                          {p.location && <span>📍 {p.location}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-amber-800 font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                            Archived on: {archivedAtDate.toLocaleDateString()}
                          </span>
                          <span className="text-xs text-red-700 font-extrabold bg-red-50 px-3 py-1 rounded-xl border border-red-200">
                            {daysRemaining} day(s) remaining for recovery
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                      <button
                        disabled={actionLoading === p.uid}
                        onClick={() => handleRecoverProfile(p.uid, `${p.firstName} ${p.lastName}`)}
                        className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {actionLoading === p.uid ? 'Recovering...' : 'Recover Profile (Bring Online)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 11: MEMBER REVIEWS & FEEDBACK */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
            <div>
              <div className="flex items-center gap-2 text-saffron font-bold text-sm mb-1">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Member Reviews & Testimonials</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                Manage Member Reviews & Home Page Testimonials
              </h2>
              <p className="text-stone-500 text-xs mt-1">
                Review submitted feedback, approve/reject reviews, and control which testimonials appear on the Home Page.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All ({reviewsList.length})
              </button>
              <button
                onClick={() => setReviewFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Pending ({reviewsList.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setReviewFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Approved ({reviewsList.filter(r => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setReviewFilter('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'home'
                    ? 'bg-saffron text-white shadow-xs'
                    : 'bg-orange-50 text-saffron hover:bg-orange-100'
                }`}
              >
                Featured on Home ({reviewsList.filter(r => r.showOnHome).length})
              </button>
            </div>
          </div>

          {/* Reviews List */}
          {reviewsList.filter(r => {
            if (reviewFilter === 'pending') return r.status === 'pending';
            if (reviewFilter === 'approved') return r.status === 'approved';
            if (reviewFilter === 'rejected') return r.status === 'rejected';
            if (reviewFilter === 'home') return r.showOnHome === true;
            return true;
          }).length === 0 ? (
            <div className="text-center py-12 text-stone-500 bg-stone-50 rounded-2xl border border-stone-200/60">
              <Star className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="font-bold text-stone-700">No reviews found for this filter.</p>
              <p className="text-xs text-stone-500">Reviews submitted from the Contact Us page will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reviewsList.filter(r => {
                if (reviewFilter === 'pending') return r.status === 'pending';
                if (reviewFilter === 'approved') return r.status === 'approved';
                if (reviewFilter === 'rejected') return r.status === 'rejected';
                if (reviewFilter === 'home') return r.showOnHome === true;
                return true;
              }).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs hover:border-saffron/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-stone-900 text-lg">{rev.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            rev.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : rev.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {rev.status || 'pending'}
                        </span>
                        {rev.showOnHome && (
                          <span className="bg-saffron text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                            Featured on Home Page
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1 font-medium">
                        {rev.phone && <span>📱 Phone: {rev.phone}</span>}
                        {rev.email && <span>✉️ Email: {rev.email}</span>}
                        {rev.createdAt && (
                          <span>📅 {new Date(rev.createdAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl w-fit">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= (rev.rating || 5)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-300 fill-stone-100'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-900 ml-1.5">
                        {rev.rating || 5}/5
                      </span>
                    </div>
                  </div>

                  {/* Review Text Body */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60 text-stone-800 text-sm italic leading-relaxed">
                    "{rev.reviewText}"
                  </div>

                  {/* Action Controls & Home Page Checkbox */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    {/* Toggle Show on Home Page */}
                    <label className="inline-flex items-center gap-2.5 cursor-pointer bg-stone-100 hover:bg-stone-200/80 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-800 transition-colors border border-stone-300/80">
                      <input
                        type="checkbox"
                        checked={rev.showOnHome === true}
                        onChange={() => handleToggleReviewHome(rev.id, rev.showOnHome === true)}
                        className="w-4 h-4 accent-saffron rounded cursor-pointer"
                      />
                      <span>Enable on Home Page Carousel</span>
                    </label>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {rev.status !== 'approved' && (
                        <button
                          onClick={() => handleReviewStatus(rev.id, 'approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          onClick={() => handleReviewStatus(rev.id, 'rejected')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all border border-red-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'contactSettings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
            <div>
              <div className="flex items-center gap-2 text-saffron font-bold text-sm mb-1">
                <PhoneCall className="w-5 h-5" />
                <span>Contact Us Management System</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900">Manage Dynamic Website Contact Details</h2>
              <p className="text-stone-500 text-xs mt-1">
                Updates here are saved directly to Firestore (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">settings/contact_us</code>) and immediately sync across the Contact Us page, Footer, and Help desk.
              </p>
            </div>

            <button
              type="submit"
              form="contact-settings-form"
              disabled={savingContactSettings}
              className="bg-saffron hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{savingContactSettings ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>

          <form id="contact-settings-form" onSubmit={handleSaveContactSettings} className="space-y-8">
            {/* Contact Phone & Email Numbers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-saffron" />
                <span>Contact Phone Numbers & Emails</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Primary Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.phone || ''}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Secondary Phone Number</label>
                  <input
                    type="text"
                    value={contactForm.secondaryPhone || ''}
                    onChange={(e) => setContactForm({ ...contactForm, secondaryPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="+91 98765 43211"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">WhatsApp Support Number</label>
                  <input
                    type="text"
                    value={contactForm.whatsappNumber || ''}
                    onChange={(e) => setContactForm({ ...contactForm, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Primary Support Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email || ''}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="support@nashiktelisamaj.org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Secondary Email</label>
                  <input
                    type="email"
                    value={contactForm.secondaryEmail || ''}
                    onChange={(e) => setContactForm({ ...contactForm, secondaryEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="info@nashiktelisamaj.org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Office / Support Hours</label>
                  <input
                    type="text"
                    value={contactForm.officeHours || ''}
                    onChange={(e) => setContactForm({ ...contactForm, officeHours: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="Mon - Sat: 10:00 AM - 6:00 PM"
                  />
                </div>
              </div>
            </div>

            {/* Office Address Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-saffron" />
                <span>Office Address Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Office / Organization Name</label>
                  <input
                    type="text"
                    value={contactForm.officeName || ''}
                    onChange={(e) => setContactForm({ ...contactForm, officeName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="Sneh Bandhan Vivah Mandal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Address Line</label>
                  <input
                    type="text"
                    value={contactForm.addressLine || ''}
                    onChange={(e) => setContactForm({ ...contactForm, addressLine: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="Nashik District Teli Samaj Bhavan, Panchavati"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">City</label>
                    <input
                      type="text"
                      value={contactForm.city || ''}
                      onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      placeholder="Nashik"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">State</label>
                    <input
                      type="text"
                      value={contactForm.state || ''}
                      onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Country</label>
                    <input
                      type="text"
                      value={contactForm.country || ''}
                      onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      placeholder="India"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">PIN / ZIP Code</label>
                    <input
                      type="text"
                      value={contactForm.pincode || ''}
                      onChange={(e) => setContactForm({ ...contactForm, pincode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                      placeholder="422003"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Google Maps URL / Location Link</label>
                  <input
                    type="url"
                    value={contactForm.googleMapsUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, googleMapsUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-saffron" />
                <span>Social Media Links</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span>Facebook URL</span>
                  </label>
                  <input
                    type="url"
                    value={contactForm.facebookUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, facebookUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="https://facebook.com/nashiktelisamaj"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>Instagram URL</span>
                  </label>
                  <input
                    type="url"
                    value={contactForm.instagramUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="https://instagram.com/nashiktelisamaj"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>YouTube Channel URL</span>
                  </label>
                  <input
                    type="url"
                    value={contactForm.youtubeUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, youtubeUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="https://youtube.com/nashiktelisamaj"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Linkedin className="w-4 h-4 text-blue-700" />
                    <span>LinkedIn URL</span>
                  </label>
                  <input
                    type="url"
                    value={contactForm.linkedinUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, linkedinUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="https://linkedin.com/company/nashiktelisamaj"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Twitter className="w-4 h-4 text-sky-500" />
                    <span>Twitter / X URL</span>
                  </label>
                  <input
                    type="url"
                    value={contactForm.twitterUrl || ''}
                    onChange={(e) => setContactForm({ ...contactForm, twitterUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                    placeholder="https://x.com/nashiktelisamaj"
                  />
                </div>
              </div>
            </div>

            {/* Page Header Notice */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
                Contact Page Announcement / Notice
              </h3>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Support Notice Banner Text</label>
                <textarea
                  rows={2}
                  value={contactForm.supportNotice || ''}
                  onChange={(e) => setContactForm({ ...contactForm, supportNotice: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm"
                  placeholder="Have questions regarding profile registration, verification, or community events? Send us a message or connect with our support team."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={savingContactSettings}
                className="bg-saffron hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingContactSettings ? 'Saving Changes...' : 'Save Contact Details to Firestore'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Update User Credentials Modal */}
      <AdminUpdateUserCredentialsModal
        isOpen={credentialsModalOpen}
        userProfile={selectedUserForCredentials}
        onClose={() => {
          setCredentialsModalOpen(false);
          setSelectedUserForCredentials(null);
        }}
        onSuccess={fetchAdminData}
      />

      {/* Reject Deletion Request Reason Modal */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">
              Reject Deletion Request
            </h3>
            <p className="text-sm text-stone-600 mb-4 font-medium">
              You are rejecting the account deletion request for <strong className="text-stone-900">{rejectingProfile.firstName} {rejectingProfile.lastName}</strong>. Their profile will remain active.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Rejection Reason / Note to Member
              </label>
              <textarea
                rows={3}
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-2xl p-3 text-sm focus:border-saffron focus:ring-saffron outline-none transition-all font-medium"
                placeholder="Enter rejection reason or guidance..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setRejectingProfile(null)}
                className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === rejectingProfile.uid}
                onClick={executeRejectDeletionRequest}
                className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {actionLoading === rejectingProfile.uid ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion / Archival Confirmation Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 rounded-2xl ${confirmDeleteModal.permanent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  {confirmDeleteModal.permanent ? 'Permanent Deletion Warning' : 'Archive Profile Confirmation'}
                </h3>
                <p className="text-xs text-stone-500 font-bold">Member: {confirmDeleteModal.profile.firstName} {confirmDeleteModal.profile.lastName}</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 mb-6 font-medium leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100">
              {confirmDeleteModal.permanent
                ? `PERMANENT DELETE WARNING: Are you sure you want to PERMANENTLY delete ${confirmDeleteModal.profile.firstName} ${confirmDeleteModal.profile.lastName}'s profile and user account? This action cannot be undone.`
                : `Are you sure you want to archive ${confirmDeleteModal.profile.firstName} ${confirmDeleteModal.profile.lastName}'s profile? The profile will be safely archived for 30 days during which it can be recovered anytime.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === confirmDeleteModal.profile.uid}
                onClick={() => executeAcceptDeletionRequest(confirmDeleteModal.profile, confirmDeleteModal.permanent)}
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                  confirmDeleteModal.permanent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading === confirmDeleteModal.profile.uid ? 'Processing...' : confirmDeleteModal.permanent ? 'Delete Permanently' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Email Preview Modal */}
      <WelcomeEmailPreviewModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
