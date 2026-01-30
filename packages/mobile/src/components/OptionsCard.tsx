import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Pressable,
  ViewStyle,
} from 'react-native';

export type OptionItem = {
  id: string;
  icon: ImageSourcePropType;

  title: string;
  subtitle: string;

  showIncentive?: boolean;
  incentiveText?: string; // "$$"

  selected?: boolean;
  disabled?: boolean;
};

interface OptionsCardProps {
  items: OptionItem[];
  onSelect?: (item: OptionItem) => void;

  style?: ViewStyle;

  itemStyle?: ViewStyle;
}

export default function OptionsCard({
  items,
  onSelect,
  style,
  itemStyle,
}: OptionsCardProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {items.map((item, idx) => {
        const isPressable = Boolean(onSelect) && !item.disabled;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect?.(item)}
            disabled={!isPressable}
            accessibilityRole={isPressable ? 'button' : undefined}
            accessibilityState={{
              disabled: !!item.disabled,
              selected: !!item.selected,
            }}
            style={[
              styles.optionRow,
              itemStyle,
              item.selected && styles.optionRowSelected,
              item.disabled && styles.optionRowDisabled,
              idx !== items.length - 1 ? styles.optionRowSpacer : null,
            ]}
          >
            <View style={styles.iconBox}>
              <Image source={item.icon} style={styles.icon} />
            </View>

            <View style={styles.textCol}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.subtitleRow}>
                <View style={styles.dot} />
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </View>

            {item.showIncentive && item.incentiveText ? (
              <View style={styles.incentivePill}>
                <Text style={styles.incentiveText}>{item.incentiveText}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    padding: 20,
    backgroundColor: 'transparent',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    padding: 20,

    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },

  optionRowSpacer: {
    marginBottom: 20,
  },

  optionRowSelected: {
    borderColor: '#000',
  },

  optionRowDisabled: {
    opacity: 0.5,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  textCol: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },

  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#000',
  },

  incentivePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },

  incentiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
