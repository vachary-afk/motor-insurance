import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

export type PlateZone = 'emirate' | 'code' | 'number';

// ── Asset map ────────────────────────────────────────────────────────────────
const EMIRATE_IMAGES: Record<string, ReturnType<typeof require>> = {
  'Dubai':          require('../../assets/emirates/image 1.png'),
  'Abu Dhabi':      require('../../assets/emirates/image 2.png'),
  'Sharjah':        require('../../assets/emirates/image 3.png'),
  'Ajman':          require('../../assets/emirates/image 4.png'),
  'Um Al Quwain':   require('../../assets/emirates/image 5.png'),
  'Ras Al Khaimah': require('../../assets/emirates/image 6.png'),
  'Fujairah':       require('../../assets/emirates/image 7.png'),
};

// ── Layout constants ──────────────────────────────────────────────────────────
export const PLATE_TOTAL_WIDTH   = 324;
export const PLATE_CODE_WIDTH    = 63;
export const PLATE_EMIRATE_WIDTH = 81;
export const PLATE_DIVIDER_WIDTH = 1;
const PLATE_BORDER = 4;
const PLATE_HEIGHT = 60;

// SVG indicator (32px wide) left position per zone — centered on each zone
// code center:    PLATE_BORDER + CODE_WIDTH/2           = 4 + 31.5 = 35.5 → left = 19.5
// emirate center: PLATE_BORDER + CODE+DIV + EMI/2       = 4+64+40.5 = 108.5 → left = 92.5
// number center:  PLATE_BORDER + CODE+DIV+EMI+DIV + remaining/2
//                 remaining = 324-4-63-1-81-1-4 = 170  → center = 4+145+85 = 234 → left = 218
const INDICATOR_W = 32;
const ZONE_SEMI_X: Record<PlateZone, number> = {
  code:    19.5,
  emirate: 92.5,
  number:  218,
};

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  plateCode:     string | null;
  plateNumber:   string;
  emirate:       string | null;
  activeZone:    PlateZone;
  onZonePress:   (zone: PlateZone) => void;
  showIndicator?: boolean;   // hide when all fields complete
};

// ── Tappable zone wrapper ─────────────────────────────────────────────────────
type ZoneSectionProps = {
  active:   boolean;
  onPress:  () => void;
  style:    object;
  children: React.ReactNode;
};

