import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Animated } from 'react-native';
import { Colors, Radius } from '../theme/tokens';

interface Props {
  emoji: string;
  label: string;
  labelEN: string;
  on: boolean;
  onToggle: () => void;
}

export default function ControlRow({ emoji, label, labelEN, on, onToggle }: Props) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[styles.row, on && styles.rowOn]}
    >
      <View style={[styles.iconWrap, { backgroundColor: on ? Colors.ramp1 : Colors.bgSunken }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub}>{labelEN} · {on ? '开启 ON' : '关闭 OFF'}</Text>
      </View>
      <Switch
        value={on}
        onValueChange={onToggle}
        trackColor={{ false: Colors.n200, true: Colors.brandGlow }}
        thumbColor="#fff"
        ios_backgroundColor={Colors.n200}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowOn: {
    borderColor: Colors.brandGlow,
    shadowColor: Colors.brandGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  body: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.fg1 },
  sub: { fontSize: 11, color: Colors.fg2, marginTop: 2 },
});
