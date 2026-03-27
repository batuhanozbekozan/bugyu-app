import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, Alert, ActivityIndicator, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PlantContext } from '../context/PlantContext';
import { COLORS, SHADOWS } from '../theme';
import { PLANT_DATABASE, findPlantByName, CATEGORIES } from '../data/plantDatabase';

const CARD_COLORS = [
  { bg: '#E8F5E9', label: 'Yeşil' },
  { bg: '#E3F2FD', label: 'Mavi' },
  { bg: '#FFF8E1', label: 'Sarı' },
  { bg: '#FCE4EC', label: 'Pembe' },
  { bg: '#F3E5F5', label: 'Mor' },
  { bg: '#E0F2F1', label: 'Teal' },
];

export default function AddPlantScreen({ navigation }) {
  const { addPlant } = useContext(PlantContext);
  const [step, setStep] = useState(1); // 1: photo/search, 2: details
  const [imageUri, setImageUri] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [nickname, setNickname] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].bg);
  const [identifying, setIdentifying] = useState(false);
  const [customWatering, setCustomWatering] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hepsi');

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      identifyPlant(result.assets[0].base64);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      identifyPlant(result.assets[0].base64);
    }
  }

  async function identifyPlant(base64) {
    setIdentifying(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
              },
              {
                type: 'text',
                text: `Bu bitkiyi tanımla. Sadece JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "commonName": "İngilizce yaygın adı",
  "turkishName": "Türkçe adı",
  "scientificName": "Bilimsel adı",
  "wateringDays": sulama_aralığı_gün_sayısı,
  "sunlight": "Az ışık / Orta ışık / Parlak dolaylı ışık / Tam güneş",
  "difficulty": "Kolay / Orta / Zor",
  "tip": "En önemli bakım ipucu (Türkçe, tek cümle)",
  "emoji": "uygun emoji",
  "isPlant": true veya false
}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (!parsed.isPlant) {
        Alert.alert('🌿 Bitki Bulunamadı', 'Bu fotoğrafta bir bitki tespit edemedim. Lütfen başka bir fotoğraf dene.');
        setIdentifying(false);
        return;
      }

      setSelectedPlant({
        name: parsed.turkishName || parsed.commonName,
        commonName: parsed.commonName,
        scientificName: parsed.scientificName,
        wateringDays: parsed.wateringDays || 7,
        sunlight: parsed.sunlight,
        difficulty: parsed.difficulty,
        emoji: parsed.emoji || '🌿',
        tips: [parsed.tip],
        fertilizeWeeks: 4,
      });
      setStep(2);
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Bitki tanımlama şu an çalışmıyor. Manuel arama yapabilirsin.');
    }
    setIdentifying(false);
  }

  function searchPlants(query) {
    setSearchQuery(query);
    if (query.length < 2) return;
    const found = findPlantByName(query);
    if (found) setSelectedPlant(found);
  }

  function selectFromDatabase(plant) {
    setSelectedPlant(plant);
    setStep(2);
  }

  function handleSave() {
    if (!selectedPlant) return;
    if (!nickname.trim()) {
      Alert.alert('İsim Gerekli', 'Bitkine bir isim ver! 🌿');
      return;
    }

    addPlant({
      name: selectedPlant.turkishName || selectedPlant.name,
      commonName: selectedPlant.commonName,
      scientificName: selectedPlant.scientificName,
      nickname: nickname.trim(),
      wateringDays: customWatering ? parseInt(customWatering) : selectedPlant.wateringDays,
      sunlight: selectedPlant.sunlight,
      difficulty: selectedPlant.difficulty,
      emoji: selectedPlant.emoji,
      tips: selectedPlant.tips,
      fertilizeWeeks: selectedPlant.fertilizeWeeks,
      imageUri,
      color: selectedColor,
      lastWatered: null,
    });

    navigation.goBack();
  }

  const filteredDb = PLANT_DATABASE.filter(p => {
    const matchesSearch = searchQuery.length < 2 || (
      p.turkishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.commonName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCategory = selectedCategory === 'Hepsi' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 8);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Bitki Ekle' : 'Detaylar'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.content}>
            {/* Photo Section */}
            <Text style={styles.sectionTitle}>Fotoğraf Çek veya Seç</Text>
            <Text style={styles.sectionSub}>AI bitkini otomatik tanıyacak</Text>

            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnLabel}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.8}>
                <Text style={styles.photoBtnIcon}>🖼️</Text>
                <Text style={styles.photoBtnLabel}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>

            {imageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                {identifying && (
                  <View style={styles.identifyingOverlay}>
                    <ActivityIndicator color={COLORS.green} size="large" />
                    <Text style={styles.identifyingText}>🔍 Bitki tanınıyor...</Text>
                  </View>
                )}
              </View>
            )}

            {/* OR divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya manuel ara</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Bitki adı yaz... (ör: Pothos, Monstera)"
              value={searchQuery}
              onChangeText={searchPlants}
              placeholderTextColor={COLORS.textLight}
            />

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, selectedCategory === cat && styles.catBtnTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Database list */}
            <Text style={styles.dbTitle}>Popüler Bitkiler</Text>
            {filteredDb.map(plant => (
              <TouchableOpacity
                key={plant.scientificName}
                style={styles.dbItem}
                onPress={() => selectFromDatabase(plant)}
                activeOpacity={0.7}
              >
                <Text style={styles.dbEmoji}>{plant.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dbName}>{plant.turkishName}</Text>
                  <Text style={styles.dbSub}>{plant.difficulty} · {plant.sunlight}</Text>
                </View>
                <Text style={styles.dbArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && selectedPlant && (
          <View style={styles.content}>
            {/* Plant Info Card */}
            <View style={styles.plantInfoCard}>
              <Text style={styles.plantEmoji}>{selectedPlant.emoji}</Text>
              <Text style={styles.plantName}>{selectedPlant.turkishName || selectedPlant.name}</Text>
              <Text style={styles.plantScientific}>{selectedPlant.scientificName}</Text>
              <View style={styles.plantBadges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>💧 {selectedPlant.wateringDays} günde bir</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>☀️ {selectedPlant.sunlight}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>⭐ {selectedPlant.difficulty}</Text>
                </View>
              </View>
            </View>

            {/* Nickname */}
            <Text style={styles.fieldLabel}>Bitkine bir isim ver *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ör: Biberum, Yeşilim, Mini..."
              value={nickname}
              onChangeText={setNickname}
              placeholderTextColor={COLORS.textLight}
            />

            {/* Custom Watering */}
            <Text style={styles.fieldLabel}>Sulama Sıklığı (gün)</Text>
            <TextInput
              style={styles.input}
              placeholder={`Önerilen: ${selectedPlant.wateringDays} gün`}
              value={customWatering}
              onChangeText={setCustomWatering}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />

            {/* Card Color */}
            <Text style={styles.fieldLabel}>Kart Rengi</Text>
            <View style={styles.colorRow}>
              {CARD_COLORS.map(c => (
                <TouchableOpacity
                  key={c.bg}
                  style={[styles.colorDot, { backgroundColor: c.bg }, selectedColor === c.bg && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c.bg)}
                />
              ))}
            </View>

            {/* Tips */}
            {selectedPlant.tips && selectedPlant.tips.length > 0 && (
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Bakım İpucu</Text>
                <Text style={styles.tipText}>{selectedPlant.tips[0]}</Text>
              </View>
            )}

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Bitkimi Ekle 🌿</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cream,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: COLORS.green, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1 },
  content: { padding: 20 },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },

  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  photoBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  photoBtnIcon: { fontSize: 32, marginBottom: 8 },
  photoBtnLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  imagePreviewContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, height: 200 },
  imagePreview: { width: '100%', height: '100%' },
  identifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  identifyingText: { fontSize: 15, fontWeight: '600', color: COLORS.green },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },

  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  dbTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8 },
  dbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...SHADOWS.small,
  },
  dbEmoji: { fontSize: 28 },
  dbName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  dbSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  dbArrow: { fontSize: 20, color: COLORS.textLight },

  plantInfoCard: {
    backgroundColor: COLORS.greenPale,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  plantEmoji: { fontSize: 56, marginBottom: 8 },
  plantName: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  plantScientific: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 4, marginBottom: 12 },
  plantBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(45,106,79,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, color: COLORS.green, fontWeight: '600' },

  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  colorRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: COLORS.green,
    transform: [{ scale: 1.15 }],
  },

  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#E9A225',
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 6 },
  tipText: { fontSize: 13, color: '#78350F', lineHeight: 19 },

  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catBtnActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  catBtnText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  catBtnTextActive: { color: '#fff' },

  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
    marginTop: 28,
    ...SHADOWS.card,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
