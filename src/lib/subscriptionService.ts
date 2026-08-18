import { db, doc, setDoc, updateDoc, getDoc, collection, getDocs, query, where } from './firebase';
import { ProfileData, SubscriptionData } from '../types';
import { PaymentVerificationResult } from './payment/PaymentProvider';

export type { SubscriptionData };

export const ANNUAL_SUBSCRIPTION_PRICE = 799;
export const SUBSCRIPTION_CURRENCY = 'INR';
export const SUBSCRIPTION_DURATION_DAYS = 365; // 12 Months

/**
 * Helper to parse various Firestore date formats (ISO string, Timestamp, milliseconds)
 */
function parseDateToTimestamp(dateVal: any): number | null {
  if (!dateVal) return null;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal === 'string') {
    const t = new Date(dateVal).getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      try {
        return dateVal.toDate().getTime();
      } catch (_) {}
    }
    if (typeof dateVal.seconds === 'number') {
      return dateVal.seconds * 1000;
    }
  }
  return null;
}

/**
 * Checks whether a user has a valid active subscription.
 * Supports multiple Firestore field patterns (subscriptionStatus, membershipStatus, paymentStatus, isSubscribed)
 * and safely parses Firestore Timestamps, numbers, and ISO strings for endDate.
 */
export function isSubscriptionActive(profile: ProfileData | SubscriptionData | any): boolean {
  if (!profile) return false;

  // Check direct boolean flags
  if (profile.isSubscribed === true || profile.hasMembership === true || profile.hasActiveSubscription === true) {
    const endDateRaw = profile.endDate || profile.subscriptionEndDate || profile.expiryDate;
    if (endDateRaw) {
      const endMs = parseDateToTimestamp(endDateRaw);
      if (endMs !== null && Date.now() > endMs) return false; // Expired
    }
    return true;
  }

  const subStatus = String(profile.subscriptionStatus || profile.membershipStatus || '').toLowerCase().trim();
  const paymentStatus = String(profile.paymentStatus || '').toLowerCase().trim();

  // If status is explicitly inactive, expired, cancelled, refunded, failed, revoked
  if (['inactive', 'expired', 'cancelled', 'canceled', 'refunded', 'failed', 'revoked'].includes(subStatus)) {
    return false;
  }

  // Active if subscriptionStatus is active, paymentStatus is paid, or plan is defined
  const isMarkedActive = 
    subStatus === 'active' || 
    paymentStatus === 'paid' || 
    profile.subscriptionPlan === 'annual' ||
    profile.subscriptionPlan === 'premium' ||
    profile.subscriptionPlan === 'gold' ||
    profile.subscriptionPlan === 'silver';

  if (!isMarkedActive) {
    return false;
  }

  // Check expiration if endDate is present
  const endDateRaw = profile.endDate || profile.subscriptionEndDate || profile.expiryDate;
  if (endDateRaw) {
    const endMs = parseDateToTimestamp(endDateRaw);
    if (endMs !== null && Date.now() > endMs) {
      return false; // Expired
    }
  }

  return true;
}

/**
 * Returns detailed subscription status metadata for UI rendering.
 */
