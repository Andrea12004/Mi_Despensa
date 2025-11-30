import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { database } from "../config/fb";

// Voz: TTS (texto a voz)
import * as Speech from "expo-speech";
// Reconocimiento de voz (STT)
import * as SpeechRec from "expo-speech-recognition";

export default function SugerirRecetas() {
  const [productos, setProductos] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [query, setQuery] = useState("");

  // estados de asistente de voz
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const transcriptRef = useRef("");
  transcriptRef.current = transcript;

  // -------------------------------------------------------------
  // 🔥 LIMPIAR INGREDIENTES
  // -------------------------------------------------------------
  const limpiarIngrediente = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .replace(/[0-9]/g, "")
      .replace(/\b(tb|tsp|cup|cups|sm|lg|ml|gr|g|kg|tbsp|oz)\b/gi, "")
      .replace(/\b(cucharadas?|cucharadita|taza|tazas|gramos?)\b/gi, "")
      .replace(/[^a-záéíóúñ ]/gi, "")
      .trim()
      .split(" ")
      .filter((word) => word.length > 2)
      .join(" ");
  };

  // -------------------------------------------------------------
  // 🤖 COINCIDENCIA INTELIGENTE
  // -------------------------------------------------------------
  const coincide = (userIng, recetaIng) => {
    if (!userIng || !recetaIng) return false;
    return recetaIng.includes(userIng) || userIng.includes(recetaIng);
  };

  // -------------------------------------------------------------
  // 🌍 TRADUCIR CON DeepL Proxy (ES → EN o EN → ES)
  // -------------------------------------------------------------
  const traducir = async (texto, target = "EN") => {
    try {
      const res = await fetch("https://api-free.deepl-proxy.net/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto, target_lang: target.toUpperCase() }),
      });

      const data = await res.json();
      return data?.translated_text || texto;
    } catch (e) {
      console.log("Error DeepL:", e);
      return texto;
    }
  };

  // -------------------------------------------------------------
  // 🔥 Cargar productos desde Firebase
  // -------------------------------------------------------------
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const snapshot = await getDocs(collection(database, "productos"));
        let productosData = snapshot.docs.map((doc) => ({
          es: limpiarIngrediente(doc.data().name?.toLowerCase().trim() || ""),
          en: "",
        }));

        productosData = await Promise.all(
          productosData.map(async (prod) => {
            try {
              const en = limpiarIngrediente(await traducir(prod.es, "EN"));
              return { ...prod, en };
            } catch {
              return { ...prod, en: prod.es };
            }
          })
        );

        setProductos(productosData);
      } catch (error) {
        console.log("Error productos:", error);
      }
    };

    cargarProductos();
  }, []);

  // -------------------------------------------------------------
  // 🍳 Buscar recetas por un solo ingrediente
  // -------------------------------------------------------------
  const buscarRecetas = async (triggeredByVoice = false) => {
    // si fue activado por voz y hay transcript, usarlo
    const q = triggeredByVoice && transcript ? transcript : query;
    if (!q) return;
    setCargando(true);

    try {
      const apiKey = "/GWtMPkp3jWA9dm02IJb0w==s8NZkpnntf1PP7wB";
      const recetasSet = new Map();
      const ingredienteBuscado = {
        es: limpiarIngrediente(q),
        en: await traducir(q, "EN"),
      };

      const res = await fetch(
        `https://api.api-ninjas.com/v1/recipe?query=${encodeURIComponent(
          ingredienteBuscado.en
        )}`,
        { headers: { "X-Api-Key": apiKey } }
      );

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setRecetas([]);
        setCargando(false);
        Speech.speak("No se encontraron recetas. Intenta con otro ingrediente.");
        return;
      }

      for (let item of data) {
        const ingredientesAPI = item.ingredients?.split("|") || [];
        const ingredientesLimpiosEN = ingredientesAPI.map((i) =>
          limpiarIngrediente(i.toLowerCase())
        );

        const disponibles = [];
        const faltantes = [];

        for (let ing of ingredientesLimpiosEN) {
          const tiene = productos.some((p) => coincide(p.en, ing));
          if (tiene) disponibles.push(ing);
          else faltantes.push(ing);
        }

        const tituloES = await traducir(item.title, "ES");
        const instruccionesES = await traducir(item.instructions, "ES");

        recetasSet.set(item.title, {
          title: tituloES,
          instructions: instruccionesES,
          query: ingredienteBuscado.es,
          disponibles,
          faltantes,
        });
      }

      setRecetas(Array.from(recetasSet.values()));
      Speech.speak(`${recetasSet.size} recetas encontradas para ${ingredienteBuscado.es}.`);
    } catch (e) {
      console.log("Error recetas:", e);
      setRecetas([]);
      Speech.speak("Ocurrió un error buscando recetas.");
    } finally {
      setCargando(false);
    }
  };

  // -------------------------------------------------------------
  // ------------ ASISTENTE DE VOZ (expo-speech-recognition) -----
  // -------------------------------------------------------------
  useEffect(() => {
    // inicializar permisos y disponibilidad
    const initSpeech = async () => {
      try {
        // isAvailableAsync / requestPermissionsAsync son nombres comunes en libs de Expo
        const available = SpeechRec.isAvailableAsync
          ? await SpeechRec.isAvailableAsync()
          : true;
        setSpeechAvailable(available);

        if (!available) {
          console.log("Speech recognition not available on this device.");
          return;
        }

        if (SpeechRec.requestPermissionsAsync) {
          await SpeechRec.requestPermissionsAsync();
        } else if (SpeechRec.requestAuthorization) {
          // algunos paquetes usan este nombre
          await SpeechRec.requestAuthorization();
        }

        // intentar limpiar listeners previos si existen
        if (SpeechRec.removeAllListeners) {
          SpeechRec.removeAllListeners();
        }
        // Si la librería expone un onSpeechResults, nos suscribimos:
        if (SpeechRec.addListener) {
          // handler para resultados intermedios/finales
          SpeechRec.addListener("onSpeechResults", ({ value }) => {
            // muchos módulos envían { value: ["texto reconocido"] }
            const text = Array.isArray(value) ? value.join(" ") : value || "";
            setTranscript(text);
            setQuery(text);
          });
          // algunos módulos usan 'onSpeechPartialResults'
          SpeechRec.addListener("onSpeechPartialResults", ({ value }) => {
            const text = Array.isArray(value) ? value.join(" ") : value || "";
            setTranscript(text);
            setQuery(text);
          });
        }
      } catch (e) {
        console.log("Error init speech:", e);
      }
    };

    initSpeech();

    // cleanup on unmount
    return () => {
      try {
        if (SpeechRec.removeAllListeners) SpeechRec.removeAllListeners();
      } catch (e) {}
    };
  }, []);

  const startListening = async () => {
    if (!speechAvailable) {
      Alert.alert("Micrófono", "El reconocimiento de voz no está disponible en este dispositivo.");
      return;
    }

    try {
      setTranscript("");
      setListening(true);

      // Algunos paquetes exponen startListening/stopListening
      if (SpeechRec.startListening) {
        await SpeechRec.startListening();
      } else if (SpeechRec.start) {
        // alternativa
        await SpeechRec.start();
      } else {
        // fallback: algunos paquetes requieren un objeto con opciones
        if (SpeechRec.startAsync) {
          await SpeechRec.startAsync({ language: "es-ES", continuous: false });
        }
      }

      Speech.speak("Te escucho. Di el ingrediente ahora.");
    } catch (e) {
      console.log("Error startListening:", e);
      setListening(false);
      Speech.speak("No pude activar el micrófono.");
    }
  };

  const stopListening = async (autoSearch = true) => {
    try {
      if (SpeechRec.stopListening) {
        await SpeechRec.stopListening();
      } else if (SpeechRec.stop) {
        await SpeechRec.stop();
      } else if (SpeechRec.stopAsync) {
        await SpeechRec.stopAsync();
      }
    } catch (e) {
      console.log("Error stopListening:", e);
    } finally {
      setListening(false);
      // si tenemos transcript lo dejamos en query y buscamos
      if (transcriptRef.current && transcriptRef.current.trim().length > 0 && autoSearch) {
        // small delay to ensure final result is set
        setTimeout(() => buscarRecetas(true), 300);
      } else {
        Speech.speak("Detenido.");
      }
    }
  };

  const speakText = (text) => {
    if (!text) return;
    Speech.speak(text, { language: "es-ES" });
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5DC" }}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            // limpiar transcript si el usuario escribe manualmente
            setTranscript("");
          }}
          placeholder="Buscar por ingrediente..."
          placeholderTextColor="#fff"
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => buscarRecetas(false)}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Controles de voz */}
      <View style={{ padding: 12, backgroundColor: "#2E8B57", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 6 }}>
            Asistente de voz
          </Text>
          <Text style={{ color: "#fff" }}>
            {speechAvailable ? (listening ? "Escuchando..." : "Listo para escuchar") : "Reconocimiento no disponible"}
          </Text>
          <Text style={{ color: "#fff", marginTop: 6, fontStyle: "italic" }}>
            {transcript ? `Transcripción: ${transcript}` : "Presiona el micrófono y di el ingrediente"}
          </Text>
        </View>

        <View style={{ marginLeft: 10, flexDirection: "column" }}>
          <TouchableOpacity
            onPress={() => (listening ? stopListening(true) : startListening())}
            style={{
              padding: 10,
              backgroundColor: listening ? "#8B0000" : "#365c36",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>{listening ? "Detener" : "Micrófono"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => speakText(transcript || (query ? `Buscar recetas con ${query}` : "Di un ingrediente primero"))}
            style={{ padding: 10, backgroundColor: "#3CA374", borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Reproducir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {cargando && <ActivityIndicator size="large" color="#DC143C" />}

        {recetas.map((item, index) => (
          <View key={index} style={styles.recipeCard}>
            <TouchableOpacity
              onPress={() =>
                setRecetaSeleccionada(
                  recetaSeleccionada === item.title ? null : item.title
                )
              }
            >
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <Text style={styles.recipeQuery}>🔍 Encontrada con: {item.query}</Text>
            </TouchableOpacity>

            {recetaSeleccionada === item.title && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.hasText}>✔ Ingredientes que tienes:</Text>
                {item.disponibles.map((ing, i) => (
                  <Text key={i} style={styles.hasIngredient}>• {ing}</Text>
                ))}

                <Text style={styles.missingText}>❗ Ingredientes que te faltan:</Text>
                {item.faltantes.map((ing, i) => (
                  <Text key={i} style={styles.missingIngredient}>• {ing}</Text>
                ))}

                <Text style={styles.instructionsHeader}>🧾 Instrucciones:</Text>
                <Text style={styles.instructionsText}>{item.instructions}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 16,
    backgroundColor: "#2E8B57",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#3CA374",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#365c36",
    borderRadius: 8,
  },
  recipeCard: {
    marginBottom: 15,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#FFFDF6",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  recipeTitle: {
    fontSize: 18,
    color: "#2E8B57",
    textAlign: "center",
    fontWeight: "bold",
  },
  recipeQuery: {
    textAlign: "center",
    color: "#555",
    marginTop: 4,
  },
  hasText: {
    color: "#2E8B57",
    fontWeight: "bold",
  },
  hasIngredient: {
    marginLeft: 10,
    color: "#2E8B57",
  },
  missingText: {
    marginTop: 10,
    color: "#DC143C",
    fontWeight: "bold",
  },
  missingIngredient: {
    marginLeft: 10,
    color: "#DC143C",
  },
  instructionsHeader: {
    marginTop: 10,
    fontWeight: "bold",
  },
  instructionsText: {
    marginLeft: 10,
    color: "#333",
  },
});