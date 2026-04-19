import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
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

// ── Exported layout constants ─────────────────────────────────────────────────
export const PLATE_TOTAL_WIDTH   = 324;
export const PLATE_CODE_WIDTH    = 63;
export const PLATE_EMIRATE_WIDTH = 81;
export const PLATE_DIVIDER_WIDTH = 1;

// Triangle indicator X positions (center of each zone minus half triangle width)
// code center: 63/2=31.5, emirate center: 63+1+81/2=104.5, number center: 63+1+81+1+178/2=235
const ZONE_TRIANGLE_X: Record<PlateZone, number> = {
  code:    31.5 - 6.5,   // 25
  emirate: 104.5 - 6.5,  // 98
  number:  235 - 6.5,    // 228.5
};

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  plateCode:   string | null;
  plateNumber: string;
  emirate:     string | null;
  activeZone:  PlateZone;
  onZonePress: (zone: PlateZone) => void;
};

// ── Tappable zone wrapper ─────────────────────────────────────────────────────
type ZoneSectionProps = {
  active:   boolean;
  onPress:  () => void;
  style:    object;
  children: React.ReactNode;
};

function ZoneSection({ active, onPress, style, children }: ZoneSectionProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    bgOpacity.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }));

  const activeOverlayStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.91, { damping: 12, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
      onPress={onPress}
      style={style}
    >
      {/* Active bg overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.activeOverlay, activeOverlayStyle]} />
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
  const imgSource  = emirate ? EMIRATE_IMAGES[emirate] : null;
  const numberFilled = plateNumber.length > 0;

  // Sliding triangle indicator
  const triangleLeft = useSharedValue(ZONE_TRIANGLE_X[activeZone]);
  useEffect(() => {
    triangleLeft.value = withSpring(ZONE_TRIANGLE_X[activeZone], {
      damping: 22, stiffness: 220,
    });
  }, [activeZone]);

  const triangleStyle = useAnimatedStyle(() => ({
    left: triangleLeft.value,
  }));

  // Number entry micro-interaction: ease-out cubic-bezier(0.22, 1, 0.36, 1)
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

  // Code zone colours
  const codeBg    = hasEmirate && isAbuDhabi ? Colors.red500 : Colors.white;
  const codeColor = hasEmirate && isAbuDhabi
    ? Colors.white
    : hasEmirate ? Colors.black : Colors.gray300;

  // Number zone bg
  const numberBg = numberFilled ? Colors.white : Colors.gray100;

  return (
    <View style={styles.plate}>

      {/* Code zone */}
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

      {/* Emirate zone */}
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

      {/* Number zone */}
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

      {/* ── Sliding triangle indicator inside plate ── */}
      <Animated.View style={[styles.zoneTriangle, triangleStyle]} pointerEvents="none" />

      {/* Inner shadow overlay */}
      <View style={styles.innerShadow} pointerEvents="none" />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  plate: {
    width: PLATE_TOTAL_WIDTH,
    height: 60,
    borderWidth: 4,
    borderColor: Colors.gray800,
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

  activeOverlay: {
    backgroundColor: Colors.brand50,
  },

  zoneTriangle: {
    position: 'absolute',
    bottom: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 6.5,
    borderRightWidth: 6.5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.brand600,
    zIndex: 10,
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
