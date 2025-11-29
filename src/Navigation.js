import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "./config/fb";
import { ActivityIndicator, View, Text } from 'react-native';

import Home from "./screens/Home";
import Add from "./screens/Add";
import Recipes from "./screens/Recipes";
import Login from "./screens/Login";

const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Inicio" component={Home} />
      <Stack.Screen name="Add" component={Add} />
      <Stack.Screen name="Recetas" component={Recipes} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log('🔄 Iniciando listener de autenticación...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('✅ Usuario autenticado:', currentUser.email, currentUser.uid);
        console.log('   Proveedor:', currentUser.providerData[0]?.providerId);
        console.log('   Es anónimo:', currentUser.isAnonymous);
      } else {
        console.log('🚪 No hay usuario autenticado');
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      console.log('🛑 Deteniendo listener de autenticación');
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5dce2' }}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#365c36ff',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}>
          <Text style={{ fontSize: 60 }}>🏪</Text>
        </View>
        <ActivityIndicator size="large" color="#365c36ff" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Cargando Mi Despensa...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MyStack />
      ) : (
        <Login onLogin={(loggedUser) => setUser(loggedUser)} />
      )}
    </NavigationContainer>
  );
}