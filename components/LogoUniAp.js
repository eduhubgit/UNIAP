import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

export default function LogoUniAp({ tamanho = 32 }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Match')}>
      <Text style={{ fontSize: tamanho, fontWeight: 'bold', color: colors.primary }}>
        UNI <Text style={{ color: colors.pink }}>AP</Text>
      </Text>
    </TouchableOpacity>
  );
}