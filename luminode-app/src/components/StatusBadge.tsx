import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusKey, statusColor, statusBg, statusLabel } from '../theme/tokens';

interface Props {
  status: StatusKey;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const color = statusColor[status];
  const bg = statusBg[status];
  const label = statusLabel[status];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: color }, isSmall && styles.dotSm]} />
      <Text style={[styles.text, { color }, isSmall && styles.textSm]}>
        {label.cn}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
});
