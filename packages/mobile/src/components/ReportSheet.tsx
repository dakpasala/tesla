// packages/mobile/src/components/ReportSheet.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import ReportPopupInputs, { ReportPopupOption } from './ReportPopUp';

const REPORT_OPTIONS: ReportPopupOption[] = [
  { id: 'delayed', label: 'Shuttle Delayed' },
  { id: 'missed', label: 'Missed Pickup' },
  { id: 'full', label: 'Shuttle Full' },
  { id: 'other', label: 'Something else' },
];

interface ReportSheetProps {
  onBack: () => void;
  onSubmit: (issue: string, details: string) => void;
}

export function ReportSheet({ onBack, onSubmit }: ReportSheetProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | undefined>(undefined);
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (selectedIssue) {
      const selectedOption = REPORT_OPTIONS.find(opt => opt.id === selectedIssue);
      onSubmit(selectedOption?.label || '', details);
    }
  };

  const isSubmitDisabled = !selectedIssue;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Report An Issue</Text>
      <Text style={styles.subtitle}>
        Something not right? Select an issue below so we can look into it
      </Text>

      {/* Report Options */}
      <ReportPopupInputs
        options={REPORT_OPTIONS}
        selectedId={selectedIssue}
        onSelect={(option) => setSelectedIssue(option.id)}
        layout="wrap"
        style={styles.reportOptions}
      />

      {/* Details Input */}
      <TextInput
        style={styles.detailsInput}
        placeholder="Add more details"
        placeholderTextColor="#999"
        value={details}
        onChangeText={setDetails}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
      >
        <Text style={[styles.submitButtonText, isSubmitDisabled && styles.submitButtonTextDisabled]}>
          Submit
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 24,
    marginRight: 4,
    color: '#000',
  },
  backText: {
    fontSize: 16,
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  reportOptions: {
    marginBottom: 20,
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FFF',
    minHeight: 100,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
});