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
  LayoutDashboard, Loader2
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
  
  const [submitError, setSubmitError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0].value);
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

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
              onClick={() => signOut()}
              className="p-2.5 bg-white border border-red-100 text-red-500 rounded-2xl hover:bg-red-50 transition-all"
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

          <div className={isSuperAdmin ? "md:col-span-2 space-y-6" : "md:col-span-3 space-y-6"}>
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
        </main>
      </div>
    </div>
  );
}
