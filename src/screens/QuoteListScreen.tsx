import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import NavBar from '../components/NavBar';
import PressableScale from '../components/PressableScale';
import AINotchPanel from '../components/AINotchPanel';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'QuoteList'>;
};

const VEHICLE_IMG = 'https://www.figma.com/api/mcp/asset/dd28d07d-06de-4a9a-a3c2-01d761d7e57a';

type Quote = {
  id: string;
  insurer: string;
  type: string;
  originalPrice: number | null;
  price: number;
  roadsideAssist: string;
  personalAccident: string;
  avgTime: number;
  category: 'third-party' | 'shory-plus' | 'comprehensive';
};

const QUOTES: Quote[] = [
  { id: '1', insurer: 'RAK',   type: 'Third party',  originalPrice: 580,  price: 480,  roadsideAssist: '+ AED 10',  personalAccident: 'Driver',           avgTime: 5,  category: 'third-party' },
  { id: '2', insurer: 'AXA',   type: 'Third party',  originalPrice: 610,  price: 510,  roadsideAssist: 'Included',  personalAccident: 'Driver',           avgTime: 3,  category: 'third-party' },
  { id: '3', insurer: 'RSA',   type: 'Third party',  originalPrice: 620,  price: 520,  roadsideAssist: '+ AED 10',  personalAccident: 'Driver',           avgTime: 8,  category: 'third-party' },
  { id: '4', insurer: 'ADNIC', type: 'Third party',  originalPrice: 880,  price: 780,  roadsideAssist: '+ AED 10',  personalAccident: 'Driver',           avgTime: 6,  category: 'third-party' },
  { id: '5', insurer: 'Sukoon',type: 'Third Party',  originalPrice: null, price: 534,  roadsideAssist: '+ AED 10',  personalAccident: 'Driver Only',      avgTime: 12, category: 'third-party' },
  { id: '6', insurer: 'RAK',   type: 'Shory Plus',   originalPrice: 750,  price: 620,  roadsideAssist: 'Included',  personalAccident: 'Driver + Passenger',avgTime: 4, category: 'shory-plus' },
  { id: '7', insurer: 'AXA',   type: 'Comprehensive',originalPrice: 1800, price: 1500, roadsideAssist: 'Included',  personalAccident: 'Driver + Family',  avgTime: 5,  category: 'comprehensive' },
];

