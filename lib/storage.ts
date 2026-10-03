import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  where,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';

export interface Memory {
  id: string;
  uid: string;
  displayName: string;
  userPhotoURL?: string;
  type: 'photo' | 'video' | 'story';
  url?: string;
  thumbnail?: string;
  caption: string;
  room?: string;
  batch?: string;
  likes: string[];
  commentsCount: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export interface Comment {
  id: string;
  memId: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export async function uploadFile(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `memories/${uid}/${Date.now()}.${ext}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function createMemory(data: {
  uid: string;
  displayName: string;
  userPhotoURL?: string;
  type: 'photo' | 'video' | 'story';
  url?: string;
  caption: string;
  room?: string;
  batch?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, 'memories'), {
    ...data,
    likes: [],
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getFeedMemories(
  pageSize: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<{ memories: Memory[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, 'memories'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(db, 'memories'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const memories = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Memory[];

  const last = snapshot.docs[snapshot.docs.length - 1] || null;
  return { memories, lastDoc: last };
}

export async function getUserMemories(uid: string): Promise<Memory[]> {
  const q = query(
    collection(db, 'memories'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Memory[];
}

export async function toggleLike(memId: string, uid: string, liked: boolean): Promise<void> {
  const memRef = doc(db, 'memories', memId);
  await updateDoc(memRef, {
    likes: liked ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function addComment(memId: string, uid: string, displayName: string, text: string): Promise<void> {
  await addDoc(collection(db, 'comments'), {
    memId,
    uid,
    displayName,
    text,
    createdAt: serverTimestamp(),
  });
  const memRef = doc(db, 'memories', memId);
  const memDoc = await getDoc(memRef);
  if (memDoc.exists()) {
    await updateDoc(memRef, { commentsCount: (memDoc.data().commentsCount || 0) + 1 });
  }
}

export async function getComments(memId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'comments'),
    where('memId', '==', memId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Comment[];
}

export async function deleteMemory(memId: string, fileUrl?: string): Promise<void> {
  // Delete the Firestore document
  await deleteDoc(doc(db, 'memories', memId));

  // Delete the storage file if one exists
  if (fileUrl) {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch {
      // File may already be deleted or URL may not be a storage URL — ignore
    }
  }

  // Delete all associated comments
  const commentsQ = query(collection(db, 'comments'), where('memId', '==', memId));
  const commentsSnap = await getDocs(commentsQ);
  await Promise.all(commentsSnap.docs.map((d) => deleteDoc(d.ref)));
}

export async function searchMemories(opts: {
  room?: string;
  batch?: string;
  type?: 'photo' | 'video' | 'story';
  keyword?: string;
}): Promise<Memory[]> {
  // Fetch a large slice and filter client-side (Firestore has limited compound querying)
  const q = query(
    collection(db, 'memories'),
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Memory[];

  if (opts.room) {
    results = results.filter((m) => m.room?.toLowerCase() === opts.room!.toLowerCase());
  }
  if (opts.batch) {
    results = results.filter((m) => m.batch?.toLowerCase().includes(opts.batch!.toLowerCase()));
  }
  if (opts.type) {
    results = results.filter((m) => m.type === opts.type);
  }
  if (opts.keyword) {
    const kw = opts.keyword.toLowerCase();
    results = results.filter(
      (m) =>
        m.caption?.toLowerCase().includes(kw) ||
        m.displayName?.toLowerCase().includes(kw)
    );
  }
  return results;
}

