import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { recebidosPendentes } from '../utils/people';
import Match from './Match';
import Interessados from './Interessados';
import Ads from './Ads';
import Profile from './Profile';

const Tab = createBottomTabNavigator();

const ITENS = [
  { rota: 'Interessados', emoji: '🏠', label: 'Interessados' },
  { rota: 'Anuncios', emoji: '📣', label: 'Anúncios' },
  { rota: 'Perfil', emoji: '👤', label: 'Perfil' },
];

function BarraAbas({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { currentUser, rejected, chats } = useApp();
  const atual = state.routes[state.index].name;
  const pendentes = recebidosPendentes(currentUser, rejected, chats).length;

  return (
    <View
      style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {ITENS.map((item) => {
        const ativa = atual === item.rota;
        return (
          <TouchableOpacity
            key={item.rota}
            style={styles.item}
            // na aba em que você está, o botão vira "Voltar" para a tela inicial (Match)
            onPress={() => navigation.navigate(ativa ? 'Match' : item.rota)}>
            <View>
              <Text style={styles.emoji}>{ativa ? '⬅️' : item.emoji}</Text>
              {!ativa && item.rota === 'Interessados' && pendentes > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>!</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, ativa && { color: colors.pink }]}>
              {ativa ? 'Voltar' : item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function Main() {
  return (
    <Tab.Navigator
      initialRouteName="Match"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BarraAbas {...props} />}>
      <Tab.Screen name="Match" component={Match} />
      <Tab.Screen name="Interessados" component={Interessados} />
      <Tab.Screen name="Anuncios" component={Ads} />
      <Tab.Screen name="Perfil" component={Profile} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: '#EBDDF7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center' },
  emoji: { fontSize: 24 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
