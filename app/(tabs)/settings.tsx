import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { Theme } from '@/constants/colors'
import { FontSize, Spacing, Radius } from '@/constants/typography'
import { useScanStore } from '@/store/scanStore'

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

function SettingsRow({ label, value, onPress, danger }: {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { clearAllScans, scans } = useScanStore()

  function handleClearHistory() {
    Alert.alert(
      'Clear All History',
      `This will permanently delete all ${scans.length} scans. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllScans(),
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <SectionHeader title="APPEARANCE" />
      <SettingsRow label="Dark Mode" value="On" />

      <SectionHeader title="OCR LANGUAGE" />
      <SettingsRow label="Language" value="Auto Detect" />

      <SectionHeader title="EXPORT" />
      <SettingsRow label="Default Format" value="TXT" />

      <SectionHeader title="ACCOUNT" />
      <SettingsRow label="Sign in with Google" value="›" />

      <SectionHeader title="DANGER ZONE" />
      <SettingsRow
        label="Clear All History"
        onPress={handleClearHistory}
        danger
      />

      <Text style={styles.version}>v1.0.0 · Smart OCR</Text>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    fontSize: FontSize.badge,
    fontWeight: 'bold',
    color: Theme.accent,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  row: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  rowLabel: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
  },
  rowLabelDanger: {
    color: Theme.error,
  },
  rowValue: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
  },
  version: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl3,
  },
})