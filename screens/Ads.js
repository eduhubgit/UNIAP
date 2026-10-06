import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colors } from '../theme';
import Header from '../components/Header';

export default function Ads() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.center}>
        <Text style={styles.emoji}>🛍️</Text>
        <Text style={styles.titulo}>Marketplace UNI AP</Text>
        <Text style={styles.texto}>
          Em breve você poderá comprar e vender móveis e outros itens com outros
          universitários.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Em breve</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 56 },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 12,
  },
  texto: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  badge: {
    backgroundColor: colors.pink,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 18,
  },
  badgeText: { color: '#fff', fontWeight: '700' },
});
