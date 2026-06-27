// Luminode operator dashboard — components
// City command center: KPI strip, stylized map with lamp pins, alerts list, energy chart, device table.

const { useState } = React;

// SVGs are stroke="currentColor" => render black inside <img>.
// Recolor via CSS filter presets keyed by the var() strings used at call-sites.
const ICON_FILTERS = {
  'var(--fg-1)':            'brightness(0) saturate(100%) invert(8%) sepia(13%) saturate(1600%) hue-rotate(190deg)',
  'var(--fg-2)':            'brightness(0) saturate(100%) invert(42%) sepia(8%) saturate(380%) hue-rotate(180deg)',
  'var(--fg-3)':            'brightness(0) saturate(100%) invert(64%) sepia(6%) saturate(280%) hue-rotate(180deg)',
  'var(--brand-glow-deep)': 'brightness(0) saturate(100%) invert(36%) sepia(78%) saturate(580%) hue-rotate(135deg) brightness(85%)',
  'var(--brand-glow)':      'brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(700%) hue-rotate(125deg)',
  'var(--brand-civic)':     'brightness(0) saturate(100%) invert(20%) sepia(80%) saturate(2400%) hue-rotate(218deg) brightness(82%)',
  'var(--status-alarm)':    'brightness(0) saturate(100%) invert(33%) sepia(90%) saturate(3500%) hue-rotate(345deg) brightness(95%)',
  'var(--status-warn)':     'brightness(0) saturate(100%) invert(60%) sepia(90%) saturate(1200%) hue-rotate(0deg)',
  '#052E2A':                'brightness(0) saturate(100%) invert(8%) sepia(40%) saturate(800%) hue-rotate(135deg) brightness(60%)',
  '#fff':                   'brightness(0) invert(1)',
  '#FFFFFF':                'brightness(0) invert(1)',
};
const StrokeIcon = ({ name, size = 16, color = 'var(--fg-1)', style = {} }) => (
  <img
    src={`../../assets/icons/${name}.svg`}
    width={size} height={size} alt=""
    style={{ display: 'block', flexShrink: 0, filter: ICON_FILTERS[color] || ICON_FILTERS['var(--fg-1)'], ...style }}
  />
);

// ---------- Sidebar ----------
const Sidebar = () => (
  <aside style={opStyles.sidebar}>
    <div style={{ padding: '20px 18px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="../../assets/logo/luminode-mark.svg" width="32" height="32" alt="" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>Luminode</span>
        <span style={{ fontSize: 10.5, color: 'var(--fg-2)', letterSpacing: '0.12em' }}>智慧路灯</span>
      </div>
    </div>
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
      {[
        { icon: 'dashboard', label: '总览', en: 'Overview', active: true },
        { icon: 'map-pin', label: '设备地图', en: 'Map' },
        { icon: 'alert', label: '告警', en: 'Alerts', badge: 7 },
        { icon: 'chart', label: '能耗', en: 'Energy' },
        { icon: 'calendar', label: '调度', en: 'Schedules' },
        { icon: 'download', label: '报表', en: 'Reports' },
      ].map((it) => (
        <a key={it.icon} style={{
          ...opStyles.navItem,
          background: it.active ? 'var(--bg-elevated)' : 'transparent',
          color: it.active ? 'var(--fg-1)' : 'var(--fg-2)',
          fontWeight: it.active ? 600 : 500,
        }}>
          <StrokeIcon name={it.icon} size={18} color={it.active ? 'var(--brand-glow-deep)' : 'var(--fg-2)'} />
          <span style={{ flex: 1 }}>{it.label}</span>
          <span style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>{it.en}</span>
          {it.badge && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: '1px 7px',
              background: 'var(--status-alarm-bg)', color: 'var(--status-alarm)',
              borderRadius: 999,
            }}>{it.badge}</span>
          )}
        </a>
      ))}
    </nav>
    <div style={{ marginTop: 'auto', padding: '16px 14px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: 'var(--brand-civic)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600,
        }}>WL</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)' }}>王 立 · Wang Li</div>
          <div style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>区调度员 · Operator</div>
        </div>
        <StrokeIcon name="settings" size={16} color="var(--fg-3)" />
      </div>
    </div>
  </aside>
);

