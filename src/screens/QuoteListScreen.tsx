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
  Share,
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
import { CaretDown, Info, CheckCircle, Export } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import INSURER_LOGOS from '../constants/insurerLogos';
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
  // ── Third Party ──────────────────────────────────────────────────────────────
  { id:  '1', insurer: 'RAK',               type: 'Third Party',  originalPrice: 580,  price: 480,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 5,  category: 'third-party' },
  { id:  '2', insurer: 'AXA',               type: 'Third Party',  originalPrice: 610,  price: 510,  roadsideAssist: 'Included', personalAccident: 'Driver',            avgTime: 3,  category: 'third-party' },
  { id:  '3', insurer: 'RSA',               type: 'Third Party',  originalPrice: 620,  price: 520,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 8,  category: 'third-party' },
  { id:  '4', insurer: 'Sukoon',            type: 'Third Party',  originalPrice: null, price: 534,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 12, category: 'third-party' },
  { id:  '5', insurer: 'ADNIC',             type: 'Third Party',  originalPrice: 650,  price: 545,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 6,  category: 'third-party' },
  { id:  '6', insurer: 'NGI',               type: 'Third Party',  originalPrice: 658,  price: 558,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 7,  category: 'third-party' },
  { id:  '7', insurer: 'Orient',            type: 'Third Party',  originalPrice: null, price: 572,  roadsideAssist: 'Included', personalAccident: 'Driver Only',       avgTime: 9,  category: 'third-party' },
  { id:  '8', insurer: 'Dubai',             type: 'Third Party',  originalPrice: 680,  price: 585,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 10, category: 'third-party' },
  { id:  '9', insurer: 'Watania',           type: 'Third Party',  originalPrice: null, price: 598,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 11, category: 'third-party' },
  { id: '10', insurer: 'Salama',            type: 'Third Party',  originalPrice: 712,  price: 612,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 15, category: 'third-party' },
  { id: '11', insurer: 'Fidelity',          type: 'Third Party',  originalPrice: null, price: 628,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 14, category: 'third-party' },
  { id: '12', insurer: 'Orient Takaful',    type: 'Third Party',  originalPrice: 738,  price: 642,  roadsideAssist: 'Included', personalAccident: 'Driver',            avgTime: 19, category: 'third-party' },
  { id: '13', insurer: 'Qatar',             type: 'Third Party',  originalPrice: null, price: 655,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 16, category: 'third-party' },
  { id: '14', insurer: 'AFNIC',             type: 'Third Party',  originalPrice: 768,  price: 668,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 22, category: 'third-party' },
  { id: '15', insurer: 'Adamjee Insurance', type: 'Third Party',  originalPrice: null, price: 682,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 13, category: 'third-party' },
  { id: '16', insurer: 'Al Ain',            type: 'Third Party',  originalPrice: 793,  price: 698,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 18, category: 'third-party' },
  { id: '17', insurer: 'Union',             type: 'Third Party',  originalPrice: null, price: 715,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 20, category: 'third-party' },
  { id: '18', insurer: 'AWNIC',             type: 'Third Party',  originalPrice: 827,  price: 728,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 25, category: 'third-party' },
  { id: '19', insurer: 'Insurance House',   type: 'Third Party',  originalPrice: null, price: 745,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 28, category: 'third-party' },
  { id: '20', insurer: 'ADNTC',             type: 'Third Party',  originalPrice: 856,  price: 762,  roadsideAssist: '+ AED 10', personalAccident: 'Driver',            avgTime: 17, category: 'third-party' },
  { id: '21', insurer: 'Metaq',             type: 'Third Party',  originalPrice: null, price: 780,  roadsideAssist: '+ AED 10', personalAccident: 'Driver Only',       avgTime: 30, category: 'third-party' },

  // ── Shory Plus ───────────────────────────────────────────────────────────────
  { id: '22', insurer: 'RAK',               type: 'Shory Plus',   originalPrice: 748,  price: 620,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 4,  category: 'shory-plus' },
  { id: '23', insurer: 'AXA',               type: 'Shory Plus',   originalPrice: 782,  price: 648,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 3,  category: 'shory-plus' },
  { id: '24', insurer: 'RSA',               type: 'Shory Plus',   originalPrice: null, price: 675,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 8,  category: 'shory-plus' },
  { id: '25', insurer: 'ADNIC',             type: 'Shory Plus',   originalPrice: 826,  price: 710,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 6,  category: 'shory-plus' },
  { id: '26', insurer: 'Sukoon',            type: 'Shory Plus',   originalPrice: null, price: 745,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 12, category: 'shory-plus' },
  { id: '27', insurer: 'Orient',            type: 'Shory Plus',   originalPrice: 897,  price: 780,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 9,  category: 'shory-plus' },
  { id: '28', insurer: 'NGI',               type: 'Shory Plus',   originalPrice: null, price: 815,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 7,  category: 'shory-plus' },
  { id: '29', insurer: 'Salama',            type: 'Shory Plus',   originalPrice: 966,  price: 850,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 15, category: 'shory-plus' },
  { id: '30', insurer: 'Dubai',             type: 'Shory Plus',   originalPrice: null, price: 888,  roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 10, category: 'shory-plus' },
  { id: '31', insurer: 'Orient Takaful',    type: 'Shory Plus',   originalPrice: 1058, price: 920,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 19, category: 'shory-plus' },
  { id: '32', insurer: 'Qatar',             type: 'Shory Plus',   originalPrice: null, price: 955,  roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 16, category: 'shory-plus' },

  // ── Comprehensive ─────────────────────────────────────────────────────────────
  { id: '33', insurer: 'AXA',               type: 'Comprehensive',originalPrice: 1807, price: 1500, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 5,  category: 'comprehensive' },
  { id: '34', insurer: 'RSA',               type: 'Comprehensive',originalPrice: null, price: 1620, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 8,  category: 'comprehensive' },
  { id: '35', insurer: 'ADNIC',             type: 'Comprehensive',originalPrice: 2011, price: 1750, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 6,  category: 'comprehensive' },
  { id: '36', insurer: 'RAK',               type: 'Comprehensive',originalPrice: null, price: 1840, roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 4,  category: 'comprehensive' },
  { id: '37', insurer: 'Qatar',             type: 'Comprehensive',originalPrice: 2175, price: 1850, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 16, category: 'comprehensive' },
  { id: '38', insurer: 'Union',             type: 'Comprehensive',originalPrice: null, price: 1980, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 20, category: 'comprehensive' },
  { id: '39', insurer: 'NGI',               type: 'Comprehensive',originalPrice: 2300, price: 2100, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 7,  category: 'comprehensive' },
  { id: '40', insurer: 'Dubai',             type: 'Comprehensive',originalPrice: null, price: 2250, roadsideAssist: 'Included', personalAccident: 'Driver + Family',    avgTime: 10, category: 'comprehensive' },
];

