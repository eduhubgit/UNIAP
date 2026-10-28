import * as ImagePicker from 'expo-image-picker';
import { mostrarAlerta } from './alerta';

// abre a galeria e devolve até "limite" fotos já prontas para salvar
export async function escolherFotosAnuncio(limite) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    mostrarAlerta('Permissão', 'Precisamos de acesso às suas fotos.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: limite > 1,
    selectionLimit: limite,
    quality: 0.2, // qualidade baixa = arquivo pequeno
    base64: true,
  });
  if (result.canceled) return [];
  return result.assets
    .slice(0, limite)
    .map((a) => (a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri));
}