// ---------- Top bar ----------
const TopBar = () => (
  <div style={opStyles.topbar}>
    <div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
        总览 · Overview
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.02em', marginTop: 2 }}>
        南山区 · Nanshan District
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-3)', marginLeft: 10, fontFamily: 'var(--font-mono)' }}>
          周三 18:42 · April 2026
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={opStyles.search}>
        <StrokeIcon name="search" size={14} color="var(--fg-3)" />
        <input placeholder="搜设备、街区、告警…" style={opStyles.searchInput} />
        <kbd style={opStyles.kbd}>⌘ K</kbd>
      </div>
      <button style={opStyles.btnSecondary}>
        <StrokeIcon name="filter" size={14} color="var(--fg-2)" />
        <span>筛选</span>
      </button>
      <button style={opStyles.btnPrimary}>
        <StrokeIcon name="download" size={14} color="#052E2A" />
        <span>导出报表</span>
      </button>
    </div>
  </div>
);

// ---------- KPI strip ----------
const KPI = ({ label, labelEN, value, unit, delta, deltaSign, accent, spark }) => (
  <div style={opStyles.kpi}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 11.5, color: 'var(--fg-2)', fontWeight: 500 }}>
        {label} <span style={{ color: 'var(--fg-3)' }}>· {labelEN}</span>
      </div>
      {delta && (
        <span style={{
          fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 600,
          padding: '1px 6px', borderRadius: 999,
          background: deltaSign === '+' ? 'var(--status-online-bg)' : 'var(--status-alarm-bg)',
          color: deltaSign === '+' ? '#065F46' : '#991B1B',
        }}>{deltaSign}{delta}</span>
      )}
    </div>
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{
        fontSize: 30, fontFamily: 'var(--font-mono)', fontWeight: 500,
        color: accent || 'var(--fg-1)',
        letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"',
      }}>{value}</span>
      <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{unit}</span>
    </div>
    {spark && <div style={{ marginTop: 8 }}>{spark}</div>}
  </div>
);

