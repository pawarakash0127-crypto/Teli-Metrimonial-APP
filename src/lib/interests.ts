import { db, doc, setDoc, updateDoc, deleteDoc, getDoc } from './firebase';

export interface InterestNotification {
  id: string;
  fromUid: string;
  fromName: string;
  fromPhotoUrl?: string;
  fromAge?: number;
  fromProfession?: string;
  fromLocation?: string;
  toUid: string;
  toName: string;
  toPhotoUrl?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  read: boolean;
  requesterNotified?: boolean;
}

export async function sendInterest(
  fromUid: string,
  myProfile: any,
  targetProfile: any
): Promise<void> {
  const docId = `${fromUid}_${targetProfile.uid}`;
  const interestRef = doc(db, 'interests', docId);

  const fromName = `${myProfile?.firstName || 'A Member'} ${myProfile?.lastName || ''}`.trim();
  const toName = `${targetProfile?.firstName || 'Member'} ${targetProfile?.lastName || ''}`.trim();

  const data: InterestNotification = {
    id: docId,
    fromUid,
    fromName: fromName || 'A Member',
    fromPhotoUrl: myProfile?.photoUrl || '',
    fromAge: myProfile?.age || 0,
    fromProfession: myProfile?.profession || '',
    fromLocation: myProfile?.location || '',
    toUid: targetProfile.uid,
    toName: toName || 'Member',
    toPhotoUrl: targetProfile?.photoUrl || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    read: false,
    requesterNotified: false
  };

  await setDoc(interestRef, data);
}

export async function withdrawInterest(fromUid: string, targetUid: string): Promise<void> {
  const docId = `${fromUid}_${targetUid}`;
  const interestRef = doc(db, 'interests', docId);
  await deleteDoc(interestRef);
}

export async function respondToInterest(interestId: string, status: 'accepted' | 'declined'): Promise<void> {
  const interestRef = doc(db, 'interests', interestId);
  await updateDoc(interestRef, {
    status,
    read: true,
    requesterNotified: false,
    ...(status === 'accepted' ? { acceptedAt: new Date().toISOString() } : {}),
    updatedAt: new Date().toISOString()
  });
}

export async function markInterestAsRead(interestId: string): Promise<void> {
  const interestRef = doc(db, 'interests', interestId);
  await updateDoc(interestRef, {
    read: true
  });
}

export async function markRequesterNotified(interestId: string): Promise<void> {
  const interestRef = doc(db, 'interests', interestId);
  await updateDoc(interestRef, {
    requesterNotified: true
  });
}
