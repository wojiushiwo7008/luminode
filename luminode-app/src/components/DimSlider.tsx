import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Radius } from '../theme/tokens';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function DimSlider({ value, onChange }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>💡</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>路灯亮度 · Dim</Text>
          <Text style={styles.sub}>A24 · 西街区</Text>
        </View>
        <Text style={styles.value}>{value}<Text style={styles.pct}>%</Text></Text>
      </View>

      {/* Track */}
      <View style={styles.trackWrap}>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${value}%` as any }]} />
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor={Colors.brandGlow}
        />
      </View>

      <View style={styles.labels}>
        <Text style={styles.tick}>0%</Text>
        <Text style={styles.tick}>50%</Text>
        <Text style={styles.tick}>100%</Text>
      </View>
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
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.ramp1,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.fg1 },
  sub: { fontSize: 11, color: Colors.fg2, marginTop: 2 },
  value: { fontSize: 22, fontWeight: '500', color: Colors.brandGlowDeep, letterSpacing: -0.5 },
  pct: { fontSize: 13 },

  trackWrap: { height: 24, justifyContent: 'center' },
  trackBg: {
    height: 6,
    backgroundColor: Colors.bgSunken,
    borderRadius: 999,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.brandGlow,
    borderRadius: 999,
  },
  slider: {
    position: 'absolute',
    left: -10,
    right: -10,
    top: 0,
    bottom: 0,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  tick: { fontSize: 10, color: Colors.fg3 },
});
