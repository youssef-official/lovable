'use client';

import Link from 'next/link';
import { UserButton } from './UserButton';
import { useState } from 'react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-10 w-full px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">🧡</span>
          </div>
          <span className="text-white font-semibold text-xl hidden sm:inline">Lovable</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Home
          </Link>
          <Link href="/workspace" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Workspace
          </Link>
          <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            Community
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/80 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="hidden md:block">
          <UserButton />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 glass-dark rounded-lg p-4 animate-fade-in-up">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/workspace"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Workspace
            </Link>
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium py-2 text-left">
              Community
            </button>
            <div className="pt-3 border-t border-white/10">
              <UserButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
