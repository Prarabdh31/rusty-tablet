import Navbar from '@/components/navigation/Navbar';

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F1] font-sans selection:bg-[#B7410E] selection:text-white pb-24">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-serif text-4xl font-bold text-[#2C3E50] mb-8">Editorial Disclaimer</h1>
        <div className="prose prose-sm prose-slate max-w-none">
          <h3>1. AI-Assisted Content</h3>
          <p><strong>Rusty Tablet</strong> operates as a hybrid newsroom. Our content is generated using a combination of algorithmic aggregation, Large Language Models (LLMs), and human editorial oversight.</p>
          <ul>
             <li>Articles may be drafted by AI based on real-time data feeds.</li>
             <li>Images may be synthesized by generative AI models (Gemini/Imagen) for illustrative purposes.</li>
          </ul>

          <h3>2. Accuracy of Information</h3>
          <p>While we source data from reputable feeds (Reuters, BBC, TechCrunch), the aggregation process is automated. We recommend cross-referencing critical financial or political information with primary sources.</p>

          <h3>3. Affiliate Links & Advertising</h3>
          <p>Rusty Tablet participates in various affiliate marketing programs and displays advertisements (via Google AdSense). These partnerships do not influence our editorial stance.</p>

          <h3>4. Image Rights</h3>
          <p>Images labeled "Visualization via Rusty Tablet Engine" are AI-generated. Images labeled "Unsplash" are used under the Unsplash License. News source images are used under Fair Use for reporting purposes.</p>
        </div>
      </div>
    </main>
  );
}