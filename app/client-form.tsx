
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
import PhotoUpload from '../components/PhotoUpload';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { ClientData as BaseClientData } from '../types/ClientData';

type ClientQuestions = {
  improvements: string;
  satisfaction: string;
  recommendations: string;
  additionalFeedback: string;
};

type ClientData = BaseClientData & {
  questions: ClientQuestions;
};
import { generatePDF } from '../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';

export default function ClientFormScreen() {
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

  const updateClientData = (field: keyof ClientData, value: any) => {
    setClientData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateQuestion = (field: keyof ClientData['questions'], value: string) => {
    setClientData(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [field]: value,
      },
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
    if (!clientData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter client phone number');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleGeneratePDF = async () => {
    console.log('Generate PDF button pressed');
    
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    try {
      const pdfUri = await generatePDF(clientData);
      setGeneratedPdfUri(pdfUri);
      Alert.alert('Success', 'PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    console.log('Download PDF button pressed');
    
    if (!generatedPdfUri) {
      Alert.alert('Error', 'No PDF available. Please generate the report first.');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(generatedPdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save PDF Report',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to download PDF. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    console.log('Send email button pressed');
    
    if (!generatedPdfUri) {
      Alert.alert('Error', 'No PDF available. Please generate the report first.');
      return;
    }

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return;
      }

      await MailComposer.composeAsync({
        recipients: [clientData.email],
        subject: `Service Report for ${clientData.name}`,
        body: `Dear ${clientData.name},\n\nPlease find attached your service report.\n\nBest regards,\nYour Service Team`,
        attachments: [generatedPdfUri],
      });
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.title}>Client Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={commonStyles.scrollView}
        contentContainerStyle={[commonStyles.scrollContent, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
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
            required
          />

          <FormInput
            label="Additional Information"
            value={clientData.additionalInfo}
            onChangeText={(text) => updateClientData('additionalInfo', text)}
            placeholder="Any additional notes or information"
            multiline
          />
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback Questions</Text>
          
          <FormInput
            label="What improvements do you see?"
            value={clientData.questions.improvements}
            onChangeText={(text) => updateQuestion('improvements', text)}
            placeholder="Describe the improvements you notice"
            multiline
          />

          <FormInput
            label="How satisfied are you with the results?"
            value={clientData.questions.satisfaction}
            onChangeText={(text) => updateQuestion('satisfaction', text)}
            placeholder="Rate your satisfaction and explain why"
            multiline
          />

          <FormInput
            label="Would you recommend our services?"
            value={clientData.questions.recommendations}
            onChangeText={(text) => updateQuestion('recommendations', text)}
            placeholder="Would you recommend us to others? Why?"
            multiline
          />

          <FormInput
            label="Additional Feedback"
            value={clientData.questions.additionalFeedback}
            onChangeText={(text) => updateQuestion('additionalFeedback', text)}
            placeholder="Any other comments or suggestions"
            multiline
          />
        </View>

        <View style={styles.actionSection}>
          <Button
            text={isGenerating ? "Generating PDF..." : "Generate PDF Report"}
            onPress={handleGeneratePDF}
            style={[
              styles.generateButton,
              ...(isGenerating ? [styles.disabledButton] : []),
            ]}
            textStyle={styles.generateButtonText}
          />

          {generatedPdfUri && (
            <View style={styles.pdfActions}>
              <Text style={styles.successText}>✓ PDF Report Generated Successfully</Text>
              
              <Button
                text="Download PDF"
                onPress={handleDownloadPDF}
                style={styles.actionButton}
              />

              <Button
                text="Send via Email"
                onPress={handleSendEmail}
                style={[styles.actionButton, styles.emailButton]}
              />
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
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 16,
  },
  actionSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    marginBottom: 20,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
  },
  pdfActions: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: colors.secondary,
    marginBottom: 12,
  },
  emailButton: {
    backgroundColor: colors.success,
  },
});