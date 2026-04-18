import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

export type PlateZone = 'emirate' | 'code' | 'number';

// ── Asset map ───────────────────────────────────────────────────────────────
const EMIRATE_IMAGES: Record<string, ReturnType<typeof require>> = {
  'Dubai':          require('../../assets/emirates/image 1.png'),
  'Abu Dhabi':      require('../../assets/emirates/image 2.png'),
  'Sharjah':        require('../../assets/emirates/image 3.png'),
  'Ajman':          require('../../assets/emirates/image 4.png'),
  'Um Al Quwain':   require('../../assets/emirates/image 5.png'),
  'Ras Al Khaimah': require('../../assets/emirates/image 6.png'),
  'Fujairah':       require('../../assets/emirates/image 7.png'),
};

// ── Exported layout constants (used by PlateEntryScreen for label alignment) ─
export const PLATE_TOTAL_WIDTH  = 324;
export const PLATE_CODE_WIDTH   = 63;
export const PLATE_EMIRATE_WIDTH = 81;
export const PLATE_DIVIDER_WIDTH = 1;

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  plateCode:   number | null;
  plateNumber: string;
  emirate:     string | null;
  activeZone:  PlateZone;
  onZonePress: (zone: PlateZone) => void;
};

// ── Tappable zone wrapper ────────────────────────────────────────────────────
type ZoneSectionProps = {
  active:   boolean;
  onPress:  () => void;
  style:    object;
  children: React.ReactNode;
};

function ZoneSection({ active, onPress, style, children }: ZoneSectionProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.91, { damping: 12, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 10, stiffness: 200 }); }}
      onPress={onPress}
      style={[style, active && styles.zoneActive]}
    >
      <Animated.View style={animStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PlatePreview({
  plateCode, plateNumber, emirate, activeZone, onZonePress,
}: Props) {
  const hasEmirate = emirate !== null;
  const isAbuDhabi = emirate === 'Abu Dhabi';
  const imgSource   = emirate ? EMIRATE_IMAGES[emirate] : null;

  // Code zone background & text colour
  const codeBg    = hasEmirate && isAbuDhabi ? Colors.red500 : Colors.white;
  const codeColor = hasEmirate && isAbuDhabi
    ? Colors.white
    : hasEmirate
      ? Colors.black          // other emirates → black text
      : Colors.gray300;       // placeholder → gray

  return (
    <View style={styles.plate}>

      {/* ── Code zone ── */}
      <ZoneSection
        active={activeZone === 'code'}
        onPress={() => onZonePress('code')}
        style={[styles.codeSection, { backgroundColor: codeBg }]}
      >
        <Text style={[styles.codeText, { color: codeColor }]}>
          {plateCode !== null ? String(plateCode) : '0'}
        </Text>
      </ZoneSection>

      <View style={styles.divider} />

      {/* ── Emirate zone ── */}
      <ZoneSection
        active={activeZone === 'emirate'}
        onPress={() => onZonePress('emirate')}
        style={styles.emirateSection}
      >
        {imgSource ? (
          <Image
            source={imgSource}
            style={styles.emirateImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.emiratePlaceholder}>
            <Text style={styles.emiratePlaceholderText}>الإمارات{'\n'}U.A.E AD</Text>
          </View>
        )}
      </ZoneSection>

      <View style={styles.divider} />

      {/* ── Number zone ── */}
      <ZoneSection
        active={activeZone === 'number'}
        onPress={() => onZonePress('number')}
        style={styles.numberSection}
      >
        <Text
          style={[
            styles.numberText,
            plateNumber.length > 0 ? styles.numberFilled : activeZone === 'number' && styles.numberActive,
          ]}
        >
          {plateNumber.length > 0 ? plateNumber : '00000'}
        </Text>
      </ZoneSection>

      {/* Inner shadow overlay */}
      <View style={styles.innerShadow} pointerEvents="none" />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  plate: {
    width: PLATE_TOTAL_WIDTH,
    height: 60,
    borderWidth: 4,
    borderColor: Colors.gray800,   // #4a4d5a — matches Figma
    borderRadius: 8,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  zoneActive: {
    backgroundColor: Colors.brand50,
  },

  divider: {
    width: PLATE_DIVIDER_WIDTH,
    backgroundColor: Colors.gray300,
  },

  // Code
  codeSection: {
    width: PLATE_CODE_WIDTH,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
  },

  // Emirate
  emirateSection: {
    width: PLATE_EMIRATE_WIDTH,
  },
  emirateImage: {
    width: PLATE_EMIRATE_WIDTH - 8,
    height: 46,
  },
  emiratePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emiratePlaceholderText: {
    fontSize: 7,
    color: Colors.gray400,
    textAlign: 'center',
    lineHeight: 10,
    opacity: 0.4,
  },

  // Number
  numberSection: {
    flex: 1,
  },
  numberText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.gray300,
    letterSpacing: 3,
  },
  numberFilled: {
    color: Colors.black,
  },
  numberActive: {
    color: Colors.brand600,
    opacity: 0.6,
  },

  // Inner shadow (top edge)
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 0,
  },
});
