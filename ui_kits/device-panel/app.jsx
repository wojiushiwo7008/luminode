// Luminode device-panel — fully interactive mobile/kiosk hardware control

const { useState, useCallback } = React;

const FILTERS = {
  fg1:      'brightness(0) saturate(100%) invert(8%) sepia(13%) saturate(1600%) hue-rotate(190deg) brightness(98%) contrast(98%)',
  fg2:      'brightness(0) saturate(100%) invert(42%) sepia(8%) saturate(380%) hue-rotate(180deg)',
  fg3:      'brightness(0) saturate(100%) invert(64%) sepia(6%) saturate(280%) hue-rotate(180deg)',
  glow:     'brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(700%) hue-rotate(125deg) brightness(95%)',
  glowDeep: 'brightness(0) saturate(100%) invert(36%) sepia(78%) saturate(580%) hue-rotate(135deg) brightness(85%)',
  civic:    'brightness(0) saturate(100%) invert(20%) sepia(80%) saturate(2400%) hue-rotate(218deg) brightness(82%)',
  alarm:    'brightness(0) saturate(100%) invert(33%) sepia(90%) saturate(3500%) hue-rotate(345deg) brightness(95%)',
  warn:     'brightness(0) saturate(100%) invert(55%) sepia(90%) saturate(800%) hue-rotate(0deg) brightness(100%)',
  white:    'brightness(0) invert(1)',
};
const Ic = ({ name, size = 22, c = 'fg1', style = {} }) => (
  <img src={`../../assets/icons/${name}.svg`} width={size} height={size} alt=""
       style={{ display: 'block', filter: FILTERS[c], ...style }} />
);

// ======================= SHARED HEADER =======================
const Header = ({ online, lastSeen }) => (
  <div style={dp.header}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <img src="../../assets/logo/luminode-mark.svg" width="34" height="34" alt="" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          Luminode <span style={{ color: 'var(--fg-2)', fontWeight: 500, marginLeft: 3 }}>智慧路灯</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: online ? 'var(--status-online)' : 'var(--status-offline)',
            boxShadow: online ? '0 0 0 3px rgba(16,185,129,0.18)' : 'none' }} />
          {online ? '在线 · OneNET' : '离线 · Offline'}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>· {lastSeen}</span>
        </div>
      </div>
    </div>
    <button style={dp.iconBtn} aria-label="Settings"><Ic name="settings" size={16} c="fg2" /></button>
  </div>
);

// ======================= SENSOR CARD =======================
const SensorCard = ({ icon, label, labelEN, value, unit, ramp, accent, iconColor = 'civic', onClick }) => (
  <div onClick={onClick} style={{ ...dp.sensorCard, ...(accent ? { borderColor: 'var(--brand-glow)' } : {}), cursor: onClick ? 'pointer' : 'default' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: ramp || 'var(--ramp-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic name={icon} size={20} c={iconColor} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>LIVE</span>
    </div>
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--fg-1)', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>{value}</span>
        <span style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 500 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 3, fontSize: 11, color: 'var(--fg-2)' }}>{label} <span style={{ color: 'var(--fg-3)' }}>· {labelEN}</span></div>
    </div>
  </div>
);

