import { db, doc, getDocs, collection, runTransaction, updateDoc, setDoc } from './firebase';

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
 */
export function getDisplayProfileId(profileOrId: any, gender?: string): string {
  if (!profileOrId) return 'VAR-001';

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

  // If already formatted like VADHU-001, VADU-001 or VAR-002
  if (/^(VADHU|VADU|VAR)-\d+$/i.test(rawStr.trim())) {
    const parts = rawStr.trim().split('-');
    let prefix = parts[0].toUpperCase();
    if (prefix === 'VADU') prefix = 'VADHU';
    const num = parseInt(parts[1], 10);
    return `${prefix}-${formatRawSequence(num)}`;
  }

  const seqNum = extractSequenceNumber(rawStr);
  const formattedNum = formatRawSequence(seqNum);
  const prefix = getProfileIdPrefix(gen);

  return `${prefix}-${formattedNum}`;
}

/**
 * Atomically generates the next global sequence Profile ID using a Firestore transaction.
 * Prepend category prefix: VADU- or VAR- based on gender.
 * Returns formatted ID e.g. "VADU-001", "VAR-002", "VADU-003".
 */
export async function assignGlobalProfileIdInTransaction(gender?: string): Promise<string> {
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
 * Runs a complete Firestore migration across ALL user profile documents in Firestore:
 * 1. Fetches all documents from 'profiles' collection.
 * 2. Sorts profiles deterministically by createdAt ascending, then uid.
 * 3. Assigns a single global sequential ID across all users (001, 002, 003...).
 * 4. Ensures no duplicate numeric values exist anywhere.
 * 5. Updates profileId and vaduVarNumber permanently in Firestore for each profile.
 * 6. Sets global counter 'counters/profile_counter' (currentSeq & lastNumber) to the highest assigned number.
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

  // Sort deterministically
  allProfiles.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.uid || '').localeCompare(b.uid || '');
  });

  let updatedCount = 0;
  let lastAssignedId = 'VAR-000';

  for (let i = 0; i < allProfiles.length; i++) {
    const p = allProfiles[i];
    const seq = i + 1;
    const seqStr = formatRawSequence(seq);
    const prefix = getProfileIdPrefix(p.gender);
    const expectedId = `${prefix}-${seqStr}`;

    lastAssignedId = expectedId;

    if (p.profileId !== expectedId || p.vaduVarNumber !== expectedId || p.numericSeq !== seq) {
      const profileRef = doc(db, 'profiles', p.uid);
      const userRef = doc(db, 'users', p.uid);

      await updateDoc(profileRef, {
        profileId: expectedId,
        vaduVarNumber: expectedId,
        numericSeq: seq,
        updatedAt: new Date().toISOString()
      }).catch((err) => console.error(`Error updating profile ${p.uid}:`, err));

      await updateDoc(userRef, {
        profileId: expectedId,
        vaduVarNumber: expectedId
      }).catch(() => {}); // user doc might not exist

      p.profileId = expectedId;
      p.vaduVarNumber = expectedId;
      p.numericSeq = seq;
      updatedCount++;
    }
  }

  const finalSeq = allProfiles.length;
  // Update global counter in Firestore
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
  if (!profile) return 'VAR-001';
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
