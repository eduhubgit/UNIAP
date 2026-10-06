import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppProvider, useApp } from "./context/AppContext";
import { colors } from "./theme";
import Welcome from "./screens/Welcome";
import Register from "./screens/Register";
import Register2 from "./screens/Register2";
import ApStep1 from "./screens/ApStep1";
import ApStep2 from "./screens/ApStep2";
import Main from "./screens/Main";
import Settings from "./screens/Settings";
import Support from "./screens/Support";
import Chat from "./screens/Chat";

const Stack = createNativeStackNavigator();

function Rotas() {
  const { carregado, currentUser } = useApp();

  if (!carregado) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={currentUser ? "Main" : "Welcome"}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Rotas />
    </AppProvider>
  );
}
