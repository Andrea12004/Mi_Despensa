import * as React from 'react';
import * as RN from 'react-native';

import { database } from '../config/fb';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";

import {AntDesign} from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

export default function Products({ id, name, emoji, category, quantity, expire_date }) {

    const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editData, setEditData] = React.useState({ name, category, quantity: String(quantity) });
    const handleEdit = () => {
        setEditData({ name, category, quantity: String(quantity) });
        setModalVisible(true);
    };
    const handleSave = async () => {
        await updateDoc(doc(database, 'productos', id), {
            name: editData.name,
            category: editData.category,
            quantity: editData.quantity,
        });
        setModalVisible(false);
    };

    const onDelete = async () => {
        const docRef = doc(database, "productos", id);
        await deleteDoc(docRef);
        setDeleteModalVisible(false);
    };
    return(
        <RN.View style={styles.productContainer}>
            <RN.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <RN.Text style={styles.emoji}>{emoji}</RN.Text>
                <RN.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons onPress={handleEdit} name='edit' size={24} color='#0fa5e9' style={{ marginRight: 12 }} />
                    <AntDesign onPress={() => setDeleteModalVisible(true)} name='delete' size={24} color='red' />
            <RN.Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <RN.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <RN.View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 10, width: '80%', alignItems: 'center' }}>
                        <RN.Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: 'red' }}>¡Advertencia!</RN.Text>
                        <RN.Text style={{ fontSize: 16, marginBottom: 24, textAlign: 'center' }}>¿Estás seguro de que deseas eliminar "{name}"?</RN.Text>
                        <RN.View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                            <RN.TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={{ marginRight: 16, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, backgroundColor: '#ccc' }}>
                                <RN.Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>Cancelar</RN.Text>
                            </RN.TouchableOpacity>
                            <RN.TouchableOpacity onPress={onDelete} style={{ backgroundColor: 'red', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 18 }}>
                                <RN.Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Eliminar</RN.Text>
                            </RN.TouchableOpacity>
                        </RN.View>
                    </RN.View>
                </RN.View>
            </RN.Modal>
                </RN.View>
            </RN.View>
            <RN.Text style={styles.name}>{name}</RN.Text>
            <RN.Text style={styles.category}>{category}</RN.Text>
            <RN.Text style={styles.quantity}>Cantidad: {quantity}</RN.Text>
            {expire_date ? (
                <RN.Text style={styles.expireDate}>Vence: {expire_date}</RN.Text>
            ) : null}
            <RN.Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <RN.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <RN.View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 10, width: '80%' }}>
                        <RN.Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Editar producto</RN.Text>
                        <RN.TextInput
                            style={styles.inputContainer}
                            placeholder="Nombre"
                            value={editData.name}
                            onChangeText={text => setEditData({ ...editData, name: text })}
                        />
                        <RN.TextInput
                            style={styles.inputContainer}
                            placeholder="Categoría"
                            value={editData.category}
                            onChangeText={text => setEditData({ ...editData, category: text })}
                        />
                        <RN.TextInput
                            style={styles.inputContainer}
                            placeholder="Cantidad"
                            value={editData.quantity}
                            onChangeText={text => setEditData({ ...editData, quantity: text })}
                            keyboardType="numeric"
                        />
                        <RN.View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                            <RN.TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginRight: 16 }}>
                                <RN.Text style={{ color: '#888', fontSize: 16 }}>Cancelar</RN.Text>
                            </RN.TouchableOpacity>
                            <RN.TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#0fa5e9', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 18 }}>
                                <RN.Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Guardar</RN.Text>
                            </RN.TouchableOpacity>
                        </RN.View>
                    </RN.View>
                </RN.View>
            </RN.Modal>
        </RN.View>
    );
}

const styles = RN.StyleSheet.create({
    productContainer: {
        padding:16,
        backgroundColor: "#ffffff",
        margin:16,
        borderRadius:8,
    },
    emoji: {
        fontSize: 48,
        textAlign: "center",
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
    },
    category: {
        fontSize: 18,
        color: "#888",
    },
    quantity: {
        fontSize: 18,
        color: "#888",
    },

     expireDate: {
        fontSize: 16,
        color: '#FF6347',
        fontWeight: 'bold',
        marginTop: 4,
    },

    button:{
        backgroundColor: "#0fa5e9",
        padding: 10,
        marginVertical: 5,
        borderRadius:8,
        alignItems: "center",

    },
    buttonText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
    },
    expireDate: {
        fontSize: 16,
        color: '#1ca81cff',
        fontWeight: 'bold',
        marginTop: 4,
    },
});