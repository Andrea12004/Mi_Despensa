import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Font from "expo-font";

export default function SugerirRecetas() {
  const [productos, setProductos] = useState(["arroz", "leche", "pollo", "chocolate"]);
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

  const traducciones = {
    arroz: "rice",
    leche: "milk",
    pollo: "chicken",
    huevo: "egg",
    huevos: "eggs",
    pan: "bread",
    manzana: "apple",
    carne: "beef",
    pescado: "fish",
    tomate: "tomato",
    papa: "potato",
    papas: "potatoes",
    cebolla: "onion",
    ajo: "garlic",
    maíz: "corn",
    frijol: "beans",
    lentejas: "lentils",
    azúcar: "sugar",
    sal: "salt",
    chocolate: "chocolate",
    queso: "cheese",
    yogurt: "yogurt",
    mantequilla: "butter",
    aceite: "oil",
    harina: "flour",
    café: "coffee",
  };

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        Montserrat: require("../../assets/fonts/Montserrat-Bold.ttf"),
        Raleway: require("../../assets/fonts/Raleway-Regular.ttf"),
        Nunito: require("../../assets/fonts/Nunito-Bold.ttf"),
      });
      setFontsLoaded(true);
    };
    loadFonts();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    const obtenerRecetas = async () => {
      setCargando(true);
      try {
        const apiKey = "/GWtMPkp3jWA9dm02IJb0w==s8NZkpnntf1PP7wB"; // ⚠️ Tu API key de API Ninjas
        const recetasSet = new Map();

        for (let prod of productos) {
          const prodTraducido = traducciones[prod] || prod;

          const res = await fetch(
            `https://api.api-ninjas.com/v1/recipe?query=${encodeURIComponent(prodTraducido)}`,
            { headers: { "X-Api-Key": apiKey } }
          );

          const data = await res.json();
          console.log(`🔹 Resultado para ${prodTraducido}:`, data);

          if (!Array.isArray(data) || data.length === 0) continue;

          data.forEach((item) => {
            recetasSet.set(item.title, {
              title: item.title,
              ingredients: item.ingredients?.split("|") || [],
              instructions: item.instructions || "Sin instrucciones",
              query: prod,
            });
          });
        }

        setRecetas(Array.from(recetasSet.values()));
      } catch (error) {
        console.error("Error al buscar recetas:", error);
        alert("Error al buscar recetas 😔");
      } finally {
        setCargando(false);
      }
    };

    obtenerRecetas();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9F8F4",
        }}
      >
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#F9F8F4" }}>
      <Text
        style={{
          fontFamily: "Montserrat",
          fontSize: 26,
          textAlign: "center",
          color: "#2E8B57",
          marginBottom: 20,
        }}
      >
        🍽️ Recetas posibles con tus productos
      </Text>

      {cargando ? (
        <ActivityIndicator size="large" color="#DC143C" />
      ) : recetas.length === 0 ? (
        <Text
          style={{
            fontFamily: "Raleway",
            textAlign: "center",
            marginTop: 40,
            color: "#DC143C",
            fontSize: 16,
          }}
        >
          No se encontraron recetas 🍳
        </Text>
      ) : (
        recetas.map((item, index) => (
          <View
            key={index}
            style={{
              marginBottom: 15,
              backgroundColor: "#FFFDF6",
              padding: 14,
              borderRadius: 15,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              borderLeftWidth: 6,
              borderLeftColor: "#2E8B57",
            }}
          >
            <TouchableOpacity
              onPress={() =>
                setRecetaSeleccionada(
                  recetaSeleccionada === item.title ? null : item.title
                )
              }
            >
              <Text
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 18,
                  color: "#2E8B57",
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: "Raleway",
                  fontSize: 14,
                  textAlign: "center",
                  color: "#555",
                }}
              >
                🔍 Encontrada con: {item.query}
              </Text>
            </TouchableOpacity>

            {recetaSeleccionada === item.title && (
              <View
                style={{
                  marginTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#E0E0E0",
                  paddingTop: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Nunito",
                    fontSize: 16,
                    color: "#333",
                    marginBottom: 6,
                  }}
                >
                  Ingredientes:
                </Text>
                {item.ingredients.map((ing, i) => (
                  <Text
                    key={i}
                    style={{
                      fontFamily: "Raleway",
                      fontSize: 14,
                      color: "#444",
                      marginLeft: 10,
                    }}
                  >
                    • {ing.trim()}
                  </Text>
                ))}

                <Text
                  style={{
                    fontFamily: "Nunito",
                    fontSize: 16,
                    color: "#333",
                    marginTop: 10,
                  }}
                >
                  Instrucciones:
                </Text>
                <Text
                  style={{
                    fontFamily: "Raleway",
                    fontSize: 14,
                    color: "#444",
                    marginLeft: 10,
                  }}
                >
                  {item.instructions}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
