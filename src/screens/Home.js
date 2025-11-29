import * as React from "react";
import * as RN from "react-native";
import { useNavigation } from "@react-navigation/native";
import { database, auth } from "../config/fb";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { signOut } from 'firebase/auth';
import Products from "../components/Products";
import { MaterialIcons } from '@expo/vector-icons';

export default function Home() {
    const [products, setProducts] = React.useState([]);
    const [activeNav, setActiveNav] = React.useState('Cocina');
    const [menuVisible, setMenuVisible] = React.useState(false);
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // Función para cerrar sesión
    const handleLogout = () => {
        setMenuVisible(false);
        RN.Alert.alert(
            '🚪 Cerrar Sesión',
            '¿Estás seguro de que deseas salir?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🔓 Cerrando sesión...');
                            await signOut(auth);
                            console.log('✅ Sesión cerrada exitosamente');
                        } catch (error) {
                            console.error('❌ Error al cerrar sesión:', error);
                            RN.Alert.alert('Error', 'No se pudo cerrar la sesión');
                        }
                    }
                }
            ]
        );
    };

    React.useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            console.log('No hay usuario logueado');
            return;
        }

        const collectionRef = collection(database, "productos");
        const q = query(
            collectionRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, async querySnapshot => {
            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                category: doc.data().category,
                quantity: doc.data().quantity,
                expire_date: doc.data().expire_date,
                imageUrl: doc.data().imageUrl,
            }));
            
            setProducts(productsData);
            
        }, (error) => {
            console.error('[fb] onSnapshot error', error && error.code, error && error.message);
        });
        
        return unsubscribe;
    }, []);

    return (
        <RN.View style={{ flex: 1, backgroundColor: '#f5f5dce2' }}>
            <RN.View style={styles.hero}>
                <RN.View style={styles.heroTopRow}>
                    <RN.View style={styles.leftPlaceholder} />
                    <RN.Text style={styles.logo}>Mi Despensa</RN.Text>
                    
                    {/* Menú de usuario */}
                    <RN.TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={() => setMenuVisible(true)}
                    >
                        <MaterialIcons name="account-circle" size={32} color="#fff" />
                    </RN.TouchableOpacity>
                </RN.View>

                <RN.View style={styles.headerNav}>
                    <RN.TouchableOpacity
                        style={[styles.navPill, activeNav === 'Cocina' && styles.navPillActive]}
                        onPress={() => setActiveNav('Cocina')}
                    >
                        <RN.Text style={[styles.navPillText, activeNav === 'Cocina' && styles.navPillTextActive]}>Cocina</RN.Text>
                    </RN.TouchableOpacity>
                    <RN.TouchableOpacity
                        style={[styles.navPill, activeNav === 'Recetas' && styles.navPillActive]}
                        onPress={() => {
                            setActiveNav('Recetas');
                            navigation.navigate('Recetas');
                        }}
                    >
                        <RN.Text style={[styles.navPillText, activeNav === 'Recetas' && styles.navPillTextActive]}>Recetas</RN.Text>
                    </RN.TouchableOpacity>
                </RN.View>
            </RN.View>

            {/* Modal de menú de usuario */}
<RN.Modal
    visible={menuVisible}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setMenuVisible(false)}
>
    <RN.TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
    >
        <RN.View style={styles.menuContainewr}>
            <RN.View style={styles.menuHeader}>
                <MaterialIcons name="account-circle" size={48} color="#365c36ff" />
                <RN.Text style={styles.userEmail}>
                    {auth.currentUser?.email || 'Usuario'}
                </RN.Text>
            </RN.View>

            <RN.View style={styles.menuDivider} />

            {/* Solo Cerrar sesión */}
            <RN.TouchableOpacity 
                style={styles.menuItem}
                onPress={handleLogout}
            >
                <MaterialIcons name="logout" size={24} color="#dc3545" />
                <RN.Text style={[styles.menuItemText, styles.logoutText]}>
                    Cerrar Sesión
                </RN.Text>
            </RN.TouchableOpacity>
        </RN.View>
    </RN.TouchableOpacity>
</RN.Modal>

            <RN.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
                <RN.Text style={styles.sectionTitle}>Inventario</RN.Text>
     
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

            <RN.TouchableOpacity
                onPress={() => navigation.navigate('Add')}
                style={styles.fab}
            >
                <RN.Text style={{ color: '#fff', fontSize: 28 }}>+</RN.Text>
            </RN.TouchableOpacity>
        </RN.View>
    );
}

const styles = RN.StyleSheet.create({
    hero: {
        backgroundColor: '#365c36ff',
        paddingTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftPlaceholder: {
        width: 40,
    },
    logo: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 35,
    },
    iconButton: {
        marginLeft: 8,
        padding: 1,
        marginTop: 40,
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    navPill: {
        backgroundColor: 'rgba(255,255,255,0.16)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 22,
        marginHorizontal: 10,
    },
    navPillText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    navPillActive: {
        backgroundColor: '#fff',
    },
    navPillTextActive: {
        color: '#2E8B57',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginTop: 18,
        marginHorizontal: 20,
        marginBottom: 6,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#90EE90',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    // Estilos del modal de menú
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    menuContainer: {
        backgroundColor: '#fff',
        marginTop: 70,
        marginRight: 20,
        borderRadius: 12,
        minWidth: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    menuHeader: {
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 20,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        fontWeight: '500',
    },
    logoutMenuItem: {
        backgroundColor: '#fff5f5',
    },
    logoutText: {
        color: '#dc3545',
        fontWeight: '600',
    },
});