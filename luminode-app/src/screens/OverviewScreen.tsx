import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../theme/tokens';
import ControlRow from '../components/ControlRow';
import { useDevice } from '../hooks/useDevice';

interface Props {
  light: boolean; setLight: (v: boolean) => void;
  sprayer: boolean; setSprayer: (v: boolean) => void;
  pump: boolean; setPump: (v: boolean) => void;
}

const DEVICE_NAME = 'lamp-A24';
const STALE_AFTER_MS = 30_000;
const LIVE_WITHIN_MS = 10_000;

function fmtNum(v: number | undefined, digits = 0): string {
  if (v == null || Number.isNaN(v)) return '—';
  return digits > 0 ? v.toFixed(digits) : String(Math.round(v));
}

// ---- Sensor Card ----
function SensorCard({ emoji, bg, label, labelEN, value, unit, accent, stale, live }: {
  emoji: string; bg: string; label: string; labelEN: string;
  value: string; unit: string; accent?: boolean; stale?: boolean; live?: boolean;
}) {
  return (
    <View style={[styles.sensorCard, accent && styles.sensorCardAccent, stale && styles.sensorCardStale]}>
      <View style={styles.sensorTop}>
        <View style={[styles.sensorIcon, { backgroundColor: bg }]}>
          <Text style={styles.sensorEmoji}>{emoji}</Text>
        </View>
        <Text style={[styles.live, stale && styles.staleLabel]}>
          {stale ? 'STALE' : live ? 'LIVE' : ''}
        </Text>
      </View>
      <View style={styles.sensorValue}>
        <Text style={styles.sensorNum}>{value}</Text>
        <Text style={styles.sensorUnit}>{unit}</Text>
      </View>
      <Text style={styles.sensorLabel}>{label} <Text style={styles.sensorEN}>· {labelEN}</Text></Text>
    </View>
  );
}

export default function OverviewScreen({ light, setLight, sprayer, setSprayer, pump, setPump }: Props) {
  const { data, error } = useDevice(DEVICE_NAME);
  const now = Date.now();
  const age = data ? now - data.lastSeen : Number.POSITIVE_INFINITY;
  const stale = !data || age > STALE_AFTER_MS || !!error;
  const live = !!data && age < LIVE_WITHIN_MS;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Sensor grid */}
      <View style={styles.sensorGrid}>
        <SensorCard emoji="🌡️" bg="#FEF3C7" label="温度" labelEN="Temp"
          value={fmtNum(data?.temp)} unit="°C" stale={stale} live={live} />
        <SensorCard emoji="💧" bg="#DBEAFE" label="湿度" labelEN="Humidity"
          value={fmtNum(data?.humi)} unit="%" stale={stale} live={live} />
        <SensorCard emoji="🌫️" bg={Colors.ramp1} label="PM2.5" labelEN="Air"
          value={fmtNum(data?.PM25)} unit="μg/m³" accent stale={stale} live={live} />
        <SensorCard emoji="🌬️" bg="#EDE9FE" label="风速" labelEN="Wind"
          value={fmtNum(data?.wind)} unit="级" stale={stale} live={live} />
      </View>

      {/* Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>设备控制 · CONTROLS</Text>
        <View style={styles.controls}>
          <ControlRow emoji="🏮" label="路灯"    labelEN="Streetlight" on={light}   onToggle={() => setLight(!light)}     />
          <ControlRow emoji="💦" label="喷雾器"  labelEN="Sprayer"    on={sprayer} onToggle={() => setSprayer(!sprayer)} />
          <ControlRow emoji="💧" label="抽水泵"  labelEN="Water pump" on={pump}    onToggle={() => setPump(!pump)}       />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },

  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  sensorCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.sm,
  },
  sensorCardAccent: { borderColor: Colors.brandGlow },
  sensorCardStale: { opacity: 0.5 },
  staleLabel: { color: Colors.fg3 },
  sensorTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sensorIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sensorEmoji: { fontSize: 18 },
  live: { fontSize: 10, color: Colors.fg3, letterSpacing: 0.6 },
  sensorValue: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  sensorNum: { fontSize: 26, fontWeight: '500', color: Colors.fg1, letterSpacing: -0.5 },
  sensorUnit: { fontSize: 12, color: Colors.fg2, fontWeight: '500' },
  sensorLabel: { fontSize: 11, color: Colors.fg2, marginTop: 3 },
  sensorEN: { color: Colors.fg3 },

  section: { paddingHorizontal: 12, marginBottom: 10 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.fg2,
    letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4,
  },
  controls: { gap: 8 },

  schedCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  schedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  schedTitle: { fontSize: 13, fontWeight: '600', color: Colors.fg1 },
  schedEdit: { fontSize: 11, color: Colors.brandCivic, fontWeight: '500' },
  schedBar: { height: 28, flexDirection: 'row', borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.bgSunken },
  schedLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  schedTick: { fontSize: 10, color: Colors.fg3 },
  schedInfo: { flexDirection: 'row', gap: 16, marginTop: 5 },
  schedInfoText: { fontSize: 11, color: Colors.fg2 },
});
