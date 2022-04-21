// In App.js in a new project

import * as React from 'react';
import { View, Text,Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import WaitingRoomScreen from './screens/WaitingRoomScreen';
import CallScreen from './screens/CallScreen';
import JoinScreen from './screens/JoinScreen';



const Stack = createNativeStackNavigator();

function App() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{headerShown:false}}>
          <Stack.Screen name="HomeScreen" component={HomeScreen}/>
          <Stack.Screen name="WaitingRoomScreen" component={WaitingRoomScreen}/>
          <Stack.Screen name="JoinScreen" component={JoinScreen}/>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

export default App;