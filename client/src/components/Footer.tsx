import { Link } from "wouter";
import { Facebook, Instagram, Linkedin } from "lucide-react";
const maintcueLogo = '/images/maintcue-logo.svg';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          
          <div>
            <Link href="/" className="inline-block mb-4" data-testid="footer-logo-link">
              <img 
                src={maintcueLogo} 
                alt="MaintCue" 
                className="h-10 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
                data-testid="footer-logo"
              />
            </Link>
            <p className="text-sm text-gray-400">
              Smart home maintenance management powered by QR technology.
            </p>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors" data-testid="link-terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors" data-testid="link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white transition-colors" data-testid="link-cookies">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/request-pro" className="hover:text-white transition-colors" data-testid="link-footer-request-pro">
                  Request a Pro
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors" data-testid="link-footer-pricing">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-2 flex-wrap">
              <a 
                href="https://www.instagram.com/maintcue/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] hover:text-white transition-colors"
                aria-label="Instagram"
                data-testid="link-social-instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="https://facebook.com/maintcue" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] hover:text-white transition-colors"
                aria-label="Facebook"
                data-testid="link-social-facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="https://www.linkedin.com/in/maintcue-llc-6621513b1/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] hover:text-white transition-colors"
                aria-label="LinkedIn"
                data-testid="link-social-linkedin"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a
                href="https://www.pinterest.com/MaintCue/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] hover:text-white transition-colors"
                aria-label="Pinterest"
                data-testid="link-social-pinterest"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@maintcue"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] hover:text-white transition-colors"
                aria-label="TikTok"
                data-testid="link-social-tiktok"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm" data-testid="text-copyright">
            © 2026 MaintCue.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
