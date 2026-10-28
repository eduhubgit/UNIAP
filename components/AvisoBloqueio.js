import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

/*
  tipo 'aceito': quem procura apê e já foi aceito em uma casa (botão "Ok")
  tipo 'limite': quem tem apê e atingiu o limite de vagas (botão "Ir para AP Infos")
*/
export default function AvisoBloqueio({ tipo, topo = 0, onOk, onIrApInfos }) {
  const aceito = tipo === 'aceito';

  return (
    <View style={[styles.camada, { top: topo }]}>
      <View style={styles.caixa}>
        <Text style={styles.emoji}>{aceito ? '🏠' : '🚪'}</Text>
        <Text style={styles.titulo}>
          {aceito ? 'Você já foi aceito(a) em uma casa!' : 'Limite de vagas atingido'}
        </Text>
        <Text style={styles.texto}>
          {aceito
            ? 'O sistema diz que você já está aceito na casa de alguém. Deseja realmente ver outras opções de AP? Cuidado com conflitos entre suas conversas.'
            : 'Você já atingiu o limite de vagas estipuladas por você. Se deseja abrir mais vagas, altere nas configurações das suas Infos do AP. Cuidado com o espaço de pessoas que cabem no seu apê.'}
        </Text>
        <TouchableOpacity style={styles.btn} onPress={aceito ? onOk : onIrApInfos}>
          <Text style={styles.btnText}>{aceito ? 'Ok' : 'Ir para AP Infos'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camada: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(246,238,252,0.98)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 50,
  },
  caixa: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  emoji: { fontSize: 44, textAlign: 'center' },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  texto: { color: colors.text, textAlign: 'center', marginVertical: 14, lineHeight: 22 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});