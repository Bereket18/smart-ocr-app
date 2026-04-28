import { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, TouchableWithoutFeedback,
} from 'react-native'
import { Theme } from '@/constants/colors'
import { FontSize, Spacing, Radius } from '@/constants/typography'

interface ExportOption {
  icon: string
  label: string
  description: string
  onPress: () => void
}

interface Props {
  visible: boolean
  onClose: () => void
  options: ExportOption[]
}

export function BottomSheet({ visible, onClose, options }: Props) {
  const slideAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.handle} />

              <Text style={styles.title}>Export Scan</Text>

              {options.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={styles.option}
                  onPress={() => {
                    onClose()
                    setTimeout(option.onPress, 300)
                  }}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl3,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: 'bold',
    color: Theme.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Theme.textPrimary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
  },
  optionArrow: {
    fontSize: 18,
    color: Theme.textSecondary,
    marginLeft: Spacing.md,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.body,
    color: Theme.error,
    fontWeight: '600',
  },
})