// Selectable card list component for presenting route or parking options with icons and subtitles.
// Supports an optional confirm button that activates after the user selects an item.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type OptionItem = {
  id: string;
  icon?: ImageSourcePropType;

  title: string;
  subtitle: string;
  rightText?: string;

  showIncentive?: boolean;
  incentiveText?: string; // "$$"

  selected?: boolean;
  disabled?: boolean;
  extraContent?: React.ReactNode;
};

interface OptionsCardProps {
  items: OptionItem[];

  // when user taps a card (select/highlight)
  onSelect?: (item: OptionItem) => void;

  // when user taps the bottom button (route/confirm)
  onConfirm?: (item: OptionItem) => void;

  // if true: card tap only highlights, button confirms
  showConfirmButton?: boolean;

  // button label override
  confirmText?: (item: OptionItem) => string;

  style?: ViewStyle;
  itemStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
}

export default function OptionsCard({
  items,
  onSelect,
  onConfirm,
  showConfirmButton = false,
  confirmText,
  style,
  itemStyle,
  buttonStyle,
}: OptionsCardProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  // internal selected state (so you don't *have* to manage it in parent)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // if parent passes selected on items, respect that first
  const externallySelected = useMemo(
    () => items.find(i => i.selected)?.id ?? null,
    [items]
  );

  const activeSelectedId = externallySelected ?? selectedId;
  const selectedItem = useMemo(
    () => items.find(i => i.id === activeSelectedId) ?? null,
    [items, activeSelectedId]
  );

  return (
    <View style={[style]}>
      {items.map((item, idx) => {
        const isPressable = Boolean(onSelect) && !item.disabled;

        const isSelected = activeSelectedId === item.id || !!item.selected;

        return (
          <Pressable
            key={item.id}
            onPress={() => {
              // select/highlight
              setSelectedId(item.id);
              onSelect?.(item);

              // old behavior (auto action) ONLY if confirm mode is off
              if (!showConfirmButton && onConfirm) {
                onConfirm(item);
              }
            }}
            disabled={!isPressable}
            accessibilityRole={isPressable ? 'button' : undefined}
            accessibilityState={{
              disabled: !!item.disabled,
              selected: isSelected,
            }}
            style={[
              styles.optionRow,
              { borderColor: c.border },
              itemStyle,
              isSelected && styles.optionRowSelected,
              item.disabled && styles.optionRowDisabled,
              idx !== items.length - 1 ? styles.optionRowSpacer : null,
            ]}
          >
            {item.icon && (
              <View style={[styles.iconBox, { backgroundColor: c.card }]}>
                <Image source={item.icon} style={[styles.icon, { tintColor: c.text.primary }]} />
              </View>
            )}

            <View style={styles.textCol}>
              <Text style={[styles.title, { color: c.text.primary }]}>
                {item.title}
              </Text>
              <View style={styles.subtitleRow}>
                <View style={styles.dot} />
                <Text style={[styles.subtitle, { color: c.text.secondary }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>

            {item.rightText ? (
              <Text style={[styles.rightText, { color: c.text.secondary }]}>
                {item.rightText}
              </Text>
            ) : null}

            {item.showIncentive && item.incentiveText ? (
              <View style={styles.incentivePill}>
                <Text style={styles.incentiveText}>{item.incentiveText}</Text>
              </View>
            ) : null}

            {item.extraContent}
          </Pressable>
        );
      })}

      {/* Bottom confirm button */}
      {showConfirmButton && selectedItem && onConfirm ? (
        <View style={styles.buttonWrap}>
          <Pressable
            style={[styles.confirmButton, buttonStyle]}
            onPress={() => onConfirm(selectedItem)}
          >
            <Text style={styles.confirmText}>
              {confirmText?.(selectedItem) ?? `Route to ${selectedItem.title}`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    padding: 20,

    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },

  optionRowSpacer: {
    marginBottom: 20,
  },

  optionRowSelected: {
    borderColor: '#0761E0',
    backgroundColor: 'transparent',
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
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },

  textCol: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1C',
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
    backgroundColor: '#1A9C30',
    marginRight: 8,
  },

  subtitle: {
    fontSize: 12,
    color: '#1C1C1C',
  },

  incentivePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1A9C30',
  },

  incentiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  rightText: {
    marginLeft: 'auto',
    fontSize: 13,
    color: '#8E8E93',
  },

  buttonWrap: {
    marginTop: 18,
  },

  confirmButton: {
    backgroundColor: '#0761E0',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
