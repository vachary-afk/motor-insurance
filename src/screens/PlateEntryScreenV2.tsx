/**
 * PlateEntryScreenV2
 *
 * Version 2 of the plate entry flow:
 *  - Emirate   → same tag grid as V1
 *  - Plate code → sub-bottom-sheet populated from selected emirate
 *  - Plate number → native number-pad keyboard (TextInput)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import PlatePreview, { PlateZone } from '../components/PlatePreview';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlateEntryV2'>;
  route: RouteProp<RootStackParamList, 'PlateEntryV2'>;
};

// ─── Data ────────────────────────────────────────────────────────────────────
const EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Um Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];

const PLATE_CODES_DEFAULT: string[] = [
  '1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
  '16', '17', '18', '19', '20', '21', '22', '50',
];
const PLATE_TEXT_CODES_DEFAULT: string[] = [
  'Bank', 'Classic', 'Diplomatic', 'Grey', 'Red', 'Code 9',
  'Motorcycle 1', 'Motorcycle 2', 'Motorcycle 3', 'White',
];
const PLATE_CODES_DUBAI: string[] = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
];
const PLATE_TEXT_CODES_DUBAI: string[] = [
  'AA','BB','CC','DD','EE','FF','GG','HH','II','JJ','KK','LL','MM',
  'NN','OO','PP','QQ','RR','SS','TT','UU','VV','WW','XX','YY','ZZ',
];

function getPlateCodesForEmirate(emirate: string | null) {
  if (emirate === 'Dubai') return { codes: PLATE_CODES_DUBAI, textCodes: PLATE_TEXT_CODES_DUBAI };
  return { codes: PLATE_CODES_DEFAULT, textCodes: PLATE_TEXT_CODES_DEFAULT };
}

const ZONE_LABELS: Record<PlateZone, string> = {
  emirate: 'Emirates of registration',
  code:    '',
  number:  '',
};

// ─── ZonePanel (fade-slide on key change) ─────────────────────────────────
function ZonePanel({ children, zoneKey }: { children: React.ReactNode; zoneKey: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [zoneKey]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    flex: 1,
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Continue button ──────────────────────────────────────────────────────
function ContinueButton({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(enabled ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [enabled]);

  const animBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [Colors.gray200, Colors.brand600]),
  }));
  const animScale = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      onPressIn={() => { if (enabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
    >
      <Animated.View style={[styles.continueBtn, animBg, animScale]}>
        <Text style={[styles.continueBtnText, enabled && styles.continueBtnTextActive]}>
          Continue
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Selectable tag ───────────────────────────────────────────────────────
function SelectableTag({ label, selected, onPress }: {
  label: string; selected: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 14, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.tag, selected && styles.tagSelected, animStyle]}>
        <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Code bottom-sheet row item ───────────────────────────────────────────
function CodeRow({ code, selected, onPress }: { code: string; selected: boolean; onPress: () => void }) {
  const bg = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    bg.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bg.value, [0, 1], [Colors.white, Colors.brand50]),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.codeRow, animStyle]}>
        <Text style={[styles.codeRowText, selected && styles.codeRowTextSelected]}>
          {code}
        </Text>
        {selected && (
          <View style={styles.codeRowCheck}>
            <Text style={styles.codeRowCheckMark}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PlateEntryScreenV2({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // Core state
  const [activeZone, setActiveZone] = useState<PlateZone>('emirate');
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [showIndicator, setShowIndicator] = useState(true);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOp = useSharedValue(0);
  const toastY = useSharedValue(8);
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOp.value,
    transform: [{ translateY: toastY.value }],
  }));

  // Code bottom-sheet
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);
  const [codeSearch, setCodeSearch] = useState('');
  const codeSheetY = useSharedValue(600);
  const codeSheetScrim = useSharedValue(0);

  // Main sheet / scrim
  const sheetY = useSharedValue(SCREEN_HEIGHT);
  const scrimOpacity = useSharedValue(0);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberInputRef = useRef<TextInput>(null);

  // ── Mount animation ─────────────────────────────────────────────────────
  useEffect(() => {
    sheetY.value = withSpring(0, { damping: 26, stiffness: 180, mass: 1.0 });
    scrimOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ── Main sheet styles ───────────────────────────────────────────────────
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));

  // ── Dismiss main sheet ──────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrimOpacity.value = withTiming(0, { duration: 240 });
    sheetY.value = withSpring(
      SCREEN_HEIGHT,
      { damping: 30, stiffness: 260, mass: 0.85 },
      (finished) => { if (finished) runOnJS(navigation.goBack)(); }
    );
  }, [navigation]);

  // ── Zone label crossfade ────────────────────────────────────────────────
  const labelOpacity = useSharedValue(1);
  const switchZone = useCallback((zone: PlateZone) => {
    labelOpacity.value = withTiming(0, { duration: 80 }, () => {
      labelOpacity.value = withTiming(1, { duration: 180 });
    });
    setActiveZone(zone);
  }, []);
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    toastY.value = -16;
    toastOp.value = withTiming(1, { duration: 180 });
    toastY.value = withSpring(0, { damping: 22, stiffness: 240 });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      toastOp.value = withTiming(0, { duration: 220 });
      toastY.value = withTiming(-10, { duration: 200 });
    }, 2400);
  }, []);

  // ── Code sheet open/close ────────────────────────────────────────────────
  const openCodeSheet = useCallback(() => {
    setCodeSheetOpen(true);
    setCodeSearch('');
    codeSheetScrim.value = withTiming(1, { duration: 240 });
    codeSheetY.value = withSpring(0, { damping: 26, stiffness: 200 });
  }, []);

  const closeCodeSheet = useCallback(() => {
    codeSheetScrim.value = withTiming(0, { duration: 200 });
    codeSheetY.value = withSpring(600, { damping: 28, stiffness: 240 }, (finished) => {
      if (finished) runOnJS(setCodeSheetOpen)(false);
    });
  }, []);

  const codeSheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: codeSheetY.value }],
  }));
  const codeSheetScrimStyle = useAnimatedStyle(() => ({
    opacity: codeSheetScrim.value,
  }));

  // ── Zone press guard ────────────────────────────────────────────────────
  const handleZonePress = useCallback((zone: PlateZone) => {
    if ((zone === 'code' || zone === 'number') && !selectedEmirate) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Please select an emirate first');
      switchZone('emirate');
      return;
    }
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowIndicator(true);

    if (zone === 'code') {
      switchZone('code');
      // small delay so panel transition starts before sheet opens
      setTimeout(openCodeSheet, 120);
    } else if (zone === 'number') {
      switchZone('number');
      // Must call focus() synchronously within the tap handler for mobile browsers
      numberInputRef.current?.focus();
    } else {
      switchZone(zone);
    }
  }, [selectedEmirate, showToast, switchZone, openCodeSheet]);

  // ── Emirate select ──────────────────────────────────────────────────────
  const handleEmirateSelect = useCallback((e: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmirate(e);
    setSelectedCode(null);
    setPlateNumber('');
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    switchZone('code');
    advanceTimer.current = setTimeout(openCodeSheet, 80);
  }, [switchZone, openCodeSheet]);

  // ── Code select (from sheet) ────────────────────────────────────────────
  const handleCodeSelect = useCallback((code: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCode(code);
    closeCodeSheet();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    // Switch to number zone immediately; autoFocus on TextInput handles keyboard
    switchZone('number');
  }, [closeCodeSheet, switchZone]);

  const canContinue = selectedEmirate !== null && selectedCode !== null && plateNumber.length > 0;

  useEffect(() => {
    if (canContinue) setShowIndicator(false);
  }, [canContinue]);

  // Focus the number input whenever the number zone becomes active
  useEffect(() => {
    if (activeZone === 'number') {
      const t = setTimeout(() => numberInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [activeZone]);

  const handleContinue = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Loading');
  }, [navigation]);

  // ── Filtered code lists ─────────────────────────────────────────────────
  const { codes: PLATE_CODES, textCodes: PLATE_TEXT_CODES } = getPlateCodesForEmirate(selectedEmirate);
  const q = codeSearch.trim().toLowerCase();
  const filteredCodes = q ? PLATE_CODES.filter(c => c.toLowerCase().includes(q)) : PLATE_CODES;
  const filteredTextCodes = q ? PLATE_TEXT_CODES.filter(c => c.toLowerCase().includes(q)) : PLATE_TEXT_CODES;

  // ── Emirate rows ────────────────────────────────────────────────────────
  const emirateRows: string[][] = [];
  for (let i = 0; i < EMIRATES.length; i += 2) emirateRows.push(EMIRATES.slice(i, i + 2));

  return (
    <View style={styles.overlay}>
      {/* Main scrim */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} pointerEvents="none" />

      {/* Main sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>

        {/* Close */}
        <Pressable onPress={dismiss} hitSlop={14} style={[styles.closeBtn, { top: insets.top + 10 }]}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        {/* Title */}
        <View style={[styles.titleBlock, { marginTop: insets.top + 138 }]}>
          <Text style={styles.title}>Share plate details for{'\n'}instant quotes.</Text>
        </View>

        {/* Plate preview + toast + label */}
        <View style={styles.plateArea}>
          <PlatePreview
            plateCode={selectedCode}
            plateNumber={plateNumber}
            emirate={selectedEmirate}
            activeZone={activeZone}
            onZonePress={handleZonePress}
            showIndicator={showIndicator}
          />
          <Text style={styles.titleHint}>Tap any plate section to edit your details.</Text>
          <Animated.View style={[styles.toast, toastStyle]} pointerEvents="none">
            <Text style={styles.toastIcon}>⚠️</Text>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </Animated.View>
          {!!ZONE_LABELS[activeZone] && (
            <Animated.Text style={[styles.zoneLabel, labelStyle]}>
              {ZONE_LABELS[activeZone]}
            </Animated.Text>
          )}
        </View>

        {/* Input panel */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.panelKAV}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.panel, { paddingBottom: insets.bottom + 80 }]}>
            <ZonePanel key={activeZone} zoneKey={activeZone}>

              {/* ── Emirate zone ── */}
              {activeZone === 'emirate' && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
                  {emirateRows.map((row, ri) => (
                    <View key={ri} style={styles.row}>
                      {row.map((e) => (
                        <SelectableTag
                          key={e}
                          label={e}
                          selected={selectedEmirate === e}
                          onPress={() => handleEmirateSelect(e)}
                        />
                      ))}
                      {row.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  ))}
                </ScrollView>
              )}


              {/* ── Number zone — keyboard triggered from plate tap ── */}
              {activeZone === 'number' && (
                <View style={styles.numberZoneWrap}>
                  {/* Invisible TextInput — auto-focuses on mount to pop native keyboard */}
                  <TextInput
                    ref={numberInputRef}
                    style={styles.hiddenInput}
                    value={plateNumber}
                    onChangeText={(t) => {
                      const digits = t.replace(/[^0-9]/g, '').slice(0, 5);
                      setPlateNumber(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="done"
                    autoFocus
                    caretHidden
                    accessible={false}
                    importantForAccessibility="no"
                  />
                </View>
              )}

            </ZonePanel>
          </View>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <ContinueButton enabled={canContinue} onPress={handleContinue} />
        </View>

      </Animated.View>

      {/* ── Code selection bottom sheet ── */}
      {codeSheetOpen && (
        <>
          {/* Sheet scrim */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeCodeSheet}
          >
            <Animated.View style={[StyleSheet.absoluteFill, styles.codeSheetScrim, codeSheetScrimStyle]} />
          </Pressable>

          <Animated.View style={[styles.codeSheet, codeSheetAnimStyle, { paddingBottom: insets.bottom + 12 }]}>
            {/* Handle */}
            <View style={styles.codeSheetHandle} />

            {/* Header */}
            <View style={styles.codeSheetHeader}>
              <Text style={styles.codeSheetTitle}>
                {selectedEmirate ? `${selectedEmirate} plate codes` : 'Select plate code'}
              </Text>
              <Pressable onPress={closeCodeSheet} hitSlop={12} style={styles.codeSheetClose}>
                <Text style={styles.codeSheetCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View style={styles.codeSearchWrap}>
              <Text style={styles.codeSearchIcon}>🔍</Text>
              <TextInput
                style={styles.codeSearchInput}
                value={codeSearch}
                onChangeText={setCodeSearch}
                placeholder="Search plate code…"
                placeholderTextColor={Colors.gray400}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
              />
              {codeSearch.length > 0 && (
                <Pressable onPress={() => setCodeSearch('')} hitSlop={8}>
                  <Text style={styles.codeSearchClear}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Code list */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.codeListContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Primary codes */}
              {filteredCodes.length > 0 && (
                <>
                  <Text style={styles.codeListSection}>
                    {selectedEmirate === 'Dubai' ? 'Letter codes' : 'Numeric codes'}
                  </Text>
                  {filteredCodes.map((code) => (
                    <CodeRow
                      key={code}
                      code={code}
                      selected={selectedCode === code}
                      onPress={() => handleCodeSelect(code)}
                    />
                  ))}
                </>
              )}

              {/* Special codes */}
              {filteredTextCodes.length > 0 && (
                <>
                  <Text style={[styles.codeListSection, { marginTop: 20 }]}>
                    {selectedEmirate === 'Dubai' ? 'Special / Double Letter' : 'Special types'}
                  </Text>
                  {filteredTextCodes.map((code) => (
                    <CodeRow
                      key={code}
                      code={code}
                      selected={selectedCode === code}
                      onPress={() => handleCodeSelect(code)}
                    />
                  ))}
                </>
              )}

              {filteredCodes.length === 0 && filteredTextCodes.length === 0 && (
                <Text style={styles.noResults}>No codes match "{codeSearch}"</Text>
              )}
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    backgroundColor: '#000',
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },

  // Header
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: Colors.gray900 },
  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
    lineHeight: 28,
  },
  titleHint: {
    fontSize: 13,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Plate area
  plateArea: {
    alignItems: 'center',
    marginBottom: 0,
    gap: 8,
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginVertical: 12,
  },

  // Panel
  panelKAV: { flex: 1 },
  panel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // Tag grid (emirate zone)
  grid: { gap: 10, paddingBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  tag: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tagSelected: { borderColor: Colors.brand600, backgroundColor: Colors.brand50 },
  tagText: { fontSize: 14, fontWeight: '500', color: Colors.gray800, textAlign: 'center' },
  tagTextSelected: { color: Colors.brand600, fontWeight: '700' },

  // Code zone
  codeZoneWrap: { flex: 1, paddingTop: 8 },
  codePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  codePickerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray400,
    fontWeight: '500',
  },
  codePickerTextSelected: { color: Colors.gray900, fontWeight: '700' },
  codePickerChevron: { fontSize: 22, color: Colors.brand600, lineHeight: 26 },
  codeSelectedHint: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.gray600,
    textAlign: 'center',
  },

  // Number zone — keyboard triggered from plate tap
  numberZoneWrap: { flex: 1, paddingTop: 16, alignItems: 'center', gap: 0 },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: { fontSize: 16, fontWeight: '500', color: Colors.gray500 },
  continueBtnTextActive: { color: Colors.white, fontWeight: '700' },

  // Toast
  toast: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toastIcon: { fontSize: 16 },
  toastText: { fontSize: 13, fontWeight: '600', color: '#92400E' },

  // ── Code bottom sheet ──────────────────────────────────────────────────
  codeSheetScrim: { backgroundColor: 'rgba(0,0,0,0.45)' },
  codeSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  codeSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  codeSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  codeSheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray900,
  },
  codeSheetClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSheetCloseText: { fontSize: 15, color: Colors.gray600 },

  // Search bar inside sheet
  codeSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  codeSearchIcon: { fontSize: 14 },
  codeSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray900,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  codeSearchClear: { fontSize: 13, color: Colors.gray500 },

  // Code list
  codeListContent: { paddingBottom: 24 },
  codeListSection: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  codeRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray800,
  },
  codeRowTextSelected: { color: Colors.brand600, fontWeight: '700' },
  codeRowCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRowCheckMark: { fontSize: 13, color: Colors.white, fontWeight: '700' },
  noResults: {
    textAlign: 'center',
    color: Colors.gray500,
    fontSize: 14,
    marginTop: 32,
  },
});
