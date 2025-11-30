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

// Stack para usuarios AUTENTICADOS
function AuthenticatedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Inicio" 
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Add" component={Add} />
      <Stack.Screen name="Recetas" component={Recipes} />
    </Stack.Navigator>
  );
}

// Stack para usuarios NO AUTENTICADOS
function UnauthenticatedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={Login}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'SET_USER':
          console.log('🔄 SET_USER:', action.user ? 'CON USUARIO' : 'SIN USUARIO');
          return {
            ...prevState,
            user: action.user,
            isLoading: false,
          };
        case 'SET_LOADING':
          return {
            ...prevState,
            isLoading: action.isLoading,
          };
        default:
          return prevState;
      }
    },
    {
      user: null,
      isLoading: true,
    }
  );

  React.useEffect(() => {
    console.log('🔄 Iniciando listener de autenticación...');
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (currentUser) => {
        console.log('━'.repeat(60));
        if (currentUser) {
          console.log('✅ USUARIO AUTENTICADO');
          console.log('   📧 Email:', currentUser.email);
          console.log('   🆔 UID:', currentUser.uid);
          console.log('   ✅ Email verificado:', currentUser.emailVerified);
          dispatch({ type: 'SET_USER', user: currentUser });
        } else {
          console.log('❌ SIN USUARIO - Mostrando Login');
          dispatch({ type: 'SET_USER', user: null });
        }
        console.log('━'.repeat(60));
      },
      (error) => {
        console.error('❌ Error en auth listener:', error);
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        dispatch({ type: 'SET_USER', user: null });
      }
    );

    return () => {
      console.log('🛑 Limpiando listener de autenticación');
      unsubscribe();
    };
  }, []);

  // Debug del estado actual
  React.useEffect(() => {
    console.log('🔍 DEBUG - Estado de navegación:', {
      user: state.user ? state.user.email : 'null',
      isLoading: state.isLoading,
      isAuthenticated: !!state.user
    });
  }, [state.user, state.isLoading]);

  // Pantalla de carga
  if (state.isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f5f5dce2' 
      }}>
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
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Cargando Mi Despensa...
        </Text>
      </View>
    );
  }

  // Renderizado condicional
  const isAuthenticated = !!state.user;
  console.log('🎨 RENDERIZANDO:', isAuthenticated ? 'HOME (Autenticado)' : 'LOGIN (No autenticado)');

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
}