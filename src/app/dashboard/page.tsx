"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWebsiteSchema, CreateWebsiteInput } from '@/lib/validations/website';
import { 
  PlusCircle, Link as LinkIcon, Settings, Globe, AlertCircle, 
  Trash2, ToggleLeft, ToggleRight, Palette, LogOut, ShieldCheck,
  LayoutDashboard, Loader2, UserCog, X, Mail, Phone, User as UserIcon, Send, MessageSquare, CheckCircle2
} from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'sonner';
import { THEME_PRESETS, getThemePreset } from '@/lib/theme-presets';

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
  
  // Support Chat SWR
  const { data: supportTicket, mutate: mutateSupport } = useSWR(
    status === 'authenticated' && (session?.user as any).role !== 'SUPER_ADMIN' ? '/api/support' : null, 
    fetcher,
    { refreshInterval: 3000 }
  );

  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSite),
      });
      if (!res.ok) throw new Error('Theme update failed');
      toast.success(`${site.businessName} theme updated`);
    } catch (err: any) {
      mutate();
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = profileFormData.phone.replace(/[^0-9]/g, '');
    if (profileFormData.countryCode === '+977' && phoneDigits.length !== 10) {
      toast.error('Nepal phone numbers must be exactly 10 digits.');
      return;
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      toast.error('Phone number must be between 7 and 15 digits.');
      return;
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
        <header className="flex flex-col gap-4 rounded-[32px] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <LayoutDashboard size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Management Hub</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-3">
            {isSuperAdmin && (
              <button 
                onClick={() => router.push('/super-admin')}
                className="flex items-center bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
              >
                <ShieldCheck size={18} className="mr-2" />
                Super Panel
              </button>
            )}
            <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5 animate-pulse" />
              {session?.user?.email}
            </div>
            <button 
              onClick={openProfileModal}
              className="p-2.5 bg-white border border-indigo-100 text-indigo-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all relative"
              title="Profile Settings"
            >
              <UserCog size={20} />
              {userProfile?.pendingProfileChanges && Object.keys(userProfile.pendingProfileChanges).length > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white"></span>
                </span>
              )}
            </button>
            <button 
              onClick={() => signOut()}
              className="p-2.5 bg-white border border-red-100 text-red-500 rounded-2xl hover:bg-red-50 transition-all"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

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
              <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-6 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10" />
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/10 rounded-xl text-white">
                        <Palette size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-white">Theme Rollout Manager</h3>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-[24px]">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Queue</p>
                        <p className="text-2xl font-black text-white">{selectedWebsiteIds.length}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-4 rounded-[24px]">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Active Preset</p>
                        <p className="text-2xl font-black text-white">{activePreset.label}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 xl:w-80">
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-sm font-bold text-white outline-none"
                    >
                      {THEME_PRESETS.map((theme) => (
                        <option key={theme.value} value={theme.value} className="text-slate-900">{theme.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <button onClick={toggleSelectAllWebsites} className="flex-1 py-3 text-xs font-bold text-white border border-white/20 rounded-2xl hover:bg-white/5 transition-all">
                        {selectedWebsiteIds.length === websites.length ? 'Reset' : 'Select All'}
                      </button>
                      <button onClick={handleApplyThemeToSelected} className="flex-[2] py-3 text-xs font-bold bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all">
                        Apply Selection
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
              <div className="grid gap-6">
                {websites.map((site: any) => (
                  <div key={site._id} className="group bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-center gap-5">
                        {canChangeTheme && (
                          <input
                            type="checkbox"
                            checked={selectedWebsiteIds.includes(site._id)}
                            onChange={() => toggleWebsiteSelection(site._id)}
                            className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{site.businessName}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${site.isActive === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {site.isActive === false ? 'Inactive' : 'Live'}
                            </span>
                            {canChangeTheme && (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                                {getThemePreset(site.theme).label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm font-medium text-slate-500">
                            <LinkIcon size={14} className="mr-2 opacity-50" />
                            merobusiness.com/{site.slug}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleToggleActive(site._id, site.isActive !== false)}
                            className={`p-3 rounded-2xl transition-all ${site.isActive === false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                            title={site.isActive === false ? 'Activate' : 'Deactivate'}
                          >
                            {site.isActive === false ? <ToggleLeft size={24} /> : <ToggleRight size={24} />}
                          </button>
                        )}
                        <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="flex items-center bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">
                          <Globe size={18} className="mr-2" />
                          View
                        </a>
                        <Link href={`/dashboard/${site._id}`} className="flex items-center bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                          <Settings size={18} className="mr-2" />
                          Build
                        </Link>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, id: site._id, name: site.businessName })}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
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
                  {supportTicket?.status === 'RESOLVED' && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Resolved
                    </span>
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
            
            <form onSubmit={handleProfileSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
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
                  <div className="relative flex">
                    <select 
                      value={profileFormData.countryCode}
                      onChange={e => setProfileFormData({...profileFormData, countryCode: e.target.value})}
                      className="absolute inset-y-0 left-0 pl-3 pr-2 bg-slate-100 border border-slate-200 border-r-0 rounded-l-2xl text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 z-10 text-[11px] font-bold appearance-none w-[70px] cursor-pointer"
                    >
                      <option value="+977">+977</option>
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+61">+61</option>
                      <option value="+971">+971</option>
                      <option value="+974">+974</option>
                    </select>
                    <input 
                      type="tel" 
                      value={profileFormData.phone} 
                      onChange={e => setProfileFormData({...profileFormData, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                      className="block w-full pl-[78px] pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm" 
                      placeholder="98XXXXXXXX" 
                    />
                  </div>
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
