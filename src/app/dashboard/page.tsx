"use client";

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWebsiteSchema, CreateWebsiteInput } from '@/lib/validations/website';
import { PlusCircle, Link as LinkIcon, Settings, Globe, AlertCircle, Trash2, ToggleLeft, ToggleRight, Palette } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'sonner';
import { THEME_PRESETS, getThemePreset } from '@/lib/theme-presets';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'An error occurred while fetching the data.');
  return data;
});

export default function Dashboard() {
  const { data: websites, error, mutate, isLoading } = useSWR('/api/websites', fetcher);
  const [submitError, setSubmitError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0].value);
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const {
    register,
    handleSubmit,
    watch,
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

  // Auto-generate slug when businessName changes
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('businessName', val, { shouldValidate: true });
    
    // Auto-generate a basic slug
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

      // Refresh the websites list instantly
      mutate();
      reset();
      toast.success(`${data.businessName} created successfully!`, {
        description: `Ready for editing.`
      });
    } catch (err: any) {
      toast.error('Failed to create website', {
        description: err.message
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete website');
      mutate();
      toast.success(`${name} deleted permanently`, {
        icon: <Trash2 size={16} />,
      });
    } catch (err: any) {
      toast.error('Error deleting site', {
        description: err.message
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistically update the list immediately
    mutate(
      websites.map((s: any) => s._id === id ? { ...s, isActive: !currentStatus } : s),
      false
    );
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Toggle failed');
      const { isActive } = await res.json();
      toast.success(isActive ? 'Store is now Live! 🟢' : 'Store paused 🔴', {
        description: isActive ? 'Customers can visit your website.' : 'Your website is temporarily hidden.',
      });
    } catch (err: any) {
      // Revert optimistic update on failure
      mutate();
      toast.error('Failed to update status', { description: err.message });
    }
  };

  const handleApplyTheme = async (site: any, themeValue: string) => {
    const preset = getThemePreset(themeValue);
    const updatedSite = {
      ...site,
      ...preset.config,
      theme: preset.value,
    };

    mutate(
      websites.map((s: any) => (s._id === site._id ? updatedSite : s)),
      false
    );

    try {
      const res = await fetch(`/api/websites/${site._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSite),
      });
      if (!res.ok) throw new Error('Theme update failed');

      toast.success(`${site.businessName} theme updated`, {
        description: `${preset.label} is now active.`,
      });
    } catch (err: any) {
      mutate();
      toast.error('Failed to update theme', {
        description: err.message,
      });
    }
  };

  const toggleWebsiteSelection = (websiteId: string) => {
    setSelectedWebsiteIds((current) =>
      current.includes(websiteId)
        ? current.filter((id) => id !== websiteId)
        : [...current, websiteId]
    );
  };

  const toggleSelectAllWebsites = () => {
    if (!websites?.length) return;

    setSelectedWebsiteIds((current) =>
      current.length === websites.length ? [] : websites.map((site: any) => site._id)
    );
  };

  const handleApplyThemeToSelected = async () => {
    if (!selectedWebsiteIds.length) {
      toast.error('No websites selected', {
        description: 'Select at least one website to apply a theme.',
      });
      return;
    }

    const selectedSites = websites.filter((site: any) => selectedWebsiteIds.includes(site._id));
    await Promise.all(selectedSites.map((site: any) => handleApplyTheme(site, selectedTheme)));
    setSelectedWebsiteIds([]);
  };

  const activePreset = getThemePreset(selectedTheme);
  const selectedCount = selectedWebsiteIds.length;
  const totalCount = websites?.length ?? 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] p-4 md:p-10">
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => handleDelete(deleteModal.id, deleteModal.name)}
        title="Delete Website"
        message={`Are you sure you want to delete "${deleteModal.name}"? All content and products associated with this site will be permanently removed.`}
        confirmText="Yes, Delete Site"
      />
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">Operations Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage storefront availability, theme rollout, and website administration from one unified control surface.
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 font-medium text-sm text-indigo-700 xl:self-auto">
            <span>User: test@example.com</span>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1 rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <PlusCircle className="mr-2 text-indigo-500" />
              Create New Site
            </h2>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  {...register('businessName')}
                  onChange={handleBusinessNameChange}
                  className={`w-full px-4 py-2 border rounded-xl outline-none transition-all ${errors.businessName ? 'border-red-300 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-indigo-500'}`}
                  placeholder="e.g. DR Collections"
                />
                {errors.businessName && <p className="mt-1 text-sm text-red-500">{errors.businessName.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 text-gray-500 px-3 py-2 rounded-l-xl border border-r-0 border-gray-200 text-sm">merobusiness.com/</span>
                  <input
                    {...register('slug')}
                    className={`w-full px-3 py-2 border rounded-r-xl outline-none transition-all ${errors.slug ? 'border-red-300 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-indigo-500'}`}
                    placeholder="dr-collections"
                  />
                </div>
                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
              </div>
              
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-md mt-4"
              >
                {isSubmitting ? 'Creating...' : 'Create Website'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Your Websites</h2>
              <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                {totalCount} stores
              </div>
            </div>
            {!!websites?.length && (
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_55%,_#312e81_100%)] p-5 text-white">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                        <Palette size={16} />
                      </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Bulk Theme Manager</p>
                          <p className="text-xs text-slate-300">
                          Select websites with the checkbox, then apply one theme to all selected stores.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Selected</p>
                          <p className="mt-1 text-lg font-semibold text-white">{selectedCount}</p>
                          <p className="text-xs text-slate-300">websites in current rollout</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Preset</p>
                          <p className="mt-1 text-lg font-semibold text-white">{activePreset.label}</p>
                          <p className="text-xs text-slate-300 truncate">{activePreset.config.fontFamily} • {activePreset.config.animationStyle}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Preview</p>
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {[activePreset.config.primaryColor, activePreset.config.heroBgColor, activePreset.config.productsBgColor, activePreset.config.footerBgColor].map((color, index) => (
                              <span
                                key={`active-preset-${index}-${color}`}
                                className="h-7 rounded-xl ring-1 ring-white/10"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 xl:min-w-[330px]">
                      <select
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none backdrop-blur transition focus:border-white/30 focus:ring-2 focus:ring-indigo-300"
                      >
                        {THEME_PRESETS.map((theme) => (
                          <option key={theme.value} value={theme.value} className="text-slate-900">
                            {theme.label}
                          </option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={toggleSelectAllWebsites}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          {selectedWebsiteIds.length === websites.length ? 'Clear Selection' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyThemeToSelected}
                          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50"
                        >
                          Apply Theme
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3 text-xs text-slate-500">
                  {activePreset.description}
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="text-gray-500 animate-pulse">Loading websites...</div>
            ) : error ? (
              <div className="bg-red-50 p-10 rounded-2xl border border-red-100 text-center text-red-600">
                {error.message || 'Failed to load websites.'}
              </div>
            ) : !websites || websites.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-500">
                You haven't created any websites yet.
              </div>
            ) : (
              websites.map((site: any) => (
              <div key={site._id} className={`rounded-[26px] border bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all ${selectedWebsiteIds.includes(site._id) ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-white/70'} ${site.isActive === false ? 'opacity-80' : ''}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-3">
                    <label className="mt-1 inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selectedWebsiteIds.includes(site._id)}
                        onChange={() => toggleWebsiteSelection(site._id)}
                        className="peer sr-only"
                      />
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${selectedWebsiteIds.includes(site._id) ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-300 bg-white text-transparent'}`}>
                        <span className="text-xs font-bold">✓</span>
                      </span>
                    </label>
                    <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{site.businessName}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${site.isActive === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${site.isActive === false ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        {site.isActive === false ? 'Inactive' : 'Live'}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                        {getThemePreset(site.theme).label}
                      </span>
                      {selectedWebsiteIds.includes(site._id) && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center">
                      <LinkIcon size={14} className="mr-1.5" />
                      merobusiness.com/{site.slug}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {getThemePreset(site.theme).config.fontFamily}
                      </div>
                    </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Active/Inactive Toggle */}
                    <button
                      onClick={() => handleToggleActive(site._id, site.isActive !== false)}
                      title={site.isActive === false ? 'Click to activate' : 'Click to deactivate'}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                        site.isActive === false
                          ? 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      {site.isActive === false
                        ? <><ToggleLeft size={18} /><span>Activate</span></>
                        : <><ToggleRight size={18} /><span>Live</span></>
                      }
                    </button>
                    <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="flex items-center rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200">
                      <Globe size={16} className="mr-1.5" />
                      View
                    </a>
                    <Link href={`/dashboard/${site._id}`} className="flex items-center rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
                      <Settings size={16} className="mr-1.5" />
                      Edit
                    </Link>
                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, id: site._id, name: site.businessName })}
                      className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                      title="Delete Website"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
