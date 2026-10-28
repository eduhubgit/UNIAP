import React from 'react';
import { View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider, useApp } from './context/AppContext';
import { AnunciosProvider } from './context/AnunciosContext';
import { colors } from './theme';
import Welcome from './screens/Welcome';
import Register from './screens/Register';
import Register2 from './screens/Register2';
import ApStep1 from './screens/ApStep1';
import ApStep2 from './screens/ApStep2';
import Main from './screens/Main';
import Settings from './screens/Settings';
import Support from './screens/Support';
import Chat from './screens/Chat';
import NovoAnuncio from './screens/NovoAnuncio';

const Stack = createNativeStackNavigator();

// No Android o app desenhava por baixo da barra do celular (hora, bateria, câmera).
// Esta moldura empurra tudo para baixo dela. No iPhone o SafeAreaView das telas já resolve.
function Moldura({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'android' ? insets.top : 0,
      }}
    >
      <StatusBar barStyle="dark-content" />
      {children}
    </View>
  );
}

function Rotas() {
  const { carregado, currentUser } = useApp();

  if (!carregado) {
    return (
      <Moldura>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={currentUser ? 'Main' : 'Welcome'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Register2" component={Register2} />
          <Stack.Screen name="ApStep1" component={ApStep1} />
          <Stack.Screen name="ApStep2" component={ApStep2} />
          <Stack.Screen name="Main" component={Main} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="Support" component={Support} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="NovoAnuncio" component={NovoAnuncio} />
        </Stack.Navigator>
      </NavigationContainer>
    </Moldura>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AnunciosProvider>
          <Rotas />
        </AnunciosProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}