import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, commonStyles } from '../styles/commonStyles';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { ClientData } from '../types/ClientData';
import { generatePDF } from '../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export default function SearchClientScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allClients, setAllClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charger les clients depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadClients = async () => {
      try {
        const storedClientsJson = await AsyncStorage.getItem('reports');
        const storedReports = storedClientsJson ? JSON.parse(storedClientsJson) : [];
        const clientsFromStorage: ClientData[] = storedReports.map((r: any) => r.clientData);
        setAllClients(clientsFromStorage);
        setFilteredClients(clientsFromStorage); // afficher tous les clients par défaut
      } catch (error) {
        console.error('Erreur en chargeant les clients locaux:', error);
      }
    };
    loadClients();
  }, []);

  // Recherche de clients
  const handleSearch = () => {
    setIsSearching(true);

    setTimeout(() => {
      const results = searchQuery.trim()
        ? allClients.filter(client =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.phone.includes(searchQuery)
          )
        : allClients; 

      setFilteredClients(results);
      setIsSearching(false);

      if (results.length === 0) {
        Alert.alert('No Results', 'No clients found matching your search criteria');
      }
    }, 300);
  };

  // Sélection d'un client
  const handleClientSelect = async (client: ClientData) => {
    Alert.alert(
      'Export PDF Report',
      `Generate PDF report for ${client.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export PDF', onPress: () => exportClientPDF(client) },
      ]
    );
  };

  // Export PDF
  const exportClientPDF = async (client: ClientData) => {
    setIsGenerating(true);
    try {
      const pdfUri = await generatePDF(client);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export PDF Report - ${client.name}`,
        });
      }

      Alert.alert('Success', `PDF report for ${client.name} generated and exported successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render client item
  const renderClientItem = ({ item }: { item: ClientData }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => handleClientSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.clientInfo}>
        <View style={styles.clientHeader}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        <Text style={styles.clientEmail}>{item.email}</Text>
        <Text style={styles.clientPhone}>{item.phone}</Text>
        {item.additionalInfo && (
          <Text style={styles.clientAdditional}>{item.additionalInfo}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.title}>Search Client</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <FormInput
            label="Search Clients"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Enter name, email, or phone number"
          />
          <Button
            text={isSearching ? "Searching..." : "Search"}
            onPress={handleSearch}
            style={styles.searchButton}
            disabled={isSearching}
          />
        </View>

        {filteredClients.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
            </Text>
            
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.email}
              showsVerticalScrollIndicator={false}
              style={styles.clientsList}
            />
          </View>
        )}

        {isGenerating && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Generating PDF...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 30,
  },
  searchButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  clientsList: {
    flex: 1,
  },
  clientItem: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  clientEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  clientAdditional: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});

