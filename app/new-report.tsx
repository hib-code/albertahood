import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
import MultiPhotoUpload from '../components/MultiPhotoUpload';
import { Checkbox, Menu, Button as PaperButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NewReportScreen() {
  
  // -------------------- STATES --------------------
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    technician: 'Anoir Boukhriss',
    certification: '#AB159.1',
    serviceDate: new Date().toLocaleDateString(),
    nextService: '',
    scheduledTime: '',
    arrivalTime: '',
    departureTime: '01:30',
    additionalInfo: '',
    beforePhoto: '',
    afterPhoto: '',
    fanBeltNumber: '',
    ladderOrLift: '27 FT',
    ownerRepresentative: 'Lee',
    signature: 'N/A',
    reportDate: '22 August 2025',
    questions: {
      improvements: '',
      satisfaction: '',
      recommendations: '',
      additionalFeedback: '',
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [exhaustFanPhotos, setExhaustFanPhotos] = useState<string[]>([]);
  const [ductFanPhotos, setDuctFanPhotos] = useState<string[]>([]);
  const [canopyPhotos, setCanopyPhotos] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [serviceSelected, setServiceSelected] = useState(false);

  // Fonction pour forcer la fermeture du menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  // Réinitialiser le menu si nécessaire
  React.useEffect(() => {
    if (menuVisible) {
      // Le menu est ouvert, on peut ajouter une logique ici si nécessaire
    }
  }, [menuVisible]);

  const [hoodType, setHoodType] = useState({
    filter: false,
    extractor: false,
    waterWash: false,
  });
  const [damperOperates, setDamperOperates] = useState(false);
  const [filterConfirming, setFilterConfirming] = useState(false);

  const [fanOptions, setFanOptions] = useState({
    upBlast: false,
    inLine: false,
    utility: false,
    directDrive: false,
    wall: false,
    roof: false,
    fanBelt: false,
    fanType: false,
    roofAccess: false,
  });

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

  const [otherReasons, setOtherReasons] = useState({
    insufficientAccess: false,
    severeWeather: false,
    insufficientTime: false,
    other: false,
  });

  // États pour les commentaires de chaque section
  const [comments, setComments] = useState({
    hoodType: '',
    fanType: '',
    preCleaning: '',
    servicePerformed: '',
    areasNotCleaned: '',
    postCleaning: '',
  });

  // États pour les sélecteurs de date et d'heure
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNextServiceDatePicker, setShowNextServiceDatePicker] = useState(false);
  const [showArrivalTimePicker, setShowArrivalTimePicker] = useState(false);
  const [showDepartureTimePicker, setShowDepartureTimePicker] = useState(false);
  const [showScheduledTimePicker, setShowScheduledTimePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextServiceDate, setNextServiceDate] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());

  // -------------------- FUNCTIONS --------------------
  const updateClientData = (field: keyof ClientData, value: any) => {
    setClientData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fonctions pour les sélecteurs de date et d'heure
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCurrentDate(selectedDate);
      updateClientData('serviceDate', selectedDate.toLocaleDateString());
    }
  };

  const onNextServiceDateChange = (event: any, selectedDate?: Date) => {
    setShowNextServiceDatePicker(false);
    if (selectedDate) {
      setNextServiceDate(selectedDate);
      updateClientData('nextService', selectedDate.toLocaleDateString());
    }
  };

  const onArrivalTimeChange = (event: any, selectedTime?: Date) => {
    setShowArrivalTimePicker(false);
    if (selectedTime) {
      setArrivalTime(selectedTime);
      updateClientData('arrivalTime', selectedTime.toLocaleTimeString());
    }
  };

  const onDepartureTimeChange = (event: any, selectedTime?: Date) => {
    setShowDepartureTimePicker(false);
    if (selectedTime) {
      setDepartureTime(selectedTime);
      updateClientData('departureTime', selectedTime.toLocaleTimeString());
    }
  };

  const onScheduledTimeChange = (event: any, selectedTime?: Date) => {
    setShowScheduledTimePicker(false);
    if (selectedTime) {
      setScheduledTime(selectedTime);
      updateClientData('scheduledTime', selectedTime.toLocaleTimeString());
    }
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
      const pdfUri = await generatePDF({
        clientData,
        beforePhotos,
        afterPhotos,
        exhaustFanPhotos,
        ductFanPhotos,
        canopyPhotos,
        selectedServices: selectedCategories, // Ajouter les services sélectionnés
        hoodType,
        damperOperates,
        filterConfirming,
        fanOptions,
        preCheck,
        servicePerformed,
        notCleaned,
        ductReasons,
        fanReasons,
        otherReasons,
        postCheck,
        comments,
      });
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
      beforePhotos,
      afterPhotos,
      exhaustFanPhotos,
      ductFanPhotos,
      canopyPhotos,
      selectedServices: selectedCategories, // Ajouter les services sélectionnés
      hoodType,
      damperOperates,
      filterConfirming,
      fanOptions,
      preCheck,
      servicePerformed,
      notCleaned,
      ductReasons,
      fanReasons,
      otherReasons,
      postCheck,
      comments,
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
    address: '',
    city: '',
    state: '',
    zip: '',
    technician: 'Anoir Boukhriss',
    certification: '#AB159.1',
    serviceDate: new Date().toLocaleDateString(),
    nextService: '',
    scheduledTime: '',
    arrivalTime: '',
    departureTime: '01:30',
    additionalInfo: '',
    beforePhoto: undefined,
    afterPhoto: undefined,
    fanBeltNumber: '',
    ladderOrLift: '27 FT',
    ownerRepresentative: 'Lee',
    signature: 'N/A',
    reportDate: '22 August 2025',
    questions: {
      improvements: '',
      satisfaction: '',
      recommendations: '',
      additionalFeedback: '',
    },
  });
  setHoodType({ filter: false, extractor: false, waterWash: false });
  setBeforePhotos([]);
  setAfterPhotos([]);
  setExhaustFanPhotos([]);
  setDuctFanPhotos([]);
  setCanopyPhotos([]);
  setSelectedCategories([]);
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
  setOtherReasons({ insufficientAccess: false, severeWeather: false, insufficientTime: false, other: false });
  setPostCheck({ leaks: false, fanRestarted: false, pilotLights: false, ceilingTiles: false, floorsMopped: false, waterDisposed: false, photosTaken: false, buildingSecured: false });
  setComments({ hoodType: '', fanType: '', preCleaning: '', servicePerformed: '', areasNotCleaned: '', postCleaning: '' });
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
            label="Address"
            value={clientData.address || ''}
            onChangeText={(text) => updateClientData('address', text)}
            placeholder="Enter client address"
          />
          <FormInput
            label="City"
            value={clientData.city || ''}
            onChangeText={(text) => updateClientData('city', text)}
            placeholder="Enter city"
          />
          <FormInput
            label="State"
            value={clientData.state || ''}
            onChangeText={(text) => updateClientData('state', text)}
            placeholder="Enter state"
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
            label="Zip Code"
            value={clientData.zip || ''}
            onChangeText={(text) => updateClientData('zip', text)}
            placeholder="Enter zip code"
          />
        </View>

        {/* Technician Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Information</Text>
          <FormInput
            label="Technician Name"
            value={clientData.technician || ''}
            onChangeText={(text) => updateClientData('technician', text)}
            placeholder="Enter technician name"
          />
          <FormInput
            label="Certification Number"
            value={clientData.certification || ''}
            onChangeText={(text) => updateClientData('certification', text)}
            placeholder="Enter certification number"
          />
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Service Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {currentDate.toLocaleDateString()}
              </Text>
              <Icon name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Next Service Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowNextServiceDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {nextServiceDate.toLocaleDateString()}
              </Text>
              <Icon name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Logs</Text>
          
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Time Jobs Scheduled</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowScheduledTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {scheduledTime.toLocaleTimeString()}
              </Text>
              <Icon name="time" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Arrival Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowArrivalTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {arrivalTime.toLocaleTimeString()}
              </Text>
              <Icon name="time" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Departure Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDepartureTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {departureTime.toLocaleTimeString()}
              </Text>
              <Icon name="time" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

       {/* Photos Section */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Services</Text>
  
  {/* Category Selector */}
  <View style={styles.categorySelector}>
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <PaperButton
          mode="outlined"
          onPress={() => {
            console.log('Menu button pressed, menuVisible:', menuVisible);
            setMenuVisible(!menuVisible);
          }}
          style={styles.categoryButton}
          contentStyle={styles.categoryButtonContent}
        >
          {selectedCategories.length > 0
            ? `${selectedCategories.length} Service(s) sélectionné(s)`
            : 'Sélectionner les services'}
        </PaperButton>
      }
    >
      <Menu.Item
        onPress={() => {
          const newCategories = selectedCategories.includes('exhaust')
            ? selectedCategories.filter(cat => cat !== 'exhaust')
            : [...selectedCategories, 'exhaust'];
          setSelectedCategories(newCategories);
          setServiceSelected(newCategories.length > 0);
          closeMenu();
        }}
        title="Exhaust Fan"
        leadingIcon="fan"
        trailingIcon={selectedCategories.includes('exhaust') ? "check" : undefined}
      />
      <Menu.Item
        onPress={() => {
          const newCategories = selectedCategories.includes('duct')
            ? selectedCategories.filter(cat => cat !== 'duct')
            : [...selectedCategories, 'duct'];
          setSelectedCategories(newCategories);
          setServiceSelected(newCategories.length > 0);
          closeMenu();
        }}
        title="Duct fan "
        leadingIcon="fan"
        trailingIcon={selectedCategories.includes('duct') ? "check" : undefined}
      />
      
      <Menu.Item
        onPress={() => {
          const newCategories = selectedCategories.includes('canopy')
            ? selectedCategories.filter(cat => cat !== 'canopy')
            : [...selectedCategories, 'canopy'];
          setSelectedCategories(newCategories);
          setServiceSelected(newCategories.length > 0);
          closeMenu();
        }}
        title="Canopy"
        leadingIcon="home"
        trailingIcon={selectedCategories.includes('canopy') ? "check" : undefined}
      />
    </Menu>
  </View>

  {/* Upload Components - Show based on selected services */}
  {serviceSelected && (
    <View style={styles.photoSection}>
      <Text style={styles.photoSectionTitle}>📸 Upload Photos</Text>
      
      {/* Always show Before and After */}
      <MultiPhotoUpload
        title="Before Photos"
        photoUris={beforePhotos}
        onChange={setBeforePhotos}
      />
      <MultiPhotoUpload
        title="After Photos"
        photoUris={afterPhotos}
        onChange={setAfterPhotos}
      />
      
      {/* Show specific service uploads based on selection */}
      
    </View>
  )}
