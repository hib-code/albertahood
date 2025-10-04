import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, commonStyles } from '../styles/commonStyles';
import Icon from './Icon';

type MultiPhotoUploadProps = {
  title: string;
  photoUris: string[];
  onChange: (uris: string[]) => void;
};

export default function MultiPhotoUpload({ title, photoUris, onChange }: MultiPhotoUploadProps) {
  const requestPermissions = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (lib.status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library permissions to upload photos.');
      return false;
    }
    if (cam.status !== 'granted') {
      // Camera is optional; we will still allow library if camera denied
    }
    return true;
  };

  const addFromLibrary = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 0,
      });
      if (!result.canceled) {
        const newUris = result.assets?.map(a => a.uri).filter(Boolean) as string[];
        if (newUris.length) {
          const merged = Array.from(new Set([...(photoUris || []), ...newUris]));
          onChange(merged);
        }
      }
    } catch (e) {
      console.error('pick multiple error', e);
      Alert.alert('Error', 'Failed to pick images.');
    }
  };

  const addFromCamera = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const merged = Array.from(new Set([...(photoUris || []), uri]));
        onChange(merged);
      }
    } catch (e) {
      console.error('camera error', e);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const removeAt = (idx: number) => {
    const next = [...photoUris];
    next.splice(idx, 1);
    onChange(next);
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.thumbWrap}>
      <Image source={{ uri: item }} style={styles.thumb} />
      <TouchableOpacity style={styles.remove} onPress={() => removeAt(index)}>
        <Icon name="close" size={16} color={colors.background} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={commonStyles.label}>{title}</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnLeft]} onPress={addFromCamera}>
          <Icon name="camera" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRight]} onPress={addFromLibrary}>
          <Icon name="image" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Library</Text>
        </TouchableOpacity>
      </View>
      {(photoUris || []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <View style={styles.gridWrap}>
          {(photoUris || []).map((u, i) => (
            <View key={`${i}`} style={styles.thumbWrap}>
              <Image source={{ uri: u }} style={styles.thumb} />
              <TouchableOpacity style={styles.remove} onPress={() => removeAt(i)}>
                <Icon name="close" size={16} color={colors.background} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, width: '100%' },
  actionsRow: { flexDirection: 'row', marginBottom: 12, justifyContent: 'space-between' },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.backgroundAlt,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnLeft: {
    marginRight: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnRight: {
    marginLeft: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: { color: colors.textSecondary, fontWeight: '600' },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  thumbWrap: { width: '32%', aspectRatio: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  thumb: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 4 },
  empty: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  emptyText: { color: colors.textSecondary },
});


