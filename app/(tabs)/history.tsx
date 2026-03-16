import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { Theme } from '@/constants/colors'
import { FontSize, Spacing, Radius } from '@/constants/typography'
import { useScanStore } from '@/store/scanStore'
import { Scan } from '@/types'

export default function HistoryScreen() {
  const { scans, deleteScan, setActiveScan } = useScanStore()

  function handlePress(scan: Scan) {
    setActiveScan(scan)
    router.push('/results')
  }

  function handleDelete(id: string) {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteScan(id),
        },
      ]
    )
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🕐</Text>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptySubtitle}>Your scan history will appear here</Text>
      </View>
    )
  }

  function renderItem({ item }: { item: Scan }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item)}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardText} numberOfLines={2}>
            {item.editedText || 'No text extracted'}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>{item.createdAt.slice(0, 10)}</Text>
            <Text style={styles.cardBadge}>{item.language.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl4,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.h1,
    fontWeight: 'bold',
    color: Theme.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardDate: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
  },
  cardBadge: {
    fontSize: FontSize.badge,
    fontWeight: 'bold',
    color: Theme.accent,
    backgroundColor: Theme.background,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.badge,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteText: {
    fontSize: 18,
  },
})