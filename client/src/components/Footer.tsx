import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
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
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/upkeepqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Twitter"
                data-testid="link-social-twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a 
                href="https://instagram.com/upkeepqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Instagram"
                data-testid="link-social-instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="https://facebook.com/upkeepqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Facebook"
                data-testid="link-social-facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="https://linkedin.com/company/upkeepqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="LinkedIn"
                data-testid="link-social-linkedin"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a 
                href="https://tiktok.com/@upkeepqr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
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
            © 2026 UpKeepQR.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
