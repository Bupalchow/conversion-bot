'use client'

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { signInWithGoogle, signOut } from '../lib/utils';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <button onClick={signInWithGoogle} className="bg-blue-500 text-white px-4 py-2 rounded-md">
        Login with Google
      </button>
    </div>
  );
}
