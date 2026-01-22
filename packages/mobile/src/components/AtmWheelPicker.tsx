import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useColorScheme,
} from 'react-native';

interface AtmWheelPickerProps {
  /** Initial hour (1-12) */
  initialHour?: number;
  /** Initial minute (0-59) */
  initialMinute?: number;
  /** Initial period ('am' or 'pm') */
  initialPeriod?: 'am' | 'pm';
  /** Callback when time changes */
  onTimeChange?: (time: {
    hour: number;
    minute: number;
    period: 'am' | 'pm';
  }) => void;
}

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 9; // 4 above + center + 4 below
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Helper function to get current time
const getCurrentTime = (): {
  hour: number;
  minute: number;
  period: 'am' | 'pm';
} => {
  const now = new Date();
  let hour = now.getHours();
  const minute = now.getMinutes();
  const period: 'am' | 'pm' = hour >= 12 ? 'pm' : 'am';

  // Convert to 12-hour format
  hour = hour % 12 || 12;

  // Round minute to nearest 5-minute increment, cap at 55
  const roundedMinute = Math.min(55, Math.round(minute / 5) * 5);

  return { hour, minute: roundedMinute, period };
};

const AtmWheelPicker: React.FC<AtmWheelPickerProps> = ({
  initialHour,
  initialMinute,
  initialPeriod,
  onTimeChange,
}) => {
  const currentTime = getCurrentTime();

  const defaultHour = initialHour ?? currentTime.hour;
  const defaultMinute = initialMinute ?? currentTime.minute;
  const defaultPeriod = initialPeriod ?? currentTime.period;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Generate hours 1-12
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  // Generate minutes in 5-minute increments
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // AM/PM options
  const periods = ['am', 'pm'];

  const [selectedHour, setSelectedHour] = useState(defaultHour);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'am' | 'pm'>(
    defaultPeriod
  );

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  // Scroll each column to the initial/default position so the current time is centered on mount
  useEffect(() => {
    const hourIndex = hours.indexOf(defaultHour);
    const minuteIndex = minutes.indexOf(defaultMinute);
    const periodIndex = periods.indexOf(defaultPeriod);

    // Guard against -1 (shouldn't happen, but avoids scroll errors)
    const safeHourIndex = Math.max(0, hourIndex);
    const safeMinuteIndex = Math.max(0, minuteIndex);
    const safePeriodIndex = Math.max(0, periodIndex);

    const scrollToIndex = (
      ref: React.RefObject<ScrollView | null>,
      index: number
    ) => {
      ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    };

    // Use requestAnimationFrame to ensure scroll views are laid out
    requestAnimationFrame(() => {
      scrollToIndex(hourScrollRef, safeHourIndex);
      scrollToIndex(minuteScrollRef, safeMinuteIndex);
      scrollToIndex(periodScrollRef, safePeriodIndex);
    });
  }, [defaultHour, defaultMinute, defaultPeriod]);

  // Helper to snap to nearest item
  const snapToItem = (
    offset: number,
    itemCount: number,
    setter: (value: any) => void,
    values: any[]
  ) => {
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, itemCount - 1));
    setter(values[clampedIndex]);
    return clampedIndex;
  };

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = snapToItem(offsetY, hours.length, setSelectedHour, hours);

    if (onTimeChange) {
      onTimeChange({
        hour: hours[index],
        minute: selectedMinute,
        period: selectedPeriod,
      });
    }
  };

  const handleMinuteScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = snapToItem(
      offsetY,
      minutes.length,
      setSelectedMinute,
      minutes
    );

    if (onTimeChange) {
      onTimeChange({
        hour: selectedHour,
        minute: minutes[index],
        period: selectedPeriod,
      });
    }
  };

  const handlePeriodScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = snapToItem(
      offsetY,
      periods.length,
      setSelectedPeriod,
      periods as ('am' | 'pm')[]
    );

    if (onTimeChange) {
      onTimeChange({
        hour: selectedHour,
        minute: selectedMinute,
        period: periods[index] as 'am' | 'pm',
      });
    }
  };

  const renderColumn = (
    items: (number | string)[],
    selectedValue: number | string,
    scrollRef: React.RefObject<ScrollView | null>,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    formatValue?: (value: number | string) => string
  ) => {
    const selectedIndex = items.findIndex(i => i === selectedValue);

    return (
      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top padding */}
          <View style={{ height: ITEM_HEIGHT * 4 }} />

          {items.map((item, index) => {
            const isSelected = item === selectedValue;
            const distance = Math.abs(index - selectedIndex);
            const scale = Math.max(0.6, 1 - distance * 0.12);
            const tilt = (index - selectedIndex) * 13;
            return (
              <View key={index} style={styles.itemContainer}>
                <Text
                  style={[
                    styles.itemText,
                    isDarkMode && styles.itemTextDark,
                    isSelected && styles.itemTextSelected,
                    isSelected && isDarkMode && styles.itemTextSelectedDark,
                    {
                      transform: [
                        { perspective: 500 },
                        { rotateX: `${tilt}deg` },
                        { scale },
                      ],
                    },
                  ]}
                >
                  {formatValue ? formatValue(item) : item}
                </Text>
              </View>
            );
          })}

          {/* Bottom padding */}
          <View style={{ height: ITEM_HEIGHT * 4 }} />
        </ScrollView>
      </View>
    );
  };

  const formatMinute = (value: number | string) => {
    const num = typeof value === 'number' ? value : parseInt(value, 10);
    return num.toString().padStart(2, '0');
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Selection highlight */}
      <View
        style={[
          styles.selectionOverlay,
          isDarkMode && styles.selectionOverlayDark,
        ]}
      />

      <View style={styles.columnsContainer}>
        {/* Hour column */}
        {renderColumn(hours, selectedHour, hourScrollRef, handleHourScroll)}

        {/* Minute column */}
        {renderColumn(
          minutes,
          selectedMinute,
          minuteScrollRef,
          handleMinuteScroll,
          formatMinute
        )}

        {/* AM/PM column */}
        {renderColumn(
          periods,
          selectedPeriod,
          periodScrollRef,
          handlePeriodScroll
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    width: '80%',
    maxWidth: 280,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  containerDark: {
    backgroundColor: '#090a12',
  },
  columnsContainer: {
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  column: {
    flex: 0,
    minWidth: 60,
    height: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 22,
    color: '#c7c7cc',
    fontWeight: '300',
    fontFamily: 'System',
  },
  itemTextDark: {
    color: '#48484a',
  },
  itemTextSelected: {
    color: '#000000',
    fontWeight: '400',
  },
  itemTextSelectedDark: {
    color: '#ffffff',
    fontWeight: '400',
  },
  selectionOverlay: {
    position: 'absolute',
    top: ITEM_HEIGHT * 4,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    zIndex: -1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5ea',
  },
  selectionOverlayDark: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
});

export default AtmWheelPicker;
