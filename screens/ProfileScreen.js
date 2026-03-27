import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView
} from 'react-native';
import { PlantContext } from '../context/PlantContext';
import { COLORS, SHADOWS } from '../theme';
import { getDaysUntilWater } from '../data/plantDatabase';

export default function ProfileScreen() {
  const { plants } = useContext(PlantContext);

  const totalCare = plants.reduce((acc, p) => acc + (p.careLog?.length || 0), 0);
  const waterCount = plants.reduce((acc, p) =>
    acc + (p.careLog?.filter(c => c.type === 'water').length || 0), 0);
  const needsWater = plants.filter(p => {
    const d = getDaysUntilWater(p);
    return !p.lastWatered || d <= 0;
  }).length;

  const oldest = plants.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🌿</Text>
          </View>
          <Text style={styles.title}>Bahçemin İstatistikleri</Text>
          <Text style={styles.sub}>Bitkilerinle olan yolculuğun</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="🪴" value={plants.length} label="Toplam Bitki" color="#E8F5E9" />
          <StatCard icon="💧" value={waterCount} label="Sulama Yapıldı" color="#E3F2FD" />
          <StatCard icon="🌱" value={totalCare} label="Toplam Bakım" color="#F3E5F5" />
          <StatCard icon="⚠️" value={needsWater} label="Bakım Bekleyen" color="#FFF8E1" />
        </View>

        {/* Plant List Summary */}
        {plants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bitkilerim</Text>
            {plants.map(plant => {
              const days = getDaysUntilWater(plant);
              const urgent = !plant.lastWatered || days <= 0;
              return (
                <View key={plant.id} style={styles.plantRow}>
                  <Text style={styles.plantEmoji}>{plant.emoji || '🌿'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plantName}>{plant.nickname || plant.name}</Text>
                    <Text style={styles.plantSub}>{plant.careLog?.length || 0} bakım yapıldı</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: urgent ? COLORS.danger : COLORS.greenLight }]} />
                </View>
              );
            })}
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel İpuçları</Text>
          {[
            { icon: '☀️', tip: 'Sabah 9-11 arası sulama en idealdir.' },
            { icon: '💧', tip: 'Oda sıcaklığındaki su kökler için daha iyi.' },
            { icon: '🌡️', tip: 'Kışın sulama sıklığını azalt.' },
            { icon: '🌿', tip: 'Sararan yaprakları hemen kaldır.' },
          ].map((item, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipIcon}>{item.icon}</Text>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.greenPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...SHADOWS.small,
  },
  plantEmoji: { fontSize: 26 },
  plantName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  plantSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tipIcon: { fontSize: 20 },
  tipText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
});
