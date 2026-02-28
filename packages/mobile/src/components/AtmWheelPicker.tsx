// Cylindrical 3D scroll wheel for selecting a departure time (hour, minute, AM/PM).
// Supports a minimum selectable time to prevent picking times in the past.
// Doesn't have dark mode implemented

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  initialHour?: number;
  initialMinute?: number;
  initialPeriod?: 'am' | 'pm';
  onTimeChange?: (time: {
    hour: number;
    minute: number;
    period: 'am' | 'pm';
  }) => void;
  showSelectionOverlay?: boolean;
  // Minimum selectable time — items before this are hidden
  minHour?: number;
  minMinute?: number;
  minPeriod?: 'am' | 'pm';
}

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 9;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const HOUR_CYCLE_LENGTH = 12;
const HOUR_LOOPS = 5;
const HOURS_LENGTH = HOUR_CYCLE_LENGTH * HOUR_LOOPS;
const HOUR_MID_START = HOUR_CYCLE_LENGTH * 2;
const MINUTE_CYCLE_LENGTH = 12;
const MINUTE_LOOPS = 5;
const MINUTES_LENGTH = MINUTE_CYCLE_LENGTH * MINUTE_LOOPS;
const MINUTE_MID_START = MINUTE_CYCLE_LENGTH * 2;
const PERIODS_LENGTH = 32;
const MID_AM_INDEX = PERIODS_LENGTH / 2 - 1;
const MID_PM_INDEX = PERIODS_LENGTH / 2;

const getCurrentTime = (): { hour: number; minute: number; period: 'am' | 'pm' } => {
  const now = new Date();
  let hour = now.getHours();
  const minute = now.getMinutes();
  const period: 'am' | 'pm' = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  const roundedMinute = Math.min(55, Math.round(minute / 5) * 5);
  return { hour, minute: roundedMinute, period };
};

/** Convert 12h time to minutes-since-midnight for comparison */
function toMinutes(hour: number, minute: number, period: 'am' | 'pm'): number {
  let h = hour % 12;
  if (period === 'pm') h += 12;
  return h * 60 + minute;
}

