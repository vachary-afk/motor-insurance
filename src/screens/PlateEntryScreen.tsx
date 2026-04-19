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
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlateEntry'>;
  route: RouteProp<RootStackParamList, 'PlateEntry'>;
};

const EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Um Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];
const PLATE_CODES: string[] = [
  '1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
  '16', '17', '18', '19', '20', '21', '22', '50',
];
const PLATE_TEXT_CODES: string[] = [
  'Bank', 'Classic', 'Diplomatic', 'Grey', 'Red', 'Code 9',
  'Motorcycle 1', 'Motorcycle 2', 'Motorcycle 3', 'White',
];
const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

const ZONE_LABELS: Record<PlateZone, string> = {
  emirate: 'Emirates of registration',
  code:    'Enter plate code',
  number:  'Plate number',
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated panel
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Continue button
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Selectable tag
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Numpad key
// ─────────────────────────────────────────────────────────────────────────────
function NumpadKey({ keyVal, onPress }: { keyVal: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(bg.value, [0, 1], [Colors.white, Colors.brand50]),
  }));

  return (
    <Pressable
      style={styles.numpadKeyWrap}
      onPressIn={() => {
        scale.value = withTiming(0.86, { duration: 80, easing: Easing.bezier(0.22, 1, 0.36, 1) });
        bg.value = withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) });
        bg.value = withTiming(0, { duration: 200 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[styles.numpadKey, animStyle]}>
        <Text style={styles.numpadKeyText}>{keyVal}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PlateEntryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeZone, setActiveZone] = useState<PlateZone>('emirate');
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [showIndicator, setShowIndicator] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sheet + scrim entrance
  const sheetY = useSharedValue(SCREEN_HEIGHT);
  const scrimOpacity = useSharedValue(0);

  useEffect(() => {
    sheetY.value = withSpring(0, { damping: 26, stiffness: 180, mass: 1.0, overshootClamping: false });
    scrimOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  const dismiss = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrimOpacity.value = withTiming(0, { duration: 240 });
    sheetY.value = withSpring(
      SCREEN_HEIGHT,
      { damping: 30, stiffness: 260, mass: 0.85 },
      (finished) => { if (finished) runOnJS(navigation.goBack)(); }
    );
  }, [navigation]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  // Zone label crossfade (no plate pulse)
  const labelOpacity = useSharedValue(1);
  const switchZone = useCallback((zone: PlateZone) => {
    labelOpacity.value = withTiming(0, { duration: 80 }, () => {
      labelOpacity.value = withTiming(1, { duration: 180 });
    });
    setActiveZone(zone);
  }, []);
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  const handleEmirateSelect = useCallback((e: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmirate(e);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => switchZone('code'), 380);
  }, [switchZone]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
      (navigator as any).vibrate(10);
    }
  }, []);

  const handleCodeSelect = useCallback((c: string) => {
    triggerHaptic();
    setSelectedCode(c);
    setCodeInputValue(c);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => switchZone('number'), 380);
  }, [switchZone, triggerHaptic]);

  const handleCodeInputChange = useCallback((text: string) => {
    setCodeInputValue(text);
    const allCodes = [...PLATE_CODES, ...PLATE_TEXT_CODES];
    const match = allCodes.find(c => c.toLowerCase() === text.toLowerCase());
    setSelectedCode(match ?? null);
  }, []);

  const handleNumpadPress = useCallback((digit: string) => {
    triggerHaptic();
    if (digit === '⌫') {
      setPlateNumber((prev) => prev.slice(0, -1));
    } else if (plateNumber.length < 5) {
      setPlateNumber((prev) => prev + digit);
    }
  }, [plateNumber]);

  const handleZonePress = useCallback((zone: PlateZone) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowIndicator(true);
    switchZone(zone);
  }, [switchZone]);

  const canContinue = selectedEmirate !== null && selectedCode !== null && plateNumber.length > 0;

  // Hide indicator when all fields have minimum input; restore on zone tap
  useEffect(() => {
    if (canContinue) setShowIndicator(false);
  }, [canContinue]);

  const handleContinue = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Loading');
  }, [navigation]);

  const emirateRows: string[][] = [];
  for (let i = 0; i < EMIRATES.length; i += 2) emirateRows.push(EMIRATES.slice(i, i + 2));

  const query = codeInputValue.trim().toLowerCase();
  const filteredNumCodes = query
    ? PLATE_CODES.filter(c => c.includes(query))
    : PLATE_CODES;
  const filteredTextCodes = query
    ? PLATE_TEXT_CODES.filter(c => c.toLowerCase().includes(query))
    : PLATE_TEXT_CODES;

  const numCodeRows: string[][] = [];
  for (let i = 0; i < filteredNumCodes.length; i += 4) numCodeRows.push(filteredNumCodes.slice(i, i + 4));
  const textCodeRows: string[][] = [];
  for (let i = 0; i < filteredTextCodes.length; i += 2) textCodeRows.push(filteredTextCodes.slice(i, i + 2));

  return (
    <View style={styles.overlay}>
      {/* Scrim */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} pointerEvents="none" />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>

        {/* Close X */}
        <Pressable onPress={dismiss} hitSlop={14} style={[styles.closeBtn, { top: insets.top + 10 }]}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        {/* Title */}
        <View style={[styles.titleBlock, { marginTop: insets.top + 48 }]}>
          <Text style={styles.title}>Share plate details for{'\n'}instant quotes.</Text>
        </View>

        {/* Plate + zone label */}
        <View style={styles.plateArea}>
          <PlatePreview
            plateCode={selectedCode}
            plateNumber={plateNumber}
            emirate={selectedEmirate}
            activeZone={activeZone}
            onZonePress={handleZonePress}
            showIndicator={showIndicator}
          />
          <Animated.Text style={[styles.zoneLabel, labelStyle]}>
            {ZONE_LABELS[activeZone]}
          </Animated.Text>
        </View>

        {/* Panel */}
        <View style={styles.panel}>
          <ZonePanel key={activeZone} zoneKey={activeZone}>

            {/* ── Emirate ── */}
            {activeZone === 'emirate' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
                {emirateRows.map((row, ri) => (
                  <View key={ri} style={styles.row}>
                    {row.map((e) => (
                      <SelectableTag key={e} label={e} selected={selectedEmirate === e} onPress={() => handleEmirateSelect(e)} />
                    ))}
                    {row.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* ── Plate code ── */}
            {activeZone === 'code' && (
              <View style={{ flex: 1 }}>
                {/* Search input */}
                <View style={styles.codeInputWrap}>
                  <TextInput
                    style={styles.codeInput}
                    value={codeInputValue}
                    onChangeText={handleCodeInputChange}
                    keyboardType="default"
                    placeholder="Search for plate code"
                    placeholderTextColor={Colors.gray400}
                    returnKeyType="done"
                    autoCorrect={false}
                    autoCapitalize="none"
                    accessible
                    accessibilityLabel="Plate code search"
                  />
                  {codeInputValue.length > 0 && (
                    <Pressable onPress={() => { setCodeInputValue(''); setSelectedCode(null); }} hitSlop={8} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>✕</Text>
                    </Pressable>
                  )}
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
                  {/* Numeric codes */}
                  {numCodeRows.length > 0 && numCodeRows.map((row, ri) => (
                    <View key={`n${ri}`} style={styles.row}>
                      {row.map((c) => (
                        <SelectableTag key={c} label={c} selected={selectedCode === c} onPress={() => handleCodeSelect(c)} />
                      ))}
                      {Array.from({ length: 4 - row.length }).map((_, i) => (
                        <View key={`e${i}`} style={{ flex: 1 }} />
                      ))}
                    </View>
                  ))}
                  {/* Special types */}
                  {filteredTextCodes.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>Special types</Text>
                      {textCodeRows.map((row, ri) => (
                        <View key={`t${ri}`} style={styles.row}>
                          {row.map((c) => (
                            <SelectableTag key={c} label={c} selected={selectedCode === c} onPress={() => handleCodeSelect(c)} />
                          ))}
                          {row.length === 1 && <View style={{ flex: 1 }} />}
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>
              </View>
            )}

            {/* ── Plate number ── */}
            {activeZone === 'number' && (
              <View style={styles.numpad}>
                {NUMPAD_KEYS.map((key, i) =>
                  key === '' ? (
                    <View key={i} style={styles.numpadKeyWrap} />
                  ) : (
                    <NumpadKey key={i} keyVal={key} onPress={() => handleNumpadPress(key)} />
                  )
                )}
              </View>
            )}

          </ZonePanel>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <ContinueButton enabled={canContinue} onPress={handleContinue} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.gray900,
    fontWeight: '400',
  },
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
  // Plate + label
  plateArea: {
    alignItems: 'center',
    marginBottom: 20,
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
  panel: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Tag grid
  grid: {
    gap: 10,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
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
  tagSelected: {
    borderColor: Colors.brand600,
    backgroundColor: Colors.brand50,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray800,
    textAlign: 'center',
  },
  tagTextSelected: {
    color: Colors.brand600,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 2,
  },
  // Code input
  codeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
  },
  codeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.gray500,
  },
  // Numpad
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  numpadKeyWrap: {
    width: '30%',
    flexGrow: 1,
  },
  numpadKey: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyText: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.gray900,
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray500,
  },
  continueBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 10,
    color: Colors.gray600,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  termsLink: {
    color: Colors.brand600,
    textDecorationLine: 'underline',
  },
});
