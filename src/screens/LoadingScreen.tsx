import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Loading'>;
};

const LOADER_IMG = 'https://www.figma.com/api/mcp/asset/befcb804-100c-454e-afe2-aee34c3b0c2e';

const LOADING_MESSAGES = [
  'Fetching your vehicle details...',
  'Contacting insurers...',
  'Comparing 28+ plans for you...',
  'Almost there...',
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated dot
// ─────────────────────────────────────────────────────────────────────────────
function PulseDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0.4, { duration: 400, easing: Easing.in(Easing.cubic) })
        ),
        -1
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

// withDelay is not exported from react-native-reanimated in some versions,
// use a helper instead
function withDelay(delay: number, anim: any) {
  return withSequence(withTiming(0, { duration: delay, easing: Easing.linear }), anim);
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function LoadingScreen({ navigation }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  // Float up/down
  const floatY = useSharedValue(0);
  // Gentle rotation
  const rotateZ = useSharedValue(0);
  // Entrance scale
  const entranceScale = useSharedValue(0.7);
  const entranceOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance
    entranceScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    entranceOpacity.value = withTiming(1, { duration: 400 });

    // Float
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    // Gentle rock
    rotateZ.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    // Cycle messages
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1200);

    // Navigate after 3.6s
    const navTimer = setTimeout(() => {
      navigation.replace('QuoteList');
    }, 3600);

    return () => {
      clearInterval(msgTimer);
      clearTimeout(navTimer);
    };
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotateZ: `${rotateZ.value}deg` },
      { scale: entranceScale.value },
    ],
    opacity: entranceOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={imageStyle}>
          <Image
            source={{ uri: LOADER_IMG }}
            style={styles.loaderImage}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.textBlock}>
          <MessageFade message={LOADING_MESSAGES[msgIndex]} />

          <View style={styles.dotsRow}>
            <PulseDot delay={0} />
            <PulseDot delay={160} />
            <PulseDot delay={320} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Crossfade message
// ─────────────────────────────────────────────────────────────────────────────
function MessageFade({ message }: { message: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 120 }),
      withTiming(1, { duration: 260 })
    );
  }, [message]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.loadingText, style]}>
      {message}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 28,
  },
  loaderImage: {
    width: 180,
    height: 180,
  },
  textBlock: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray900,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand600,
  },
});
