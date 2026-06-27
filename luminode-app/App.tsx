import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Radius } from './src/theme/tokens';

import OverviewScreen from './src/screens/OverviewScreen';
import DevicesScreen  from './src/screens/DevicesScreen';
import EnergyScreen   from './src/screens/EnergyScreen';
import MeScreen       from './src/screens/MeScreen';
import { useDevice } from './src/hooks/useDevice';
import { usePublicIp } from './src/hooks/usePublicIp';
import { controlDevice } from './src/api/devices';

const Tab = createBottomTabNavigator();
const DEVICE_NAME = 'lamp-A24';
const STALE_AFTER_MS = 30_000;

function formatAge(lastSeen: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - lastSeen) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// Shared state lives here so all tabs can read controls
function AppShell() {
  const { data, error } = useDevice(DEVICE_NAME);
  const publicIp = usePublicIp();

  const [light,   setLightLocal]   = useState(true);
  const [sprayer, setSprayerLocal] = useState(false);
  const [pump,    setPumpLocal]    = useState(false);

  // 当后端推上来 led/pwq/csb 时,同步到本地 state(让 UI 反映真实硬件状态)
  React.useEffect(() => {
    if (data?.led != null)  setLightLocal(data.led === 1);
    if (data?.pwq != null)  setSprayerLocal(data.pwq === 1);
    if (data?.csb != null)  setPumpLocal(data.csb === 1);
  }, [data?.led, data?.pwq, data?.csb]);

  const makeSetter = useCallback(
    (key: 'led' | 'pwq' | 'csb', localSetter: (v: boolean) => void, label: string) =>
      async (v: boolean) => {
        const prev = key === 'led' ? light : key === 'pwq' ? sprayer : pump;
        localSetter(v);  // 乐观更新
        try {
          const r = await controlDevice(DEVICE_NAME, { [key]: v ? 1 : 0 } as any);
          if (r.error || r.rejected.length > 0) {
            localSetter(prev);  // 回滚
            Alert.alert(`${label} 下行失败`, r.error ?? `rejected: ${r.rejected.join(',')}`);
          }
        } catch (e: any) {
          localSetter(prev);
          Alert.alert(`${label} 下行失败`, String(e?.message ?? e));
        }
      },
    [light, sprayer, pump]
  );

  const setLight   = useCallback(makeSetter('led', setLightLocal,   '路灯'),   [makeSetter]);
  const setSprayer = useCallback(makeSetter('pwq', setSprayerLocal, '喷雾器'), [makeSetter]);
  const setPump    = useCallback(makeSetter('csb', setPumpLocal,    '抽水泵'), [makeSetter]);

  const now = Date.now();
  const age = data ? now - data.lastSeen : Number.POSITIVE_INFINITY;
  const online = !!data && age <= STALE_AFTER_MS && !error;
  const statusText = online ? '在线 · Aliyun' : '离线 · Aliyun';
  const lastSeenText = data ? `· ${formatAge(data.lastSeen)}` : '· —';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ---- Shared header ---- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <View>
            <Text style={styles.brand}>Luminode <Text style={styles.brandSub}>基于沁恒 CH32V307 的低碳智慧网联路灯</Text></Text>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, !online && styles.offlineDot]} />
              <Text style={styles.statusText}>{statusText}</Text>
              <Text style={styles.lastSeen}>{lastSeenText}</Text>
              {publicIp && <Text style={styles.publicIp}>· {publicIp}</Text>}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* ---- Tab navigator ---- */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.brandGlowDeep,
          tabBarInactiveTintColor: Colors.fg3,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Overview"
          options={{ tabBarLabel: '总览', tabBarIcon: ({ color }) => <TabIcon emoji="⊞" color={color} /> }}
        >
          {() => <OverviewScreen
            light={light} setLight={(v: boolean) => { void setLight(v); }}
            sprayer={sprayer} setSprayer={(v: boolean) => { void setSprayer(v); }}
            pump={pump} setPump={(v: boolean) => { void setPump(v); }} />}
        </Tab.Screen>
        <Tab.Screen
          name="Devices"
          options={{ tabBarLabel: '设备', tabBarIcon: ({ color }) => <TabIcon emoji="◎" color={color} /> }}
          component={DevicesScreen}
        />
        <Tab.Screen
          name="Energy"
          options={{ tabBarLabel: '能耗', tabBarIcon: ({ color }) => <TabIcon emoji="⚡" color={color} /> }}
          component={EnergyScreen}
        />
        <Tab.Screen
          name="Me"
          options={{ tabBarLabel: '我的', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
          component={MeScreen}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{emoji}</Text>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.bgElevated} />
      <NavigationContainer>
        <AppShell />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.bgElevated,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.brandGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: Colors.fgOnGlow, fontSize: 18, fontWeight: '800' },
  brand: { fontSize: 14.5, fontWeight: '700', color: Colors.fg1, letterSpacing: -0.2 },
  brandSub: { fontWeight: '500', color: Colors.fg2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.statusOnline,
  },
  offlineDot: { backgroundColor: Colors.fg3 },
  statusText: { fontSize: 11, color: Colors.fg2 },
  lastSeen: { fontSize: 11, color: Colors.fg3 },
  publicIp: { fontSize: 11, color: Colors.fg3, fontVariant: ['tabular-nums'] },
  settingsBtn: {
    width: 32, height: 32, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },

  tabBar: {
    backgroundColor: Colors.bgElevated,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});
