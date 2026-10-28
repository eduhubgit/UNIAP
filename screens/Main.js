import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { recebidosPendentes } from '../utils/people';
import { ALTURA_HEADER } from '../utils/layout';
import AvisoBloqueio from '../components/AvisoBloqueio';
import Match from './Match';
import Interessados from './Interessados';
import Ads from './Ads';
import Profile from './Profile';
import Chats from './Chats';

const Tab = createBottomTabNavigator();

const ITENS = [
  { rota: 'Interessados', emoji: '🏠', label: 'Interessados' },
  { rota: 'Anuncios', emoji: '📣', label: 'Anúncios' },
  { rota: 'Perfil', emoji: '👤', label: 'Perfil' },
];

// põe o aviso de bloqueio na frente da tela (sem cobrir o topo com ☰, logo e 💬)
function Bloqueavel({ navigation, resetarAoFocar, children }) {
  const insets = useSafeAreaInsets();
  const { bloqueio, dispensarAviso, resetarAviso } = useApp();

  // toda vez que a pessoa volta para o Match, o aviso de "já aceito" aparece de novo
  useFocusEffect(
    useCallback(() => {
      if (resetarAoFocar) resetarAviso();
    }, [resetarAoFocar])
  );

  const topo = ALTURA_HEADER + (Platform.OS === 'ios' ? insets.top : 0);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!!bloqueio && (
        <AvisoBloqueio
          tipo={bloqueio}
          topo={topo}
          onOk={dispensarAviso}
          onIrApInfos={() => navigation.navigate('Perfil', { aba: 'ap' })}
        />
      )}
    </View>
  );
}

const MatchTela = (props) => (
  <Bloqueavel {...props} resetarAoFocar>
    <Match {...props} />
  </Bloqueavel>
);

const InteressadosTela = (props) => (
  <Bloqueavel {...props}>
    <Interessados {...props} />
  </Bloqueavel>
);

function BarraAbas({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { currentUser, rejected, chats, bloqueio } = useApp();
  const atual = state.routes[state.index].name;
  const pendentes = recebidosPendentes(currentUser, rejected, chats).length;

  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {ITENS.map((item) => {
        const ativa = atual === item.rota;
        const bloqueado = item.rota === 'Interessados' && !!bloqueio;

        const aoTocar = () => {
          if (ativa) navigation.navigate('Match'); // aba atual vira "Voltar"
          else if (bloqueado) navigation.navigate('Match'); // bloqueado: leva ao aviso no Match
          else navigation.navigate(item.rota);
        };

        return (
          <TouchableOpacity key={item.rota} style={styles.item} onPress={aoTocar}>
            <View>
              <Text style={styles.emoji}>{ativa ? '⬅️' : item.emoji}</Text>
              {!ativa && bloqueado && (
                <View style={[styles.badge, styles.badgeBloqueio]}>
                  <Text style={styles.badgeText}>✕</Text>
                </View>
              )}
              {!ativa && !bloqueado && item.rota === 'Interessados' && pendentes > 0 && (
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
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BarraAbas {...props} />}
    >
      <Tab.Screen name="Match" component={MatchTela} />
      <Tab.Screen name="Interessados" component={InteressadosTela} />
      <Tab.Screen name="Anuncios" component={Ads} />
      <Tab.Screen name="Perfil" component={Profile} />
      <Tab.Screen name="Chats" component={Chats} />
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
  label: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 2 },
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
  badgeBloqueio: { backgroundColor: '#E53935' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});