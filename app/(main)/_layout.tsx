import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={26}
      color={focused ? Colors.primary : Colors.textDisabled}
    />
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDisabled,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.fill,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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