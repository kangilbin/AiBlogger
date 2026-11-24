import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={24}
      color={focused ? Colors.primary : Colors.textSecondary}
    />
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '새 글',
          tabBarIcon: ({ focused }) => <TabIcon name="create" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '이력',
          tabBarIcon: ({ focused }) => <TabIcon name="time" focused={focused} />,
        }}
      />
      <Tabs.Screen name="preview" options={{ href: null }} />
      <Tabs.Screen name="publish" options={{ href: null }} />
      <Tabs.Screen name="browser" options={{ href: null }} />
    </Tabs>
  );
}