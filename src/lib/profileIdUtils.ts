import { db, doc, getDocs, collection, runTransaction, updateDoc, setDoc, getDoc } from './firebase';

export function isUserAdminAccount(profileOrUser: any): boolean {
  if (!profileOrUser) return false;
  if (typeof profileOrUser === 'string') {
    return profileOrUser.toLowerCase() === 'admin' || profileOrUser === 'pawarakash0127@gmail.com' || profileOrUser === 'admin@admin.com';
  }
  if (typeof profileOrUser === 'object') {
    if (profileOrUser.role === 'admin' || profileOrUser.isAdmin === true || profileOrUser.isAdminProfile === true) {
      return true;
    }
    const email = (profileOrUser.email || '').toLowerCase();
    if (email === 'pawarakash0127@gmail.com' || email === 'admin@admin.com') {
      return true;
    }
  }
  return false;
}

export function getProfileIdPrefix(gender?: string): 'VADHU' | 'VAR' {
  const norm = (gender || '').trim().toLowerCase();
  if (norm === 'female' || norm === 'bride' || norm === 'vadhu' || norm === 'vadu' || norm === 'f' || norm === 'woman' || norm === 'girl') {
    return 'VADHU';
  }
  return 'VAR';
}

/**
 * Formats a numeric sequence into a zero-padded string e.g., 1 -> "001", 12 -> "012", 999 -> "999", 1000 -> "1000"
 */
export function formatRawSequence(seqNumber: number): string {
  if (!seqNumber || seqNumber <= 0) return '001';
  return seqNumber <= 999 ? String(seqNumber).padStart(3, '0') : String(seqNumber);
}

/**
 * Extracts numeric sequence from any profile ID input e.g., 'VADHU-005', 'VAR-002', '005', '5'.
 */
export function extractSequenceNumber(profileId?: string | number): number {
  if (profileId === undefined || profileId === null || profileId === '') return 0;
  if (typeof profileId === 'number') return profileId;
  const match = String(profileId).match(/\d+/);
  if (match) {
    return parseInt(match[0], 10) || 0;
  }
  return 0;
}

/**
 * Formats a profile ID for UI display e.g., "VADU-001" or "VAR-002".
 * Accepts either a profile object or ID string + optional gender.
 * For Administrator accounts, returns "ADMIN".
 */
export function getDisplayProfileId(profileOrId: any, gender?: string): string {
  if (!profileOrId) return '';

  // Check if target is an Admin account
  if (isUserAdminAccount(profileOrId)) {
    return 'ADMIN';
  }

  let rawStr = '';
  let gen = gender;

  if (typeof profileOrId === 'object' && profileOrId !== null) {
    if (profileOrId.vaduVarNumber) {
      rawStr = profileOrId.vaduVarNumber;
    } else if (profileOrId.profileId) {
      rawStr = profileOrId.profileId;
    }
    gen = profileOrId.gender || gender;
  } else {
    rawStr = String(profileOrId);
  }

  if (!rawStr || rawStr.trim() === '' || rawStr === 'undefined' || rawStr === 'null') {
    return '';
  }

  // If already formatted like VADHU-001, VADU-001 or VAR-002
  if (/^(VADHU|VADU|VAR)-\d+$/i.test(rawStr.trim())) {
    const parts = rawStr.trim().split('-');
    let prefix = parts[0].toUpperCase();
    if (prefix === 'VADU') prefix = 'VADHU';
    const num = parseInt(parts[1], 10);
    return `${prefix}-${formatRawSequence(num)}`;
  }

  const seqNum = extractSequenceNumber(rawStr);
  if (seqNum <= 0) return rawStr;
  const formattedNum = formatRawSequence(seqNum);
  const prefix = getProfileIdPrefix(gen);

  return `${prefix}-${formattedNum}`;
}

/**
 * Atomically generates the next global sequence Profile ID using a Firestore transaction.
 * Prepend category prefix: VADHU- or VAR- based on gender.
 * Admin users are exempt and return an empty string without consuming a sequence counter.
 */
export async function assignGlobalProfileIdInTransaction(gender?: string, isUserAdmin?: boolean): Promise<string> {
  if (isUserAdmin) {
    return '';
  }

  const counterRef = doc(db, 'counters', 'profile_counter');
  const userIdCounterRef = doc(db, 'counters', 'userId');

  const prefix = getProfileIdPrefix(gender);
  let assignedDisplayId = `${prefix}-001`;

  await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let currentSeq = 0;
    if (counterSnap.exists()) {
      currentSeq = counterSnap.data().lastNumber || counterSnap.data().currentSeq || 0;
    } else {
      const altSnap = await transaction.get(userIdCounterRef);
      if (altSnap.exists()) {
        currentSeq = altSnap.data().lastNumber || altSnap.data().currentSeq || 0;
      }
    }
    const nextSeq = currentSeq + 1;
    const seqStr = formatRawSequence(nextSeq);
    assignedDisplayId = `${prefix}-${seqStr}`;

    const payload = {
      lastNumber: nextSeq,
      currentSeq: nextSeq,
      updatedAt: new Date().toISOString()
    };

    transaction.set(counterRef, payload, { merge: true });
    transaction.set(userIdCounterRef, payload, { merge: true });
  });

  return assignedDisplayId;
}

