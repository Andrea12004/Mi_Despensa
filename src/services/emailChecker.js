import { collection, query, where, getDocs } from 'firebase/firestore';
import { database, auth } from '../config/fb';
import { sendExpirationEmail } from './emailService';

// Almacenar últimas notificaciones enviadas para evitar duplicados
const lastNotifications = new Map();

/**
 * Verifica si ya se envió una notificación para este producto hoy
 */
function shouldSendNotification(productId, daysUntil) {
  const key = `${productId}-${daysUntil}`;
  const lastSent = lastNotifications.get(key);
  
  if (!lastSent) return true;
  
  // Enviar solo si pasaron más de 12 horas
  const hoursElapsed = (Date.now() - lastSent) / (1000 * 60 * 60);
  return hoursElapsed >= 12;
}

/**
 * Marca que se envió una notificación
 */
function markNotificationSent(productId, daysUntil) {
  const key = `${productId}-${daysUntil}`;
  lastNotifications.set(key, Date.now());
}

/**
 * Verifica productos y envía emails de vencimiento
 */
export async function checkProductsAndSendEmails() {
  const user = auth.currentUser;
  
  if (!user) {
    console.log('⚠️ No hay usuario autenticado');
    return;
  }

  if (!user.email) {
    console.log('⚠️ Usuario sin email configurado');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    console.log('🔍 Verificando productos para:', user.email);
    
    const productsRef = collection(database, 'productos');
    const q = query(productsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    console.log(`📦 ${snapshot.size} productos encontrados`);

    let emailsSent = 0;

    for (const docSnap of snapshot.docs) {
      const product = docSnap.data();
      const productId = docSnap.id;
      
      // Saltar productos sin fecha de vencimiento
      if (!product.expire_date) {
        continue;
      }

      // Parsear fecha de vencimiento
      const [year, month, day] = product.expire_date.split('-').map(Number);
      const expireDate = new Date(year, month - 1, day);
      expireDate.setHours(0, 0, 0, 0);

      // Calcular días hasta vencimiento
      const daysUntil = Math.floor((expireDate - today) / (1000 * 60 * 60 * 24));

      // Criterios para enviar email:
      // - Vencido (negativo)
      // - Vence hoy (0)
      // - Vence en 1 día
      // - Vence en 3 días
      // - Vence en 7 días
      const shouldNotify = 
        daysUntil < 0 || // Vencido
        daysUntil === 0 || // Vence hoy
        daysUntil === 1 || // Vence mañana
        daysUntil === 3 || // Vence en 3 días
        daysUntil === 7;   // Vence en 7 días

      if (shouldNotify) {
        // Verificar si ya se envió notificación reciente
        if (!shouldSendNotification(productId, daysUntil)) {
          console.log(`⏭️ Saltando ${product.name} (notificación reciente)`);
          continue;
        }

        console.log(`📧 Enviando email: ${product.name} (${daysUntil} días)`);
        
        const success = await sendExpirationEmail(
          user.email,
          product.name,
          daysUntil
        );

        if (success) {
          emailsSent++;
          markNotificationSent(productId, daysUntil);
        }

        // Pequeña pausa entre emails para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (emailsSent > 0) {
      console.log(`✅ ${emailsSent} email(s) enviado(s)`);
    } else {
      console.log('ℹ️ No hay productos que requieran notificación');
    }

  } catch (error) {
    console.error('❌ Error verificando productos:', error);
  }
}

/**
 * Inicia el verificador automático de emails
 */
export function startEmailChecker() {
  console.log('🚀 Email checker iniciado');
  
  // Verificar inmediatamente al iniciar
  checkProductsAndSendEmails();

  // Verificar cada 6 horas (más frecuente que 1 hora para mejor respuesta)
  const intervalId = setInterval(() => {
    console.log('⏰ Ejecutando verificación programada...');
    checkProductsAndSendEmails();
  }, 6 * 60 * 60 * 1000); // 6 horas

  // Retornar función para detener el checker si es necesario
  return () => {
    console.log('🛑 Deteniendo email checker');
    clearInterval(intervalId);
  };
}

/**
 * Ejecutar verificación manual (útil para testing)
 */
export async function manualCheck() {
  console.log('🔍 Verificación manual iniciada');
  await checkProductsAndSendEmails();
}