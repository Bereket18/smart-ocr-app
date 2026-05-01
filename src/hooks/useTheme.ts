import { Colors, ThemeType } from '../constants/colors'
import { useScanStore } from '../store/scanStore'

export function useTheme(): ThemeType {
  const { themeMode } = useScanStore()
  return Colors[themeMode]
}