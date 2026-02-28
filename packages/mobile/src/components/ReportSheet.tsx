// packages/mobile/src/components/ReportSheet.tsx

// In-line sheet for submitting a shuttle issue report with a predefined set of issue types.
// Requires an issue selection before the submit button is enabled.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const REPORT_OPTIONS = [
  { id: 'delayed', label: 'Shuttle Delayed' },
  { id: 'missed', label: 'Missed Pickup' },
  { id: 'full', label: 'Shuttle Full' },
  { id: 'other', label: 'Something else' },
];

interface ReportSheetProps {
  onBack: () => void;
  onSubmit: (issue: string, details: string) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function ReportSheet({ onBack, onSubmit }: ReportSheetProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [selectedIssue, setSelectedIssue] = useState<string | undefined>();
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (selectedIssue) {
      const selectedOption = REPORT_OPTIONS.find(
        opt => opt.id === selectedIssue
      );
      onSubmit(selectedOption?.label || '', details);
    }
  };

  const isSubmitDisabled = !selectedIssue;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={[styles.backIcon, { color: c.text.primary }]}>‹</Text>
        <Text style={[styles.backText, { color: c.text.primary }]}>Back</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={[styles.title, { color: c.text.primary }]}>
        Report An Issue
      </Text>
      <Text style={[styles.subtitle, { color: c.text.secondary }]}>
        Something not right? Select an issue below so we can look into it
      </Text>

      {/* First Row */}
      <View style={styles.row}>
        {REPORT_OPTIONS.slice(0, 3).map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.chip,
              { borderColor: c.border },
              selectedIssue === option.id && styles.chipSelected,
            ]}
            onPress={() => setSelectedIssue(option.id)}
          >
            <Text
              style={[
                styles.chipText,
                { color: c.text.primary },
                selectedIssue === option.id && styles.chipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Second Row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.chip,
            { borderColor: c.border },
            selectedIssue === 'other' && styles.chipSelected,
          ]}
          onPress={() => setSelectedIssue('other')}
        >
          <Text
            style={[
              styles.chipText,
              { color: c.text.primary },
              selectedIssue === 'other' && styles.chipTextSelected,
            ]}
          >
            Something else
          </Text>
        </TouchableOpacity>
      </View>

      {/* Details */}
      <TextInput
        style={[
          styles.detailsInput,
          { borderColor: c.border, color: c.text.primary },
        ]}
        placeholder="Add more details"
        placeholderTextColor={c.text.secondary}
        value={details}
        onChangeText={setDetails}
        multiline
        textAlignVertical="top"
      />

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitDisabled && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
      >
        <Text
          style={[
            styles.submitButtonText,
            isSubmitDisabled && styles.submitButtonTextDisabled,
          ]}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const BLUE = '#0761E0';

const styles = StyleSheet.create({
  container: {
    minHeight: SCREEN_HEIGHT / 3,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  backText: {
    fontSize: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 2,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 15,
    paddingRight: 15,
    marginRight: 10, // spacing between buttons
  },

  chipSelected: {
    borderColor: BLUE,
  },

  chipText: {
    fontSize: 13,
    color: '#000',
  },

  chipTextSelected: {
    color: BLUE,
  },

  detailsInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 50,
    marginBottom: 12,
  },

  submitButton: {
    backgroundColor: BLUE,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  submitButtonTextDisabled: {
    color: '#9E9E9E',
  },
});
