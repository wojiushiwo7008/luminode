import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Colors, Radius, Shadow } from '../theme/tokens';
import { getBaseUrl, setBaseUrl } from '../api/config';
import { resetClient } from '../api/client';
import {
  getAlertThresholds, putAlertThresholds,
  getHealth, exportHistoryCsv,
} from '../api/devices';
import { AlertThresholds, HealthStatus } from '../api/types';

const PROFILE_KEY = 'luminode.profile';
const TARGET_DEVICE = 'lamp-A24';

interface Profile {
  name: string;
  role: string;
}
const DEFAULT_PROFILE: Profile = {
  name: '崔洪鹏 · Cui Hongpeng',
  role: '区调度员 · Operator',
};

async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PROFILE;
}
async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function avatarLetter(name: string): string {
  // 取第一个汉字或字母
  const m = name.match(/[\u4e00-\u9fa5A-Za-z]/);
  return m ? m[0] : '?';
}

// ============================================================
// Profile edit modal
// ============================================================
function ProfileModal({
  visible, initial, onClose, onSave,
}: {
  visible: boolean; initial: Profile;
  onClose: () => void; onSave: (p: Profile) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  useEffect(() => { setName(initial.name); setRole(initial.role); }, [initial, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>个人信息</Text>
          <Text style={styles.modalLabel}>姓名</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="姓名" placeholderTextColor={Colors.fg3} />
          <Text style={styles.modalLabel}>角色</Text>
          <TextInput style={styles.input} value={role} onChangeText={setRole}
            placeholder="角色" placeholderTextColor={Colors.fg3} />
          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSave({ name: name.trim() || DEFAULT_PROFILE.name, role: role.trim() || DEFAULT_PROFILE.role })}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnPrimaryText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Alert thresholds modal (告警偏好)
// ============================================================
const NUMERIC_FIELDS: { key: keyof AlertThresholds; label: string; unit: string }[] = [
  { key: 'offlineSec', label: '离线判定阈值', unit: 's' },
  { key: 'tempHi',     label: '温度告警上限', unit: '°C' },
  { key: 'humiLo',     label: '湿度下限',     unit: '%' },
  { key: 'humiHi',     label: '湿度上限',     unit: '%' },
  { key: 'windHi',     label: '风速上限',     unit: '级' },
  { key: 'pm25Hi',     label: 'PM2.5 上限',   unit: 'μg/m³' },
];

function ThresholdModal({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const [data, setData] = useState<AlertThresholds | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    getAlertThresholds()
      .then((d) => setData(d))
      .catch((e) => setError(e?.message ?? '加载失败'))
      .finally(() => setLoading(false));
  }, [visible]);

  const updateNum = (k: keyof AlertThresholds, raw: string) => {
    if (!data) return;
    const n = parseInt(raw, 10);
    setData({ ...data, [k]: Number.isFinite(n) ? n : 0 });
  };
  const updateBool = (k: keyof AlertThresholds, v: boolean) => {
    if (!data) return;
    setData({ ...data, [k]: v as any });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await putAlertThresholds(data);
      setData(updated);
      onClose();
      Alert.alert('已保存', '告警阈值已实时生效');
    } catch (e: any) {
      setError(e?.message ?? '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={[styles.modalCard, { maxHeight: '85%' }]}>
          <Text style={styles.modalTitle}>告警阈值</Text>
          <Text style={styles.modalHint}>修改后立即下发至后端 /config/alerts</Text>

          {loading ? (
            <ActivityIndicator color={Colors.brandGlow} style={{ marginVertical: 24 }} />
          ) : error && !data ? (
            <Text style={styles.errText}>{error}</Text>
          ) : data ? (
            <ScrollView style={{ maxHeight: 360 }}>
              {NUMERIC_FIELDS.map((f) => (
                <View key={f.key} style={styles.thRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.thLabel}>{f.label}</Text>
                    <Text style={styles.thUnit}>{f.unit}</Text>
                  </View>
                  <TextInput
                    style={styles.thInput}
                    value={String((data as any)[f.key] ?? '')}
                    onChangeText={(t) => updateNum(f.key, t)}
                    keyboardType="numeric"
                  />
                </View>
              ))}

              {/* booleans */}
              <View style={styles.thRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.thLabel}>pwq=1 视为漏水告警</Text>
                </View>
                <TouchableOpacity
                  onPress={() => updateBool('pwqOnAsLeak', !data.pwqOnAsLeak)}
                  style={[styles.toggle, data.pwqOnAsLeak && styles.toggleOn]}
                >
                  <Text style={[styles.toggleText, data.pwqOnAsLeak && styles.toggleOnText]}>
                    {data.pwqOnAsLeak ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.thRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.thLabel}>csb=1 视为可燃气体告警</Text>
                </View>
                <TouchableOpacity
                  onPress={() => updateBool('csbOnAsHazard', !data.csbOnAsHazard)}
                  style={[styles.toggle, data.csbOnAsHazard && styles.toggleOn]}
                >
                  <Text style={[styles.toggleText, data.csbOnAsHazard && styles.toggleOnText]}>
                    {data.csbOnAsHazard ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}

          {error && data ? <Text style={styles.errText}>{error}</Text> : null}

          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={save}
              disabled={!data || saving}
              style={[styles.btn, styles.btnPrimary, (saving || !data) && { opacity: 0.5 }]}
            >
              <Text style={styles.btnPrimaryText}>{saving ? '保存中…' : '保存'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// About modal (后端状态)
// ============================================================
function AboutModal({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    getHealth()
      .then(setData)
      .catch((e) => setError(e?.message ?? '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (visible) refresh(); }, [visible]);

  const fmtUptime = (s: number): string => {
    const sec = Math.floor(s);
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const fmtAgo = (ts?: number): string => {
    if (!ts) return '从未';
    const s = Math.floor((Date.now() - ts) / 1000);
    return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>关于 · About</Text>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>App 版本</Text>
            <Text style={styles.aboutVal}>Luminode v2.5.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>云平台</Text>
            <Text style={styles.aboutVal}>Aliyun IoT</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>固件平台</Text>
            <Text style={styles.aboutVal}>沁恒 CH32V307 · RISC-V</Text>
          </View>

          <View style={styles.divider} />
          <Text style={[styles.modalLabel, { marginBottom: 6 }]}>后端实时状态 · /healthz</Text>

          {loading ? (
            <ActivityIndicator color={Colors.brandGlow} style={{ marginVertical: 16 }} />
          ) : error ? (
            <Text style={styles.errText}>{error}</Text>
          ) : data ? (
            <>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>状态</Text>
                <View style={styles.statusPill(data.ok)}>
                  <Text style={styles.statusPillText(data.ok)}>
                    {data.ok ? '● online' : '● down'}
                  </Text>
                </View>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>上行通道</Text>
                <Text style={styles.aboutVal}>{data.uplink}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>累计轮询</Text>
                <Text style={styles.aboutVal}>{data.pollCount} 次</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>上次轮询</Text>
                <Text style={styles.aboutVal}>{fmtAgo(data.lastPollAt)}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>后端运行</Text>
                <Text style={styles.aboutVal}>{fmtUptime(data.uptime)}</Text>
              </View>
              {data.lastError ? (
                <View style={styles.aboutRow}>
                  <Text style={styles.aboutKey}>最近错误</Text>
                  <Text style={[styles.aboutVal, { color: Colors.statusAlarm }]} numberOfLines={2}>
                    {data.lastError}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={refresh} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>刷新</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Connection modal
// ============================================================
function ConnectionModal({
  visible, initial, onClose, onSave,
}: {
  visible: boolean; initial: string;
  onClose: () => void; onSave: (url: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => { setDraft(initial); }, [initial, visible]);
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>后端地址</Text>
          <Text style={styles.modalHint}>例如 http://10.154.183.105:3000</Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://..."
            placeholderTextColor={Colors.fg3}
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(draft)} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Main screen
// ============================================================
export default function MeScreen() {
  const [baseUrl, setBaseUrlState] = useState<string>('');
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [editingConn, setEditingConn] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showThresholds, setShowThresholds] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getBaseUrl().then(setBaseUrlState);
    loadProfile().then(setProfile);
  }, []);

  const saveConn = async (url: string) => {
    await setBaseUrl(url);
    resetClient();
    const v = await getBaseUrl();
    setBaseUrlState(v);
    setEditingConn(false);
    Alert.alert('连接已更新', v);
  };

  const saveProfileNow = async (p: Profile) => {
    await saveProfile(p);
    setProfile(p);
    setEditingProfile(false);
  };

  const doExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const csv = await exportHistoryCsv(TARGET_DEVICE, 24);
      const lines = csv.split('\n');
      const rowCount = Math.max(0, lines.length - 1); // 减表头
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const dir = FileSystem.documentDirectory ?? '';
      const fname = `${TARGET_DEVICE}_${ts}.csv`;
      const path = `${dir}${fname}`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      Alert.alert(
        '导出完成',
        `${rowCount} 行已保存\n${path}\n\n前 2 行预览:\n${lines.slice(0, 2).join('\n')}`
      );
    } catch (e: any) {
      Alert.alert('导出失败', e?.message ?? String(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile (tap to edit) */}
      <TouchableOpacity activeOpacity={0.75} onPress={() => setEditingProfile(true)} style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter(profile.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role}</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Menu */}
      <View style={styles.menuCard}>
        <TouchableOpacity activeOpacity={0.7}
          style={[styles.menuRow, styles.menuRowBorder]}
          onPress={() => setEditingConn(true)}
        >
          <Text style={styles.menuEmoji}>📶</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>连接配置 · Connection</Text>
            <Text style={styles.menuSub}>{baseUrl || '—'}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}
          style={[styles.menuRow, styles.menuRowBorder]}
          onPress={() => setShowThresholds(true)}
        >
          <Text style={styles.menuEmoji}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>告警偏好 · Alert thresholds</Text>
            <Text style={styles.menuSub}>编辑温度 / 湿度 / 风速 / PM2.5 告警阈值</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}
          style={[styles.menuRow, styles.menuRowBorder]}
          onPress={doExport}
          disabled={exporting}
        >
          <Text style={styles.menuEmoji}>📥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>数据导出 · Export 24h CSV</Text>
            <Text style={styles.menuSub}>{exporting ? '正在导出…' : `从后端拉取 ${TARGET_DEVICE} 历史`}</Text>
          </View>
          {exporting
            ? <ActivityIndicator color={Colors.brandGlow} />
            : <Text style={styles.menuArrow}>›</Text>}
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}
          style={styles.menuRow}
          onPress={() => setShowAbout(true)}
        >
          <Text style={styles.menuEmoji}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>关于 · About</Text>
            <Text style={styles.menuSub}>后端实时状态 / 版本信息</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Luminode v2.5.0 · CH32V307 · Aliyun IoT</Text>

      <ProfileModal
        visible={editingProfile}
        initial={profile}
        onClose={() => setEditingProfile(false)}
        onSave={saveProfileNow}
      />
      <ConnectionModal
        visible={editingConn}
        initial={baseUrl}
        onClose={() => setEditingConn(false)}
        onSave={saveConn}
      />
      <ThresholdModal
        visible={showThresholds}
        onClose={() => setShowThresholds(false)}
      />
      <AboutModal
        visible={showAbout}
        onClose={() => setShowAbout(false)}
      />
    </ScrollView>
  );
}

const styles: any = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: 14, ...Shadow.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.brandCivic,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.fg1 },
  role: { fontSize: 12, color: Colors.fg2, marginTop: 2 },

  menuCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', ...Shadow.sm,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuEmoji: { fontSize: 18, width: 26, textAlign: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '500', color: Colors.fg1 },
  menuSub: { fontSize: 11, color: Colors.fg3, marginTop: 2 },
  menuArrow: { fontSize: 20, color: Colors.fg3, lineHeight: 22 },

  version: { textAlign: 'center', fontSize: 11, color: Colors.fg3, marginTop: 8 },

  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg, padding: 18, gap: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.fg1, marginBottom: 4 },
  modalHint: { fontSize: 11, color: Colors.fg3, marginBottom: 4 },
  modalLabel: { fontSize: 12, color: Colors.fg2, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.fg1,
    backgroundColor: Colors.bg,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  btnGhost: { backgroundColor: 'transparent' },
  btnGhostText: { color: Colors.fg2, fontSize: 14, fontWeight: '500' },
  btnPrimary: { backgroundColor: Colors.brandCivic },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Threshold rows
  thRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  thLabel: { fontSize: 13, color: Colors.fg1, fontWeight: '500' },
  thUnit: { fontSize: 10, color: Colors.fg3 },
  thInput: {
    width: 76,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 14, color: Colors.fg1, backgroundColor: Colors.bg,
    textAlign: 'right',
  },
  toggle: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  toggleOn: { backgroundColor: Colors.brandGlow, borderColor: Colors.brandGlow },
  toggleText: { fontSize: 11, color: Colors.fg2, fontWeight: '600' },
  toggleOnText: { color: Colors.fgOnGlow },

  // About
  aboutRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aboutKey: { fontSize: 12, color: Colors.fg2 },
  aboutVal: { fontSize: 13, color: Colors.fg1, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  statusPill: (ok: boolean) => ({
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    backgroundColor: ok ? Colors.statusOnlineBg : Colors.statusAlarmBg,
  }),
  statusPillText: (ok: boolean) => ({
    fontSize: 11, fontWeight: '700',
    color: ok ? Colors.statusOnline : Colors.statusAlarm,
  }),
  errText: { color: Colors.statusAlarm, fontSize: 12, marginVertical: 8 },
});
