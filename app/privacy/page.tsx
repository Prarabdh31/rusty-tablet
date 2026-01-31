import Navbar from '@/components/navigation/Navbar';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-serif text-4xl font-bold text-[#2C3E50] mb-8">Privacy Policy</h1>
        <div className="prose prose-sm prose-slate max-w-none">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <p>At Rusty Tablet, we believe in transparency—both in our journalism and our data practices.</p>
          
          <h3 className="font-serif text-xl font-bold text-[#2C3E50] mt-6 mb-3">1. Data Collection</h3>
          <p>We collect minimal data necessary for the operation of this publication:</p>
          <ul>
            <li><strong>Newsletter:</strong> Email addresses provided voluntarily.</li>
            <li><strong>Analytics:</strong> Anonymous usage data via Vercel Analytics and Google Analytics to understand readership trends.</li>
            <li><strong>Cookies:</strong> Essential cookies for authentication and preference settings.</li>
          </ul>

          <h3 className="font-serif text-xl font-bold text-[#2C3E50] mt-6 mb-3">2. Use of Information</h3>
          <p>We do not sell, trade, or rent your personal information to third parties. Emails are used strictly for delivering the "Rusty Tablet" dispatch.</p>

          <h3 className="font-serif text-xl font-bold text-[#2C3E50] mt-6 mb-3">3. Automated Journalism</h3>
          <p>Rusty Tablet utilizes artificial intelligence for data aggregation, drafting, and analysis. While we strive for accuracy, all content is reviewed by human editors before significant dissemination. We claim no liability for errors in automated reports.</p>

          <h3 className="font-serif text-xl font-bold text-[#2C3E50] mt-6 mb-3">4. Contact</h3>
          <p>For privacy concerns, contact: <strong>admin@rustytablet.com</strong></p>
        </div>
      </div>
    </main>
  );
}