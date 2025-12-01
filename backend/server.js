// server.js - Backend que corre en Render.com 24/7 GRATIS
const express = require('express');
const cron = require('node-cron');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN (Pon tus credenciales aquí)
// ============================================
const FIREBASE_API_KEY = 'AIzaSyDeCrKjfLLrM44O0j28YjQPMdPNPFXCEuw';  // De tu .env
const FIREBASE_PROJECT_ID = 'la-despensa-46f5f';

const EMAILJS_SERVICE_ID = 'service_cnriqls';
const EMAILJS_TEMPLATE_ID = 'template_auzavs5';
const EMAILJS_PUBLIC_KEY = 'TZAwQh_SmAVCxqk0a';

// ============================================
// FUNCIÓN: Enviar Email
// ============================================
async function sendExpirationEmail(userEmail, productName, daysUntil) {
  let message, subject;

  if (daysUntil < 0) {
    const diasVencido = Math.abs(daysUntil);
    subject = `⚠️ Producto vencido: ${productName}`;
    message = `Tu producto "${productName}" venció hace ${diasVencido} día(s).`;
  } else if (daysUntil === 0) {
    subject = `🚨 ¡VENCE HOY!: ${productName}`;
    message = `¡Tu producto "${productName}" vence HOY!`;
  } else if (daysUntil <= 3) {
    subject = `⏰ Próximo a vencer: ${productName}`;
    message = `Tu producto "${productName}" vence en ${daysUntil} día(s).`;
  } else {
    subject = `📅 Recordatorio: ${productName}`;
    message = `Tu producto "${productName}" vence en ${daysUntil} días.`;
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: userEmail,
          product_name: productName,
          days_until: daysUntil,
          message: message,
          subject: subject,
        },
      }),
    });

    if (response.ok) {
      console.log('✅ Email enviado a:', userEmail);
      return true;
    } else {
      console.error('❌ Error email:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// ============================================
// FUNCIÓN: Obtener usuarios de Firebase Auth
// ============================================
async function getUsers() {
  try {
    // Usando Firebase REST API (no requiere SDK admin)
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUserInfo: true })
      }
    );
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

// ============================================
// FUNCIÓN: Obtener productos de Firestore
// ============================================
async function getProducts(userId) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/productos`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${FIREBASE_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Error obteniendo productos:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.documents) return [];

    // Filtrar por userId y transformar datos
    const products = data.documents
      .filter(doc => {
        const userIdField = doc.fields?.userId?.stringValue;
        return userIdField === userId;
      })
      .map(doc => ({
        name: doc.fields?.name?.stringValue || '',
        expire_date: doc.fields?.expire_date?.stringValue || '',
      }));

    return products;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// ============================================
// FUNCIÓN PRINCIPAL: Verificar productos
// ============================================
async function checkExpiringProducts() {
  console.log('🔍 Iniciando verificación de productos...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Obtener todos los usuarios
    const users = await getUsers();
    console.log(`👥 ${users.length} usuarios encontrados`);

    let totalEmailsSent = 0;

    for (const user of users) {
      if (!user.email) continue;

      console.log(`📧 Verificando productos de: ${user.email}`);

      // Obtener productos del usuario
      const products = await getProducts(user.localId);
      console.log(`  📦 ${products.length} productos`);

      for (const product of products) {
        if (!product.expire_date) continue;

        // Calcular días hasta vencimiento
        const [year, month, day] = product.expire_date.split('-').map(Number);
        const expireDate = new Date(year, month - 1, day);
        expireDate.setHours(0, 0, 0, 0);

        const daysUntil = Math.floor((expireDate - today) / (1000 * 60 * 60 * 24));

        // Enviar email si cumple criterios
        const shouldNotify = 
          daysUntil === 3 ||
          daysUntil === 1 ||
          daysUntil === 0 ||
          daysUntil === -1;

        if (shouldNotify) {
          console.log(`  📧 Enviando: ${product.name} (${daysUntil} días)`);
          
          const success = await sendExpirationEmail(
            user.email,
            product.name,
            daysUntil
          );

          if (success) totalEmailsSent++;
          
          // Pausa entre emails
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`✅ Verificación completada. ${totalEmailsSent} emails enviados.`);
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// ============================================
// CRON JOB: Ejecutar cada día a las 8:00 AM
// ============================================
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Ejecutando verificación programada...');
  checkExpiringProducts();
}, {
  timezone: "America/Bogota"
});

// ============================================
// ENDPOINTS
// ============================================

// Endpoint principal (para que Render.com sepa que está vivo)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend de Mi Despensa funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para verificar manualmente
app.get('/check-now', async (req, res) => {
  console.log('🔍 Verificación manual solicitada');
  await checkExpiringProducts();
  res.json({ message: 'Verificación completada' });
});

// Endpoint para mantener el servidor activo (ping cada 14 min)
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', time: new Date().toISOString() });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`⏰ Cron job configurado para las 8:00 AM (America/Bogota)`);
  
  // Verificación inicial al iniciar
  setTimeout(() => {
    console.log('🔍 Verificación inicial...');
    checkExpiringProducts();
  }, 5000);
});

// ============================================
// MANTENER SERVIDOR ACTIVO (Auto-ping)
// ============================================
// Render.com duerme apps gratis después de 15 min de inactividad
// Este código hace ping cada 14 minutos para mantenerlo activo
setInterval(() => {
  console.log('🏓 Auto-ping para mantener servidor activo');
  fetch(`http://localhost:${PORT}/ping`).catch(() => {});
}, 14 * 60 * 1000); // 14 minutos