import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView
} from 'react-native';
import { PlantContext } from '../context/PlantContext';
import { COLORS, SHADOWS } from '../theme';

export default function CareLogScreen({ navigation, route }) {
  const { plantId } = route.params;
  const { plants } = useContext(PlantContext);
  const plant = plants.find(p => p.id === plantId);

  const log = [...(plant?.careLog || [])].reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plant?.nickname || plant?.name} — Bakım Geçmişi</Text>
        <View style={{ width: 50 }} />
      </View>

      {log.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>Henüz bakım kaydı yok.</Text>
        </View>
      ) : (
        <FlatList
          data={log}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <Text style={styles.logIcon}>{item.type === 'water' ? '💧' : '🌱'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>
                  {item.type === 'water' ? 'Sulandı' : 'Gübre Verildi'}
                </Text>
                <Text style={styles.logDate}>
                  {new Date(item.date).toLocaleString('tr-TR')}
                </Text>
              </View>
            </View>
          )}
        />
      )}
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
  },
  backText: { fontSize: 15, color: COLORS.green, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    ...SHADOWS.small,
  },
  logIcon: { fontSize: 28 },
  logTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  logDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
