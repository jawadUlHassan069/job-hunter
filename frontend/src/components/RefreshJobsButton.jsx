// src/components/RefreshJobsButton.jsx
import { useState, useEffect } from 'react';
import jobsAPI from '../api/jobs';

const mono = "'JetBrains Mono', monospace";
const heading = "'Plus Jakarta Sans', sans-serif";

export default function RefreshJobsButton({ onRefreshComplete }) {
  const [scrapeInfo, setScrapeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch last scrape info on mount
  useEffect(() => {
    fetchScrapeInfo();
  }, []);

  const fetchScrapeInfo = async () => {
    try {
      const response = await jobsAPI.getLastScrapeInfo();
      setScrapeInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch scrape info:', err);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowConfirm(false);

    try {
      const response = await jobsAPI.triggerScraping();
      setSuccess(`✓ Jobs refreshed! ${response.data.jobs_added} new jobs added.`);
      
      // Refresh scrape info after successful scrape
      setTimeout(() => {
        fetchScrapeInfo();
        if (onRefreshComplete) onRefreshComplete();
      }, 1000);
    } catch (err) {
      setError('Failed to refresh jobs. Please try again later.');
      console.error('Scraping error:', err);
    } finally {
      setLoading(false);
    }
  };

  const needsRefresh = scrapeInfo?.needs_refresh;
  const timeDisplay = scrapeInfo?.time_display || 'Unknown';

  return (
    <div style={{ 
      background: '#1a1f2e', 
      border: needsRefresh ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(255,255,255,0.12)', 
      borderRadius: 12, 
      padding: '16px 20px',
      marginBottom: 24,
      animation: 'db-fadeUp .5s ease both'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        {/* Info Section */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <span style={{ fontFamily: heading, fontWeight: 700, fontSize: 14, color: '#f3f6ff' }}>
              Job Database
            </span>
            {needsRefresh && (
              <span style={{ 
                fontSize: 9, 
                fontFamily: mono, 
                padding: '2px 8px', 
                borderRadius: 100, 
                background: 'rgba(234,179,8,0.14)', 
                color: 'rgba(253,224,71,0.9)', 
                border: '1px solid rgba(234,179,8,0.3)' 
              }}>
                ⚠ OUTDATED
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, fontFamily: mono, color: 'rgba(243,246,255,0.55)' }}>
            Last scraped: <span style={{ color: needsRefresh ? 'rgba(253,224,71,0.9)' : 'rgba(52,211,153,0.9)' }}>{timeDisplay}</span>
          </div>
          {scrapeInfo && (
            <div style={{ fontSize: 10, fontFamily: mono, color: 'rgba(243,246,255,0.4)', marginTop: 4 }}>
              {scrapeInfo.total_jobs} total jobs · {scrapeInfo.recent_jobs_24h} added in last 24h
            </div>
          )}
        </div>

        {/* Button Section */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              style={{
                fontFamily: mono,
                fontSize: 11,
                padding: '8px 16px',
                borderRadius: 8,
                background: needsRefresh ? 'rgba(234,179,8,0.2)' : 'rgba(29,158,117,0.2)',
                border: needsRefresh ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(29,158,117,0.4)',
                color: needsRefresh ? '#fef08a' : '#34d399',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
                fontWeight: 600,
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? '⟳ Refreshing...' : '↻ Refresh Jobs'}
            </button>
          ) : (
            <>
              <span style={{ fontSize: 11, fontFamily: mono, color: 'rgba(243,246,255,0.7)' }}>
                Are you sure?
              </span>
              <button
                onClick={handleRefresh}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'rgba(29,158,117,0.2)',
                  border: '1px solid rgba(29,158,117,0.4)',
                  color: '#34d399',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ✓ Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ✕ No
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{ 
          marginTop: 12, 
          padding: '8px 12px', 
          borderRadius: 6, 
          background: 'rgba(239,68,68,0.14)', 
          border: '1px solid rgba(239,68,68,0.3)', 
          fontSize: 11, 
          fontFamily: mono, 
          color: '#fca5a5' 
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ 
          marginTop: 12, 
          padding: '8px 12px', 
          borderRadius: 6, 
          background: 'rgba(29,158,117,0.14)', 
          border: '1px solid rgba(29,158,117,0.3)', 
          fontSize: 11, 
          fontFamily: mono, 
          color: '#34d399' 
        }}>
          {success}
        </div>
      )}
    </div>
  );
}
