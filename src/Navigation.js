import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "./config/fb";

import Home from "./screens/Home";
import Add from "./screens/Add";
import Recipes from "./screens/Recipes";
import Login from "./screens/Login"; // 🆕

const Stack = createNativeStackNavigator();

function MyStack({ user }) {
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null; 
  }

  return (
    <NavigationContainer>
      {user ? (
        <MyStack user={user} />
      ) : (
        <Login onLogin={(loggedUser) => setUser(loggedUser)} />
      )}
    </NavigationContainer>
  );
}