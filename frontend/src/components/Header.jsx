import React from 'react';
import { SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';

export default function Header({
  health,
  isDemo,
  theme = 'dark',
  onToggleTheme,
  language = 'en',
  onSelectLanguage,
  isMuted = false,
  onToggleAudio
}) {
  const provider = health?.cricketProvider || 'Live Data';
  const t = (k) => getTranslation(language, k);

  return (
    <header className="header">
      <div className="header-brand">
        <div>
          <div className="header-logo">{t('app_title')}</div>
          <div className="header-tagline">{t('tagline')}</div>
        </div>
      </div>

      <div className="header-actions">
        {/* Multilingual Selector */}
        <div className="lang-selector-wrap" title="Change Language">
          <span className="lang-icon" aria-hidden="true">🌐</span>
          <select
            className="lang-select"
            value={language}
            onChange={(e) => onSelectLanguage(e.target.value)}
            aria-label="Select Language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stadium Audio Mute/Unmute */}
        <button
          className={`btn-icon-toggle ${isMuted ? 'muted' : 'active'}`}
          onClick={onToggleAudio}
          title={isMuted ? t('audio_mute') : t('audio_sound')}
          aria-label="Toggle Stadium Audio"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Light/Dark Mode Switcher */}
        <button
          className="btn-icon-toggle theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? t('theme_light') : t('theme_dark')}
          aria-label="Toggle Light Dark Theme"
          id="theme-toggle"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
          <span className="theme-toggle-label">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Live Status Indicator */}
        <div className="header-status">
          <div className={`status-dot ${isDemo ? 'demo' : ''}`} />
          <span className="status-text">
            {isDemo ? 'Demo Mode' : `Live`}
            {health?.hasGroqKey ? ' • AI On' : ' • ML Engine'}
          </span>
        </div>
      </div>
    </header>
  );
}
