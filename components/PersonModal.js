import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';
import {
  labelPref,
  labelHorario,
  labelFaixa,
  reais,
  DESPESAS_LABEL,
} from '../utils/format';
import { calcularCompatibilidade } from '../utils/compat';

function Tag({ texto, comum }) {
  return (
    <View style={[styles.tag, comum && styles.tagComum]}>
      <Text style={[styles.tagText, comum && styles.tagTextComum]}>
        {comum ? '✓ ' : ''}
        {texto}
      </Text>
    </View>
  );
}

/*
  Props:
  - person: pessoa a exibir (null = fechado)
  - eu: seu perfil (para destacar o que vocês têm em comum)
  - botao (opcional): { label, onPress(person) -> { titulo, texto, botao?, aoFechar? } }
  - onClose
*/
export default function PersonModal({ person, eu, botao, onClose }) {
  const [resultado, setResultado] = useState(null);

  if (!person) return null;

  const score = person.score ?? calcularCompatibilidade(eu || {}, person);

  const fechar = () => {
    const depois = resultado?.aoFechar;
    setResultado(null);
    onClose();
    if (depois) setTimeout(depois, 300);
  };

  const apertou = () => {
    const r = botao.onPress(person);
    setResultado(r || { titulo: 'Pronto!', texto: '' });
  };

  const minhasPref = eu?.preferencias || [];
  const meusHor = eu?.horarios || [];
  const ap = person.ap;
  const chaves = Object.keys(DESPESAS_LABEL);
  const incluidas = ap ? chaves.filter((k) => ap.despesas?.[k]) : [];
  const naoIncluidas = ap ? chaves.filter((k) => !ap.despesas?.[k]) : [];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={fechar}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <View>
              <Image source={{ uri: person.foto }} style={styles.foto} />
              <TouchableOpacity style={styles.fechar} onPress={fechar}>
                <Text style={styles.fecharText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.compat}>
                <Text style={styles.compatText}>💜 {score}% compatível</Text>
              </View>
            </View>

            <View style={styles.corpo}>
              <Text style={styles.nome}>
                {person.nome}, {person.idade}
              </Text>
              <Text style={styles.sub}>
                📍 {person.cidade} • {person.curso}
              </Text>
              <Text style={styles.situacao}>
                {ap
                  ? '🏠 Tem apartamento e procura colega de quarto'
                  : '🔎 Procura apartamento para dividir'}
              </Text>

              <Text style={styles.secao}>Sobre</Text>
              <Text style={styles.texto}>{person.sobre}</Text>

              {!!person.observacoes && (
                <>
                  <Text style={styles.secao}>Observações</Text>
                  <Text style={styles.texto}>{person.observacoes}</Text>
                </>
              )}

              <Text style={styles.secao}>Rotina</Text>
              <View style={styles.tags}>
                {person.horarios.map((id) => (
                  <Tag
                    key={id}
                    texto={labelHorario(id)}
                    comum={meusHor.includes(id)}
                  />
                ))}
              </View>

              <Text style={styles.secao}>Preferências de convivência</Text>
              <View style={styles.tags}>
                {person.preferencias.map((id) => (
                  <Tag
                    key={id}
                    texto={labelPref(id)}
                    comum={minhasPref.includes(id)}
                  />
                ))}
              </View>
              <Text style={styles.legenda}>
                ✓ = você também tem essa característica
              </Text>

              <Text style={styles.secao}>
                {ap
                  ? 'Quanto cada morador pagaria'
                  : 'Quanto pode pagar (aluguel + contas)'}
              </Text>
              <Text style={styles.texto}>💰 {labelFaixa(person.faixa)}</Text>

              {ap && (
                <View style={styles.apBox}>
                  <Text style={styles.apTitulo}>🏠 Sobre o apartamento</Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 10 }}>
                    {(ap.fotos || []).map((uri) => (
                      <Image key={uri} source={{ uri }} style={styles.apFoto} />
                    ))}
                  </ScrollView>

                  <Text style={styles.apLinha}>📍 {ap.endereco}</Text>
                  <Text style={styles.apLinha}>
                    {ap.bairro} • {ap.cidade}
                  </Text>
                  {!!ap.referencia && (
                    <Text style={styles.apLinha}>🧭 {ap.referencia}</Text>
                  )}

                  <Text style={styles.apAluguel}>
                    Aluguel: {reais(ap.aluguel)}/mês
                  </Text>

                  <Text style={styles.apSub}>Incluso no aluguel</Text>
                  <Text style={styles.texto}>
                    {incluidas.length
                      ? incluidas
                          .map((k) => `✓ ${DESPESAS_LABEL[k]}`)
                          .join('   ')
                      : 'Nenhuma despesa incluída'}
                  </Text>

                  {naoIncluidas.length > 0 && (
                    <>
                      <Text style={styles.apSub}>Por conta dos moradores</Text>
                      <Text style={styles.texto}>
                        {naoIncluidas.map((k) => DESPESAS_LABEL[k]).join(', ')}
                      </Text>
                    </>
                  )}

                  {!!ap.outras && (
                    <>
                      <Text style={styles.apSub}>Outras despesas</Text>
                      <Text style={styles.texto}>{ap.outras}</Text>
                    </>
                  )}

                  {!!ap.adendos && (
                    <>
                      <Text style={styles.apSub}>Adendos</Text>
                      <Text style={styles.texto}>{ap.adendos}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* BOTÃO FIXO (só aparece se a tela pediu um) */}
          {botao && (
            <View style={styles.rodape}>
              <TouchableOpacity
                style={[styles.btn, botao.disabled && { opacity: 0.5 }]}
                disabled={botao.disabled}
                onPress={apertou}>
                <Text style={styles.btnText}>{botao.label}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* MENSAGEM DEPOIS DO CLIQUE (por cima do perfil, sem abrir outro modal) */}
        {resultado && (
          <View style={styles.camada}>
            <View style={styles.caixa}>
              <Text style={styles.caixaTitulo}>{resultado.titulo}</Text>
              <Image source={{ uri: person.foto }} style={styles.sucessoFoto} />
              <Text style={styles.caixaTexto}>{resultado.texto}</Text>
              <TouchableOpacity style={styles.btn} onPress={fechar}>
                <Text style={styles.btnText}>{resultado.botao || 'Ok'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  foto: { width: '100%', height: 280 },
  fechar: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fecharText: { color: '#fff', fontSize: 16 },
  compat: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  compatText: { color: '#fff', fontWeight: '700' },
  corpo: { padding: 18 },
  nome: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  sub: { color: colors.text, marginTop: 2 },
  situacao: { color: colors.pink, fontWeight: '700', marginTop: 8 },
  secao: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 18,
    marginBottom: 6,
  },
  texto: { color: colors.text, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#EFE6F7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagComum: { backgroundColor: colors.pink },
  tagText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  tagTextComum: { color: '#fff' },
  legenda: { color: colors.muted, fontSize: 12 },
  apBox: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  apTitulo: { fontSize: 17, fontWeight: 'bold', color: colors.primary },
  apFoto: { width: 200, height: 130, borderRadius: 12, marginRight: 10 },
  apLinha: { color: colors.text, marginBottom: 2 },
  apAluguel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  apSub: {
    fontWeight: '700',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 2,
  },
  rodape: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.bg,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: colors.pink,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  camada: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  caixa: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  caixaTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  caixaTexto: {
    color: colors.text,
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 21,
  },
  sucessoFoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginTop: 14,
  },
});
