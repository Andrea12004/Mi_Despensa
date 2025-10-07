import * as React from 'react';
import * as RN from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // ← AGREGAR ESTE IMPORT
import { database } from '../config/fb';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { cancelProductNotifications, scheduleProductNotifications } from "../services/notification";
import { Picker } from '@react-native-picker/picker';
import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageService from '../services/ImageService';

// ← CAMBIAR LA FIRMA DE LA FUNCIÓN, agregar imageUrl
export default function Products({ id, name, category, quantity, expire_date, imageUrl }) {

    const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editData, setEditData] = React.useState({ name, category, quantity: String(quantity) });
    const [showEditDatePicker, setShowEditDatePicker] = React.useState(false);
    
    // Estados para la imagen
    const [productImage, setProductImage] = React.useState(imageUrl || null);
    const [loadingImage, setLoadingImage] = React.useState(!imageUrl);

    // Cargar imagen cuando el componente se monta
    React.useEffect(() => {
        if (imageUrl) {
            setProductImage(imageUrl);
            setLoadingImage(false);
            return;
        }
        cargarImagenDelProducto();
    }, []);
    
    const cargarImagenDelProducto = async () => {
        try {
            setLoadingImage(true);
            
            const resultado = await ImageService.obtenerImagenProducto(name, category);
            
            if (resultado && resultado.url) {
                setProductImage(resultado.url);
                
                // Guardar URL en Firebase
                await updateDoc(doc(database, 'productos', id), {
                    imageUrl: resultado.url
                });
            }
            
            setLoadingImage(false);
        } catch (error) {
            console.error('Error cargando imagen:', error);
            setLoadingImage(false);
        }
    };

    const handleEdit = () => {
        setEditData({ name, category, quantity: String(quantity), expire_date });
        setModalVisible(true);
    };
    
    const handleSave = async () => {
        await updateDoc(doc(database, 'productos', id), {
            name: editData.name,
            category: editData.category,
            quantity: editData.quantity,
            expire_date: editData.expire_date,
        });

        // Reprogramar notificaciones
        if (editData.expire_date) {
            await scheduleProductNotifications({
                id,
                name: editData.name,
                expire_date: editData.expire_date
            });
        }

        setModalVisible(false);
    };

    const handleIncrement = async () => {
        const newQuantity = parseInt(quantity) + 1;
        await updateDoc(doc(database, 'productos', id), {
            quantity: String(newQuantity),
        });
    };

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
        await cancelProductNotifications(id);
        const docRef = doc(database, "productos", id);
        await deleteDoc(docRef);
        setDeleteModalVisible(false);
    };

    const getDaysUntilExpire = () => {
        if (!expire_date) return null;
        
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
            };
        } else if (days === 0) {
            return { 
                color: '#FF6347', 
                text: '🚨 Vence HOY',
            };
        } else if (days <= 3) {
            return { 
                color: '#FFA500', 
                text: `⚠️ Vence en ${days} día(s)`,
            };
        } else {
            return { 
                color: '#1ca81c', 
                text: `Vence: ${expire_date}`,
            };
        }
    };

    const expireStyle = getExpireStyle();

    return(
        <RN.View style={styles.productContainer}>
            <RN.View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                {/* IMAGEN DEL PRODUCTO */}
                <RN.View style={styles.imageContainer}>
                    {loadingImage ? (
                        <RN.ActivityIndicator size="large" color="#FF6347" />
                    ) : productImage ? (
                        <RN.Image 
                            source={{ uri: productImage }}  // ← Siempre usar { uri: ... }
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <MaterialCommunityIcons 
                            name="food-apple" 
                            size={48} 
                            color="#888"
                        />
                    )}
                </RN.View>

                {/* CONTENIDO DEL PRODUCTO */}
                <RN.View style={{ flex: 1, marginLeft: 12 }}>
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
                </RN.View>

                {/* BOTONES EDIT/DELETE */}
                <RN.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons onPress={handleEdit} name='edit' size={24} color='#0fa5e9' style={{ marginRight: 12 }} />
                    <AntDesign onPress={() => setDeleteModalVisible(true)} name='delete' size={24} color='red' />
                </RN.View>
            </RN.View>

            {/* MODAL DE ELIMINACIÓN */}
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

            {/* MODAL DE EDICIÓN */}
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
                        <RN.View style={styles.inputContainer}>
                            <Picker
                                selectedValue={editData.category}
                                onValueChange={(value) => setEditData({...editData, category: value})}
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
                            style={styles.inputContainer}
                            placeholder="Cantidad"
                            value={editData.quantity}
                            onChangeText={text => setEditData({ ...editData, quantity: text })}
                            keyboardType="numeric"
                        />

                        <RN.TouchableOpacity
                            style={[styles.inputContainer, { justifyContent: 'center' }]}
                            onPress={() => setShowEditDatePicker(true)}
                        >
                            <RN.Text style={{ color: editData.expire_date ? '#222' : '#888', fontSize: 16 }}>
                                {editData.expire_date ? `Vence: ${editData.expire_date}` : 'Selecciona fecha de vencimiento'}
                            </RN.Text>
                        </RN.TouchableOpacity>

                        {showEditDatePicker && (
                            <DateTimePicker
                                value={editData.expire_date ? new Date(editData.expire_date) : new Date()}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowEditDatePicker(false);
                                    if (selectedDate) {
                                        const yyyy = selectedDate.getFullYear();
                                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                                        setEditData({ ...editData, expire_date: `${yyyy}-${mm}-${dd}` });
                                    }
                                }}
                            />
                        )}

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
        padding: 16,
        backgroundColor: "#ffffff",
        margin: 16,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
    },
    category: {
        fontSize: 16,
        color: "#888",
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    quantityLabel: {
        fontSize: 16,
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
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    inputContainer: {
        width: "100%",
        padding: 13,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
    },
});