const FILTER_TABS: { label: string; sub: string; value: Quote['category'] }[] = [
  { label: 'Third Party',   sub: 'From AED 480',   value: 'third-party' },
  { label: 'Shory Plus',    sub: 'From AED 585',   value: 'shory-plus' },
  { label: 'Comprehensive', sub: 'From AED 1,200', value: 'comprehensive' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chevron icon
// ─────────────────────────────────────────────────────────────────────────────
function ChevronIcon({ up, color = Colors.brand600, size = 14 }: { up: boolean; color?: string; size?: number }) {
  return (
    <Svg width={size} height={size * 0.65} viewBox="0 0 14 9" fill="none">
      <Path
        d={up ? 'M1 8L7 2L13 8' : 'M1 1L7 7L13 1'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle details strip (auto-expand 4s, tap image/chevron to toggle)
// ─────────────────────────────────────────────────────────────────────────────
const EXPANDED_CONTENT_H = 218;

const VEHICLE_DETAILS: { label: string; value: string; bold?: boolean }[] = [
  { label: "Owner's EID number",   value: '784-\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022000-1' },
  { label: 'Vehicle',              value: 'Honda Accord 2018', bold: true },
  { label: 'Specs',                value: 'GCC' },
  { label: 'Your policy start date', value: '31/12/2024' },
  { label: 'Estimated value',      value: 'AED 75,000' },
  { label: 'Claim history',        value: 'Never', bold: true },
];

function VehicleStrip({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const expandH  = useSharedValue(0);
  const chevRot  = useSharedValue(0);

  useEffect(() => {
    expandH.value = withSpring(expanded ? EXPANDED_CONTENT_H : 0, { damping: 22, stiffness: 200 });
    chevRot.value = withTiming(expanded ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [expanded]);

  const expandedStyle = useAnimatedStyle(() => ({
    height:   expandH.value,
    opacity:  interpolate(expandH.value, [0, EXPANDED_CONTENT_H * 0.4, EXPANDED_CONTENT_H], [0, 0, 1]),
    overflow: 'hidden',
  }));

  const chevStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevRot.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View style={styles.vehicleStrip}>
      {/* Collapsed row */}
      <View style={styles.vehicleRow}>
        <View style={styles.vehicleLeft}>
          <Text style={styles.stripLabel}>Vehicle details</Text>
          <Text style={styles.stripValue}>Honda Accord 2018</Text>
        </View>

        {/* Tap vehicle image to toggle */}
        <Pressable onPress={onToggle} hitSlop={8}>
          <Image source={{ uri: VEHICLE_IMG }} style={styles.vehicleImg} resizeMode="contain" />
        </Pressable>

        {/* Chevron replaces "Edit" */}
        <Pressable onPress={onToggle} hitSlop={12} style={styles.chevronBtn}>
          <Animated.View style={chevStyle}>
            <ChevronIcon up={false} color={Colors.brand600} size={16} />
          </Animated.View>
        </Pressable>
      </View>

      {/* Expanded content */}
      <Animated.View style={expandedStyle}>
        <View style={styles.expandedContent}>
          <Text style={styles.detailsTitle}>Details</Text>
          {VEHICLE_DETAILS.map((row, i) => (
            <View key={i} style={[styles.detailRow, i === VEHICLE_DETAILS.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.detailRowLabel}>{row.label}</Text>
              <Text style={[styles.detailRowValue, row.bold && styles.detailRowValueBold]}>{row.value}</Text>
            </View>
          ))}
          <Pressable onPress={onToggle} hitSlop={8} style={styles.editBelowBtn}>
            <Text style={styles.editVehicleText}>Edit</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter bar with sliding highlighter
// ─────────────────────────────────────────────────────────────────────────────
function FilterBar({
  activeFilter,
  onPress,
}: {
  activeFilter: Quote['category'];
  onPress: (v: Quote['category']) => void;
}) {
  const [barWidth, setBarWidth] = useState(0);
  const activeIdx    = FILTER_TABS.findIndex(t => t.value === activeFilter);
  const highlightX   = useSharedValue(0);
  const tabW         = barWidth / 3;

  useEffect(() => {
    if (tabW > 0) {
      highlightX.value = withSpring(activeIdx * tabW, { damping: 22, stiffness: 240 });
    }
  }, [activeFilter, tabW]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
    width: tabW > 0 ? tabW : '33.33%' as any,
  }));

  return (
    <View
      style={styles.filterBar}
      onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* Sliding highlight */}
      {tabW > 0 && (
        <Animated.View style={[styles.filterHighlight, highlightStyle]} pointerEvents="none" />
      )}

      {FILTER_TABS.map((t) => {
        const isActive = activeFilter === t.value;
        return (
          <Pressable
            key={t.value}
            style={styles.filterTabWrap}
            onPress={() => onPress(t.value)}
          >
            <Text style={[styles.filterTabLabel, isActive && styles.filterTabLabelActive]} numberOfLines={1}>
              {t.label}
            </Text>
            <Text style={[styles.filterTabSub, isActive && styles.filterTabSubActive]} numberOfLines={1}>
              {t.sub}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small info icon (circle with i)
// ─────────────────────────────────────────────────────────────────────────────
function InfoIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 13 13" fill="none">
      <Circle cx="6.5" cy="6.5" r="6" stroke={Colors.gray400} strokeWidth="1" />
      <Path
        d="M6.5 6V9.5M6.5 4.5V3.5"
        stroke={Colors.gray400}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Green filled checkmark circle
// ─────────────────────────────────────────────────────────────────────────────
function CheckBadge() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="8" fill={Colors.green500} />
      <Path
        d="M4.5 8L6.8 10.3L11.5 5.5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const POSITIVE_VALUES = new Set(['Included', 'Driver', 'Driver Only', 'Driver + Passenger', 'Driver + Family']);

// ─────────────────────────────────────────────────────────────────────────────
// Quote card with staggered entrance
// ─────────────────────────────────────────────────────────────────────────────
function QuoteCard({ quote, index }: { quote: Quote; index: number }) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    opacity.value    = withDelay(index * 80, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(index * 80, withSpring(0, { damping: 18, stiffness: 120 }));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelect  = useCallback(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, []);
  const handleDetails = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const hasDiscount = quote.originalPrice !== null && quote.originalPrice > quote.price;
  const discount    = hasDiscount ? Math.round((1 - quote.price / quote.originalPrice!) * 100) : 0;

  return (
    <Animated.View style={[entranceStyle, { marginHorizontal: 16, marginBottom: 12 }]}>
      <PressableScale scaleTo={0.985}>
        <View style={styles.card}>

          {/* Top row: avg time + discount badge */}
          <View style={styles.cardTopRow}>
            <Text style={[styles.avgTime, quote.avgTime > 10 && styles.avgTimeWarning]}>
              {'Avg linking time '}
              <Text style={styles.avgTimeBracket}>{'<'}{quote.avgTime}{'>'}</Text>
              {' minutes.'}
            </Text>
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          {/* Insurer row */}
          <View style={styles.cardRow}>
            <View style={styles.insurerLeft}>
              <View style={styles.insurerLogo}>
                <Text style={styles.insurerInitial}>{quote.insurer[0]}</Text>
              </View>
              <View>
                <Text style={styles.insurerName}>{quote.insurer}</Text>
                <Text style={styles.insurerType}>{quote.type}</Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceBlock}>
              {quote.originalPrice && (
                <View style={styles.originalRow}>
                  <Text style={styles.aedTiny}>AED </Text>
                  <Text style={styles.originalPrice}>{quote.originalPrice}.00</Text>
                </View>
              )}
              <View style={styles.currentRow}>
                <Text style={styles.aedMid}>AED </Text>
                <Text style={styles.currentPrice}>{quote.price}.00</Text>
              </View>
              <Text style={styles.installment}>Or split in 4 payments</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <View style={styles.featureLabelRow}>
                <Text style={styles.featureLabel}>Roadside Assist.</Text>
                <InfoIcon />
              </View>
              <View style={styles.featureValueRow}>
                {POSITIVE_VALUES.has(quote.roadsideAssist) ? (
                  <>
                    <CheckBadge />
                    <Text style={[styles.featureValue, styles.featureIncluded]}>{quote.roadsideAssist}</Text>
                  </>
                ) : (
                  <Text style={styles.featureValue}>{quote.roadsideAssist}</Text>
                )}
              </View>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.feature}>
              <View style={styles.featureLabelRow}>
                <Text style={styles.featureLabel}>Personal Accident</Text>
                <InfoIcon />
              </View>
              <View style={styles.featureValueRow}>
                {POSITIVE_VALUES.has(quote.personalAccident) ? (
                  <>
                    <CheckBadge />
                    <Text style={[styles.featureValue, styles.featureIncluded]}>{quote.personalAccident}</Text>
                  </>
                ) : (
                  <Text style={styles.featureValue}>{quote.personalAccident}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            <PressableScale scaleTo={0.96} onPress={handleDetails} style={{ flex: 1 }}>
              <View style={styles.detailsBtn}>
                <Text style={styles.detailsBtnText}>More details</Text>
              </View>
            </PressableScale>
            <PressableScale scaleTo={0.96} onPress={handleSelect} style={{ flex: 1 }}>
              <View style={styles.selectBtn}>
                <Text style={styles.selectBtnText}>Select</Text>
              </View>
            </PressableScale>
          </View>

        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shory Plus info bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
function ShoryPlusSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets  = useSafeAreaInsets();
  const sheetY  = useSharedValue(400);
  const scrimOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetY.value  = withSpring(0, { damping: 26, stiffness: 200 });
      scrimOp.value = withTiming(1, { duration: 260 });
    } else {
      sheetY.value  = withTiming(400, { duration: 260, easing: Easing.in(Easing.cubic) });
      scrimOp.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOp.value }));

  if (!visible && sheetY.value >= 400) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheetScrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.shorySheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />
        <View style={styles.shorySheetContent}>
          <Text style={styles.shoryTitle}>🛡 What is Shory Plus?</Text>
          <Text style={styles.shoryBody}>
            Shory Plus is an enhanced insurance plan that goes beyond standard third-party cover,
            giving you and your passengers extra protection with a seamless claims experience.
          </Text>
          <View style={styles.shoryBenefits}>
            {[
              'Roadside assistance included',
              'Personal accident cover — driver & passengers',
              'Same-day policy issuance',
              '24/7 priority claims support',
            ].map((b, i) => (
              <View key={i} style={styles.shoryBenefit}>
                <Text style={styles.shoryBenefitDot}>✓</Text>
                <Text style={styles.shoryBenefitText}>{b}</Text>
              </View>
            ))}
          </View>
          <PressableScale scaleTo={0.97} onPress={onClose}>
            <View style={styles.shoryCloseBtn}>
              <Text style={styles.shoryCloseBtnText}>Got it</Text>
            </View>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function QuoteListScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter]       = useState<Quote['category']>('third-party');
  const [vehicleExpanded, setVehicleExpanded] = useState(false);
  const [shoryPlusSheet, setShoryPlusSheet]   = useState(false);
  const [isScrolling, setIsScrolling]         = useState(false);
  const shoryPlusShown = useRef(false);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating bar animation
  const floatOffset = useSharedValue(120);
  const floatStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: floatOffset.value }],
  }));


  // Auto-expand vehicle details for 4 seconds on mount
  useEffect(() => {
    setVehicleExpanded(true);
    autoCloseTimer.current = setTimeout(() => setVehicleExpanded(false), 1000);
    // Entrance of floating bar
    floatOffset.value = withDelay(500, withSpring(0, { damping: 20, stiffness: 140 }));
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, []);

  // Scroll-based float bar + notch visibility
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
    floatOffset.value = withTiming(120, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, []);

  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
    floatOffset.value = withSpring(0, { damping: 20, stiffness: 180 });
  }, []);

  // Filter selection
  const handleFilterPress = useCallback((val: Quote['category']) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveFilter(val);
    if (val === 'shory-plus' && !shoryPlusShown.current) {
      shoryPlusShown.current = true;
      setTimeout(() => setShoryPlusSheet(true), 150);
    }
  }, []);

  const toggleVehicle = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Cancel auto-close if user manually interacts
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    setVehicleExpanded(prev => !prev);
  }, []);

  const filtered = QUOTES.filter(q => q.category === activeFilter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavBar title="Select a quote" onBack={() => navigation.goBack()} showChat />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {/* ── Sticky filter tabs ── */}
        <FilterBar activeFilter={activeFilter} onPress={handleFilterPress} />

        {/* ── Vehicle strip ── */}
        <VehicleStrip expanded={vehicleExpanded} onToggle={toggleVehicle} />

        {/* ── Promo ── */}
        <View style={styles.promosRow}>
          <View style={styles.promoChip}>
            <Text style={styles.promoChipText}>🎉 Get up to AED 100 — offer ends soon!</Text>
          </View>
        </View>

        {/* ── Quote cards ── */}
        {filtered.map((q, i) => (
          <QuoteCard key={q.id} quote={q} index={i} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Floating Compare / Filter / Up pill ── */}
      <Animated.View style={[styles.floatingWrap, floatStyle]}>
        <PressableScale scaleTo={0.96}>
          <View style={styles.floatingPill}>
            <TouchableOpacity style={styles.floatingAction} onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <Text style={styles.floatingActionText}>⇅  Compare</Text>
            </TouchableOpacity>
            <View style={styles.floatingDivider} />
            <TouchableOpacity style={styles.floatingAction} onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <Text style={styles.floatingActionText}>☰  Filter</Text>
            </TouchableOpacity>
          </View>
        </PressableScale>

        <PressableScale scaleTo={0.9}>
          <View style={styles.topBtn}>
            <Text style={styles.topBtnText}>↑</Text>
          </View>
        </PressableScale>
      </Animated.View>

      {/* ── Shory Plus info sheet ── */}
      <ShoryPlusSheet visible={shoryPlusSheet} onClose={() => setShoryPlusSheet(false)} />

      {/* ── AI notch + full-page bottom sheet ── */}
      <AINotchPanel hidden={vehicleExpanded || isScrolling || shoryPlusSheet} />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.gray100 },
  scroll:      { flex: 1 },
  listContent: { paddingBottom: 32 },

  // ── Filter bar ──────────────────────────────────────────────────────────────
  filterBar: {
    backgroundColor: Colors.white,
    flexDirection:   'row',
    paddingHorizontal: 8,
    paddingVertical:   6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    position: 'relative',
    overflow: 'hidden',
  },
  filterHighlight: {
    position:        'absolute',
    top:             6,
    bottom:          6,
    borderRadius:    10,
    backgroundColor: Colors.gray800,
  },
  filterTabWrap: {
    flex:           1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems:     'center',
    zIndex:         1,
  },
  filterTabLabel: {
    fontSize:   11,
    fontWeight: '700',
    color:      Colors.gray900,
    textAlign:  'center',
  },
  filterTabLabelActive: { color: Colors.white },
  filterTabSub: {
    fontSize:  9,
    color:     Colors.gray600,
    marginTop: 2,
    textAlign: 'center',
  },
  filterTabSubActive: { color: 'rgba(255,255,255,0.7)' },

  // ── Vehicle strip ────────────────────────────────────────────────────────────
  vehicleStrip: {
    backgroundColor: Colors.brand50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  vehicleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   10,
    gap: 12,
  },
  vehicleLeft: { flex: 1 },
  stripLabel:  { fontSize: 11, color: Colors.gray700 },
  stripValue:  { fontSize: 13, fontWeight: '700', color: Colors.black, marginTop: 1 },
  vehicleImg:  { width: 88, height: 28 },
  chevronBtn:  { padding: 4 },

  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray900,
    paddingTop: 4,
    paddingBottom: 4,
  },
  editVehicleText: { fontSize: 12, fontWeight: '600', color: Colors.brand600 },
  editBelowBtn: {
    alignSelf: 'flex-start',
    paddingTop: 6,
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingVertical:  6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  detailRowLabel: {
    fontSize: 12,
    color: Colors.gray600,
    flex: 1,
  },
  detailRowValue: {
    fontSize: 12,
    color: Colors.gray900,
    textAlign: 'right',
  },
  detailRowValueBold: {
    fontWeight: '700',
  },

  // ── Promos ───────────────────────────────────────────────────────────────────
  promosRow: { paddingHorizontal: 16, paddingVertical: 10 },
  promoChip: {
    backgroundColor: Colors.white,
    borderRadius:    10,
    paddingHorizontal: 12,
    paddingVertical:   9,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.04,
    shadowRadius:   4,
    elevation:      1,
  },
  promoChipText: { fontSize: 12, fontWeight: '700', color: Colors.gray900 },

  // ── Quote card ───────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius:    16,
    paddingHorizontal: 14,
    paddingVertical:   12,
    gap: 12,
    shadowColor:    '#9b9b9b',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.10,
    shadowRadius:   8,
    elevation:      3,
  },
  cardTopRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
  },
  avgTime:        { fontSize: 10, fontWeight: '500', color: Colors.gray600 },
  avgTimeWarning: { color: '#c08b0c' },
  avgTimeBracket: { fontWeight: '700', color: Colors.gray900 },
  discountBadge: {
    backgroundColor: '#fff0e8',
    borderRadius:    6,
    paddingHorizontal: 7,
    paddingVertical:   3,
  },
  discountBadgeText: { fontSize: 10, fontWeight: '800', color: '#d45d00' },
  cardRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  insurerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insurerLogo: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    alignItems: 'center', justifyContent: 'center',
  },
  insurerInitial: { fontSize: 15, fontWeight: '800', color: Colors.brand600 },
  insurerName:    { fontSize: 13, fontWeight: '700', color: Colors.black, lineHeight: 17 },
  insurerType:    { fontSize: 10, fontWeight: '500', color: Colors.gray700, marginTop: 1 },
  priceBlock:     { alignItems: 'flex-end', gap: 0 },
  originalRow:    { flexDirection: 'row', alignItems: 'center' },
  aedTiny:        { fontSize: 9, color: Colors.gray500 },
  originalPrice:  { fontSize: 11, fontWeight: '700', color: Colors.gray500, textDecorationLine: 'line-through' },
  currentRow:     { flexDirection: 'row', alignItems: 'baseline' },
  aedMid:         { fontSize: 10, fontWeight: '600', color: Colors.black },
  currentPrice:   { fontSize: 20, fontWeight: '800', color: Colors.black, letterSpacing: -0.5 },
  installment:    { fontSize: 9, color: Colors.gray700 },
  cardDivider:    { height: 1, backgroundColor: Colors.gray100 },
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feature:         { flex: 1, gap: 3 },
  featureDivider:  { width: 1, backgroundColor: Colors.gray200 },
  featureLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureLabel:    { fontSize: 10, color: Colors.gray600 },
  featureValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureValue:    { fontSize: 12, fontWeight: '700', color: Colors.gray900 },
  featureIncluded: { color: Colors.green500 },
  cardActions:     { flexDirection: 'row', gap: 8 },
  detailsBtn: {
    height: 28, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#c5d9ff',
    alignItems: 'center', justifyContent: 'center',
  },
  detailsBtnText: { fontSize: 11, fontWeight: '700', color: Colors.brand600 },
  selectBtn: {
    height: 28, borderRadius: 8,
    backgroundColor: Colors.brand600,
    alignItems: 'center', justifyContent: 'center',
  },
  selectBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white, letterSpacing: 0.2 },


  // ── Floating bar ─────────────────────────────────────────────────────────────
  floatingWrap: {
    position:  'absolute',
    bottom:    28,
    left:      0,
    right:     0,
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:       10,
    paddingHorizontal: 16,
  },
  floatingPill: {
    backgroundColor: Colors.gray800,
    borderRadius:    100,
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 13,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.22,
    shadowRadius:   12,
    elevation:      8,
  },
  floatingAction:     { paddingHorizontal: 22 },
  floatingActionText: { fontSize: 13, fontWeight: '600', color: Colors.white, letterSpacing: 0.2 },
  floatingDivider:    { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.25)' },
  topBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.brand600,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  topBtnText: { fontSize: 16, fontWeight: '800', color: Colors.brand600 },

  // ── Shory Plus sheet ─────────────────────────────────────────────────────────
  sheetScrim: { backgroundColor: 'rgba(0,0,0,0.4)' },
  shorySheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: Colors.white,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: -4 },
    shadowOpacity:  0.14,
    shadowRadius:   20,
    elevation:      24,
  },
  sheetHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  shorySheetContent: { paddingHorizontal: 24, paddingTop: 12 },
  shoryTitle: { fontSize: 18, fontWeight: '800', color: Colors.gray900, marginBottom: 10 },
  shoryBody:  { fontSize: 13, color: Colors.gray700, lineHeight: 20, marginBottom: 16 },
  shoryBenefits: { gap: 10, marginBottom: 24 },
  shoryBenefit:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  shoryBenefitDot:  { fontSize: 13, color: Colors.green500, fontWeight: '800', width: 16 },
  shoryBenefitText: { fontSize: 13, color: Colors.gray800, flex: 1, lineHeight: 18 },
  shoryCloseBtn: {
    height: 50, borderRadius: 14,
    backgroundColor: Colors.brand600,
    alignItems: 'center', justifyContent: 'center',
  },
  shoryCloseBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
