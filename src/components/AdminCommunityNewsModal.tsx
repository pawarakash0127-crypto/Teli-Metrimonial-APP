import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Image, Globe, Calendar, MapPin, Tag } from 'lucide-react';
import { NewsItem, saveCommunityNewsItem } from '../data/communityNewsData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newsItem: Partial<NewsItem> | null;
  onSuccess: (savedItem: Partial<NewsItem>) => void;
}

export default function AdminCommunityNewsModal({ isOpen, onClose, newsItem, onSuccess }: Props) {
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    category: 'वधू-वर परिचय मेळावा',
    title: '',
    titleEn: '',
    date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    location: 'नाशिक',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    summary: '',
    fullText: '',
    sourceName: 'नाशिक तेली समाज',
    sourceUrl: '',
    published: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (newsItem) {
      setFormData({
        id: newsItem.id,
        category: newsItem.category || 'वधू-वर परिचय मेळावा',
        title: newsItem.title || '',
        titleEn: newsItem.titleEn || '',
        date: newsItem.date || new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        location: newsItem.location || 'नाशिक',
        image: newsItem.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
        summary: newsItem.summary || '',
        fullText: newsItem.fullText || '',
        sourceName: newsItem.sourceName || 'नाशिक तेली समाज',
        sourceUrl: newsItem.sourceUrl || '',
        published: newsItem.published !== false
      });
    } else {
      setFormData({
        category: 'वधू-वर परिचय मेळावा',
        title: '',
        titleEn: '',
        date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        location: 'नाशिक',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
        summary: '',
        fullText: '',
        sourceName: 'नाशिक तेली समाज',
        sourceUrl: '',
        published: true
      });
    }
    setError(null);
  }, [newsItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() && !formData.titleEn?.trim()) {
      setError('Please provide at least a Marathi or English title for the news article.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const savedId = await saveCommunityNewsItem(formData);
      onSuccess({ ...formData, id: savedId });
      onClose();
    } catch (err: any) {
      console.error('Error saving news item:', err);
      setError(err?.message || 'Failed to save news item in Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-saffron/10 text-saffron rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {formData.id ? 'Edit Community News Article' : 'Create New Community News Article'}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Publish live community updates, marriage meet schedules, and achievement news to the homepage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 mb-6 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-saffron" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
              >
                <option value="वधू-वर परिचय मेळावा">वधू-वर परिचय मेळावा (Matrimonial Meet)</option>
                <option value="गुणवत्ता सत्कार व जयंती">गुणवत्ता सत्कार व जयंती (Excellence Awards)</option>
                <option value="व्यवसाय व उद्योग">व्यवसाय व उद्योग (Business & Careers)</option>
                <option value="महिला सशक्तीकरण">महिला सशक्तीकरण (Women Empowerment)</option>
                <option value="समाज प्रबोधन व उपक्रम">समाज प्रबोधन व उपक्रम (Social Initiatives)</option>
                <option value="इतर समाज बातम्या">इतर समाज बातम्या (General Community News)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-saffron" />
                Display Date
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
                placeholder="e.g. 15 ऑगस्ट 2026"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              News Title (Marathi) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
              placeholder="e.g. नाशिक जिल्हा तेली समाज भव्य राज्यस्तरीय वधू-वर परिचय मेळावा"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              News Title (English Translation / Reference)
            </label>
            <input
              type="text"
              value={formData.titleEn}
              onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
              placeholder="e.g. Nashik District Teli Samaj Matrimonial Meet 2026"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-saffron" />
                Location / Venue
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
                placeholder="e.g. रावसाहेब थोरात सभागृह, नाशिक"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-saffron" />
                Cover Image URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Summary / Short Description
            </label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
              placeholder="Brief summary to display on the news card..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Full Article Content
            </label>
            <textarea
              rows={4}
              value={formData.fullText}
              onChange={(e) => setFormData({ ...formData, fullText: e.target.value })}
              className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
              placeholder="Full news details, program schedules, chief guests, and contact information..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-saffron" />
                Source Name
              </label>
              <input
                type="text"
                value={formData.sourceName}
                onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
                placeholder="e.g. सकाळ नाशिक / नाशिक तेली समाज"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Source URL (Optional)
              </label>
              <input
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 font-medium"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-3 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                checked={formData.published !== false}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="rounded text-saffron focus:ring-saffron h-4 w-4"
              />
              <span className="text-sm font-bold text-stone-800">
                Published & Visible on Website Homepage
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-saffron hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : formData.id ? 'Save Changes' : 'Publish Article'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}