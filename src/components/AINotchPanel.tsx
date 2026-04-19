/**
 * AINotchPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * • Organic notch tab on the right edge, slow breathing glow, shimmer sweep
 * • Tap OR drag-left → blob expands from notch size to full-page gradient sheet
 * • Drag-down on drag handle → sheet collapses back to notch
 * • Full-page sheet has the same gradient as the notch (no rounded corners)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, G, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);

const NOTCH_W  = 60;
const NOTCH_H  = 220;
const BULGE_X  = NOTCH_W - 32;   // leftmost point of the 32 px wide bulge = 28

/** Leaf shape: tapers at top (y=12) and bottom (y=208), widest at centre */
const NOTCH_PATH = [
  `M ${NOTCH_W},12`,
  `C ${NOTCH_W},66  ${BULGE_X},80  ${BULGE_X},110`,
  `C ${BULGE_X},140  ${NOTCH_W},154  ${NOTCH_W},208`,
  `Z`,
].join(' ');

// Gradient stops — shared between notch SVG and blob background
const GRAD_TOP    = '#7B8FFF';
const GRAD_MID    = '#4556E8';
const GRAD_BOTTOM = '#1C2699';

// ─────────────────────────────────────────────────────────────────────────────
// Small icon helpers
// ─────────────────────────────────────────────────────────────────────────────
function SparkleIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill={color} opacity={0.9} />
      <Path d="M19 14L19.9 16.1L22 17L19.9 17.9L19 20L18.1 17.9L16 17L18.1 16.1L19 14Z" fill={color} opacity={0.6} />
      <Path d="M5 3L5.6 4.4L7 5L5.6 5.6L5 7L4.4 5.6L3 5L4.4 4.4L5 3Z" fill={color} opacity={0.5} />
    </Svg>
  );
}

