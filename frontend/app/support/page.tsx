'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { SUPPORT_EMAIL } from '@/lib/workflowForms';

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/support/submit', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          message: form.message,
          customer_email: form.email,
          subject: form.subject,
        }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.');
    } finally {
      setLoading(false);
    }
  };

  if (sent)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Request Submitted!</h2>
        <p className="text-gray-500">Our team will get back to you within 24 hours.</p>
        <p className="text-gray-500 text-sm">You can also reach us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-black font-medium hover:underline">{SUPPORT_EMAIL}</a>
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Customer Support</h1>
      <p className="text-gray-500 mb-8">Need help? Fill out the form below and we&apos;ll respond within 24 hours.</p>

      {/* Direct contact info */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Email Us Directly</h3>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject || 'Support request')}`} className="text-black font-medium hover:underline flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {SUPPORT_EMAIL}
          </a>
          <p className="text-gray-500 text-sm mt-1">For support queries, order issues, and general inquiries.</p>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Careers & Applications</h3>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Job application')}`} className="text-black font-medium hover:underline flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {SUPPORT_EMAIL}
          </a>
          <p className="text-gray-500 text-sm mt-1">Send your resume with the position in the subject line.</p>
        </div>
      </div>

      {/* Contact form */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea rows={5} className="w-full border rounded-lg px-3 py-2" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          {error && (
            <div className="notice notice-error" role="alert">
              {error} Contact us directly at <a className="font-semibold underline" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject || 'Support request')}`}>{SUPPORT_EMAIL}</a>.
            </div>
          )}
          <button type="submit" disabled={loading} className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <p className="text-center text-gray-400 text-sm mt-8">
        All support requests are processed by our AI-powered customer support system and reviewed by our team.
      </p>
    </div>
  );
}
