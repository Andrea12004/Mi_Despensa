import * as React from "react";
import * as RN from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useRef } from 'react';
import { auth } from "../config/fb";
import { database } from "../config/fb";
import { collection, addDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { scheduleProductNotifications } from "../services/emailService";
import { Picker } from '@react-native-picker/picker';
import ImageService from '../services/ImageService';

export default function Add() {
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const navigation = useNavigation();
    const [isSaving, setIsSaving] = React.useState(false);
    const [newItem, setNewItem] = React.useState({
        name: '',
        category: '',
        quantity: '',
        expire_date: '',
        imageUrl: '',
        createdAt: new Date(),
    });
    
    // estados para reconocimiento de voz (web)
    const [listeningField, setListeningField] = React.useState(null);
    const [srError, setSrError] = React.useState(null);
    const recognitionRef = useRef(null);
    const isWeb = Platform.OS === 'web';
    const [listeningCommand, setListeningCommand] = React.useState(false);
    const [lastRecognizedText, setLastRecognizedText] = React.useState('');
    const listeningFieldRef = useRef(null);
    const listeningCommandRef = useRef(false);

    React.useEffect(() => { listeningFieldRef.current = listeningField; }, [listeningField]);
    React.useEffect(() => { listeningCommandRef.current = listeningCommand; }, [listeningCommand]);

    // Funciones para reconocimiento de voz
    const categoryOptions = [
        'Frutas','Verduras','Lácteos','Carnes','Granos','Panadería','Bebidas','Condimentos','Congelados','Dulces','Enlatados','Otros'
    ];

    const normalize = (s) => typeof s === 'string' ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim() : '';

    const matchCategory = (text) => {
        const n = normalize(text);
        for (const opt of categoryOptions) {
            if (normalize(opt) === n) return opt;
        }
        for (const opt of categoryOptions) {
            if (n.includes(normalize(opt))) return opt;
        }
        for (const opt of categoryOptions) {
            if (normalize(opt).startsWith(n) || n.startsWith(normalize(opt).slice(0,3))) return opt;
        }
        return null;
    };

    const parseQuantity = (text) => {
        if (!text) return '';
        const m = text.match(/\d+/);
        if (m) return m[0];
        const map = { 'uno': '1','dos':'2','tres':'3','cuatro':'4','cinco':'5','seis':'6','siete':'7','ocho':'8','nueve':'9','diez':'10' };
        const parts = normalize(text).split(/\s+/);
        for (const p of parts) if (map[p]) return map[p];
        return '';
    };

    const createWebRecognition = () => {
        if (!isWeb) return null;
        const SpeechRecognition = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
        if (!SpeechRecognition) return null;
        try {
            const rec = new SpeechRecognition();
            rec.lang = 'es-ES';
            rec.interimResults = false;
            rec.continuous = false;
            rec.onresult = (e) => {
                const text = e?.results?.[0]?.[0]?.transcript || '';
                setLastRecognizedText(text);
                const currentListeningCommand = listeningCommandRef.current;
                const currentListeningField = listeningFieldRef.current;
                if (currentListeningCommand) {
                    handleCommand(text);
                    return;
                }
                if (currentListeningField === 'category') {
                    const matched = matchCategory(text);
                    if (matched) {
                        setNewItem(prev => ({ ...prev, category: matched }));
                    } else {
                        setNewItem(prev => ({ ...prev, category: text }));
                    }
                    return;
                }
                if (currentListeningField === 'quantity') {
                    const qty = parseQuantity(text);
                    if (qty) {
                        setNewItem(prev => ({ ...prev, quantity: qty }));
                    } else {
                        setNewItem(prev => ({ ...prev, quantity: text }));
                    }
                    return;
                }
                if (currentListeningField) {
                    setNewItem(prev => ({ ...prev, [currentListeningField]: text }));
                    return;
                }
                setNewItem(prev => ({ ...prev, name: text }));
            };
            rec.onerror = (ev) => {
                setSrError(ev?.error || ev?.message || JSON.stringify(ev));
            };
            rec.onend = () => {
                setListeningField(null);
                setListeningCommand(false); 
            };
            return rec;
        } catch (e) {
            console.warn('[sr] createWebRecognition failed', e && (e.message || e));
            return null;
        }
    };

    const startListeningFor = async (field) => {
        setSrError(null);
        if (!isWeb) {
            setSrError('Reconocimiento de voz disponible sólo en la web por ahora.');
            return;
        }
        setListeningField(field);
        if (!recognitionRef.current) recognitionRef.current = createWebRecognition();
        try {
            recognitionRef.current && recognitionRef.current.start();
        } catch (e) {
            setSrError(e?.message || String(e));
            setListeningField(null);
        }
    };

    const stopListeningFor = async () => {
        if (!isWeb) return;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
            recognitionRef.current = null;
        }
        setListeningField(null);
    };

    const startCommandListening = async () => {
        setSrError(null);
        if (!isWeb) {
            setSrError('Reconocimiento de comandos disponible sólo en la web por ahora.');
            return;
        }
        setListeningCommand(true);
        if (!recognitionRef.current) recognitionRef.current = createWebRecognition();
        try {
            recognitionRef.current && recognitionRef.current.start();
        } catch (e) {
            setSrError(e?.message || String(e));
            setListeningCommand(false);
        }
    };

    const stopCommandListening = async () => {
        if (!isWeb) return;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
            recognitionRef.current = null;
        }
        setListeningCommand(false);
    };

    const handleCommand = (rawText) => {
        const text = (rawText || '').toLowerCase().trim();
        if (!text) return;
        if (text.includes('guardar') && text.includes('producto')) {
            RN.Alert.alert('Comando detectado', `Ejecutando: ${text}`);
            onSend();
            setListeningCommand(false);
            return;
        }
        if (text.includes('limpiar') || text.includes('reset') || text.includes('vaciar')) {
            setNewItem({ name: '', category: '', quantity: '', expire_date: '', imageUrl: '', createdAt: new Date() });
            RN.Alert.alert('Comando detectado', `Campos limpiados`);
            setListeningCommand(false);
            return;
        }
        RN.Alert.alert('Comando no reconocido', `"${rawText}"`);
        setListeningCommand(false);
    };

    // 🆕 FUNCIÓN CORREGIDA CON userId
    const onSend = async() => {
        if (isSaving) return;

        if (!newItem.name || !newItem.category || !newItem.quantity || !newItem.expire_date) {
            RN.Alert.alert('Campos incompletos', 'Por favor completa nombre, categoría, cantidad, fecha de vencimiento');
            return;
        }

        setIsSaving(true);

        try {
            // 🔍 Verificar que haya usuario autenticado
            const user = auth.currentUser;
            if (!user) {
                RN.Alert.alert('Error', 'No hay usuario autenticado');
                setIsSaving(false);
                return;
            }

            console.log('👤 Usuario actual:', user.email, user.uid);

            // Obtener imagen del producto
            const imagenResultado = await ImageService.obtenerImagenProducto(
                newItem.name, 
                newItem.category
            );

            // ✅ CREAR PRODUCTO CON userId
            const productoConImagen = {
                name: newItem.name,
                category: newItem.category,
                quantity: newItem.quantity,
                expire_date: newItem.expire_date,
                imageUrl: imagenResultado.url,
                userId: user.uid,           // ← IMPORTANTE
                createdAt: new Date(),      // ← Timestamp actual
            };

            console.log('💾 Guardando producto:', productoConImagen);

            // Guardar en Firestore
            const docRef = await addDoc(collection(database, "productos"), productoConImagen);
            
            console.log('✅ Producto guardado con ID:', docRef.id);

            // Programar notificaciones si tiene fecha de vencimiento
            if (newItem.expire_date) {
                await scheduleProductNotifications({
                    ...newItem,
                    id: docRef.id
                });
            }

            // Regresar a la pantalla anterior
            navigation.goBack();

        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            RN.Alert.alert('Error', 'No se pudo guardar el producto: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <RN.ScrollView contentContainerStyle={styles.container}>
            <RN.Text style={styles.title}>Agregar Producto</RN.Text>
            <RN.Text style={styles.subtitle}>Ingresa los datos del producto</RN.Text>
            
            <RN.View style={styles.commandContainer}>
                {isWeb ? (
                    <RN.TouchableOpacity
                        onPress={() => listeningCommand ? stopCommandListening() : startCommandListening()}
                        style={[styles.commandButton, listeningCommand && styles.commandButtonActive]}
                    >
                        <RN.Text style={styles.commandButtonText}>
                            {listeningCommand ? 'Escuchando...' : 'Ejecutar Asistente'}
                        </RN.Text>
                    </RN.TouchableOpacity>
                ) : (
                    <RN.Text style={{ color: '#666', fontStyle: 'italic' }}>Asistente por voz disponible sólo en la web</RN.Text>
                )}
            </RN.View>

            <RN.View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}> 
                <RN.TextInput
                    style={{ flex: 1 }}
                    placeholder="Nombre del producto *"
                    value={newItem.name}
                    onChangeText={(text) => setNewItem({...newItem, name: text})}
                />
                {isWeb ? (
                    <RN.TouchableOpacity
                        onPress={() => listeningField === 'name' ? stopListeningFor() : startListeningFor('name')}
                        style={{
                            marginLeft: 8,
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: listeningField === 'name' ? '#FF6347' : '#eee',
                        }}
                    >
                        <RN.Text style={{ fontSize: 18 }}>{listeningField === 'name' ? '⏺️' : '🎤'}</RN.Text>
                    </RN.TouchableOpacity>
                ) : (
                    <RN.View style={{ width: 40 }} />
                )}
            </RN.View>

            <RN.View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}> 
                <RN.View style={{ flex: 1 }}>
                    <Picker
                        selectedValue={newItem.category}
                        onValueChange={(value) => setNewItem({...newItem, category: value})}
                        style={{ height: 50 }}
                    >
                        <Picker.Item label="Selecciona una categoría *" value="" />
                        <Picker.Item label="Frutas" value="Frutas" />
                        <Picker.Item label="Verduras" value="Verduras" />
                        <Picker.Item label="Lácteos" value="Lácteos" />
                        <Picker.Item label="Carnes" value="Carnes" />
                        <Picker.Item label="Granos" value="Granos" />
                        <Picker.Item label="Panadería" value="Panadería" />
                        <Picker.Item label="Bebidas" value="Bebidas" />
                        <Picker.Item label="Condimentos" value="Condimentos" />
                        <Picker.Item label="Congelados" value="Congelados" />
                        <Picker.Item label="Dulces" value="Dulces" />
                        <Picker.Item label="Enlatados" value="Enlatados" />
                        <Picker.Item label="Otros" value="Otros" />
                    </Picker>
                </RN.View>
                {isWeb ? (
                    <RN.TouchableOpacity
                        onPress={() => listeningField === 'category' ? stopListeningFor() : startListeningFor('category')}
                        style={{
                            marginLeft: 8,
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: listeningField === 'category' ? '#FF6347' : '#eee',
                        }}
                    >
                        <RN.Text style={{ fontSize: 18 }}>{listeningField === 'category' ? '⏺️' : '🎤'}</RN.Text>
                    </RN.TouchableOpacity>
                ) : (
                    <RN.View style={{ width: 40 }} />
                )}
            </RN.View>

            <RN.View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                <RN.TextInput
                    style={{ flex: 1 }}
                    placeholder="Cantidad *"
                    value={newItem.quantity}
                    onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                    keyboardType="numeric"
                />
                {isWeb ? (
                    <RN.TouchableOpacity
                        onPress={() => listeningField === 'quantity' ? stopListeningFor() : startListeningFor('quantity')}
                        style={{
                            marginLeft: 8,
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: listeningField === 'quantity' ? '#FF6347' : '#eee',
                        }}
                    >
                        <RN.Text style={{ fontSize: 18 }}>{listeningField === 'quantity' ? '⏺️' : '🎤'}</RN.Text>
                    </RN.TouchableOpacity>
                ) : (
                    <RN.View style={{ width: 40 }} />
                )}
            </RN.View>

            <RN.TouchableOpacity
                style={[styles.inputContainer, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
            >
                <RN.Text style={{ color: newItem.expire_date ? '#222' : '#888', fontSize: 16 }}>
                    {newItem.expire_date ? `Vence: ${newItem.expire_date}` : 'Fecha de vencimiento *'}
                </RN.Text>
            </RN.TouchableOpacity>
            
            {showDatePicker && (
                Platform.OS === 'web' ? (
                    <div style={{ width: '100%' }}>
                        <input
                            type="date"
                            value={newItem.expire_date || ''}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                setShowDatePicker(false);
                                const val = e.target.value;
                                if (val) setNewItem({ ...newItem, expire_date: val });
                            }}
                            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd' }}
                        />
                    </div>
                ) : (
                    <DateTimePicker
                        value={newItem.expire_date ? new Date(newItem.expire_date) : new Date()}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                                const yyyy = selectedDate.getFullYear();
                                const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const dd = String(selectedDate.getDate()).padStart(2, '0');
                                setNewItem({ ...newItem, expire_date: `${yyyy}-${mm}-${dd}` });
                            }
                        }}
                    />
                )
            )}

            <RN.TouchableOpacity
                style={[styles.button, isSaving && styles.buttonDisabled]}
                onPress={onSend}
                disabled={isSaving}
            >
                {isSaving ? (
                    <RN.ActivityIndicator color="#fff" />
                ) : (
                    <RN.Text style={styles.buttonText}>Guardar Producto</RN.Text>
                )}
            </RN.TouchableOpacity>
        </RN.ScrollView>
    );
}

const styles = RN.StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5dce2",
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    inputContainer: {
        width: "100%",
        padding: 13,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    button: {
        width: "100%",
        backgroundColor: '#FF6347',
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginTop: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#CCC',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    commandContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    commandButton: {
        marginLeft: 0,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#2E8B57',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    commandButtonActive: {
        backgroundColor: '#FF6347',
        borderColor: '#e5533f',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
    },
    commandButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
});