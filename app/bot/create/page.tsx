'use client'

import { useState } from 'react';

export default function CreateBot() {
  const [botName, setBotName] = useState('');
  const [website, setWebsite] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [botColor, setBotColor] = useState('#000000');

  const handleCreateBot = () => {
    // TODO: Implement bot creation logic
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Bot</h1>
      <div className="mb-4">
        <label className="block mb-2">Bot Name</label>
        <input
          type="text"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Website</label>
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Bot Description</label>
        <textarea
          value={botDescription}
          onChange={(e) => setBotDescription(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Bot Color</label>
        <input
          type="color"
          value={botColor}
          onChange={(e) => setBotColor(e.target.value)}
          className="border p-2"
        />
      </div>
      <button onClick={handleCreateBot} className="bg-blue-500 text-white px-4 py-2 rounded-md">
        Create Bot
      </button>
    </div>
  );
}
