import { AppText } from '@/components/app-text';
import { Colors } from '@/constants/colors';
import { DEMO_MODE, setDemoMode } from '@/services/api';
import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

export function SettingsDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(DEMO_MODE);

  const toggleSwitch = () => {
    const newValue = !isDemoMode;
    setIsDemoMode(newValue);
    setDemoMode(newValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <AppText type="defaultSemiBold">Demo Mode</AppText>
        <AppText type="default" style={styles.description}>
          Use low-cost mock data ($0.01) for testing payments.
        </AppText>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={isDemoMode ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isDemoMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  description: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
});
