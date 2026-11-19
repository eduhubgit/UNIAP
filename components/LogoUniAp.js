import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LogoUniAp({ tamanho = 32 }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Match')}>
      <Image
        source={require('../assets/LOGONOME.png')}
        style={{
          width: tamanho * 3.6,
          height: tamanho * 1.3,
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}