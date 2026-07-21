// src/components/common/Footer.tsx
'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setProfile(p);
      }
    }
    fetchProfile();
  }, []);

  const getDashboardLink = () => {
    if (!profile) return '/';
    return profile.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard';
  };

  return (
    <footer className="bg-[#008751] text-white hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-8 sm:pl-10 lg:pl-32 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <img src="/nimartfooters.png" alt="Nimart" className="h-8 w-auto" />
            </Link>
            <p className="text-green-100 text-sm leading-relaxed mb-5">
              Nigeria's trusted marketplace connecting customers with verified service professionals.
            </p>
            <div className="hidden md:block">
              <div className="flex gap-3 mb-6">
                {/* TikTok */}
                <a href="https://www.tiktok.com/@nimart.ng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="TikTok">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/nimartng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
                {/* Facebook */}
                <a href="https://web.facebook.com/people/Nimart/61551209078955/" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* X (Twitter) */}
                <a href="https://x.com/nimartng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="X (Twitter)">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                {/* YouTube */}
                <a href="https://www.youtube.com/@Nimartng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="YouTube">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
              <div className="flex flex-col gap-2 max-w-[160px]">
                <a href="#" className="inline-flex items-center justify-center gap-2 border border-green-200 text-green-100 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-200 hover:text-green-900 transition-colors" onClick={(e) => e.preventDefault()}>
                  <svg className="h-4 w-4" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  App Store
                </a>
                <a href="#" className="inline-flex items-center justify-center gap-2 border border-green-200 text-green-100 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-200 hover:text-green-900 transition-colors" onClick={(e) => e.preventDefault()}>
                  <svg className="h-4 w-4" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-base">Quick Links</h3>
            <ul className="space-y-2 text-green-100 text-sm xs:text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Find Services</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">How it Works</Link></li>
              <li><Link href="/auth/signup?role=provider" className="hover:text-white transition-colors">Become a Provider</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/nimart-explained" className="hover:text-white transition-colors">What is Nimart?</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <h3 className="font-semibold mb-4 text-base">Contact Us</h3>
            <ul className="space-y-2 text-green-100 text-sm xs:text-xs">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@nimart.ng" className="hover:text-white transition-colors break-all">info@nimart.ng</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <a href="tel:08038887589" className="hover:text-white transition-colors">08038887589</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Shop E35 Murg Plaza, Area 10 UTC<br />Abuja, Nigeria</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-base">Legal & Resources</h3>
            <ul className="space-y-2 text-green-100 text-sm xs:text-xs">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/safety" className="hover:text-white transition-colors">Safety Tips</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/report" className="hover:text-white transition-colors">Report an Issue</Link></li>
              <li><Link href="/nimart-vs-nimart" className="hover:text-white transition-colors">Nimart vs. NIMART</Link></li>
            </ul>
          </div>
        </div>

        {/* Mobile-only: Social + App buttons */}
        <div className="block md:hidden mt-6">
          <div className="flex gap-3 mb-4">
            <a href="https://www.tiktok.com/@nimart.ng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="TikTok">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>
            </a>
            <a href="https://www.instagram.com/nimartng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="Instagram">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a href="https://web.facebook.com/people/Nimart/61551209078955/" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="Facebook">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://x.com/nimartng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="X (Twitter)">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.youtube.com/@Nimartng" target="_blank" rel="me noopener noreferrer" className="text-green-200 hover:text-white transition-colors" aria-label="YouTube">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
          <div className="flex flex-col gap-2 max-w-[160px]">
            <a href="#" className="inline-flex items-center justify-center gap-2 border border-green-200 text-green-100 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-200 hover:text-green-900 transition-colors" onClick={(e) => e.preventDefault()}>
              <svg className="h-4 w-4" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
              App Store
            </a>
            <a href="#" className="inline-flex items-center justify-center gap-2 border border-green-200 text-green-100 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-200 hover:text-green-900 transition-colors" onClick={(e) => e.preventDefault()}>
              <svg className="h-4 w-4" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
              Google Play
            </a>
          </div>
        </div>
      </div>

      <div className="bg-[#006b3f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-8 sm:pl-10 lg:pl-32 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm xs:text-xs text-green-200">
            <p>&copy; {currentYear} Nimart. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}