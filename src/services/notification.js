import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Solicitar permisos para notificaciones
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('No se obtuvieron permisos para mostrar notificaciones');
    return false;
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6347',
    });
  }
  
  return true;
}

// Cancelar todas las notificaciones de un producto
export async function cancelProductNotifications(productId) {
  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of allNotifications) {
    if (notification.content.data?.productId === productId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Programar notificaciones para un producto
export async function scheduleProductNotifications(product) {
  if (!product.expire_date || !product.id) return;
  
  // Cancelar notificaciones anteriores de este producto
  await cancelProductNotifications(product.id);
  
  const [year, month, day] = product.expire_date.split('-').map(Number);
  const expireDate = new Date(year, month - 1, day);
  expireDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calcular días restantes
  const daysUntilExpire = Math.floor((expireDate - today) / (1000 * 60 * 60 * 24));
  
  // Si ya venció (días negativos)
  if (daysUntilExpire < 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: ' Producto Vencido',
        body: `${product.emoji} ${product.name} ya está vencido hace ${Math.abs(daysUntilExpire)} día(s). ¡Elimínalo de tu despensa!`,
        data: { productId: product.id, type: 'expired' },
        sound: true,
      },
      trigger: null, // Enviar inmediatamente
    });
    return;
  }
  
  // Si vence hoy (día 0)
  if (daysUntilExpire === 0) {
    const notificationTime = new Date();
    notificationTime.setHours(9, 0, 0, 0);
    
    // Solo programar si la hora aún no ha pasado hoy
    if (notificationTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Producto vence HOY!',
          body: `${product.emoji} ${product.name} vence hoy. ¡Úsalo pronto!`,
          data: { productId: product.id, type: 'today' },
          sound: true,
        },
        trigger: { type: 'date', date: notificationTime }, 
      });
    } else {
      // Si ya pasaron las 9 AM, enviar inmediatamente
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Producto vence HOY!',
          body: `${product.emoji} ${product.name} vence hoy. ¡Úsalo pronto!`,
          data: { productId: product.id, type: 'today' },
          sound: true,
        },
        trigger: null,
      });
    }
    return;
  }
  
  // Notificación 3 días antes (solo si faltan exactamente 3 o más días)
  if (daysUntilExpire >= 3) {
    const threeDaysBefore = new Date(expireDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    threeDaysBefore.setHours(9, 0, 0, 0);
    
    if (threeDaysBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: ' Producto próximo a vencer',
          body: `${product.emoji} ${product.name} vence en 3 días`,
          data: { productId: product.id, type: 'warning_3days' },
          sound: true,
        },
        trigger: { type: 'date', date: threeDaysBefore }
      });
    }
  }
  
  // Notificación 1 día antes (mañana vence)
  if (daysUntilExpire >= 2) {
    const oneDayBefore = new Date(expireDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0);
    
    if (oneDayBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Producto vence MAÑANA!',
          body: `${product.emoji} ${product.name} vence mañana. ¡No lo desperdicies!`,
          data: { productId: product.id, type: 'urgent_tomorrow' },
          sound: true,
        },
        trigger: { type: 'date', date: oneDayBefore },
      });
    }
  }
  
  // Notificación el día del vencimiento (solo si faltan más de 1 día)
  if (daysUntilExpire > 1) {
    const expirationDay = new Date(expireDate);
    expirationDay.setHours(9, 0, 0, 0);
    
    if (expirationDay > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Producto vence HOY!',
          body: `${product.emoji} ${product.name} vence hoy. ¡Úsalo pronto!`,
          data: { productId: product.id, type: 'expiring_today' },
          sound: true,
        },
        trigger: { type: 'date', date: expirationDay },
      });
    }
  }
}

// Verificar y actualizar notificaciones para productos vencidos
export async function checkExpiredProducts(products) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const product of products) {
    if (product.expire_date) {
      const expireDate = new Date(product.expire_date);
      expireDate.setHours(0, 0, 0, 0);
      
      const daysUntilExpire = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
      
      // Solo enviar notificación si el producto está vencido
      if (daysUntilExpire < 0) {
        // Verificar si ya se envió una notificación de vencido para este producto hoy
        const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const hasExpiredNotification = allNotifications.some(
          notif => notif.content.data?.productId === product.id && 
                   notif.content.data?.type === 'expired'
        );
        
        if (!hasExpiredNotification) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Producto Vencido',
              body: `${product.emoji} ${product.name} está vencido hace ${Math.abs(daysUntilExpire)} día(s). ¡Elimínalo de tu despensa!`,
              data: { productId: product.id, type: 'expired' },
              sound: true,
            },
            trigger: null,
          });
        }
      }
    }
  }
}