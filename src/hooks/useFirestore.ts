import { useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase';

export function useFirestore<T extends { id: string }>(collectionName: string) {
  const getAll = useCallback(async (constraints: QueryConstraint[] = []) => {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
  }, [collectionName]);

  const getById = useCallback(async (id: string) => {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
  }, [collectionName]);

  const create = useCallback(async (data: Omit<T, 'id'>) => {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return docRef.id;
  }, [collectionName]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, { ...data, atualizadoEm: serverTimestamp() });
  }, [collectionName]);

  const remove = useCallback(async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  }, [collectionName]);

  return { getAll, getById, create, update, remove };
}
