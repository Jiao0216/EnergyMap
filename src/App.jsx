import { useEffect } from 'react';
import './lib/bootstrap.js';
import { startApp } from './lib/tasteverse.js';
import './styles/global.css';
import AISommelier from './sommelier/AISommelier.jsx';

export default function App() {
  useEffect(() => {
    if (window.__tvStarted) return;
    window.__tvStarted = true;
    startApp();
  }, []);

  return (
    <>
      {/* Login Screen */}
      <div id="login-screen">
        <canvas id="login-canvas"></canvas>
        <div className="login-card-wrap">
          <div className="login-box">
            <div className="login-logo">⚡</div>
            <div className="login-logo-en">EnergyMap</div>
            <div className="login-sub">Every relationship has weight, every interaction leaves a trace</div>
            <div className="login-card">
              <h3 id="login-title">Sign In / Sign Up</h3>
              <div className="input-group">
                <label>Email</label>
                <input type="email" id="login-email" placeholder="name@example.com" />
              </div>
              <div className="input-group" id="verify-group" style={{ display: 'none' }}>
                <label>Verification Code</label>
                <input type="text" id="login-code" placeholder="6-digit code" />
                <div id="resend-row" style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text3)', textAlign: 'right' }}>
                  <span id="resend-link">Resend</span>
                </div>
              </div>
              <button className="login-btn" id="login-btn">Send Code</button>
              <div className="login-msg" id="login-msg"></div>
            </div>
            <div className="login-footer"></div>
          </div>
        </div>
      </div>

      <nav id="main-nav">
        <div className="logo"><div className="logo-dot"></div><span>EnergyMap</span></div>
        <div className="tabs">
          <div className="tab active" data-view="universe-view">Energy Map</div>
          <div className="tab" data-view="chat-view">AI Advisor</div>
          <div className="tab" data-view="categories-view">Relationships</div>
        </div>
        <div className="right">
          <span id="everos-status" title="EverOS Memory Service" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text3)', marginRight: '8px', cursor: 'help' }}>
            <span id="everos-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#555' }}></span>
            <span id="everos-label">EverOS</span>
          </span>
          <button className="btn-new" id="btn-new-note">+ New</button>
          <div className="user-badge" id="user-badge" title="Click to sign out">
            <div className="user-avatar" id="user-avatar"></div>
            <span id="user-email-display"></span>
          </div>
        </div>
      </nav>

      <div className="view active" id="universe-view">
        <div id="graph-container"></div>
        <div className="universe-overlay"><h2>My Energy Map</h2><p>Every interaction is a star — discover who energizes you and who drains you</p></div>
        <div className="universe-stats">
          <div className="stat"><div className="val" id="stat-total">0</div><div className="label">Interactions</div></div>
          <div className="stat"><div className="val" id="stat-cats">0</div><div className="label">Types</div></div>
          <div className="stat"><div className="val" id="stat-conn">0</div><div className="label">Links</div></div>
        </div>
        <button className="cal-toggle" id="cal-toggle" title="Interaction Calendar">📅 Calendar</button>
        <div className="universe-legend" id="legend"></div>
        <div className="search-float">
          <span className="si">⌕</span>
          <input type="text" id="graph-search" placeholder="Search interactions..." />
          <div className="search-meta" id="search-meta">Name, emotion tag, or relationship type</div>
        </div>
        <button id="btn-recenter" style={{ position: 'absolute', bottom: '20px', right: '240px', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,12,22,0.8)', backdropFilter: 'blur(12px)', color: 'var(--accent)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', animation: 'fadeUp .6s ease .7s both' }} title="Back to center">🎯 Recenter</button>
      </div>

      {/* Calendar Panel */}
      <div className="cal-panel" id="cal-panel">
        <button className="close" id="cal-close">✕</button>
        <div className="cal-header">
          <h3 id="cal-month-label"></h3>
          <div className="cal-nav">
            <button id="cal-prev">‹</button>
            <button id="cal-today-btn" title="Go to today" style={{ fontSize: '10px', width: 'auto', padding: '0 8px' }}>Today</button>
            <button id="cal-next">›</button>
          </div>
        </div>
        <div className="cal-weekdays">
          <div className="cal-wd">Su</div><div className="cal-wd">Mo</div><div className="cal-wd">Tu</div><div className="cal-wd">We</div><div className="cal-wd">Th</div><div className="cal-wd">Fr</div><div className="cal-wd">Sa</div>
        </div>
        <div className="cal-grid" id="cal-grid"></div>
        <div id="cal-day-detail"></div>
        <div className="cal-mini-graph" id="cal-mini-graph" style={{ display: 'none' }}></div>
      </div>

      <div className="view" id="record-view">
        <div className="record-card">
          <h3>New Interaction</h3>
          <div className="input-group"><label>Relationship Type</label><select id="rec-cat"></select></div>
          <div className="input-group" id="custom-cat-group" style={{ display: 'none' }}>
            <label>Icon &amp; Name</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" id="rec-custom-icon" placeholder="👥" style={{ width: '52px', textAlign: 'center', fontSize: '22px' }} maxLength={2} />
              <input type="text" id="rec-custom-cat" placeholder="e.g. Mentor, Neighbor..." style={{ flex: 1 }} />
            </div>
          </div>
          <div className="input-group" id="parent-cat-group" style={{ display: 'none' }}>
            <label>Parent Group</label>
            <select id="rec-parent-cat"></select>
          </div>
          <div className="input-group">
            <label>With Who</label>
            <input type="text" id="rec-name" placeholder="e.g. Mike, Sarah, Mom..." />
            <div className="dup-hint" id="dup-hint">
              <div className="dup-hint-title">⚠️ Similar record found</div>
              <div id="dup-hint-list"></div>
            </div>
          </div>
          <div className="input-group">
            <label>Activity &amp; Feelings</label>
            <textarea id="rec-notes" placeholder="What happened? How did it feel? e.g. 2-hour meeting, kept getting interrupted, very stressful..."></textarea>
          </div>
          <div className="input-group">
            <label>Duration (min)</label>
            <input type="number" id="rec-duration" placeholder="90" min="1" max="1440" style={{ width: '120px' }} />
          </div>
          <div className="input-group"><label>Energy Score (-5 drained ~ +5 fully charged)</label><div className="score-row" id="score-row"></div></div>
          <div className="input-group">
            <label>Emotion Tags</label>
            <div className="tag-row" id="tags-row">
              <input type="text" id="tag-input" placeholder="Press Enter to add tags, e.g. charged, anxious, calm" style={{ flex: 1, minWidth: '120px', padding: '6px 12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '11px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div className="input-group">
            <label>Location / Setting</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" id="rec-location" placeholder="e.g. Office, Starbucks, Phone call..." style={{ flex: 1 }} />
              <button type="button" id="btn-locate" style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--surface2)', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>📍 Locate</button>
            </div>
          </div>
          {/* Hidden fields kept for JS compatibility */}
          <div style={{ display: 'none' }}>
            <div className="price-mode-toggle" id="price-mode-toggle">
              <span className="price-mode sel" data-mode="unit">Unit</span>
              <span className="price-mode" data-mode="avg">Per Person</span>
            </div>
            <input type="number" id="rec-price" />
            <input type="number" id="rec-price-total" />
            <input type="number" id="rec-price-people" defaultValue="2" />
            <div id="price-unit-group"></div>
            <div id="price-avg-group"></div>
            <div id="price-avg-result"></div>
            <input type="file" id="rec-photo" accept="image/*" />
            <div id="photo-preview"><img id="photo-img" /></div>
          </div>
          <div className="record-actions"><button className="btn-p" id="btn-save" style={{ flex: 2 }}>Save Interaction</button></div>
        </div>
      </div>

      <div className="view" id="chat-view">
        <AISommelier embedded />
      </div>

      <div className="view" id="categories-view">
        <div className="section-header"><h2>Relationships</h2><p>Explore your interpersonal energy map</p></div>
        <div className="cat-grid" id="cat-grid"></div>
      </div>

      <div className="cat-detail-overlay" id="cat-detail">
        <div className="cat-detail-header">
          <button className="back-btn" id="cat-back">←</button>
          <h3 id="cat-detail-title"></h3>
          <div className="cnt" id="cat-detail-cnt"></div>
        </div>
        <div className="note-list" id="cat-note-list"></div>
      </div>

      <div className="detail-panel" id="detail-panel">
        <button className="close" id="close-detail">×</button>
        <div id="detail-content"></div>
      </div>

      <div className="profile-panel" id="profile-panel">
        <button className="close" id="close-profile">×</button>
        <div id="profile-content"></div>
      </div>

      <div className="modal-overlay" id="modal-overlay">
        <div className="modal" id="modal-content"></div>
      </div>
    </>
  );
}