/**
 * SAFE, IDEMPOTENT ID ASSIGNMENT:
 * 1. Inspects all existing profile documents.
 * 2. EXCLUDES all admin accounts (admins NEVER receive a VAR/VADHU ID).
 * 3. PRESERVES all existing valid profile IDs (NEVER reorders, renumbers, or overwrites existing users).
 * 4. Only assigns new sequential IDs to legitimate non-admin profiles that genuinely have NO ID.
 * 5. Safely syncs the global counter to Math.max(existingCounter, maxAssignedSeq).
 */
export async function runCompleteProfileIdMigration(): Promise<{
  totalCount: number;
  updatedCount: number;
  lastAssignedId: string;
}> {
  const querySnapshot = await getDocs(collection(db, 'profiles'));
  const allProfiles: any[] = [];
  querySnapshot.forEach((d) => {
    allProfiles.push({ ...d.data(), uid: d.id });
  });

  let maxAssignedSeq = 0;
  const unassignedProfiles: any[] = [];

  for (const p of allProfiles) {
    if (isUserAdminAccount(p)) {
      continue; // Skip admins completely
    }

    const currentId = p.profileId || p.vaduVarNumber || '';
    if (currentId && /^(VADHU|VADU|VAR)-\d+$/i.test(String(currentId).trim())) {
      const seq = extractSequenceNumber(currentId);
      if (seq > maxAssignedSeq) {
        maxAssignedSeq = seq;
      }
    } else {
      unassignedProfiles.push(p);
    }
  }

  // Get current sequence counter to ensure we never back-track
  let currentCounterSeq = 0;
  try {
    const counterSnap = await getDoc(doc(db, 'counters', 'profile_counter'));
    if (counterSnap.exists()) {
      currentCounterSeq = counterSnap.data().lastNumber || counterSnap.data().currentSeq || 0;
    }
  } catch (err) {
    console.warn("Could not read profile_counter:", err);
  }

  let runningSeq = Math.max(maxAssignedSeq, currentCounterSeq);
  let updatedCount = 0;
  let lastAssignedId = maxAssignedSeq > 0 ? `VAR-${formatRawSequence(maxAssignedSeq)}` : 'VAR-000';

  // Sort unassigned profiles by createdAt ascending so older unassigned profiles get earlier free IDs
  unassignedProfiles.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  for (const p of unassignedProfiles) {
    runningSeq += 1;
    const seqStr = formatRawSequence(runningSeq);
    const prefix = getProfileIdPrefix(p.gender);
    const newId = `${prefix}-${seqStr}`;

    lastAssignedId = newId;

    const profileRef = doc(db, 'profiles', p.uid);
    const userRef = doc(db, 'users', p.uid);

    await updateDoc(profileRef, {
      profileId: newId,
      vaduVarNumber: newId,
      numericSeq: runningSeq,
      updatedAt: new Date().toISOString()
    }).catch((err) => console.error(`Error updating profile ${p.uid}:`, err));

    await updateDoc(userRef, {
      profileId: newId,
      vaduVarNumber: newId
    }).catch(() => {});

    p.profileId = newId;
    p.vaduVarNumber = newId;
    p.numericSeq = runningSeq;
    updatedCount++;
  }

  // Update global counter in Firestore if new IDs were assigned or counter needs advancement
  const finalSeq = runningSeq;
  const counterPayload = {
    currentSeq: finalSeq,
    lastNumber: finalSeq,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'counters', 'profile_counter'), counterPayload, { merge: true });
  await setDoc(doc(db, 'counters', 'userId'), counterPayload, { merge: true });

  return {
    totalCount: allProfiles.length,
    updatedCount,
    lastAssignedId
  };
}

/**
 * Synchronous helper for legacy or temporary objects.
 */
export function getOrAssignProfileId(profile: any, allProfiles: any[] = []): string {
  if (!profile) return '';
  return getDisplayProfileId(profile);
}

/**
 * Checks if a search term matches a profile's profileId or vaduVarNumber.
 */
export function matchesProfileId(profileOrId: any, searchQuery: string, gender?: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  if (!profileOrId) return false;

  const rawQuery = searchQuery.trim().toLowerCase();
  const cleanQuery = rawQuery.replace(/[^a-z0-9]/g, '');

  const displayId = getDisplayProfileId(profileOrId, gender).toLowerCase();
  const cleanDisplay = displayId.replace(/[^a-z0-9]/g, '');

  let rawId = '';
  if (typeof profileOrId === 'object' && profileOrId !== null) {
    rawId = String(profileOrId.vaduVarNumber || profileOrId.profileId || '');
  } else {
    rawId = String(profileOrId);
  }

  if (
    cleanDisplay.includes(cleanQuery) || 
    displayId.includes(rawQuery) || 
    rawId.toLowerCase().includes(rawQuery)
  ) {
    return true;
  }

  // Numeric search e.g. "1", "001", "15"
  if (/^\d+$/.test(rawQuery)) {
    const queryNum = parseInt(rawQuery, 10);
    const idNum = extractSequenceNumber(displayId) || extractSequenceNumber(rawId);
    return idNum === queryNum;
  }

  return false;
}
