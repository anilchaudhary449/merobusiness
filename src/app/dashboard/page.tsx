"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWebsiteSchema, CreateWebsiteInput } from '@/lib/validations/website';
import { 
  PlusCircle, Link as LinkIcon, Settings, Globe, AlertCircle, 
  Trash2, ToggleLeft, ToggleRight, Palette, LogOut, ShieldCheck,
  LayoutDashboard, Loader2, UserCog, X, Mail, Phone, User as UserIcon, Send, MessageSquare, CheckCircle2, XCircle, ShoppingCart, Users, ChevronRight
} from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'sonner';
import { THEME_PRESETS, getThemePreset } from '@/lib/theme-presets';
import { PREPARED_QUESTIONS, FAQ_TRIGGER_PREFIX } from '@/lib/constants/support';
import { COUNTRIES } from '@/lib/constants/countries';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { CountrySelector } from '@/components/CountrySelector';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'An error occurred while fetching the data.');
  return data;
});

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: websites, error, mutate, isLoading } = useSWR('/api/websites', fetcher);
  const { data: userProfile, mutate: mutateUserProfile } = useSWR('/api/admin/profile', fetcher);
  const { data: superAdminContact } = useSWR((status === 'authenticated' && (session?.user as any).role !== 'SUPER_ADMIN') ? '/api/super-admin/contact' : null, fetcher);
  
  // CRM & Orders
  const { data: customersData, isLoading: isLoadingCustomers } = useSWR('/api/admin/my-customers', fetcher);
  const { data: ordersData, isLoading: isLoadingOrders, mutate: mutateOrders } = useSWR('/api/admin/my-orders', fetcher);

  const [activeTab, setActiveTab] = useState<'stores' | 'customers' | 'orders'>('stores');
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);
  
  // Support Chat SWR
  const { data: supportTicket, mutate: mutateSupport } = useSWR(
    status === 'authenticated' && (session?.user as any).role !== 'SUPER_ADMIN' ? '/api/support' : null, 
    fetcher,
    { refreshInterval: 3000 }
  );

  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<{ isValid: boolean; message: string; show: boolean }>({
    isValid: false,
    message: '',
    show: false
  });
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    countryCode: '+977',
    phone: '',
    panNumber: '',
    businessName: '',
    email: ''
  });
  
  const [submitError, setSubmitError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0].value);
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<string | null>(null);

  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN';
  const canChangeTheme = (session?.user as any)?.permissions?.canChangeTheme || isSuperAdmin;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWebsiteInput>({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      businessName: '',
      slug: '',
    },
  });

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('businessName', val, { shouldValidate: true });
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setValue('slug', generatedSlug, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateWebsiteInput) => {
    setSubmitError('');
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create website');
      }

      mutate();
      reset();
      toast.success(`${data.businessName} created successfully!`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete website');
      mutate();
      toast.success(`${name} deleted permanently`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    mutate(
      websites.map((s: any) => s._id === id ? { ...s, isActive: !currentStatus } : s),
      false
    );
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Toggle failed');
      const { isActive } = await res.json();
      toast.success(isActive ? 'Store is Live! 🟢' : 'Store paused 🔴');
    } catch (err: any) {
      mutate();
      toast.error(err.message);
    }
  };

  const handleApplyTheme = async (site: any, themeValue: string) => {
    if (!canChangeTheme) return;
    const preset = getThemePreset(themeValue);
    const updatedSite = { ...site, ...preset.config, theme: preset.value };

    mutate(websites.map((s: any) => (s._id === site._id ? updatedSite : s)), false);

    try {
      const res = await fetch(`/api/websites/${site._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: updatedSite.theme, ...updatedSite }),
      });
      if (!res.ok) throw new Error('Theme update failed');
      toast.success('Theme applied to store!');
    } catch (err: any) {
      mutate();
      toast.error(err.message);
    }
  };

  const updateOrderStatus = async (orderId: string, field: 'status' | 'paymentMethod', value: string) => {
    // Optimistic update
    mutateOrders(
      { ...ordersData, orders: ordersData.orders.map((o: any) => o._id === orderId ? { ...o, [field]: value } : o) },
      false
    );
    try {
      const res = await fetch(`/api/admin/my-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Failed to update order');
      toast.success(`Order updated successfully`);
      mutateOrders();
    } catch (err: any) {
      mutateOrders();
      toast.error(err.message);
    }
  };

  const toggleWebsiteSelection = (websiteId: string) => {
    setSelectedWebsiteIds((current) =>
      current.includes(websiteId) ? current.filter((id) => id !== websiteId) : [...current, websiteId]
    );
  };

  const toggleSelectAllWebsites = () => {
    if (!websites?.length) return;
    setSelectedWebsiteIds((current) =>
      current.length === websites.length ? [] : websites.map((site: any) => site._id)
    );
  };

  const handleApplyThemeToSelected = async () => {
    if (!selectedWebsiteIds.length) return;
    const selectedSites = websites.filter((site: any) => selectedWebsiteIds.includes(site._id));
    await Promise.all(selectedSites.map((site: any) => handleApplyTheme(site, selectedTheme)));
    setSelectedWebsiteIds([]);
  };

  const openProfileModal = () => {
    if (userProfile) {
      let code = '+977';
      let phoneNum = userProfile.phone || '';
      
      if (phoneNum.startsWith('+')) {
         const parts = phoneNum.split(' ');
         if (parts.length > 1) {
            code = parts[0];
            phoneNum = parts.slice(1).join(' ');
         }
      }

      setProfileFormData({
        name: userProfile.name || '',
        countryCode: code,
        phone: phoneNum,
        panNumber: userProfile.panNumber || '',
        businessName: userProfile.businessName || '',
        email: userProfile.email || ''
      });
    }
    setIsProfileModalOpen(true);
  };

  // Real-time phone validation for profile
  useEffect(() => {
    const phoneDigits = profileFormData.phone.replace(/[^0-9]/g, '');
    if (!phoneDigits) {
      setPhoneStatus({ isValid: false, message: '', show: false });
      return;
    }

    const selectedCountry = COUNTRIES.find(c => c.dial_code === profileFormData.countryCode);
    if (selectedCountry) {
      const fullNumber = `${profileFormData.countryCode}${phoneDigits}`;
      const isValid = isValidPhoneNumber(fullNumber, selectedCountry.code as any);
      setPhoneStatus({
        isValid,
        message: isValid ? `Perfect format for ${selectedCountry.name}` : `Invalid for ${selectedCountry.name}`,
        show: true
      });
    }
  }, [profileFormData.phone, profileFormData.countryCode]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = profileFormData.phone.replace(/[^0-9]/g, '');
    const selectedCountry = COUNTRIES.find(c => c.dial_code === profileFormData.countryCode);
    
    if (selectedCountry) {
      const fullNumber = `${profileFormData.countryCode}${phoneDigits}`;
      if (!isValidPhoneNumber(fullNumber, selectedCountry.code as any)) {
        toast.error(`Invalid phone number format for ${selectedCountry.name}.`);
        return;
      }
    } else {
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        toast.error('Phone number must be between 7 and 15 digits.');
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const payload = { 
        ...profileFormData, 
        phone: `${profileFormData.countryCode} ${phoneDigits}` 
      };

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit profile changes');
      
      toast.success(data.message || 'Profile changes submitted successfully. They will be applied once approved by a Super Administrator.');
      mutateUserProfile();
      setIsProfileModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatMessage.trim() }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setChatMessage('');
      mutateSupport();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFAQClick = async (faq: typeof PREPARED_QUESTIONS[0]) => {
    setActiveFAQ(faq.id);
    // Automatically send the question to super admin as requested
    if (isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${FAQ_TRIGGER_PREFIX}${faq.id}` }),
      });
      if (!res.ok) throw new Error('Failed to raise ticket');
      mutateSupport();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  const activePreset = getThemePreset(selectedTheme);
  const totalCount = websites?.length ?? 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] p-4 md:p-10">
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => handleDelete(deleteModal.id, deleteModal.name)}
        title="Delete Website"
        message={`Are you sure you want to delete "${deleteModal.name}"?`}
        confirmText="Yes, Delete"
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-3 rounded-[24px] sm:rounded-[32px] border border-white bg-white/70 p-4 sm:p-6 shadow-xl backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <LayoutDashboard size={14} className="sm:size-4" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">Management Hub</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {isSuperAdmin && (
                <button 
                  onClick={() => router.push('/super-admin')}
                  className="flex items-center bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  <ShieldCheck size={16} className="sm:mr-2" />
                  <span className="hidden xs:inline">Super Panel</span>
                  <span className="xs:hidden">Super</span>
                </button>
              )}
              <div className="hidden md:flex px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5 animate-pulse" />
                {session?.user?.email}
              </div>
              <button 
                onClick={openProfileModal}
                className="p-2 sm:p-2.5 bg-white border border-indigo-100 text-indigo-500 rounded-xl sm:rounded-2xl hover:bg-indigo-50 transition-all relative touch-target"
                title="Profile Settings"
              >
                <UserCog size={18} className="sm:size-5" />
                {userProfile?.pendingProfileChanges && Object.keys(userProfile.pendingProfileChanges).length > 0 && (
                  <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border-2 border-white"></span>
                  </span>
                )}
              </button>
              <button 
                onClick={() => signOut()}
                className="p-2 sm:p-2.5 bg-white border border-red-100 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-50 transition-all touch-target"
                title="Sign Out"
              >
                <LogOut size={18} className="sm:size-5" />
              </button>
            </div>
          </div>
        </header>

        {/* --- Tabs --- */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button 
            onClick={() => setActiveTab('stores')}
            className={`shrink-0 px-4 sm:px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'stores' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center"><Globe size={16} className="mr-2" /> Stores &amp; Sites</span>
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={`shrink-0 px-4 sm:px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'customers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center"><Users size={16} className="mr-2" /> Customers</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`shrink-0 px-4 sm:px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center"><ShoppingCart size={16} className="mr-2" /> Orders Track</span>
          </button>
        </div>

        {activeTab === 'stores' && (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Create Site Section - Only for Super Admins */}
          {isSuperAdmin && (
            <div className="md:col-span-1 rounded-[32px] border border-white bg-white/80 p-6 shadow-lg backdrop-blur-xl h-fit">
              <h2 className="text-xl font-bold mb-6 flex items-center text-slate-900">
                <PlusCircle className="mr-3 text-indigo-500" />
                New Website
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Business Name</label>
                  <input
                    {...register('businessName')}
                    onChange={handleBusinessNameChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="e.g. Nepal Crafts"
                  />
                  {errors.businessName && <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.businessName.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Live URL</label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 text-slate-500 px-4 py-3 rounded-l-2xl border border-r-0 border-slate-100 text-xs font-bold">merobusiness.com/</span>
                    <input
                      {...register('slug')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-r-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      placeholder="nepal-crafts"
                    />
                  </div>
                </div>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing...' : 'Provision Website'}
                </button>
              </form>
            </div>
          )}
          <div className={isSuperAdmin ? "md:col-span-2 space-y-6" : "md:col-span-2 space-y-6"}>
            {/* Bulk Theme Manager - Only if permitted */}
            {canChangeTheme && !!websites?.length && (
              <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-5 sm:p-6 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10" />
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl text-white shrink-0">
                        <Palette size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-white">Theme Rollout</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl sm:rounded-[24px]">
                        <p className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Queue</p>
                        <p className="text-xl sm:text-2xl font-black text-white">{selectedWebsiteIds.length}</p>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl sm:rounded-[24px]">
                        <p className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Theme</p>
                        <p className="text-xl sm:text-2xl font-black text-white truncate">{activePreset.label.split(' ')[0]}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 lg:w-72">
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {THEME_PRESETS.map((theme) => (
                        <option key={theme.value} value={theme.value} className="text-slate-900">{theme.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={toggleSelectAllWebsites} className="flex-1 py-3 text-xs font-bold text-white border border-white/20 rounded-xl sm:rounded-2xl hover:bg-white/5 transition-all">
                        {selectedWebsiteIds.length === (websites?.length || 0) ? 'Reset' : 'All'}
                      </button>
                      <button onClick={handleApplyThemeToSelected} className="flex-[2] py-3 text-xs font-bold bg-white text-slate-900 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-all">
                        Apply Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!websites || websites.length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] border border-slate-100 text-center shadow-sm">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Globe size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Websites Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">You haven't been assigned any websites yet. Please contact the administrator.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {websites.map((site: any) => (
                  <div key={site._id} className="group bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        {canChangeTheme && (
                          <input
                            type="checkbox"
                            checked={selectedWebsiteIds.includes(site._id)}
                            onChange={() => toggleWebsiteSelection(site._id)}
                            className="w-5 h-5 mt-1 rounded-lg border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{site.businessName}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${site.isActive === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {site.isActive === false ? 'Inactive' : 'Live'}
                            </span>
                            {canChangeTheme && (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                                {getThemePreset(site.theme).label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm font-medium text-slate-500 truncate">
                            <LinkIcon size={14} className="mr-2 opacity-50 shrink-0" />
                            <span className="truncate">merobusiness.com/{site.slug}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleToggleActive(site._id, site.isActive !== false)}
                            className={`p-3 rounded-2xl transition-all touch-target ${site.isActive === false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                            title={site.isActive === false ? 'Activate' : 'Deactivate'}
                          >
                            {site.isActive === false ? <ToggleLeft size={24} /> : <ToggleRight size={24} />}
                          </button>
                        )}
                        <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="flex items-center bg-slate-100 text-slate-700 px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">
                          <Globe size={16} className="mr-2" />
                          View
                        </a>
                        <Link href={`/dashboard/${site._id}`} className="flex items-center bg-indigo-600 text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                          <Settings size={16} className="mr-2" />
                          Build
                        </Link>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, id: site._id, name: site.businessName })}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all touch-target ml-auto"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isSuperAdmin && (
            <div className="md:col-span-1">
              <div className="rounded-[32px] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-xl flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-indigo-600">
                    <MessageSquare size={16} />
                    Live Support
                  </h3>
                  {supportTicket?.status && supportTicket.status !== 'OPEN' && (
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                      supportTicket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      supportTicket.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      supportTicket.status === 'BACKLOG' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {supportTicket.status === 'RESOLVED' && <CheckCircle2 size={10} />}
                      {supportTicket.status}
                    </span>
                  )}
                </div>

                {/* FAQ / Prepared Questions */}
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Support</p>
                  <div className="flex flex-wrap gap-2">
                    {PREPARED_QUESTIONS.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => handleFAQClick(faq)}
                        className={`text-[11px] font-bold px-3 py-2 rounded-xl border transition-all ${
                          activeFAQ === faq.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                        }`}
                      >
                        {faq.q}
                      </button>
                    ))}
                  </div>
                  {activeFAQ && (
                    <div className="mt-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-[20px] animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">MeroBusiness Assistant</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {PREPARED_QUESTIONS.find(f => f.id === activeFAQ)?.a}
                      </p>
                      <p className="text-[9px] text-indigo-400 mt-2 italic">* Ticket raised automatically. We will reply soon if you have more questions.</p>
                    </div>
                  )}
                </div>
                
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
                  {!supportTicket || supportTicket.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                        <MessageSquare size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start a conversation</p>
                      <p className="text-[11px] text-slate-500">Need help? Send a message to our Super-Admins and we'll reply shortly.</p>
                    </div>
                  ) : (
                    supportTicket.messages.map((msg: any, idx: number) => {
                      const isMe = msg.senderId === (session?.user as any).id;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-[20px] p-3 text-sm shadow-sm ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider opacity-60 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="relative mt-auto">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                  <button
                    disabled={isSendingMessage || !chatMessage.trim()}
                    type="submit"
                    className="absolute right-1.5 top-1.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-slate-300"
                  >
                    {isSendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>

                {/* Super Admin Info if available */}
                {superAdminContact && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Online</span>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${superAdminContact.phone}`} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Phone size={14} />
                      </a>
                      <a href={`mailto:${superAdminContact.email}`} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Mail size={14} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-xl p-4 sm:p-8 border border-white">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Store Customers</h2>
            </div>
            
            {isLoadingCustomers ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : !customersData?.customers?.length ? (
              <div className="py-12 text-center text-slate-500">No customers registered for your stores yet.</div>
            ) : (
              <>
                {/* Mobile cards (< md) */}
                <div className="md:hidden space-y-3">
                  {customersData.customers.map((c: any) => (
                    <div key={c._id} className="border border-slate-100 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800">{c.name || 'N/A'}</p>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs">{c.orders?.length || 0} Orders</span>
                      </div>
                      <p className="text-sm text-slate-500 font-mono truncate">{c.email}</p>
                      {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                      {c.deliveryAddress && <p className="text-xs text-slate-400 truncate">{c.deliveryAddress}</p>}
                    </div>
                  ))}
                </div>
                {/* Desktop table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-4 font-bold">Customer Name</th>
                        <th className="py-4 px-4 font-bold">Email</th>
                        <th className="py-4 px-4 font-bold">Phone</th>
                        <th className="py-4 px-4 font-bold">Delivery Location</th>
                        <th className="py-4 px-4 font-bold">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {customersData.customers.map((c: any) => {
                        const isExpanded = expandedCustomerIds.includes(c._id);
                        return (
                          <React.Fragment key={c._id}>
                            <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedCustomerIds(prev => isExpanded ? prev.filter(id => id !== c._id) : [...prev, c._id])}>
                              <td className="py-4 px-4 font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}><ChevronRight size={16} className="text-slate-400" /></div>
                                  {c.name || 'N/A'}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-600 font-medium">{c.email}</td>
                              <td className="py-4 px-4 text-slate-600">{c.phone || '-'}</td>
                              <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={c.deliveryAddress}>
                                {c.deliveryAddress || '-'}
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs">{c.orders?.length || 0} Orders</span>
                              </td>
                            </tr>
                            {isExpanded && c.orders?.length > 0 && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={5} className="py-4 px-10">
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order History</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {c.orders.map((o: any) => (
                                        <div key={o._id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                                          {o.product?.imageUrl ? (
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-sm">
                                              <Image 
                                                src={o.product.imageUrl} 
                                                alt="img" 
                                                fill
                                                className="object-cover" 
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{o.product?.name || 'Unknown Item'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(o.createdAt).toLocaleDateString()} • Qty: {o.product?.quantity || 1}</p>
                                            {o.paymentMethod === 'ONLINE_PAYMENT' && (
                                              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded font-bold uppercase tracking-wider mt-1 inline-block">Online</span>
                                            )}
                                          </div>
                                          <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-bold text-emerald-600">{o.product?.price}</span>
                                            {o.paymentReceipt && (
                                              <a href={o.paymentReceipt} target="_blank" rel="noreferrer" className="text-[8px] text-indigo-500 underline font-bold">Receipt</a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-xl p-4 sm:p-8 border border-white">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShoppingCart size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Tracked Orders</h2>
            </div>
            
            {isLoadingOrders ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : !ordersData?.orders?.length ? (
              <div className="py-12 text-center text-slate-500">No orders tracked for your stores yet.</div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {ordersData.orders.map((o: any) => (
                    <div key={o._id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {o.product?.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                            <Image 
                              src={o.product.imageUrl} 
                              alt="img" 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{o.product?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()} · Qty {o.product?.quantity || 1}</p>
                        </div>
                        <span className="text-sm font-black text-emerald-600 shrink-0">{o.product?.price}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-700 truncate">{o.customerId?.name || 'Guest'}</p>
                        <div className="flex flex-col items-end gap-2">
                           <div className="flex gap-2">
                             <select
                               value={o.paymentMethod || 'COD'}
                               onChange={(e) => updateOrderStatus(o._id, 'paymentMethod', e.target.value)}
                               className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 outline-none w-24"
                             >
                               <option value="COD">COD</option>
                               <option value="ONLINE_PAYMENT">Online</option>
                             </select>
                             <select
                               value={o.status || 'PLACED'}
                               onChange={(e) => updateOrderStatus(o._id, 'status', e.target.value)}
                               className={`border text-[10px] font-bold rounded-lg px-2 py-1 outline-none w-24 ${
                                 o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                 o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                 o.status === 'SHIPPED' || o.status === 'ON_THE_WAY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                 'bg-amber-50 text-amber-700 border-amber-200'
                               }`}
                             >
                               <option value="PLACED">Placed</option>
                               <option value="CONFIRMED">Confirmed</option>
                               <option value="PACKED">Packed</option>
                               <option value="PICKED">Picked</option>
                               <option value="SHIPPED">Shipped</option>
                               <option value="ON_THE_WAY">On The Way</option>
                               <option value="DELIVERED">Delivered</option>
                               <option value="CANCELLED">Cancelled</option>
                             </select>
                           </div>
                           {o.paymentMethod === 'ONLINE_PAYMENT' && o.paymentReceipt && (
                             <a href={o.paymentReceipt} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-bold underline flex items-center gap-1">
                               <LinkIcon size={10} /> View Payment Receipt
                             </a>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-4 font-bold">Date &amp; Time</th>
                        <th className="py-4 px-4 font-bold">Product Ordered</th>
                        <th className="py-4 px-4 font-bold text-right">Price</th>
                        <th className="py-4 px-4 font-bold">Customer</th>
                        <th className="py-4 px-4 font-bold">Payment</th>
                        <th className="py-4 px-4 font-bold text-center">Receipt</th>
                        <th className="py-4 px-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {ordersData.orders.map((o: any) => (
                        <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {o.product?.imageUrl ? (
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                                  <Image 
                                    src={o.product.imageUrl} 
                                    alt="img" 
                                    fill
                                    className="object-cover" 
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200"></div>
                              )}
                              <div>
                                 <span className="font-bold text-slate-800 line-clamp-1">{o.product?.name || 'Unknown Item'}</span>
                                 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block pr-1"><span className="text-slate-300">QTY:</span> {o.product?.quantity || 1} • {o.method}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-xs">
                              {o.product?.price || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-800 max-w-[120px] truncate">{o.customerId?.name || 'Guest'}</p>
                            <p className="text-[10px] text-slate-500 font-medium max-w-[120px] truncate" title={o.customerId?.email}>{o.customerId?.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={o.paymentMethod || 'COD'}
                              onChange={(e) => updateOrderStatus(o._id, 'paymentMethod', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-28"
                            >
                              <option value="COD">Cash on Delivery</option>
                              <option value="ONLINE_PAYMENT">Online Payment</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {o.paymentMethod === 'ONLINE_PAYMENT' && o.paymentReceipt ? (
                              <a href={o.paymentReceipt} target="_blank" rel="noreferrer" className="inline-block p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all">
                                <div className="relative w-8 h-8 rounded overflow-hidden">
                                  <Image src={o.paymentReceipt} alt="receipt" fill className="object-cover" />
                                </div>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={o.status || 'PLACED'}
                              onChange={(e) => updateOrderStatus(o._id, 'status', e.target.value)}
                              className={`border text-[11px] font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 w-28 cursor-pointer ${
                                o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                o.status === 'SHIPPED' || o.status === 'ON_THE_WAY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="PLACED">Placed</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PACKED">Packed</option>
                              <option value="PICKED">Picked</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="ON_THE_WAY">On The Way</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Admin Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <UserCog className="mr-3 text-indigo-500" size={24} />
                Profile Settings
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X /></button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {userProfile?.pendingProfileChanges && Object.keys(userProfile.pendingProfileChanges).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">Changes Pending Approval</h4>
                    <p className="text-xs text-amber-700 mt-1 font-medium">You have submitted profile updates that are currently waiting for Super-Admin review. You can override them by submitting new changes.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 ml-1">Display Name</label>
                    <input 
                      type="text" 
                      value={profileFormData.name} 
                      onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} 
                      disabled={isSuperAdmin}
                      className={`w-full px-4 py-3 border rounded-2xl outline-none transition-all font-medium text-sm ${isSuperAdmin ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} 
                      placeholder="Your Name" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 ml-1">Role Type</label>
                    <input 
                      type="text" 
                      value={isSuperAdmin ? "Super Administrator" : "Store Administrator"} 
                      disabled 
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-indigo-600 font-bold text-sm cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={profileFormData.email} 
                    onChange={e => setProfileFormData({...profileFormData, email: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" 
                    placeholder="email@example.com" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 ml-1">Phone Number</label>
                  <div className="relative flex gap-3">
                    <div className="w-24 shrink-0">
                      <CountrySelector 
                        value={profileFormData.countryCode}
                        onChange={(code) => setProfileFormData({...profileFormData, countryCode: code})}
                      />
                    </div>
                    <input 
                      type="tel" 
                      value={profileFormData.phone} 
                      onChange={e => setProfileFormData({...profileFormData, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" 
                      placeholder="98XXXXXXXX" 
                    />
                  </div>
                  {phoneStatus.show && (
                    <div className={`mt-2 ml-1 flex items-center gap-2 text-[10px] font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${phoneStatus.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {phoneStatus.isValid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <img 
                        src={`https://flagcdn.com/w40/${COUNTRIES.find(c => c.dial_code === profileFormData.countryCode)?.code.toLowerCase()}.png`} 
                        className="w-4 h-auto rounded-[2px] shadow-sm ml-1"
                        alt="country flag"
                      />
                      <span className="tracking-widest uppercase">{phoneStatus.message}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 ml-1">PAN Number</label>
                  <input type="text" value={profileFormData.panNumber} onChange={e => setProfileFormData({...profileFormData, panNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" placeholder="PAN Number" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 ml-1">Business Name</label>
                  <input 
                    type="text" 
                    value={profileFormData.businessName} 
                    onChange={e => setProfileFormData({...profileFormData, businessName: e.target.value})} 
                    disabled={isSuperAdmin}
                    className={`w-full px-4 py-3 border rounded-2xl outline-none transition-all font-medium text-sm ${isSuperAdmin ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} 
                    placeholder="Business Name" 
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-[1] px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={isSavingProfile} className="flex-[2] px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : (isSuperAdmin ? 'Apply Profile Updates' : 'Submit Changes for Approval')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
