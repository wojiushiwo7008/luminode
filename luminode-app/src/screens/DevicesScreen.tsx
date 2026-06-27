import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Shadow } from '../theme/tokens';
import { StatusKey, statusColor, statusBg, statusLabel } from '../theme/tokens';
import { useDevices } from '../hooks/useDevices';
import { useDevice } from '../hooks/useDevice';
import { DeviceSummary } from '../api/types';

function deriveStatus(d: DeviceSummary): StatusKey {
  if (!d.online) return 'offline';
  // 简单告警映射:csb 或 pwq 为 1 → 警告(alarm)
  if (d.csb === 1 || d.pwq === 1) return 'alarm';
  if (d.temp != null && d.temp >= 35) return 'warn';
  if (d.PM25 != null && d.PM25 >= 150) return 'warn';
  return 'online';
}

function fmtAgo(ts: number): string {
  if (!ts) return '从未上报';
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function DeviceDetail({ deviceName, onBack }: { deviceName: string; onBack: () => void }) {
  const { data, loading, error } = useDevice(deviceName, 3000);

  if (loading && !data) {
    return (
      <View style={[styles.scroll, { padding: 16 }]}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>← 返回列表</Text>
        </TouchableOpacity>
        <ActivityIndicator style={{ marginTop: 32 }} color={Colors.brandGlow} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>← 返回列表</Text>
        </TouchableOpacity>
        <View style={styles.detailCard}>
          <Text style={styles.detailName}>{deviceName}</Text>
          <Text style={[styles.detailMeta, { color: Colors.statusAlarm }]}>
            {error || '该设备从未上报过数据'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const status = deriveStatus(data);
  const color = statusColor[status];
  const bg = statusBg[status];
  const label = statusLabel[status];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← 返回列表</Text>
      </TouchableOpacity>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailName}>{data.displayName ?? data.deviceName}</Text>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color }]}>{label.cn}</Text>
          </View>
        </View>
        <Text style={styles.detailMeta}>
          ID: {data.deviceName} · 区块: {data.block ?? '—'} · {fmtAgo(data.lastSeen)}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>路灯 LED</Text>
          <Text style={styles.metricValue}>{data.led === 1 ? 'ON' : data.led === 0 ? 'OFF' : '—'}</Text>
        </View>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>温度 TEMP</Text>
          <Text style={styles.metricValue}>{data.temp != null ? `${data.temp}°C` : '—'}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>湿度 HUMI</Text>
          <Text style={styles.metricValue}>{data.humi != null ? `${data.humi}%` : '—'}</Text>
        </View>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>风速 WIND</Text>
          <Text style={styles.metricValue}>{data.wind != null ? `${data.wind} 级` : '—'}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>PM2.5</Text>
          <Text style={styles.metricValue}>
            {data.PM25 != null ? data.PM25 : '—'}
            <Text style={styles.metricUnit}> μg/m³</Text>
          </Text>
        </View>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>MQ-2</Text>
          <Text style={styles.metricValue}>{data.MQ2 != null ? data.MQ2 : '—'}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>喷雾器 PWQ</Text>
          <Text style={styles.metricValue}>{data.pwq === 1 ? 'ON' : data.pwq === 0 ? 'OFF' : '—'}</Text>
        </View>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>水泵 CSB</Text>
          <Text style={styles.metricValue}>{data.csb === 1 ? 'ON' : data.csb === 0 ? 'OFF' : '—'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function DevicesScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: devices, loading, error, refetch } = useDevices();

  if (selected) {
    return <DeviceDetail deviceName={selected} onBack={() => setSelected(null)} />;
  }

  if (loading && !devices) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brandGlow} />
        <Text style={styles.centerText}>加载设备列表…</Text>
      </View>
    );
  }

  if (error && !devices) {
    return (
      <View style={styles.center}>
        <Text style={[styles.centerText, { color: Colors.statusAlarm }]}>
          连不上后端: {error}
        </Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const list = devices ?? [];

  return (
    <FlatList
      data={list}
      keyExtractor={(d) => d.deviceName}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={styles.listHeader}>
          设备列表 · {list.length} devices · {list.filter((d) => d.online).length} online
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无设备</Text>
          <Text style={styles.emptySub}>后端 telemetry_latest 表为空</Text>
        </View>
      }
      renderItem={({ item: d }) => {
        const status = deriveStatus(d);
        const color = statusColor[status];
        const bg = statusBg[status];
        const label = statusLabel[status];
        const emoji = d.emoji ?? '🏮';
        return (
          <TouchableOpacity
            style={styles.deviceRow}
            onPress={() => setSelected(d.deviceName)}
            activeOpacity={0.75}
          >
            <View style={[styles.deviceIcon, { backgroundColor: bg }]}>
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{d.displayName ?? d.deviceName}</Text>
              <Text style={styles.deviceBlock}>
                {(d.block ?? '—')} · {d.deviceName} · {fmtAgo(d.lastSeen)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: color }]} />
              <Text style={[styles.badgeText, { color }]}>{label.cn}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  listContent: { padding: 14, gap: 8, paddingBottom: 24 },
  listHeader: {
    fontSize: 10, fontWeight: '700', color: Colors.fg2,
    letterSpacing: 0.8, marginBottom: 8,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, gap: 12 },
  centerText: { fontSize: 13, color: Colors.fg2 },
  retryBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.brandGlow, borderRadius: Radius.md,
  },
  retryBtnText: { fontSize: 13, color: Colors.fgOnGlow, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.fg1 },
  emptySub: { fontSize: 12, color: Colors.fg3, marginTop: 4 },

  deviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  deviceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 13, fontWeight: '600', color: Colors.fg1 },
  deviceBlock: { fontSize: 10.5, color: Colors.fg2, marginTop: 1 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Detail
  detailContent: { padding: 16, gap: 10, paddingBottom: 32 },
  back: { marginBottom: 4 },
  backText: { fontSize: 13, color: Colors.brandCivic, fontWeight: '500' },
  detailCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: 14, ...Shadow.sm,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailName: { fontSize: 18, fontWeight: '700', color: Colors.fg1 },
  detailMeta: { fontSize: 12, color: Colors.fg2, marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: 14, ...Shadow.sm,
  },
  metricLabel: { fontSize: 10, color: Colors.fg3, letterSpacing: 0.6, marginBottom: 6 },
  metricValue: { fontSize: 24, fontWeight: '500', color: Colors.brandGlowDeep, letterSpacing: -0.5 },
  metricUnit: { fontSize: 11, color: Colors.fg2, fontWeight: '400' },
});
