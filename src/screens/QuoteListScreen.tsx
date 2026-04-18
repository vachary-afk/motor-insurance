import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import NavBar from '../components/NavBar';
import PressableScale from '../components/PressableScale';

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
  { id: '1', insurer: 'RAK', type: 'Third party', originalPrice: 580, price: 480, roadsideAssist: '+ AED 10', personalAccident: 'Driver', avgTime: 5, category: 'third-party' },
  { id: '2', insurer: 'AXA', type: 'Third party', originalPrice: 610, price: 510, roadsideAssist: 'Included', personalAccident: 'Driver', avgTime: 3, category: 'third-party' },
  { id: '3', insurer: 'RSA', type: 'Third party', originalPrice: 620, price: 520, roadsideAssist: '+ AED 10', personalAccident: 'Driver', avgTime: 8, category: 'third-party' },
  { id: '4', insurer: 'ADNIC', type: 'Third party', originalPrice: 880, price: 780, roadsideAssist: '+ AED 10', personalAccident: 'Driver', avgTime: 6, category: 'third-party' },
  { id: '5', insurer: 'Sukoon', type: 'Third Party', originalPrice: null, price: 534, roadsideAssist: '+ AED 10', personalAccident: 'Driver Only', avgTime: 12, category: 'third-party' },
  { id: '6', insurer: 'RAK', type: 'Shory Plus', originalPrice: 750, price: 620, roadsideAssist: 'Included', personalAccident: 'Driver + Passenger', avgTime: 4, category: 'shory-plus' },
  { id: '7', insurer: 'AXA', type: 'Comprehensive', originalPrice: 1800, price: 1500, roadsideAssist: 'Included', personalAccident: 'Driver + Family', avgTime: 5, category: 'comprehensive' },
];

