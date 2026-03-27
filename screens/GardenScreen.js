import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Animated, RefreshControl
} from 'react-native';
import { PlantContext } from '../context/PlantContext';
import { COLORS, SHADOWS } from '../theme';
import { getWaterStatus, getDaysUntilWater } from '../data/plantDatabase';

export default function GardenScreen({ navigation }) {
  const { plants, logCare } = useContext(PlantContext);
  const [refreshing, setRefreshing] = useState(false);

  const urgentPlants = plants.filter(p => {
    const days = getDaysUntilWater(p);
    return !p.lastWatered || days <= 0;
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın ☀️';
    if (hour < 18) return 'İyi günler 🌿';
    return 'İyi akşamlar 🌙';
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.title}>Bahçem 🌿</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddPlant')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Bitki Ekle</Text>
          </TouchableOpacity>
        </View>

        {/* Urgent Care Banner */}
        {urgentPlants.length > 0 && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentIcon}>💧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.urgentTitle}>
                {urgentPlants.length} bitkin suya ihtiyaç duyuyor
              </Text>
              <Text style={styles.urgentSub}>
                {urgentPlants.map(p => p.nickname || p.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Row */}
        {plants.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{plants.length}</Text>
              <Text style={styles.statLabel}>Bitki</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{urgentPlants.length}</Text>
              <Text style={styles.statLabel}>Bakım Bekleyen</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>
                {plants.reduce((acc, p) => acc + (p.careLog?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Bakım Yapıldı</Text>
            </View>
          </View>
        )}

        {/* Plants Grid */}
        {plants.length === 0 ? (
          <EmptyState onAdd={() => navigation.navigate('AddPlant')} />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bitkilerim</Text>
            <View style={styles.grid}>
              {plants.map(plant => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
                  onWater={() => logCare(plant.id, 'water')}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlantCard({ plant, onPress, onWater }) {
  const status = getWaterStatus(plant);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Plant Image / Emoji */}
      <View style={[styles.cardImageBg, { backgroundColor: plant.color || '#E8F5E9' }]}>
        {plant.imageUri ? (
          <Image source={{ uri: plant.imageUri }} style={styles.cardImage} />
        ) : (
          <Text style={styles.cardEmoji}>{plant.emoji || '🌿'}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {plant.nickname || plant.name}
        </Text>
        <Text style={styles.cardSpecies} numberOfLines={1}>
          {plant.name}
        </Text>

        {/* Water Status */}
        <View style={[styles.waterBadge, { backgroundColor: status.urgent ? COLORS.dangerLight : COLORS.greenPale }]}>
          <Text style={[styles.waterBadgeText, { color: status.urgent ? COLORS.danger : COLORS.green }]}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Quick Water Button */}
      {status.urgent && (
        <TouchableOpacity
          style={styles.quickWaterBtn}
          onPress={(e) => { e.stopPropagation(); onWater(); }}
          activeOpacity={0.7}
        >
          <Text style={styles.quickWaterText}>💧</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ onAdd }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🪴</Text>
      <Text style={styles.emptyTitle}>Bahçen henüz boş</Text>
      <Text style={styles.emptySub}>
        İlk bitkini ekle, sulama takvimine{'\n'}biz bakalım!
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd} activeOpacity={0.8}>
        <Text style={styles.emptyBtnText}>İlk Bitkimi Ekle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 14, color: COLORS.textMuted, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  addBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E9A225',
  },
  urgentIcon: { fontSize: 24 },
  urgentTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  urgentSub: { fontSize: 12, color: '#B45309', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: COLORS.green },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardImageBg: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: { width: '100%', height: '100%' },
  cardEmoji: { fontSize: 52 },
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSpecies: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  waterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  waterBadgeText: { fontSize: 11, fontWeight: '600' },
  quickWaterBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickWaterText: { fontSize: 18 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
