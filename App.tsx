// In App.js in a new project

import * as React from 'react';
import { View, Text,Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import CallScreen from './screens/CallScreen';
import JoinScreen from './screens/JoinScreen';
import TestScreen from './screens/TestScreen';
import SelectJoinScreen from './screens/SelectJoinScreen';
import SelectCreateScreen from './screens/SelectCreateScreen';
import CreateRoomScreen from './screens/CreateRoomScreen';
import HomeScreenNew from './screens_new/HomeScreenNew';
import JoinScreenNew from './screens_new/JoinScreenNew';



const Stack = createNativeStackNavigator();


/**Run old 
function App() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{headerShown:false}}>
          <Stack.Screen name="HomeScreen" component={HomeScreen}/>
          <Stack.Screen name="CreateRoomScreen" component={CreateRoomScreen}/>
          <Stack.Screen name="JoinScreen" component={JoinScreen}/>
          <Stack.Screen name="TestScreen" component={TestScreen}/>
          <Stack.Screen name="SelectJoinScreen" component={SelectJoinScreen}/>
          <Stack.Screen name="SelectCreateScreen" component={SelectCreateScreen}/>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
*/

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreenNew" screenOptions={{headerShown:false}}>
        <Stack.Screen name="HomeScreenNew" component={HomeScreenNew}/>
        <Stack.Screen name="JoinScreenNew" component={JoinScreenNew}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default App;