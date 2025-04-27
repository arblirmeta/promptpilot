import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TabProps {
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
}

const Tab: React.FC<TabProps> = ({ label, icon, isActive, onPress }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.tab,
        {
          backgroundColor: isActive 
            ? (isDark ? theme.colors.primary + '15' : theme.colors.primary + '10') 
            : 'transparent',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <MaterialCommunityIcons 
          name={icon as any} 
          size={20} 
          color={isActive ? theme.colors.primary : theme.colors.subtext}
          style={styles.tabIcon}
        />
      )}
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? theme.colors.primary : theme.colors.subtext,
            fontWeight: isActive ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
      {isActive && (
        <View 
          style={[
            styles.activeIndicator,
            { backgroundColor: theme.colors.primary }
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

interface TabBarProps {
  tabs: string[];
  icons?: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
  scrollable?: boolean;
  elevated?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  icons,
  activeTab,
  onTabChange,
  scrollable = false,
  elevated = false,
}) => {
  const { theme, isDark } = useTheme();
  
  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <Tab
        key={index}
        label={tab}
        icon={icons ? icons[index] : undefined}
        isActive={activeTab === index}
        onPress={() => onTabChange(index)}
      />
    ));
  };
  
  if (scrollable) {
    return (
      <View
        style={[
          styles.container,
          { 
            borderBottomColor: theme.colors.divider,
            backgroundColor: theme.colors.card,
            ...elevated && theme.shadows.small[isDark ? 'dark' : 'light']
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {renderTabs()}
        </ScrollView>
      </View>
    );
  }
  
  return (
    <View
      style={[
        styles.container,
        { 
          borderBottomColor: theme.colors.divider,
          backgroundColor: theme.colors.card,
          ...elevated && theme.shadows.small[isDark ? 'dark' : 'light']
        },
      ]}
    >
      <View style={styles.tabsContainer}>{renderTabs()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    elevation: 1,
    zIndex: 10,
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 80,
    position: 'relative',
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tabIcon: {
    marginRight: 6,
  },
  activeIndicator: {
    position: 'absolute',
    height: 3,
    width: '50%',
    bottom: 0,
    borderRadius: 1.5,
  },
});

export default TabBar;