// ======================= CONTROL ROW =======================
const ControlRow = ({ icon, label, labelEN, on, onToggle }) => (
  <button onClick={onToggle} style={{
    ...dp.controlRow, borderColor: on ? 'var(--brand-glow)' : 'var(--border)',
    boxShadow: on ? '0 0 0 3px rgba(20,184,166,0.10)' : 'none',
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: on ? 'var(--ramp-1)' : 'var(--bg-sunken)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      transition: 'background 200ms cubic-bezier(0.22,1,0.36,1)' }}>
      <Ic name={icon} size={22} c={on ? 'glowDeep' : 'fg2'} />
    </div>
    <div style={{ flex: 1, textAlign: 'left' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>{labelEN} · {on ? '开启 ON' : '关闭 OFF'}</div>
    </div>
    <span style={{ width: 44, height: 26, borderRadius: 999, position: 'relative', flexShrink: 0,
      background: on ? 'var(--brand-glow)' : 'var(--n-200)', transition: 'background 200ms cubic-bezier(0.22,1,0.36,1)' }}>
      <span style={{ position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)' }} />
    </span>
  </button>
);

// ======================= DIM SLIDER =======================
const DimSlider = ({ value, onChange }) => (
  <div style={dp.dimCard}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ramp-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name="streetlight-on" size={20} c="glowDeep" />
        </div>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>路灯亮度 · Dim</div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>A24 · 西街区</div></div>
      </div>
      <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--brand-glow-deep)', letterSpacing: '-0.02em' }}>
        {value}<span style={{ fontSize: 13 }}>%</span></div>
    </div>
    <div style={{ marginTop: 14, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '100%', height: 6, background: 'var(--n-100)', borderRadius: 999, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${value}%`, background: 'linear-gradient(90deg, var(--brand-glow-soft), var(--brand-glow))', borderRadius: 999 }} />
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'absolute', left: 0, right: 0, width: '100%', opacity: 0, height: 24, margin: 0, cursor: 'pointer' }} />
      <div style={{ position: 'absolute', left: `calc(${value}% - 11px)`, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 0 0 2px var(--brand-glow), 0 2px 8px rgba(11,18,32,0.18)', pointerEvents: 'none' }} />
    </div>
    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
      <span>0%</span><span>50%</span><span>100%</span></div>
  </div>
);

// ======================= SCHEDULE (with editor) =======================
const ScheduleStrip = ({ schedule, onEdit }) => (
  <div style={dp.scheduleCard}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ic name="clock" size={16} c="civic" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>自动调度 · Schedule</span>
      </div>
      <span onClick={onEdit} style={{ fontSize: 11, color: 'var(--brand-civic)', fontWeight: 500, cursor: 'pointer' }}>编辑 →</span>
    </div>
    <div style={{ marginTop: 12, position: 'relative', height: 32 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-sunken)', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${(schedule.onHour / 24) * 100}%`, background: 'var(--ramp-2)' }} />
        <div style={{ width: `${((schedule.offHour - schedule.onHour) / 24) * 100}%`, background: 'var(--ramp-4)' }} />
        <div style={{ flex: 1, background: 'var(--ramp-2)' }} />
      </div>
      <div style={{ position: 'absolute', top: -2, bottom: -2, left: '78%', width: 2, background: 'var(--brand-amber)', boxShadow: '0 0 0 2px rgba(245,158,11,0.25)' }} />
    </div>
    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
      <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
    </div>
    <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--fg-2)', display: 'flex', gap: 12, fontFamily: 'var(--font-mono)' }}>
      <span>开灯 {String(schedule.onHour).padStart(2,'0')}:00</span>
      <span>关灯 {String(schedule.offHour).padStart(2,'0')}:00</span>
      <span>亮度 {schedule.dim}%</span>
    </div>
  </div>
);

const ScheduleEditor = ({ schedule, onChange, onClose }) => {
  const set = (k, v) => onChange({ ...schedule, [k]: v });
  return (
    <div style={dp.sheet}>
      <div style={dp.sheetHandle} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>编辑调度 · Edit schedule</span>
        <button onClick={onClose} style={{ ...dp.iconBtn, width: 28, height: 28 }}><Ic name="close" size={14} c="fg2" /></button>
      </div>
      {[
        { label: '开灯时间 · Turn on', key: 'onHour', min: 0, max: 23 },
        { label: '关灯时间 · Turn off', key: 'offHour', min: 0, max: 23 },
        { label: '运行亮度 · Brightness', key: 'dim', min: 10, max: 100 },
      ].map((f) => (
        <div key={f.key} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: 'var(--fg-2)' }}>{f.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brand-glow-deep)' }}>
              {f.key === 'dim' ? `${schedule[f.key]}%` : `${String(schedule[f.key]).padStart(2, '0')}:00`}
            </span>
          </div>
          <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 5, background: 'var(--n-100)', borderRadius: 999 }}>
              <div style={{ height: '100%', width: `${((schedule[f.key] - f.min) / (f.max - f.min)) * 100}%`, background: 'var(--brand-glow)', borderRadius: 999 }} />
            </div>
            <input type="range" min={f.min} max={f.max} step={f.key === 'dim' ? 5 : 1} value={schedule[f.key]}
              onChange={(e) => set(f.key, Number(e.target.value))}
              style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, height: 24, margin: 0, cursor: 'pointer' }} />
            <div style={{ position: 'absolute', left: `calc(${((schedule[f.key] - f.min) / (f.max - f.min)) * 100}% - 10px)`,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              boxShadow: '0 0 0 2px var(--brand-glow), 0 2px 6px rgba(11,18,32,0.15)', pointerEvents: 'none' }} />
          </div>
        </div>
      ))}
      <button onClick={onClose} style={{ ...dp.btnPrimary, width: '100%', marginTop: 6, justifyContent: 'center' }}>
        保存调度 · Save
      </button>
    </div>
  );
};

