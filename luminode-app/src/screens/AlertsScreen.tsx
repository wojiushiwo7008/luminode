import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius } from '../theme/tokens';
import AlertRow, { SeverityKey } from '../components/AlertRow';
import { useAlerts } from '../hooks/useAlerts';
import { AlertItem as ApiAlertItem } from '../api/types';

const FILTERS: { key: 'all' | SeverityKey; label: string }[] = [
  { key: 'all',   label: '全部' },
  { key: 'alarm', label: '故障' },
  { key: 'warn',  label: '警告' },
  { key: 'maint', label: '维护' },
];

function fmtDur(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function AlertsScreen() {
  const [filter, setFilter] = useState<'all' | SeverityKey>('all');
  const { data: alerts, loading, error } = useAlerts();

  const all: ApiAlertItem[] = alerts ?? [];
  const data = filter === 'all' ? all : all.filter((a) => a.sev === filter);
  const alarmCount = all.filter((a) => a.sev === 'alarm').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>实时告警 · ALERTS</Text>
          <Text style={styles.title}>
            {all.length} 条告警
            <Text style={styles.subtitle}> · {alarmCount} 故障</Text>
          </Text>
        </View>
        <View style={[styles.alarmBadge, { backgroundColor: Colors.statusAlarmBg }]}>
          <Text style={[styles.alarmBadgeText, { color: Colors.statusAlarm }]}>{alarmCount}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.tab, filter === f.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === f.key && styles.tabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !alerts ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.brandGlow} />
      ) : error && !alerts ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: Colors.statusAlarm }]}>{error}</Text>
          <Text style={styles.emptySubtext}>检查后端 /alerts</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertRow
              item={{
                id: item.deviceName,
                sev: item.sev,
                title: item.title,
                meta: item.meta,
                dur: fmtDur(item.ts),
              }}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>一切正常</Text>
              <Text style={styles.emptySubtext}>All clear</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  eyebrow: { fontSize: 10, fontWeight: '600', color: Colors.fg3, letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.fg1, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '400', color: Colors.fg3 },
  alarmBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  alarmBadgeText: { fontSize: 16, fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.brandGlow,
    borderColor: Colors.brandGlow,
  },
  tabText: { fontSize: 13, color: Colors.fg2, fontWeight: '500' },
  tabTextActive: { color: Colors.fgOnGlow, fontWeight: '600' },

  list: { flex: 1 },
  listContent: {
    marginHorizontal: 16,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.fg1 },
  emptySubtext: { fontSize: 13, color: Colors.fg3, marginTop: 4 },
});
