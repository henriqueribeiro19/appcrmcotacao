import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { User } from '@/types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const userService = {
  async listar(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as unknown as User[];
  },

  async criar(data: { nome: string; email: string; senha: string; telefone?: string }) {
    const appName = `user-registration-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, appName);
    try {
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.senha);
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || '',
        perfil: 'admin',
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return result.user;
    } finally {
      await deleteApp(secondaryApp);
    }
  },

  async atualizar(uid: string, data: { nome: string; telefone?: string; ativo: boolean }) {
    await updateDoc(doc(db, 'users', uid), {
      nome: data.nome,
      telefone: data.telefone || '',
      ativo: data.ativo,
      perfil: 'admin',
      updatedAt: serverTimestamp(),
    });
  },
};