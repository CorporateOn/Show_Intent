'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { TrashIcon, PlusIcon } from '@/components/IconComponents';

export default function AdminAboutPage() {
  const {
    aboutDescription, setAboutDescription,
    aboutLocation, setAboutLocation,
    aboutPhone, setAboutPhone,
    aboutEmail, setAboutEmail,
    aboutOwnerName, setAboutOwnerName,
    aboutOwnerTitle, setAboutOwnerTitle,
    aboutOwnerQuote, setAboutOwnerQuote,
    aboutOwnerStory, setAboutOwnerStory,
    aboutOwnerImage, setAboutOwnerImage,
    aboutMotivationQuotes, setAboutMotivationQuotes,
    aboutMapEmbed, setAboutMapEmbed,
    saveAllSettings, authStatus
  } = useAppContext();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [newQuote, setNewQuote] = useState('');

  // Redirect if not admin
  if (!authStatus.isAuthenticated || authStatus.role !== 'admin') {
    return <div className="p-8 text-center">Access denied. Redirecting...</div>;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setAboutOwnerImage(data.url);
      else alert('Upload failed.');
    } catch (err) {
      console.error(err);
      alert('Upload error.');
    } finally {
      setIsUploading(false);
    }
  };

  const addQuote = () => {
    if (newQuote.trim()) {
      setAboutMotivationQuotes([...aboutMotivationQuotes, newQuote.trim()]);
      setNewQuote('');
    }
  };

  const removeQuote = (index: number) => {
    setAboutMotivationQuotes(aboutMotivationQuotes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await saveAllSettings();
    alert('About page saved!');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Edit About Page</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Business Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={aboutLocation}
                  onChange={(e) => setAboutLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={aboutPhone}
                  onChange={(e) => setAboutPhone(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={aboutEmail}
                  onChange={(e) => setAboutEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Motivation Quotes</h2>
            <div className="space-y-3">
              {aboutMotivationQuotes.map((quote, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quote}
                    onChange={(e) => {
                      const updated = [...aboutMotivationQuotes];
                      updated[idx] = e.target.value;
                      setAboutMotivationQuotes(updated);
                    }}
                    className="flex-1 p-2 border rounded"
                  />
                  <button onClick={() => removeQuote(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder="New quote"
                  className="flex-1 p-2 border rounded"
                />
                <button onClick={addQuote} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-indigo-700">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={aboutOwnerName}
                  onChange={(e) => setAboutOwnerName(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={aboutOwnerTitle}
                  onChange={(e) => setAboutOwnerTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quote</label>
                <textarea
                  value={aboutOwnerQuote}
                  onChange={(e) => setAboutOwnerQuote(e.target.value)}
                  rows={2}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Story</label>
                <textarea
                  value={aboutOwnerStory}
                  onChange={(e) => setAboutOwnerStory(e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-brand-primary hover:file:bg-violet-100"
                />
                {isUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                {aboutOwnerImage && (
                  <div className="mt-4">
                    <img src={aboutOwnerImage} alt="Owner" className="max-h-40 rounded border" />
                    <button
                      onClick={() => setAboutOwnerImage('')}
                      className="mt-2 text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Map Embed</h2>
            <p className="text-sm text-gray-500 mb-2">
              Paste the embed src from Google Maps or other service.
            </p>
            <input
              type="text"
              value={aboutMapEmbed}
              onChange={(e) => setAboutMapEmbed(e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
              className="w-full p-2 border rounded"
            />
            {aboutMapEmbed && (
              <div className="mt-4 aspect-video">
                <iframe
                  src={aboutMapEmbed}
                  className="w-full h-full rounded border"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Save All Changes
        </button>
      </div>

      

    </div>
  );
}