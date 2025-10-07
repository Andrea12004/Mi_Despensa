import * as React from "react";
import * as RN from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import EmojiPicker from "rn-emoji-keyboard";

import { database} from "../config/fb";
import { collection, addDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { scheduleProductNotifications } from "../services/notification";
import { Picker } from '@react-native-picker/picker';
import ImageService from '../services/ImageService';

export default function Home() {
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

    const onSend = async() => {
        if (isSaving) return;

         if (!newItem.name || !newItem.category || !newItem.quantity || !newItem.expire_date) {
            RN.Alert.alert('Campos incompletos', 'Por favor completa nombre, categoría , cantidad, fecha de vencimiento');
            return;
        }
         setIsSaving(true);

         const imagenResultado = await ImageService.obtenerImagenProducto(
                newItem.name, 
                newItem.category
            );
            
            // Agregar URL de imagen al producto
            const productoConImagen = {
                ...newItem,
                imageUrl: imagenResultado.url
            };

            // Guardar en Firebase
        const docRef = await addDoc(collection(database, "productos"), newItem);
        
        // Programar notificaciones si tiene fecha de vencimiento
        if (newItem.expire_date) {
            await scheduleProductNotifications({
                ...newItem,
                id: docRef.id
            });
        }


        navigation.goBack();

    }

    return (
        <RN.ScrollView contentContainerStyle={styles.container}>
            <RN.Text style={styles.title}>Agregar Producto</RN.Text>
            <RN.Text style={styles.subtitle}>Ingresa los datos del producto</RN.Text>

            <RN.TextInput
                style={styles.inputContainer}
                placeholder="Nombre del producto *"
                value={newItem.name}
                onChangeText={(text) => setNewItem({...newItem, name: text})}
            />

            <RN.View style={styles.inputContainer}>
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

            <RN.TextInput
                style={styles.inputContainer}
                placeholder="Cantidad *"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                keyboardType="numeric"
            />

            <RN.TouchableOpacity
                style={[styles.inputContainer, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
            >
                <RN.Text style={{ color: newItem.expire_date ? '#222' : '#888', fontSize: 16 }}>
                    {newItem.expire_date ? `Vence: ${newItem.expire_date}` : 'Fecha de vencimiento *'}
                </RN.Text>
            </RN.TouchableOpacity>
            
            {showDatePicker && (
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
        backgroundColor: "#ffffff",
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});