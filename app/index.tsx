
import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';

export default function MainScreen() {
  const handleStartNewReport = () => {
    console.log('Starting new report');
    router.push('/new-report');
  };

  const handleSearchClient = () => {
    console.log('Searching for client');
    router.push('/search-client');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Icon name="document-text" size={80} color={colors.primary} />
          </View>
          
          <Text style={commonStyles.title}>ALBERTA HOOD CLEANING</Text>
          <Text style={commonStyles.textSecondary}>
            PRESSURE WASHING AND SO MUCH MORE
          </Text>
        </View>

        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleStartNewReport}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Icon name="add-circle" size={32} color={colors.background} />
              <Text style={styles.primaryButtonText}>Start New Report</Text>
              <Text style={styles.buttonSubtext}>Create a report from scratch</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleSearchClient}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Icon name="search" size={32} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Search Client</Text>
              <Text style={styles.buttonSubtext}>Find existing client data</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 80,
  },
  iconContainer: {
    backgroundColor: colors.backgroundAlt,
    padding: 30,
    borderRadius: 50,
    marginBottom: 30,
    boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.15)',
    elevation: 4,
  },
  buttonsSection: {
    width: '100%',
    maxWidth: 350,
    gap: 20,
  },
  actionButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonContent: {
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
});
