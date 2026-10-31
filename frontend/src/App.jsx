import React, { useState, useEffect, useCallback } from 'react';
import { fetchMatches, fetchMatchDetail, fetchAnalysis, fetchHealth } from './api';
import Header from './components/Header';
import MatchSelector from './components/MatchSelector';
import LiveMatchCentre from './components/LiveMatchCentre';
import Matchmate from './components/Matchmate';
import Overthink from './components/Overthink';
import TwelfthPlayer from './components/TwelfthPlayer';
import AIReport from './components/AIReport';
import FanDugout from './components/FanDugout';
import VideoDemo from './components/VideoDemo';
import { getTranslation } from './utils/i18n';
import { setAudioMuted, getAudioMuted } from './utils/audio';

const TAB_DEFS = [
  { id: 'matches', labelKey: 'tab_matches' },
  { id: 'centre', labelKey: 'tab_centre' },
  { id: 'dugout', labelKey: 'tab_dugout' }, // Live Interactive Fan Feature!
  { id: 'matchmate', labelKey: 'tab_matchmate' },
  { id: 'overthink', labelKey: 'tab_overthink' },
  { id: 'tactical', labelKey: 'tab_tactical' },
  { id: 'report', labelKey: 'tab_report' },
  { id: 'demo', labelKey: 'tab_demo' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Theme & Language & Audio States
  const [theme, setTheme] = useState(() => localStorage.getItem('matchday_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('matchday_lang') || 'en');
  const [isMuted, setIsMutedState] = useState(() => localStorage.getItem('matchday_muted') === 'true');

  const t = (k) => getTranslation(language, k);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('matchday_theme', theme);
  }, [theme]);

  // Persist language
  useEffect(() => {
    localStorage.setItem('matchday_lang', language);
  }, [language]);

  // Persist audio
  useEffect(() => {
    setAudioMuted(isMuted);
    localStorage.setItem('matchday_muted', isMuted.toString());
  }, [isMuted]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleAudio = () => {
    setIsMutedState(prev => !prev);
  };

  // Check health on mount
  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => {});
  }, []);

  // Load matches
  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMatches();
      const matchData = result.data || [];
      setMatches(matchData);
      setIsDemo(result.isDemo);
      setLastRefresh(new Date());
      if (matchData.length > 0) {
        selectMatch(matchData[0], false);
      }
    } catch (err) {
      setError('Failed to load matches: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Load match details and analysis when a match is selected
  const selectMatch = useCallback(async (match, switchTab = true) => {
    setSelectedMatch(match);
    if (switchTab) setActiveTab('centre');
    setLoading(true);
    setError(null);
    try {
      const [detail, anal] = await Promise.all([
        fetchMatchDetail(match.id),
        fetchAnalysis(match.id),
      ]);
      setMatchDetail(detail.data);
      setAnalysis(anal);
      setIsDemo(detail.isDemo || anal.isDemo);
    } catch (err) {
      setError('Failed to load match data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMatch = useCallback(async () => {
    if (!selectedMatch) return;
    setLoading(true);
    try {
      const [detail, anal] = await Promise.all([
        fetchMatchDetail(selectedMatch.id),
        fetchAnalysis(selectedMatch.id),
      ]);
      setMatchDetail(detail.data);
      setAnalysis(anal);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Refresh failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMatch]);

  const contextPayload = {
    matchData: analysis?.matchData || selectedMatch,
    features: analysis?.features,
    winProbability: analysis?.winProbability,
    shapExplanation: analysis?.shapExplanation,
    scorecard: matchDetail?.scorecard,
  };

  return (
    <div className="app-container" data-theme={theme}>
      <Header
        health={health}
        isDemo={isDemo}
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onSelectLanguage={setLanguage}
        isMuted={isMuted}
        onToggleAudio={toggleAudio}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-label">{t('hero_label')}</div>
          <h1 className="hero-heading">
            {t('hero_heading_1')}<br />
            <span className="hero-highlight">{t('hero_heading_2')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('hero_subtitle')}
          </p>
        </div>
        <div className="hero-visual" aria-label="Three-dimensional cricket ball and match intelligence illustration">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-cricket-ball" role="img" aria-label="Red cricket ball">
            <span className="ball-highlight" />
            <span className="ball-seam" />
          </div>
          <div className="hero-intelligence-card">
            <div className="hero-card-ribbon"><span>•</span> MATCH INTELLIGENCE</div>
            <div className="hero-card-topline"><span>LIVE READ</span><span>01</span></div>
            <div className="hero-mini-pitch" aria-hidden="true">
              <span className="pitch-strip pitch-strip-left" />
              <span className="pitch-strip pitch-strip-centre" />
              <span className="pitch-strip pitch-strip-right" />
              <span className="pitch-crease" />
              <span className="pitch-ball-mark" />
            </div>
            <div className="hero-card-bottom"><span>READ THE GAME</span><span className="hero-card-arrow">↗</span></div>
          </div>
          <div className="hero-context-tag"><span className="context-dot" /> DATA-LED CONTEXT</div>
        </div>
      </section>

      {isDemo && (
        <div className="demo-banner">
          {t('demo_banner')}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        {TAB_DEFS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'dugout' ? 'nav-tab-featured' : ''} ${tab.id === 'demo' ? 'nav-tab-demo' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.id !== 'matches' && tab.id !== 'demo' && !selectedMatch}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      {error && <div className="error-box">{error}</div>}

      <main className="fade-in" key={activeTab}>
        {activeTab === 'matches' && (
          <MatchSelector
            matches={matches}
            selectedMatch={selectedMatch}
            onSelect={selectMatch}
            onRefresh={loadMatches}
            loading={loading}
            lastRefresh={lastRefresh}
          />
        )}

        {activeTab === 'centre' && selectedMatch && (
          <LiveMatchCentre
            match={selectedMatch}
            detail={matchDetail}
            analysis={analysis}
            loading={loading}
            onRefresh={refreshMatch}
            lastRefresh={lastRefresh}
          />
        )}

        {activeTab === 'dugout' && selectedMatch && (
          <FanDugout context={contextPayload} language={language} />
        )}

        {activeTab === 'matchmate' && selectedMatch && (
          <Matchmate context={contextPayload} loading={loading} language={language} />
        )}

        {activeTab === 'overthink' && selectedMatch && (
          <Overthink context={contextPayload} loading={loading} language={language} />
        )}

        {activeTab === 'tactical' && selectedMatch && (
          <TwelfthPlayer context={contextPayload} loading={loading} language={language} />
        )}

        {activeTab === 'report' && selectedMatch && (
          <AIReport context={contextPayload} loading={loading} language={language} />
        )}

        {activeTab === 'demo' && (
          <VideoDemo language={language} />
        )}

        {activeTab !== 'matches' && activeTab !== 'demo' && !selectedMatch && (
          <div className="empty-state">
            <div className="empty-state-icon">🏏</div>
            <div className="empty-state-text">{t('btn_select_match')}</div>
            <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t('select_match_hint')}
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">Made with love by Devanshu Desai</footer>
    </div>
  );
}
