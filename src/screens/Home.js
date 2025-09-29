import * as React from "react";
import * as RN from "react-native";

import { useNavigation } from "@react-navigation/native";
import { database} from "../config/fb";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Products from "../components/Products";

export default function Home() {
    const [products, setProducts] = React.useState([]);
    const navigation = useNavigation();


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

        const unsubscribe = onSnapshot(q, querySnapshot => {
            setProducts(
                querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    emoji: doc.data().emoji,
                    name: doc.data().name,
                    category: doc.data().category,
                    quantity: doc.data().quantity,
                    expire_date: doc.data().expire_date,
                }))
            );
        });
        return unsubscribe;
            
    }, []);
    return (
        <>
            <RN.Text style={styles.header}>Inventario</RN.Text>
            {products.map(products => <Products key={products.id} {...products} />)}
        </>
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
