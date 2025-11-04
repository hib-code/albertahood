import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
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
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';

export default function SearchClientScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allReports, setAllReports] = useState<ReportPayload[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportPayload[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportPayload | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewClient, setViewClient] = useState<ClientData | null>(null);
  const [viewReport, setViewReport] = useState<ReportPayload | null>(null);
  const { refresh } = useLocalSearchParams();

  const loadReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, created_at, data')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const reports: ReportPayload[] = (data || []).map((row: any) => {
        const d = row.data as ReportPayload;
        (d as any)._supabaseId = row.id;
        (d as any)._createdAt = row.created_at;
        return d;
      });
      setAllReports(reports);
      setFilteredReports(reports);
    } catch (err) {
      console.error('Error loading from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );
  useEffect(() => {
    if (refresh === '1') loadReports();
  }, [refresh, loadReports]);
  

  // Recherche
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

  // Sélection client pour modal
  const handleClientSelect = (report: ReportPayload) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  // Export PDF
  const exportClientPDF = async (client: ClientData) => {
    setIsGenerating(true);
    try {
      const report = allReports.find(
        r => r.clientData.email === client.email && r.clientData.name === client.name
      ) || { clientData: client };
      const pdfUri = await generatePDF(report as ReportPayload);

      if (await Sharing.isAvailableAsync()) {
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

  // Éditer un client
  const handleEditClient = (report: ReportPayload) => {
    const original = allReports.find(
      r => r.clientData.email === report.clientData.email && r.clientData.name === report.clientData.name
    );
    const supabaseId = original ? (original as any)._supabaseId : '';
    router.push({
      pathname: '/new-report',
      params: { report: JSON.stringify(report), supabaseId },
    });
    
  };

  // Supprimer un client
  const handleDeleteClient = (report: ReportPayload) => {
    Alert.alert('Delete', 'Confirm deletion of this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const supabaseId = (report as any)._supabaseId as string | undefined;
            if (supabaseId) {
              const { error: delErr } = await supabase.from('reports').delete().eq('id', supabaseId);
              if (delErr) throw new Error(delErr.message);
            }

            // Suppression des photos (optionnelle)
            const photos: Record<string, string[] | string> = (report as any).photos || {};
            const urls: string[] = [];

            // Helper pour ajouter une photo ou un tableau de photos
            const addPhoto = (photo?: string | string[]) => {
              if (!photo) return;
              if (Array.isArray(photo)) {
                urls.push(...photo);
              } else {
                urls.push(photo);
              }
            };
            addPhoto(photos.beforePhotos);
            addPhoto(photos.afterPhotos);
            addPhoto(photos.exhaustFanPhotos);
            addPhoto(photos.ductFanPhotos);
            addPhoto(photos.canopyPhotos);
            addPhoto(photos.beforePhoto);
            addPhoto(photos.afterPhoto);
            addPhoto(photos.signature);
            const prefix = '/storage/v1/object/public/reports/';
            const paths = urls.filter(u => typeof u === 'string' && u.includes(prefix)).map(u => u.split(prefix)[1]).filter(Boolean);
            if (paths.length) await supabase.storage.from('reports').remove(paths as string[]);

            const next = allReports.filter(
              r => !(r.clientData.email === report.clientData.email && r.clientData.name === report.clientData.name)
            );
            setAllReports(next);
            setFilteredReports(next);
          } catch (e: any) {
            Alert.alert('Error', `Database delete failed: ${e?.message || e}`);
          }
        },
      },
    ]);
  };

  const handleViewClient = (report: ReportPayload) => {
    setViewClient(report.clientData);
    setViewReport(report);
    setViewModalVisible(true);
  };

  // Render client
  const renderClientItem = ({ item }: { item: ReportPayload }) => (
    <View style={styles.clientItem}>
      <View style={styles.clientInfo}>
        <View style={styles.clientHeader}>
          <Text style={styles.clientName}>{item.clientData.name}</Text>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        <Text style={styles.clientEmail}>{item.clientData.email}</Text>
        <Text style={styles.clientPhone}>{item.clientData.phone}</Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ marginRight: 12 }} onPress={() => handleViewClient(item)}>
          <Text style={{ color: colors.primary }}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 12 }} onPress={() => handleEditClient(item)}>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 12 }} onPress={() => exportClientPDF(item.clientData)}>
          <Text style={{ color: 'orange', fontWeight: 'bold' }}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteClient(item)}>
          <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.title}>Search Client</Text>
        <TouchableOpacity onPress={loadReports}>
          <Icon name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
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
          <>
            <Text style={styles.resultsTitle}>
              {filteredReports.length} client{filteredReports.length !== 1 ? 's' : ''} found
            </Text>
            <FlatList
              data={filteredReports}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.clientData.email}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {/* Modals et overlay de génération restent identiques */}
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
