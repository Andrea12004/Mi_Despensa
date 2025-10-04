import * as React from "react";
import * as RN from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import EmojiPicker from "rn-emoji-keyboard";

import { database} from "../config/fb";
import { collection, addDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { scheduleProductNotifications } from "../services/notification";
import { Picker } from '@react-native-picker/picker';

export default function Home() {
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = React.useState(false);
    const [newItem, setNewItem] = React.useState({
        emoji: '🤑',
        name: '',
        category: '',
        quantity: '',
        expire_date: '',
        createdAt: new Date(),
    });

    const onSend = async() => {

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

    const handlePick = (emojiObject) => {
        setNewItem({...newItem, emoji: emojiObject.emoji});
    }
    return (
        <RN.View style = {styles.container}>
            <RN.Text style = {styles.title}>Ingresar producto a Mi Despensa</RN.Text>
            <RN.Text style = {styles.emoji} onPress={() => setIsOpen(true)}>{newItem.emoji}</RN.Text>
            <EmojiPicker
                onEmojiSelected={handlePick}
                open={isOpen}
                onClose={() => setIsOpen(false)}
            
            />

            <RN.TextInput
                style = {styles.inputContainer}
                placeholder="Nombre del producto"
                value={newItem.name}
                onChangeText={(text) => setNewItem({...newItem, name: text})}
            />

            <RN.View style={styles.inputContainer}>
                <Picker
                    selectedValue={newItem.category}
                    onValueChange={(value) => setNewItem({...newItem, category: value})}
                    style={{ height: 50 }}
                >
                    <Picker.Item label="Selecciona una categoría" value="" />
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
                style = {styles.inputContainer}
                placeholder="Cantidad"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({...newItem, quantity: text})}
            />

            <RN.TouchableOpacity
                style={[styles.inputContainer, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
            >
                <RN.Text style={{ color: newItem.expire_date ? '#222' : '#888', fontSize: 16 }}>
                    {newItem.expire_date ? `Vence: ${newItem.expire_date}` : 'Selecciona fecha de vencimiento'}
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
                style={{
                    backgroundColor: '#FF6347',
                    borderRadius: 6,
                    paddingVertical: 12,
                    paddingHorizontal: 32,
                    marginTop: 12,
                }}
                onPress={onSend}
            >
                <RN.Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Guardar</RN.Text>
            </RN.TouchableOpacity>
        </RN.View>
    );
}

const styles = RN.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffffff",
    },

    title: {
        fontSize: 32,
        fontWeight: "700",

    },
    inputContainer: {
        width: "80%",
        padding:13,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
    },
    emoji: {
        fontSize: 100,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        padding: 10,
        marginVertical: 7,
    },
    
});