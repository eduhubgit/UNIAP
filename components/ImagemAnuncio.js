import React from 'react';
import { View, Text, Image } from 'react-native';
import { colors } from '../theme';
import { CATEGORIAS } from '../data/categorias';

export default function ImagemAnuncio({ anuncio, style, emojiSize = 44 }) {
  const foto = anuncio.fotos?.[0];
  if (foto) return <Image source={{ uri: foto }} style={style} />;

  const categoria = CATEGORIAS.find((c) => c.id === anuncio.categoria);
  return (
    <View
      style={[
        style,
        {
          backgroundColor: categoria?.cor || colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ fontSize: emojiSize }}>{anuncio.emoji || categoria?.emoji}</Text>
    </View>
  );
}