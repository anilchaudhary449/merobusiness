"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, MessageCircle, MapPin, Search, ExternalLink, 
  Mail, PhoneCall, Globe, Music, Heart, Star, HelpCircle, 
  User, PlusCircle, LogIn, ChevronRight, Send, Loader2,
  Lock, CheckCircle2, XCircle, ArrowRight, LogOut,
  BadgeCheck, Clock, X, AtSign, Calendar, Package, Settings, Menu, Layout
} from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { getThemePreset } from '@/lib/theme-presets';
import useSWR from 'swr';
import ImageUpload from './ImageUpload';
import { CreditCard, Wallet } from 'lucide-react';

// Inline SVG social icons (not available in lucide-react v1.8)
const FacebookIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const XIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);

const MessengerIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.291 14.392l-3.058-3.259-5.965 3.259 6.559-6.963 3.13 3.259 5.893-3.259-6.559 6.963z"/>
  </svg>
);

export default function PreviewSite({ site, ownerInfo, isEditor = false }: { site: any; ownerInfo?: any; isEditor?: boolean }) {
  if (!site) return null;
  const { data: session } = useSession();
  const [messengerNotice, setMessengerNotice] = useState('');
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'faqs'>('overview');
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [profileModal, setProfileModal] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'info' | 'orders'>('info');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '', middleName: '', lastName: '', phone: '',
    deliveryAddress: '',
    mapLocationLabel: '', mapLocationLat: '', mapLocationLng: '', mapLocationUrl: '',
    currentPassword: '', newPassword: '', confirmNewPassword: ''
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auth Form States
  const [authForm, setAuthForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', middleName: '', lastName: '', 
    dob: '', countryCode: '+977', phone: ''
  });
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<'WHATSAPP' | 'MESSENGER' | null>(null);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_PAYMENT'>('COD');
  const [paymentReceipt, setPaymentReceipt] = useState('');

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  
  // Customer own profile data
  const { data: customerProfile, mutate: mutateProfile } = useSWR(
    session?.user ? '/api/store/customer/profile' : null,
    fetcher
  );

  // Customer own order history
  const { data: customerOrdersData, isLoading: isLoadingCustomerOrders } = useSWR(
    profileModal && session?.user ? '/api/store/customer/orders' : null,
    fetcher
  );

  // Real-time Wishlist Data
  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    session?.user ? `/api/store/${site.slug || site._id}/wishlist` : null, 
    fetcher
  );

  // Reviews & FAQs for Active Product
  const { data: reviews, mutate: mutateReviews } = useSWR(
    activeProduct ? `/api/store/${site.slug || site._id}/products/${activeProduct.id}/reviews` : null,
    fetcher
  );

  const { data: faqs } = useSWR(
    activeProduct ? `/api/store/${site.slug || site._id}/products/${activeProduct.id}/faqs` : null,
    fetcher
  );
  
  const wishlist = new Set(wishlistData?.map((w: any) => w.productId) || []);

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!session) {
      setAuthModal('login');
      return;
    }

    const isAdded = wishlist.has(productId);
    try {
      if (isAdded) {
        await fetch(`/api/store/${site.slug || site._id}/wishlist`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
      } else {
        await fetch(`/api/store/${site.slug || site._id}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
      }
      mutateWishlist();
      toast.success(isAdded ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    try {
      if (authModal === 'register') {
        const res = await fetch('/api/auth/customer-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success('Registration successful! Please log in.');
        setAuthModal('login');
      } else if (authModal === 'login') {
        const result = await signIn('credentials', {
          redirect: false,
          email: authForm.email,
          password: authForm.password,
          loginContext: 'customer',
        });
        if (result?.error) {
          throw new Error('Invalid email or password. Please try again.');
        }
        toast.success('Welcome back!');
        setAuthModal(null);
        // Reload to refresh session-dependent UI (wishlist, profile icon)
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/customer-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setAuthModal('login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { setAuthModal('login'); return; }
    try {
       const res = await fetch(`/api/store/${site.slug || site._id}/products/${activeProduct.id}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
       });
       const data = await res.json();
       if (!res.ok) throw new Error(data.error || 'Failed to post review');
       toast.success('Review posted successfully!');
       setReviewComment('');
       mutateReviews();
    } catch (err: any) {
       toast.error(err.message);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsProfileSaving(true);
    try {
      const res = await fetch('/api/store/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          middleName: profileForm.middleName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          deliveryAddress: profileForm.deliveryAddress,
          mapLocation: {
            label: profileForm.mapLocationLabel,
            lat: profileForm.mapLocationLat ? parseFloat(profileForm.mapLocationLat) : undefined,
            lng: profileForm.mapLocationLng ? parseFloat(profileForm.mapLocationLng) : undefined,
          },
          currentPassword: profileForm.currentPassword || undefined,
          newPassword: profileForm.newPassword || undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Profile updated successfully!');
      mutateProfile();
      setProfileModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const activeTheme = getThemePreset(site.theme);
  const { content, businessName, whatsappNumber, messengerUsername } = site;
  
  const displayPhone = site.directPhone || ownerInfo?.phone || '';
  const displayEmail = site.businessEmail || ownerInfo?.email || '';
  const displayPan = ownerInfo?.panNumber || '';

  const normalizeMessengerHandle = (value: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return '';

    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    const withoutDomain = withoutProtocol.replace(/^(www\.)?(m\.me|messenger\.com|facebook\.com)\//, '');
    const clean = withoutDomain
      .replace(/^messages\/t\//, '')
      .replace(/^@/, '')
      .replace(/\?.*$/, '')
      .replace(/\/+$/, '');

    return clean;
  };

  const buildWhatsAppLink = (message: string) => {
    if (!whatsappNumber) return '#';
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const buildMessengerLink = (message: string) => {
    const handle = normalizeMessengerHandle(messengerUsername || '');
    if (!handle) return '#';

    return `https://m.me/${handle}?ref=${encodeURIComponent(message)}`;
  };

  const whatsappLink = buildWhatsAppLink('Hi, I would like to order...');
  const messengerLink = buildMessengerLink('Hi, I would like to order...');
  const defaultOrderMessage = `Hi, I would like to order from ${businessName}.`;
  const themeCardClass = site.backgroundColor === '#0b0b0f' || site.backgroundColor === '#020617' || site.backgroundColor === '#140f1f'
    ? 'bg-white/5 border-white/10'
    : 'bg-white border-gray-100';
  const isDarkTheme = themeCardClass.includes('bg-white/5');

  const handleOrderClick = async (
    event: React.MouseEvent<HTMLElement>,
    message: string,
    product: any | null,
    method: 'WHATSAPP' | 'MESSENGER',
    link: string,
    paymentMethod?: 'COD' | 'ONLINE_PAYMENT',
    paymentReceipt?: string | null
  ) => {
    event.preventDefault();

    if (!session?.user) {
      setAuthModal('login');
      return;
    }

    // NEW: Intercept card/modal clicks to show checkout confirmation first
    if (!isCheckoutModalVisible) {
       setCheckoutProduct(product);
       setCheckoutMethod(method);
       setIsCheckoutModalVisible(true);
       return;
    }

    // Enhance message with payment and delivery details
    let finalMessage = message;
    if (product) {
       const addr = customerProfile?.deliveryAddress || 'Not specified';
       const loc = customerProfile?.mapLocation?.lat ? `https://www.google.com/maps?q=${customerProfile.mapLocation.lat},${customerProfile.mapLocation.lng}` : 'Not shared';
       const pm = paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment';
       
       finalMessage = `🛍️ *Order from ${businessName}*\n\n` +
                      `*Item:* ${product.name}\n` +
                      `*Price:* ${product.price}\n` +
                      `*Payment:* ${pm}\n\n` +
                      `📍 *Delivery Details:*\n` +
                      `*Address:* ${addr}\n` +
                      `*Location:* ${loc}\n\n` +
                      `_Please confirm my order._`;
    }

    try {
      if (product) {
        await fetch(`/api/store/${site.slug || site._id}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: (session.user as any).id || (session.user as any)._id,
            product: {
              id: product.id || product._id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
            },
            method,
            paymentMethod,
            paymentReceipt,
          })
        });
      }
    } catch (e) {
      console.error("Failed to log order", e);
    }

    const finalLink = method === 'WHATSAPP' 
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(finalMessage)}`
      : buildMessengerLink(finalMessage);

    if (method === 'MESSENGER') {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(finalMessage);
          setMessengerNotice('Order message copied. Paste it into Messenger.');
          window.setTimeout(() => setMessengerNotice(''), 3000);
        }
      } catch {
        setMessengerNotice('Messenger opened. If needed, paste your order details manually.');
        window.setTimeout(() => setMessengerNotice(''), 3000);
      }
    }

    if (finalLink && finalLink !== '#') {
      window.open(finalLink, '_blank', 'noopener,noreferrer');
    }
  };
  
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
      {messengerNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {messengerNotice}
        </div>
      )}

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
          --brand-surface: ${site.productsBgColor || '#ffffff'};
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

        /* Modal Backdrop */
        .modal-backdrop {
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
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
          <span className="theme-chip hidden lg:inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
            {activeTheme.label}
          </span>
        </div>
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <a href="#hero" className="hover:text-brand-accent transition-colors" style={{ color: 'inherit' }}>Home</a>
          <a href="#products" className="hover:text-brand-accent transition-colors" style={{ color: 'inherit' }}>Products</a>
          <a href="#about" className="hover:text-brand-accent transition-colors" style={{ color: 'inherit' }}>About</a>
        </div>
        <div className="flex items-center space-x-3">
        {/* User area: logged in = profile icon+dropdown, else = Login button */}
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(v => !v);
                  if (!profileModal && customerProfile) {
                    setProfileForm({
                      firstName: customerProfile.firstName || '',
                      middleName: customerProfile.middleName || '',
                      lastName: customerProfile.lastName || '',
                      phone: customerProfile.phone || '',
                      deliveryAddress: customerProfile.deliveryAddress || '',
                      mapLocationLabel: customerProfile.mapLocation?.label || '',
                      mapLocationLat: customerProfile.mapLocation?.lat?.toString() || '',
                      mapLocationLng: customerProfile.mapLocation?.lng?.toString() || '',
                      mapLocationUrl: '',
                      currentPassword: '', newPassword: '', confirmNewPassword: ''
                    });
                  }
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
                title={`Signed in as ${session.user.name}`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-sm">
                  {(session.user.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Account</p>
                  <p className="text-xs font-bold text-slate-700 leading-tight">{session.user.name?.split(' ')[0]}</p>
                </div>
              </button>

              {/* Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[24px] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
                  <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-xs font-black text-slate-900">{session.user.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{session.user.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (customerProfile) {
                        setProfileForm({
                          firstName: customerProfile.firstName || '',
                          middleName: customerProfile.middleName || '',
                          lastName: customerProfile.lastName || '',
                          phone: customerProfile.phone || '',
                          deliveryAddress: customerProfile.deliveryAddress || '',
                          mapLocationLabel: customerProfile.mapLocation?.label || '',
                          mapLocationLat: customerProfile.mapLocation?.lat?.toString() || '',
                          mapLocationLng: customerProfile.mapLocation?.lng?.toString() || '',
                          mapLocationUrl: '',
                          currentPassword: '', newPassword: '', confirmNewPassword: ''
                        });
                        }
                        setProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      <User size={16} className="text-indigo-500" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); signOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => { setShowProfileMenu(false); setAuthModal('login'); }}
              className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <LogIn size={14} className="text-brand-accent" />
              <span>Log In</span>
            </button>
          )}
          <a 
            href={whatsappLink}
            onClick={(e) => handleOrderClick(e, defaultOrderMessage, null, 'WHATSAPP', whatsappLink)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-brand-accent rounded-full text-xs font-bold text-white shadow-lg shadow-brand-accent/20 hover:scale-105 transition-transform"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Order Now</span>
          </a>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-all"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Backdrop & Panel */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col p-8 pt-24 space-y-8">
               <button 
                 onClick={() => setMobileMenuOpen(false)}
                 className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-all"
               >
                 <X size={24} />
               </button>
               
               <div className="space-y-6">
                 <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="block text-2xl font-black text-slate-900 border-b border-slate-50 pb-4">Home</a>
                 <a href="#products" onClick={() => setMobileMenuOpen(false)} className="block text-2xl font-black text-slate-900 border-b border-slate-50 pb-4">Products</a>
                 <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-2xl font-black text-slate-900 border-b border-slate-50 pb-4">About</a>
               </div>

               {!session?.user && (
                 <button 
                   onClick={() => { setMobileMenuOpen(false); setAuthModal('login'); }}
                   className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20"
                 >
                   <LogIn size={20} />
                   Log In to Site
                 </button>
               )}

               <div className="mt-auto space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Powered by</p>
                   <Link href="/" className="flex items-center space-x-2 group">
                     <div className="bg-indigo-600 p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                       <Layout size={16} />
                     </div>
                     <span className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">MeroBusiness</span>
                   </Link>
               </div>
            </div>
          </div>
        )}
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
                  <div key={product.id} className={`${themeCardClass} rounded-2xl overflow-hidden shadow-sm border group transition-all hover:shadow-md hover:-translate-y-1 flex flex-col h-full`}>
                    <div 
                      className="aspect-[4/5] overflow-hidden bg-gray-100 relative cursor-pointer"
                      onClick={() => { setActiveProduct(product); setActiveTab('overview'); }}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button 
                        onClick={(e) => toggleWishlist(e, product.id)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${wishlist.has(product.id) ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-rose-500'}`}
                      >
                        <Heart size={16} fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                      </button>
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </div>
                    </div>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <h3 className={`line-clamp-2 text-sm md:text-base leading-tight font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                      <p className="font-bold text-brand-accent text-sm md:text-base mt-1.5 mb-3">{product.price}</p>
                      {(product.sizeEU || product.sizeINT) && (
                        <div className="mb-2 flex flex-wrap gap-2 text-[10px] md:text-xs">
                          {product.sizeEU && (
                            <span className={`rounded-full px-2.5 py-1 font-semibold ${isDarkTheme ? 'bg-white/10 text-white/80' : 'bg-black/5 text-gray-600'}`}>EU {product.sizeEU}</span>
                          )}
                          {product.sizeINT && (
                            <span className={`rounded-full px-2.5 py-1 font-semibold ${isDarkTheme ? 'bg-white/10 text-white/80' : 'bg-black/5 text-gray-600'}`}>INT {product.sizeINT}</span>
                          )}
                        </div>
                      )}
                      {(product.dimensions?.length || product.dimensions?.width || product.dimensions?.height) && (
                        <p className={`mb-3 text-[10px] md:text-xs ${isDarkTheme ? 'text-white/60' : 'text-gray-500'}`}>
                          Size: {product.dimensions?.length || '-'} x {product.dimensions?.width || '-'} x {product.dimensions?.height || '-'}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <a
                          href={buildWhatsAppLink(`Hi, I am interested in ${product.name} of ${product.price}`)}
                          onClick={(e) => handleOrderClick(e, `Hi, I am interested in ${product.name} of ${product.price}`, product, 'WHATSAPP', buildWhatsAppLink(`Hi, I am interested in ${product.name} of ${product.price}`))}
                          className="flex items-center justify-center bg-green-50 text-green-700 py-2 rounded-xl transition-colors font-medium text-[10px] md:text-xs border border-green-100 hover:bg-green-100 cursor-pointer"
                        >
                          <MessageCircle size={14} className="mr-1" />
                          WhatsApp
                        </a>
                        <a
                          href={buildMessengerLink(`Hi, I am interested in ${product.name} of ${product.price}`)}
                          onClick={(e) => handleOrderClick(e, `Hi, I am interested in ${product.name} of ${product.price}`, product, 'MESSENGER', buildMessengerLink(`Hi, I am interested in ${product.name} of ${product.price}`))}
                          className="flex items-center justify-center bg-blue-50 text-blue-700 py-2 rounded-xl transition-colors font-medium text-[10px] md:text-xs border border-blue-100 hover:bg-blue-100 cursor-pointer"
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
            {displayPhone && (
              <div className="flex items-start space-x-3 text-sm">
                <div className="mt-1 p-2 bg-white/5 rounded-lg"><Phone size={16} className="text-brand-accent" /></div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>Phone</p>
                  <p className="opacity-80">{displayPhone}</p>
                </div>
              </div>
            )}
            {displayEmail && (
              <div className="flex items-start space-x-3 text-sm">
                <div className="mt-1 p-2 bg-white/5 rounded-lg"><Mail size={16} className="text-brand-accent" /></div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>Email</p>
                  <p className="opacity-80 lowercase">{displayEmail}</p>
                </div>
              </div>
            )}
            {displayPan && (
              <div className="flex items-start space-x-3 text-sm">
                <div className="mt-1 p-2 bg-white/5 rounded-lg">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-brand-accent">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--section-heading)' }}>PAN No.</p>
                  <p className="opacity-80 uppercase">{displayPan}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links / Navigation */}
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
        {displayPhone && (
          <a 
            href={`tel:${displayPhone}`}
            className="flex-1 pointer-events-auto h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-gray-100 text-gray-800 font-bold text-sm"
          >
            <PhoneCall size={18} className="mr-2 text-indigo-600" />
            Call
          </a>
        )}
        <a 
          href={whatsappLink}
          onClick={(e) => handleOrderClick(e, defaultOrderMessage, null, 'WHATSAPP', whatsappLink)}
          className="flex-1 pointer-events-auto h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-2xl text-white font-bold text-xs"
        >
          <MessageCircle size={18} className="mr-1.5" />
          WhatsApp
        </a>
        {messengerUsername && (
          <a 
            href={messengerLink}
            onClick={(e) => handleOrderClick(e, defaultOrderMessage, null, 'MESSENGER', messengerLink)}
            className="flex-1 pointer-events-auto h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl text-white font-bold text-xs"
          >
            <MessengerIcon size={18} className="mr-1.5" />
            Messenger
          </a>
        )}
      </div>

      {/* ─── Product Detail Modal ─── */}
      {activeProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop" onClick={() => setActiveProduct(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] animate-in slide-in-from-bottom-5 duration-300">
            <button 
              onClick={() => setActiveProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-all"
            >
              <X size={20} />
            </button>

            {/* Product Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden bg-slate-50 relative">
               <img src={activeProduct.imageUrl} className="w-full h-full object-cover" alt={activeProduct.name} />
               <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-brand-accent text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-brand-accent/20">
                     Official Model
                  </span>
               </div>
            </div>

            {/* Interaction Panel */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
               <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{activeProduct.name}</h2>
                  <p className="text-xl font-bold text-brand-accent">{activeProduct.price}</p>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-slate-100 mb-6 sticky top-0 bg-white z-10">
                  {['overview', 'reviews', 'faqs'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab}
                      {tab === 'reviews' && reviews?.length > 0 && <span className="ml-1 text-[8px] opacity-60">({reviews.length})</span>}
                    </button>
                  ))}
               </div>

               <div className="flex-1">
                  {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
                       <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          Enjoy premium quality with {activeProduct.name}. A masterpiece of design and functionality curated for our valued customers.
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Authenticity</p>
                             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <BadgeCheck size={14} className="text-emerald-500" /> Verified Item
                             </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Availability</p>
                             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <Clock size={14} className="text-amber-500" /> Limited Stock
                             </div>
                          </div>
                       </div>


                       <div className="pt-6 border-t border-slate-50 flex gap-4">
                          <button onClick={(e) => toggleWishlist(e, activeProduct.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs border transition-all ${wishlist.has(activeProduct.id) ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                             <Heart size={16} fill={wishlist.has(activeProduct.id) ? "currentColor" : "none"} /> 
                             {wishlist.has(activeProduct.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
                          </button>
                       </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 pb-6">
                       <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-900 rounded-[28px] text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Leave a Review</p>
                          <div className="flex gap-2 mb-4">
                             {[1, 2, 3, 4, 5].map(star => (
                               <button 
                                 key={star} 
                                 type="button" 
                                 onClick={() => setReviewRating(star)}
                                 className={`transition-all ${reviewRating >= star ? 'text-amber-400 scale-110' : 'text-slate-700'}`}
                               >
                                 <Star size={20} fill={reviewRating >= star ? 'currentColor' : 'none'} />
                               </button>
                             ))}
                          </div>
                          <textarea 
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            required
                            placeholder="Share your experience..." 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-accent outline-none mb-3 min-h-[80px]"
                          />
                          <button className="w-full py-2.5 bg-brand-accent text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2">
                             <Send size={14} /> Submit Review
                          </button>
                       </form>

                       <div className="space-y-4">
                          {reviews?.length === 0 && <p className="text-center text-slate-400 text-xs py-10 font-bold uppercase tracking-widest">No reviews yet</p>}
                          {reviews?.map((review: any) => (
                            <div key={review._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-bold text-slate-900">{review.userId?.name || 'Anonymous'}</p>
                                  <div className="flex gap-0.5">
                                     {[...Array(5)].map((_, i) => (
                                       <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? 'text-amber-500' : 'text-slate-300'} />
                                     ))}
                                  </div>
                               </div>
                               <p className="text-xs text-slate-600 italic leading-relaxed">"{review.comment}"</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {activeTab === 'faqs' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
                       {faqs?.length === 0 && (
                          <div className="text-center py-20 text-slate-400">
                             <HelpCircle size={40} className="mx-auto mb-4 opacity-20" />
                             <p className="text-xs font-black uppercase tracking-widest">No FAQs for this product</p>
                          </div>
                       )}
                       {faqs?.map((faq: any) => (
                         <div key={faq._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-black text-slate-900 mb-2 flex items-start gap-2">
                               <MessageCircle size={14} className="text-brand-accent shrink-0 mt-0.5" />
                               {faq.question}
                            </h4>
                            <p className="text-xs text-slate-600 pl-6 leading-relaxed border-l-2 border-slate-200 ml-1.5">
                               {faq.answer}
                            </p>
                         </div>
                       ))}
                    </div>
                  )}
               </div>

               <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                  <a 
                    href={buildWhatsAppLink(`Hi, I want to order ${activeProduct.name} for ${activeProduct.price}`)}
                    onClick={(e) => handleOrderClick(e, `Hi, I want to order ${activeProduct.name} for ${activeProduct.price}`, activeProduct, 'WHATSAPP', buildWhatsAppLink(`Hi, I want to order ${activeProduct.name} for ${activeProduct.price}`))}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    Buy via WhatsApp
                  </a>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Auth Modals (Login/Register) ─── */}
      {authModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop" onClick={() => setAuthModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[40px] flex flex-col max-h-[90vh] shadow-2xl animate-in scale-in-95 duration-200">
             <div className="relative p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1">
             <button onClick={() => setAuthModal(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-all">
                <X size={20} />
             </button>

             <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                   {authModal === 'login' ? <Lock size={28} /> : authModal === 'register' ? <User size={28} /> : <AtSign size={28} />}
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                   {authModal === 'login' ? 'Welcome Back' : authModal === 'register' ? 'Join the Store' : 'Reset Password'}
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                   {authModal === 'login' ? 'Sign in to access your wishlist and reviews' : authModal === 'register' ? 'Create an account to track your orders' : 'Enter your email to request a reset'}
                </p>
             </div>

             <form onSubmit={(e) => {
                if (authModal === 'forgot') handleForgotPassword(e);
                else handleAuthSubmit(e);
             }} className="space-y-4">
                {authModal === 'register' && (
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                        <input required type="text" value={authForm.firstName} onChange={e => setAuthForm({...authForm, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                        <input required type="text" value={authForm.lastName} onChange={e => setAuthForm({...authForm, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                     </div>
                  </div>
                )}
                
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gmail Address</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input required type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} placeholder="yourname@gmail.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                   </div>
                </div>

                {authModal === 'register' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">DOB (16+)</label>
                       <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input required type="date" value={authForm.dob} onChange={e => setAuthForm({...authForm, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile</label>
                       <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input required type="tel" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} placeholder="98XXXXXXX" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                       </div>
                    </div>
                  </div>
                )}

                {authModal === 'register' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                       <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input required type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm</label>
                       <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input required type="password" value={authForm.confirmPassword} onChange={e => setAuthForm({...authForm, confirmPassword: e.target.value})} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                       </div>
                    </div>
                  </div>
                ) : authModal !== 'forgot' && (
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                     <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" />
                     </div>
                  </div>
                )}

                {authModal === 'login' && (
                   <div className="text-right">
                      <button type="button" onClick={() => setAuthModal('forgot')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                         Forgot Password?
                      </button>
                   </div>
                )}

                <button 
                  disabled={isAuthSubmitting}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                   {isAuthSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                     <>
                        <span>{authModal === 'login' ? 'Secure Login' : authModal === 'register' ? 'Create Account' : 'Request Password Reset'}</span>
                        <ArrowRight size={18} />
                     </>
                   )}
                </button>
             </form>

             <div className="text-center mt-10 pt-6 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-500">
                   {authModal === 'login' ? "New to the store?" : "Already have an account?"}{' '}
                   <button 
                     onClick={() => setAuthModal(authModal === 'login' ? 'register' : 'login')}
                     className="text-indigo-600 hover:underline"
                   >
                     {authModal === 'login' ? 'Join Now' : 'Sign In'}
                   </button>
                </p>
             </div>
           </div>
          </div>
        </div>
      )}

      {/* ─── Customer Profile Edit Modal ─── */}
      {profileModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop" onClick={() => setProfileModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[40px] flex flex-col max-h-[90vh] shadow-2xl animate-in scale-in-95 duration-200">
            <div className="relative p-8 overflow-y-auto custom-scrollbar flex-1">
              <button onClick={() => setProfileModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-all">
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  <User size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">My Profile</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Manage your settings and orders</p>
              </div>

              <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-100">
                <button 
                  onClick={() => setProfileActiveTab('info')} 
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-2 ${profileActiveTab === 'info' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Settings size={14} /> Details
                </button>
                <button 
                  onClick={() => setProfileActiveTab('orders')} 
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-2 ${profileActiveTab === 'orders' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Package size={14} /> Orders
                </button>
              </div>

              {profileActiveTab === 'info' && (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                    <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                    <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Middle Name (Optional)</label>
                  <input type="text" value={profileForm.middleName} onChange={e => setProfileForm({...profileForm, middleName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+977 98XXXXXXX" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                  </div>
                </div>

                {/* ─── Delivery & Location ─── */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery / Pickup Location</p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Street / Area Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 text-slate-400" size={16} />
                      <textarea
                        value={profileForm.deliveryAddress}
                        onChange={e => setProfileForm({...profileForm, deliveryAddress: e.target.value})}
                        placeholder="e.g. Thamel, Kathmandu, Nepal — near XYZ landmark"
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Google Maps Link <span className="normal-case text-slate-300">(paste share URL)</span></label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="url"
                        value={profileForm.mapLocationUrl}
                        onChange={e => {
                          const url = e.target.value;
                          setProfileForm(f => ({...f, mapLocationUrl: url}));
                          // Extract @lat,lng from Google Maps share URL
                          const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                          if (match) {
                            setProfileForm(f => ({...f, mapLocationUrl: url, mapLocationLat: match[1], mapLocationLng: match[2], mapLocationLabel: f.mapLocationLabel || 'My Location'}));
                          }
                        }}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                      />
                    </div>
                  </div>

                  {/* Current Location button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) { toast.error('Geolocation not supported by this browser.'); return; }
                      navigator.geolocation.getCurrentPosition(
                        pos => {
                          const lat = pos.coords.latitude.toFixed(6);
                          const lng = pos.coords.longitude.toFixed(6);
                          setProfileForm(f => ({...f, mapLocationLat: lat, mapLocationLng: lng, mapLocationLabel: f.mapLocationLabel || 'My Current Location'}));
                          toast.success('Location captured!');
                        },
                        () => toast.error('Permission denied. Please allow location access.')
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs rounded-2xl hover:bg-emerald-100 transition-all"
                  >
                    <MapPin size={14} /> Use My Current Location
                  </button>

                  {/* Preview card if coordinates exist */}
                  {profileForm.mapLocationLat && profileForm.mapLocationLng && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Pinned Location</p>
                      <input
                        type="text"
                        value={profileForm.mapLocationLabel}
                        onChange={e => setProfileForm({...profileForm, mapLocationLabel: e.target.value})}
                        placeholder="Location name / landmark"
                        className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <div className="flex items-center gap-3 text-[10px] font-bold text-indigo-600">
                        <span>📍 {parseFloat(profileForm.mapLocationLat).toFixed(5)}° N, {parseFloat(profileForm.mapLocationLng).toFixed(5)}° E</span>
                        <a
                          href={`https://www.google.com/maps?q=${profileForm.mapLocationLat},${profileForm.mapLocationLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto underline text-indigo-500 hover:text-indigo-700"
                        >
                          Open in Maps ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Change Password (optional)</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})} placeholder="Current password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="password" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} placeholder="New password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="password" value={profileForm.confirmNewPassword} onChange={e => setProfileForm({...profileForm, confirmNewPassword: e.target.value})} placeholder="Confirm new" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isProfileSaving ? <Loader2 className="animate-spin" size={20} /> : (
                    <><CheckCircle2 size={18} /> Save Changes</>
                  )}
                </button>
              </form>
              )}

              {profileActiveTab === 'orders' && (
                <div className="space-y-4">
                  {isLoadingCustomerOrders ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
                  ) : !customerOrdersData?.orders?.length ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Package size={24} /></div>
                      <p className="text-sm font-bold text-slate-500">No recent orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrdersData.orders.map((o: any) => (
                        <div key={o._id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                              o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              o.status === 'SHIPPED' || o.status === 'ON_THE_WAY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {o.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {o.product?.imageUrl ? (
                              <img src={o.product.imageUrl} alt="img" className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{o.product?.name || 'Unknown Item'}</p>
                              <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block pr-1"><span className="text-slate-400">QTY:</span> {o.product?.quantity || 1} • {(o.paymentMethod || 'COD').replace(/_/g, ' ')}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-indigo-600 block">{o.product?.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-50">
                <button
                  onClick={() => { setProfileModal(false); signOut(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <LogOut size={16} /> Sign Out of Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Checkout Confirmation Modal ─── */}
      {isCheckoutModalVisible && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop" onClick={() => setIsCheckoutModalVisible(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] flex flex-col max-h-[90vh] shadow-2xl animate-in scale-in-95 duration-200 overflow-hidden">
             <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <button onClick={() => setIsCheckoutModalVisible(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-all">
                  <X size={20} />
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Confirm Your Order</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Almost there! Review your details.</p>
                </div>

                {checkoutProduct && (
                  <div className="mb-8 p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                     <img src={checkoutProduct.imageUrl} className="w-20 h-20 object-cover rounded-2xl shadow-sm" alt="product" />
                     <div className="flex-1">
                        <p className="text-sm font-black text-slate-900">{checkoutProduct.name}</p>
                        <p className="text-lg font-bold text-brand-accent">{checkoutProduct.price}</p>
                     </div>
                  </div>
                )}

                <div className="space-y-6">
                   {/* Payment Method */}
                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setPaymentMethod('COD')}
                           className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'COD' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`}
                         >
                            <Package size={20} className={paymentMethod === 'COD' ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className={`text-[10px] font-black uppercase ${paymentMethod === 'COD' ? 'text-indigo-900' : 'text-slate-500'}`}>Cash on Delivery</span>
                         </button>
                         <button 
                           onClick={() => setPaymentMethod('ONLINE_PAYMENT')}
                           className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'ONLINE_PAYMENT' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`}
                         >
                            <BadgeCheck size={20} className={paymentMethod === 'ONLINE_PAYMENT' ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className={`text-[10px] font-black uppercase ${paymentMethod === 'ONLINE_PAYMENT' ? 'text-indigo-900' : 'text-slate-500'}`}>Online Payment</span>
                         </button>
                      </div>
                   </div>

                   {paymentMethod === 'ONLINE_PAYMENT' && (
                     <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scan & Pay</p>
                           {site?.paymentQR ? (
                             <img src={site.paymentQR} alt="Payment QR" className="w-48 h-48 object-contain rounded-lg shadow-sm" />
                           ) : (
                             <div className="flex flex-col items-center gap-2 text-slate-400 py-8">
                               <XCircle size={32} strokeWidth={1.5} />
                               <p className="text-xs italic text-center">No QR code provided by store.<br/>Please contact owner.</p>
                             </div>
                           )}
                        </div>
                        
                        <div className="space-y-3">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Payment Receipt (Mandatory)</p>
                           <ImageUpload 
                             value={paymentReceipt} 
                             onChange={setPaymentReceipt} 
                             label="Payment Proof" 
                           />
                        </div>
                     </div>
                   )}

                   {/* Delivery Address Review */}
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Address</p>
                         <button 
                           onClick={() => { setIsCheckoutModalVisible(false); setProfileModal(true); setProfileActiveTab('info'); }}
                           className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                         >
                            Edit
                         </button>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                         <MapPin size={18} className="text-slate-400 shrink-0 mt-0.5" />
                         <p className="text-sm font-bold text-slate-700 leading-tight">
                            {customerProfile?.deliveryAddress || 'No address set. Please add it in your profile.'}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-50">
                   <button
                     disabled={paymentMethod === 'ONLINE_PAYMENT' && !paymentReceipt}
                     onClick={(e) => {
                       handleOrderClick(
                         e as any, 
                         `Hi, I want to order ${checkoutProduct?.name || ''}`, 
                         checkoutProduct, 
                         checkoutMethod || 'WHATSAPP', 
                         '#',
                         paymentMethod,
                         paymentReceipt
                       );
                       setIsCheckoutModalVisible(false);
                     }}
                     className={`w-full py-5 text-white font-black rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 ${checkoutMethod === 'MESSENGER' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-emerald-600 shadow-emerald-600/20'} ${paymentMethod === 'ONLINE_PAYMENT' && !paymentReceipt ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105'}`}
                   >
                     {checkoutMethod === 'MESSENGER' ? <MessengerIcon size={20} /> : <MessageCircle size={20} />}
                     {paymentMethod === 'ONLINE_PAYMENT' && !paymentReceipt 
                       ? 'Upload Receipt to Confirm' 
                       : `Confirm and Open ${checkoutMethod === 'MESSENGER' ? 'Messenger' : 'WhatsApp'}`}
                     <ArrowRight size={20} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
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
