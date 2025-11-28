import * as React from "react";
import * as RN from "react-native";
import { useNavigation } from "@react-navigation/native";
import { database, auth } from "../config/fb";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import Products from "../components/Products";
import { MaterialIcons } from '@expo/vector-icons';

export default function Home() {
    const [products, setProducts] = React.useState([]);
    const [activeNav, setActiveNav] = React.useState('Cocina');
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
                    <RN.TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                        <MaterialIcons name="search" size={26} color="#fff" />
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
});