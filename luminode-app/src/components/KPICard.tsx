import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../theme/tokens';
import Sparkline from './Sparkline';

interface Props {
  label: string;
  labelEN: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaSign?: '+' | '−' | '-';
  accent?: string;
  sparkColor?: string;
}

export default function KPICard({ label, labelEN, value, unit, delta, deltaSign, accent, sparkColor }: Props) {
  const isPositive = deltaSign === '+';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label} <Text style={styles.labelEN}>· {labelEN}</Text>
        </Text>
        {delta && (
          <View style={[styles.deltaBadge, { backgroundColor: isPositive ? Colors.statusOnlineBg : Colors.statusAlarmBg }]}>
            <Text style={[styles.deltaText, { color: isPositive ? '#065F46' : '#991B1B' }]}>
              {deltaSign}{delta}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: accent ?? Colors.fg1 }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Sparkline color={sparkColor ?? Colors.brandGlow} width={100} height={22} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: Colors.fg2,
    fontWeight: '500',
    flex: 1,
    flexShrink: 1,
  },
  labelEN: {
    color: Colors.fg3,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    marginLeft: 6,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: -0.5,
    color: Colors.fg1,
  },
  unit: {
    fontSize: 12,
    color: Colors.fg2,
  },
});
