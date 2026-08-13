import React from 'react';
import { Heart, ShieldCheck, Users, Award, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/images/LOGO.jpg';
import sant from '../assets/images/Shri_Sant_Santaji_Jagnade_Maharaj_with_teli.jpg';

export default function AboutUs() {
  return (
    <div className="bg-stone-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Banner */}
        <div className="text-center relative flex flex-col items-center">
          <div className="mb-6 flex justify-center">
            <img 
              src={logoImg} 
              alt="नाशिक तेली समाज स्नेह बंधन" 
              referrerPolicy="no-referrer"
              className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover border-4 border-amber-400 shadow-xl bg-white p-1"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-saffron/10 text-saffron px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-saffron/20">
            <Heart className="w-4 h-4 fill-saffron" />
            <span>आमच्याबद्दल (About Us)</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 mb-6">
            Nashik Teli Samaj Matrimony
          </h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Preserving traditions, strengthening community bonds, and connecting families for a lifetime of togetherness.
          </p>
        </div>

        {/* Heritage & Inspiration */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-saffron font-bold text-xs uppercase tracking-widest block mb-2">Our Foundation & Heritage</span>
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-6">
              Inspired by Santaji Maharaj & Tel Ghana Legacy
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4 text-sm sm:text-base">
              The Nashik Teli Samaj Matrimony platform was established with the vision of uniting eligible brides and grooms of the Teli Samaj in a secure, respectful, and family-centered environment.
            </p>
            <p className="text-stone-600 leading-relaxed text-sm sm:text-base">
              We draw constant inspiration from the timeless teachings and devotion of <strong className="text-stone-900">Sant Santaji Maharaj Jagnade</strong>, whose message of integrity, industriousness, and community unity continues to guide us. The traditional <strong className="text-stone-900">Tel Ghana</strong> symbolises our community's industrious legacy.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl border-4 border-saffron/30 bg-stone-100 p-2">
              <img
                src={sant}
                alt="Tel Ghana - Heritage and Values"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-white rounded-xl"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-maroon text-gold p-4 rounded-xl shadow-lg border border-gold/30 text-xs font-serif italic font-bold">
              "संतू तुका जोडी। लावी नामाची ही गोडी॥"
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">Our Core Pillars</h2>
            <p className="text-stone-500 max-w-xl mx-auto text-sm">Built with trust, tradition, and transparency at the core of everything we do.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-50 text-saffron rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">100% Profile Verification</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Every member profile is manually verified by community admins to ensure genuine listings and prevent fraudulent profiles.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-50 text-saffron rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Community First</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Exclusively dedicated to Nashik Teli Samaj families, respecting our sub-castes, gotras, cultural customs, and ancestral roots.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-50 text-saffron rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Vedic Kundali Matching</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Integrated Ashtakoota Guna Milan system offering system-generated compatibility scores for general astrological reference.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-maroon text-gold p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden border-2 border-gold/30">
          <h3 className="text-3xl font-serif font-bold mb-3">Join Our Matrimonial Network</h3>
          <p className="text-stone-200 text-sm max-w-xl mx-auto mb-8">
            Create your verified profile today and start discovering compatible life partners within the Nashik Teli Samaj community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-saffron text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-orange-600 transition-all text-sm"
            >
              Create Free Profile
            </Link>
            <Link
              to="/faq"
              className="bg-white/10 hover:bg-white/20 text-gold border border-gold/30 font-bold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              Read FAQs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
