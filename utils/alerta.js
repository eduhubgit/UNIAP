import { Alert, Platform } from 'react-native';

export function mostrarAlerta(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

// pergunta de confirmação: chama onSim() só se a pessoa confirmar
export function confirmar(titulo, mensagem, onSim, textoSim = 'Confirmar') {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) onSim();
  } else {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: textoSim, style: 'destructive', onPress: onSim },
    ]);
  }
}