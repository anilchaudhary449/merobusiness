"use client";

import React from 'react';
import { 
  Phone, MessageCircle, MapPin, Search, ExternalLink, 
  Mail, PhoneCall, Globe, Music
} from 'lucide-react';

// Inline SVG social icons (not available in lucide-react v1.8)
const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const XIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);

const MessengerIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.291 14.392l-3.058-3.259-5.965 3.259 6.559-6.963 3.13 3.259 5.893-3.259-6.559 6.963z"/>
  </svg>
);

export default function PreviewSite({ site, isEditor = false }: { site: any, isEditor?: boolean }) {
  if (!site) return null;

  const { content, businessName, whatsappNumber, messengerUsername } = site;
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=Hi, I would like to order...` : '#';
  const messengerLink = messengerUsername ? `https://m.me/${messengerUsername.replace('@', '')}` : '#';
  
  const getAnimClass = (customStyle?: string) => {
    const style = customStyle || site.animationStyle || 'reveal';
    if (style === 'none') return '';
    return `animate-${style}`;
  };

  const formatSocialLink = (value: string, platform: 'fb' | 'ig' | 'tk' | 'tw') => {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    
    // Clean potential @ or prefix from username
    const clean = value.replace('@', '');
    
    switch (platform) {
      case 'fb': return `https://facebook.com/${clean}`;
      case 'ig': return `https://instagram.com/${clean}`;
      case 'tk': return `https://tiktok.com/@${clean}`;
      case 'tw': return `https://x.com/${clean}`;
      default: return value;
    }
  };

  const renderMap = () => {
    const queryStr = site.mapConfig?.query || '';
    const locStr = site.location || '';
    
    // Check for raw HTML iframe paste
    const rawHtml = [queryStr, locStr].find(s => typeof s === 'string' && s.includes('<iframe'));
    if (rawHtml) {
      return (
        <div 
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" 
          dangerouslySetInnerHTML={{ __html: rawHtml }} 
        />
      );
    }
    
    // Fallback: standard search query if they just typed an address
    const fallbackText = queryStr || locStr || 'Kathmandu, Nepal';
    const cleanQuery = fallbackText.replace(/(<([^>]+)>)/gi, "").trim();
    const src = `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery)}&t=&z=${site.mapConfig?.zoom || 14}&ie=UTF8&iwloc=&output=embed`;
    
    return (
      <iframe 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        style={{ border: 0 }} 
        referrerPolicy="no-referrer-when-downgrade"
        src={src}
        allowFullScreen
      />
    );
  };

  return (
    <div 
      className="site-preview-container w-full h-full overflow-y-auto custom-scrollbar transition-colors duration-300"
      style={{ 
        fontFamily: `'${site.fontFamily || 'Inter'}', sans-serif`,
        backgroundColor: 'var(--brand-bg)'
      }}
    >
      {/* Dynamic Font Loading */}
      {(() => {
        const fonts = new Set([site.fontFamily || 'Inter']);
        [site.navFontFamily, site.heroFontFamily, site.aboutFontFamily, site.productsFontFamily, site.footerFontFamily].forEach(f => {
          if (f) fonts.add(f);
        });
        
        return Array.from(fonts).map(font => (
          <link
            key={font}
            href={`https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`}
            rel="stylesheet"
          />
        ));
      })()}

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-primary: ${site.primaryColor || '#f59e0b'};
          --brand-primary-rgb: ${hexToRgb(site.primaryColor || '#f59e0b')};
          --brand-heading: ${site.headingColor || '#111827'};
          --brand-text: ${site.textColor || '#4b5563'};
          --brand-head-font: '${site.fontFamily || 'Inter'}', sans-serif;
          --brand-heading-weight: ${site.headingWeight || '800'};
          --brand-bg: ${site.backgroundColor || '#f9fafb'};
        }
        .text-brand-accent { color: var(--brand-primary); }
        .bg-brand-accent { background-color: var(--brand-primary); }
        .border-brand-accent { border-color: var(--brand-primary); }
        .shadow-brand-accent { --tw-shadow-color: var(--brand-primary); }
        
        .site-preview-container h1, 
        .site-preview-container h2, 
        .site-preview-container h3, 
        .site-preview-container h4, 
        .site-preview-container h5, 
        .site-preview-container h6 { 
          color: var(--section-heading, var(--brand-heading)) !important; 
          font-weight: var(--section-weight, var(--brand-heading-weight)) !important;
          font-family: var(--section-font, inherit) !important;
        }
        .site-preview-container p, 
        .site-preview-container span, 
        .site-preview-container div:not([class*="bg-"]):not(.site-preview-container), 
        .site-preview-container li { 
          color: var(--section-text, var(--brand-text)); 
          font-family: var(--section-font, inherit);
        }
        .hero-title { color: var(--section-heading, white) !important; }
        .text-brand-heading { color: var(--brand-heading) !important; }
        
        /* Interactive Buttons */
        .btn-brand-outline {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          transition: all 0.2s ease;
        }
        .btn-brand-outline:hover {
          background-color: var(--brand-primary) !important;
          color: white !important;
        }
        .btn-order-hover:hover {
          background-color: var(--brand-primary) !important;
          color: white !important;
          border-color: var(--brand-primary) !important;
        }
        .btn-order-hover:hover .icon-accent {
          color: white !important;
        }
      `}} />

      {/* Navigation */}
      <nav 
        className="flex items-center justify-between p-4 md:px-8 border-b border-gray-100 sticky top-0 backdrop-blur-md z-40 transition-colors duration-300"
        style={{ 
          backgroundColor: site.navBgColor || 'rgba(255, 255, 255, 0.8)',
          color: site.navTextColor || '#4b5563',
          fontFamily: site.navFontFamily ? `'${site.navFontFamily}', sans-serif` : 'inherit',
          '--section-weight': site.navHeadingWeight || '700'
        } as any}
      >
        <div className="flex items-center space-x-2">
          {site.logoUrl ? (
            <img src={site.logoUrl} alt={businessName} className="h-8 md:h-10 w-auto object-contain" />
          ) : (
            <div 
              className={`font-bold text-xl tracking-tight hover:shimmer-text cursor-default ${getAnimClass(site.navAnimationStyle)}`}
              style={{ fontWeight: 'var(--section-weight, 700)', color: 'var(--brand-heading)' }}
            >
              {businessName}
            </div>
          )}
        </div>
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <a href="#hero" className="hover:text-brand-accent transition-colors" style={{ color: 'inherit' }}>Home</a>
          <a href="#products" className="hover:text-brand-accent transition-colors" style={{ color: 'inherit' }}>Products</a>
          <a href="#about" className="hover:text-brand-accent transition-colors" style={{ color: 'inherit' }}>About</a>
        </div>
        <div className="flex items-center space-x-3">
          {site.directPhone && (
            <a 
              href={`tel:${site.directPhone}`}
              className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <PhoneCall size={14} className="text-brand-accent" />
              <span>{site.directPhone}</span>
            </a>
          )}
          <a 
            href={whatsappLink}
            target="_blank" rel="noreferrer"
            className="flex items-center space-x-2 px-5 py-2.5 bg-brand-accent rounded-full text-xs font-bold text-white shadow-lg shadow-brand-accent/20 hover:scale-105 transition-transform"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Order Now</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden"
        style={{ 
          backgroundColor: site.heroBgColor || '#111827',
          '--section-heading': site.heroHeadingColor || '#ffffff',
          '--section-text': site.heroTextColor || '#e5e7eb',
          '--section-weight': site.heroHeadingWeight || '900',
          '--section-font': site.heroFontFamily ? `'${site.heroFontFamily}', sans-serif` : 'inherit'
        } as any}
      >
        <div className="absolute inset-0 z-0">
          {content.hero.imageUrl && (
            <img
              src={content.hero.imageUrl}
              alt="Hero Background"
              className="w-full h-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-6">
          <h1 className="hero-title text-4xl md:text-6xl leading-tight tracking-tight hover:shimmer-text cursor-default">
            {content.hero.title}
          </h1>
          <p className="text-lg md:text-xl font-light">
            {content.hero.subtitle}
          </p>
          <div className="pt-4">
            <a
              href="#products"
              className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-bold shadow-xl hover:bg-gray-100 hover:scale-105 transition-all text-sm md:text-base mr-3"
            >
              Select Models
            </a>
            <a
              href={whatsappLink}
              target="_blank" rel="noreferrer"
              className="inline-block bg-transparent border-2 px-8 py-3 rounded-full font-bold shadow-xl transition-all text-sm md:text-base btn-brand-outline"
            >
              Order via WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section 
        id="products" 
        className="py-20 px-4 md:px-8" 
        style={{ 
          backgroundColor: site.productsBgColor || '#f9fafb',
          '--section-heading': site.productsHeadingColor || 'var(--brand-heading)',
          '--section-text': site.productsTextColor || 'var(--brand-text)',
          '--section-weight': site.productsHeadingWeight || 'var(--brand-heading-weight)',
          '--section-font': site.productsFontFamily ? `'${site.productsFontFamily}', sans-serif` : 'inherit'
        } as any}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Collection</h2>
              <div className="w-16 h-1 bg-brand-accent mx-auto"></div>
            </div>

            {content.products && content.products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {content.products.map((product: any) => (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group transition-all hover:shadow-md hover:-translate-y-1 flex flex-col h-full">
                    <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm md:text-base leading-tight">{product.name}</h3>
                      <p className="font-bold text-brand-accent text-sm md:text-base mt-1.5 mb-3">{product.price}</p>
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=Hi, I am interested in ${product.name} (${product.price})`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center bg-green-50 text-green-700 py-2 rounded-xl transition-colors font-medium text-[10px] md:text-xs border border-green-100 hover:bg-green-100"
                        >
                          <MessageCircle size={14} className="mr-1" />
                          WhatsApp
                        </a>
                        <a
                          href={messengerUsername ? `https://m.me/${messengerUsername.replace('@', '')}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center bg-blue-50 text-blue-700 py-2 rounded-xl transition-colors font-medium text-[10px] md:text-xs border border-blue-100 hover:bg-blue-100"
                        >
                          <MessengerIcon size={14} className="mr-1" />
                          Messenger
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">Products will appear here.</div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section 
        id="about" 
        className="py-20 px-4 md:px-8" 
        style={{ 
          backgroundColor: site.aboutBgColor || '#ffffff',
          '--section-heading': site.aboutHeadingColor || 'var(--brand-heading)',
          '--section-text': site.aboutTextColor || 'var(--brand-text)',
          '--section-weight': site.aboutHeadingWeight || 'var(--brand-heading-weight)',
          '--section-font': site.aboutFontFamily ? `'${site.aboutFontFamily}', sans-serif` : 'inherit'
        } as any}
      >
        <div className="max-w-6xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 order-2 md:order-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About Us</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {content.about.description}
            </p>
            <div className="mt-8 flex items-center space-x-2 text-gray-500 font-medium pb-2 border-b border-gray-100 inline-flex">
              <MapPin size={20} className="text-brand-accent" />
              <span>{site.location || 'Kathmandu, Nepal'}</span>
            </div>
          </div>
          <div className="w-full md:w-1/2 order-1 md:order-2">
            <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <img
                src={content.about.imageUrl || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800'}
                alt="About Us"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-12 px-4 md:px-8 transition-colors duration-300"
        style={{ 
          backgroundColor: site.footerBgColor || '#111827',
          '--section-heading': site.footerHeadingColor || '#ffffff',
          '--section-text': site.footerTextColor || '#9ca3af',
          '--section-weight': site.footerHeadingWeight || '700',
          '--section-font': site.footerFontFamily ? `'${site.footerFontFamily}', sans-serif` : 'inherit'
        } as any}
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          
          {/* Company & Social */}
          <div className="w-full lg:w-1/3">
            <h3 className="text-3xl mb-4" style={{ fontFamily: 'var(--section-font)' }}>{businessName}</h3>
            <p className="mb-6 text-sm leading-relaxed opacity-80">
              High quality locally sourced products from Nepal. We pride ourselves on authentic business values and customer satisfaction.
            </p>
            
            <div className="flex items-center gap-3">
              {site.facebookUrl && (
                <a href={formatSocialLink(site.facebookUrl, 'fb')} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all shadow-sm">
                  <FacebookIcon size={18} />
                </a>
              )}
              {site.instagramUrl && (
                <a href={formatSocialLink(site.instagramUrl, 'ig')} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all shadow-sm">
                  <InstagramIcon size={18} />
                </a>
              )}
              {site.tiktokUrl && (
                <a href={formatSocialLink(site.tiktokUrl, 'tk')} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all shadow-sm">
                  <Music size={18} />
                </a>
              )}
              {site.twitterUrl && (
                <a href={formatSocialLink(site.twitterUrl, 'tw')} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all shadow-sm">
                  <XIcon size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Contact */}
          <div className="w-full lg:w-1/3 space-y-4">
            <h4 className="text-lg font-bold mb-6" style={{ color: 'var(--section-heading)' }}>Contact Info</h4>
            <div className="flex items-start space-x-3 text-sm">
              <div className="mt-1 p-2 bg-white/5 rounded-lg"><MapPin size={16} className="text-brand-accent" /></div>
              <div>
                <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>Location</p>
                <p className="opacity-80">{site.location || 'Kathmandu, Nepal'}</p>
              </div>
            </div>
            {site.directPhone && (
              <div className="flex items-start space-x-3 text-sm">
                <div className="mt-1 p-2 bg-white/5 rounded-lg"><Phone size={16} className="text-brand-accent" /></div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>Phone</p>
                  <p className="opacity-80">{site.directPhone}</p>
                </div>
              </div>
            )}
            {site.businessEmail && (
              <div className="flex items-start space-x-3 text-sm">
                <div className="mt-1 p-2 bg-white/5 rounded-lg"><Mail size={16} className="text-brand-accent" /></div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>Email</p>
                  <p className="opacity-80 lowercase">{site.businessEmail}</p>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="w-full lg:w-1/3 flex-shrink-0">
            <div className="w-full h-48 md:h-64 overflow-hidden rounded-2xl shadow-2xl border bg-gray-800/20" style={{ borderColor: 'var(--section-text)' }}>
              {renderMap()}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-gray-800 pt-8 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center text-center">
            <span>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</span>
            <span className="mt-4 md:mt-0 text-xs flex items-center bg-gray-800 px-3 py-1 rounded-full text-gray-400">
              Powered with ❤️ by MeroBusiness
            </span>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 md:hidden w-[90%] pointer-events-none">
        {site.directPhone && (
          <a 
            href={`tel:${site.directPhone}`}
            className="flex-1 pointer-events-auto h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-gray-100 text-gray-800 font-bold text-sm"
          >
            <PhoneCall size={18} className="mr-2 text-indigo-600" />
            Call
          </a>
        )}
        <a 
          href={whatsappLink}
          className="flex-1 pointer-events-auto h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-2xl text-white font-bold text-xs"
        >
          <MessageCircle size={18} className="mr-1.5" />
          WhatsApp
        </a>
        {messengerUsername && (
          <a 
            href={messengerLink}
            className="flex-1 pointer-events-auto h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl text-white font-bold text-xs"
          >
            <MessengerIcon size={18} className="mr-1.5" />
            Messenger
          </a>
        )}
      </div>
    </div>
  );
}

// Helper to convert hex to RGB for boxShadow transparency
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '245, 158, 11';
}
