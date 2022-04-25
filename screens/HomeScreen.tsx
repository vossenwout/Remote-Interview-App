import React, { useState, useRef, useEffect } from 'react';
import GettingCall from '../components/GettingCall';
import Video from '../components/Video'
import { View, Text, Button } from 'react-native';

import {
    StyleSheet,
} from 'react-native';


export default function HomeScreen({ navigation }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button
                title="Join meeting"
                onPress={() => {
                    navigation.navigate('SelectJoinScreen')
                }
                }
            />

            <Button
                title="Create meeting"
                onPress={() => {
                    navigation.navigate('SelectCreateScreen')
                }
                }
            />


            <Button
                title="Testing"
                onPress={() => {
                    navigation.navigate('TestScreen')
                }
                }
            />



        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
});