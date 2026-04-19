"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Save, ArrowLeft, Smartphone, Monitor, CheckCircle2,
  Palette, Store, MessageCircle, Info, Layout, Package, Map
} from 'lucide-react';
import Link from 'next/link';
import PreviewSite from '@/components/PreviewSite';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import SortableProductItem from '@/components/SortableProductItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  sizeEU?: string;
  sizeINT?: string;
  dimensions?: { length: string; width: string; height: string };
  [key: string]: unknown;
}

interface SiteContent {
  hero: { title: string; subtitle: string; ctaText?: string; imageUrl: string };
  about?: { description?: string; imageUrl?: string };
  products: Product[];
}

interface MapConfig {
  query?: string;
  zoom?: number;
}

interface SiteData {
  _id?: string;
  businessName: string;
  theme?: string;
  fontFamily?: string;
  primaryColor?: string;
  backgroundColor?: string;
  headingColor?: string;
  textColor?: string;
  headingWeight?: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsappNumber?: string;
  messengerUsername?: string;
  directPhone?: string;
  businessEmail?: string;
  location?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  navFontFamily?: string;
  navBgColor?: string;
  navTextColor?: string;
  navHeadingWeight?: string;
  navAnimationStyle?: string;
  heroBgColor?: string;
  heroFontFamily?: string;
  heroHeadingColor?: string;
  heroTextColor?: string;
  heroHeadingWeight?: string;
  aboutBgColor?: string;
  aboutFontFamily?: string;
  aboutHeadingColor?: string;
  aboutTextColor?: string;
  aboutHeadingWeight?: string;
  productsBgColor?: string;
  productsHeadingColor?: string;
  productsFontFamily?: string;
  productsTextColor?: string;
  productsHeadingWeight?: string;
  footerFontFamily?: string;
  footerBgColor?: string;
  footerHeadingColor?: string;
  footerTextColor?: string;
  footerHeadingWeight?: string;
  mapConfig?: MapConfig;
  content: SiteContent;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Poppins', label: 'Poppins (Clean)' },
  { value: 'Roboto', label: 'Roboto (Classic)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Outfit', label: 'Outfit (Minimalist)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric)' },
  { value: 'Lora', label: 'Lora (Sophisticated)' },
  { value: 'Merriweather', label: 'Merriweather (Readable)' },
  { value: 'Open Sans', label: 'Open Sans (Versatile)' },
  { value: 'Cinzel', label: 'Cinzel (Roman Heritage)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (Editorial)' },
  { value: 'Pacifico', label: 'Pacifico (Playful Script)' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono (Technical)' },
];

const ANIMATION_OPTIONS = [
  { value: 'reveal', label: 'Premium Reveal (Entrance)' },
  { value: 'fade-in', label: 'Classic Fade (Soft)' },
  { value: 'slide-up', label: 'Smooth Slide (Up)' },
  { value: 'scale-in', label: 'Dynamic Scale (Pop)' },
  { value: 'bounce-in', label: 'Playful Bounce' },
  { value: 'flip-in', label: '3D Flip (Elegant)' },
  { value: 'zoom-out', label: 'Zoom Out (Cinematic)' },
  { value: 'blur-in', label: 'Focus Blur (Modern)' },
  { value: 'skew-in', label: 'Creative Skew (Unique)' },
  { value: 'none', label: 'No Animation' },
];

const EU_TO_INT_SIZE_MAP: Record<string, string> = {
  '34': 'XXS',
  '35': 'XS',
  '36': 'XS',
  '37': 'S',
  '38': 'S',
  '39': 'M',
  '40': 'M',
  '41': 'L',
  '42': 'L',
  '43': 'XL',
  '44': 'XL',
  '45': 'XXL',
  '46': 'XXL',
};

const INT_TO_EU_SIZE_MAP: Record<string, string> = {
  XXS: '34',
  XS: '35',
  S: '37',
  M: '39',
  L: '41',
  XL: '43',
  XXL: '45',
};

export default function Builder({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params);
  const { data: session, status } = useSession();
  const [site, setSite] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fieldLabels: Record<string, string> = {
    'businessName': 'Business Name',
    'theme': 'Store Theme',
    'whatsappNumber': 'WhatsApp Number',
    'messengerUsername': 'Messenger Username',
    'location': 'Store Location',
    'logoUrl': 'Logo',
    'faviconUrl': 'Favicon',
    'fontFamily': 'Font Family',
    'primaryColor': 'Primary Color',
    'headingColor': 'Heading Color',
    'textColor': 'Body Text Color',
    'headingWeight': 'Heading Style',
    'hero.title': 'Hero Title',
    'hero.subtitle': 'Hero Subtitle',
    'hero.ctaText': 'Hero Button',
    'about.description': 'About Us Text',
    'products': 'Product List'
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const user = session.user as { role?: string; assignedSiteIds?: string[] };
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const hasAccess = isSuperAdmin || user.assignedSiteIds?.includes(siteId);

      if (!hasAccess) {
        toast.error('Access Denied', { description: 'You do not have permission to edit this site.' });
        router.push('/dashboard');
        return;
      }
    }

    if (status === 'authenticated') {
      fetch(`/api/websites/${siteId}`)
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Site not found');
          return data;
        })
        .then(data => setSite(data))
        .catch(err => {
          console.error('Builder fetch error:', err);
          setError(err.message);
        });
    }
  }, [siteId, status, session, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/websites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(site),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaving(false);

      const toastMsg = dirtyFields.size === 1
        ? `${fieldLabels[Array.from(dirtyFields)[0]] || 'Changes'} saved successfully!`
        : `${site?.businessName} saved successfully!`;

      toast.success(toastMsg, {
        description: 'Your changes are now live.',
        icon: <CheckCircle2 size={16} className="text-green-500" />
      });
      setDirtyFields(new Set());
    } catch (_err) {
      setSaving(false);
      toast.error('Failed to save changes', {
        description: 'Please check your connection and try again.'
      });
    }
  };

  const updateContent = (section: string, field: string, value: string) => {
    setDirtyFields(prev => new Set(prev).add(`${section}.${field}`));
    const prevSection = (site!.content[section as keyof SiteContent] ?? {}) as Record<string, unknown>;
    setSite({
      ...site!,
      content: {
        ...site!.content,
        [section]: { ...prevSection, [field]: value }
      } as SiteContent
    });
  };

  const markDirty = (field: string) => {
    setDirtyFields(prev => new Set(prev).add(field));
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: 'New Product',
      price: 'Rs. 1000',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop',
      sizeEU: '',
      sizeINT: '',
      dimensions: { length: '', width: '', height: '' }
    };
    markDirty('products');
    setSite({
      ...site!,
      content: {
        ...site!.content,
        products: [...site!.content.products, newProduct]
      }
    });
  };

  const updateProduct = (index: number, field: string, value: string) => {
    setDirtyFields(prev => new Set(prev).add('products'));
    const updatedProducts = [...site!.content.products];

    if (field === 'sizeEU') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        sizeEU: value,
        sizeINT: value ? EU_TO_INT_SIZE_MAP[value] || '' : '',
      };
    } else if (field === 'sizeINT') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        sizeINT: value,
        sizeEU: value ? INT_TO_EU_SIZE_MAP[value] || '' : '',
      };
    } else if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const parentVal = (updatedProducts[index] as Record<string, Record<string, unknown>>)[parent] ?? {};
      updatedProducts[index] = {
        ...updatedProducts[index],
        [parent]: { ...parentVal, [child]: value }
      };
    } else {
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    }
    setSite({
      ...site!,
      content: { ...site!.content, products: updatedProducts }
    });
  };

  const removeProduct = (index: number) => {
    markDirty('products');
    const newProducts = [...site!.content.products];
    newProducts.splice(index, 1);
    setSite({ ...site!, content: { ...site!.content, products: newProducts } });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      markDirty('products');
      const products = site!.content.products;
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over?.id);

      const newProducts = arrayMove(products, oldIndex, newIndex);
      setSite({
        ...site!,
        content: { ...site!.content, products: newProducts }
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Info size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Could not load builder</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <Link href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!site || !site.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading builder...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Editor Sidebar */}
      <div className="w-full md:w-[400px] bg-white border-r border-gray-200 flex flex-col h-[50vh] md:h-screen">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm relative">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="font-semibold text-gray-800 flex-1 ml-4 truncate">{site.businessName}</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-32">

          {((session?.user as { permissions?: { canChangeTheme?: boolean }; role?: string })?.permissions?.canChangeTheme || (session?.user as { role?: string })?.role === 'SUPER_ADMIN') && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Palette size={18} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Global Aesthetics</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select
                    value={site.fontFamily || 'Inter'}
                    onChange={(e) => {
                      setSite({ ...site, fontFamily: e.target.value });
                      markDirty('fontFamily');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.primaryColor || '#f59e0b'}
                        onChange={(e) => {
                          setSite({ ...site, primaryColor: e.target.value });
                          markDirty('primaryColor');
                        }}
                        className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-xs text-gray-500 uppercase font-mono">{site.primaryColor || '#f59e0b'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Background</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.backgroundColor || '#ffffff'}
                        onChange={(e) => {
                          setSite({ ...site, backgroundColor: e.target.value });
                          markDirty('backgroundColor');
                        }}
                        className="w-8 h-8 rounded cursor-pointer p-0 border border-gray-100"
                      />
                      <span className="text-xs text-gray-500 uppercase font-mono">{site.backgroundColor || '#ffffff'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading Style</label>
                  <select
                    value={site.headingWeight || '800'}
                    onChange={(e) => {
                      setSite({ ...site, headingWeight: e.target.value });
                      markDirty('headingWeight');
                    }}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heading Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.headingColor || '#111827'}
                        onChange={(e) => {
                          setSite({ ...site, headingColor: e.target.value });
                          markDirty('headingColor');
                        }}
                        className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-xs text-gray-500 uppercase font-mono">{site.headingColor || '#111827'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.textColor || '#4b5563'}
                        onChange={(e) => {
                          setSite({ ...site, textColor: e.target.value });
                          markDirty('textColor');
                        }}
                        className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-xs text-gray-500 uppercase font-mono">{site.textColor || '#4b5563'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 2. Brand Identity */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Store size={18} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Brand Identity</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={site.businessName}
                  onChange={(e) => {
                    setSite({ ...site, businessName: e.target.value });
                    markDirty('businessName');
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-gray-800"
                />
              </div>
              <ImageUpload
                value={site.logoUrl || ''}
                onChange={(url) => {
                  setSite({ ...site, logoUrl: url });
                  markDirty('logoUrl');
                }}
                label="Store Logo"
              />
              <ImageUpload
                value={site.faviconUrl || ''}
                onChange={(url) => {
                  setSite({ ...site, faviconUrl: url });
                  markDirty('faviconUrl');
                }}
                label="Favicon"
              />
            </div>
          </section>

          {/* 3. Navigation Bar */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Layout size={18} className="text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Navigation Bar</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navbar Font Family</label>
                <select
                  value={site.navFontFamily || ''}
                  onChange={(e) => {
                    setSite({ ...site, navFontFamily: e.target.value });
                    markDirty('navFontFamily');
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="">Default (Global)</option>
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={site.navBgColor || '#ffffff'}
                      onChange={(e) => {
                        setSite({ ...site, navBgColor: e.target.value });
                        markDirty('navBgColor');
                      }}
                      className="w-8 h-8 rounded cursor-pointer p-0 border border-gray-100"
                    />
                    <span className="text-xs text-gray-500 uppercase font-mono">{site.navBgColor || '#ffffff'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={site.navTextColor || '#4b5563'}
                      onChange={(e) => {
                        setSite({ ...site, navTextColor: e.target.value });
                        markDirty('navTextColor');
                      }}
                      className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                    />
                    <span className="text-xs text-gray-500 uppercase font-mono">{site.navTextColor || '#4b5563'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Style & Animation</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <select
                    value={site.navHeadingWeight || '700'}
                    onChange={(e) => {
                      setSite({ ...site, navHeadingWeight: e.target.value });
                      markDirty('navHeadingWeight');
                    }}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                  <select
                    value={site.navAnimationStyle || 'reveal'}
                    onChange={(e) => {
                      setSite({ ...site, navAnimationStyle: e.target.value });
                      markDirty('navAnimationStyle');
                    }}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    {ANIMATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label.split('(')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Welcome Section */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Layout size={18} className="text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Welcome Section</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Heading</label>
                <input
                  type="text"
                  value={site.content.hero.title}
                  onChange={(e) => updateContent('hero', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Heading</label>
                <textarea
                  value={site.content.hero.subtitle}
                  onChange={(e) => updateContent('hero', 'subtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={2}
                />
              </div>
              <ImageUpload
                value={site.content.hero.imageUrl}
                onChange={(url) => updateContent('hero', 'imageUrl', url)}
                label="Hero Background Image"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Background</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={site.heroBgColor || '#111827'}
                    onChange={(e) => {
                      setSite({ ...site, heroBgColor: e.target.value });
                      markDirty('heroBgColor');
                    }}
                    className="w-8 h-8 rounded cursor-pointer p-0 border border-gray-100"
                  />
                  <span className="text-xs text-gray-400 uppercase font-mono">{site.heroBgColor || '#111827'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center">Section Typography</p>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Font Family</label>
                  <select
                    value={site.heroFontFamily || ''}
                    onChange={(e) => {
                      setSite({ ...site, heroFontFamily: e.target.value });
                      markDirty('heroFontFamily');
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="">Default (Global)</option>
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.value}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Heading Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.heroHeadingColor || '#ffffff'}
                        onChange={(e) => {
                          setSite({ ...site, heroHeadingColor: e.target.value });
                          markDirty('heroHeadingColor');
                        }}
                        className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">{site.heroHeadingColor || '#ffffff'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.heroTextColor || '#e5e7eb'}
                        onChange={(e) => {
                          setSite({ ...site, heroTextColor: e.target.value });
                          markDirty('heroTextColor');
                        }}
                        className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">{site.heroTextColor || '#e5e7eb'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heading Style</label>
                  <select
                    value={site.heroHeadingWeight || '900'}
                    onChange={(e) => {
                      setSite({ ...site, heroHeadingWeight: e.target.value });
                      markDirty('heroHeadingWeight');
                    }}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 5. About Us Section */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Info size={18} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">About Section</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                <textarea
                  value={site.content.about?.description || ''}
                  onChange={(e) => updateContent('about', 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={4}
                />
              </div>
              <ImageUpload
                value={site.content.about?.imageUrl || ''}
                onChange={(url) => updateContent('about', 'imageUrl', url)}
                label="About Image"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Background</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={site.aboutBgColor || '#ffffff'}
                    onChange={(e) => {
                      setSite({ ...site, aboutBgColor: e.target.value });
                      markDirty('aboutBgColor');
                    }}
                    className="w-8 h-8 rounded cursor-pointer p-0 border border-gray-100"
                  />
                  <span className="text-xs text-gray-400 font-mono">{site.aboutBgColor || '#ffffff'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center">Section Typography</p>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Font Family</label>
                  <select
                    value={site.aboutFontFamily || ''}
                    onChange={(e) => {
                      setSite({ ...site, aboutFontFamily: e.target.value });
                      markDirty('aboutFontFamily');
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="">Default (Global)</option>
                    {FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.value}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Heading Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.aboutHeadingColor || '#111827'}
                        onChange={(e) => {
                          setSite({ ...site, aboutHeadingColor: e.target.value });
                          markDirty('aboutHeadingColor');
                        }}
                        className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">{site.aboutHeadingColor || '#111827'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={site.aboutTextColor || '#4b5563'}
                        onChange={(e) => {
                          setSite({ ...site, aboutTextColor: e.target.value });
                          markDirty('aboutTextColor');
                        }}
                        className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">{site.aboutTextColor || '#4b5563'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heading Style</label>
                  <select
                    value={site.aboutHeadingWeight || '800'}
                    onChange={(e) => {
                      setSite({ ...site, aboutHeadingWeight: e.target.value });
                      markDirty('aboutHeadingWeight');
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Product Gallery */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package size={18} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Product Gallery</h3>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-gray-200 rounded-lg p-1 space-x-1">
                  <input
                    type="color"
                    value={site.productsBgColor || '#f9fafb'}
                    onChange={(e) => {
                      setSite({ ...site, productsBgColor: e.target.value });
                      markDirty('productsBgColor');
                    }}
                    className="w-5 h-5 rounded-full cursor-pointer p-0 border-0"
                    title="Section Background"
                  />
                  <input
                    type="color"
                    value={site.productsHeadingColor || '#111827'}
                    onChange={(e) => {
                      setSite({ ...site, productsHeadingColor: e.target.value });
                      markDirty('productsHeadingColor');
                    }}
                    className="w-5 h-5 rounded-full cursor-pointer p-0 border-0"
                    title="Heading Color"
                  />
                </div>
                <button
                  onClick={addProduct}
                  className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-bold shadow-sm hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  + Add Product
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase text-center">Gallery Typography</p>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Font Family</label>
                <select
                  value={site.productsFontFamily || ''}
                  onChange={(e) => {
                    setSite({ ...site, productsFontFamily: e.target.value });
                    markDirty('productsFontFamily');
                  }}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">Default (Global)</option>
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value}>{font.value}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={site.productsTextColor || '#4b5563'}
                      onChange={(e) => {
                        setSite({ ...site, productsTextColor: e.target.value });
                        markDirty('productsTextColor');
                      }}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{site.productsTextColor || '#4b5563'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heading Style</label>
                  <select
                    value={site.productsHeadingWeight || '800'}
                    onChange={(e) => {
                      setSite({ ...site, productsHeadingWeight: e.target.value });
                      markDirty('productsHeadingWeight');
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={site.content.products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {site.content.products.map((product, index) => (
                    <SortableProductItem
                      key={product.id}
                      id={product.id}
                      index={index}
                      product={product}
                      updateProduct={updateProduct}
                      removeProduct={removeProduct}
                    />
                  ))}
                  {site.content.products.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                      Product list is empty.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* 7. Contact & Support */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle size={18} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Contact & Support</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={site.whatsappNumber || ''}
                  onChange={(e) => {
                    setSite({ ...site, whatsappNumber: e.target.value });
                    markDirty('whatsappNumber');
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="98XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Messenger Username</label>
                <input
                  type="text"
                  value={site.messengerUsername || ''}
                  onChange={(e) => {
                    setSite({ ...site, messengerUsername: e.target.value });
                    markDirty('messengerUsername');
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direct Phone</label>
                <input
                  type="text"
                  value={site.directPhone || ''}
                  onChange={(e) => {
                    setSite({ ...site, directPhone: e.target.value });
                    markDirty('directPhone');
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="01-XXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <input
                type="email"
                value={site.businessEmail || ''}
                onChange={(e) => {
                  setSite({ ...site, businessEmail: e.target.value });
                  markDirty('businessEmail');
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="contact@business.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
              <input
                type="text"
                value={site.location || ''}
                onChange={(e) => {
                  setSite({ ...site, location: e.target.value });
                  markDirty('location');
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Kathmandu, Nepal"
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center">Social Media Links</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Facebook</label>
                    <input
                      type="text"
                      value={site.facebookUrl || ''}
                      onChange={(e) => {
                        setSite({ ...site, facebookUrl: e.target.value });
                        markDirty('facebookUrl');
                      }}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Link or username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={site.instagramUrl || ''}
                      onChange={(e) => {
                        setSite({ ...site, instagramUrl: e.target.value });
                        markDirty('instagramUrl');
                      }}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="@username"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">TikTok</label>
                    <input
                      type="text"
                      value={site.tiktokUrl || ''}
                      onChange={(e) => {
                        setSite({ ...site, tiktokUrl: e.target.value });
                        markDirty('tiktokUrl');
                      }}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">X (Twitter)</label>
                    <input
                      type="text"
                      value={site.twitterUrl || ''}
                      onChange={(e) => {
                        setSite({ ...site, twitterUrl: e.target.value });
                        markDirty('twitterUrl');
                      }}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center space-x-2 mb-2">
                <Map size={14} className="text-gray-400" />
                <label className="block text-sm font-medium text-gray-700">Map Integration</label>
              </div>
              <textarea
                value={site.mapConfig?.query || ''}
                onChange={(e) => setSite({ ...site, mapConfig: { ...site.mapConfig, query: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-500 font-mono"
                placeholder={'Paste Google Map Embed Code here...'}
                rows={4}
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Map Zoom ({site.mapConfig?.zoom || 14})</label>
                <input
                  type="range"
                  min="1" max="20"
                  value={site.mapConfig?.zoom || 14}
                  onChange={(e) => {
                    setSite({ ...site, mapConfig: { ...site.mapConfig, zoom: parseInt(e.target.value) || 14 } });
                    markDirty('location');
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center">Footer & Info Styling</p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Footer Font Family</label>
                <select
                  value={site.footerFontFamily || ''}
                  onChange={(e) => {
                    setSite({ ...site, footerFontFamily: e.target.value });
                    markDirty('footerFontFamily');
                  }}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">Default (Global)</option>
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value}>{font.value}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Background</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={site.footerBgColor || '#111827'}
                      onChange={(e) => {
                        setSite({ ...site, footerBgColor: e.target.value });
                        markDirty('footerBgColor');
                      }}
                      className="w-6 h-6 rounded cursor-pointer p-0 border border-gray-100"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{site.footerBgColor || '#111827'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heading Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={site.footerHeadingColor || '#ffffff'}
                      onChange={(e) => {
                        setSite({ ...site, footerHeadingColor: e.target.value });
                        markDirty('footerHeadingColor');
                      }}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{site.footerHeadingColor || '#ffffff'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={site.footerTextColor || '#9ca3af'}
                      onChange={(e) => {
                        setSite({ ...site, footerTextColor: e.target.value });
                        markDirty('footerTextColor');
                      }}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{site.footerTextColor || '#9ca3af'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heading Style</label>
                  <select
                    value={site.footerHeadingWeight || '700'}
                    onChange={(e) => {
                      setSite({ ...site, footerHeadingWeight: e.target.value });
                      markDirty('footerHeadingWeight');
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>



        </div>
      </div>

      {/* Live Preview Area */}
      <div className="flex-1 flex flex-col bg-gray-100 h-[50vh] md:h-screen">
        <div className="p-3 bg-white border-b border-gray-200 flex justify-center space-x-2 hidden md:flex">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Monitor size={18} />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Smartphone size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center p-0 md:p-8">
          <div className={`w-full h-full bg-white shadow-2xl transition-all duration-300 ease-in-out border border-gray-200 overflow-y-auto ${viewMode === 'mobile' ? 'max-w-[375px] max-h-[812px] md:rounded-[2.5rem] md:border-8 md:border-gray-900 shadow-xl' : 'rounded-lg'}`}>
            <PreviewSite site={site} isEditor={true} />
          </div>
        </div>
      </div>

    </div>
  );
}
