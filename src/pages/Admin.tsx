import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, where, onSnapshot } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User, Database, Star, Edit, Trash2, ShieldCheck, UserPlus, Search, RefreshCw, BarChart2, KeyRound, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FloatingToast, { ToastMessage } from '../components/FloatingToast';
import { seedSampleProfilesToFirestore, SAMPLE_ACCOUNTS } from '../lib/seedProfiles';
import AdminUpdateUserCredentialsModal from '../components/AdminUpdateUserCredentialsModal';
import WelcomeEmailPreviewModal from '../components/WelcomeEmailPreviewModal';
import { sendAccountNotification } from '../lib/notificationUtils';

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
}

interface UserData {
  uid: string;
  email?: string;
  role: string;
  createdAt: string;
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'members' | 'admins' | 'sampleAccounts' | 'deletionRequests' | 'archived'>('overview');
  
  const deletionProfiles = profiles.filter(p => (p.deletionRequested || p.status === 'deletion_pending') && !p.isArchived && p.status !== 'archived');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

    return () => {
      unsubProfiles();
      unsubAdmins();
    };
  }, [profile, authLoading, navigate]);

  const fetchAdminData = () => {
    setToast({ type: 'success', text: 'Real-time synchronization active - records are live!' });
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
  const approvedProfiles = profiles.filter(p => p.status === 'approved');
  const featuredProfiles = profiles.filter(p => p.isFeatured);

  const filteredMembers = profiles.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.profession && p.profession.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesGender && matchesStatus;
  });

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
              src="/logo.jpg" 
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
      <div className="flex border-b border-stone-200 mb-8 overflow-x-auto gap-2 sm:gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview' ? 'border-saffron text-saffron' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          {t('admin.systemStats', 'Overview')}
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap relative ${
            activeTab === 'pending' ? 'border-saffron text-saffron' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          {t('admin.pendingApprovals', 'Pending Approvals')}
          {pendingProfiles.length > 0 && (
            <span className="bg-saffron text-white text-[11px] font-black px-2 py-0.5 rounded-full">
              {pendingProfiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'members' ? 'border-saffron text-saffron' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <User className="w-4 h-4" />
          {t('admin.allProfiles', 'All Member Profiles')} ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'admins' ? 'border-saffron text-saffron' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {t('admin.adminUsers', 'Admin Users')} ({adminUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('sampleAccounts')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sampleAccounts' ? 'border-saffron text-saffron font-bold' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Database className="w-4 h-4" />
          100 Test Accounts Credentials
        </button>

        <button
          onClick={() => setActiveTab('deletionRequests')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap relative ${
            activeTab === 'deletionRequests' ? 'border-saffron text-saffron font-bold' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          Deletion Requests
          {deletionProfiles.length > 0 && (
            <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {deletionProfiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`flex items-center gap-2 pb-4 px-2 sm:px-4 border-b-2 transition-all whitespace-nowrap relative ${
            activeTab === 'archived' ? 'border-saffron text-saffron font-bold' : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          Archived Profiles (30-Days)
          {profiles.filter(p => p.status === 'archived' || (p as any).isArchived).length > 0 && (
            <span className="bg-amber-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
              {profiles.filter(p => p.status === 'archived' || (p as any).isArchived).length}
            </span>
          )}
        </button>
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
          {filteredMembers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-stone-200 shadow-sm">
              <User className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Member Profiles Found</h3>
              <p className="text-stone-500">Try adjusting your search query or filter options.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Profile</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {filteredMembers.map((p) => (
                      <tr key={p.uid} className="hover:bg-stone-50/80 transition-colors">
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
                    ))}
                  </tbody>
                </table>
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
                      <p className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 mt-2 inline-block">
                        Reason: {p.deletionReason || 'No specific reason provided'}
                      </p>
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
