// packages/mobile/src/components/ReportSheet.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';

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
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Report An Issue</Text>
      <Text style={styles.subtitle}>
        Something not right? Select an issue below so we can look into it
      </Text>

      {/* First Row */}
      <View style={styles.row}>
        {REPORT_OPTIONS.slice(0, 3).map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.chip,
              selectedIssue === option.id && styles.chipSelected,
            ]}
            onPress={() => setSelectedIssue(option.id)}
          >
            <Text
              style={[
                styles.chipText,
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
            selectedIssue === 'other' && styles.chipSelected,
          ]}
          onPress={() => setSelectedIssue('other')}
        >
          <Text
            style={[
              styles.chipText,
              selectedIssue === 'other' && styles.chipTextSelected,
            ]}
          >
            Something else
          </Text>
        </TouchableOpacity>
      </View>

      {/* Details */}
      <TextInput
        style={styles.detailsInput}
        placeholder="Add more details"
        placeholderTextColor="#8E8E93"
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
