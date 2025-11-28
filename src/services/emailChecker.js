import { collection, query, where, getDocs } from 'firebase/firestore';
import { database, auth } from '../config/fb';
import { sendExpirationEmail } from './emailService';

export async function checkProductsAndSendEmails() {
  const user = auth.currentUser;
  if (!user) {
    console.log('No hay usuario logueado');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const productsRef = collection(database, 'productos');
    const q = query(productsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    console.log(`Verificando ${snapshot.size} productos...`);

    for (const docSnap of snapshot.docs) {
      const product = docSnap.data();
      
      if (!product.expire_date) continue;

      const [year, month, day] = product.expire_date.split('-').map(Number);
      const expireDate = new Date(year, month - 1, day);
      expireDate.setHours(0, 0, 0, 0);

      const daysUntil = Math.floor((expireDate - today) / (1000 * 60 * 60 * 24));

      // Enviar email si faltan 3 días o si vence hoy
      if (daysUntil === 3 || daysUntil === 0) {
        console.log(` Enviando email: ${product.name} vence en ${daysUntil} días`);
        await sendExpirationEmail(user.email, product.name, daysUntil);
      }
    }
  } catch (error) {
    console.error(' Error checking products:', error);
  }
}

// Ejecutar cada hora
export function startEmailChecker() {
  console.log('Email checker iniciado');
  
  // Verificar inmediatamente
  checkProductsAndSendEmails();

  // Luego cada hora
  setInterval(() => {
    console.log(' Ejecutando verificación de productos...');
    checkProductsAndSendEmails();
  }, 60 * 60 * 1000); // 1 hora
}