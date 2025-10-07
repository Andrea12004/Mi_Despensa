// Spoonacular API 
const SPOONACULAR_API_KEY = 'efc814225e17496282977b64044c640a'; 
const SPOONACULAR_SEARCH = 'https://api.spoonacular.com/food/ingredients/search';

// Mapeo de nombres en español a inglés para mejor búsqueda
const traduccionesProductos = {
  'Manzana': 'apple',
  'Naranja': 'orange',
  'Banana': 'banana',
  'Plátano': 'banana',
  'Uva': 'grape',
  'Fresa': 'strawberry',
  'Pera': 'pear',
  'Sandía': 'watermelon',
  'Melón': 'melon',
  'Piña': 'pineapple',
  'Mango': 'mango',
  'Papaya': 'papaya',
  'Limón': 'lemon',
  
  'Tomate': 'tomato',
  'Lechuga': 'lettuce',
  'Zanahoria': 'carrot',
  'Cebolla': 'onion',
  'Papa': 'potato',
  'Papas': 'potatoes',
  'Brócoli': 'broccoli',
  'Espinaca': 'spinach',
  'Pepino': 'cucumber',
  'Pimentón': 'bell pepper',
  'Ajo': 'garlic',
  
  'Leche': 'milk',
  'Queso': 'cheese',
  'Yogurt': 'yogurt',
  'Mantequilla': 'butter',
  'Crema': 'cream',
  
  'Pollo': 'chicken',
  'Carne': 'beef',
  'Res': 'beef',
  'Cerdo': 'pork',
  'Pescado': 'fish',
  'Salmón': 'salmon',
  'Atún': 'tuna',
  
  'Arroz': 'rice',
  'Frijol': 'beans',
  'Frijoles': 'beans',
  'Lenteja': 'lentils',
  'Lentejas': 'lentils',
  'Arveja': 'peas',
  'Arvejas': 'peas',
  'Garbanzo': 'chickpeas',
  
  'Pan': 'bread',
  'Galletas': 'cookies',
  'Torta': 'cake',
  'Arepa': 'corn bread',
  
  'Jugo': 'juice',
  'Agua': 'water',
  'Café': 'coffee',
  'Té': 'tea',
  
  'Sal': 'salt',
  'Azúcar': 'sugar',
  'Aceite': 'oil',
  'Vinagre': 'vinegar',
  'Pimienta': 'pepper',

  'Chocolate': 'chocolate',
  'Caramelo': 'candy',
  'Helado': 'ice cream',
};

// Imágenes por defecto por categoría (si Spoonacular no encuentra resultado)
const imagenesPorCategoria = {
  'Frutas': 'https://spoonacular.com/cdn/ingredients_100x100/apple.jpg',
  'Verduras': 'https://spoonacular.com/cdn/ingredients_100x100/tomato.jpg',
  'Lácteos': 'https://spoonacular.com/cdn/ingredients_100x100/milk.jpg',
  'Carnes': 'https://spoonacular.com/cdn/ingredients_100x100/beef.jpg',
  'Granos': 'https://spoonacular.com/cdn/ingredients_100x100/rice.jpg',
  'Panadería': 'https://spoonacular.com/cdn/ingredients_100x100/bread.jpg',
  'Bebidas': 'https://spoonacular.com/cdn/ingredients_100x100/water.jpg',
  'Condimentos': 'https://spoonacular.com/cdn/ingredients_100x100/salt.jpg',
  'Congelados': 'https://spoonacular.com/cdn/ingredients_100x100/ice.jpg',
  'Dulces': 'https://spoonacular.com/cdn/ingredients_100x100/chocolate.jpg',
  'Enlatados': 'https://spoonacular.com/cdn/ingredients_100x100/canned-tomatoes.jpg',
  'Otros': 'https://spoonacular.com/cdn/ingredients_100x100/mixed-vegetables.jpg',
};

// Función para traducir nombre al inglés
function traducirNombre(nombreProducto) {
  // Buscar traducción directa
  if (traduccionesProductos[nombreProducto]) {
    return traduccionesProductos[nombreProducto];
  }
  
  // Si no encuentra traducción, buscar por palabras similares
  const nombreLower = nombreProducto.toLowerCase();
  for (const [espanol, ingles] of Object.entries(traduccionesProductos)) {
    if (nombreLower.includes(espanol.toLowerCase())) {
      return ingles;
    }
  }
  
  return nombreProducto;
}

// Buscar imagen específica del producto en Spoonacular
async function buscarImagenDelProducto(nombreProducto) {
    // Traducir el nombre al inglés
    const nombreIngles = traducirNombre(nombreProducto);
    
    
    // Construir URL de búsqueda
    const url = `${SPOONACULAR_SEARCH}?query=${encodeURIComponent(nombreIngles)}&number=1&apiKey=${SPOONACULAR_API_KEY}`;
    
    // Hacer petición
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    
    if (datos.results && datos.results.length > 0) {
      const ingrediente = datos.results[0];
      
      // Construir URL de imagen (tamaño 250x250 para mejor calidad)
      const imageUrl = `https://spoonacular.com/cdn/ingredients_250x250/${ingrediente.image}`;
      
      
      return {
        url: imageUrl,
        nombre: ingrediente.name,
        id: ingrediente.id
      };
    } else {
      return null;
    }
}

// Obtener imagen por categoría (fallback)
function obtenerImagenPorCategoria(categoria) {
  return imagenesPorCategoria[categoria] || imagenesPorCategoria['Otros'];
}

// Función principal: obtener imagen del producto
async function obtenerImagenProducto(nombreProducto, categoria) {
  
  // Primero intentar buscar imagen específica
  const imagenEspecifica = await buscarImagenDelProducto(nombreProducto);
  
  if (imagenEspecifica) {
    return {
      url: imagenEspecifica.url,
      tipo: 'especifica',
      fuente: 'spoonacular',
      esLocal: false
    };
  } else {
    // Si no encuentra, usar imagen de categoría
    return {
      url: obtenerImagenPorCategoria(categoria),
      tipo: 'categoria',
      fuente: 'spoonacular',
      esLocal: false
    };
  }
}

export default {
  buscarImagenDelProducto,
  obtenerImagenProducto,
  obtenerImagenPorCategoria,
};