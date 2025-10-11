import * as React from "react";
import * as RN from "react-native";

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { PermissionsAndroid, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { useNavigation } from "@react-navigation/native";
import { database } from "../config/fb";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Products from "../components/Products";
import { 
    requestNotificationPermissions, } from "../services/notification";

export default function Home() {
    const [products, setProducts] = React.useState([]);
    const navigation = useNavigation();
    // Estado del asistente de voz
    const [transcript, setTranscript] = React.useState('');
    const [listening, setListening] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Obtener resultados de reconocimiento
    useSpeechRecognitionEvent('onRecognitionResult', (event) => {
        if (event && event.value) {
            setTranscript(event.value.transcript || '');
        }
    });
    useSpeechRecognitionEvent('onRecognitionError', (event) => {
        setError(event);
        setListening(false);
    });
    useSpeechRecognitionEvent('onRecognitionStart', () => {
        setListening(true);
        setError(null);
    });
    useSpeechRecognitionEvent('onRecognitionEnd', () => {
        setListening(false);
    });

    const requestMicrophonePermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Permiso de micrófono',
                    message: 'La aplicación necesita acceso al micrófono para reconocer tu voz.',
                    buttonNeutral: 'Preguntar luego',
                    buttonNegative: 'Cancelar',
                    buttonPositive: 'Aceptar',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    // Por ahora solo funciona en web
    const recognitionRef = useRef(null);
    const isWeb = Platform.OS === 'web';

    const startListening = async () => {
        setTranscript('');
        setError(null);
        if (isWeb) {
            if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                setError({ message: 'Tu navegador no soporta reconocimiento de voz.' });
                return;
            }
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                let text = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    text += event.results[i][0].transcript;
                }
                setTranscript(text);
            };
            recognition.onerror = (event) => {
                setError({ message: event.error });
            };
            recognition.onstart = () => {
                setListening(true);
            };
            recognition.onend = () => {
                setListening(false);
            };
            recognitionRef.current = recognition;
            recognition.start();
        } else {
            const hasPermission = await requestMicrophonePermission();
            if (!hasPermission) {
                setError({ message: 'Permiso de micrófono denegado.' });
                return;
            }
            try {
                await ExpoSpeechRecognitionModule.start({
                    language: 'es-ES',
                    continuous: true,
                });
            } catch (e) {
                setError(e);
            }
        }
    };

    const stopListening = async () => {
        if (isWeb && recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
            setListening(false);
        } else {
            try {
                await ExpoSpeechRecognitionModule.stop();
            } catch (e) {
                setError(e);
            }
        }
    };

    // Solicitar permisos al cargar la app
    React.useEffect(() => {
        requestNotificationPermissions();
    }, []);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <RN.TouchableOpacity
                    style={{
                        marginRight: 10,
                        backgroundColor: '#FF6347',
                        borderRadius: 6,
                        paddingVertical: 6,
                        paddingHorizontal: 16,
                    }}
                    onPress={() => navigation.navigate("Add")}
                >
                    <RN.Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add</RN.Text>
                </RN.TouchableOpacity>
            )
        });
    }, [navigation]);

    React.useEffect(() => {
        const collectionRef = collection(database, "productos");
        const q = query(collectionRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, async querySnapshot => {
            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                category: doc.data().category,
                quantity: doc.data().quantity,
                expire_date: doc.data().expire_date,
            }));
            
            setProducts(productsData);
            
        });
        
        return unsubscribe;
    }, []);

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <RN.Text style={styles.header}>Inventario</RN.Text>
            {/* Voice Assistant UI */}
            <RN.View style={{ alignItems: 'center', marginBottom: 16 }}>
                <RN.TouchableOpacity
                    onPress={listening ? stopListening : startListening}
                    style={{
                        backgroundColor: listening ? '#FF6347' : '#eee',
                        borderRadius: 32,
                        padding: 16,
                        marginBottom: 8,
                        borderWidth: 2,
                        borderColor: '#FF6347',
                    }}
                >
                    <RN.Text style={{ fontSize: 32 }}>
                        🎤
                    </RN.Text>
                </RN.TouchableOpacity>
                <RN.Text style={{ color: '#333', fontSize: 16, minHeight: 24 }}>
                    {listening ? 'Escuchando...' : 'Toca el micrófono para hablar'}
                </RN.Text>
                <RN.View style={{
                    backgroundColor: '#fff7f3',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 8,
                    minHeight: 48,
                    width: '90%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#FF6347',
                }}>
                    <RN.Text style={{ color: '#FF6347', fontSize: 20, textAlign: 'center' }}>
                        {transcript || 'Aquí aparecerá el texto reconocido...'}
                    </RN.Text>
                </RN.View>
                {error ? (
                    <RN.Text style={{ color: 'red', fontSize: 14 }}>{error.message || error.toString()}</RN.Text>
                ) : null}
            </RN.View>
            {products.length === 0 ? (
                <RN.View style={{ padding: 32, alignItems: 'center' }}>
                    <RN.Text style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>
                        No hay productos en tu despensa.{'\n'}¡Agrega tu primer producto!
                    </RN.Text>
                </RN.View>
            ) : (
                products.map(product => <Products key={product.id} {...product} />)
            )}
        </RN.ScrollView>
    );
}

const styles = RN.StyleSheet.create({
    header: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF6347',
        textAlign: 'center',
        marginVertical: 24,
        letterSpacing: 2,
    },
});