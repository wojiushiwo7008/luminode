import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Path, G, Text as SvgText, Animate } from 'react-native-svg';
import { Colors, Radius, Shadow } from '../theme/tokens';
import StatusBadge from '../components/StatusBadge';
import { StatusKey } from '../theme/tokens';
import { useDevices } from '../hooks/useDevices';
import { DeviceSummary } from '../api/types';

const VBW = 500;
const VBH = 420;

function deriveStatus(d: DeviceSummary): StatusKey {
  if (!d.online) return 'offline';
  if (d.csb === 1 || d.pwq === 1) return 'alarm';
  if (d.temp != null && d.temp >= 35) return 'warn';
  if (d.PM25 != null && d.PM25 >= 150) return 'warn';
  return 'online';
}

const colorFor = (s: StatusKey) => ({
  online: '#10B981', warn: '#F59E0B', alarm: '#EF4444', offline: '#94A3B8', maint: '#8B5CF6',
}[s]);

const FILTERS = ['全部', '在线', '告警', '离线'] as const;

export default function MapScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('全部');
  const { data: devices, loading, error } = useDevices();

  const list = devices ?? [];
  const selectedDev = list.find((d) => d.deviceName === selected) ?? null;
  const onlineCount = list.filter((d) => d.online).length;
  const alarmCount = list.filter((d) => {
    const s = deriveStatus(d);
    return s === 'alarm' || s === 'warn';
  }).length;
  const offlineCount = list.filter((d) => !d.online).length;

  const filtered = list.filter((d) => {
    const s = deriveStatus(d);
    if (filter === '全部') return true;
    if (filter === '在线') return s === 'online';
    if (filter === '告警') return s === 'alarm' || s === 'warn';
    if (filter === '离线') return s === 'offline';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.eyebrow}>设备地图 · DEVICE MAP</Text>
          <Text style={styles.title}>
            Luminode  <Text style={styles.count}>{list.length} devices</Text>
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapContainer}>
        {loading && !devices ? (
          <ActivityIndicator color={Colors.brandGlow} style={{ marginTop: 80 }} />
        ) : error && !devices ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Svg width="100%" height="100%" viewBox={`0 0 ${VBW} ${VBH}`}>
            <Rect x={0} y={0} width={VBW} height={VBH} fill="#F0F4F7" />
            <Rect x={30} y={30} width={100} height={60} rx={4} fill="#E1F0E5" />
            <Rect x={350} y={50} width={130} height={90} rx={4} fill="#E1F0E5" />
            <Path d="M0 370 Q100 360 200 385 T400 400 L500 410 L500 420 L0 420 Z" fill="#D8E8F2" />
            <G stroke="#FFFFFF" strokeWidth={12} fill="none">
              <Path d="M0 100 L500 110" />
              <Path d="M0 210 L500 220" />
              <Path d="M0 310 L500 320" />
              <Path d="M110 0 L110 420" />
              <Path d="M260 0 L260 420" />
              <Path d="M420 0 L420 420" />
            </G>
            <SvgText x={120} y={52} fontFamily="System" fontSize={9} fill="#5E6A78" letterSpacing={1}>PARK 公园</SvgText>
            <SvgText x={18} y={207} fontFamily="System" fontSize={8} fill="#8A95A1">中山路</SvgText>
            <SvgText x={270} y={18} fontFamily="System" fontSize={8} fill="#8A95A1">滨海大道</SvgText>

            {filtered.map((d) => {
              if (!d.coord) return null; // 没配坐标就不画
              const status = deriveStatus(d);
              const isSel = d.deviceName === selected;
              const c = colorFor(status) ?? '#10B981';
              const cx = d.coord.x * VBW;
              const cy = d.coord.y * VBH;
              return (
                <G key={d.deviceName} onPress={() => setSelected(isSel ? null : d.deviceName)}>
                  {status === 'alarm' && (
                    <Circle cx={cx} cy={cy} r={12} fill={c} fillOpacity={0.18}>
                      <Animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                      <Animate attributeName="fill-opacity" values="0.22;0.05;0.22" dur="2s" repeatCount="indefinite" />
                    </Circle>
                  )}
                  {isSel && <Circle cx={cx} cy={cy} r={13} fill="none" stroke={Colors.brandGlow} strokeWidth={2} />}
                  <Circle cx={cx} cy={cy} r={6} fill={c} stroke="#fff" strokeWidth={2} />
                  {isSel && (
                    <SvgText x={cx + 10} y={cy + 4} fontFamily="System" fontSize={11} fontWeight="bold" fill={Colors.brandNight}>
                      {d.deviceName}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>在线 {onlineCount}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>告警 {alarmCount}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={styles.legendText}>离线 {offlineCount}</Text>
          </View>
        </View>
      </View>

      {selectedDev && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View>
              <Text style={styles.infoId}>{selectedDev.displayName ?? selectedDev.deviceName}</Text>
              <Text style={styles.infoBlock}>{selectedDev.block ?? selectedDev.deviceName}</Text>
            </View>
            <StatusBadge status={deriveStatus(selectedDev)} />
          </View>
          <View style={styles.infoMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>LED</Text>
              <Text style={styles.metricValue}>
                {selectedDev.led === 1 ? 'ON' : selectedDev.led === 0 ? 'OFF' : '—'}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>温度</Text>
              <Text style={styles.metricValue}>
                {selectedDev.temp != null ? `${selectedDev.temp}°C` : '—'}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>PM2.5</Text>
              <Text style={styles.metricValue}>
                {selectedDev.PM25 != null ? selectedDev.PM25 : '—'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topbar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  eyebrow: { fontSize: 10, fontWeight: '600', color: Colors.fg3, letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.fg1, letterSpacing: -0.5, marginTop: 2 },
  count: { fontSize: 13, fontWeight: '400', color: Colors.fg3 },

  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  chipActive: {
    backgroundColor: Colors.brandNight,
    borderColor: Colors.brandNight,
  },
  chipText: { fontSize: 12, color: Colors.fg2, fontWeight: '500' },
  chipTextActive: { color: Colors.brandGlowSoft },

  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  errorText: { color: Colors.statusAlarm, padding: 24, fontSize: 13 },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 11, color: Colors.fg2 },

  infoCard: {
    margin: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoId: { fontSize: 15, fontWeight: '700', color: Colors.fg1 },
  infoBlock: { fontSize: 12, color: Colors.fg2, marginTop: 2 },
  infoMetrics: { flexDirection: 'row', gap: 16 },
  metric: {},
  metricLabel: { fontSize: 10, color: Colors.fg3, marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: '600', color: Colors.fg1 },
});