export function getSubscriptionDetails(profile: ProfileData | null | undefined) {
  const active = isSubscriptionActive(profile);
  const status = profile?.subscriptionStatus || 'inactive';
  const paymentStatus = profile?.paymentStatus || 'not_paid';
  const endDateStr = profile?.endDate;
  const startDateStr = profile?.startDate;

  let daysRemaining = 0;
  if (active && endDateStr) {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  let badgeColor = 'bg-stone-100 text-stone-600 border-stone-200';
  let label = 'Inactive / Free Member';

  if (active) {
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    label = 'Active Member (₹799/Yr)';
  } else if (status === 'expired') {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
    label = 'Membership Expired';
  } else if (status === 'pending') {
    badgeColor = 'bg-blue-50 text-blue-800 border-blue-300';
    label = 'Payment Pending';
  } else if (status === 'failed') {
    badgeColor = 'bg-red-50 text-red-800 border-red-300';
    label = 'Payment Failed';
  }

  return {
    isActive: active,
    status,
    paymentStatus,
    plan: profile?.subscriptionPlan || 'None',
    startDate: startDateStr ? new Date(startDateStr).toLocaleDateString('en-IN') : 'N/A',
    endDate: endDateStr ? new Date(endDateStr).toLocaleDateString('en-IN') : 'N/A',
    daysRemaining,
    badgeColor,
    label
  };
}

/**
 * Central Feature Access Control
 */
export type MatrimonyFeature =
  | 'view_contact_details'
  | 'express_interest'
  | 'guna_milan_matching'
  | 'direct_messaging'
  | 'view_basic_profile'
  | 'search_profiles';

export function checkFeatureAccess(feature: MatrimonyFeature, profile: ProfileData | null | undefined): { allowed: boolean; reason?: string } {
  // Free features accessible to all logged-in members
  if (feature === 'view_basic_profile' || feature === 'search_profiles') {
    return { allowed: true };
  }

  // Subscription-required premium features
  const active = isSubscriptionActive(profile);
  if (active) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'This premium feature is available with an active Annual Matrimony Membership (₹799/year).'
  };
}

/**
 * Activates or updates a user's subscription in Firestore upon verified payment.
 */
export async function activateSubscriptionInFirestore(
  uid: string,
  paymentResult: PaymentVerificationResult,
  subscriptionSource: string = 'web',
  varVadhuIdInput?: string
): Promise<SubscriptionData> {
  const now = new Date();
  const startDate = now.toISOString();

  const endDateObj = new Date(now);
  endDateObj.setFullYear(endDateObj.getFullYear() + 1); // 12 Months
  const endDate = endDateObj.toISOString();

  // Retrieve existing var/vadhu ID
  let varVadhuId = varVadhuIdInput || '';
  if (!varVadhuId) {
    try {
      const pSnap = await getDoc(doc(db, 'profiles', uid));
      if (pSnap.exists()) {
        const d = pSnap.data();
        varVadhuId = d.profileId || d.vaduVarNumber || d.varVadhuId || `MEMBER-${uid.slice(0, 6)}`;
      }
    } catch (e) {
      console.warn("Notice fetching varVadhuId:", e);
    }
  }

  const subData: SubscriptionData = {
    uid,
    varVadhuId: varVadhuId || `MEMBER-${uid.slice(0, 6)}`,
    subscriptionPlan: 'annual',
    subscriptionStatus: 'active',
    paymentStatus: 'paid',
    amount: paymentResult.amount || ANNUAL_SUBSCRIPTION_PRICE,
    currency: paymentResult.currency || SUBSCRIPTION_CURRENCY,
    startDate,
    endDate,
    createdAt: startDate,
    updatedAt: startDate,
    paymentProvider: paymentResult.provider || 'mock_test_provider',
    paymentTransactionId: paymentResult.transactionId,
    orderId: paymentResult.orderId,
    paymentDate: paymentResult.paymentDate || startDate,
    renewalDate: endDate,
    cancellationDate: null,
    autoRenew: false,
    subscriptionSource,
    isTestSubscriber: paymentResult.provider === 'mock_test_provider'
  };

  const updatePayload = {
    varVadhuId: subData.varVadhuId,
    subscriptionPlan: subData.subscriptionPlan,
    subscriptionStatus: subData.subscriptionStatus,
    paymentStatus: subData.paymentStatus,
    amount: subData.amount,
    currency: subData.currency,
    startDate: subData.startDate,
    endDate: subData.endDate,
    paymentProvider: subData.paymentProvider,
    paymentTransactionId: subData.paymentTransactionId,
    orderId: subData.orderId,
    paymentDate: subData.paymentDate,
    renewalDate: subData.renewalDate,
    cancellationDate: null,
    autoRenew: false,
    subscriptionSource: subData.subscriptionSource,
    isTestSubscriber: subData.isTestSubscriber,
    updatedAt: startDate
  };

  await setDoc(doc(db, 'profiles', uid), updatePayload, { merge: true });
  await setDoc(doc(db, 'users', uid), updatePayload, { merge: true });

  // Record transaction log document in subscriptions collection
  try {
    const subLogRef = doc(db, 'subscriptions', `${uid}_${paymentResult.orderId}`);
    await setDoc(subLogRef, subData, { merge: true });
  } catch (e) {
    console.warn("Notice writing subscription transaction document:", e);
  }

  return subData;
}

