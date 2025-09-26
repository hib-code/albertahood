import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
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
import PhotoUpload from '../components/PhotoUpload';
import { Checkbox } from 'react-native-paper';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NewReportScreen() {
  
  // -------------------- STATES --------------------
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    email: '',
    phone: '',
    additionalInfo: '',
    beforePhoto: undefined,
    afterPhoto: undefined,
    questions: {
      improvements: '',
      satisfaction: '',
      recommendations: '',
      additionalFeedback: '',
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);

  const [hoodType, setHoodType] = useState({
    filter: false,
    extractor: false,
    waterWash: false,
  });
  const [damperOperates, setDamperOperates] = useState(false);
  const [filterConfirming, setFilterConfirming] = useState(false);

  const [preCheck, setPreCheck] = useState({
    exhaustFanOperational: false,
    exhaustFanNoisy: false,
    bareWires: false,
    hingeKit: false,
    fanCleanOut: false,
    hoodLights: false,
    greaseRoof: false,
  });

  const [servicePerformed, setServicePerformed] = useState({
    hoodCleaned: false,
    verticalDuct: false,
    horizontalDuct: false,
  });

  const [notCleaned, setNotCleaned] = useState({
    duct: false,
    fan: false,
    other: false,
  });

  const [postCheck, setPostCheck] = useState({
    leaks: false,
    fanRestarted: false,
    pilotLights: false,
    ceilingTiles: false,
    floorsMopped: false,
    waterDisposed: false,
    photosTaken: false,
    buildingSecured: false,
  });

  const [ductReasons, setDuctReasons] = useState({
    insufficientAccess: false,
    severeWeather: false,
    insufficientTime: false,
    other: false,
  });

  const [fanReasons, setFanReasons] = useState({
    insufficientAccess: false,
    severeWeather: false,
    insufficientTime: false,
    mechanicalIssue: false,
    notAccessible: false,
    other: false,
  });

  // -------------------- FUNCTIONS --------------------
  const updateClientData = (field: keyof ClientData, value: any) => {
    setClientData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!clientData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter client name');
      return false;
    }
    if (!clientData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter client email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleExportPDF = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    try {
      const pdfUri = await generatePDF(clientData);
      setGeneratedPdfUri(pdfUri);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PDF Report',
        });
      }

      Alert.alert('Success', 'PDF report generated and exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

const handleSaveToAsyncStorage = async () => {
  try {
    // Récupérer les rapports existants
    const existingReportsJson = await AsyncStorage.getItem('reports');
    const existingReports = existingReportsJson ? JSON.parse(existingReportsJson) : [];

    // Ajouter le nouveau rapport
    const newReport = {
      clientData,
      hoodType,
      damperOperates,
      filterConfirming,
      preCheck,
      servicePerformed,
      notCleaned,
      ductReasons,
      fanReasons,
      postCheck,
      createdAt: new Date().toISOString(),
    };

    const updatedReports = [...existingReports, newReport];

    // Enregistrer dans AsyncStorage
    await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));

    Alert.alert('Succès', 'Données enregistrées localement !');

    // Réinitialiser le formulaire
    resetForm();

  } catch (error) {
    console.error('Erreur AsyncStorage:', error);
    Alert.alert('Erreur', 'Impossible d’enregistrer les données. Réessayez.');
  }
};

