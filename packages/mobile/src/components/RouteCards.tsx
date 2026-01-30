import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';

export type RouteCardItem = {
  id: string;

  icon: ImageSourcePropType;

  duration: string;
  etaText: string;

  showDelay?: boolean;
  delayText?: string;

  subtitle?: string;

  showParkingWarning?: boolean;
  parkingWarningText?: string;

  disabled?: boolean;
};

interface RouteCardsProps {
  title?: string;
  items: RouteCardItem[];
  onPressItem?: (item: RouteCardItem) => void;
}

export default function RouteCards({
  title = 'Route Cards',
  items,
  onPressItem,
}: RouteCardsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        ✦ {title}
      </Text>

      {items.map(item => {
        const isPressable = Boolean(onPressItem) && !item.disabled;

        return (
          <Pressable
            key={item.id}
            onPress={() => onPressItem?.(item)}
            disabled={!isPressable}
            style={[
              styles.row,
              //{ backgroundColor: colors.background },
              item.disabled && styles.disabled,
            ]}
          >
            <View style={styles.iconBox}>
              <Image source={item.icon} style={styles.icon} />
            </View>

            <View style={styles.textCol}>
              <View style={styles.topRow}>
                <Text style={[styles.duration, { color: colors.textPrimary }]}>
                  {item.duration}
                </Text>

                <Text style={[styles.eta, { color: colors.textPrimary }]}>
                  {item.etaText}
                </Text>

                {item.showDelay && item.delayText ? (
                  <Text style={[styles.delay, { color: colors.logo_color }]}>
                    {item.delayText}
                  </Text>
                ) : null}
              </View>

              {item.showParkingWarning && item.parkingWarningText ? (
                <Text style={[styles.warning, { color: colors.logo_color }]}>
                  ⚠ {item.parkingWarningText}
                </Text>
              ) : item.subtitle ? (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {item.subtitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.arrowBox}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#8A38F5',
    borderStyle: 'dashed',
    borderRadius: 5,
    padding: 3,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    paddingVertical: 10,
  },

  disabled: { opacity: 0.5 },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: { width: 28, height: 28 },

  textCol: { flex: 1 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },

  duration: { fontSize: 30, fontWeight: '800', marginRight: 10 },
  eta: { fontSize: 16, fontWeight: '600', marginRight: 8 },
  delay: { fontSize: 16, fontWeight: '600' },

  subtitle: { marginTop: 3, fontSize: 14, fontWeight: '400' },
  warning: { marginTop: 3, fontSize: 14, fontStyle: 'italic' },

  arrowBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  arrow: { fontSize: 26, fontWeight: '600', color: '#000' },
});
