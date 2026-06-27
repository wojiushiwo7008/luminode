import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors, Radius, Shadow } from '../theme/tokens';
import { useEnergy } from '../hooks/useEnergy';

const TARGET_DEVICE = 'lamp-A24';

const rampColor = (v: number, max: number) => {
  if (max <= 0) return Colors.ramp1;
  const pct = v / max;
  if (pct < 0.3) return Colors.ramp1;
  if (pct < 0.5) return Colors.ramp2;
  if (pct < 0.7) return Colors.brandGlow;
  return Colors.ramp4;
};

function BarChart({ values, currentIdx }: { values: number[]; currentIdx: number }) {
  const max = Math.max(0.001, ...values);
  const W = 300; const H = 90;
  const gap = 2;
  const bw = (W - gap * (values.length - 1)) / values.length;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * H);
        return (
          <Rect
            key={i}
            x={i * (bw + gap)} y={H - h}
            width={bw} height={h} rx={1.5}
            fill={i === currentIdx ? Colors.brandGlow : rampColor(v, max)}
          />
        );
      })}
    </Svg>
  );
}

export default function EnergyScreen() {
  const { data, loading, error, refetch } = useEnergy(TARGET_DEVICE);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brandGlow} />
        <Text style={styles.centerText}>加载能耗数据…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Text style={[styles.centerText, { color: Colors.statusAlarm }]}>
          后端无响应: {error}
        </Text>
      </View>
    );
  }

  const buckets = data?.buckets ?? [];
  // buckets 是 hour 23..0 顺序(23 小时前 → 现在);UI 上左老右新
  const values = buckets.map((b) => b.kwh);
  const currentIdx = values.length - 1;
  const todayKwh = data?.todayKwh ?? 0;
  const totalSamples = buckets.reduce((s, b) => s + b.samples, 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Today card */}
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>今日能耗 · {TARGET_DEVICE}</Text>
        <View style={styles.todayRow}>
          <Text style={styles.todayValue}>{todayKwh.toFixed(3)}</Text>
          <Text style={styles.todayUnit}>kWh</Text>
        </View>
        <Text style={styles.todayHint}>
          基于 LED on 时长 × 42W · 累计 {totalSamples} 帧采样
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>24小时用电 · kWh/h</Text>
        <View style={styles.chartBody}>
          {values.length > 0 ? <BarChart values={values} currentIdx={currentIdx} /> : null}
        </View>
        <View style={styles.chartLabels}>
          {['-24h', '-18h', '-12h', '-6h', '现在'].map((l) => (
            <Text key={l} style={styles.chartTick}>{l}</Text>
          ))}
        </View>
      </View>

      {/* Note */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>说明 · Note</Text>
        <Text style={styles.noteText}>
          数据来源 telemetry_history,启动后陆续积累。后端 30s 自动刷新,可下拉手动重试。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 14, gap: 10, paddingBottom: 24 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, gap: 12 },
  centerText: { fontSize: 13, color: Colors.fg2 },

  todayCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: 16, ...Shadow.sm,
  },
  todayLabel: { fontSize: 10, fontWeight: '700', color: Colors.fg2, letterSpacing: 0.8, marginBottom: 8 },
  todayRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  todayValue: { fontSize: 32, fontWeight: '500', color: Colors.brandGlowDeep, letterSpacing: -0.5 },
  todayUnit: { fontSize: 13, color: Colors.fg2 },
  todayHint: { fontSize: 11, color: Colors.fg3, marginTop: 6 },

  chartCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: 16, ...Shadow.sm,
  },
  chartTitle: { fontSize: 13, fontWeight: '600', color: Colors.fg1, marginBottom: 12 },
  chartBody: { height: 90, marginBottom: 6 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartTick: { fontSize: 10, color: Colors.fg3 },

  noteCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: 14, ...Shadow.sm,
  },
  noteTitle: { fontSize: 12, fontWeight: '600', color: Colors.fg1, marginBottom: 4 },
  noteText: { fontSize: 11, color: Colors.fg2, lineHeight: 16 },
});
