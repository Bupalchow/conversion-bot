import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const signInWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      throw new Error('Firebase authentication is not properly configured. Please check your environment variables.');
    }
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase authentication is not properly configured.');
    }
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};
