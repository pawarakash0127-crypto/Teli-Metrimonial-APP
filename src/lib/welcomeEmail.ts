import { db, doc, getDoc, updateDoc } from './firebase';
import { formatMembershipDates } from './welcomeEmailTemplate';

export interface TriggerWelcomeEmailParams {
  uid: string;
  email?: string;
  userName?: string;
  registrationDateISO?: string;
}

export async function triggerWelcomeEmail(params: TriggerWelcomeEmailParams): Promise<{
  success: boolean;
  message: string;
  alreadySent?: boolean;
  skipped?: boolean;
}> {
  const { uid, email, userName, registrationDateISO } = params;

  if (!uid) {
    return { success: false, message: 'Invalid UID provided' };
  }

  // 1. Check if user profile exists in Firestore
  let existingData: any = {};
  try {
    const profileRef = doc(db, 'profiles', uid);
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      existingData = docSnap.data();
    }
  } catch (err: any) {
    console.warn("Error fetching profile prior to welcome email:", err.message);
  }

  const targetEmail = (email || existingData.email || '').trim();
  const targetName = userName || (existingData.firstName ? `${existingData.firstName} ${existingData.lastName || ''}`.trim() : 'Member');

  // Phone-only registration check:
  if (!targetEmail || !targetEmail.includes('@')) {
    console.log(`[WELCOME EMAIL SKIPPED] Phone-only registration for UID ${uid}. No valid email address provided.`);
    try {
      const profileRef = doc(db, 'profiles', uid);
      await updateDoc(profileRef, {
        welcomeEmailStatus: 'skipped',
        welcomeEmailNote: 'Phone-only registration (no email address provided)',
        welcomeEmailUpdatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not mark skipped status in Firestore:", e);
    }
    return { success: true, message: 'Phone-only registration, email sending skipped gracefully', skipped: true };
  }

  // Idempotency check client-side
  if (existingData.welcomeEmailSent === true || existingData.welcomeEmailStatus === 'sent') {
    console.log(`[WELCOME EMAIL ALREADY SENT] Welcome email previously sent to ${targetEmail} (UID: ${uid}).`);
    return { success: true, message: 'Welcome email already sent previously', alreadySent: true };
  }

  // Calculate membership dates
  const dates = formatMembershipDates(registrationDateISO || existingData.createdAt || new Date());

  // Update status to 'pending'
  try {
    const profileRef = doc(db, 'profiles', uid);
    await updateDoc(profileRef, {
      welcomeEmailStatus: 'pending',
      welcomeEmailAttemptedAt: new Date().toISOString(),
      membershipStatus: 'Active',
      membershipStartDate: dates.registrationDateISO,
      membershipExpiryDate: dates.expiryDateISO
    });
  } catch (err: any) {
    console.warn("Could not set pending status in Firestore:", err.message);
  }

  // Call Server-Side API endpoint
  try {
    const response = await fetch('/api/welcome-email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        userEmail: targetEmail,
        userName: targetName,
        registrationDateISO: dates.registrationDateISO,
        expiryDateISO: dates.expiryDateISO,
        registrationDateFormatted: dates.registrationDateFormatted,
        expiryDateFormatted: dates.expiryDateFormatted
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`[WELCOME EMAIL SUCCESS] Sent successfully to ${targetEmail}.`);
      return { success: true, message: data.message || 'Welcome email sent successfully' };
    } else {
      console.warn(`[WELCOME EMAIL LOGGED/FAILED] ${data.error || 'Failed to dispatch email'}`);
      return { success: false, message: data.error || 'Failed to send welcome email' };
    }
  } catch (err: any) {
    console.error("Network or API error when triggering welcome email:", err.message);
    return { success: false, message: err.message || 'Network error triggering email' };
  }
}
