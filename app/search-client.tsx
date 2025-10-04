import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, commonStyles } from '../styles/commonStyles';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { ClientData } from '../types/ClientData';
import { generatePDF, ReportPayload } from '../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SearchClientScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allReports, setAllReports] = useState<ReportPayload[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportPayload[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Charger les rapports depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadClients = async () => {
      try {
        const storedClientsJson = await AsyncStorage.getItem('reports');
        const storedReports: ReportPayload[] = storedClientsJson ? JSON.parse(storedClientsJson) : [];
        setAllReports(storedReports);
        setFilteredReports(storedReports); // afficher tous les rapports par défaut
      } catch (error) {
        console.error('Erreur en chargeant les clients locaux:', error);
      }
    };
    loadClients();
  }, []);

  // Recherche de clients
  const applySearch = (query: string) => {
    setIsSearching(true);

    setTimeout(() => {
      const q = query.trim().toLowerCase();
      const results = q
        ? allReports.filter(r => {
            const c = r.clientData;
            return (
              (c.name || '').toLowerCase().includes(q) ||
              (c.email || '').toLowerCase().includes(q) ||
              (c.phone || '').toLowerCase().includes(q)
            );
          })
        : allReports;

      setFilteredReports(results);
      setIsSearching(false);
    }, 300);
  };

  const handleSearch = () => applySearch(searchQuery);

  // Sélection d'un client → ouvrir modal
  const handleClientSelect = (client: ClientData) => {
    setSelectedClient(client);
    setModalVisible(true);
  };

  // Export PDF
  const exportClientPDF = async (client: ClientData) => {
    setIsGenerating(true);
    try {
      // Trouver le rapport complet correspondant pour inclure photos et checklists
      const report = allReports.find(r => r.clientData.email === client.email && r.clientData.name === client.name) || { clientData: client };
      const pdfUri = await generatePDF(report as ReportPayload);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export PDF Report - ${client.name}`,
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
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
            onChangeText={(text) => { setSearchQuery(text); applySearch(text); }}
            placeholder="Enter name, email, or phone number"
          />
          <Button
            text={isSearching ? "Searching..." : "Search"}
            onPress={handleSearch}
            style={styles.searchButton}
            disabled={isSearching}
          />
        </View>

        {filteredReports.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {filteredReports.length} client{filteredReports.length !== 1 ? 's' : ''} found
            </Text>
            
            <FlatList
              data={filteredReports}
              renderItem={({ item }) => renderClientItem({ item: item.clientData })}
              keyExtractor={(item, index) => `${item.clientData.email}-${index}-${item.clientData.name}`}
              showsVerticalScrollIndicator={false}
              style={styles.clientsList}
            />
          </View>
        )}

        {/* Modal pour export PDF */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Export PDF Report</Text>
              {selectedClient && (
                <Text style={styles.modalText}>
                  Voulez-vous générer un PDF pour{" "}
                  <Text style={{ fontWeight: "bold" }}>{selectedClient.name}</Text> ?
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (selectedClient) {
                      exportClientPDF(selectedClient);
                    }
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Télécharger PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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

  // Styles Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.text,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
