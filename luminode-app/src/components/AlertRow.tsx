import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/tokens';

export type SeverityKey = 'alarm' | 'warn' | 'maint';

export interface AlertItem {
  id: string;
  sev: SeverityKey;
  title: string;
  meta: string;
  dur: string;
}

const sevColor: Record<SeverityKey, string> = {
  alarm: Colors.statusAlarm,
  warn:  Colors.statusWarn,
  maint: Colors.statusMaint,
};
const sevBg: Record<SeverityKey, string> = {
  alarm: Colors.statusAlarmBg,
  warn:  Colors.statusWarnBg,
  maint: Colors.statusMaintBg,
};

export default function AlertRow({ item }: { item: AlertItem }) {
  const color = sevColor[item.sev];
  const bg = sevBg[item.sev];

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.id, { color }]}>{item.id}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={styles.meta}>{item.meta}</Text>
      </View>
      <View style={[styles.durBadge, { backgroundColor: bg }]}>
        <Text style={[styles.dur, { color }]}>{item.dur}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  id: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.fg1,
    flexShrink: 1,
  },
  meta: {
    fontSize: 11,
    color: Colors.fg2,
    marginTop: 2,
  },
  durBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'center',
  },
  dur: {
    fontSize: 11,
    fontWeight: '600',
  },
});
