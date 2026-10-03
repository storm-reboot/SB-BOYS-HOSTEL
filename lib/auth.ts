import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  room?: string;
  batch?: string;
  bio?: string;
  joinedAt?: unknown;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  room?: string,
  batch?: string
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });

  const profile: UserProfile = {
    uid: user.uid,
    displayName,
    email,
    room: room || '',
    batch: batch || '',
    joinedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'room' | 'batch' | 'bio'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates);
}
