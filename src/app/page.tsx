"use client";

import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Globe, Smartphone, Zap, CheckCircle2, 
  Layout, Shield, ShoppingBag, Users, ChevronRight, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 sm:px-12 py-4 flex items-center justify-between ${
          isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 py-3' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Layout size={24} />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">MeroBusiness</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600">Login</Link>
          <Link 
            href="/register" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-white pt-24 px-6 md:hidden animate-in fade-in duration-300">
          <div className="flex flex-col space-y-6">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-slate-900">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-slate-900">How it Works</a>
            <hr className="border-slate-100" />
            <Link href="/login" className="text-xl font-bold text-slate-900">Login</Link>
            <Link 
              href="/register" 
              className="w-full bg-indigo-600 text-white text-center py-4 rounded-2xl font-bold shadow-xl shadow-indigo-600/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-indigo-700 font-bold text-xs uppercase tracking-widest shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse" />
              Built for Nepal's Local Stores
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Launch Your Store <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">In 60 Seconds.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              MeroBusiness empowers Nepalese entrepreneurs with high-performance, mobile-first websites. No code, no bank account required—just products and passion.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                href="/register" 
                className="group relative w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <div className="flex items-center justify-center">
                  Start Your Business
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
              </Link>
              <Link 
                href="/dashboard" 
                className="w-full sm:w-auto px-8 py-5 bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 transition-all"
              >
                View Live Demo
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Free for life</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest">No Card Required</span>
              </div>
            </div>
          </div>

          <div className="relative order-first lg:order-last">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-[40px] blur-3xl z-0" />
            <div className="relative rounded-[40px] border border-white bg-white/50 p-3 sm:p-5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-xl animate-float">
              <div className="rounded-[32px] overflow-hidden border border-slate-200/50 relative aspect-[16/10]">
                <Image 
                  src="/hero-banner.png" 
                  alt="MeroBusiness Hero" 
                  fill 
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
            
            {/* Floating Mobile elements */}
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden xl:block animate-float-slow">
              <div className="bg-white rounded-3xl p-4 shadow-2xl shadow-indigo-500/10 border border-slate-100 flex items-center space-x-4 max-w-[200px]">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sales</p>
                  <p className="text-lg font-black text-slate-900">रू 45,250</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 relative z-10">
          {[
            { label: 'Registered Stores', value: '1,200+', color: 'text-indigo-400' },
            { label: 'Active Users', value: '15.5k', color: 'text-emerald-400' },
            { label: 'Cities Covered', value: '45', color: 'text-amber-400' },
            { label: 'Uptime', value: '99.9%', color: 'text-rose-400' }
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className={`${stat.color} text-4xl font-black mb-2`}>{stat.value}</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.3em]">Core Features</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900">Everything to scale your business.</h3>
            <div className="w-16 h-1.5 bg-indigo-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Smartphone className="text-indigo-600" />, 
                title: "Mobile First Design", 
                desc: "Every website is optimized for Nepal's mobile-first audience. Lightning fast on low-speed data." 
              },
              { 
                icon: <Zap className="text-amber-500" />, 
                title: "Instant Setup", 
                desc: "Just upload your logo and products. Your store is live and reachable via a custom slug instantly." 
              },
              { 
                icon: <Globe className="text-emerald-500" />, 
                title: "Localized Support", 
                desc: "Built with Nepali business values. Integrated with WhatsApp and Messenger for local ordering." 
              },
              { 
                icon: <Shield className="text-blue-500" />, 
                title: "Zero Maintenance", 
                desc: "We handle the hosting, certificates, and performance. You focus on selling your products." 
              },
              { 
                icon: <Users className="text-rose-500" />, 
                title: "RBAC Security", 
                desc: "Multi-tiered access for store owners and supervisors with secure authentication layers." 
              },
              { 
                icon: <Layout className="text-violet-600" />, 
                title: "Modern Themes", 
                desc: "Select from our premium, pre-configured themes designed for high conversion." 
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h4>
                <p className="text-slate-600 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="max-w-sm space-y-6">
              <div className="flex items-center space-x-2 text-white">
                <Layout size={28} />
                <span className="text-2xl font-black tracking-tight">MeroBusiness</span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed">
                Empowering every entrepreneur in Nepal to digitize their business and reach global customers with ease.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                    <div className="w-4 h-4 bg-current rounded-sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-24 w-full md:w-auto">
              <div>
                <h5 className="text-white font-bold mb-6">Product</h5>
                <ul className="space-y-4 text-slate-400 text-sm font-medium">
                  <li className="hover:text-white transition-colors cursor-pointer">Themes</li>
                  <li className="hover:text-white transition-colors cursor-pointer">Features</li>
                  <li className="hover:text-white transition-colors cursor-pointer">Security</li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6">Company</h5>
                <ul className="space-y-4 text-slate-400 text-sm font-medium">
                  <li className="hover:text-white transition-colors cursor-pointer">About</li>
                  <li className="hover:text-white transition-colors cursor-pointer">Privacy</li>
                  <li className="hover:text-white transition-colors cursor-pointer">Terms</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} MeroBusiness. Developed with ❤️ for Nepal.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
