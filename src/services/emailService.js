// 📧 Servicio para enviar emails con EmailJS
const EMAILJS_SERVICE_ID = 'service_cnriqls';
const EMAILJS_TEMPLATE_ID = 'template_auzavs5';
const EMAILJS_PUBLIC_KEY = 'TZAwQh_SmAVCxqk0a';

/**
 * Envía un email de notificación de vencimiento
 * @param {string} userEmail - Email del usuario
 * @param {string} productName - Nombre del producto
 * @param {number} daysUntil - Días hasta vencimiento (0 = hoy, negativo = vencido)
 */
export async function sendExpirationEmail(userEmail, productName, daysUntil) {
  if (!userEmail || !productName) {
    console.error('❌ Email o nombre de producto faltante');
    return false;
  }

  try {
    let message;
    let subject;

    if (daysUntil < 0) {
      const diasVencido = Math.abs(daysUntil);
      subject = `⚠️ Producto vencido: ${productName}`;
      message = `Tu producto "${productName}" venció hace ${diasVencido} día(s). ¡Revisa tu despensa!`;
    } else if (daysUntil === 0) {
      subject = `🚨 ¡VENCE HOY!: ${productName}`;
      message = `¡Tu producto "${productName}" vence HOY! Úsalo pronto.`;
    } else if (daysUntil <= 3) {
      subject = `⏰ Próximo a vencer: ${productName}`;
      message = `Tu producto "${productName}" vence en ${daysUntil} día(s). Planifica usarlo pronto.`;
    } else {
      subject = `📅 Recordatorio: ${productName}`;
      message = `Tu producto "${productName}" vence en ${daysUntil} días.`;
    }

    const emailData = {
      to_email: userEmail,
      product_name: productName,
      days_until: daysUntil,
      message: message,
      subject: subject,
    };

    console.log('📧 Enviando email:', {
      to: userEmail,
      product: productName,
      days: daysUntil
    });

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: emailData,
      }),
    });

    if (response.ok) {
      console.log('✅ Email enviado exitosamente a:', userEmail);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Error enviando email:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en sendExpirationEmail:', error);
    return false;
  }
}

/**
 * Envía un email de bienvenida al registrarse
 */
export async function sendWelcomeEmail(userEmail, userName = 'Usuario') {
  try {
    const emailData = {
      to_email: userEmail,
      user_name: userName,
      message: '¡Bienvenido a Mi Despensa! Ahora puedes gestionar tus productos y recibir alertas de vencimiento.',
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: emailData,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error);
    return false;
  }
}

// Funciones dummy para compatibilidad con código antiguo
export async function scheduleProductNotifications() {
  console.log('ℹ️ Usando sistema de emails en vez de notificaciones push');
  return Promise.resolve();
}

export async function cancelProductNotifications() {
  console.log('ℹ️ Sistema de notificaciones push deshabilitado');
  return Promise.resolve();
}

export async function requestNotificationPermissions() {
  console.log('ℹ️ Usando sistema de emails para notificaciones');
  return Promise.resolve(true);
}