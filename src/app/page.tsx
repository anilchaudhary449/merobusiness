import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          MeroBusiness
        </h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          The simplest way to create a mobile-first, high-performance website for your local business in Nepal. No coding required.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all hover:scale-105"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
