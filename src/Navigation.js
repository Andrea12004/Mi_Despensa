import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import Home from "./screens/Home";
import Add from "./screens/Add";
import SugerirRecetas from "./screens/SugerirRecetas"; 

const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen 
        name="Add" 
        component={Add} 
        options={{ presentation: 'modal' }}
      />
       <Stack.Screen 
        name="SugerirRecetas" 
        component={SugerirRecetas} 
        options={{ title: "Sugerir Recetas" }} // 👈 título opcional
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}

