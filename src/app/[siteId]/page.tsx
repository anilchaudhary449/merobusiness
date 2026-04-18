import PreviewSite from '@/components/PreviewSite';
import { getWebsiteBySlug } from '@/lib/website-repository';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const site = await getWebsiteBySlug(siteId);
  
  if (!site) return { title: 'Site not found' };
  if (site.isActive === false) return { title: `${site.businessName} — Temporarily Unavailable` };

  return {
    title: `${site.businessName} - Official Website`,
    description: site.content.about.description.substring(0, 160),
    icons: {
      icon: [
        { url: site.faviconUrl || '/favicon.svg' },
        { url: site.faviconUrl || '/favicon.svg', rel: 'shortcut icon' },
      ],
      apple: [
        { url: site.faviconUrl || '/favicon.svg' },
      ],
    }
  };
}

export default async function PublicWebsite({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const siteRaw = await getWebsiteBySlug(siteId) as any;
  
  if (!siteRaw) {
    notFound();
  }

  // Convert to plain object to avoid serialization errors with ObjectId and Dates
  const site = JSON.parse(JSON.stringify(siteRaw));

  // Show a premium "unavailable" page if the store is inactive
  if (site.isActive === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-white">{site.businessName}</h1>
          <p className="text-gray-400 text-lg mb-2">Store Temporarily Unavailable</p>
          <p className="text-gray-500 text-sm">
            This store is currently paused by the owner. Please check back later.
          </p>
          <div className="mt-8 inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
            Offline
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full">
      <PreviewSite site={site} />
    </main>
  );
}
