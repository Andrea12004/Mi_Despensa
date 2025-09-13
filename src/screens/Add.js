import * as React from "react";
import * as RN from "react-native";
import EmojiPicker from "rn-emoji-keyboard";

import { database} from "../config/fb";
import { collection, addDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";


export default function Home() {
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = React.useState(false);
    const [newItem, setNewItem] = React.useState({
        emoji: '🤑',
        name: '',
        category: '',
        quantity: '',
        createdAt: new Date(),

    });

    const onSend = async() => {
        await addDoc(collection(database, "productos"), newItem);
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
            <RN.TextInput
                style = {styles.inputContainer}
                placeholder="Categoría"
                value={newItem.category}
                onChangeText={(text) => setNewItem({...newItem, category: text})}
            />


            <RN.TextInput
                style = {styles.inputContainer}
                placeholder="Cantidad"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({...newItem, quantity: text})}
            />

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