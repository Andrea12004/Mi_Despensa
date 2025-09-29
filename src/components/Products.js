import * as React from 'react';
import * as RN from 'react-native';

import { database } from '../config/fb';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { cancelProductNotifications, scheduleProductNotifications } from "../services/notification";

import {AntDesign} from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

export default function Products({ id, name, emoji, category, quantity, expire_date }) {

    const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editData, setEditData] = React.useState({ name, category, quantity: String(quantity) });
    
    const handleEdit = () => {
        setEditData({ emoji, name, category, quantity: String(quantity), expire_date });
        setModalVisible(true);
    };
    
    const handleSave = async () => {
        await updateDoc(doc(database, 'productos', id), {
            name: editData.name,
            category: editData.category,
            quantity: editData.quantity,
        });

         // Reprogramar notificaciones con el nuevo nombre
        if (expire_date) {
            await scheduleProductNotifications({
                id,
                name: editData.name,
                emoji,
                expire_date
            });
        }

        setModalVisible(false);
    };

    // Función para incrementar cantidad
    const handleIncrement = async () => {
        const newQuantity = parseInt(quantity) + 1;
        await updateDoc(doc(database, 'productos', id), {
            quantity: String(newQuantity),
        });
    };

    // Función para decrementar cantidad
    const handleDecrement = async () => {
        const currentQuantity = parseInt(quantity);
        if (currentQuantity > 0) {
            const newQuantity = currentQuantity - 1;
            await updateDoc(doc(database, 'productos', id), {
                quantity: String(newQuantity),
            });
        }
    };

    const onDelete = async () => {
        // Cancelar todas las notificaciones del producto
        await cancelProductNotifications(id);

        const docRef = doc(database, "productos", id);
        await deleteDoc(docRef);
        setDeleteModalVisible(false);
    };

    // Calcular días hasta el vencimiento y el color
    const getDaysUntilExpire = () => {
        if (!expire_date) return null;
        
        // Crear fechas 
        const today = new Date();
        const [year, month, day] = expire_date.split('-').map(Number);
        const expireDate = new Date(year, month - 1, day);
        
        today.setHours(0, 0, 0, 0);
        expireDate.setHours(0, 0, 0, 0);
        
        const diffTime = expireDate - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    };

    const getExpireStyle = () => {
        const days = getDaysUntilExpire();
        if (days === null) return { color: '#1ca81c', text: '' };
        
        if (days < 0) {
            return { 
                color: '#8B0000', 
                text: `⚠️ Vencido hace ${Math.abs(days)} día(s)`,
                bg: '#FFE5E5'
            };
        } else if (days === 0) {
            return { 
                color: '#FF6347', 
                text: '🚨 Vence HOY',
                bg: '#FFF0E5'
            };
        } else if (days <= 3) {
            return { 
                color: '#FFA500', 
                text: `⚠️ Vence en ${days} día(s)`,
                bg: '#FFF8E5'
            };
        } else {
            return { 
                color: '#1ca81c', 
                text: `Vence: ${expire_date}`,
                bg: '#F0FFF0'
            };
        }
    };

    const expireStyle = getExpireStyle();

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
            
            
            <RN.View style={styles.quantityContainer}>
                <RN.Text style={styles.quantityLabel}>Cantidad:</RN.Text>
                <RN.View style={styles.quantityControls}>
                    <RN.TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={handleDecrement}
                    >
                        <AntDesign name="minus" size={14} color="#fff" />
                    </RN.TouchableOpacity>
                    
                    <RN.Text style={styles.quantityValue}>{quantity}</RN.Text>
                    
                    <RN.TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={handleIncrement}
                    >
                        <AntDesign name="plus" size={14} color="#fff" />
                    </RN.TouchableOpacity>
                </RN.View>
            </RN.View>

            {expireStyle && expireStyle.text ? (
                <RN.Text style={[styles.expireDate, { color: expireStyle.color }]}>
                    {expireStyle.text}
                </RN.Text>
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
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    quantityLabel: {
        fontSize: 18,
        color: "#888",
        marginRight: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
    },
    quantityButton: {
        backgroundColor: '#0fa5e9',
        width: 24,
        height: 25,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 16,
        minWidth: 25,
        textAlign: 'center',
    },
    expireDate: {
        fontSize: 16,
        color: '#FF6347',
        fontWeight: 'bold',
        marginTop: 8,
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
    inputContainer: {
        width: "100%",
        padding:13,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
    },
});