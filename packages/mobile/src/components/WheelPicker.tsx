// no dark mode

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useColorScheme,
} from 'react-native';

type WheelPickerMode = 'time' | 'datetime' | 'timer';

interface WheelPickerProps {
  mode: WheelPickerMode;
  initialHour?: number;
  initialMinute?: number;
  initialPeriod?: 'am' | 'pm';
  initialDate?: Date;
  onTimeChange?: (time: {
    date?: string;
    hour: number;
    minute: number;
    period?: 'am' | 'pm';
  }) => void;
}

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 9;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const HOUR_CYCLE_LENGTH = 12;
const HOUR_LOOPS = 5;
const HOURS_LENGTH = HOUR_CYCLE_LENGTH * HOUR_LOOPS;
const HOUR_MID_START = HOUR_CYCLE_LENGTH * 2;
const PERIODS_LENGTH = 32;
const MID_AM_INDEX = PERIODS_LENGTH / 2 - 1;
const MID_PM_INDEX = PERIODS_LENGTH / 2;

let _cachedDatesKey: string | null = null;
let _cachedDates: Date[] | null = null;
let _datesGenCount = 0;
let _periodsGenCount = 0;

const getCurrentTime = () => {
  const now = new Date();
  let hour = now.getHours();
  const minute = now.getMinutes();
  const period: 'am' | 'pm' = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return { hour, minute, period };
};

const formatDate = (date: Date, isToday: boolean): string => {
  if (isToday) return 'Today';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
};

