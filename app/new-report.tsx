import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
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
import Signature from 'react-native-signature-canvas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function NewReportScreen() {
  const params = useLocalSearchParams();
  


  //-------------date format--------------------
  
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
    serviceDate: new Date().toISOString().split('T')[0],
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
  const [isSavingOnline, setIsSavingOnline] = useState(false);
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [exhaustFanPhotos, setExhaustFanPhotos] = useState<string[]>([]);
  const [ductFanPhotos, setDuctFanPhotos] = useState<string[]>([]);
  const [canopyPhotos, setCanopyPhotos] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [serviceSelected, setServiceSelected] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
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
  const [currentDate, setCurrentDate] = useState(
    clientData.serviceDate ? new Date(clientData.serviceDate) : new Date()
  );
  const [nextServiceDate, setNextServiceDate] = useState(
    clientData.nextService ? new Date(clientData.nextService) : new Date()
  );


  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());

  // déclaration du state si pas déjà fait
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);

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
        updateClientData('serviceDate', selectedDate.toISOString().split('T')[0]); 
      }
    };

    const onNextServiceDateChange = (event: any, selectedDate?: Date) => {
      setShowNextServiceDatePicker(false);
      if (selectedDate) {
        setNextServiceDate(selectedDate);
        updateClientData('nextService', selectedDate.toISOString().split('T')[0]); 
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
//code sugestion

const [storedClients, setStoredClients] = useState<ClientData[]>([]);
const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

// Fonction utilitaire pour recharger la liste des clients stockés
const reloadStoredClients = async () => {
  const data = await AsyncStorage.getItem('reports');
  if (data) {
    const reports = JSON.parse(data);
    const uniqueClients = Array.from(
      new Map(
        reports.map((r: any) => {
          const client = (r.clientData || r) as ClientData;
          return [client.name, client];
        })
      ).values()
    );
    console.log('reloadStoredClients (unique clients)', uniqueClients);
    setStoredClients(uniqueClients as ClientData[]);
  }
};

const handleClientNameChange = (text: string) => {
  updateClientData('name', text);
  const criteria = text.trim().toLowerCase();
  const results = !criteria
    ? storedClients          
    : storedClients.filter(c => c.name && c.name.toLowerCase().includes(criteria));
  console.log('handleClientNameChange text:', text);
  console.log('storedClients:', storedClients);
  console.log('filtered results:', results);
  setFilteredClients(results);
  setShowSuggestions(results.length > 0);
};

const handleClientSelect = (client: ClientData) => {
  (Object.keys(client) as (keyof ClientData)[]).forEach((key) => {
    updateClientData(key, client[key]);
  });
  setShowSuggestions(false);
  setFilteredClients([]);
};
//fin
 


  const handleSignatureClear = () => {
    setShowSignaturePad(false);
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
        selectedServices: selectedCategories, 
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
    const existingReportsJson = await AsyncStorage.getItem('reports');
    let existingReports = existingReportsJson ? JSON.parse(existingReportsJson) : [];
    let newReport = {
      clientData,
      beforePhotos,
      afterPhotos,
      exhaustFanPhotos,
      ductFanPhotos,
      canopyPhotos,
      selectedServices: selectedCategories,
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
    if (params.client) {
      const clientObj = JSON.parse(Array.isArray(params.client) ? params.client[0] : params.client as string);
      const filterEmail = params.originalEmail || clientObj.email;
      const filterName = params.originalName || clientObj.name;
      const filterAddress = params.originalAddress || clientObj.address;
      const filterCity = params.originalCity || clientObj.city;
      const filterPhone = params.originalPhone || clientObj.phone;
      const filterZip = params.originalZip || clientObj.zip;
      existingReports = existingReports.filter((r: any) =>
        !(r.clientData.email === filterEmail &&
          r.clientData.name === filterName &&
          r.clientData.address === filterAddress &&
          r.clientData.city === filterCity &&
          r.clientData.phone === filterPhone &&
          r.clientData.zip === filterZip)
      );
    }
    const updatedReports = [...existingReports, newReport];
    await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
    Alert.alert(
      'Succès',
      params.client ? 'Modified client !' : 'Created !',
      [
        {
          text: 'OK',
          onPress: () => {
            if (params.client) {
              router.replace('/search-client?refresh=1');
            }
          },
        },
      ]
    );
    resetForm();
    setShowSuggestions(false);
    setFilteredClients([]);
    await reloadStoredClients();
    if (params.client) {
      setTimeout(() => {
        router.replace('/search-client?refresh=1');
      }, 1300);
    }
  } catch (error) {
    console.error('AsyncStorage error:', error);
    Alert.alert('Error', 'Unable to save data. Please try again.');
  }
};

// Upload helpers for React Native (file://, content://, or data URLs)
const base64ToUint8Array = (base64: string) => {
  const binaryString = global.atob ? global.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const pickContentType = (uri: string) => {
  if (uri.startsWith('data:image/')) {
    const match = uri.match(/^data:(.*?);/);
    return match ? match[1] : 'image/jpeg';
  }
  if (uri.endsWith('.png')) return 'image/png';
  if (uri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const readAsUint8Array = async (uri: string): Promise<Uint8Array | null> => {
  try {
    if (uri.startsWith('data:')) {
      const base64 = uri.split(',')[1] || '';
      return base64ToUint8Array(base64);
    }
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    return base64ToUint8Array(base64);
  } catch (e) {
    console.warn('readAsUint8Array error', e);
    return null;
  }
};

// Upload a single URI to Supabase Storage and return the public URL
const uploadFileToStorage = async (bucket: string, uri: string, folder: string) => {
  try {
    if (!uri) return null;
    const contentType = pickContentType(uri);
    const bytes = await readAsUint8Array(uri);
    if (!bytes) return null;
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}${contentType === 'image/png' ? '.png' : '.jpg'}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, bytes, {
      contentType,
      upsert: false,
    });
    if (error) {
      console.warn('Storage upload error:', error.message);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.warn('Storage upload exception:', e);
    return null;
  }
};

// Upload arrays and single media; return map of public URLs
const uploadMedia = async () => {
  const bucket = 'reports';
  const folderBase = `report_${Date.now()}`;
  const mapUpload = async (uris: string[], sub: string) => {
    const results = await Promise.all(
      (uris || []).map(async (u) => {
        if (typeof u === 'string' && /^https?:\/\//i.test(u)) {
          // Already online URL → keep as-is
          return u;
        }
        return await uploadFileToStorage(bucket, u, `${folderBase}/${sub}`);
      })
    );
    return results.filter(Boolean) as string[];
  };
  const uploadedBefore = await mapUpload(beforePhotos, 'before');
  const uploadedAfter = await mapUpload(afterPhotos, 'after');
  const uploadedExhaust = await mapUpload(exhaustFanPhotos, 'exhaustFan');
  const uploadedDuctFan = await mapUpload(ductFanPhotos, 'ductFan');
  const uploadedCanopy = await mapUpload(canopyPhotos, 'canopy');

  const singleBefore = clientData.beforePhoto
    ? (/^https?:\/\//i.test(clientData.beforePhoto)
        ? clientData.beforePhoto
        : await uploadFileToStorage(bucket, clientData.beforePhoto, `${folderBase}/single`))
    : null;
  const singleAfter = clientData.afterPhoto
    ? (/^https?:\/\//i.test(clientData.afterPhoto)
        ? clientData.afterPhoto
        : await uploadFileToStorage(bucket, clientData.afterPhoto, `${folderBase}/single`))
    : null;
  const signatureUrl = clientData.signature
    ? (clientData.signature.startsWith('data:')
        ? await uploadFileToStorage(bucket, clientData.signature, `${folderBase}/signature`)
        : /^https?:\/\//i.test(clientData.signature) ? clientData.signature : null)
    : null;

  return {
    beforePhotos: uploadedBefore,
    afterPhotos: uploadedAfter,
    exhaustFanPhotos: uploadedExhaust,
    ductFanPhotos: uploadedDuctFan,
    canopyPhotos: uploadedCanopy,
    beforePhoto: singleBefore,
    afterPhoto: singleAfter,
    signature: signatureUrl,
  };
};

const handleSaveToSupabase = async () => {
  if (isSavingOnline) return;
  setIsSavingOnline(true);
  try {
    // Upload images and signature to storage
    const uploaded = await uploadMedia();

    const record = {
      clientData,
      selectedServices: selectedCategories,
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
      photos: uploaded,
      createdAt: new Date().toISOString(),
    };

    const supabaseId = (params as any).supabaseId as string | undefined;
    console.log('Saving with supabaseId:', supabaseId);
    if (supabaseId && supabaseId.trim()) {
      const { error } = await supabase.from('reports').update({ data: record }).eq('id', supabaseId);
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      Alert.alert('Success', 'Updated online!');
      try { router.replace('/search-client'); } catch {}
    } else {
      const { error } = await supabase.from('reports').insert([{ data: record }]);
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      Alert.alert('Success', 'Created online!');
    }

    // Optional: keep local backup
    try {
      const existingReportsJson = await AsyncStorage.getItem('reports');
      const existingReports = existingReportsJson ? JSON.parse(existingReportsJson) : [];
      await AsyncStorage.setItem('reports', JSON.stringify([...existingReports, record]));
    } catch {}

    resetForm();
  } catch (e: any) {
    console.error('Supabase save error:', e?.message || e);
    Alert.alert('Error', 'Online save failed. Please try again.');
  } finally {
    setIsSavingOnline(false);
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
    serviceDate: new Date().toISOString().split('T')[0],
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
    reportDate: new Date().toISOString().split('T')[0],
    questions: {
      improvements: '',
      satisfaction: '',
      recommendations: '',
      additionalFeedback: '',
    },
  });
  setShowSuggestions(false);
  setFilteredClients([]);
  // Tu peux remonter scroll si tu as une ref sur ScrollView ici !
};
//
  // -------------------- RENDER --------------------
  React.useEffect(() => {
    console.log('Params received:', { client: !!params.client, report: !!(params as any).report, supabaseId: (params as any).supabaseId });
    
    if (params.client) {
      try {
        const clientObj = JSON.parse(Array.isArray(params.client) ? params.client[0] : params.client as string);
        setClientData(prev => ({ ...prev, ...clientObj }));
        setShowSuggestions(false);
        setFilteredClients([]);
      } catch {}
    }
    if ((params as any).report) {
      try {
        const reportObj = JSON.parse(Array.isArray((params as any).report) ? (params as any).report[0] : (params as any).report as string);
        console.log('Loading report for edit:', reportObj);
        console.log('Supabase ID from params:', (params as any).supabaseId);
        
        // Reset all states first
        if (reportObj.clientData) setClientData(reportObj.clientData);
        
        // Support both legacy top-level arrays and nested photos object
        const photos = reportObj.photos || {};
        setBeforePhotos(Array.isArray(reportObj.beforePhotos) ? reportObj.beforePhotos : (Array.isArray(photos.beforePhotos) ? photos.beforePhotos : []));
        setAfterPhotos(Array.isArray(reportObj.afterPhotos) ? reportObj.afterPhotos : (Array.isArray(photos.afterPhotos) ? photos.afterPhotos : []));
        setExhaustFanPhotos(Array.isArray(reportObj.exhaustFanPhotos) ? reportObj.exhaustFanPhotos : (Array.isArray(photos.exhaustFanPhotos) ? photos.exhaustFanPhotos : []));
        setDuctFanPhotos(Array.isArray(reportObj.ductFanPhotos) ? reportObj.ductFanPhotos : (Array.isArray(photos.ductFanPhotos) ? photos.ductFanPhotos : []));
        setCanopyPhotos(Array.isArray(reportObj.canopyPhotos) ? reportObj.canopyPhotos : (Array.isArray(photos.canopyPhotos) ? photos.canopyPhotos : []));
        
        if (Array.isArray(reportObj.selectedServices)) {
          setSelectedCategories(reportObj.selectedServices);
          setServiceSelected(reportObj.selectedServices.length > 0);
        } else {
          setSelectedCategories([]);
          setServiceSelected(false);
        }
        
        if (reportObj.hoodType) setHoodType(reportObj.hoodType);
        else setHoodType({ filter: false, extractor: false, waterWash: false });
        
        if (typeof reportObj.damperOperates === 'boolean') setDamperOperates(reportObj.damperOperates);
        else setDamperOperates(false);
        
        if (typeof reportObj.filterConfirming === 'boolean') setFilterConfirming(reportObj.filterConfirming);
        else setFilterConfirming(false);
        
        if (reportObj.fanOptions) setFanOptions(reportObj.fanOptions);
        else setFanOptions({ upBlast: false, inLine: false, utility: false, directDrive: false, wall: false, roof: false, fanBelt: false, fanType: false, roofAccess: false });
        
        if (reportObj.preCheck) setPreCheck(reportObj.preCheck);
        else setPreCheck({ exhaustFanOperational: false, exhaustFanNoisy: false, bareWires: false, hingeKit: false, fanCleanOut: false, hoodLights: false, greaseRoof: false });
        
        if (reportObj.servicePerformed) setServicePerformed(reportObj.servicePerformed);
        else setServicePerformed({ hoodCleaned: false, verticalDuct: false, horizontalDuct: false });
        
        if (reportObj.notCleaned) setNotCleaned(reportObj.notCleaned);
        else setNotCleaned({ duct: false, fan: false, other: false });
        
        if (reportObj.ductReasons) setDuctReasons(reportObj.ductReasons);
        else setDuctReasons({ insufficientAccess: false, severeWeather: false, insufficientTime: false, other: false });
        
        if (reportObj.fanReasons) setFanReasons(reportObj.fanReasons);
        else setFanReasons({ insufficientAccess: false, severeWeather: false, insufficientTime: false, mechanicalIssue: false, notAccessible: false, other: false });
        
        if (reportObj.otherReasons) setOtherReasons(reportObj.otherReasons);
        else setOtherReasons({ insufficientAccess: false, severeWeather: false, insufficientTime: false, other: false });
        
        if (reportObj.postCheck) setPostCheck(reportObj.postCheck);
        else setPostCheck({ leaks: false, fanRestarted: false, pilotLights: false, ceilingTiles: false, floorsMopped: false, waterDisposed: false, photosTaken: false, buildingSecured: false });
        
        if (reportObj.comments) setComments(reportObj.comments);
        else setComments({ hoodType: '', fanType: '', preCleaning: '', servicePerformed: '', areasNotCleaned: '', postCleaning: '' });
      } catch (e) {
        console.error('Error loading report:', e);
      }
    }
  }, [params.client, (params as any).report]);
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
        scrollEnabled={scrollEnabled}
      >
        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <FormInput
            label="Client Name"
            value={clientData.name}
            onChangeText={handleClientNameChange}
            placeholder="Enter client name"
            required
          />
          {showSuggestions && filteredClients.length > 0 && (
            <View style={{
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 7,
              marginBottom: 12,
            }}>
              {filteredClients.map((client, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleClientSelect(client)}
                  style={{ padding: 10, borderBottomWidth: idx < filteredClients.length-1 ? 1 : 0, borderColor: '#eee' }}>
                  <Text>{client.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
            ? `${selectedCategories.length} service(s) selected`
            : 'Select services'}
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
      {selectedCategories.includes('exhaust') && (
        <MultiPhotoUpload
          title="Exhaust Fan Photos"
          photoUris={exhaustFanPhotos}
          onChange={setExhaustFanPhotos}
        />
      )}
      {selectedCategories.includes('duct') && (
        <MultiPhotoUpload
          title="Duct Fan Photos"
          photoUris={ductFanPhotos}
          onChange={setDuctFanPhotos}
        />
      )}
      {selectedCategories.includes('canopy') && (
        <MultiPhotoUpload
          title="Canopy Photos"
          photoUris={canopyPhotos}
          onChange={setCanopyPhotos}
        />
      )}
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

      {/* 🖊️ Section Signature */}


 
   <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <FormInput
            label="Owner Representative:"
            value={clientData.ownerRepresentative || ''}
            onChangeText={(text) => updateClientData('ownerRepresentative', text)}
            placeholder="Enter owner representative"
          />
          <FormInput
            label="Signature client:"
            value={clientData.signature || ''}
            onChangeText={(text) => updateClientData('signature', text)}
            placeholder="Enter signature"
          />

      {/* Champ Date */}
      <Text style={{ marginBottom: 5 }}>Date:</Text>
      <TouchableOpacity
        onPress={() => setShowReportDatePicker(true)}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 5,
          marginBottom: 10,
          backgroundColor: 'white'
        }}
      >
        <Text style={{ color: clientData.reportDate ? '#111' : '#aaa' }}>
          {clientData.reportDate || 'Select date'}
        </Text>
      </TouchableOpacity>
      {showReportDatePicker && (
        <DateTimePicker
          value={clientData.reportDate && !isNaN(new Date(clientData.reportDate).getTime())?
            new Date(clientData.reportDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowReportDatePicker(false);
            if (selectedDate) {
              updateClientData('reportDate', selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}
    </View>


        {/* Export PDF */}
     <View style={styles.buttonRow}>
          <Button
            text={isSavingOnline ? 'Saving...' : 'Save'}
           onPress={handleSaveToSupabase}
           style={{flex:1, marginRight: 10, backgroundColor: colors.primary, borderRadius: 16}}
           textStyle={{color: '#fff', fontWeight: '700'}}
         />

          <Button
            text={isGenerating ? 'Generating...' : 'Export PDF'}
            onPress={handleExportPDF}
            style={{flex:1, backgroundColor: colors.success, borderRadius: 16}}
            textStyle={{color: '#fff', fontWeight: '700'}}
            disabled={isGenerating}
          />
        </View>
        {generatedPdfUri && (
            <View style={styles.successSection}>
              <Text style={styles.successText}>✓ PDF Report Generated Successfully</Text>
            </View>
          )}
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
      {isGenerating && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator color={colors.primary} style={styles.spinner} size="large" />
    <Text style={{marginTop:12, color:colors.primary}}>Génération du PDF...</Text>
  </View>
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
  section: {
    marginBottom: 32,
    backgroundColor: '#fff',
    padding: 10,
    margin: 5, 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: '#F5F8FF',
    paddingVertical: 10,
    paddingLeft: 12,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    fontSize: 16,
  },
  actionSection: { marginTop: 20, marginBottom: 40 },
  exportButton: { backgroundColor: colors.primary, paddingVertical: 16, marginBottom: 20 },
  exportButtonText: { fontSize: 18, fontWeight: '600' },
  disabledButton: { backgroundColor: colors.textSecondary },
  successSection: { alignItems: 'center' },
  successText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12
  },
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
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 30,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(60,60,60,.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  spinner: {
    width: 48,
    height: 48,
  },
});