const Sparkline = ({ color = 'var(--brand-glow)' }) => {
  const pts = [4, 5, 3, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 12].map((v, i) => `${i * 8},${24 - v * 1.6}`).join(' ');
  return (
    <svg width="120" height="28" viewBox="0 0 120 28">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,28 ${pts} 120,28`} fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  );
};

// ---------- Map (stylized SVG) ----------
const MapPanel = () => {
  const [selected, setSelected] = useState('A24');
  // pre-baked pins for a fictional city block
  const pins = [
    { id: 'A12', x: 80, y: 70, status: 'online' },
    { id: 'A18', x: 140, y: 90, status: 'online' },
    { id: 'A24', x: 220, y: 130, status: 'online' },
    { id: 'A30', x: 300, y: 110, status: 'online' },
    { id: 'B07', x: 360, y: 200, status: 'alarm' },
    { id: 'B12', x: 420, y: 250, status: 'online' },
    { id: 'C03', x: 180, y: 220, status: 'online' },
    { id: 'C09', x: 250, y: 280, status: 'warn' },
    { id: 'C15', x: 320, y: 320, status: 'online' },
    { id: 'D01', x: 90, y: 290, status: 'offline' },
    { id: 'D07', x: 150, y: 340, status: 'online' },
    { id: 'D11', x: 380, y: 380, status: 'online' },
    { id: 'E04', x: 460, y: 150, status: 'online' },
    { id: 'E08', x: 500, y: 320, status: 'online' },
  ];
  const colorFor = (s) => ({ online: '#10B981', warn: '#F59E0B', alarm: '#EF4444', offline: '#94A3B8' }[s]);
  return (
    <div style={opStyles.mapPanel}>
      <div style={opStyles.mapHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StrokeIcon name="map-pin" size={16} color="var(--brand-glow-deep)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>设备地图 · Device map</span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-3)', marginLeft: 6 }}>1,284 lamps · 14 in view</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['全部', '在线', '告警', '离线'].map((t, i) => (
            <span key={t} style={{
              fontSize: 11.5, padding: '3px 10px', borderRadius: 999,
              background: i === 0 ? 'var(--brand-night)' : 'transparent',
              color: i === 0 ? '#5EEAD4' : 'var(--fg-2)',
              border: i === 0 ? 'none' : '1px solid var(--border-strong)',
              fontWeight: 500, cursor: 'pointer',
            }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <svg viewBox="0 0 600 440" style={{ width: '100%', height: '100%', display: 'block', background: '#F0F4F7' }}>
          {/* parks */}
          <rect x="40" y="40" width="120" height="80" rx="4" fill="#E1F0E5" />
          <rect x="380" y="60" width="160" height="120" rx="4" fill="#E1F0E5" />
          <rect x="60" y="370" width="80" height="60" rx="4" fill="#E1F0E5" />
          {/* water */}
          <path d="M0 360 Q 100 350 200 380 T 400 410 L 600 420 L 600 440 L 0 440 Z" fill="#D8E8F2" />
          {/* roads */}
          <g stroke="#FFFFFF" strokeWidth="14" fill="none">
            <path d="M0 100 L 600 110" />
            <path d="M0 220 L 600 230" />
            <path d="M0 320 L 600 330" />
            <path d="M120 0 L 120 440" />
            <path d="M280 0 L 280 440" />
            <path d="M450 0 L 450 440" />
          </g>
          <g stroke="#C0CCD5" strokeWidth="14" fill="none" strokeDasharray="6 6" opacity="0.5">
            <path d="M0 100 L 600 110" />
            <path d="M120 0 L 120 440" />
          </g>
          {/* labels */}
          <text x="180" y="60" fontFamily="Inter" fontSize="10" fill="#5E6A78" letterSpacing="0.1em">PARK 公园</text>
          <text x="400" y="80" fontFamily="Inter" fontSize="10" fill="#5E6A78" letterSpacing="0.1em">CIVIC PLAZA</text>
          <text x="20" y="216" fontFamily="JetBrains Mono" fontSize="9" fill="#8A95A1">中山路 Zhongshan Rd</text>
          <text x="290" y="20" fontFamily="JetBrains Mono" fontSize="9" fill="#8A95A1">滨海大道 Binhai Ave</text>
          {/* pins */}
          {pins.map((p) => {
            const isSel = p.id === selected;
            const c = colorFor(p.status);
            return (
              <g key={p.id} onClick={() => setSelected(p.id)} style={{ cursor: 'pointer' }}>
                {p.status === 'alarm' && <circle cx={p.x} cy={p.y} r="14" fill={c} fillOpacity="0.18">
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite" />
                </circle>}
                {isSel && <circle cx={p.x} cy={p.y} r="14" fill="none" stroke="#14B8A6" strokeWidth="2" />}
                <circle cx={p.x} cy={p.y} r="6" fill={c} stroke="#fff" strokeWidth="2" />
                {isSel && <text x={p.x + 12} y={p.y + 4} fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" fill="#0B1220">{p.id}</text>}
              </g>
            );
          })}
        </svg>

        {/* Legend chip */}
        <div style={opStyles.mapLegend}>
          {[
            { c: '#10B981', l: '在线 1,247' },
            { c: '#F59E0B', l: '降级 18' },
            { c: '#EF4444', l: '故障 7' },
            { c: '#94A3B8', l: '离线 12' },
          ].map((l) => (
            <span key={l.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.c }} />
              {l.l}
            </span>
          ))}
        </div>

        {/* Selected pin info */}
        <div style={opStyles.mapInfo}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--ramp-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StrokeIcon name="streetlight-on" size={16} color="var(--brand-glow-deep)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>路灯 · Lamp {selected}</div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>南山 · Q-12 街区</div>
              </div>
            </div>
            <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: 'var(--status-online-bg)', color: '#065F46', fontWeight: 600 }}>在线</span>
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
            <div><div style={{ color: 'var(--fg-3)', fontSize: 10 }}>亮度</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>60%</div></div>
            <div><div style={{ color: 'var(--fg-3)', fontSize: 10 }}>功率</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>42 W</div></div>
            <div><div style={{ color: 'var(--fg-3)', fontSize: 10 }}>信号</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>-67 dBm</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Alerts ----------
const Alerts = () => {
  const items = [
    { id: 'B07', sev: 'alarm', title: '失联 · Offline', meta: 'Q-08 · 12 min ago', dur: '12m' },
    { id: 'C09', sev: 'warn', title: '电流异常 · Current spike', meta: 'Q-12 · 38 min ago', dur: '38m' },
    { id: 'D01', sev: 'alarm', title: '失联 · Offline', meta: 'Q-19 · 2h ago', dur: '2h' },
    { id: 'E11', sev: 'warn', title: '亮度低于阈值 · Below dim threshold', meta: 'Q-04 · 3h ago', dur: '3h' },
    { id: 'F02', sev: 'maint', title: '已计划维护 · Maintenance scheduled', meta: 'tomorrow 09:00', dur: '—' },
  ];
  const sevColor = (s) => ({ alarm: 'var(--status-alarm)', warn: 'var(--status-warn)', maint: 'var(--status-maint)' }[s]);
  const sevBg = (s) => ({ alarm: 'var(--status-alarm-bg)', warn: 'var(--status-warn-bg)', maint: 'var(--status-maint-bg)' }[s]);
  return (
    <div style={opStyles.panel}>
      <div style={opStyles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StrokeIcon name="alert" size={16} color="var(--status-alarm)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>实时告警 · Alerts</span>
          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--status-alarm-bg)', color: 'var(--status-alarm)', fontWeight: 600 }}>7</span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--brand-civic)', cursor: 'pointer' }}>全部 →</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 280, overflowY: 'auto' }}>
        {items.map((it) => (
          <div key={it.id} style={opStyles.alertRow}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sevColor(it.sev), marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: sevColor(it.sev) }}>{it.id}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-1)' }}>{it.title}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>{it.meta}</div>
            </div>
            <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: sevBg(it.sev), color: sevColor(it.sev), fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{it.dur}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Energy chart ----------
const EnergyChart = () => {
  const bars = [42, 38, 31, 28, 26, 30, 48, 62, 70, 74, 72, 68, 64, 60, 58, 56, 52, 64, 82, 88, 84, 76, 64, 48];
  const max = 100;
  return (
    <div style={opStyles.panel}>
      <div style={opStyles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StrokeIcon name="energy" size={16} color="var(--brand-glow-deep)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>24h 能耗 · Energy</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['24h', '7d', '30d'].map((t, i) => (
            <span key={t} style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 6,
              background: i === 0 ? 'var(--bg-sunken)' : 'transparent',
              color: i === 0 ? 'var(--fg-1)' : 'var(--fg-2)',
              fontWeight: i === 0 ? 600 : 500, cursor: 'pointer',
            }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 26, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--brand-glow-deep)', letterSpacing: '-0.02em' }}>1,486</span>
          <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>kWh used today</span>
          <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 999, background: 'var(--status-online-bg)', color: '#065F46', fontWeight: 600 }}>−14% YoY</span>
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 90 }}>
          {bars.map((v, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              background: i === 18 ? 'var(--brand-glow)' : `var(--ramp-${Math.min(5, Math.max(1, Math.floor(v / 20)))})`,
              borderRadius: '2px 2px 0 0',
              minHeight: 4,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
          <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
        </div>
      </div>
    </div>
  );
};

// ---------- Device table ----------
const DeviceTable = () => {
  const rows = [
    { id: 'A24', name: '路灯 A24', block: 'Q-12 西', status: 'online', dim: 60, w: 42, last: '2s' },
    { id: 'A30', name: '路灯 A30', block: 'Q-12 西', status: 'online', dim: 60, w: 41, last: '1s' },
    { id: 'B07', name: '路灯 B07', block: 'Q-08 中', status: 'alarm', dim: 0, w: 0, last: '12m' },
    { id: 'C09', name: '路灯 C09', block: 'Q-12 东', status: 'warn', dim: 60, w: 78, last: '4s' },
    { id: 'C15', name: '路灯 C15', block: 'Q-15 南', status: 'online', dim: 60, w: 42, last: '2s' },
    { id: 'D01', name: '路灯 D01', block: 'Q-19 北', status: 'offline', dim: 0, w: 0, last: '2h' },
    { id: 'E04', name: '路灯 E04', block: 'Q-04 海', status: 'online', dim: 75, w: 51, last: '3s' },
  ];
  const sevC = (s) => ({ online: '#10B981', warn: '#F59E0B', alarm: '#EF4444', offline: '#94A3B8' }[s]);
  const sevBg = (s) => ({ online: 'var(--status-online-bg)', warn: 'var(--status-warn-bg)', alarm: 'var(--status-alarm-bg)', offline: '#E2E8F0' }[s]);
  const sevLabel = (s) => ({ online: '在线', warn: '降级', alarm: '故障', offline: '离线' }[s]);
  return (
    <div style={opStyles.panel}>
      <div style={opStyles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StrokeIcon name="streetlight" size={16} color="var(--fg-1)" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>设备列表 · Devices</span>
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>1,284 total</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={opStyles.btnGhost}><StrokeIcon name="filter" size={12} color="var(--fg-2)" />筛选</button>
          <button style={opStyles.btnGhost}><StrokeIcon name="plus" size={12} color="var(--fg-2)" />新增</button>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: 'var(--bg-sunken)' }}>
            {['ID', '设备', '街区', '状态', '亮度', '功率', '信号'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 600, color: 'var(--fg-2)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)', fontWeight: 500 }}>{r.id}</td>
              <td style={{ padding: '10px 14px', color: 'var(--fg-1)', fontWeight: 500 }}>{r.name}</td>
              <td style={{ padding: '10px 14px', color: 'var(--fg-2)' }}>{r.block}</td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: sevBg(r.status), color: sevC(r.status), fontWeight: 600 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: sevC(r.status) }} />
                  {sevLabel(r.status)}
                </span>
              </td>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{r.dim}%</td>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{r.w} W</td>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', fontSize: 11 }}>{r.last} ago</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------- Main ----------
const OperatorApp = () => (
  <div style={opStyles.shell}>
    <Sidebar />
    <main style={opStyles.main}>
      <TopBar />
      <div style={opStyles.kpiRow}>
        <KPI label="在线路灯" labelEN="Online" value="1,247" unit="/ 1,284" delta="0.4%" deltaSign="+" accent="var(--brand-glow-deep)" spark={<Sparkline />} />
        <KPI label="待处理告警" labelEN="Active alerts" value="07" unit="" delta="2" deltaSign="+" accent="var(--status-alarm)" spark={<Sparkline color="var(--status-alarm)" />} />
        <KPI label="今日能耗" labelEN="Today kWh" value="1,486" unit="kWh" delta="14%" deltaSign="−" spark={<Sparkline color="var(--brand-civic)" />} />
        <KPI label="本月节能" labelEN="Saved" value="84.2k" unit="kWh" delta="14% YoY" deltaSign="+" accent="var(--brand-glow-deep)" spark={<Sparkline />} />
      </div>
      <div style={opStyles.gridA}>
        <MapPanel />
        <Alerts />
      </div>
      <div style={opStyles.gridB}>
        <EnergyChart />
        <DeviceTable />
      </div>
    </main>
  </div>
);

const opStyles = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' },
  sidebar: {
    width: 232, flexShrink: 0,
    background: 'var(--bg-canvas)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    minHeight: '100vh',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 10,
    fontSize: 13, cursor: 'pointer', textDecoration: 'none',
  },
  main: { flex: 1, padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 },
  topbar: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  search: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)', borderRadius: 10, width: 320,
  },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13, fontFamily: 'inherit', color: 'var(--fg-1)' },
  kbd: { fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 5px', background: 'var(--bg-sunken)', color: 'var(--fg-3)', borderRadius: 4, border: '1px solid var(--border)' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--brand-glow)', color: '#052E2A', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg-elevated)', color: 'var(--fg-1)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'transparent', color: 'var(--fg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  kpi: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 16,
    boxShadow: '0 1px 2px rgba(11,18,32,0.04)',
  },
  gridA: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, minHeight: 480 },
  gridB: { display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14 },
  panel: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 2px rgba(11,18,32,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  panelHeader: { padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  mapPanel: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 1px 2px rgba(11,18,32,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  mapHeader: { padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  mapLegend: {
    position: 'absolute', top: 14, left: 14,
    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-mono)',
  },
  mapInfo: {
    position: 'absolute', bottom: 14, right: 14,
    background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    padding: 14, borderRadius: 12, border: '1px solid var(--border)',
    width: 240, boxShadow: '0 4px 12px rgba(11,18,32,0.06)',
  },
  alertRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' },
};

window.LuminodeOperatorApp = OperatorApp;
