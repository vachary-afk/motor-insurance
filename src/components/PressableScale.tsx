/**
 * Drop-in replacement for TouchableOpacity that scales down on press
 * using Reanimated spring — gives a tactile, physical feel.
 */
import React, { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

type Props = {
  onPress?: () => void;
  scaleTo?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function PressableScale({
  onPress,
  scaleTo = 0.95,
  children,
  style,
  disabled,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
  }, [scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={[animStyle, { flex: 1 }]}>{children}</Animated.View>
    </Pressable>
  );
}
