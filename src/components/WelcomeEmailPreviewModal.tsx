import React, { useState, useEffect } from 'react';
import { Mail, Send, Eye, RefreshCw, CheckCircle, AlertCircle, X, Shield, Calendar, User, Clock, Copy } from 'lucide-react';
import { formatMembershipDates } from '../lib/welcomeEmailTemplate';

interface EmailLogItem {
  id: string;
  recipientEmail: string;
  userName: string;
  subject: string;
  status: 'sent' | 'simulated' | 'failed';
  timestamp: string;
  details?: string;
}

interface WelcomeEmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeEmailPreviewModal({ isOpen, onClose }: WelcomeEmailPreviewModalProps) {
  const [userName, setUserName] = useState('Ananya Patil');
  const [userEmail, setUserEmail] = useState('ananya.patil@example.com');
  
  const dates = formatMembershipDates(new Date());
  const [regDate, setRegDate] = useState(dates.registrationDateFormatted);
  const [expDate, setExpDate] = useState(dates.expiryDateFormatted);

  const [activeTab, setActiveTab] = useState<'preview' | 'test' | 'logs'>('preview');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewUrl = `/api/welcome-email/preview?userName=${encodeURIComponent(userName)}&userEmail=${encodeURIComponent(userEmail)}&registrationDate=${encodeURIComponent(regDate)}&expiryDate=${encodeURIComponent(expDate)}`;

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/welcome-email/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.warn("Failed to fetch email logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid target email address.' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/welcome-email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmail, userName })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `Test email dispatched to ${testEmail}`,
          details: data.details
        });
        fetchLogs();
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to dispatch test email' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error sending test email' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleCopyPreviewLink = () => {
    navigator.clipboard.writeText(window.location.origin + previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-maroon via-red-950 to-maroon p-5 text-white flex items-center justify-between border-b-2 border-gold/30">
          <div className="flex items-center space-x-3">
            <div className="bg-gold/20 p-2 rounded-xl text-gold border border-gold/40">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-amber-100">Welcome Email Preview & Management</h2>
              <p className="text-xs text-amber-200/80">Teli Samaj Matrimonial Automated Email System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2.5 px-4 font-bold text-sm rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'preview'
                ? 'bg-white border-stone-200 text-maroon border-b-2 border-b-saffron -mb-px shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Eye className="w-4 h-4" /> Live Template Preview
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-2.5 px-4 font-bold text-sm rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'test'
                ? 'bg-white border-stone-200 text-maroon border-b-2 border-b-saffron -mb-px shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Send className="w-4 h-4" /> Send Test Email
          </button>
          <button
            onClick={() => { setActiveTab('logs'); fetchLogs(); }}
            className={`py-2.5 px-4 font-bold text-sm rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'logs'
                ? 'bg-white border-stone-200 text-maroon border-b-2 border-b-saffron -mb-px shadow-sm'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clock className="w-4 h-4" /> Dispatch Logs ({logs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          
          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Controls Sidebar */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-stone-800 text-base border-b pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-saffron" /> Test Personalization
                </h3>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">User Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full text-sm border-stone-200 rounded-lg p-2.5 border focus:ring-saffron focus:border-saffron"
                    placeholder="e.g. Ananya Patil"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">User Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full text-sm border-stone-200 rounded-lg p-2.5 border focus:ring-saffron focus:border-saffron"
                    placeholder="e.g. ananya@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Registration Date</label>
                  <input
                    type="text"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full text-sm border-stone-200 rounded-lg p-2.5 border focus:ring-saffron focus:border-saffron"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Membership Expiry Date (1 Year)</label>
                  <input
                    type="text"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full text-sm border-stone-200 rounded-lg p-2.5 border focus:ring-saffron focus:border-saffron"
                  />
                </div>

                <div className="pt-2 border-t">
                  <button
                    onClick={handleCopyPreviewLink}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-stone-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Preview Link Copied!' : 'Copy Direct HTML Link'}
                  </button>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1 mb-1 text-amber-800">
                    <Shield className="w-3.5 h-3.5 shrink-0" /> Security & Idempotency
                  </p>
                  Welcome emails automatically check Firestore (<code className="bg-amber-100 px-1 rounded">welcomeEmailSent</code>) to prevent duplicate delivery.
                </div>
              </div>

              {/* Live IFrame Display */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 text-xs text-stone-500 font-mono flex items-center justify-between">
                  <span>Subject: Welcome to Teli Samaj Matrimonial, {userName}! ❤️</span>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-saffron font-bold hover:underline"
                  >
                    Open in New Tab ↗
                  </a>
                </div>
                <iframe
                  src={previewUrl}
                  title="Welcome Email Live Preview"
                  className="w-full flex-1 border-0 min-h-[500px]"
                />
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 text-saffron rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900">Send Test Welcome Email</h3>
                <p className="text-stone-500 text-sm mt-1">
                  Test the real HTML email dispatch with custom user details.
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Target Test Email Address</label>
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full border-stone-200 rounded-xl p-3 border focus:ring-saffron focus:border-saffron text-sm"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Member Name to Display</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full border-stone-200 rounded-xl p-3 border focus:ring-saffron focus:border-saffron text-sm"
                    placeholder="e.g. Rajesh Pawar"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-xl text-sm border flex items-start gap-3 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.message}</p>
                      {testResult.details && <p className="text-xs mt-1 font-mono">{testResult.details}</p>}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingTest}
                  className="w-full bg-saffron hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-saffron/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingTest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Test Email...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Dispatch Test Welcome Email
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-saffron" /> Dispatch History & Audit Trail
                </h3>
                <button
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <Mail className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="font-medium">No recent email logs recorded yet.</p>
                  <p className="text-xs text-stone-400 mt-1">Logs update automatically when users register or tests are triggered.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-stone-900">
                            {log.userName}<br />
                            <span className="font-mono text-stone-500 font-normal">{log.recipientEmail}</span>
                          </td>
                          <td className="py-3 px-4 text-stone-700">{log.subject}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'simulated'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              ● {log.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px] max-w-xs truncate">
                            {log.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-4 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500 font-medium">
          <span>Teli Samaj Matrimonial Automated Notification System</span>
          <button
            onClick={onClose}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-4 py-2 rounded-xl transition-all"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
