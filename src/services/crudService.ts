import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

type Entity = { id: string; createdAt?: unknown; updatedAt?: unknown };

function removerUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removerUndefined(item)).filter((item) => item !== undefined) as T;
  }

  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removerUndefined(item)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

export function createCrudService<T extends Entity>(collectionName: string) {
  return {
    async listar() {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as T[];
    },
    async criar(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = serverTimestamp();
      const payload = removerUndefined({ ...data, createdAt: now, updatedAt: now });
      const ref = await addDoc(collection(db, collectionName), payload);
      return { id: ref.id, ...data, createdAt: now, updatedAt: now } as T;
    },
    async atualizar(id: string, data: Partial<T>) {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, removerUndefined({ ...data, updatedAt: serverTimestamp() }));
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) throw new Error('Registro não encontrado');
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
    async remover(id: string) {
      await deleteDoc(doc(db, collectionName, id));
    },
  };
}
