import * as React from 'react';
import * as RN from 'react-native';
import { useNavigation } from '@react-navigation/native';

// TheMealDB docs: https://www.themealdb.com/api.php

export default function Recipes() {
  const [query, setQuery] = React.useState('');
  const [recipes, setRecipes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const searchByIngredient = async (ingredient) => {
    if (!ingredient) return;
    setLoading(true);
    try {
      // TheMealDB filter by ingredient
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
      const json = await res.json();
      setRecipes(json.meals || []);
    } catch (e) {
      console.error('[recipes] search error', e);
      setRecipes([]);
    }
    setLoading(false);
  };

  const loadDetails = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const json = await res.json();
      setSelected(json.meals?.[0] || null);
    } catch (e) {
      console.error('[recipes] load details', e);
    }
    setLoading(false);
  };

  return (
    <RN.View style={{ flex: 1, backgroundColor: '#f5f5dce2' }}>
      <RN.View style={styles.hero}>
        <RN.View style={styles.heroTopRow}>
          <RN.TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <RN.Text style={{ color: '#fff' }}>{'←'}</RN.Text>
          </RN.TouchableOpacity>
          <RN.Text style={styles.logo}>Recetas</RN.Text>
          <RN.View style={{ width: 40 }} />
        </RN.View>
      </RN.View>

      <RN.View style={{ padding: 16 }}>
        <RN.Text style={{ fontSize: 16, marginBottom: 8 }}>Buscar por ingrediente</RN.Text>
        <RN.View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <RN.TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ingrediente"
            style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6 }}
          />
          <RN.TouchableOpacity onPress={() => searchByIngredient(query)} style={{ marginLeft: 8, backgroundColor: '#2E8B57', padding: 10, borderRadius: 6 }}>
            <RN.Text style={{ color: '#fff' }}>Buscar</RN.Text>
          </RN.TouchableOpacity>
        </RN.View>

        {loading ? (
          <RN.ActivityIndicator style={{ marginTop: 16 }} />
        ) : null}

        <RN.ScrollView style={{ marginTop: 12 }}>
          {recipes.length === 0 ? (
            <RN.Text style={{ color: '#888', marginTop: 12 }}>No hay recetas. Busca por ingrediente para empezar.</RN.Text>
          ) : (
            recipes.map(r => (
              <RN.TouchableOpacity key={r.idMeal} onPress={() => loadDetails(r.idMeal)} style={styles.recipeCard}>
                <RN.Image source={{ uri: r.strMealThumb }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                <RN.View style={{ marginLeft: 12, flex: 1 }}>
                  <RN.Text style={{ fontSize: 16, fontWeight: '700' }}>{r.strMeal}</RN.Text>
                </RN.View>
              </RN.TouchableOpacity>
            ))
          )}
        </RN.ScrollView>

        {selected ? (
          <RN.Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
            <RN.View style={{ flex: 1, padding: 16 }}>
              <RN.TouchableOpacity onPress={() => setSelected(null)} style={{ marginBottom: 12 }}>
                <RN.Text>{'← Volver'}</RN.Text>
              </RN.TouchableOpacity>
              <RN.Text style={{ fontSize: 20, fontWeight: '800' }}>{selected.strMeal}</RN.Text>
              <RN.Image source={{ uri: selected.strMealThumb }} style={{ width: '100%', height: 200, marginTop: 12, borderRadius: 8 }} />
              <RN.ScrollView style={{ marginTop: 12 }}>
                <RN.Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Instrucciones</RN.Text>
                <RN.Text style={{ color: '#333' }}>{selected.strInstructions}</RN.Text>
              </RN.ScrollView>
            </RN.View>
          </RN.Modal>
        ) : null}
      </RN.View>
    </RN.View>
  );
}

const styles = RN.StyleSheet.create({
  hero: {
    backgroundColor: '#365c36ff',
    paddingTop: 36,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  }
});
