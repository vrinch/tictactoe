import { Stack } from 'expo-router';

const options = { headerShown: false };

// Main navigation stack layout
const RoutesLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...options,
        }}
      />
      <Stack.Screen
        name="(main)"
        options={{
          ...options,
        }}
      />
      <Stack.Screen
        name="+not-found"
        options={{
          ...options,
        }}
      />
    </Stack>
  );
};

export default RoutesLayout;
