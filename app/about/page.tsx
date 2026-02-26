'use client';
import React from 'react';
import Link from 'next/link';
import { PhoneIcon, MapPinIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/context/AppContext';

export default function AboutPage() {
  const {
    aboutDescription,
    aboutLocation,
    aboutPhone,
    aboutEmail,
    aboutOwnerName,
    aboutOwnerTitle,
    aboutOwnerQuote,
    aboutOwnerStory,
    aboutOwnerImage,
    aboutMotivationQuotes,
    aboutMapEmbed,
    restaurantName,
    isDataLoaded
  } = useAppContext();

  if (!isDataLoaded) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-brand-dark mb-4">About Us</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get to know the story behind {restaurantName} and the people who make it special.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Business Description */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-brand-dark mb-4">Our Story</h2>
            <p className="text-gray-700 leading-relaxed">{aboutDescription || 'No description provided.'}</p>
          </section>

          {/* Owner Section */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-brand-dark mb-4">Meet the Owner</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="bg-brand-primary/10 rounded-xl p-4 text-center">
                  {aboutOwnerImage ? (
                    <img
                      src={aboutOwnerImage}
                      alt={aboutOwnerName}
                      className="w-32 h-32 mx-auto rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-brand-primary rounded-full flex items-center justify-center text-white text-4xl font-bold mb-3">
                      {aboutOwnerName?.charAt(0) || 'O'}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-brand-dark">{aboutOwnerName || 'Owner'}</h3>
                  <p className="text-brand-secondary font-medium">{aboutOwnerTitle || ''}</p>
                </div>
              </div>
              <div className="md:w-2/3">
                {aboutOwnerQuote && (
                  <p className="text-gray-700 italic mb-3">"{aboutOwnerQuote}"</p>
                )}
                <p className="text-gray-600">{aboutOwnerStory || ''}</p>
              </div>
            </div>
          </section>

          {/* Motivation Quotes */}
          {aboutMotivationQuotes && aboutMotivationQuotes.length > 0 && (
            <section className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-brand-dark mb-4 text-center">Words We Live By</h2>
              <div className="space-y-4">
                {aboutMotivationQuotes.map((quote, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                    <p className="text-gray-700 text-center italic">“{quote}”</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Contact Info */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-brand-dark mb-4">Get in Touch</h2>
            <div className="space-y-4">
              {aboutPhone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-6 w-6 text-brand-primary" />
                  <a href={`tel:${aboutPhone}`} className="text-gray-700 hover:text-brand-primary transition-colors">
                    {aboutPhone}
                  </a>
                </div>
              )}
              {aboutEmail && (
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-6 w-6 text-brand-primary" />
                  <a href={`mailto:${aboutEmail}`} className="text-gray-700 hover:text-brand-primary transition-colors">
                    {aboutEmail}
                  </a>
                </div>
              )}
              {aboutLocation && (
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-6 w-6 text-brand-primary" />
                  <span className="text-gray-700">{aboutLocation}</span>
                </div>
              )}
            </div>
          </section>

          {/* Map */}
          {aboutMapEmbed ? (
            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-brand-dark mb-4">Find Us</h2>
              <div className="aspect-video">
                <iframe
                  src={aboutMapEmbed}
                  className="w-full h-full rounded-lg border"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              {aboutLocation && <p className="text-sm text-gray-500 mt-2 text-center">{aboutLocation}</p>}
            </section>
          ) : aboutLocation && (
            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-brand-dark mb-4">Find Us</h2>
              <p className="text-gray-700">{aboutLocation}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}