const FILTER_TABS: { label: string; sub: string; value: Quote['category'] }[] = [
  { label: 'Third Party',   sub: 'From AED 480',   value: 'third-party' },
  { label: 'Shory Plus',    sub: 'From AED 620',   value: 'shory-plus' },
  { label: 'Comprehensive', sub: 'From AED 1,500', value: 'comprehensive' },
];


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
            <CaretDown size={16} color={Colors.brand600} />
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
  const PAD            = 8;  // matches filterBar paddingHorizontal
  const INSET          = 3;  // highlight inset from tab edges
  const tabW           = barWidth > 0 ? (barWidth - PAD * 2) / 3 : 0;

  useEffect(() => {
    if (tabW > 0) {
      highlightX.value = withSpring(PAD + activeIdx * tabW + INSET, { damping: 22, stiffness: 240 });
    }
  }, [activeFilter, tabW]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
    width: tabW > 0 ? tabW - INSET * 2 : '33.33%' as any,
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
                {INSURER_LOGOS[quote.insurer] ? (
                  <Image source={INSURER_LOGOS[quote.insurer]} style={{ width: 28, height: 28 }} resizeMode="contain" />
                ) : (
                  <Text style={styles.insurerInitial}>{quote.insurer[0]}</Text>
                )}
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
                <Info size={13} color={Colors.gray400} />
              </View>
              <View style={styles.featureValueRow}>
                {POSITIVE_VALUES.has(quote.roadsideAssist) ? (
                  <>
                    <CheckCircle size={16} color={Colors.green500} weight="fill" />
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
                <Info size={13} color={Colors.gray400} />
              </View>
              <View style={styles.featureValueRow}>
                {POSITIVE_VALUES.has(quote.personalAccident) ? (
                  <>
                    <CheckCircle size={16} color={Colors.green500} weight="fill" />
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
const PAYOUT_OPTIONS = [
  { label: '฿ 1,400', value: 1400 },
  { label: '฿ 5,000', value: 5000 },
  { label: '฿ 10,000', value: 10000 },
];

function ShoryPlusSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets  = useSafeAreaInsets();
  const sheetY  = useSharedValue(500);
  const scrimOp = useSharedValue(0);
  const [selectedPayout, setSelectedPayout] = useState(1400);

  useEffect(() => {
    if (visible) {
      sheetY.value  = withSpring(0, { damping: 26, stiffness: 200 });
      scrimOp.value = withTiming(1, { duration: 260 });
    } else {
      sheetY.value  = withTiming(500, { duration: 260, easing: Easing.in(Easing.cubic) });
      scrimOp.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOp.value }));

  if (!visible && sheetY.value >= 500) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheetScrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.shorySheet, { paddingBottom: insets.bottom + 24 }, sheetStyle]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <View style={styles.shorySheetContent}>
          {/* Header row: badge + close */}
          <View style={styles.shoryHeaderRow}>
            <View style={styles.shoryExclusiveBadge}>
              <Text style={styles.shoryExclusiveText}>Shory Exclusive</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.shoryCloseX}>
              <Text style={styles.shoryCloseXText}>✕</Text>
            </Pressable>
          </View>

          {/* Title */}
          <Text style={styles.shoryTitle}>Shory Plus</Text>
          <Text style={styles.shoryPoweredBy}>Powered by NGI</Text>

          {/* Body */}
          <Text style={styles.shoryBody}>
            Shory Plus is our exclusive insurance option that gives you{' '}
            <Text style={styles.shoryBodyBold}>third-party coverage plus cash benefits</Text>
            {' '}if your car is totaled.
          </Text>
          <Text style={styles.shoryBodySub}>
            You'll get an approximate cash payout based on the coverage you select below.
          </Text>

          {/* Payout options */}
          <View style={styles.shoryPayoutRow}>
            {PAYOUT_OPTIONS.map((opt) => {
              const active = selectedPayout === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.shoryPayoutCard, active && styles.shoryPayoutCardActive]}
                  onPress={() => setSelectedPayout(opt.value)}
                >
                  <Text style={[styles.shoryPayoutAmount, active && styles.shoryPayoutAmountActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.shoryPayoutLabel}>Cash payout</Text>
                  <View style={[styles.shoryRadio, active && styles.shoryRadioActive]}>
                    {active && <View style={styles.shoryRadioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Footer */}
          <Text style={styles.shoryFooter}>
            Shory Plus is powered by NGI.{' '}
            <Text style={styles.shoryFooterLink}>Terms & Conditions</Text>
          </Text>
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
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Hide both float bar and notch while scrolling (works on web + native)
  const hideOnScroll = useCallback(() => {
    setIsScrolling(true);
    floatOffset.value = withTiming(120, { duration: 180, easing: Easing.out(Easing.cubic) });
    // Debounce scroll-end — fire ~400ms after last scroll event
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      setIsScrolling(false);
      floatOffset.value = withSpring(0, { damping: 20, stiffness: 180 });
    }, 400);
  }, []);

  // Native drag events also trigger the same logic
  const handleScrollBeginDrag = useCallback(() => hideOnScroll(), [hideOnScroll]);
  const handleScrollEnd = useCallback(() => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
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
        onScroll={hideOnScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={80}
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

        <PressableScale scaleTo={0.9} onPress={() => {
          Share.share({
            title: 'Motor Insurance Quotes',
            message: 'Check out these motor insurance quotes from Shory — get covered today! https://shory.com',
          });
        }}>
          <View style={styles.topBtn}>
            <Export size={20} color={Colors.brand600} weight="bold" />
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
    position:        'absolute',
    bottom:          28,
    left:            0,
    right:           0,
    flexDirection:   'row',
    justifyContent:  'center',
    alignItems:      'center',
    gap:             10,
    paddingHorizontal: 16,
  },
  floatingPill: {
    backgroundColor: Colors.gray800,
    borderRadius:    100,
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 11,
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
    marginBottom: 8,
  },
  shorySheetContent: { paddingHorizontal: 20, paddingTop: 4 },
  shoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shoryExclusiveBadge: {
    backgroundColor: '#EDE9FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shoryExclusiveText: { fontSize: 13, fontWeight: '600', color: '#6A3DAE' },
  shoryCloseX: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  shoryCloseXText: { fontSize: 20, color: Colors.gray900 },
  shoryTitle: {
    fontSize: 26, fontWeight: '800',
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: 2,
  },
  shoryPoweredBy: {
    fontSize: 13, fontWeight: '500',
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: 18,
  },
  shoryBody: {
    fontSize: 14, color: Colors.gray700,
    lineHeight: 22, textAlign: 'center',
    marginBottom: 10,
  },
  shoryBodyBold: { fontWeight: '700', color: Colors.gray900 },
  shoryBodySub: {
    fontSize: 14, color: Colors.gray700,
    lineHeight: 22, textAlign: 'center',
    marginBottom: 20,
  },
  shoryPayoutRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  shoryPayoutCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    gap: 4,
  },
  shoryPayoutCardActive: {
    borderColor: Colors.brand600,
    backgroundColor: '#F0F4FF',
  },
  shoryPayoutAmount: {
    fontSize: 16, fontWeight: '700',
    color: Colors.gray900,
  },
  shoryPayoutAmountActive: { color: Colors.gray900 },
  shoryPayoutLabel: { fontSize: 11, color: Colors.gray500 },
  shoryRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.gray300,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  shoryRadioActive: { borderColor: Colors.brand600 },
  shoryRadioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.brand600,
  },
  shoryFooter: { fontSize: 12, color: Colors.gray500, textAlign: 'center' },
  shoryFooterLink: { color: Colors.brand600, fontWeight: '600' },
});
