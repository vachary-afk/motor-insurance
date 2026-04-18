import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

type SegmentedControlProps = {
  tabs: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export default function SegmentedControl({ tabs, selectedIndex, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, i === selectedIndex && styles.tabSelected]}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, i === selectedIndex && styles.tabTextSelected]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray200,
    height: 40,
    padding: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tabSelected: {
    backgroundColor: Colors.gray700,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    textAlign: 'center',
  },
  tabTextSelected: {
    color: Colors.white,
  },
});