const AtmWheelPicker: React.FC<AtmWheelPickerProps> = ({
  initialHour,
  initialMinute,
  initialPeriod,
  onTimeChange,
  showSelectionOverlay = false,
  minHour,
  minMinute = 0,
  minPeriod = 'am',
}) => {
  const currentTime = getCurrentTime();
  const defaultHour = initialHour ?? currentTime.hour;
  const defaultMinute = initialMinute ?? currentTime.minute;
  const defaultPeriod = initialPeriod ?? currentTime.period;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Min threshold in minutes-since-midnight (0 if no min set)
  const minTotalMinutes =
    minHour !== undefined ? toMinutes(minHour, minMinute, minPeriod) : 0;

  const baseHours = Array.from({ length: HOUR_CYCLE_LENGTH }, (_, i) => i + 1);
  const baseMinutes = Array.from(
    { length: MINUTE_CYCLE_LENGTH },
    (_, i) => i * 5
  );

  const hourBaseIndex = baseHours.indexOf(defaultHour);
  const minuteBaseIndex = baseMinutes.indexOf(defaultMinute);

  const defaultHourIndex = (hourBaseIndex === -1 ? 0 : hourBaseIndex) + HOUR_MID_START;
  const defaultMinuteIndex = (minuteBaseIndex === -1 ? 0 : minuteBaseIndex) + MINUTE_MID_START;
  const defaultPeriodIndex = defaultPeriod === 'am' ? MID_AM_INDEX : MID_PM_INDEX;

  const hours = Array.from({ length: HOURS_LENGTH }, (_, i) => baseHours[i % baseHours.length]);
  const minutes = Array.from({ length: MINUTES_LENGTH }, (_, i) => baseMinutes[i % baseMinutes.length]);

  const [selectedHour, setSelectedHour] = useState(defaultHour);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'am' | 'pm'>(defaultPeriod);
  const [selectedHourIndex, setSelectedHourIndex] = useState(defaultHourIndex);
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(defaultMinuteIndex);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(defaultPeriodIndex);

  const [hourScrollOffset, setHourScrollOffset] = useState(0);
  const [minuteScrollOffset, setMinuteScrollOffset] = useState(0);
  const [periodScrollOffset, setPeriodScrollOffset] = useState(0);

  const periods = useMemo(() => {
    return Array.from({ length: PERIODS_LENGTH }, (_, i) => {
      if (selectedPeriod === 'am') {
        return i <= selectedPeriodIndex ? 'am' : 'pm';
      } else {
        return i < selectedPeriodIndex ? 'am' : 'pm';
      }
    });
  }, [selectedPeriod, selectedPeriodIndex]);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const safeHourIndex = Math.max(0, defaultHourIndex);
    const safeMinuteIndex = Math.max(0, defaultMinuteIndex);
    const safePeriodIndex = Math.max(0, defaultPeriodIndex);

    requestAnimationFrame(() => {
      hourScrollRef.current?.scrollTo({ y: safeHourIndex * ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: safeMinuteIndex * ITEM_HEIGHT, animated: false });
      periodScrollRef.current?.scrollTo({ y: safePeriodIndex * ITEM_HEIGHT, animated: false });
      setHourScrollOffset(safeHourIndex * ITEM_HEIGHT);
      setMinuteScrollOffset(safeMinuteIndex * ITEM_HEIGHT);
      setPeriodScrollOffset(safePeriodIndex * ITEM_HEIGHT);
    });
  }, [defaultHour, defaultMinute, defaultPeriod]);

  /** Check if a given time combination is before the minimum */
  const isBeforeMin = (h: number, m: number, p: 'am' | 'pm') => {
    if (minHour === undefined) return false;
    return toMinutes(h, m, p) < minTotalMinutes;
  };

  const recenterHourIfNeeded = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index <= 6) {
      const newIndex = index + HOUR_CYCLE_LENGTH;
      setSelectedHourIndex(newIndex);
      setSelectedHour(hours[newIndex]);
      const y = newIndex * ITEM_HEIGHT;
      setHourScrollOffset(y);
      hourScrollRef.current?.scrollTo({ y, animated: false });
    } else if (index >= hours.length - 7) {
      const newIndex = index - HOUR_CYCLE_LENGTH;
      setSelectedHourIndex(newIndex);
      setSelectedHour(hours[newIndex]);
      const y = newIndex * ITEM_HEIGHT;
      setHourScrollOffset(y);
      hourScrollRef.current?.scrollTo({ y, animated: false });
    }
  };

  const recenterMinuteIfNeeded = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index <= 6) {
      const newIndex = index + MINUTE_CYCLE_LENGTH;
      setSelectedMinuteIndex(newIndex);
      setSelectedMinute(minutes[newIndex]);
      const y = newIndex * ITEM_HEIGHT;
      setMinuteScrollOffset(y);
      minuteScrollRef.current?.scrollTo({ y, animated: false });
    } else if (index >= minutes.length - 7) {
      const newIndex = index - MINUTE_CYCLE_LENGTH;
      setSelectedMinuteIndex(newIndex);
      setSelectedMinute(minutes[newIndex]);
      const y = newIndex * ITEM_HEIGHT;
      setMinuteScrollOffset(y);
      minuteScrollRef.current?.scrollTo({ y, animated: false });
    }
  };

  const recenterPeriodIfNeeded = (offsetY: number, currentPeriod: 'am' | 'pm') => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (currentPeriod === 'am' && index <= 6) {
      const newIndex = MID_AM_INDEX;
      setSelectedPeriodIndex(newIndex);
      setPeriodScrollOffset(newIndex * ITEM_HEIGHT);
      periodScrollRef.current?.scrollTo({ y: newIndex * ITEM_HEIGHT, animated: false });
    }
    if (currentPeriod === 'pm' && index >= periods.length - 7) {
      const newIndex = MID_PM_INDEX;
      setSelectedPeriodIndex(newIndex);
      setPeriodScrollOffset(newIndex * ITEM_HEIGHT);
      periodScrollRef.current?.scrollTo({ y: newIndex * ITEM_HEIGHT, animated: false });
    }
  };

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, hours.length - 1));
    const value = hours[clampedIndex];
    setSelectedHour(value);
    setSelectedHourIndex(clampedIndex);
    recenterHourIfNeeded(offsetY);

    // If the current minute is now before the min, snap minute forward to minMinute
    let effectiveMinute = selectedMinute;
    if (
      minHour !== undefined &&
      selectedPeriod === minPeriod &&
      value === minHour &&
      selectedMinute < minMinute
    ) {
      effectiveMinute = minMinute;
      const minMinuteBaseIndex = baseMinutes.indexOf(minMinute);
      const newMinuteIndex =
        (minMinuteBaseIndex === -1 ? 0 : minMinuteBaseIndex) + MINUTE_MID_START;
      setSelectedMinute(minMinute);
      setSelectedMinuteIndex(newMinuteIndex);
      const y = newMinuteIndex * ITEM_HEIGHT;
      setMinuteScrollOffset(y);
      minuteScrollRef.current?.scrollTo({ y, animated: true });
    }

    onTimeChange?.({ hour: value, minute: effectiveMinute, period: selectedPeriod });
  };

  const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, minutes.length - 1));
    const value = minutes[clampedIndex];
    setSelectedMinute(value);
    setSelectedMinuteIndex(clampedIndex);
    recenterMinuteIfNeeded(offsetY);
    onTimeChange?.({ hour: selectedHour, minute: value, period: selectedPeriod });
  };

  const handlePeriodScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, periods.length - 1));
    const newPeriod = periods[clampedIndex] as 'am' | 'pm';
    setSelectedPeriod(newPeriod);
    setSelectedPeriodIndex(clampedIndex);
    recenterPeriodIfNeeded(offsetY, newPeriod);
    onTimeChange?.({ hour: selectedHour, minute: selectedMinute, period: newPeriod });
  };

  const renderColumn = (
    items: (number | string)[],
    selectedValue: number | string,
    scrollRef: React.RefObject<ScrollView | null>,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    formatValue?: (value: number | string) => string,
    scrollOffset: number = 0,
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    selectedIndex?: number,
    columnPosition: 'left' | 'center' | 'right' = 'center',
    isPastFn?: (item: number | string, index: number) => boolean
  ) => {
    const defaultSelectedIndex = items.findIndex(i => i === selectedValue);
    const actualSelectedIndex = selectedIndex !== undefined ? selectedIndex : defaultSelectedIndex;
    const centerPosition = scrollOffset / ITEM_HEIGHT;

    return (
      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={{ height: ITEM_HEIGHT * 4 }} />

          {items.map((item, index) => {
            const distance = Math.abs(index - centerPosition);
            const normEdge = Math.min(distance / 4.5, 1);
            const scale = Math.max(0.35, 1 - Math.pow(normEdge, 1.8) * 0.7);
            const tilt = (index - centerPosition) * 13;
            const shiftMagnitude = Math.pow(normEdge, 1.3) * 10;
            const translateX = columnPosition === 'left' ? shiftMagnitude : columnPosition === 'right' ? -shiftMagnitude : 0;
            const compressionFactor = distance > 0 ? Math.pow(distance, 2.2) * 2.2 : 0;
            const translateY = -compressionFactor * Math.sign(index - centerPosition);
            const maxVisibleTilt = 70;
            const opacity = Math.abs(tilt) > maxVisibleTilt ? 0 : 1 - Math.max(0, (Math.abs(tilt) - 50) / 20);
            const isSelected = index === actualSelectedIndex;

            // Hide items that are before the minimum time
            const isPast = isPastFn ? isPastFn(item, index) : false;
            if (isPast) return <View key={index} style={{ height: ITEM_HEIGHT }} />;

            return (
              <View key={index} style={styles.itemContainer}>
                <Text
                  style={[
                    styles.itemText,
                    isDarkMode && styles.itemTextDark,
                    isSelected && styles.itemTextSelected,
                    isSelected && isDarkMode && styles.itemTextSelectedDark,
                    {
                      opacity,
                      transform: [
                        { perspective: 500 },
                        { translateY },
                        { translateX },
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

          <View style={{ height: ITEM_HEIGHT * 4 }} />
        </ScrollView>
      </View>
    );
  };

  const formatMinute = (value: number | string) => {
    const num = typeof value === 'number' ? value : parseInt(value, 10);
    return num.toString().padStart(2, '0');
  };

  // isPast functions per column — hide items before min time
  const isHourPast = (item: number | string, index: number) => {
    if (minHour === undefined) return false;
    const h = typeof item === 'number' ? item : parseInt(item as string);
    // For the current period, check if hour is before min hour
    // Use selectedPeriod context — if period is different from minPeriod, no restriction
    if (selectedPeriod !== minPeriod) return false;
    return toMinutes(h, 0, selectedPeriod) < toMinutes(minHour, 0, minPeriod);
  };

  const isMinutePast = (item: number | string, index: number) => {
    if (minHour === undefined) return false;
    const m = typeof item === 'number' ? item : parseInt(item as string);
    // Only restrict minutes if on the same hour and period as min
    if (selectedPeriod !== minPeriod) return false;
    if (selectedHour !== minHour) return false;
    return m < minMinute;
  };

  const isPeriodPast = (item: number | string, index: number) => {
    if (minHour === undefined) return false;
    const p = item as 'am' | 'pm';
    // Hide 'am' if min period is 'pm'
    return minPeriod === 'pm' && p === 'am';
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {showSelectionOverlay && (
        <View
          style={[
            styles.selectionOverlay,
            isDarkMode && styles.selectionOverlayDark,
          ]}
        />
      )}

      <View style={styles.columnsContainer}>
        {renderColumn(
          hours, selectedHour, hourScrollRef, handleHourScroll,
          undefined, hourScrollOffset,
          e => { setHourScrollOffset(e.nativeEvent.contentOffset.y); },
          selectedHourIndex, 'left', isHourPast
        )}
        {renderColumn(
          minutes, selectedMinute, minuteScrollRef, handleMinuteScroll,
          formatMinute, minuteScrollOffset,
          e => { setMinuteScrollOffset(e.nativeEvent.contentOffset.y); },
          selectedMinuteIndex, 'center', isMinutePast
        )}
        {renderColumn(
          periods, selectedPeriod, periodScrollRef, handlePeriodScroll,
          undefined, periodScrollOffset,
          e => { setPeriodScrollOffset(e.nativeEvent.contentOffset.y); },
          selectedPeriodIndex, 'right', isPeriodPast
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
