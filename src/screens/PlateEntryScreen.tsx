import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import PlatePreview, { PlateZone, PLATE_TOTAL_WIDTH, PLATE_CODE_WIDTH, PLATE_EMIRATE_WIDTH, PLATE_DIVIDER_WIDTH } from '../components/PlatePreview';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlateEntry'>;
  route: RouteProp<RootStackParamList, 'PlateEntry'>;
};

const EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Um Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];
const PLATE_CODES: number[] = [
  1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 50,
];
const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

const ZONE_HINT: Record<PlateZone, string> = {
  emirate: 'Which emirate is your vehicle registered in?',
  code:    'Select your plate code',
  number:  'Enter your plate number',
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated panel — fades + slides in when zone changes
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
function SelectableTag({
  label,
  selected,
  onPress,
  flex,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  flex?: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 14, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={onPress}
      style={flex !== undefined ? { flex } : { flex: 1 }}
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
        scale.value = withSpring(0.88, { damping: 12, stiffness: 400 });
        bg.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
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
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // Plate pulse
  const platePulse = useSharedValue(1);
  const plateStyle = useAnimatedStyle(() => ({ transform: [{ scale: platePulse.value }] }));
  const pulse = useCallback(() => {
    platePulse.value = withSequence(
      withSpring(1.05, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );
  }, []);

  // Hint crossfade
  const hintOpacity = useSharedValue(1);
  const switchZone = useCallback((zone: PlateZone) => {
    hintOpacity.value = withSequence(
      withTiming(0, { duration: 100 }),
      withTiming(1, { duration: 180 })
    );
    setActiveZone(zone);
  }, []);
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  const handleEmirateSelect = useCallback((e: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmirate(e);
    pulse();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => switchZone('code'), 380);
  }, [pulse, switchZone]);

  const handleCodeSelect = useCallback((c: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCode(c);
    pulse();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => switchZone('number'), 380);
  }, [pulse, switchZone]);

  const handleNumpadPress = useCallback((digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (digit === '⌫') {
      setPlateNumber((prev) => {
        const next = prev.slice(0, -1);
        if (next !== prev) pulse();
        return next;
      });
    } else if (plateNumber.length < 5) {
      setPlateNumber((prev) => { pulse(); return prev + digit; });
    }
  }, [plateNumber, pulse]);

  const handleZonePress = useCallback((zone: PlateZone) => {
    Haptics.selectionAsync();
    switchZone(zone);
  }, [switchZone]);

  const canContinue = selectedEmirate !== null && selectedCode !== null && plateNumber.length > 0;

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Loading');
  }, [navigation]);

  const emirateRows: string[][] = [];
  for (let i = 0; i < EMIRATES.length; i += 2) emirateRows.push(EMIRATES.slice(i, i + 2));

  const codeRows: number[][] = [];
  for (let i = 0; i < PLATE_CODES.length; i += 4) codeRows.push(PLATE_CODES.slice(i, i + 4));

  return (
    <View style={styles.overlay}>
      {/* Scrim */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} pointerEvents="none" />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom }, sheetStyle]}>

        {/* Close X — top-left, matches Figma */}
        <Pressable onPress={dismiss} hitSlop={14} style={[styles.closeBtn, { top: insets.top + 10 }]}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        {/* Title — centered, Figma: "Share plate details for instant quotes." */}
        <View style={[styles.titleBlock, { marginTop: insets.top + 48 }]}>
          <Text style={styles.title}>Share plate details for{'\n'}instant quotes.</Text>
        </View>

        {/* Plate — centered, tappable zones */}
        <View style={styles.plateArea}>
          <Text style={styles.plateHint}>Tap to share your plate details</Text>
          <Animated.View style={plateStyle}>
            <PlatePreview
              plateCode={selectedCode}
              plateNumber={plateNumber}
              emirate={selectedEmirate}
              activeZone={activeZone}
              onZonePress={handleZonePress}
            />
          </Animated.View>
        </View>

        {/* Panel */}
        <View style={styles.panel}>
          <ZonePanel key={activeZone} zoneKey={activeZone}>
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

            {activeZone === 'code' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
                {codeRows.map((row, ri) => (
                  <View key={ri} style={styles.row}>
                    {row.map((c) => (
                      <SelectableTag key={c} label={String(c)} selected={selectedCode === c} onPress={() => handleCodeSelect(c)} />
                    ))}
                    {Array.from({ length: 4 - row.length }).map((_, i) => (
                      <View key={`e${i}`} style={{ flex: 1 }} />
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}

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

        {/* Footer — Continue + home indicator */}
        <View style={styles.footer}>
          <ContinueButton enabled={canContinue} onPress={handleContinue} />
          <View style={styles.homeIndicator} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: '#000',
  },

  // Sheet
  sheet: {
    height: SCREEN_HEIGHT,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },

  // Close X — absolute top-left, matches Figma (no background)
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.gray900,
    fontWeight: '400',
  },

  // Title
  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Plate
  plateArea: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },
  plateHint: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray600,
    textAlign: 'center',
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
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyText: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.gray900,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 0,
    gap: 0,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 100,
    backgroundColor: Colors.black,
    alignSelf: 'center',
    marginTop: 8,
    opacity: 0.2,
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
});
