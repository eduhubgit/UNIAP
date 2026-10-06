import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import TermsModal from './TermsModal';

export default function Header() {
  const navigation = useNavigation();
  const { currentUser, logout, chats } = useApp();
  const [menuAberto, setMenuAberto] = useState(false);
  const [termosAberto, setTermosAberto] = useState(false);

  const naoLidas = chats.reduce((soma, c) => soma + (c.naoLidas || 0), 0);

  const depoisDeFechar = (acao) => {
    setMenuAberto(false);
    setTimeout(acao, 350);
  };

  const sair = () => {
    setMenuAberto(false);
    const raiz = navigation.getParent() || navigation;
    raiz.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    logout();
  };

  const itens = [
    {
      emoji: '⚙️',
      label: 'Configurações',
      acao: () => depoisDeFechar(() => navigation.navigate('Settings')),
    },
    {
      emoji: '📄',
      label: 'Termos de Uso e Política de Privacidade',
      acao: () => depoisDeFechar(() => setTermosAberto(true)),
    },
    {
      emoji: '🛟',
      label: 'Suporte',
      acao: () => depoisDeFechar(() => navigation.navigate('Support')),
    },
  ];

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          UNI <Text style={{ color: colors.pink }}>AP</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chats')}>
          <Text style={styles.icon}>💬</Text>
          {naoLidas > 0 && (
            <View style={styles.bolinha}>
              <Text style={styles.bolinhaText}>{naoLidas}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}>
        <View style={styles.menuOverlay}>
          <View style={styles.drawer}>
            <Text style={styles.menuNome}>
              {currentUser?.nome || 'Visitante'}
            </Text>
            <Text style={styles.menuEmail}>{currentUser?.email}</Text>

            <View style={{ marginTop: 24 }}>
              {itens.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.item}
                  onPress={item.acao}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.item, styles.itemSair]}
              onPress={sair}>
              <Text style={styles.itemEmoji}>🚪</Text>
              <Text style={[styles.itemText, { color: colors.error }]}>
                Sair
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setMenuAberto(false)}
          />
        </View>
      </Modal>

      <TermsModal
        visible={termosAberto}
        onClose={() => setTermosAberto(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  icon: { fontSize: 26, color: colors.primary },
  logo: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  bolinha: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bolinhaText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width: '78%',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  menuNome: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  menuEmail: { color: colors.muted, marginTop: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  itemEmoji: { fontSize: 22, marginRight: 14 },
  itemText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '600' },
  itemSair: { marginTop: 30, borderBottomWidth: 0 },
});
