import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  ViewStyle,
  TextStyle,
} from 'react-native';

export type RouteBadge = {
  label: string;
  backgroundColor: string;
  textColor?: string;
};

export type RouteCardItem = {
  id: string;

  icon?: ImageSourcePropType;

  iconFallback?: string;

  duration: string;
  etaText: string;
  deltaText?: string;

  subtitle?: string;
  warningText?: string;

  badges?: RouteBadge[];
  disabled?: boolean;
};

export interface RouteCardsProps {
  title?: string;
  items: RouteCardItem[];
  onPressItem?: (item: RouteCardItem) => void;

  style?: ViewStyle;
  titleStyle?: TextStyle;
}

const DEFAULT_TITLE = 'Route Cards';

export default function RouteCards({
  title = DEFAULT_TITLE,
  items,
  onPressItem,
  style,
  titleStyle,
}: RouteCardsProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>✦</Text>
        <Text style={[styles.headerTitle, titleStyle]}>{title}</Text>
      </View>

      <View style={styles.card}>
        {items.map((item, idx) => {
          const content = (
            <View style={styles.rowInner}>
              {/* Left icon */}
              <View style={styles.leftIconWrap}>
                {item.icon ? (
                  <Image
                    source={item.icon}
                    style={styles.leftIconImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.leftIconFallback}>
                    {item.iconFallback ?? '🚗'}
                  </Text>
                )}
              </View>

              {/* Main text */}
              <View style={styles.textCol}>
                <View style={styles.topLine}>
                  <Text style={styles.duration}>{item.duration}</Text>
                  <Text style={styles.eta}>{item.etaText}</Text>
                  {item.deltaText ? (
                    <Text style={styles.delta}>{item.deltaText}</Text>
                  ) : null}
                </View>

                {item.subtitle ? (
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                ) : null}

                {item.warningText ? (
                  <Text style={styles.warning}>
                    <Text style={styles.warningIcon}>⚠️ </Text>
                    {item.warningText}
                  </Text>
                ) : null}
              </View>

              {/* Right badges (optional) */}
              {item.badges && item.badges.length > 0 ? (
                <View style={styles.badgeStack}>
                  {item.badges.slice(0, 2).map((b, i) => (
                    <View
                      key={`${item.id}-badge-${b.label}-${i}`}
                      style={[
                        styles.badge,
                        { backgroundColor: b.backgroundColor },
                        i === 1 ? styles.badgeOverlap : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: b.textColor ?? '#fff' },
                        ]}
                      >
                        {b.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );

          const isLast = idx === items.length - 1;

          return (
            <View key={item.id}>
              {onPressItem ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => !item.disabled && onPressItem(item)}
                  disabled={item.disabled}
                  accessibilityRole="button"
                  accessibilityHint={`Opens route option ${idx + 1}`}
                  style={[
                    styles.rowPressable,
                    item.disabled ? styles.disabledRow : null,
                  ]}
                >
                  {content}
                </TouchableOpacity>
              ) : (
                <View style={styles.rowPressable}>{content}</View>
              )}

              {!isLast ? <View style={styles.spacer} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIcon: {
    color: '#7C3AED',
    fontSize: 16,
    marginRight: 6,
  },
  headerTitle: {
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  rowPressable: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  disabledRow: {
    opacity: 0.5,
  },

  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  leftIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leftIconImage: {
    width: 22,
    height: 22,
  },
  leftIconFallback: {
    fontSize: 18,
  },

  textCol: {
    flex: 1,
    paddingRight: 8,
  },

  topLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  duration: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginRight: 10,
  },
  eta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginRight: 10,
  },
  delta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#333',
  },

  warning: {
    marginTop: 4,
    fontSize: 13,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  warningIcon: {
    fontStyle: 'normal',
  },

  spacer: {
    height: 10,
  },

  badgeStack: {
    width: 54,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badgeOverlap: {
    marginTop: -10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
