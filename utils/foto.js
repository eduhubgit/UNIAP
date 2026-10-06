import * as ImagePicker from 'expo-image-picker';
import { mostrarAlerta } from './alerta';

// abre a galeria e devolve a foto como "data URI" (texto), que pode ser salva
export async function escolherFotoPerfil() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    mostrarAlerta('Permissão', 'Precisamos de acesso às suas fotos.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.3, // qualidade menor = arquivo menor para salvar
    base64: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
}
