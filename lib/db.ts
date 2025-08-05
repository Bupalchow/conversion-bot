
import { db } from "../firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export const createBot = async (userId: string, botName: string, website: string) => {
  try {
    const docRef = await addDoc(collection(db, "bots"), {
      userId,
      botName,
      website,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating bot: ", error);
  }
};

export const getBots = async (userId: string) => {
  try {
    const q = query(collection(db, "bots"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const bots = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return bots;
  } catch (error) {
    console.error("Error getting bots: ", error);
  }
};

export const updateBot = async (botId: string, botName: string, website: string) => {
  try {
    const botRef = doc(db, "bots", botId);
    await updateDoc(botRef, {
      botName,
      website,
    });
  } catch (error) {
    console.error("Error updating bot: ", error);
  }
};

export const deleteBot = async (botId: string) => {
  try {
    await deleteDoc(doc(db, "bots", botId));
  } catch (error) {
    console.error("Error deleting bot: ", error);
  }
};
