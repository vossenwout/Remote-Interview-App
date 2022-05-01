import React, { useState, useRef, useEffect } from 'react';

import Video from '../components/Video'

import {
    SnapshotViewIOSBase,
    StyleSheet,
    View,
    Text,
    Button,
    TextInput
} from 'react-native';


import {
    MediaStream,
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView
} from 'react-native-webrtc'

import Utils from "../Utils"
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';


const configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };


export default function HomeScreen({ navigation }) {

    const [componentArray, updateArray] = useState([]);
    console.log("on home screen")


    useEffect(() => {
        console.log("using effect")
       
        // all the calls for this person
        const callDoc = firestore().collection('plannedInterviews').doc("Wout");
        const subscribe = callDoc.onSnapshot((snapshot) => {
            updateArray([]);
            if (snapshot.data()) {
                Object.entries(snapshot.data()).forEach(([roomKey, message]) => {
                    updateArray(existingItems => {
                        return [<Button key={roomKey} title={message} onPress={() => {
                            navigation.navigate("JoinScreenNew", {
                                roomCode: roomKey
                            });
                        }} />, ...existingItems]

                    })

                });
            }

        });


        return () => {
            console.log("use effect unsubscriptions")
            subscribe()
        }


    }, [])



    const addItemToStart = () => {
        updateArray(existingItems => {
            //return [<Text >"hello" </Text>, ...existingItems]
            return [<Button title="Join room" onPress={() => { addItemToStart() }} />, ...existingItems]

            // return [getRandomNumber()].concat(existingItems);
        })
    }



    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Planned interviews </Text>
            {componentArray}

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