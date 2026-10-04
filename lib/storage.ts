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
import { db } from './firebase';

// ─── Cloudinary config ────────────────────────────────────────────────────────
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

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

// ─── Client-side image compression (canvas, no library needed) ────────────────
async function compressImage(file: File, maxPx = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Cloudinary upload (unsigned, free tier) ───────────────────────────────────
export async function uploadFile(
  file: File,
  _uid: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Compress images before uploading to save Cloudinary quota
  const toUpload = file.type.startsWith('image/') ? await compressImage(file) : file;

  const formData = new FormData();
  formData.append('file', toUpload);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'hostel-chronicles');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.((e.loaded / e.total) * 100);
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url as string);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
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

export async function deleteMemory(memId: string, _fileUrl?: string): Promise<void> {
  // Delete the Firestore document
  await deleteDoc(doc(db, 'memories', memId));

  // Note: Cloudinary file deletion requires a signed API call from a backend.
  // For a free-tier client-only app the asset stays in Cloudinary (25 GB free).
  // If you later add a Next.js API route or server action, call:
  //   POST https://api.cloudinary.com/v1_1/<cloud>/destroy  (signed)

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

