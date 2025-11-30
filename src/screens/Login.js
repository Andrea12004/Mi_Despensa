import * as React from 'react';
import * as RN from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../config/fb';

export default function Login() {
  const [mode, setMode] = React.useState('login'); 
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showPassword, setShowPassword] = React.useState(false);

  // Función para LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Intentando iniciar sesión...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login exitoso:', userCredential.user.email);
      
      // ✅ Navigation detectará automáticamente el cambio con onAuthStateChanged
      
    } catch (error) {
      console.error('❌ Error login:', error.code);
      
      let mensaje = 'Error al iniciar sesión';
      
      if (error.code === 'auth/user-not-found') {
        mensaje = 'No existe una cuenta con este correo';
      } else if (error.code === 'auth/wrong-password') {
        mensaje = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'Correo electrónico inválido';
      } else if (error.code === 'auth/invalid-credential') {
        mensaje = 'Credenciales inválidas. Verifica tu email y contraseña';
      }
      
      setError(mensaje);
      setLoading(false);
    }
  };

  // Función para REGISTRO
  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Registrando usuario...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Registro exitoso:', userCredential.user.email);
      
      RN.Alert.alert(
        '✅ ¡Cuenta creada!',
        'Tu cuenta se ha creado exitosamente',
        [{ text: 'OK' }]
      );
      
      // ✅ Navigation detectará automáticamente el cambio
      
    } catch (error) {
      console.error('❌ Error registro:', error.code);
      
      let mensaje = 'Error al crear la cuenta';
      
      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Este correo ya está registrado. Inicia sesión o usa otro correo';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'Correo electrónico inválido';
      } else if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña es muy débil';
      }
      
      setError(mensaje);
      setLoading(false);
    }
  };

  // Función para RECUPERAR CONTRASEÑA
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📧 Enviando email de recuperación a:', email);
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Email de recuperación enviado');
      
      RN.Alert.alert(
        '📧 Email enviado',
        `Se ha enviado un correo a ${email} con instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada y spam.`,
        [
          { 
            text: 'OK', 
            onPress: () => setMode('login') 
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error recuperación:', error.code, error.message);
      
      let mensaje = 'Error al enviar el correo';
      
      if (error.code === 'auth/user-not-found') {
        mensaje = 'No existe una cuenta con este correo';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'Correo electrónico inválido';
      } else if (error.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos. Espera un momento e intenta de nuevo';
      }
      
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar entre modos
  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <RN.KeyboardAvoidingView 
      style={styles.container}
      behavior={RN.Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <RN.ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <RN.View style={styles.logoContainer}>
          <RN.Text style={styles.logoEmoji}>🏪</RN.Text>
        </RN.View>

        <RN.Text style={styles.title}>Mi Despensa</RN.Text>
        <RN.Text style={styles.subtitle}>
          {mode === 'login' && 'Inicia sesión para continuar'}
          {mode === 'register' && 'Crea tu cuenta nueva'}
          {mode === 'forgot' && 'Recupera tu contraseña'}
        </RN.Text>

        {error ? (
          <RN.View style={styles.errorContainer}>
            <RN.Text style={styles.errorText}>⚠️ {error}</RN.Text>
          </RN.View>
        ) : null}

        <RN.View style={styles.inputContainer}>
          <RN.Text style={styles.label}>Correo electrónico</RN.Text>
          <RN.TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
        </RN.View>

        {mode !== 'forgot' && (
          <RN.View style={styles.inputContainer}>
            <RN.Text style={styles.label}>Contraseña</RN.Text>
            <RN.View style={styles.passwordContainer}>
              <RN.TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <RN.TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <RN.Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </RN.Text>
              </RN.TouchableOpacity>
            </RN.View>
          </RN.View>
        )}

        {mode === 'register' && (
          <RN.View style={styles.inputContainer}>
            <RN.Text style={styles.label}>Confirmar contraseña</RN.Text>
            <RN.TextInput
              style={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
          </RN.View>
        )}

        <RN.TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => {
            if (mode === 'login') handleLogin();
            else if (mode === 'register') handleRegister();
            else if (mode === 'forgot') handleForgotPassword();
          }}
          disabled={loading}
        >
          {loading ? (
            <RN.ActivityIndicator color="#fff" />
          ) : (
            <RN.Text style={styles.buttonText}>
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'register' && 'Crear Cuenta'}
              {mode === 'forgot' && 'Enviar Email de Recuperación'}
            </RN.Text>
          )}
        </RN.TouchableOpacity>

        <RN.View style={styles.linksContainer}>
          {mode === 'login' && (
            <>
              <RN.TouchableOpacity onPress={() => switchMode('register')}>
                <RN.Text style={styles.link}>
                  ¿No tienes cuenta? <RN.Text style={styles.linkBold}>Regístrate</RN.Text>
                </RN.Text>
              </RN.TouchableOpacity>
              
              <RN.TouchableOpacity 
                onPress={() => switchMode('forgot')}
                style={{ marginTop: 12 }}
              >
                <RN.Text style={styles.link}>
                  ¿Olvidaste tu contraseña?
                </RN.Text>
              </RN.TouchableOpacity>
            </>
          )}

          {mode === 'register' && (
            <RN.TouchableOpacity onPress={() => switchMode('login')}>
              <RN.Text style={styles.link}>
                ¿Ya tienes cuenta? <RN.Text style={styles.linkBold}>Inicia sesión</RN.Text>
              </RN.Text>
            </RN.TouchableOpacity>
          )}

          {mode === 'forgot' && (
            <RN.TouchableOpacity onPress={() => switchMode('login')}>
              <RN.Text style={styles.link}>
                ← Volver al inicio de sesión
              </RN.Text>
            </RN.TouchableOpacity>
          )}
        </RN.View>
      </RN.ScrollView>
    </RN.KeyboardAvoidingView>
  );
}

const styles = RN.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dce2',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#365c36ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#365c36ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#365c36ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#8fbc8f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linksContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    fontSize: 14,
    color: '#666',
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#365c36ff',
  },
});