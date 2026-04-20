/**
 * AINotchPanel
 * • Notch tab → full-page AI chat sheet
 * • AI responses include scrollable quote card suggestions
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
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
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Sparkle, X, ThumbsUp, ArrowRight } from 'phosphor-react-native';
import INSURER_LOGOS from '../constants/insurerLogos';

// ─────────────────────────────────────────────────────────────────────────────
// Notch constants
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);
const NOTCH_W  = 76;
const NOTCH_H  = 149;
const BULGE_X  = NOTCH_W - 40;
const NOTCH_PATH = [
  `M ${NOTCH_W},12`,
  `C ${NOTCH_W},66  ${BULGE_X},80  ${BULGE_X},110`,
  `C ${BULGE_X},140  ${NOTCH_W},154  ${NOTCH_W},208`,
  `Z`,
].join(' ');
const GRAD_TOP    = '#1D68FF';
const GRAD_MID    = '#6A3DAE';
const GRAD_BOTTOM = '#441452';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type QuoteSuggestion = {
  insurer: string;
  type: string;
  originalPrice: number | null;
  price: number;
};

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  quotes?: QuoteSuggestion[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Quote data pools for suggestions
// ─────────────────────────────────────────────────────────────────────────────
const TP_QUOTES: QuoteSuggestion[] = [
  { insurer: 'RAK',    type: 'Third Party', originalPrice: 580,  price: 480 },
  { insurer: 'AXA',   type: 'Third Party', originalPrice: 610,  price: 510 },
  { insurer: 'RSA',   type: 'Third Party', originalPrice: 620,  price: 520 },
  { insurer: 'ADNIC', type: 'Third Party', originalPrice: 650,  price: 545 },
];
const COMP_QUOTES: QuoteSuggestion[] = [
  { insurer: 'AXA',   type: 'Comprehensive', originalPrice: 1807, price: 1500 },
  { insurer: 'RSA',   type: 'Comprehensive', originalPrice: null, price: 1620 },
  { insurer: 'ADNIC', type: 'Comprehensive', originalPrice: 2011, price: 1750 },
];
const PLUS_QUOTES: QuoteSuggestion[] = [
  { insurer: 'RAK',    type: 'Shory Plus', originalPrice: 748, price: 620 },
  { insurer: 'AXA',   type: 'Shory Plus', originalPrice: 782, price: 648 },
  { insurer: 'ADNIC', type: 'Shory Plus', originalPrice: 826, price: 710 },
];
const ROADSIDE_QUOTES: QuoteSuggestion[] = [
  { insurer: 'AXA',           type: 'Third Party', originalPrice: 610,  price: 510 },
  { insurer: 'Orient',        type: 'Third Party', originalPrice: null, price: 572 },
  { insurer: 'Orient Takaful',type: 'Third Party', originalPrice: 738,  price: 642 },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI response engine
// ─────────────────────────────────────────────────────────────────────────────
let _responseIdx = 0;
const FALLBACK_RESPONSES = [
  "Based on your Honda Accord 2018 profile, AXA Third Party at AED 510 is your best option — roadside assist included with a 16% discount.",
  "Your clean claim history qualifies you for the maximum No Claims Discount across most insurers.",
  "Linking your policy takes as little as 3 minutes with AXA — the fastest insurer in your current quote list.",
];

function getAIResponse(input: string): { text: string; quotes: QuoteSuggestion[] } {
  const q = input.toLowerCase();

  if (q.includes('claim'))
    return { text: "To file a claim: contact your insurer within 24 hours, photograph the damage, obtain a police report, and submit your Emirates ID. Claims are typically processed in 5–7 working days.", quotes: [] };

  if (q.includes('cheap') || q.includes('lowest') || q.includes('price'))
    return { text: "Here are the most affordable Third Party plans for your Honda Accord. RAK Insurance offers the lowest at AED 480, with AXA at AED 510 offering the best overall value including roadside assist.", quotes: TP_QUOTES };

  if (q.includes('roadside'))
    return { text: "These plans include roadside assistance at no extra cost. AXA, Orient, and Orient Takaful all bundle it free — other insurers charge AED 10/year extra.", quotes: ROADSIDE_QUOTES };

  if (q.includes('comprehensive'))
    return { text: "Comprehensive plans cover both third-party liability and damage to your own vehicle. Ideal if your Honda Accord is valued above AED 50,000.", quotes: COMP_QUOTES };

  if (q.includes('compare') || (q.includes('third') && q.includes('party')))
    return { text: "Third Party covers damage you cause to others only. Comprehensive adds own-vehicle cover. Shory Plus adds a cash payout benefit if your car is totaled — a great middle ground.", quotes: [...TP_QUOTES.slice(0,2), ...PLUS_QUOTES.slice(0,1)] };

  if (q.includes('shory plus') || q.includes('shory+'))
    return { text: "Shory Plus is our exclusive product powered by NGI. Get Third Party coverage plus a cash benefit (AED 1,400–10,000) if your car is written off — priced between Third Party and Comprehensive.", quotes: PLUS_QUOTES };

  if (q.includes('renew') || q.includes('tip') || q.includes('save'))
    return { text: "Your clean claim history gives you up to 20% No Claims Discount. Renewing before expiry and paying annually (vs monthly) can save an additional 8–12%.", quotes: TP_QUOTES.slice(0, 2) };

  if (q.includes('feature'))
    return { text: "AXA scores highest on features: roadside assist included, 24/7 claims hotline, 3-minute linking, and driver + passenger personal accident cover at a competitive price.", quotes: [TP_QUOTES[1], PLUS_QUOTES[1]] };

  if (q.includes('best') || q.includes('policy') || q.includes('recommend'))
    return { text: "Based on your profile, here are my top recommendations. AXA Third Party leads with a value score of 94/100 — fastest linking, roadside assist included, and 16% discount applied.", quotes: TP_QUOTES.slice(0, 3) };

  const fallback = FALLBACK_RESPONSES[_responseIdx % FALLBACK_RESPONSES.length];
  _responseIdx++;
  return { text: fallback, quotes: TP_QUOTES.slice(0, 2) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick action chips
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { title: 'Best policies',   desc: 'What is the best TPL\npolicy for my Car?',    prompt: 'What is the best TPL policy for my car?' },
  { title: 'Best features',   desc: 'Which plan has the\nbest features?',           prompt: 'Which plan has the best features?' },
  { title: 'Claim process',   desc: 'How do I file an\ninsurance claim?',           prompt: 'How do I file an insurance claim?' },
  { title: 'Compare plans',   desc: 'Third Party vs\nComprehensive',               prompt: 'Compare Third Party vs Comprehensive plans' },
  { title: 'Roadside assist', desc: 'Which plans include\nroadside assistance?',   prompt: 'Which plans include roadside assistance?' },
  { title: 'Lowest price',    desc: 'Find cheapest cover\nfor my vehicle',         prompt: 'What is the lowest priced insurance for my vehicle?' },
  { title: 'Shory Plus',      desc: 'What is Shory Plus\nand how does it work?',   prompt: 'What is Shory Plus and how does it work?' },
  { title: 'Renewal tips',    desc: 'Tips to save on\nmy renewal',                 prompt: 'Give me tips to save on my insurance renewal' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mini quote card
// ─────────────────────────────────────────────────────────────────────────────
function QuoteMiniCard({ q }: { q: QuoteSuggestion }) {
  const hasDiscount = q.originalPrice !== null && q.originalPrice > q.price;
  const discount    = hasDiscount ? Math.round((1 - q.price / q.originalPrice!) * 100) : 0;

  return (
    <View style={qc.card}>
      {/* Top: logo + name + price */}
      <View style={qc.topRow}>
        <View style={qc.logoBox}>
          {INSURER_LOGOS[q.insurer] ? (
            <Image source={INSURER_LOGOS[q.insurer]} style={{ width: 34, height: 34 }} resizeMode="contain" />
          ) : (
            <Text style={qc.logoFallback}>{q.insurer[0]}</Text>
          )}
        </View>
        <View style={qc.nameCol}>
          <Text style={qc.insurerName}>{q.insurer}</Text>
          <Text style={qc.insurerType}>{q.type}</Text>
        </View>
        {hasDiscount && (
          <View style={qc.discountBadge}>
            <Text style={qc.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>

      {/* Price block */}
      <View style={qc.priceBlock}>
        {hasDiscount && (
          <Text style={qc.originalPrice}>AED {q.originalPrice}.00</Text>
        )}
        <View style={qc.currentRow}>
          <Text style={qc.aedLabel}>AED </Text>
          <Text style={qc.currentPrice}>{q.price}.00</Text>
        </View>
        <Text style={qc.installment}>Or split in 4 payments</Text>
      </View>

      {/* Action buttons */}
      <View style={qc.actions}>
        <Pressable style={qc.detailsBtn}>
          <Text style={qc.detailsBtnText}>More details</Text>
        </Pressable>
        <Pressable style={qc.selectBtn}>
          <Text style={qc.selectBtnText}>Select</Text>
        </Pressable>
      </View>
    </View>
  );
}

const qc = StyleSheet.create({
  card: {
    width:           240,
    backgroundColor: '#fff',
    borderRadius:    16,
    padding:         14,
    gap:             10,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.10,
    shadowRadius:    10,
    elevation:       4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  logoBox: {
    width: 46, height: 46,
    borderRadius:   12,
    borderWidth:    1,
    borderColor:    '#eee',
    backgroundColor:'#fafafa',
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoFallback: { fontSize: 18, fontWeight: '800', color: '#3D5AF1' },
  nameCol:      { flex: 1 },
  insurerName:  { fontSize: 14, fontWeight: '800', color: '#111' },
  insurerType:  { fontSize: 11, color: '#888', marginTop: 2 },
  discountBadge: {
    backgroundColor: '#fff0e8',
    borderRadius:    6,
    paddingHorizontal: 7,
    paddingVertical:   3,
  },
  discountText: { fontSize: 10, fontWeight: '800', color: '#d45d00' },
  priceBlock:   { gap: 1 },
  originalPrice:{ fontSize: 12, color: '#aaa', textDecorationLine: 'line-through', fontWeight: '600' },
  currentRow:   { flexDirection: 'row', alignItems: 'baseline' },
  aedLabel:     { fontSize: 12, fontWeight: '600', color: '#111' },
  currentPrice: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  installment:  { fontSize: 10, color: '#999', marginTop: 1 },
  actions:      { flexDirection: 'row', gap: 8 },
  detailsBtn: {
    flex: 1, height: 34, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#c5d9ff',
    alignItems: 'center', justifyContent: 'center',
  },
  detailsBtnText: { fontSize: 12, fontWeight: '700', color: '#3D5AF1' },
  selectBtn: {
    flex: 1, height: 34, borderRadius: 8,
    backgroundColor: '#3D5AF1',
    alignItems: 'center', justifyContent: 'center',
  },
  selectBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Typing dots
// ─────────────────────────────────────────────────────────────────────────────
function TypingDots() {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);
  useEffect(() => {
    const anim = (sv: typeof d1, delay: number) => {
      sv.value = withDelay(delay, withRepeat(withSequence(
        withTiming(1,   { duration: 350 }),
        withTiming(0.3, { duration: 350 }),
      ), -1, false));
    };
    anim(d1, 0); anim(d2, 160); anim(d3, 320);
  }, []);
  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
  return (
    <View style={s.aiBubble}>
      <View style={s.dotsRow}>
        <Animated.View style={[s.dot, s1]} />
        <Animated.View style={[s.dot, s2]} />
        <Animated.View style={[s.dot, s3]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shory orb
// ─────────────────────────────────────────────────────────────────────────────
function ShoryOrb() {
  return (
    <View style={s.orbWrap}>
      <Svg width={97} height={97} viewBox="0 0 97 97" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0"    stopColor="#A0B4FF" stopOpacity="0.9" />
            <Stop offset="0.35" stopColor="#7B5FDD" stopOpacity="0.95" />
            <Stop offset="0.7"  stopColor="#C45FBB" stopOpacity="0.9" />
            <Stop offset="1"    stopColor="#4A3AFF" stopOpacity="1"   />
          </LinearGradient>
          <LinearGradient id="orbShimmer" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor="#ffffff" stopOpacity="0.35" />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
            <Stop offset="1"   stopColor="#ffffff" stopOpacity="0"    />
          </LinearGradient>
        </Defs>
        <Circle cx={48.5} cy={48.5} r={48.5} fill="url(#orbGrad)" />
        <Circle cx={48.5} cy={48.5} r={48.5} fill="url(#orbShimmer)" />
      </Svg>
      <View style={s.orbContent}>
        <Sparkle size={20} color="#fff" weight="fill" style={{ marginBottom: 2 }} />
        <Text style={s.orbLabel}>Shory AI</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AINotchPanel({ hidden = false }: { hidden?: boolean }) {
  const dims = useWindowDimensions();
  const [containerSize, setContainerSize] = useState({ width: dims.width, height: dims.height });
  const screenW = containerSize.width;
  const screenH = containerSize.height;
  const insets = useSafeAreaInsets();
  const [sheetMounted, setSheetMounted] = useState(false);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputVal, setInputVal]     = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const inputRef      = useRef<TextInput>(null);

  // ── Orb → chat transition ─────────────────────────────────────────────────
  const orbScale   = useSharedValue(1);
  const orbOp      = useSharedValue(1);
  const chatOp     = useSharedValue(0);
  const chatSlideY = useSharedValue(20);

  const orbAnimStyle  = useAnimatedStyle(() => ({
    opacity: orbOp.value,
    transform: [{ scale: orbScale.value }],
  }));
  const chatAnimStyle = useAnimatedStyle(() => ({
    opacity:   chatOp.value,
    transform: [{ translateY: chatSlideY.value }],
    flex: 1,
  }));

  const hasMessages = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setMessages(prev => {
      if (prev.length === 0) {
        orbScale.value = withTiming(0.4, { duration: 300, easing: Easing.in(Easing.cubic) });
        orbOp.value    = withTiming(0,   { duration: 280 });
        chatOp.value   = withDelay(240, withTiming(1,  { duration: 300 }));
        chatSlideY.value = withDelay(240, withSpring(0, { damping: 20, stiffness: 180 }));
      }
      return [...prev, { id: Date.now().toString(), role: 'user', text: trimmed }];
    });
    setInputVal('');
    setIsAiTyping(true);
    scrollToBottom();

    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      const { text: reply, quotes } = getAIResponse(trimmed);
      setMessages(prev => [
        ...prev,
        { id: `${Date.now()}_ai`, role: 'ai', text: reply, quotes: quotes.length > 0 ? quotes : undefined },
      ]);
      setIsAiTyping(false);
      scrollToBottom();
    }, delay);
  }, [scrollToBottom]);

  // ── Notch animations ──────────────────────────────────────────────────────
  const notchX    = useSharedValue(NOTCH_W);
  const notchOp   = useSharedValue(1);
  const shimmerOp = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const blobP      = useSharedValue(0);
  const blobRadius = useSharedValue(NOTCH_H / 2);
  const contentOp  = useSharedValue(0);

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

  useEffect(() => {
    if (sheetMounted) return;
    notchX.value = hidden
      ? withTiming(NOTCH_W + 4, { duration: 180, easing: Easing.in(Easing.cubic) })
      : withSpring(0, { damping: 20, stiffness: 200 });
  }, [hidden, sheetMounted]);

  const handleOpen = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetMounted(true);
    notchX.value = withTiming(NOTCH_W + 8, { duration: 180, easing: Easing.in(Easing.cubic) });
    notchOp.value = withTiming(0, { duration: 140 });
    blobP.value = withSpring(1, { damping: 22, stiffness: 160, mass: 1.1 });
    blobRadius.value = withSequence(
      withSpring(NOTCH_H * 0.65, { damping: 6, stiffness: 320, mass: 0.4 }),
      withSpring(0,               { damping: 22, stiffness: 120 })
    );
    contentOp.value = withDelay(360, withTiming(1, { duration: 220 }));
  }, []);

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

  const notchPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !sheetMounted,
    onMoveShouldSetPanResponder:  (_, { dx }) => dx < -8,
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
  })).current;

  const sheetPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  (_, { dy }) => dy > 8,
    onPanResponderMove: (_, { dy }) => {
      const p = Math.max(0, Math.min(1, 1 - dy / (screenH * 0.45)));
      blobP.value      = p;
      contentOp.value  = Math.min(1, p * 2 - 1);
      blobRadius.value = p < 0.5 ? (NOTCH_H / 2) * (1 - p * 2) : 0;
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy > screenH * 0.18 || vy > 0.55) {
        handleClose();
      } else {
        blobP.value      = withSpring(1, { damping: 22, stiffness: 180 });
        blobRadius.value = withSpring(0, { damping: 22, stiffness: 120 });
        contentOp.value  = withTiming(1, { duration: 180 });
      }
    },
  })).current;

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

  // ── Shared chips row ──────────────────────────────────────────────────────
  const chipsRow = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
      {QUICK_ACTIONS.map(a => (
        <Pressable key={a.title} style={s.chip} onPress={() => sendMessage(a.prompt)}>
          <View style={s.chipHeader}>
            <ThumbsUp size={13} color="#fff" weight="fill" />
            <Text style={s.chipTitle}>{a.title}</Text>
          </View>
          <Text style={s.chipDesc}>{a.desc}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <>
      {/* Size probe */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) setContainerSize({ width, height });
        }}
      />

      {/* Notch */}
      <Pressable
        style={s.notchWrap}
        onPress={handleOpen}
        pointerEvents={sheetMounted ? 'none' : 'auto'}
        {...notchPan.panHandlers}
      >
        <Animated.View style={notchStyle}>
          <Svg width={NOTCH_W} height={NOTCH_H} viewBox="0 0 50 220">
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
          </Svg>
          <View style={s.notchIconWrap} pointerEvents="none">
            <Sparkle size={20} color="#fff" weight="fill" />
          </View>
        </Animated.View>
      </Pressable>

      {/* Expanding blob sheet */}
      {sheetMounted && (
        <Animated.View style={blobStyle} pointerEvents="box-none">
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

          <Animated.View style={[StyleSheet.absoluteFill, contentStyle]} pointerEvents="box-none">

            {/* Nav bar */}
            <View style={[s.navBar, { paddingTop: insets.top > 0 ? insets.top + 4 : 20 }]}
              {...sheetPan.panHandlers}
            >
              <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
                <X size={22} color="rgba(255,255,255,0.9)" />
              </Pressable>
              <Text style={s.navTitle}>New conversation</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Middle area */}
            {!hasMessages ? (
              /* Empty: orb + tagline + chips */
              <Animated.View style={[s.emptyState, orbAnimStyle]}>
                <View style={s.orbSection} pointerEvents="none">
                  <ShoryOrb />
                </View>
                <Text style={s.tagline} pointerEvents="none">
                  I am here to simplify{'\n'}your insurance
                </Text>
                <View style={s.greetingSection} pointerEvents="auto">
                  <Text style={s.greetingText}>Hi, How can I help you?</Text>
                  {chipsRow}
                </View>
              </Animated.View>
            ) : (
              /* Chat thread */
              <Animated.View style={chatAnimStyle} pointerEvents="box-none">
                <ScrollView
                  ref={chatScrollRef}
                  style={s.chatScroll}
                  contentContainerStyle={s.chatContent}
                  showsVerticalScrollIndicator={false}
                  pointerEvents="auto"
                >
                  {messages.map(msg => (
                    <View key={msg.id}>
                      {/* Message bubble */}
                      <View style={[s.bubble, msg.role === 'user' ? s.userBubble : s.aiBubbleWrap]}>
                        {msg.role === 'ai' && (
                          <View style={s.aiLabel}>
                            <Sparkle size={10} color="rgba(255,255,255,0.65)" weight="fill" />
                            <Text style={s.aiLabelText}>Shory AI</Text>
                          </View>
                        )}
                        <Text style={[s.bubbleText, msg.role === 'user' ? s.userText : s.aiText]}>
                          {msg.text}
                        </Text>
                      </View>

                      {/* Quote card suggestions */}
                      {msg.role === 'ai' && msg.quotes && msg.quotes.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={s.quoteCardsRow}
                          style={s.quoteCardsScroll}
                        >
                          {msg.quotes.map((q, i) => (
                            <QuoteMiniCard key={`${q.insurer}-${i}`} q={q} />
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  ))}

                  {isAiTyping && <TypingDots />}
                </ScrollView>

                {/* Chips above input */}
                <View style={s.chatChipsWrap} pointerEvents="auto">
                  {chipsRow}
                </View>
              </Animated.View>
            )}

            {/* Input bar */}
            <View style={[s.inputBar, { marginBottom: insets.bottom + 16 }]} pointerEvents="auto">
              <TextInput
                ref={inputRef}
                style={s.inputText}
                placeholder="Ask about your quotes"
                placeholderTextColor="rgba(255,255,255,0.5)"
                returnKeyType="send"
                value={inputVal}
                onChangeText={setInputVal}
                onSubmitEditing={() => sendMessage(inputVal)}
                blurOnSubmit={false}
              />
              <Pressable
                style={[s.sendBtn, inputVal.trim().length > 0 && s.sendBtnActive]}
                onPress={() => sendMessage(inputVal)}
                hitSlop={8}
              >
                <ArrowRight
                  size={18}
                  color={inputVal.trim().length > 0 ? '#fff' : 'rgba(255,255,255,0.35)'}
                  weight="bold"
                />
              </Pressable>
            </View>

          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  notchIconWrap: {
    position: 'absolute', left: 56 - 10, top: NOTCH_H / 2 - 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  notchWrap: {
    position: 'absolute', right: -6, top: '50%' as any,
    marginTop: -(NOTCH_H / 2), zIndex: 99,
  },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  navTitle: {
    fontSize: 16, fontWeight: '600', color: 'rgba(241,241,244,0.9)', letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  emptyState: { flex: 1 },
  orbSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbWrap: {
    width: 97, height: 97, borderRadius: 48.5,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  orbContent: { alignItems: 'center', justifyContent: 'center' },
  orbLabel: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },

  tagline: {
    fontSize: 20, fontWeight: '700', color: '#fff',
    textAlign: 'center', lineHeight: 28, marginBottom: 24, paddingHorizontal: 40,
  },
  greetingSection: { paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  greetingText: { fontSize: 16, fontWeight: '500', color: '#fff' },

  chipsRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  chip: {
    width: 175, backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14, padding: 12, gap: 7,
  },
  chipHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipTitle:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  chipDesc:   { fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 14 },

  chatScroll:   { flex: 1 },
  chatContent:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 },
  chatChipsWrap:{ marginBottom: 8 },

  bubble:      { maxWidth: '85%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  userBubble:  { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.18)', borderBottomRightRadius: 4 },
  aiBubbleWrap:{ alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.28)', borderBottomLeftRadius: 4 },
  aiLabel:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  aiLabelText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },
  bubbleText:  { fontSize: 14, lineHeight: 20 },
  userText:    { color: '#fff', fontWeight: '500' },
  aiText:      { color: 'rgba(255,255,255,0.92)' },

  quoteCardsScroll: { marginTop: 10, marginBottom: 4 },
  quoteCardsRow:    { paddingLeft: 0, paddingRight: 12, gap: 10 },

  // Typing dots
  aiBubble: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10,
  },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center', height: 16 },
  dot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16,
    borderWidth: 0.5, borderColor: 'rgba(186,186,186,0.5)', gap: 10,
  },
  inputText: { flex: 1, fontSize: 14, color: '#fff' },
  sendBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sendBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
});
