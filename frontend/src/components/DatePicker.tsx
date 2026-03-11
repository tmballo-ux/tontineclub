import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  label?: string;
  error?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minimumDate = new Date(),
  label,
  error,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const generateDays = () => {
    const daysInMonth = getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth());
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isDateValid = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    return date >= minimumDate;
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShowModal(false);
  };

  const setDay = (day: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(day);
    if (newDate >= minimumDate) {
      setTempDate(newDate);
    }
  };

  const setMonth = (monthIndex: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(monthIndex);
    // Adjust day if needed
    const daysInNewMonth = getDaysInMonth(newDate.getFullYear(), monthIndex);
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    if (newDate >= minimumDate) {
      setTempDate(newDate);
    }
  };

  const setYear = (year: number) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(year);
    if (newDate >= minimumDate) {
      setTempDate(newDate);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dateButton, error && styles.dateButtonError]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.dateText}>{formatDate(value)}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une date</Text>

            {/* Year Selector */}
            <Text style={styles.selectorLabel}>Année</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
              <View style={styles.optionsRow}>
                {generateYears().map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.option,
                      tempDate.getFullYear() === year && styles.optionActive,
                    ]}
                    onPress={() => setYear(year)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        tempDate.getFullYear() === year && styles.optionTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Month Selector */}
            <Text style={styles.selectorLabel}>Mois</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
              <View style={styles.optionsRow}>
                {MONTHS.map((month, index) => {
                  const isValid = isDateValid(1, index, tempDate.getFullYear());
                  return (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.option,
                        tempDate.getMonth() === index && styles.optionActive,
                        !isValid && styles.optionDisabled,
                      ]}
                      onPress={() => isValid && setMonth(index)}
                      disabled={!isValid}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempDate.getMonth() === index && styles.optionTextActive,
                          !isValid && styles.optionTextDisabled,
                        ]}
                      >
                        {month.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Day Selector */}
            <Text style={styles.selectorLabel}>Jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
              <View style={styles.optionsRow}>
                {generateDays().map((day) => {
                  const isValid = isDateValid(day, tempDate.getMonth(), tempDate.getFullYear());
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayOption,
                        tempDate.getDate() === day && styles.optionActive,
                        !isValid && styles.optionDisabled,
                      ]}
                      onPress={() => isValid && setDay(day)}
                      disabled={!isValid}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempDate.getDate() === day && styles.optionTextActive,
                          !isValid && styles.optionTextDisabled,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Selected Date Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Date sélectionnée:</Text>
              <Text style={styles.previewDate}>{formatDate(tempDate)}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateButtonError: {
    borderColor: colors.error,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  scrollRow: {
    maxHeight: 50,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceVariant,
    minWidth: 60,
    alignItems: 'center',
  },
  dayOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceVariant,
    minWidth: 44,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextActive: {
    color: colors.white,
  },
  optionTextDisabled: {
    color: colors.textLight,
  },
  previewContainer: {
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
