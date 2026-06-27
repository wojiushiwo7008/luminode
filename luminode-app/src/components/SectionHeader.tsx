import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/tokens';

interface Props {
  title: string;
  titleEN: string;
  action?: string;
  onAction?: () => void;
  badge?: number;
  badgeColor?: string;
  badgeBg?: string;
}

export default function SectionHeader({ title, titleEN, action, onAction, badge, badgeColor, badgeBg }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>
        {title} <Text style={styles.en}>· {titleEN}</Text>
      </Text>
      {badge !== undefined && (
        <View style={[styles.badge, { backgroundColor: badgeBg ?? Colors.statusAlarmBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor ?? Colors.statusAlarm }]}>{badge}</Text>
        </View>
      )}
      {action && (
        <TouchableOpacity onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.fg1,
    flex: 1,
  },
  en: {
    fontWeight: '400',
    color: Colors.fg3,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  action: {
    paddingLeft: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.brandCivic,
    fontWeight: '500',
  },
});