function MiniCheck() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.2)" />
      <Path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M5 3L9 7L5 11" stroke={GRAD_BOTTOM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseX() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M5 5L15 15M15 5L5 15" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AIBadge() {
  return (
    <View style={s.aiBadge}>
      <SparkleIcon size={10} color="#fff" />
      <Text style={s.aiBadgeText}>AI Pick</Text>
    </View>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={5} fill="none" />
        <Circle cx={size/2} cy={size/2} r={r} stroke="#fff" strokeWidth={5} fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </Svg>
      <Text style={s.scoreText}>{score}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet data
// ─────────────────────────────────────────────────────────────────────────────
const AI_REC = {
  insurer: 'AXA', initial: 'A', price: 510, originalPrice: 610, score: 94,
  reason: 'Best value for your profile — quick linking, roadside assist included, and trusted claims history.',
  pros: ['Roadside assistance included', 'Fast 3-min linking time', '16% discount applied', '24/7 claims support'],
};

const COMPARISON = [
  { insurer: 'AXA', initial: 'A', price: 510, score: 94, tag: 'Best Value',   color: '#A8B8FF' },
  { insurer: 'RAK', initial: 'R', price: 480, score: 81, tag: 'Lowest Price', color: '#6FEAA8' },
  { insurer: 'RSA', initial: 'R', price: 520, score: 78, tag: 'Reliable',     color: 'rgba(255,255,255,0.6)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AINotchPanel({ hidden = false }: { hidden?: boolean }) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [sheetMounted, setSheetMounted] = useState(false);

  // ── Notch animations ──────────────────────────────────────────────────────
  const notchX    = useSharedValue(NOTCH_W);
  const notchOp   = useSharedValue(1);
  const shimmerOp = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  // ── Blob / sheet animations ───────────────────────────────────────────────
  /** 0 = notch size, 1 = full screen */
  const blobP      = useSharedValue(0);
  /** borderRadius of the expanding blob (decoupled from blobP for organic feel) */
  const blobRadius = useSharedValue(NOTCH_H / 2);
  /** Content fade-in after blob fully expands */
  const contentOp  = useSharedValue(0);

  // ── Mount: slide in + start animations ───────────────────────────────────
  useEffect(() => {
    notchX.value = withDelay(800, withSpring(0, { damping: 20, stiffness: 180 }));

    shimmerOp.value = withDelay(1400, withRepeat(withSequence(
      withTiming(0.4,  { duration: 500,  easing: Easing.out(Easing.sin) }),
      withTiming(0,    { duration: 500,  easing: Easing.in(Easing.sin)  }),
      withTiming(0,    { duration: 3000 }),
    ), -1, false));

    glowPulse.value = withDelay(1000, withRepeat(withSequence(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));
  }, []);

  // ── Hide when parent signals (scroll / expand / other sheet) ─────────────
  useEffect(() => {
    if (sheetMounted) return;
    if (hidden) {
      notchX.value = withTiming(NOTCH_W + 4, { duration: 180, easing: Easing.in(Easing.cubic) });
    } else {
      notchX.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  }, [hidden, sheetMounted]);

  // ── Open (tap or drag-triggered) ─────────────────────────────────────────
  const handleOpen = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetMounted(true);
    // Notch exits right
    notchX.value = withTiming(NOTCH_W + 8, { duration: 180, easing: Easing.in(Easing.cubic) });
    notchOp.value = withTiming(0, { duration: 140 });
    // Blob expands — spring gives organic overshoot "blob" feel
    blobP.value = withSpring(1, { damping: 22, stiffness: 160, mass: 1.1 });
    // BorderRadius: briefly over-rounds then flattens (blob squish effect)
    blobRadius.value = withSequence(
      withSpring(NOTCH_H * 0.65, { damping: 6, stiffness: 320, mass: 0.4 }),
      withSpring(0,               { damping: 22, stiffness: 120 })
    );
    // Content fades in after blob mostly expanded
    contentOp.value = withDelay(360, withTiming(1, { duration: 220 }));
  }, []);

  // ── Close ─────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    contentOp.value = withTiming(0, { duration: 140 });
    blobP.value      = withDelay(80, withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }));
    blobRadius.value = withDelay(80, withSpring(NOTCH_H / 2, { damping: 20, stiffness: 200 }));
    setTimeout(() => {
      setSheetMounted(false);
      notchOp.value = withTiming(1, { duration: 260 });
      notchX.value  = NOTCH_W;
      notchX.value  = withDelay(80, withSpring(0, { damping: 20, stiffness: 180 }));
    }, 400);
  }, []);

  // ── Notch drag-left → open gesture ───────────────────────────────────────
  const notchPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !sheetMounted,
      onMoveShouldSetPanResponder: (_, { dx }) => dx < -8,
      onPanResponderGrant: () => {
        setSheetMounted(true);
        notchX.value  = withTiming(NOTCH_W + 8, { duration: 100 });
        notchOp.value = withTiming(0, { duration: 80 });
      },
      onPanResponderMove: (_, { dx }) => {
        const p = Math.max(0, Math.min(1, -dx / (screenW * 0.6)));
        blobP.value      = p;
        blobRadius.value = NOTCH_H / 2 * (1 - p) + (p > 0.5 ? 0 : 30 * p * 2);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (-dx > screenW * 0.3 || vx < -0.4) {
          handleOpen();
        } else {
          // Snap back
          contentOp.value  = withTiming(0, { duration: 80 });
          blobP.value      = withSpring(0, { damping: 20, stiffness: 200 });
          blobRadius.value = withSpring(NOTCH_H / 2, { damping: 20, stiffness: 200 });
          setTimeout(() => {
            setSheetMounted(false);
            notchOp.value = withTiming(1, { duration: 260 });
            notchX.value  = NOTCH_W;
            notchX.value  = withDelay(80, withSpring(0, { damping: 20, stiffness: 180 }));
          }, 300);
        }
      },
    })
  ).current;

  // ── Sheet drag-down → close gesture ──────────────────────────────────────
  const sheetPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 8,
      onPanResponderMove: (_, { dy }) => {
        const p = Math.max(0, Math.min(1, 1 - dy / (screenH * 0.45)));
        blobP.value      = p;
        contentOp.value  = Math.min(1, p * 2 - 1);   // hide content when < 50%
        blobRadius.value = p < 0.5 ? (NOTCH_H / 2) * (1 - p * 2) : 0;
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > screenH * 0.18 || vy > 0.55) {
          handleClose();
        } else {
          // Snap back open
          blobP.value      = withSpring(1, { damping: 22, stiffness: 180 });
          blobRadius.value = withSpring(0, { damping: 22, stiffness: 120 });
          contentOp.value  = withTiming(1, { duration: 180 });
        }
      },
    })
  ).current;

  // ── Animated styles ───────────────────────────────────────────────────────
  const glowProps     = useAnimatedProps(() => ({ fillOpacity: shimmerOp.value }));
  const glowFillProps = useAnimatedProps(() => ({
    fillOpacity: interpolate(glowPulse.value, [0, 1], [0, 0.28]),
  }));

  const notchStyle = useAnimatedStyle(() => ({
    opacity:   notchOp.value,
    transform: [{ translateX: notchX.value }],
    ...(Platform.OS !== 'web' ? {
      shadowColor:   '#4A5CF5',
      shadowOffset:  { width: -6, height: 0 },
      shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.2, 0.75]),
      shadowRadius:  interpolate(glowPulse.value, [0, 1], [6, 22]),
    } : {}),
  }));

  const blobStyle = useAnimatedStyle(() => {
    const p = blobP.value;
    const r = blobRadius.value;
    return {
      position:             'absolute' as const,
      right:                0,
      top:                  interpolate(p, [0, 1], [(screenH - NOTCH_H) / 2, 0]),
      width:                interpolate(p, [0, 1], [NOTCH_W, screenW]),
      height:               interpolate(p, [0, 1], [NOTCH_H, screenH]),
      borderTopLeftRadius:    r,
      borderBottomLeftRadius: r,
      overflow:             'hidden' as const,
      zIndex:               100,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity:   contentOp.value,
    transform: [{ translateY: interpolate(contentOp.value, [0, 1], [14, 0]) }],
    flex:      1,
  }));

  // Sparkle icon centred in visible shape (x: BULGE_X→NOTCH_W, y: 12→208)
  const iconX = 33;
  const iconY = 101;

  return (
    <>
      {/* ── Notch ── */}
      <Pressable
        style={s.notchWrap}
        onPress={handleOpen}
        pointerEvents={sheetMounted ? 'none' : 'auto'}
        {...notchPan.panHandlers}
      >
        <Animated.View style={notchStyle}>
          <Svg width={NOTCH_W} height={NOTCH_H} viewBox={`0 0 ${NOTCH_W} ${NOTCH_H}`}>
            <Defs>
              <LinearGradient id="notchGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"   stopColor={GRAD_TOP}    stopOpacity="1" />
                <Stop offset="0.4" stopColor={GRAD_MID}    stopOpacity="1" />
                <Stop offset="1"   stopColor={GRAD_BOTTOM} stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="shimmerGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0"   stopColor="#ffffff" stopOpacity="0.22" />
                <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
                <Stop offset="1"   stopColor="#ffffff" stopOpacity="0"   />
              </LinearGradient>
            </Defs>
            <Path d={NOTCH_PATH} fill="url(#notchGrad)" />
            <Path d={NOTCH_PATH} fill="url(#shimmerGrad)" />
            <AnimatedPath d={NOTCH_PATH} fill="#8899FF" animatedProps={glowFillProps} />
            <AnimatedPath d={NOTCH_PATH} fill="#fff"    animatedProps={glowProps} />
            <G transform={`translate(${iconX}, ${iconY}) scale(0.9167)`}>
              <Path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="#fff" />
              <Path d="M19 14L19.9 16.1L22 17L19.9 17.9L19 20L18.1 17.9L16 17L18.1 16.1L19 14Z" fill="#fff" opacity={0.7} />
              <Path d="M5 3L5.6 4.4L7 5L5.6 5.6L5 7L4.4 5.6L3 5L4.4 4.4L5 3Z" fill="#fff" opacity={0.5} />
            </G>
          </Svg>
        </Animated.View>
      </Pressable>

      {/* ── Expanding blob → full-page sheet ── */}
      {sheetMounted && (
        <Animated.View style={blobStyle} pointerEvents="box-none">
          {/* Gradient background fills entire blob */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 1 1" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="blobBg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"   stopColor={GRAD_TOP}    stopOpacity="1" />
                <Stop offset="0.4" stopColor={GRAD_MID}    stopOpacity="1" />
                <Stop offset="1"   stopColor={GRAD_BOTTOM} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="1" height="1" fill="url(#blobBg)" />
          </Svg>

          {/* Sheet content fades in once blob is fully expanded */}
          <Animated.View style={[StyleSheet.absoluteFill, contentStyle]} pointerEvents="box-none">
            {/* Drag handle */}
            <View style={s.dragHandleWrap} {...sheetPan.panHandlers}>
              <View style={s.dragHandle} />
            </View>

            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top > 0 ? insets.top + 4 : 16 }]}>
              <View style={s.headerLeft}>
                <View style={s.headerIconWrap}>
                  <SparkleIcon size={18} color="#fff" />
                </View>
                <View>
                  <Text style={s.headerTitle}>AI Comparison</Text>
                  <Text style={s.headerSub}>Analysed {COMPARISON.length} quotes for you</Text>
                </View>
              </View>
              <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
                <CloseX />
              </Pressable>
            </View>

            {/* Scrollable content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.content}
              pointerEvents="auto"
            >
              {/* AI Recommendation card */}
              <View style={s.recCard}>
                <View style={s.recCardTop}>
                  <View style={s.recLeft}>
                    <View style={s.recLogo}>
                      <Text style={s.recLogoText}>{AI_REC.initial}</Text>
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.recInsurer}>{AI_REC.insurer}</Text>
                        <AIBadge />
                      </View>
                      <Text style={s.recType}>Third Party</Text>
                    </View>
                  </View>
                  <ScoreRing score={AI_REC.score} size={52} />
                </View>

                <View style={s.recPriceRow}>
                  <Text style={s.recOldPrice}>AED {AI_REC.originalPrice}.00</Text>
                  <Text style={s.recPrice}>AED {AI_REC.price}.00</Text>
                </View>

                <Text style={s.recReason}>{AI_REC.reason}</Text>

                <View style={s.prosList}>
                  {AI_REC.pros.map((p, i) => (
                    <View key={i} style={s.prosItem}>
                      <MiniCheck />
                      <Text style={s.prosText}>{p}</Text>
                    </View>
                  ))}
                </View>

                <Pressable style={s.selectRecBtn}>
                  <Text style={s.selectRecBtnText}>Select AXA — AED 510</Text>
                  <ChevronRight />
                </Pressable>
              </View>

              <Text style={s.sectionLabel}>ALL QUOTES RANKED</Text>

              {COMPARISON.map((q, i) => (
                <View key={q.insurer} style={s.compareRow}>
                  <Text style={s.compareRank}>#{i + 1}</Text>
                  <View style={[s.compareLogo, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={[s.compareLogoText, { color: q.color }]}>{q.initial}</Text>
                  </View>
                  <View style={s.compareMiddle}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.compareInsurer}>{q.insurer}</Text>
                      <View style={[s.compareTag, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                        <Text style={[s.compareTagText, { color: q.color }]}>{q.tag}</Text>
                      </View>
                    </View>
                    <View style={s.scoreBarWrap}>
                      <View style={[s.scoreBarFill, { width: `${q.score}%` as any, backgroundColor: q.color }]} />
                    </View>
                  </View>
                  <View style={s.compareRight}>
                    <Text style={s.compareScore}>{q.score}</Text>
                    <Text style={s.comparePrice}>AED {q.price}</Text>
                  </View>
                </View>
              ))}

              <View style={s.insightCard}>
                <SparkleIcon size={14} color="#fff" />
                <Text style={s.insightText}>
                  AXA scores highest overall — combining price, speed, and coverage quality for your vehicle profile.
                </Text>
              </View>

              <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — dark gradient theme throughout
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Notch ─────────────────────────────────────────────────────────────────
  notchWrap: {
    position:  'absolute',
    right:     0,
    top:       '50%' as any,
    marginTop: -(NOTCH_H / 2),
    zIndex:    99,
  },

  // ── Sheet ─────────────────────────────────────────────────────────────────
  dragHandleWrap: {
    alignItems:    'center',
    paddingTop:    12,
    paddingBottom: 6,
  },
  dragHandle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingBottom:     14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  closeBtn: {
    padding: 7, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  content: { padding: 16, gap: 12 },

  // ── AI badge ──────────────────────────────────────────────────────────────
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // ── Recommendation card ───────────────────────────────────────────────────
  recCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    20,
    padding:         16,
    gap:             12,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.18)',
  },
  recCardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recLogo: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  recLogoText:  { fontSize: 18, fontWeight: '800', color: '#fff' },
  recInsurer:   { fontSize: 15, fontWeight: '800', color: '#fff' },
  recType:      { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  scoreText:    { fontSize: 14, fontWeight: '800', color: '#fff' },
  recPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recOldPrice:  { fontSize: 11, color: 'rgba(255,255,255,0.45)', textDecorationLine: 'line-through' },
  recPrice:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  recReason:    { fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 18 },
  prosList:     { gap: 6 },
  prosItem:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  prosText:     { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  selectRecBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#fff',
    borderRadius: 14, height: 46, marginTop: 4,
  },
  selectRecBtnText: { fontSize: 14, fontWeight: '800', color: GRAD_BOTTOM },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8, marginTop: 4,
  },

  // ── Comparison rows ───────────────────────────────────────────────────────
  compareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  compareRank:    { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', width: 18, textAlign: 'center' },
  compareLogo: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  compareLogoText:  { fontSize: 13, fontWeight: '800' },
  compareMiddle:    { flex: 1, gap: 5 },
  compareInsurer:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  compareTag:       { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  compareTagText:   { fontSize: 9, fontWeight: '700' },
  scoreBarWrap: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden',
  },
  scoreBarFill:  { height: '100%', borderRadius: 2 },
  compareRight:  { alignItems: 'flex-end', gap: 2 },
  compareScore:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  comparePrice:  { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  // ── AI insight card ───────────────────────────────────────────────────────
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  insightText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
});
