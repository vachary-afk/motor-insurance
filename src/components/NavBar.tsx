import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

type NavBarProps = {
  title: string;
  onBack?: () => void;
  showChat?: boolean;
  backStyle?: 'arrow' | 'close';
};

export default function NavBar({ title, onBack, showChat = false, backStyle = 'arrow' }: NavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            {backStyle === 'arrow' ? (
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowIcon}>‹</Text>
              </View>
            ) : (
              <Text style={styles.closeIcon}>✕</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightActions}>
          {showChat && (
            <View style={styles.chatBtn}>
              <Text style={styles.chatIcon}>💬</Text>
              <View style={styles.chatDot} />
            </View>
          )}
          {!showChat && <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
  },
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: Colors.gray900,
    lineHeight: 22,
    marginTop: -1,
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.gray900,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.43,
    textAlign: 'center',
  },
  rightActions: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chatBtn: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  chatIcon: {
    fontSize: 16,
  },
  chatDot: {
    position: 'absolute',
    top: 4,
    right: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green500,
  },
  placeholder: {
    width: 40,
  },
});
