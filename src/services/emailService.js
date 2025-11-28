// 📧 Servicio para enviar emails con EmailJS
const EMAILJS_SERVICE_ID = 'service_cnriqls';  // Obtener de EmailJS
const EMAILJS_TEMPLATE_ID = 'template_auzavs5'; // Obtener de EmailJS
const EMAILJS_PUBLIC_KEY = 'TZAwQh_SmAVCxqk0a';   // Obtener de EmailJS

export async function sendExpirationEmail(userEmail, productName, daysUntil) {
  try {
    const emailData = {
      to_email: userEmail,
      product_name: productName,
      days_until: daysUntil,
      message: daysUntil === 0 
        ? `¡Tu producto "${productName}" vence HOY! Úsalo pronto.`
        : `Tu producto "${productName}" vence en ${daysUntil} días.`,
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

    if (response.ok) {
      console.log('Email enviado a:', userEmail);
      return true;
    } else {
      console.error(' Error enviando email:', response.status);
      return false;
    }
  } catch (error) {
    console.error(' Error en sendExpirationEmail:', error);
    return false;
  }
}

// Funciones dummy para compatibilidad (NO HACEN NADA)
export async function scheduleProductNotifications() {
  console.log('ℹ Notificaciones push deshabilitadas - usando emails');
  return Promise.resolve();
}

export async function cancelProductNotifications() {
  console.log('ℹNotificaciones push deshabilitadas');
  return Promise.resolve();
}

export async function requestNotificationPermissions() {
  console.log('ℹUsando sistema de emails en vez de notificaciones');
  return Promise.resolve(true);
}