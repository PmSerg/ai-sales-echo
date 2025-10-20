/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useUI } from '@/lib/state';

export default function Header() {
  const { toggleSidebar } = useUI();

  return (
    <header>
      <div className="header-brand">
        <div className="brand-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="url(#gradient)" strokeWidth="2" opacity="0.6"/>
            <circle cx="20" cy="20" r="12" fill="url(#gradient)" opacity="0.8"/>
            <circle cx="20" cy="20" r="6" fill="#4B7BF5" filter="url(#glow)"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4B7BF5"/>
                <stop offset="100%" stopColor="#3A5FB8"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
        <div className="brand-text">
          <h1>KEABANK AI ASSISTANT</h1>
          <p className="brand-tagline">Money without borders</p>
        </div>
      </div>
      {/* Settings button hidden from users - use Ctrl+Shift+S to open */}
      {/* <div className="header-right">
        <button
          className="settings-button"
          onClick={toggleSidebar}
          aria-label="Settings"
        >
          <span className="icon">tune</span>
        </button>
      </div> */}
    </header>
  );
}