const WheelPicker: React.FC<WheelPickerProps> = ({
  mode,
  initialHour,
  initialMinute,
  initialPeriod,
  initialDate,
  onTimeChange,
}) => {
  const currentTime = getCurrentTime();
  const today = new Date();

  const defaultHour = initialHour ?? currentTime.hour;
  const defaultPeriod = initialPeriod ?? currentTime.period;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const generateDates = () => {
    _datesGenCount++;
    const dates: Date[] = [];
    for (let i = -7; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const _todayKey = today.toDateString();
  let dates: Date[];
  if (_cachedDatesKey !== _todayKey || !_cachedDates) {
    _cachedDates = generateDates();
    _cachedDatesKey = _todayKey;
  }
  dates = _cachedDates!;
  const defaultDateIndex = dates.findIndex(
    d => d.toDateString() === (initialDate || today).toDateString()
  );

  const baseHours = Array.from({ length: HOUR_CYCLE_LENGTH }, (_, i) => i + 1);

  const getMinuteArray = () => {
    if (mode === 'datetime') {
      return Array.from({ length: 60 }, (_, i) => i);
    } else {
      return Array.from({ length: 12 }, (_, i) => i * 5);
    }
  };

  const baseMinutes = getMinuteArray();

  const getDefaultMinute = () => {
    if (initialMinute !== undefined) {
      return initialMinute;
    }

    if (mode === 'timer') {
      const currentMin = currentTime.minute;
      const rounded = Math.round(currentMin / 5) * 5;
      return rounded % 60;
    }

    return currentTime.minute;
  };

  const defaultMinute = getDefaultMinute();
  const MINUTE_CYCLE_LENGTH = baseMinutes.length;
  const MINUTE_LOOPS = 5;
  const MINUTES_LENGTH = MINUTE_CYCLE_LENGTH * MINUTE_LOOPS;
  const MINUTE_MID_START = MINUTE_CYCLE_LENGTH * 2;

  const hourBaseIndex = baseHours.indexOf(defaultHour);
  const minuteBaseIndex = baseMinutes.indexOf(defaultMinute);

  const defaultHourIndex =
    (hourBaseIndex === -1 ? 0 : hourBaseIndex) + HOUR_MID_START;
  const defaultMinuteIndex =
    (minuteBaseIndex === -1 ? 0 : minuteBaseIndex) + MINUTE_MID_START;
  const defaultPeriodIndex =
    defaultPeriod === 'am' ? MID_AM_INDEX : MID_PM_INDEX;

  const hours = Array.from(
    { length: HOURS_LENGTH },
    (_, i) => baseHours[i % baseHours.length]
  );
  const minutes = Array.from(
    { length: MINUTES_LENGTH },
    (_, i) => baseMinutes[i % baseMinutes.length]
  );

  const [selectedHour, setSelectedHour] = useState(defaultHour);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'am' | 'pm'>(
    defaultPeriod
  );
  const [selectedDateIndex, setSelectedDateIndex] = useState(
    defaultDateIndex === -1 ? 7 : defaultDateIndex
  );
  const [selectedHourIndex, setSelectedHourIndex] = useState(defaultHourIndex);
  const [selectedMinuteIndex, setSelectedMinuteIndex] =
    useState(defaultMinuteIndex);
  const [selectedPeriodIndex, setSelectedPeriodIndex] =
    useState(defaultPeriodIndex);

  const [hourScrollOffset, setHourScrollOffset] = useState(0);
  const [minuteScrollOffset, setMinuteScrollOffset] = useState(0);
  const [periodScrollOffset, setPeriodScrollOffset] = useState(0);
  const [dateScrollOffset, setDateScrollOffset] = useState(0);

  const periods = useMemo(() => {
    _periodsGenCount++;
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
  const dateScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const hourIndex = defaultHourIndex;
    const minuteIndex = defaultMinuteIndex;
    const periodIndex = defaultPeriodIndex;
    const dateIndex = selectedDateIndex;

    const safeHourIndex = Math.max(0, hourIndex);
    const safeMinuteIndex = Math.max(0, minuteIndex);
    const safePeriodIndex = Math.max(0, periodIndex);
    const safeDateIndex = Math.max(0, dateIndex);

    const scrollToIndex = (
      ref: React.RefObject<ScrollView | null>,
      index: number
    ) => {
      ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    };

    requestAnimationFrame(() => {
      const hourOffset = safeHourIndex * ITEM_HEIGHT;
      const minuteOffset = safeMinuteIndex * ITEM_HEIGHT;
      const periodOffset = safePeriodIndex * ITEM_HEIGHT;
      const dateOffset = safeDateIndex * ITEM_HEIGHT;

      scrollToIndex(hourScrollRef, safeHourIndex);
      scrollToIndex(minuteScrollRef, safeMinuteIndex);
      if (mode !== 'timer') scrollToIndex(periodScrollRef, safePeriodIndex);
      if (mode === 'datetime') scrollToIndex(dateScrollRef, safeDateIndex);

      setHourScrollOffset(hourOffset);
      setMinuteScrollOffset(minuteOffset);
      setPeriodScrollOffset(periodOffset);
      setDateScrollOffset(dateOffset);
    });
  }, [
    defaultHourIndex,
    defaultMinuteIndex,
    defaultPeriodIndex,
    selectedDateIndex,
    mode,
  ]);

  const recenterHourIfNeeded = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const topThreshold = 6;
    const bottomThreshold = hours.length - 7;

    if (index <= topThreshold) {
      const newIndex = index + HOUR_CYCLE_LENGTH;
      const newValue = hours[newIndex];
      setSelectedHourIndex(newIndex);
      setSelectedHour(newValue);
      const y = newIndex * ITEM_HEIGHT;
      setHourScrollOffset(y);
      hourScrollRef.current?.scrollTo({ y, animated: false });
    } else if (index >= bottomThreshold) {
      const newIndex = index - HOUR_CYCLE_LENGTH;
      const newValue = hours[newIndex];
      setSelectedHourIndex(newIndex);
      setSelectedHour(newValue);
      const y = newIndex * ITEM_HEIGHT;
      setHourScrollOffset(y);
      hourScrollRef.current?.scrollTo({ y, animated: false });
    }
  };

  const recenterMinuteIfNeeded = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const topThreshold = 6;
    const bottomThreshold = minutes.length - 7;

    if (index <= topThreshold) {
      const newIndex = index + MINUTE_CYCLE_LENGTH;
      const newValue = minutes[newIndex];
      setSelectedMinuteIndex(newIndex);
      setSelectedMinute(newValue);
      const y = newIndex * ITEM_HEIGHT;
      setMinuteScrollOffset(y);
      minuteScrollRef.current?.scrollTo({ y, animated: false });
    } else if (index >= bottomThreshold) {
      const newIndex = index - MINUTE_CYCLE_LENGTH;
      const newValue = minutes[newIndex];
      setSelectedMinuteIndex(newIndex);
      setSelectedMinute(newValue);
      const y = newIndex * ITEM_HEIGHT;
      setMinuteScrollOffset(y);
      minuteScrollRef.current?.scrollTo({ y, animated: false });
    }
  };

  const recenterPeriodIfNeeded = (
    offsetY: number,
    currentPeriod: 'am' | 'pm'
  ) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const topThreshold = 6;
    const bottomThreshold = periods.length - 7;

    if (currentPeriod === 'am' && index <= topThreshold) {
      const newIndex = MID_AM_INDEX;
      setSelectedPeriodIndex(newIndex);
      setPeriodScrollOffset(newIndex * ITEM_HEIGHT);
      periodScrollRef.current?.scrollTo({
        y: newIndex * ITEM_HEIGHT,
        animated: false,
      });
    }

    if (currentPeriod === 'pm' && index >= bottomThreshold) {
      const newIndex = MID_PM_INDEX;
      setSelectedPeriodIndex(newIndex);
      setPeriodScrollOffset(newIndex * ITEM_HEIGHT);
      periodScrollRef.current?.scrollTo({
        y: newIndex * ITEM_HEIGHT,
        animated: false,
      });
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

    if (onTimeChange) {
      onTimeChange({
        date:
          mode === 'datetime'
            ? formatDate(dates[selectedDateIndex], selectedDateIndex === 7)
            : undefined,
        hour: value,
        minute: selectedMinute,
        period: mode !== 'timer' ? selectedPeriod : undefined,
      });
    }
  };

  const handleMinuteScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, minutes.length - 1));
    const value = minutes[clampedIndex];

    setSelectedMinute(value);
    setSelectedMinuteIndex(clampedIndex);
    recenterMinuteIfNeeded(offsetY);

    if (onTimeChange) {
      onTimeChange({
        date:
          mode === 'datetime'
            ? formatDate(dates[selectedDateIndex], selectedDateIndex === 7)
            : undefined,
        hour: selectedHour,
        minute: value,
        period: mode !== 'timer' ? selectedPeriod : undefined,
      });
    }
  };

  const handlePeriodScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, periods.length - 1));
    const newPeriod = periods[clampedIndex] as 'am' | 'pm';

    setSelectedPeriod(newPeriod);
    setSelectedPeriodIndex(clampedIndex);
    recenterPeriodIfNeeded(offsetY, newPeriod);

    if (onTimeChange) {
      onTimeChange({
        date:
          mode === 'datetime'
            ? formatDate(dates[selectedDateIndex], selectedDateIndex === 7)
            : undefined,
        hour: selectedHour,
        minute: selectedMinute,
        period: newPeriod,
      });
    }
  };

  const handleDateScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, dates.length - 1));

    setSelectedDateIndex(clampedIndex);

    if (onTimeChange) {
      onTimeChange({
        date: formatDate(dates[clampedIndex], clampedIndex === 7),
        hour: selectedHour,
        minute: selectedMinute,
        period: selectedPeriod,
      });
    }
  };

  const renderColumn = (
    items: (number | string | Date)[],
    selectedValue: number | string | Date,
    scrollRef: React.RefObject<ScrollView | null>,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    formatValue?: (value: number | string | Date) => string,
    scrollOffset: number = 0,
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    selectedIndex?: number,
    columnPosition: 'left' | 'center' | 'right' = 'center',
    isMinuteColumn: boolean = false
  ) => {
    const defaultSelectedIndex = items.findIndex(i => i === selectedValue);
    const actualSelectedIndex =
      selectedIndex !== undefined ? selectedIndex : defaultSelectedIndex;
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

            let translateX =
              columnPosition === 'left'
                ? shiftMagnitude
                : columnPosition === 'right'
                  ? -shiftMagnitude
                  : 0;

            if (mode === 'datetime') {
              if (columnPosition === 'left') {
                const horizontalCompression = distance * 4;
                translateX += horizontalCompression;

                const formattedValue = formatValue
                  ? formatValue(item)
                  : String(item);
                if (formattedValue === 'Today') {
                  translateX += 15;
                }
              } else if (isMinuteColumn) {
                const horizontalCompression = distance * 3;
                translateX -= horizontalCompression;
              }
            }

            const compressionFactor =
              distance > 0 ? Math.pow(distance, 2.2) * 2.2 : 0;
            const translateY =
              -compressionFactor * Math.sign(index - centerPosition);

            const maxVisibleTilt = 70;
            const opacity =
              Math.abs(tilt) > maxVisibleTilt
                ? 0
                : 1 - Math.max(0, (Math.abs(tilt) - 50) / 20);

            const isSelected = index === actualSelectedIndex;

            return (
              <View key={index} style={styles.itemContainer}>
                <Text
                  style={[
                    styles.itemText,
                    isDarkMode && styles.itemTextDark,
                    isSelected && styles.itemTextSelected,
                    isSelected && isDarkMode && styles.itemTextSelectedDark,
                    columnPosition === 'left' &&
                      mode === 'datetime' &&
                      styles.dateColumnText,
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
                  {formatValue ? formatValue(item) : String(item)}
                </Text>
              </View>
            );
          })}

          <View style={{ height: ITEM_HEIGHT * 4 }} />
        </ScrollView>
      </View>
    );
  };

  const formatMinute = (value: number | string | Date) => {
    const num = typeof value === 'number' ? value : parseInt(String(value), 10);
    return num.toString().padStart(2, '0');
  };

  const formatDateValue = (value: number | string | Date) => {
    if (value instanceof Date) {
      const index = dates.findIndex(d => d.getTime() === value.getTime());
      return formatDate(value, index === 7);
    }
    return String(value);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text
        style={{
          fontSize: 10,
          color: isDarkMode ? '#fff' : '#000',
          position: 'absolute',
          top: 6,
          right: 8,
          zIndex: 999,
        }}
      >
        DatesGen: {_datesGenCount} PeriodsGen: {_periodsGenCount}
      </Text>
      <View
        style={[
          styles.selectionOverlay,
          isDarkMode && styles.selectionOverlayDark,
        ]}
      />

      <View
        style={[styles.columnsContainer, mode === 'datetime' && { gap: 0 }]}
      >
        {mode === 'datetime' &&
          renderColumn(
            dates,
            dates[selectedDateIndex],
            dateScrollRef,
            handleDateScroll,
            formatDateValue,
            dateScrollOffset,
            e => setDateScrollOffset(e.nativeEvent.contentOffset.y),
            selectedDateIndex,
            'left'
          )}

        <View style={styles.columnWrapper}>
          {renderColumn(
            hours,
            selectedHour,
            hourScrollRef,
            handleHourScroll,
            undefined,
            hourScrollOffset,
            e => setHourScrollOffset(e.nativeEvent.contentOffset.y),
            selectedHourIndex,
            mode === 'datetime' ? 'center' : 'left'
          )}
          {mode === 'timer' && (
            <Text
              style={[
                styles.timerLabel,
                styles.hoursLabel,
                isDarkMode && styles.timerLabelDark,
              ]}
            >
              {selectedHour === 1 ? 'hour ' : 'hours'}
            </Text>
          )}
        </View>

        <View style={mode === 'datetime' ? { marginLeft: -12 } : undefined}>
          <View style={styles.columnWrapper}>
            {renderColumn(
              minutes,
              selectedMinute,
              minuteScrollRef,
              handleMinuteScroll,
              formatMinute,
              minuteScrollOffset,
              e => setMinuteScrollOffset(e.nativeEvent.contentOffset.y),
              selectedMinuteIndex,
              mode === 'timer' ? 'right' : 'center',
              mode === 'datetime'
            )}
            {mode === 'timer' && (
              <Text
                style={[
                  styles.timerLabel,
                  styles.minutesLabel,
                  isDarkMode && styles.timerLabelDark,
                ]}
              >
                minutes
              </Text>
            )}
          </View>
        </View>

        {mode === 'time' &&
          renderColumn(
            periods,
            selectedPeriod,
            periodScrollRef,
            handlePeriodScroll,
            undefined,
            periodScrollOffset,
            e => setPeriodScrollOffset(e.nativeEvent.contentOffset.y),
            selectedPeriodIndex,
            'right'
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
  selectionOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  selectionOverlayDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  columnsContainer: {
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  columnWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
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
  dateColumnText: {
    textAlign: 'right',
  },
  timerLabel: {
    fontSize: 22,
    color: '#000000',
    fontWeight: '400',
    marginLeft: -6,
    fontFamily: 'System',
  },
  timerLabelDark: {
    color: '#ffffff',
  },
  hoursLabel: {},
  minutesLabel: {},
});

export default WheelPicker;
