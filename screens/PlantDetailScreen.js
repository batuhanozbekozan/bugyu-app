import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Alert
} from 'react-native';
import { PlantContext } from '../context/PlantContext';
import { COLORS, SHADOWS } from '../theme';
import { getWaterStatus, getDaysUntilWater } from '../data/plantDatabase';

export default function PlantDetailScreen({ navigation, route }) {
  const { plantId } = route.params;
  const { plants, logCare, deletePlant } = useContext(PlantContext);
  const plant = plants.find(p => p.id === plantId);

  if (!plant) {
    navigation.goBack();
    return null;
  }

  const waterStatus = getWaterStatus(plant);
  const daysUntilWater = getDaysUntilWater(plant);

  function handleDelete() {
    Alert.alert(
      `${plant.nickname || plant.name} Silinsin mi?`,
      'Bu bitki bahçenden kaldırılacak.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: () => { deletePlant(plant.id); navigation.goBack(); }
        }
      ]
    );
  }

  function handleWater() {
    logCare(plant.id, 'water');
    Alert.alert('💧 Sulandı!', `${plant.nickname || plant.name} sulandı. Bir sonraki sulama ${plant.wateringDays} gün sonra.`);
  }

  function handleFertilize() {
    logCare(plant.id, 'fertilize');
    Alert.alert('🌱 Gübre Verildi!', 'Harika! Bitkini besledi.');
  }

  const recentCare = [...(plant.careLog || [])].reverse().slice(0, 10);

  const waterProgress = plant.lastWatered
    ? Math.max(0, Math.min(1, 1 - (daysUntilWater / plant.wateringDays)))
    : 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteText}>Sil</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: plant.color || COLORS.greenPale }]}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.heroImage} />
          ) : (
            <Text style={styles.heroEmoji}>{plant.emoji || '🌿'}</Text>
          )}
        </View>

        <View style={styles.content}>
          {/* Name */}
          <View style={styles.nameRow}>
            <View>
              <Text style={styles.nickname}>{plant.nickname || plant.name}</Text>
              <Text style={styles.plantName}>{plant.name}</Text>
              {plant.scientificName && (
                <Text style={styles.scientific}>{plant.scientificName}</Text>
              )}
            </View>
            <View style={[styles.difficultyBadge]}>
              <Text style={styles.difficultyText}>{plant.difficulty || 'Orta'}</Text>
            </View>
          </View>

          {/* Water Status Card */}
          <View style={[styles.waterCard, waterStatus.urgent && styles.waterCardUrgent]}>
            <View style={styles.waterCardTop}>
              <Text style={styles.waterIcon}>💧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.waterLabel}>Sulama Durumu</Text>
                <Text style={[styles.waterStatus, { color: waterStatus.urgent ? COLORS.danger : COLORS.green }]}>
                  {waterStatus.label}
                </Text>
              </View>
              <TouchableOpacity style={styles.waterNowBtn} onPress={handleWater} activeOpacity={0.8}>
                <Text style={styles.waterNowText}>Suladım ✓</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${waterProgress * 100}%`,
                backgroundColor: waterStatus.urgent ? COLORS.danger : COLORS.green
              }]} />
            </View>

            {plant.lastWatered && (
              <Text style={styles.lastWatered}>
                Son sulama: {new Date(plant.lastWatered).toLocaleDateString('tr-TR')}
              </Text>
            )}
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <InfoCard icon="☀️" label="Işık" value={plant.sunlight || 'Orta ışık'} />
            <InfoCard icon="💧" label="Sulama" value={`${plant.wateringDays} günde bir`} />
            <InfoCard icon="🌱" label="Gübre" value={`${plant.fertilizeWeeks || 4} haftada bir`} />
            <InfoCard icon="📅" label="Eklendi" value={new Date(plant.addedAt).toLocaleDateString('tr-TR')} />
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Bakım Yap</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.waterActionBtn]} onPress={handleWater} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>💧</Text>
              <Text style={styles.actionLabel}>Suladım</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.fertilizeActionBtn]} onPress={handleFertilize} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>🌱</Text>
              <Text style={styles.actionLabel}>Gübre Verdim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.logActionBtn]}
              onPress={() => navigation.navigate('CareLog', { plantId: plant.id })}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Tüm Kayıtlar</Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          {plant.tips && plant.tips.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Bakım İpuçları</Text>
              {plant.tips.map((tip, i) => (
                <View key={i} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>🌿</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </>
          )}

          {/* Recent Care Log */}
          {recentCare.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Son Bakımlar</Text>
              {recentCare.slice(0, 5).map((entry, i) => (
                <View key={i} style={styles.logItem}>
                  <Text style={styles.logIcon}>{entry.type === 'water' ? '💧' : '🌱'}</Text>
                  <Text style={styles.logText}>
                    {entry.type === 'water' ? 'Sulandı' : 'Gübre verildi'}
                  </Text>
                  <Text style={styles.logDate}>
                    {new Date(entry.date).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {},
  backText: { fontSize: 15, color: COLORS.green, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  deleteText: { fontSize: 14, color: COLORS.danger, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scroll: { flex: 1 },
  hero: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmoji: { fontSize: 100 },
  content: { padding: 20 },

  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  nickname: { fontSize: 26, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  plantName: { fontSize: 15, color: COLORS.textMuted, marginTop: 2 },
  scientific: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', marginTop: 2 },
  difficultyBadge: { backgroundColor: COLORS.greenPale, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  difficultyText: { fontSize: 12, fontWeight: '700', color: COLORS.green },

  waterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  waterCardUrgent: { borderWidth: 1.5, borderColor: COLORS.danger },
  waterCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  waterIcon: { fontSize: 28 },
  waterLabel: { fontSize: 12, color: COLORS.textMuted },
  waterStatus: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  waterNowBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  waterNowText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  lastWatered: { fontSize: 11, color: COLORS.textLight },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  infoCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    ...SHADOWS.small,
  },
  infoIcon: { fontSize: 20, marginBottom: 6 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 2 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  waterActionBtn: { backgroundColor: '#E3F2FD' },
  fertilizeActionBtn: { backgroundColor: '#E8F5E9' },
  logActionBtn: { backgroundColor: '#FFF8E1' },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },

  tipItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tipBullet: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },

  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    ...SHADOWS.small,
  },
  logIcon: { fontSize: 20 },
  logText: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  logDate: { fontSize: 12, color: COLORS.textMuted },
});