function ZoneSection({ active, onPress, style, children }: ZoneSectionProps) {
  const scale     = useSharedValue(1);
  const bgOpacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    bgOpacity.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
    alignItems:     'center' as const,
    justifyContent: 'center' as const,
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.91, { damping: 12, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 10, stiffness: 200 }); }}
      onPress={onPress}
      style={style}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.activeOverlay, overlayStyle]} />
      <Animated.View style={animStyle}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlatePreview({
  plateCode, plateNumber, emirate, activeZone, onZonePress,
  showIndicator = true,
}: Props) {
  const hasEmirate   = emirate !== null;
  const isAbuDhabi   = emirate === 'Abu Dhabi';
  const imgSource    = emirate ? EMIRATE_IMAGES[emirate] : null;
  const numberFilled = plateNumber.length > 0;

  // ── Sliding semicircle ───────────────────────────────────────────────────
  const semiLeft    = useSharedValue(ZONE_SEMI_X[activeZone]);
  const semiOpacity = useSharedValue(1);

  useEffect(() => {
    semiLeft.value = withSpring(ZONE_SEMI_X[activeZone], { damping: 22, stiffness: 220 });
  }, [activeZone]);

  useEffect(() => {
    semiOpacity.value = withTiming(showIndicator ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [showIndicator]);

  const semiStyle = useAnimatedStyle(() => ({
    left:    semiLeft.value,
    opacity: semiOpacity.value,
  }));

  // ── Number digit micro-interaction ───────────────────────────────────────
  const numScale = useSharedValue(1);
  useEffect(() => {
    if (plateNumber.length > 0) {
      numScale.value = withSequence(
        withTiming(1.14, { duration: 70,  easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(1,    { duration: 240, easing: Easing.bezier(0.22, 1, 0.36, 1) })
      );
    } else {
      numScale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) });
    }
  }, [plateNumber]);

  const numAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numScale.value }],
  }));

  // ── Zone colours ─────────────────────────────────────────────────────────
  const codeBg    = hasEmirate && isAbuDhabi ? Colors.red500 : Colors.white;
  const codeColor = hasEmirate && isAbuDhabi
    ? Colors.white
    : hasEmirate ? Colors.black : Colors.gray300;
  const numberBg  = numberFilled ? Colors.white : Colors.gray100;

  return (
    // Wrapper allows semicircle to overflow outside the plate
    <View style={styles.wrapper}>

      {/* ── Plate (overflow:hidden to clip zone overlays + border radius) ── */}
      <View style={styles.plate}>

        <ZoneSection
          active={activeZone === 'code'}
          onPress={() => onZonePress('code')}
          style={[styles.codeSection, { backgroundColor: codeBg }]}
        >
          <Text style={[styles.codeText, { color: codeColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {plateCode !== null ? plateCode : '0'}
          </Text>
        </ZoneSection>

        <View style={styles.divider} />

        <ZoneSection
          active={activeZone === 'emirate'}
          onPress={() => onZonePress('emirate')}
          style={styles.emirateSection}
        >
          {imgSource ? (
            <Image source={imgSource} style={styles.emirateImage} resizeMode="contain" />
          ) : (
            <View style={styles.emiratePlaceholder}>
              <Text style={styles.emiratePlaceholderText}>الإمارات{'\n'}U.A.E AD</Text>
            </View>
          )}
        </ZoneSection>

        <View style={styles.divider} />

        <ZoneSection
          active={activeZone === 'number'}
          onPress={() => onZonePress('number')}
          style={[styles.numberSection, { backgroundColor: numberBg }]}
        >
          <Animated.View style={numAnimStyle}>
            <Text style={[styles.numberText, numberFilled && styles.numberFilled]}>
              {numberFilled ? plateNumber : '00000'}
            </Text>
          </Animated.View>
        </ZoneSection>

        <View style={styles.innerShadow} pointerEvents="none" />
      </View>

      {/* ── SVG indicator — sits just above the bottom border ── */}
      <Animated.View style={[styles.semiContainer, semiStyle]} pointerEvents="none">
        <Svg width={32} height={2} viewBox="0 0 32 2" fill="none">
          <Path
            d="M0 2C0 0.895431 0.895431 0 2 0H30C31.1046 0 32 0.895431 32 2V2H0V2Z"
            fill="#1D68FF"
          />
        </Svg>
      </Animated.View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Outer wrapper — does NOT clip, so semicircle can overlap the plate border
  wrapper: {
    width:    PLATE_TOTAL_WIDTH,
    height:   PLATE_HEIGHT,   // same height as plate; semicircle overflows below
  },

  plate: {
    width:           PLATE_TOTAL_WIDTH,
    height:          PLATE_HEIGHT,
    borderWidth:     PLATE_BORDER,
    borderColor:     Colors.gray800,
    borderRadius:    8,
    flexDirection:   'row',
    backgroundColor: Colors.white,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.15,
    shadowRadius:    8,
    elevation:       5,
  },

  activeOverlay: {
    backgroundColor: Colors.brand50,
  },

  // SVG indicator — sits just above the bottom border
  semiContainer: {
    position: 'absolute',
    top:      PLATE_HEIGHT - PLATE_BORDER - 2,   // 54 — 2px above the border top edge
  },

  divider: {
    width:           PLATE_DIVIDER_WIDTH,
    backgroundColor: Colors.gray300,
  },

  codeSection: {
    width: PLATE_CODE_WIDTH,
  },
  codeText: {
    fontSize:   28,
    fontWeight: '800',
  },

  emirateSection: {
    width: PLATE_EMIRATE_WIDTH,
  },
  emirateImage: {
    width:  PLATE_EMIRATE_WIDTH - 8,
    height: 46,
  },
  emiratePlaceholder: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  emiratePlaceholderText: {
    fontSize:   7,
    color:      Colors.gray400,
    textAlign:  'center',
    lineHeight: 10,
    opacity:    0.4,
  },

  numberSection: {
    flex: 1,
  },
  numberText: {
    fontSize:      28,
    fontWeight:    '800',
    color:         Colors.gray300,
    letterSpacing: 3,
  },
  numberFilled: {
    color: Colors.black,
  },

  innerShadow: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    height:          6,
    backgroundColor: 'transparent',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.25,
    shadowRadius:    4,
    elevation:       0,
  },
});