</View>

        {/* General Info */}
       

        {/* Hood Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hood Type</Text>
          <Checkbox.Item
            label="Filter"
            status={hoodType.filter ? "checked" : "unchecked"}
            onPress={() => setHoodType({ ...hoodType, filter: !hoodType.filter })}
          />
          <Checkbox.Item
            label="Extractor"
            status={hoodType.extractor ? "checked" : "unchecked"}
            onPress={() =>
              setHoodType({ ...hoodType, extractor: !hoodType.extractor })
            }
          />
          <Checkbox.Item
            label="Water Wash Hood"
            status={hoodType.waterWash ? "checked" : "unchecked"}
            onPress={() =>
              setHoodType({ ...hoodType, waterWash: !hoodType.waterWash })
            }
          />
          <Checkbox.Item
            label="Damper operates properly?"
            status={damperOperates ? "checked" : "unchecked"}
            onPress={() => setDamperOperates(!damperOperates)}
          />
          <Checkbox.Item
            label="Filter confirming and in place?"
            status={filterConfirming ? "checked" : "unchecked"}
            onPress={() => setFilterConfirming(!filterConfirming)}
          />
          
          <FormInput
            label="Comments"
            value={comments.hoodType}
            onChangeText={(text) => setComments({ ...comments, hoodType: text })}
            placeholder="Enter comments for Hood Type section"
            multiline
          />
        </View>

        {/* Fan Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fan Type</Text>
          <Checkbox.Item
            label="Up blast"
            status={fanOptions.upBlast ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, upBlast: !fanOptions.upBlast })
            }
          />
          <Checkbox.Item
            label="In-Line"
            status={fanOptions.inLine ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, inLine: !fanOptions.inLine })
            }
          />
          <Checkbox.Item
            label="Utility"
            status={fanOptions.utility ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, utility: !fanOptions.utility })
            }
          />
          <Checkbox.Item
            label="Direct Drive"
            status={fanOptions.directDrive ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({
                ...fanOptions,
                directDrive: !fanOptions.directDrive,
              })
            }
          />
          <Checkbox.Item
            label="Wall"
            status={fanOptions.wall ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, wall: !fanOptions.wall })
            }
          />
          <Checkbox.Item
            label="Roof"
            status={fanOptions.roof ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, roof: !fanOptions.roof })
            }
          />
          <Checkbox.Item
            label="Fan belt"
            status={fanOptions.fanBelt ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, fanBelt: !fanOptions.fanBelt })
            }
          />
          <Checkbox.Item
            label="Fan type / Interior accessible"
            status={fanOptions.fanType ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({ ...fanOptions, fanType: !fanOptions.fanType })
            }
          />
          <Checkbox.Item
            label="Roof Access"
            status={fanOptions.roofAccess ? "checked" : "unchecked"}
            onPress={() =>
              setFanOptions({
                ...fanOptions,
                roofAccess: !fanOptions.roofAccess,
              })
            }
          />
          
          <FormInput
            label="Fan Belt #:"
            value={clientData.fanBeltNumber || ''}
            onChangeText={(text) => updateClientData('fanBeltNumber', text)}
            placeholder="Enter fan belt number"
          />
          
          <FormInput
            label="Ladder or Lift:"
            value={clientData.ladderOrLift || ''}
            onChangeText={(text) => updateClientData('ladderOrLift', text)}
            placeholder="Enter ladder or lift info"
          />
          
          <FormInput
            label="Comments"
            value={comments.fanType}
            onChangeText={(text) => setComments({ ...comments, fanType: text })}
            placeholder="Enter comments for Fan Type section"
            multiline
          />
        </View>



        {/* Pre Cleaning Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pre-Cleaning Check</Text>
          <Checkbox.Item
            label="Exhaust Fan Operational"
            status={preCheck.exhaustFanOperational ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, exhaustFanOperational: !preCheck.exhaustFanOperational })}
          />
          <Checkbox.Item
            label="Exhaust Fan Noisy/Off Balance"
            status={preCheck.exhaustFanNoisy ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, exhaustFanNoisy: !preCheck.exhaustFanNoisy })}
          />
          <Checkbox.Item
            label="Bare or Exposed Wires/Wires Too Short"
            status={preCheck.bareWires ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, bareWires: !preCheck.bareWires })}
          />
          <Checkbox.Item
            label="Hinge Kit Needed For Fan"
            status={preCheck.hingeKit ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, hingeKit: !preCheck.hingeKit })}
          />
          <Checkbox.Item
            label="Fan Clean Out Port Required"
            status={preCheck.fanCleanOut ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, fanCleanOut: !preCheck.fanCleanOut })}
          />
          <Checkbox.Item
            label="Hood Lights Operational"
            status={preCheck.hoodLights ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, hoodLights: !preCheck.hoodLights })}
          />
          <Checkbox.Item
            label="Grease Accumulation On Roof"
            status={preCheck.greaseRoof ? 'checked' : 'unchecked'}
            onPress={() => setPreCheck({ ...preCheck, greaseRoof: !preCheck.greaseRoof })}
          />
          
          <FormInput
            label="Comments"
            value={comments.preCleaning}
            onChangeText={(text) => setComments({ ...comments, preCleaning: text })}
            placeholder="Enter comments for Pre-Cleaning Check section"
            multiline
          />
        </View>

        {/* Service Performed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Performed</Text>
          <Checkbox.Item
            label="Hood Cleaned"
            status={servicePerformed.hoodCleaned ? 'checked' : 'unchecked'}
            onPress={() => setServicePerformed({ ...servicePerformed, hoodCleaned: !servicePerformed.hoodCleaned })}
          />
          <Checkbox.Item
            label="Vertical Duct Cleaned"
            status={servicePerformed.verticalDuct ? 'checked' : 'unchecked'}
            onPress={() => setServicePerformed({ ...servicePerformed, verticalDuct: !servicePerformed.verticalDuct })}
          />
          <Checkbox.Item
            label="Horizontal Duct Cleaned"
            status={servicePerformed.horizontalDuct ? 'checked' : 'unchecked'}
            onPress={() => setServicePerformed({ ...servicePerformed, horizontalDuct: !servicePerformed.horizontalDuct })}
          />
          
          <FormInput
            label="Comments"
            value={comments.servicePerformed}
            onChangeText={(text) => setComments({ ...comments, servicePerformed: text })}
            placeholder="Enter comments for Service Performed section"
            multiline
          />
        </View>

        {/* Areas Not Cleaned */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas Not Cleaned</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Duct:</Text>
            <Checkbox.Item
              label="Insufficient Access"
              status={ductReasons.insufficientAccess ? "checked" : "unchecked"}
              onPress={() => setDuctReasons({ ...ductReasons, insufficientAccess: !ductReasons.insufficientAccess })}
            />
            <Checkbox.Item
              label="Insufficient time"
              status={ductReasons.insufficientTime ? "checked" : "unchecked"}
              onPress={() => setDuctReasons({ ...ductReasons, insufficientTime: !ductReasons.insufficientTime })}
            />
            <Checkbox.Item
              label="Severe weather"
              status={ductReasons.severeWeather ? "checked" : "unchecked"}
              onPress={() => setDuctReasons({ ...ductReasons, severeWeather: !ductReasons.severeWeather })}
            />
            <Checkbox.Item
              label="Other"
              status={ductReasons.other ? "checked" : "unchecked"}
              onPress={() => setDuctReasons({ ...ductReasons, other: !ductReasons.other })}
            />
          </View>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Fan:</Text>
            <Checkbox.Item
              label="Unable To Remove/Open Fan"
              status={fanReasons.notAccessible ? "checked" : "unchecked"}
              onPress={() => setFanReasons({ ...fanReasons, notAccessible: !fanReasons.notAccessible })}
            />
            <Checkbox.Item
              label="Insufficient Access"
              status={fanReasons.insufficientAccess ? "checked" : "unchecked"}
              onPress={() => setFanReasons({ ...fanReasons, insufficientAccess: !fanReasons.insufficientAccess })}
            />
            <Checkbox.Item
              label="Insufficient time"
              status={fanReasons.insufficientTime ? "checked" : "unchecked"}
              onPress={() => setFanReasons({ ...fanReasons, insufficientTime: !fanReasons.insufficientTime })}
            />
            <Checkbox.Item
              label="Severe weather"
              status={fanReasons.severeWeather ? "checked" : "unchecked"}
              onPress={() => setFanReasons({ ...fanReasons, severeWeather: !fanReasons.severeWeather })}
            />
            <Checkbox.Item
              label="Other"
              status={fanReasons.other ? "checked" : "unchecked"}
              onPress={() => setFanReasons({ ...fanReasons, other: !fanReasons.other })}
            />
          </View>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Other:</Text>
            <Checkbox.Item
              label="Insufficient Access"
              status={otherReasons.insufficientAccess ? "checked" : "unchecked"}
              onPress={() => setOtherReasons({ ...otherReasons, insufficientAccess: !otherReasons.insufficientAccess })}
            />
            <Checkbox.Item
              label="Insufficient time"
              status={otherReasons.insufficientTime ? "checked" : "unchecked"}
              onPress={() => setOtherReasons({ ...otherReasons, insufficientTime: !otherReasons.insufficientTime })}
            />
            <Checkbox.Item
              label="Severe weather"
              status={otherReasons.severeWeather ? "checked" : "unchecked"}
              onPress={() => setOtherReasons({ ...otherReasons, severeWeather: !otherReasons.severeWeather })}
            />
            <Checkbox.Item
              label="Other"
              status={otherReasons.other ? "checked" : "unchecked"}
              onPress={() => setOtherReasons({ ...otherReasons, other: !otherReasons.other })}
            />
          </View>
          
          <FormInput
            label="Comments"
            value={comments.areasNotCleaned}
            onChangeText={(text) => setComments({ ...comments, areasNotCleaned: text })}
            placeholder="Enter comments for Areas Not Cleaned section"
            multiline
          />
        </View>

        {/* Post Cleaning Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post Cleaning Check</Text>
          <Checkbox.Item
            label="Any Exhaust System Leaks"
            status={postCheck.leaks ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, leaks: !postCheck.leaks })}
          />
          <Checkbox.Item
            label="Exhaust Fan Restarted"
            status={postCheck.fanRestarted ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, fanRestarted: !postCheck.fanRestarted })}
          />
          <Checkbox.Item
            label="Pilot Lights Relit"
            status={postCheck.pilotLights ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, pilotLights: !postCheck.pilotLights })}
          />
          <Checkbox.Item
            label="Ceiling Tiles Replaced"
            status={postCheck.ceilingTiles ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, ceilingTiles: !postCheck.ceilingTiles })}
          />
          <Checkbox.Item
            label="Floors Mopped"
            status={postCheck.floorsMopped ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, floorsMopped: !postCheck.floorsMopped })}
          />
          <Checkbox.Item
            label="Water Properly Disposed Of"
            status={postCheck.waterDisposed ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, waterDisposed: !postCheck.waterDisposed })}
          />
          <Checkbox.Item
            label="Photos Taken"
            status={postCheck.photosTaken ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, photosTaken: !postCheck.photosTaken })}
          />
          <Checkbox.Item
            label="Building Properly Secured"
            status={postCheck.buildingSecured ? 'checked' : 'unchecked'}
            onPress={() => setPostCheck({ ...postCheck, buildingSecured: !postCheck.buildingSecured })}
          />
          
          <FormInput
            label="Comments"
            value={comments.postCleaning}
            onChangeText={(text) => setComments({ ...comments, postCleaning: text })}
            placeholder="Enter comments for Post Cleaning Check section"
            multiline
          />
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <FormInput
            label="Additional Comments"
            value={clientData.additionalInfo}
            onChangeText={(text) => updateClientData('additionalInfo', text)}
            placeholder="Enter any additional comments or notes"
            multiline
          />
        </View>

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <FormInput
            label="Owner Representative:"
            value={clientData.ownerRepresentative || ''}
            onChangeText={(text) => updateClientData('ownerRepresentative', text)}
            placeholder="Enter owner representative"
          />
          <FormInput
            label="Signature:"
            value={clientData.signature || ''}
            onChangeText={(text) => updateClientData('signature', text)}
            placeholder="Enter signature"
          />
          <FormInput
            label="Date:"
            value={clientData.reportDate || ''}
            onChangeText={(text) => updateClientData('reportDate', text)}
            placeholder="Enter date"
          />
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

      {/* Date and Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {showNextServiceDatePicker && (
        <DateTimePicker
          value={nextServiceDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onNextServiceDateChange}
        />
      )}

      {showScheduledTimePicker && (
        <DateTimePicker
          value={scheduledTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onScheduledTimeChange}
        />
      )}

      {showArrivalTimePicker && (
        <DateTimePicker
          value={arrivalTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onArrivalTimeChange}
        />
      )}

      {showDepartureTimePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDepartureTimeChange}
        />
      )}
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
  categorySelector: { marginBottom: 20 },
  categoryButton: { borderColor: colors.primary },
  categoryButtonContent: { paddingVertical: 8 },
  photoSection: { 
    marginTop: 20, 
    padding: 16, 
    backgroundColor: colors.backgroundAlt, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border 
  },
  photoSectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: colors.text, 
    marginBottom: 16,
    textAlign: 'center'
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.text,
  },
  subsection: {
    marginBottom: 16,
    paddingLeft: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
});
