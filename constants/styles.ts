import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  surface: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
});