// ======================= TAB: 总览 Overview =======================
const OverviewTab = ({ fan, setFan, light, setLight, sprayer, setSprayer, pump, setPump, dim, setDim, schedule, setSchedule, setSchedEdit }) => (
  <div>
    <div style={{ padding: '0 16px', marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SensorCard icon="temperature" label="温度" labelEN="Temp" value="24.6" unit="°C" ramp="#FEF3C7" iconColor="alarm" />
        <SensorCard icon="humidity" label="湿度" labelEN="Humidity" value="58" unit="%" ramp="#DBEAFE" iconColor="civic" />
        <SensorCard icon="air-quality" label="PM2.5" labelEN="Air" value="42" unit="μg/m³" ramp="var(--ramp-1)" iconColor="glowDeep" accent />
        <SensorCard icon="wind" label="风速" labelEN="Wind" value="3.2" unit="m/s" ramp="#EDE9FE" iconColor="civic" />
      </div>
    </div>
    <div style={{ padding: '12px 16px 0' }}><DimSlider value={dim} onChange={setDim} /></div>
    <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', padding: '0 4px', marginBottom: 2 }}>
        设备控制 · Controls
      </div>
      <ControlRow icon="streetlight-on" label="路灯" labelEN="Streetlight" on={light} onToggle={() => setLight(!light)} />
      <ControlRow icon="fan" label="散热风扇" labelEN="Fan" on={fan} onToggle={() => setFan(!fan)} />
      <ControlRow icon="sprayer" label="喷雾器" labelEN="Sprayer" on={sprayer} onToggle={() => setSprayer(!sprayer)} />
      <ControlRow icon="water-pump" label="抽水泵" labelEN="Water pump" on={pump} onToggle={() => setPump(!pump)} />
    </div>
    <div style={{ padding: '12px 16px 20px' }}>
      <ScheduleStrip schedule={schedule} onEdit={() => setSchedEdit(true)} />
    </div>
  </div>
);

// ======================= TAB: 设备 Devices =======================
const devices = [
  { id: 'A24', name: '路灯 A24', block: '西街区', status: 'online', dim: 60, signal: -67 },
  { id: 'A30', name: '路灯 A30', block: '西街区', status: 'online', dim: 60, signal: -72 },
  { id: 'B07', name: '路灯 B07', block: '中段', status: 'alarm', dim: 0, signal: 0 },
  { id: 'C09', name: '路灯 C09', block: '东段', status: 'warn', dim: 60, signal: -54 },
  { id: 'D01', name: '路灯 D01', block: '北街区', status: 'offline', dim: 0, signal: 0 },
  { id: 'E04', name: '路灯 E04', block: '滨海', status: 'online', dim: 75, signal: -61 },
  { id: 'F02', name: '风扇 F02', block: '西街区', status: 'online', dim: 0, signal: -55 },
  { id: 'G01', name: '喷雾器 G01', block: '公园', status: 'online', dim: 0, signal: -48 },
];
const statusInfo = { online: { label: '在线', color: '#10B981', bg: '#D1FAE5' }, warn: { label: '降级', color: '#F59E0B', bg: '#FEF3C7' }, alarm: { label: '故障', color: '#EF4444', bg: '#FEE2E2' }, offline: { label: '离线', color: '#94A3B8', bg: '#E2E8F0' } };

const DeviceDetail = ({ device, onBack }) => (
  <div style={{ padding: '0 16px' }}>
    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--brand-civic)' }}>
      ← 返回列表
    </button>
    <div style={{ ...dp.sensorCard, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{device.name}</div>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: statusInfo[device.status].bg, color: statusInfo[device.status].color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo[device.status].color }} />
          {statusInfo[device.status].label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>ID: {device.id} · 街区: {device.block}</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={dp.sensorCard}>
        <div style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>亮度 DIM</div>
        <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 500, marginTop: 6, color: 'var(--brand-glow-deep)' }}>{device.dim}%</div>
      </div>
      <div style={dp.sensorCard}>
        <div style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>信号 SIGNAL</div>
        <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 500, marginTop: 6 }}>{device.signal || '—'}<span style={{ fontSize: 12 }}> dBm</span></div>
      </div>
    </div>
    <div style={{ ...dp.sensorCard, marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>运行日志 · Log</div>
      {['18:42 亮度调整至 60%', '18:30 设备上线', '06:15 关灯', '00:00 亮度调整至 40%'].map((l, i) => (
        <div key={i} style={{ padding: '8px 0', borderTop: i ? '1px solid var(--border)' : 'none', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{l}</div>
      ))}
    </div>
  </div>
);

const DevicesTab = () => {
  const [sel, setSel] = useState(null);
  const selDev = devices.find((d) => d.id === sel);
  if (selDev) return <DeviceDetail device={selDev} onBack={() => setSel(null)} />;
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 10 }}>
        设备列表 · {devices.length} devices
      </div>
      {devices.map((d) => {
        const s = statusInfo[d.status];
        return (
          <div key={d.id} onClick={() => setSel(d.id)} style={{ ...dp.controlRow, marginBottom: 8, cursor: 'pointer', gap: 10, padding: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic name={d.name.includes('风扇') ? 'fan' : d.name.includes('喷雾') ? 'sprayer' : 'streetlight'} size={18} c={d.status === 'alarm' ? 'alarm' : d.status === 'warn' ? 'warn' : d.status === 'online' ? 'glowDeep' : 'fg3'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--fg-2)', marginTop: 1 }}>{d.block} · {d.id}</div>
            </div>
            <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />{s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ======================= TAB: 能耗 Energy =======================
const EnergyTab = () => {
  const bars = [42,38,31,28,26,30,48,62,70,74,72,68,64,60,58,56,52,64,82,88,84,76,64,48];
  const max = 100;
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ ...dp.sensorCard, marginBottom: 12 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>今日能耗 · Today</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 32, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--brand-glow-deep)' }}>1,486</span>
          <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>kWh</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 999, background: '#D1FAE5', color: '#065F46', fontWeight: 600 }}>−14%</span>
        </div>
      </div>
      <div style={{ ...dp.sensorCard, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>24小时用电 · kWh/h</div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 100 }}>
          {bars.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${(v/max)*100}%`, background: i === 18 ? 'var(--brand-glow)' : `var(--ramp-${Math.min(5,Math.max(1,Math.floor(v/20)))})`, borderRadius: '2px 2px 0 0', minHeight: 3 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
          <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={dp.sensorCard}>
          <div style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>本月节能 SAVED</div>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--brand-glow-deep)', marginTop: 6 }}>84.2k<span style={{ fontSize: 11, color: 'var(--fg-2)' }}> kWh</span></div>
        </div>
        <div style={dp.sensorCard}>
          <div style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>同比 YoY</div>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 500, color: '#065F46', marginTop: 6 }}>−14%</div>
        </div>
      </div>
    </div>
  );
};

// ======================= TAB: 我的 Me =======================
const MeTab = () => (
  <div style={{ padding: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand-civic)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>WL</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>王立 · Wang Li</div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>区调度员 · Operator</div>
      </div>
    </div>
    {[
      { icon: 'settings', label: '设置 · Settings' },
      { icon: 'alert', label: '告警偏好 · Alert prefs' },
      { icon: 'wifi', label: '连接配置 · Connection' },
      { icon: 'download', label: '数据导出 · Export' },
      { icon: 'external', label: '关于 · About' },
    ].map((item) => (
      <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', borderBottom: '1px solid var(--border)' }}>
        <Ic name={item.icon} size={18} c="fg2" />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
        <Ic name="arrow-right" size={14} c="fg3" />
      </div>
    ))}
    <div style={{ marginTop: 24, fontSize: 11, color: 'var(--fg-3)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Luminode v2.4.1 · OneNET IoT
    </div>
  </div>
);

// ======================= TAB BAR =======================
const TabBar = ({ tab, setTab }) => (
  <div style={dp.tabBar}>
    {[
      { key: 'overview', icon: 'dashboard', label: '总览' },
      { key: 'devices', icon: 'map-pin', label: '设备' },
      { key: 'energy', icon: 'chart', label: '能耗' },
      { key: 'me', icon: 'user', label: '我的' },
    ].map((t) => (
      <div key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
        <Ic name={t.icon} size={20} c={tab === t.key ? 'glowDeep' : 'fg3'} />
        <span style={{ fontSize: 10, fontWeight: tab === t.key ? 600 : 500, color: tab === t.key ? 'var(--brand-glow-deep)' : 'var(--fg-3)' }}>{t.label}</span>
      </div>
    ))}
  </div>
);

// ======================= MAIN APP =======================
const App = () => {
  const [tab, setTab] = useState('overview');
  const [fan, setFan] = useState(true);
  const [light, setLight] = useState(true);
  const [sprayer, setSprayer] = useState(false);
  const [pump, setPump] = useState(false);
  const [dim, setDim] = useState(60);
  const [schedule, setSchedule] = useState({ onHour: 6, offHour: 18, dim: 60 });
  const [schedEdit, setSchedEdit] = useState(false);

  return (
    <div style={dp.shell}>
      <Header online={true} lastSeen="2s ago" />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {tab === 'overview' && <OverviewTab {...{ fan, setFan, light, setLight, sprayer, setSprayer, pump, setPump, dim, setDim, schedule, setSchedule, setSchedEdit }} />}
        {tab === 'devices' && <DevicesTab />}
        {tab === 'energy' && <EnergyTab />}
        {tab === 'me' && <MeTab />}
      </div>
      <TabBar tab={tab} setTab={setTab} />

      {/* Schedule editor bottom sheet */}
      {schedEdit && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
          <div onClick={() => setSchedEdit(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(11,18,32,0.4)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <ScheduleEditor schedule={schedule} onChange={setSchedule} onClose={() => setSchedEdit(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const dp = {
  shell: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: 'var(--font-sans)', paddingTop: 60, position: 'relative' },
  header: { padding: '8px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 },
  sensorCard: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, boxShadow: '0 1px 2px rgba(11,18,32,0.04)' },
  controlRow: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms cubic-bezier(0.22,1,0.36,1)' },
  dimCard: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(11,18,32,0.06)' },
  scheduleCard: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', paddingBottom: 16, zIndex: 50 },
  sheet: { background: 'var(--bg-elevated)', borderRadius: '20px 20px 0 0', padding: '12px 20px 28px', boxShadow: '0 -8px 32px rgba(11,18,32,0.12)' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, background: 'var(--n-200)', margin: '0 auto 14px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', background: 'var(--brand-glow)', color: '#052E2A', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};

window.LuminodeDeviceApp = App;
