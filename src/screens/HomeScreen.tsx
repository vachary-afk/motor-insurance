import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import NavBar from '../components/NavBar';
import PressableScale from '../components/PressableScale';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const CAR_BIKE_IMG = 'https://www.figma.com/api/mcp/asset/2f87f399-a490-48cd-ae53-f6f2e95484f4';
const CAR_IMG = 'https://www.figma.com/api/mcp/asset/93d8b3e4-fbb4-4b1a-ac4f-9a2e47e58e59';
const GOOGLE_ICON = 'https://www.figma.com/api/mcp/asset/a2e552a5-c493-463c-ad3e-1b4acf796c69';

const STAR_COLOR = Colors.yellow500;

// ─────────────────────────────────────────────────────────────────────────────
// Animated entrance helper
// ─────────────────────────────────────────────────────────────────────────────
function useEntranceAnim(delayMs: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delayMs,
      withSpring(0, { damping: 18, stiffness: 120 })
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────
type CardProps = {
  imageUri: string;
  title: string;
  subtitle: string;
  delay: number;
  onPress: () => void;
};

function OptionCard({ imageUri, title, subtitle, delay, onPress }: CardProps) {
  const entranceStyle = useEntranceAnim(delay);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={entranceStyle}>
      <PressableScale onPress={handlePress} scaleTo={0.97}>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.arrowBtn}>
            <Text style={styles.arrowBtnText}>›</Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const ratingStyle = useEntranceAnim(280);
  const termsStyle = useEntranceAnim(380);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <NavBar title="Motor insurance" showChat />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <OptionCard
          imageUri={CAR_BIKE_IMG}
          title="Renew your vehicle insurance"
          subtitle="Enter your plate number for instant quotes."
          delay={80}
          onPress={() => navigation.navigate('PlateEntry', { step: 'emirate' })}
        />

        <OptionCard
          imageUri={CAR_IMG}
          title="Buying a new or used vehicle?"
          subtitle="Get covered before you drive it home."
          delay={160}
          onPress={() => {}}
        />

      </ScrollView>

      {/* Rating widget centred in remaining space between cards-scroll and terms */}
      <Animated.View style={[styles.ratingWidgetWrap, ratingStyle]}>
        <View style={styles.ratingWidget}>
          <Image source={{ uri: GOOGLE_ICON }} style={styles.googleIcon} resizeMode="contain" />
          <View style={styles.divider} />
          <View style={styles.ratingContent}>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingNumber}>4.9</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4].map((i) => (
                  <Text key={i} style={styles.star}>★</Text>
                ))}
                <Text style={[styles.star, styles.starPartial]}>★</Text>
              </View>
            </View>
            <Text style={styles.ratingSubtext}>By 11,000+ people.</Text>
          </View>
        </View>
      </Animated.View>

      {/* Terms — pinned to footer above safe area */}
      <Animated.View style={[styles.termsContainer, termsStyle]}>
        <Text style={styles.termsText}>
          By continuing, you authorize Shory to retrieve your personal and Vehicle details
          from the relevant authorities, and you agree to our{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://shory.sa/en/terms-and-conditions')}
          >
            Terms & Conditions
          </Text>
          .
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  cardImage: {
    width: 70,
    height: 40,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray900,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.gray800,
    lineHeight: 17,
  },
  arrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnText: {
    fontSize: 16,
    color: Colors.brand600,
    lineHeight: 20,
    marginLeft: 1,
  },

  // Rating
  ratingWidgetWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  ratingWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.gray200,
  },
  ratingContent: { gap: 3 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.black,
  },
  starsRow: { flexDirection: 'row', gap: 1 },
  star: {
    fontSize: 14,
    color: STAR_COLOR,
  },
  starPartial: {
    color: Colors.gray300,
  },
  ratingSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.black,
  },

  // Terms
  termsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  termsText: {
    fontSize: 10,
    color: Colors.gray700,
    lineHeight: 15,
    textAlign: 'center',
  },
  termsLink: {
    color: Colors.brand600,
    textDecorationLine: 'underline',
  },
});