// Fonction pour réinitialiser le formulaire
const resetForm = () => {
  setClientData({
    name: '',
    email: '',
    phone: '',
    additionalInfo: '',
    beforePhoto: undefined,
    afterPhoto: undefined,
    questions: {
      improvements: '',
      satisfaction: '',
      recommendations: '',
      additionalFeedback: '',
    },
  });
  setHoodType({ filter: false, extractor: false, waterWash: false });
  setDamperOperates(false);
  setFilterConfirming(false);
  setPreCheck({
    exhaustFanOperational: false,
    exhaustFanNoisy: false,
    bareWires: false,
    hingeKit: false,
    fanCleanOut: false,
    hoodLights: false,
    greaseRoof: false,
  });
  setServicePerformed({ hoodCleaned: false, verticalDuct: false, horizontalDuct: false });
  setNotCleaned({ duct: false, fan: false, other: false });
  setDuctReasons({ insufficientAccess: false, severeWeather: false, insufficientTime: false, other: false });
  setFanReasons({ insufficientAccess: false, severeWeather: false, insufficientTime: false, mechanicalIssue: false, notAccessible: false, other: false });
  setPostCheck({ leaks: false, fanRestarted: false, pilotLights: false, ceilingTiles: false, floorsMopped: false, waterDisposed: false, photosTaken: false, buildingSecured: false });
};

  // -------------------- RENDER --------------------
  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.title}>New Report</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main scroll */}
      <ScrollView
        style={commonStyles.scrollView}
        contentContainerStyle={[commonStyles.scrollContent, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <FormInput
            label="Client Name"
            value={clientData.name}
            onChangeText={(text) => updateClientData('name', text)}
            placeholder="Enter client name"
            required
          />
          <FormInput
            label="Email Address"
            value={clientData.email}
            onChangeText={(text) => updateClientData('email', text)}
            placeholder="Enter email address"
            keyboardType="email-address"
            required
          />
          <FormInput
            label="Phone Number"
            value={clientData.phone}
            onChangeText={(text) => updateClientData('phone', text)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          <FormInput
            label="Additional Information"
            value={clientData.additionalInfo}
            onChangeText={(text) => updateClientData('additionalInfo', text)}
            placeholder="Any additional notes or information"
            multiline
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <PhotoUpload
            title="Before Photo"
            photoUri={clientData.beforePhoto}
            onPhotoSelected={(uri) => updateClientData('beforePhoto', uri)}
            type="before"
          />
          <PhotoUpload
            title="After Photo"
            photoUri={clientData.afterPhoto}
            onPhotoSelected={(uri) => updateClientData('afterPhoto', uri)}
            type="after"
          />
        </View>
        {/* General Info */}
       

        {/* Kitchen Exhaust Cleaning Report */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kitchen Exhaust Cleaning Report</Text>
          <Checkbox.Item
            label="Filter Hood"
            status={hoodType.filter ? 'checked' : 'unchecked'}
            onPress={() => setHoodType({ ...hoodType, filter: !hoodType.filter })}
          />
          <Checkbox.Item
            label="Extractor"
            status={hoodType.extractor ? 'checked' : 'unchecked'}
            onPress={() => setHoodType({ ...hoodType, extractor: !hoodType.extractor })}
          />
          <Checkbox.Item
            label="Water Wash Hood"
            status={hoodType.waterWash ? 'checked' : 'unchecked'}
            onPress={() => setHoodType({ ...hoodType, waterWash: !hoodType.waterWash })}
          />
          <Checkbox.Item
            label="Damper operates properly"
            status={damperOperates ? 'checked' : 'unchecked'}
            onPress={() => setDamperOperates(!damperOperates)}
          />
          <Checkbox.Item
            label="Filter Confirming in place"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
           <Checkbox.Item
            label="Up blast"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
            <Checkbox.Item
            label="In-Line"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
            <Checkbox.Item
            label="Utility"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
            <Checkbox.Item
            label="direct Drive"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          /> 
            <Checkbox.Item
            label="wal"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          /> 
            <Checkbox.Item
            label="roof"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
            <Checkbox.Item
            label="fan belt it"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
            <Checkbox.Item
            label="fan type able or interior is accessible"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
            <Checkbox.Item
            label="Roof Access"
            status={filterConfirming ? 'checked' : 'unchecked'}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
        </View>

        {/* Pre Cleaning Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pre-Cleaning Check</Text>
          {Object.keys(preCheck).map((key) => (
            <Checkbox.Item
              key={key}
              label={key}
              status={preCheck[key as keyof typeof preCheck] ? 'checked' : 'unchecked'}
              onPress={() => setPreCheck({ ...preCheck, [key as keyof typeof preCheck]: !preCheck[key as keyof typeof preCheck] })}
            />
          ))}
        </View>

        {/* Service Performed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Performed</Text>
          {Object.keys(servicePerformed).map((key) => (
            <Checkbox.Item
              key={key}
              label={key}
              status={servicePerformed[key as keyof typeof servicePerformed] ? 'checked' : 'unchecked'}
              onPress={() => setServicePerformed({ ...servicePerformed, [key as keyof typeof servicePerformed]: !servicePerformed[key as keyof typeof servicePerformed] })}
            />
          ))}
        </View>

        {/* Areas Not Cleaned */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas Not Cleaned</Text>

          {Object.keys(notCleaned).map((key) => (
            <View key={key}>
              <Checkbox.Item
                label={key}
                status={notCleaned[key as keyof typeof notCleaned] ? "checked" : "unchecked"}
                onPress={() =>
                  setNotCleaned({
                    ...notCleaned,
                    [key as keyof typeof notCleaned]: !notCleaned[key as keyof typeof notCleaned],
                  })
                }
              />

              {/* Sous-options pour Duct */}
              {key === "duct" && notCleaned.duct && (
                <View style={{ marginLeft: 32 }}>
                  <Checkbox.Item
                    label="Insufficient Access"
                    status={ductReasons.insufficientAccess ? "checked" : "unchecked"}
                    onPress={() =>
                      setDuctReasons({
                        ...ductReasons,
                        insufficientAccess: !ductReasons.insufficientAccess,
                      })
                    }
                  />
                  <Checkbox.Item
                    label="Severe Weather"
                    status={ductReasons.severeWeather ? "checked" : "unchecked"}
                    onPress={() =>
                      setDuctReasons({
                        ...ductReasons,
                        severeWeather: !ductReasons.severeWeather,
                      })
                    }
                  />
                  <Checkbox.Item
                    label="Other"
                    status={ductReasons.other ? "checked" : "unchecked"}
                    onPress={() =>
                      setDuctReasons({
                        ...ductReasons,
                        other: !ductReasons.other,
                      })
                    }
                  />
                </View>
              )}

              {/* Sous-options pour Fan */}
              {key === "fan" && notCleaned.fan && (
                <View style={{ marginLeft: 32 }}>
                  <Checkbox.Item
                    label="Not Accessible"
                    status={fanReasons.notAccessible ? "checked" : "unchecked"}
                    onPress={() =>
                      setFanReasons({
                        ...fanReasons,
                        notAccessible: !fanReasons.notAccessible,
                      })
                    }
                  />
                  <Checkbox.Item
                    label="Mechanical Issue"
                    status={fanReasons.mechanicalIssue ? "checked" : "unchecked"}
                    onPress={() =>
                      setFanReasons({
                        ...fanReasons,
                        mechanicalIssue: !fanReasons.mechanicalIssue,
                      })
                    }
                  />
                  <Checkbox.Item
                    label="Other"
                    status={fanReasons.other ? "checked" : "unchecked"}
                    onPress={() =>
                      setFanReasons({
                        ...fanReasons,
                        other: !fanReasons.other,
                      })
                    }
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Post Cleaning Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post Cleaning Check</Text>
          {Object.keys(postCheck).map((key) => (
            <Checkbox.Item
              key={key}
              label={key}
              status={postCheck[key as keyof typeof postCheck] ? 'checked' : 'unchecked'}
              onPress={() => setPostCheck({ ...postCheck, [key as keyof typeof postCheck]: !postCheck[key as keyof typeof postCheck] })}
            />
          ))}
        </View>


        {/* Export PDF */}
     <View style={styles.actionSection}>
          <Button
              text="Enregistrer localement"
              onPress={handleSaveToAsyncStorage}
              style={[styles.exportButton]}
              textStyle={styles.exportButtonText}
            />

          <Button
            text={isGenerating ? 'Generating PDF...' : 'Export PDF Report'}
            onPress={handleExportPDF}
            style={isGenerating ? [styles.exportButton, styles.disabledButton] : styles.exportButton}
            textStyle={styles.exportButtonText}
            disabled={isGenerating}
          />
          {generatedPdfUri && (
            <View style={styles.successSection}>
              <Text style={styles.successText}>✓ PDF Report Generated Successfully</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  backButton: { padding: 8 },
  placeholder: { width: 40 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  actionSection: { marginTop: 20, marginBottom: 40 },
  exportButton: { backgroundColor: colors.primary, paddingVertical: 16, marginBottom: 20 },
  exportButtonText: { fontSize: 18, fontWeight: '600' },
  disabledButton: { backgroundColor: colors.textSecondary },
  successSection: { alignItems: 'center' },
  successText: { fontSize: 16, fontWeight: '600', color: colors.success, textAlign: 'center' },
});