/**
 * Deactivates or cancels a user's subscription in Firestore (Admin or User initiated).
 */
export async function deactivateSubscriptionInFirestore(
  uid: string,
  reason: string = 'Cancelled by Admin'
): Promise<void> {
  const now = new Date().toISOString();

  const updatePayload = {
    subscriptionStatus: 'inactive',
    paymentStatus: 'unpaid',
    cancellationDate: now,
    cancellationReason: reason,
    updatedAt: now
  };

  await setDoc(doc(db, 'profiles', uid), updatePayload, { merge: true });
  await setDoc(doc(db, 'users', uid), updatePayload, { merge: true });

  try {
    const subLogRef = doc(db, 'subscriptions', `${uid}_revoked_${Date.now()}`);
    await setDoc(subLogRef, {
      uid,
      status: 'revoked',
      cancellationDate: now,
      reason
    }, { merge: true });
  } catch (e) {
    console.warn("Notice recording revocation in subscriptions log:", e);
  }
}

/**
 * Definition of Active User Profile:
 * A profile counts as active ONLY when:
 * 1. status === 'approved' (or missing / default) AND
 * 2. isArchived !== true AND status !== 'archived' AND
 * 3. status !== 'pending' AND status !== 'rejected' AND status !== 'deletion_pending' AND
 * 4. role !== 'admin' AND isAdmin !== true
 */
export function isProfileActiveMember(profileData: any): boolean {
  if (!profileData) return false;

  // Exclude Admins
  if (profileData.role === 'admin' || profileData.isAdmin === true) {
    return false;
  }

  // Exclude Archived, Deleted, Rejected, Pending profiles
  const statusStr = String(profileData.status || '').toLowerCase().trim();
  if (profileData.isArchived === true || statusStr === 'archived') return false;
  if (profileData.deletionRequested === true || statusStr === 'deletion_pending' || statusStr === 'deleted') return false;
  if (statusStr === 'rejected' || statusStr === 'pending') return false;

  // Approved, active, verified, or standard member profile
  return statusStr === 'approved' || statusStr === 'active' || statusStr === 'verified' || !profileData.status;
}

/**
 * Determines if a candidate profile is eligible to be displayed in public features,
 * search results, featured profiles carousel, and My Matches.
 * A profile is visible to other members ONLY IF it has an active subscription.
 */
export function isProfileSearchableAndVisible(profileData: any): boolean {
  if (!profileData) return false;

  // Must be an active non-archived non-admin profile
  if (!isProfileActiveMember(profileData)) {
    return false;
  }

  // MUST have an active subscription to be visible in search, featured profiles, and my matches
  return isSubscriptionActive(profileData);
}

/**
 * Calculates current count of genuine Active User Profiles in Firestore.
 */
export async function getActiveUserCount(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'profiles'));
    let activeCount = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (isProfileActiveMember(data)) {
        activeCount++;
      }
    });

    return activeCount;
  } catch (err) {
    console.error("Error calculating active user count:", err);
    return 0;
  }
}

/**
 * Evaluates whether the 1000+ Active Members banner should be displayed.
 * Threshold strictly >= 1000
 */
export const HOMEPAGE_BANNER_THRESHOLD = 1000;

export async function isHomepageBannerEligible(): Promise<{ eligible: boolean; activeCount: number }> {
  const activeCount = await getActiveUserCount();
  return {
    eligible: activeCount >= HOMEPAGE_BANNER_THRESHOLD,
    activeCount
  };
}
