import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, ShieldCheck, Heart, UserCheck, Lock, Sparkles, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  // Category 1: Registration & Account Setup
  {
    id: 'faq-1',
    category: 'Registration & Verification',
    question: 'How do I register my profile on Nashik Teli Samaj Matrimony?',
    answer: 'Click on the "Create Profile" button on the Home page, provide your email address and password, and fill in your basic personal details. Once registered, your profile will undergo manual review by our admin team.'
  },
  {
    id: 'faq-2',
    category: 'Registration & Verification',
    question: 'Why is profile verification required?',
    answer: 'To ensure a 100% safe, genuine, and family-oriented community environment, every profile is manually verified by our team before becoming visible to other members.'
  },
  {
    id: 'faq-3',
    category: 'Registration & Verification',
    question: 'Can I register on behalf of my son, daughter, or relative?',
    answer: 'Yes, parents or authorized family members can create and manage profiles for their children or relatives.'
  },
  {
    id: 'faq-4',
    category: 'Registration & Verification',
    question: 'How long does the profile approval process take?',
    answer: 'Profile verification usually takes between 1 to 24 hours. Once approved, you will receive full access to search and connect with other members.'
  },

  // Category 2: Matching & Kundali Guna Milan
  {
    id: 'faq-5',
    category: 'Matching & Kundali',
    question: 'How does the "My Matches" system calculate compatibility?',
    answer: 'Our matching algorithm evaluates partner preferences including Preferred Birth Year, Education, Location, Marital Status, and Profession, along with Kundali / Guna Milan compatibility.'
  },
  {
    id: 'faq-6',
    category: 'Matching & Kundali',
    question: 'What is Kundali / Ashtakoota Guna Milan matching?',
    answer: 'It is a traditional 36-point Vedic astrology compatibility check covering 8 Kootas: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi.'
  },
  {
    id: 'faq-7',
    category: 'Matching & Kundali',
    question: 'Is the Kundali match result on the website definitive?',
    answer: 'No. The Kundali match on our website is system-generated for general reference. We strongly recommend consulting a qualified astrologer before making matrimonial decisions.'
  },
  {
    id: 'faq-8',
    category: 'Matching & Kundali',
    question: 'What if my or another member’s birth time is not provided?',
    answer: 'If birth time or date of birth is incomplete, the system will display "Kundali Match: Not available" while still evaluating general preference compatibility.'
  },
  {
    id: 'faq-9',
    category: 'Matching & Kundali',
    question: 'What is the match percentage threshold for "My Matches"?',
    answer: 'Profiles showing a compatibility score greater than 40% will appear in your "My Matches" list.'
  },

  // Category 3: Privacy & Security
  {
    id: 'faq-10',
    category: 'Privacy & Security',
    question: 'Is my contact information visible to all visitors?',
    answer: 'No. Your phone number and email are visible only to logged-in, verified members when mutually connected or when viewing member details.'
  },
  {
    id: 'faq-11',
    category: 'Privacy & Security',
    question: 'Is my Preferred Birth Year visible on my public profile?',
    answer: 'No. Preferred Birth Year is private and visible only to you when editing your preferences. It is used strictly behind the scenes by the matching system.'
  },
  {
    id: 'faq-12',
    category: 'Privacy & Security',
    question: 'Can non-logged-in users search or view member profiles?',
    answer: 'No. Non-logged-in visitors cannot view full member profiles, photos, or search candidates. Photos and member details are locked to protect privacy.'
  },
  {
    id: 'faq-13',
    category: 'Privacy & Security',
    question: 'How can I request account deletion or data removal?',
    answer: 'You can request account deletion at any time under "My Profile" > "Account Details" or by sending a request via the "Contact Us" page.'
  },

  // Category 4: Profile Editing & Features
  {
    id: 'faq-14',
    category: 'Profile Features',
    question: 'How do I update my highest education or profession?',
    answer: 'Go to "My Profile", select the "Edit Profile" tab, update your education from the comprehensive dropdown menu (or specify under "Others"), and click "Save Changes".'
  },
  {
    id: 'faq-15',
    category: 'Profile Features',
    question: 'Can I add multiple photos to my profile?',
    answer: 'Yes, you can upload a primary profile photo along with additional gallery photos in the "Photos" section of your profile.'
  },
  {
    id: 'faq-16',
    category: 'Profile Features',
    question: 'What should I do if my city or education is not listed?',
    answer: 'Select "Others" in the education dropdown to enter custom text, or type your custom city/native place in the provided text fields.'
  },
  {
    id: 'faq-17',
    category: 'Profile Features',
    question: 'Is providing Annual Income mandatory?',
    answer: 'No. Annual Income is optional. You may select a range or leave it as "Prefer not to say".'
  },

  // Category 5: Expressing Interest & Communication
  {
    id: 'faq-18',
    category: 'Interests & Communication',
    question: 'How do I express interest in a profile?',
    answer: 'When viewing a member\'s profile or match card, click the "Express Interest" or "Heart" icon. The member will receive a notification.'
  },
  {
    id: 'faq-19',
    category: 'Interests & Communication',
    question: 'Where can I see members who expressed interest in me?',
    answer: 'Click on the "Notifications" / "Bell" icon in the top header menu to view all received and accepted interest requests.'
  },
  {
    id: 'faq-20',
    category: 'Interests & Communication',
    question: 'What happens when I accept an interest request?',
    answer: 'Both members receive mutual confirmation, allowing direct contact between families.'
  },

  // Category 6: Community & Support
  {
    id: 'faq-21',
    category: 'Community & Support',
    question: 'Who manages Nashik Teli Samaj Matrimony?',
    answer: 'This platform is operated by community organizers of Nashik Teli Samaj (Sneh Bandhan Vivah Mandal) dedicated to preserving tradition and fostering verified matrimony.'
  },
  {
    id: 'faq-22',
    category: 'Community & Support',
    question: 'How can I contact support or report an issue?',
    answer: 'You can reach out to us directly through the "Contact Us" page or email support@nashiktelisamaj.org.'
  }
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  const categories = ['All', 'Registration & Verification', 'Matching & Kundali', 'Privacy & Security', 'Profile Features', 'Interests & Communication', 'Community & Support'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-stone-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-saffron/10 text-saffron px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-saffron/20">
            <HelpCircle className="w-4 h-4" />
            <span>नेहमी विचारले जाणारे प्रश्न (FAQs)</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Find answers to common questions about registration, profile verification, Kundali matching, privacy, and community guidelines.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search questions (e.g., Kundali, verification, privacy)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20 bg-white shadow-sm text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                activeCategory === cat
                  ? 'bg-saffron text-white shadow-saffron/30 shadow-md'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-500">
              No matching questions found. Try clearing your search filter or reach out to us on the{' '}
              <Link to="/contact" className="text-saffron font-bold underline">
                Contact Us
              </Link>{' '}
              page.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all hover:border-saffron/30"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-stone-900 text-base sm:text-lg focus:outline-none"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-saffron font-bold text-xs bg-orange-50 border border-saffron/20 px-2.5 py-1 rounded-lg shrink-0">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-saffron shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 text-stone-600 text-sm sm:text-base leading-relaxed border-t border-stone-100 mt-2 pt-4 bg-orange-50/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Support Banner */}
        <div className="mt-16 bg-gradient-to-r from-maroon via-maroon to-saffron text-white p-8 rounded-3xl text-center shadow-xl relative overflow-hidden">
          <h3 className="text-2xl font-serif font-bold mb-2 text-gold">Still have questions?</h3>
          <p className="text-stone-200 text-sm max-w-xl mx-auto mb-6">
            Our community support team is here to assist you with any inquiries or guidance regarding Nashik Teli Samaj Matrimony.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-gold hover:bg-amber-400 text-maroon font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
