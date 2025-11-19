import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CustomAlert({ visible, title, message, buttons, onClose }) {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Title */}
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
          
          {/* Message */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons?.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.buttonDestructive,
                  button.style === 'cancel' && styles.buttonCancel,
                  buttons.length === 1 && styles.buttonSingle,
                ]}
                onPress={() => {
                  button.onPress?.();
                  onClose();
                }}
              >
                <Text style={[
                  styles.buttonText,
                  button.style === 'destructive' && styles.buttonTextDestructive,
                  button.style === 'cancel' && styles.buttonTextCancel,
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#6C4CF7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f5f5f5',
  },
  buttonDestructive: {
    backgroundColor: '#f44336',
  },
  buttonSingle: {
    backgroundColor: '#6C4CF7',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#666',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