const FILTER_TABS: { label: string; sub: string; value: Quote['category'] }[] = [
  { label: 'Third Party', sub: 'From AED 480', value: 'third-party' },
  { label: 'Shory Plus', sub: 'From AED 585', value: 'shory-plus' },
  { label: 'Comprehensive', sub: 'From AED 1,200', value: 'comprehensive' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated filter tab
// ─────────────────────────────────────────────────────────────────────────────
function FilterTab({
  label, sub, active, onPress,
}: {
  label: string; sub: string; active: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const bgProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    bgProgress.value = withTiming(active ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: bgProgress.value > 0.5 ? Colors.gray700 : 'transparent',
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={{ flex: 1 }}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.filterTab, containerStyle]}>
        <Text style={[styles.filterTabLabel, active && styles.filterTabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.filterTabSub, active && styles.filterTabSubActive]} numberOfLines={1}>
          {sub}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quote card with staggered entrance
// ─────────────────────────────────────────────────────────────────────────────
function QuoteCard({ quote, index }: { quote: Quote; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(32);

  useEffect(() => {
    opacity.value = withDelay(
      index * 80,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      index * 80,
      withSpring(0, { damping: 18, stiffness: 120 })
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelect = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDetails = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <Animated.View style={entranceStyle}>
      <PressableScale scaleTo={0.985}>
        <View style={styles.card}>
          {/* Avg time */}
          <Text style={[styles.avgTime, quote.avgTime > 10 && styles.avgTimeWarning]}>
            Avg. linking time: ~{quote.avgTime} min
          </Text>

          {/* Insurer + price */}
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
              <Text style={styles.featureLabel}>Roadside Assist.</Text>
              <Text style={styles.featureValue}>{quote.roadsideAssist}</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureLabel}>Personal Accident</Text>
              <Text style={styles.featureValue}>{quote.personalAccident}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            <PressableScale scaleTo={0.93} onPress={handleDetails} style={{ flex: 1 }}>
              <View style={styles.detailsBtn}>
                <Text style={styles.detailsBtnText}>More details</Text>
              </View>
            </PressableScale>
            <PressableScale scaleTo={0.93} onPress={handleSelect} style={{ flex: 1 }}>
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
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function QuoteListScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<Quote['category']>('third-party');

  // Floating bar entrance
  const barY = useSharedValue(80);
  useEffect(() => {
    barY.value = withDelay(400, withSpring(0, { damping: 20, stiffness: 140 }));
  }, []);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateY: barY.value }] }));

  const handleFilterPress = useCallback((val: Quote['category']) => {
    Haptics.selectionAsync();
    setActiveFilter(val);
  }, []);

  const filtered = QUOTES.filter((q) => q.category === activeFilter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavBar
        title="Select a quote"
        onBack={() => navigation.goBack()}
        showChat
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky filter tabs */}
        <View style={styles.filterBar}>
          {FILTER_TABS.map((t) => (
            <FilterTab
              key={t.value}
              label={t.label}
              sub={t.sub}
              active={activeFilter === t.value}
              onPress={() => handleFilterPress(t.value)}
            />
          ))}
        </View>

        {/* Plate strip */}
        <View style={styles.plateStrip}>
          <View style={styles.plateStripLeft}>
            <Text style={styles.stripLabel}>Vehicle details</Text>
            <Text style={styles.stripValue}>Honda Accord 2018</Text>
          </View>
          <Image source={{ uri: VEHICLE_IMG }} style={styles.vehicleImg} resizeMode="contain" />
          <Text style={styles.editLink}>Edit</Text>
        </View>

        {/* Promo chips */}
        <View style={styles.promosRow}>
          <View style={styles.promoChip}>
            <Text style={styles.promoChipText}>🎉 Get up to AED 100 — offer ends soon!</Text>
          </View>
        </View>

        {/* Quote cards */}
        {filtered.map((q, i) => (
          <QuoteCard key={q.id} quote={q} index={i} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Compare/Filter pill */}
      <Animated.View style={[styles.floatingWrap, barStyle]}>
        <PressableScale scaleTo={0.96}>
          <View style={styles.floatingPill}>
            <TouchableOpacity style={styles.floatingAction} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={styles.floatingActionText}>⇅  Compare</Text>
            </TouchableOpacity>
            <View style={styles.floatingDivider} />
            <TouchableOpacity style={styles.floatingAction} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={styles.floatingActionText}>☰  Filter</Text>
            </TouchableOpacity>
          </View>
        </PressableScale>

        <PressableScale scaleTo={0.9}>
          <TouchableOpacity style={styles.shareBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Text style={styles.shareBtnText}>↑</Text>
          </TouchableOpacity>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  scroll: { flex: 1 },
  listContent: {
    paddingBottom: 32,
  },

  // Filter bar
  filterBar: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
  },
  filterTabLabelActive: { color: Colors.white },
  filterTabSub: {
    fontSize: 9,
    color: Colors.gray600,
    marginTop: 2,
    textAlign: 'center',
  },
  filterTabSubActive: { color: 'rgba(255,255,255,0.7)' },

  // Plate strip
  plateStrip: {
    backgroundColor: Colors.brand50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    gap: 12,
  },
  plateStripLeft: { flex: 1 },
  stripLabel: { fontSize: 11, color: '#5f5f5f' },
  stripValue: { fontSize: 12, fontWeight: '600', color: Colors.black },
  vehicleImg: { width: 96, height: 24 },
  editLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand600,
  },

  // Promos
  promosRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promoChip: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  promoChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray900,
  },

  // Cards
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#9b9b9b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
  },
  avgTime: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.gray700,
  },
  avgTimeWarning: {
    color: '#c08b0c',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insurerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insurerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insurerInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand600,
  },
  insurerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: 18,
  },
  insurerType: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.gray700,
    marginTop: 2,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  originalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aedTiny: { fontSize: 10, color: Colors.gray500 },
  originalPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray500,
    textDecorationLine: 'line-through',
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  aedMid: { fontSize: 11, fontWeight: '600', color: Colors.black },
  currentPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: -0.5,
  },
  installment: {
    fontSize: 9,
    color: Colors.gray700,
    marginTop: 1,
  },

  // Features
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    padding: 10,
  },
  feature: { gap: 3 },
  featureLabel: { fontSize: 10, color: Colors.gray700 },
  featureValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3a3a3a',
    letterSpacing: -0.1,
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsBtn: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#c5d9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand600,
  },
  selectBtn: {
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // Floating bar
  floatingWrap: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  floatingPill: {
    backgroundColor: Colors.gray700,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingAction: {
    paddingHorizontal: 22,
  },
  floatingActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  floatingDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand600,
  },
});
