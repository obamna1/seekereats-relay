import { UiIconSymbol } from '@/components/ui/ui-icon-symbol';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

export function HomeButton() {
  const router = useRouter();

  return (
    <TouchableOpacity 
      onPress={() => router.dismissAll()} 
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <UiIconSymbol name="house.fill" size={24} color={Colors.light.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
  },
});
