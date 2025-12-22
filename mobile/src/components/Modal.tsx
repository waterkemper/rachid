import React from 'react';
import { Modal, Portal, Text, Button, Card } from 'react-native-paper';

interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: React.ReactNode;
}

const AppModal: React.FC<ModalProps> = ({ visible, onDismiss, title, children }) => {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ padding: 20 }}>
        <Card>
          <Card.Title title={title} />
          <Card.Content>
            {children}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

export default AppModal;

