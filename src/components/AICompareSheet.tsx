/**
 * AICompareSheet — full-screen AI quote comparison panel.
 * Slides in from the right with a spring entrance.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';

// ── Sparkle SVG icon ──────────────────────────────────────────────────────────
function SparkleIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
        fill={color}
        opacity={0.9}
      />
      <Path
        d="M19 14L19.9 16.1L22 17L19.9 17.9L19 20L18.1 17.9L16 17L18.1 16.1L19 14Z"
        fill={color}
        opacity={0.6}
      />
      <Path
        d="M5 3L5.6 4.4L7 5L5.6 5.6L5 7L4.4 5.6L3 5L4.4 4.4L5 3Z"
        fill={color}
        opacity={0.5}
      />
    </Svg>
  );
}

// ── Check icon ────────────────────────────────────────────────────────────────
function MiniCheck({ color = Colors.green500 }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx="7" cy="7" r="7" fill={color} opacity={0.15} />
      <Path d="M4 7L6 9L10 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Close icon ────────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M4 4L14 14M14 4L4 14" stroke={Colors.gray600} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Chevron right ─────────────────────────────────────────────────────────────
function ChevronRight({ color = Colors.brand600 }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M5 3L9 7L5 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── AI badge ──────────────────────────────────────────────────────────────────
function AIBadge() {
  return (
    <View style={styles.aiBadge}>
      <SparkleIcon size={11} color="#fff" />
      <Text style={styles.aiBadgeText}>AI Pick</Text>
    </View>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const AI_RECOMMENDATION = {
  insurer: 'AXA',
  initial: 'A',
  price: 510,
  originalPrice: 610,
  score: 94,
  reason: 'Best value for your profile — quick linking, roadside assist included, and trusted claims history.',
  pros: ['Roadside assistance included', 'Fast 3-min linking time', '16% discount applied', '24/7 claims support'],
  features: { roadsideAssist: 'Included', personalAccident: 'Driver', avgTime: 3 },
};

const COMPARISON = [
  { insurer: 'AXA',   initial: 'A', price: 510, score: 94, tag: 'Best Value',   color: Colors.brand600 },
  { insurer: 'RAK',   initial: 'R', price: 480, score: 81, tag: 'Lowest Price', color: '#30c078' },
  { insurer: 'RSA',   initial: 'R', price: 520, score: 78, tag: 'Reliable',     color: Colors.gray700 },
];

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.gray100} strokeWidth={5} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={Colors.brand600} strokeWidth={5} fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AICompareSheet({ visible, onClose }: Props) {
  const insets  = useSafeAreaInsets();
  const slideX  = useSharedValue(420);
  const scrimOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideX.value  = withSpring(0, { damping: 28, stiffness: 280, mass: 0.9 });
      scrimOp.value = withTiming(1, { duration: 280 });
    } else {
      slideX.value  = withTiming(420, { duration: 300, easing: Easing.in(Easing.cubic) });
      scrimOp.value = withTiming(0, { duration: 240 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOp.value }));

  if (!visible && slideX.value >= 420) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Scrim */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <SparkleIcon size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Comparison</Text>
              <Text style={styles.headerSub}>Analysed {COMPARISON.length} quotes for you</Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <CloseIcon />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── AI Recommendation card ── */}
          <View style={styles.recCard}>
            <View style={styles.recCardTop}>
              <View style={styles.recLeft}>
                <View style={styles.recLogo}>
                  <Text style={styles.recLogoText}>{AI_RECOMMENDATION.initial}</Text>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.recInsurer}>{AI_RECOMMENDATION.insurer}</Text>
                    <AIBadge />
                  </View>
                  <Text style={styles.recType}>Third Party</Text>
                </View>
              </View>
              <ScoreRing score={AI_RECOMMENDATION.score} size={52} />
            </View>

            <View style={styles.recPriceRow}>
              <Text style={styles.recOldPrice}>AED {AI_RECOMMENDATION.originalPrice}.00</Text>
              <Text style={styles.recPrice}>AED {AI_RECOMMENDATION.price}.00</Text>
            </View>

            <Text style={styles.recReason}>{AI_RECOMMENDATION.reason}</Text>

            <View style={styles.prosList}>
              {AI_RECOMMENDATION.pros.map((p, i) => (
                <View key={i} style={styles.prosItem}>
                  <MiniCheck />
                  <Text style={styles.prosText}>{p}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.selectRecBtn}>
              <Text style={styles.selectRecBtnText}>Select AXA — AED 510</Text>
              <ChevronRight color="#fff" />
            </Pressable>
          </View>

          {/* ── Section label ── */}
          <Text style={styles.sectionLabel}>ALL QUOTES RANKED</Text>

          {/* ── Comparison rows ── */}
          {COMPARISON.map((q, i) => (
            <View key={q.insurer} style={styles.compareRow}>
              <Text style={styles.compareRank}>#{i + 1}</Text>
              <View style={[styles.compareLogo, { borderColor: q.color + '33' }]}>
                <Text style={[styles.compareLogoText, { color: q.color }]}>{q.initial}</Text>
              </View>
              <View style={styles.compareMiddle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.compareInsurer}>{q.insurer}</Text>
                  <View style={[styles.compareTag, { backgroundColor: q.color + '18' }]}>
                    <Text style={[styles.compareTagText, { color: q.color }]}>{q.tag}</Text>
                  </View>
                </View>
                <View style={styles.scoreBarWrap}>
                  <View style={[styles.scoreBarFill, { width: `${q.score}%` as any, backgroundColor: q.color }]} />
                </View>
              </View>
              <View style={styles.compareRight}>
                <Text style={styles.compareScore}>{q.score}</Text>
                <Text style={styles.comparePrice}>AED {q.price}</Text>
              </View>
            </View>
          ))}

          {/* ── AI insight footer ── */}
          <View style={styles.insightCard}>
            <SparkleIcon size={14} color={Colors.brand600} />
            <Text style={styles.insightText}>
              AXA scores highest overall — combining price, speed, and coverage quality for your vehicle profile.
            </Text>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(20,18,30,0.55)',
  },
  sheet: {
    position:        'absolute',
    top:             0,
    right:           0,
    bottom:          0,
    width:           '100%',
    backgroundColor: '#f7f8fc',
  },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    paddingBottom:    14,
    backgroundColor:  Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.brand600,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.gray900 },
  headerSub:   { fontSize: 11, color: Colors.gray600, marginTop: 1 },
  closeBtn:    { padding: 6, borderRadius: 8, backgroundColor: Colors.gray100 },

  content: { padding: 16, gap: 12 },

  // AI Pick badge
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.brand600,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Recommendation card
  recCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: Colors.brand600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: Colors.brand100,
  },
  recCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recLogo: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.brand50,
    borderWidth: 1, borderColor: Colors.brand100,
    alignItems: 'center', justifyContent: 'center',
  },
  recLogoText:  { fontSize: 18, fontWeight: '800', color: Colors.brand600 },
  recInsurer:   { fontSize: 15, fontWeight: '800', color: Colors.gray900 },
  recType:      { fontSize: 10, color: Colors.gray600, marginTop: 1 },
  scoreText:    { fontSize: 14, fontWeight: '800', color: Colors.brand600 },
  recPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recOldPrice:  { fontSize: 11, color: Colors.gray400, textDecorationLine: 'line-through' },
  recPrice:     { fontSize: 22, fontWeight: '800', color: Colors.gray900, letterSpacing: -0.5 },
  recReason:    { fontSize: 12, color: Colors.gray700, lineHeight: 18 },
  prosList:     { gap: 6 },
  prosItem:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  prosText:     { fontSize: 12, color: Colors.gray800 },
  selectRecBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.brand600,
    borderRadius: 14, height: 46,
    marginTop: 4,
  },
  selectRecBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.gray500,
    letterSpacing: 0.8, marginTop: 4,
  },

  // Compare rows
  compareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  compareRank:      { fontSize: 11, fontWeight: '700', color: Colors.gray400, width: 18, textAlign: 'center' },
  compareLogo: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  compareLogoText:  { fontSize: 13, fontWeight: '800' },
  compareMiddle:    { flex: 1, gap: 5 },
  compareInsurer:   { fontSize: 13, fontWeight: '700', color: Colors.gray900 },
  compareTag: {
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1,
  },
  compareTagText:   { fontSize: 9, fontWeight: '700' },
  scoreBarWrap: {
    height: 4, borderRadius: 2,
    backgroundColor: Colors.gray100, overflow: 'hidden',
  },
  scoreBarFill:     { height: '100%', borderRadius: 2 },
  compareRight:     { alignItems: 'flex-end', gap: 2 },
  compareScore:     { fontSize: 14, fontWeight: '800', color: Colors.gray900 },
  comparePrice:     { fontSize: 10, color: Colors.gray600 },

  // AI insight
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.brand50,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.brand100,
    marginTop: 4,
  },
  insightText: { flex: 1, fontSize: 12, color: Colors.brand600, lineHeight: 18 },
});
