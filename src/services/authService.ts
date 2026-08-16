import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import type { User } from '@/types';

export const authService = {
  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  async logout() {
    await signOut(auth);
  },

  async register(email: string, password: string, data: { nome: string; perfil: User['perfil'] }) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      nome: data.nome,
      email,
      perfil: data.perfil,
      ativo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result.user;
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as User) : null;
  },
};
