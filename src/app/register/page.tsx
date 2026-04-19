"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  User, Lock, Building2, FileText, Image as ImageIcon,
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, ArrowRight, ShieldCheck, AtSign
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants/countries';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { CountrySelector } from '@/components/CountrySelector';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    countryCode: '+977',
    phone: '',
    panNumber: '',
    businessName: '',
  });
  const [nationalIdPhoto, setNationalIdPhoto] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<{ isValid: boolean; message: string; show: boolean }>({
    isValid: false,
    message: '',
    show: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
      setUsernameMessage(data.message);
    } catch {
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.username) checkUsername(form.username);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username, checkUsername]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Please upload an image under 5MB.');
      return;
    }
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setNationalIdPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    const map = [
      { label: '', color: 'bg-slate-200' },
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
      { label: 'Very Strong', color: 'bg-emerald-600' },
    ];
    return { score, ...map[score] };
  };

  const strength = passwordStrength(form.password);

  // Real-time phone validation
  useEffect(() => {
    const phoneDigits = form.phone.replace(/[^0-9]/g, '');
    if (!phoneDigits) {
      setPhoneStatus({ isValid: false, message: '', show: false });
      return;
    }

    const selectedCountry = COUNTRIES.find(c => c.dial_code === form.countryCode);
    if (selectedCountry) {
      const fullNumber = `${form.countryCode}${phoneDigits}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = isValidPhoneNumber(fullNumber, selectedCountry.code as any);
      setPhoneStatus({
        isValid,
        message: isValid ? `Perfectly formatted for ${selectedCountry.name}` : `Invalid format for ${selectedCountry.name}`,
        show: true
      });
    } else {
      const isValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;
      setPhoneStatus({
        isValid,
        message: isValid ? 'Possible format' : 'Must be 7-15 digits',
        show: true
      });
    }
  }, [form.phone, form.countryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameStatus !== 'available') {
      toast.error('Please choose a valid, available username.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (!nationalIdPhoto) {
      toast.error('Please upload your National ID photo.');
      return;
    }

    const phoneDigits = form.phone.replace(/[^0-9]/g, '');
    const selectedCountry = COUNTRIES.find(c => c.dial_code === form.countryCode);
    
    if (selectedCountry) {
      const fullNumber = `${form.countryCode}${phoneDigits}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!isValidPhoneNumber(fullNumber, selectedCountry.code as any)) {
        toast.error(`Invalid phone number format for ${selectedCountry.name}.`);
        return;
      }
    } else {
      // Fallback to basic length check if country metadata is missing
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        toast.error('Phone number must be between 7 and 15 digits.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.toLowerCase().trim(),
          password: form.password,
          phone: `${form.countryCode} ${phoneDigits}`,
          panNumber: form.panNumber,
          businessName: form.businessName,
          nationalIdPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      setSubmittedEmail(`${form.username.toLowerCase()}@merobusiness.com`);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="relative z-10 text-center max-w-md p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Application Submitted!</h1>
          <p className="text-slate-400 mb-6">
            Your account <span className="text-indigo-400 font-mono font-bold">{submittedEmail}</span> has been created and is awaiting Super-Admin approval.
          </p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-left mb-6 space-y-2">
            <p className="text-slate-300 text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Your information has been securely saved.</p>
            <p className="text-slate-300 text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> A Super-Admin will review your application.</p>
            <p className="text-slate-300 text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Once approved, you can log in with your email and password.</p>
          </div>
          <Link href="/login" className="inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden py-10">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 mb-4">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Admin Registration</h1>
          <p className="text-slate-400">Apply for an admin account on MeroBusiness</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username + Email Preview */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className="block w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. john_smith"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                  {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {usernameStatus === 'taken' && <XCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              {usernameMessage && (
                <p className={`text-xs font-medium ml-1 ${usernameStatus === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {usernameMessage}
                </p>
              )}
              {form.username && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <AtSign size={12} className="text-indigo-400" />
                  <span className="text-xs text-indigo-400 font-mono">
                    Your email: <strong>{form.username.toLowerCase()}@merobusiness.com</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                  <Building2 size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Nepal Crafts Pvt. Ltd."
                />
              </div>
            </div>

            {/* Phone + PAN row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone / Mobile</label>
                <div className="relative flex gap-3">
                  <div className="w-28 shrink-0">
                    <CountrySelector 
                      value={form.countryCode}
                      onChange={(code) => setForm({...form, countryCode: code})}
                    />
                  </div>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium tracking-wide"
                    placeholder="98XXXXXXXX"
                  />
                </div>
                {phoneStatus.show && (
                  <div className={`mt-2 ml-1 flex items-center gap-2 text-[11px] font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${phoneStatus.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {phoneStatus.isValid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://flagcdn.com/w40/${COUNTRIES.find(c => c.dial_code === form.countryCode)?.code.toLowerCase()}.png`} 
                      className="w-4 h-auto rounded-[2px] shadow-sm ml-1"
                      alt="country flag"
                    />
                    <span className="tracking-wide uppercase">{phoneStatus.message}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">PAN Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                    <FileText size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.panNumber}
                    onChange={e => setForm({ ...form, panNumber: e.target.value })}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="e.g. 123456789"
                  />
                </div>
              </div>
            </div>

            {/* National ID Photo Upload */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">National ID Photo</label>
              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all bg-slate-950/30 p-6 group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                {nationalIdPhoto ? (
                  <div className="w-full space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={nationalIdPhoto} alt="National ID Preview" className="h-32 object-contain mx-auto rounded-xl border border-slate-700" />
                    <p className="text-center text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> {photoFileName}
                    </p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Click to upload National ID photo</p>
                    <p className="text-xs text-slate-600 mt-1">JPEG, PNG — Max 5MB</p>
                  </>
                )}
              </label>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="block w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="space-y-1 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-700'}`} />
                    ))}
                  </div>
                  {strength.label && <p className={`text-xs font-medium ml-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="block w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 font-medium ml-1 flex items-center gap-1"><XCircle size={12} /> Passwords do not match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-emerald-400 font-medium ml-1 flex items-center gap-1"><CheckCircle2 size={12} /> Passwords match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || usernameStatus !== 'available'}
              className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Submit Application</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
