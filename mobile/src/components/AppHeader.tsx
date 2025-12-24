import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { customColors } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AppHeaderNavigationProp = StackNavigationProp<RootStackParamList>;

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showHelp?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, showBack = false, showHelp = true }) => {
  const navigation = useNavigation<AppHeaderNavigationProp>();

  const handleHelpPress = () => {
    navigation.navigate('Ajuda');
  };

  return (
    <Appbar.Header style={styles.header}>
      {showBack && navigation.canGoBack() && (
        <Appbar.BackAction onPress={() => navigation.goBack()} iconColor={customColors.text} />
      )}
      <View style={styles.brandContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text variant="titleLarge" style={styles.brandName}>
          Rachid
        </Text>
      </View>
      {title && (
        <View style={styles.titleContainer}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        </View>
      )}
      {showHelp && !showBack && (
        <Appbar.Action
          icon={() => <MaterialCommunityIcons name="help-circle-outline" size={24} color={customColors.text} />}
          onPress={handleHelpPress}
        />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(11, 18, 32, 0.78)',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.14)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  brandName: {
    fontWeight: '800',
    letterSpacing: -0.5,
    color: 'rgba(255, 255, 255, 0.98)',
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  title: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
  },
});

export default AppHeader;

