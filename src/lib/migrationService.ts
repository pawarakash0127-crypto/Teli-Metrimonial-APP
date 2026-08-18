import { db, collection, getDocs, doc, writeBatch, setDoc } from './firebase';
import { SubscriptionStatusType, PaymentStatusType } from '../types';

export interface MigrationReport {
  timestamp: string;
  totalUsersInspected: number;
  totalProfilesInspected: number;
  usersBackfilled: number;
  profilesBackfilled: number;
  alreadyValidCount: number;
  activeSubscribersCount: number;
  expiredSubscribersCount: number;
  adminsSkipped: number;
  errors: string[];
}

/**
 * Migration Service: Safely backfills missing subscription fields across all
 * existing users and profiles documents in Firestore with safe defaults.
 * Idempotent, non-destructive, and logs progress.
 */
export async function runSubscriptionBackfillMigration(): Promise<MigrationReport> {
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    totalUsersInspected: 0,
    totalProfilesInspected: 0,
    usersBackfilled: 0,
    profilesBackfilled: 0,
    alreadyValidCount: 0,
    activeSubscribersCount: 0,
    expiredSubscribersCount: 0,
    adminsSkipped: 0,
    errors: []
  };

  try {
    const defaultSubscriptionPayload = {
      subscriptionPlan: null,
      subscriptionStatus: 'inactive' as SubscriptionStatusType,
      paymentStatus: 'not_paid' as PaymentStatusType,
      amount: 799,
      currency: 'INR',
      startDate: null,
      endDate: null,
      paymentDate: null,
      paymentProvider: null,
      paymentOrderId: null,
      paymentTransactionId: null,
      renewalDate: null,
      cancellationDate: null,
      autoRenew: false,
      isTestSubscriber: false,
      updatedAt: new Date().toISOString()
    };

    // 1. Process profiles collection
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    report.totalProfilesInspected = profilesSnap.size;

    const profileBatch = writeBatch(db);
    let profileOps = 0;

    profilesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;

      if (data.role === 'admin' || data.isAdmin === true) {
        report.adminsSkipped++;
        return;
      }

      // Check if subscriptionStatus already exists and is valid
      const hasStatus = data.subscriptionStatus !== undefined && data.subscriptionStatus !== null;
      if (hasStatus) {
        report.alreadyValidCount++;
        if (data.subscriptionStatus === 'active') {
          const endDate = data.endDate ? new Date(data.endDate).getTime() : 0;
          if (endDate > Date.now()) {
            report.activeSubscribersCount++;
          } else {
            report.expiredSubscribersCount++;
          }
        }
      } else {
        // Backfill missing fields
        const varVadhuId = data.profileId || data.vaduVarNumber || data.varVadhuId || `MEMBER-${docId.slice(0, 6)}`;
        profileBatch.set(doc(db, 'profiles', docId), {
          ...defaultSubscriptionPayload,
          varVadhuId
        }, { merge: true });
        profileOps++;
        report.profilesBackfilled++;
      }
    });

    if (profileOps > 0) {
      await profileBatch.commit();
    }

    // 2. Process users collection
    const usersSnap = await getDocs(collection(db, 'users'));
    report.totalUsersInspected = usersSnap.size;

    const userBatch = writeBatch(db);
    let userOps = 0;

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;

      if (data.role === 'admin' || data.isAdmin === true) {
        return;
      }

      const hasStatus = data.subscriptionStatus !== undefined && data.subscriptionStatus !== null;
      if (!hasStatus) {
        const varVadhuId = data.profileId || data.vaduVarNumber || data.varVadhuId || `MEMBER-${docId.slice(0, 6)}`;
        userBatch.set(doc(db, 'users', docId), {
          ...defaultSubscriptionPayload,
          varVadhuId
        }, { merge: true });
        userOps++;
        report.usersBackfilled++;
      }
    });

    if (userOps > 0) {
      await userBatch.commit();
    }

  } catch (err: any) {
    console.error("Error during subscription backfill migration:", err);
    report.errors.push(err.message || String(err));
  }

  return report;
}
