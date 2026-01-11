import { Theme, useThemeStore } from '@app/shared/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Text from '../text/Text'

interface TimePickerProps {
  value: Date
  onChange: (time: Date) => void
  disabled?: boolean
}

const TimePicker = ({ disabled, value, onChange }: TimePickerProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const theme = useThemeStore()
  const styles = createStyles(theme)

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    setIsVisible(false)
    if (selectedTime) {
      onChange(selectedTime)
    }
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.timeButton, disabled && { backgroundColor: theme.colors.disabled, opacity: 0.5 }]}
        onPress={() => setIsVisible(true)}
        disabled={disabled}>
        <Text style={[styles.timeButtonText, disabled && { color: theme.colors.onDisabled }]}>
          {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      {isVisible && <DateTimePicker value={value} mode='time' display='spinner' onChange={handleTimeChange} />}
    </View>
  )
}

export default TimePicker

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    timeButton: {
      padding: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      marginBottom: 16,
    },
    timeButtonText: {
      color: theme.colors.onSecondary,
      fontSize: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    modalCloseButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    modalCloseButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
    },
  })
