/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        {/* Keabank Logo */}
        <div className="hisky-logo-large">
          {/* Keabank Icon - Three horizontal stripes */}
          <svg className="keabank-icon" width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Orange stripe (top) */}
            <rect x="0" y="0" width="48" height="8" rx="4" fill="#FF6B35"/>
            {/* Yellow stripe (middle) */}
            <rect x="0" y="14" width="40" height="8" rx="4" fill="#FFB84D"/>
            {/* Turquoise/Green stripe (bottom) */}
            <rect x="0" y="28" width="32" height="8" rx="4" fill="#4ECDC4"/>
          </svg>
          <h1 className="hisky-title">keabank</h1>
        </div>

        {/* Subtitle */}
        <p className="subtitle">Money without borders</p>

        {/* CTA */}
        <p className="start-hint">Click to start conversation</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
