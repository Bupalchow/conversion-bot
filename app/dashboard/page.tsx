'use client'

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { getBots, createBot } from '../../lib/db';
import { useRouter } from 'next/navigation';

type Bot = {
  id: string;
  botName: string;
  website: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [botName, setBotName] = useState('');
  const [website, setWebsite] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchBots(user.uid);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchBots = async (userId: string) => {
    const userBots = await getBots(userId);
    // Ensure each bot has id, botName, and website properties
    setBots(
      (userBots || []).map((bot: Partial<Bot>) => ({
        id: bot.id ?? '',
        botName: bot.botName || '',
        website: bot.website || '',
      }))
    );
  };

  const handleCreateBot = async () => {
    if (user) {
      await createBot(user.uid, botName, website);
      setBotName('');
      setWebsite('');
      fetchBots(user.uid);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Bot Name"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="border p-2 mr-2"
        />
        <button onClick={handleCreateBot} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Create Bot
        </button>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Your Bots</h2>
        <ul>
          {bots.map((bot) => (
            <li key={bot.id} className="border p-2 mb-2 flex justify-between items-center">
              <div>
                <p className="font-bold">{bot.botName}</p>
                <p>{bot.website}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
