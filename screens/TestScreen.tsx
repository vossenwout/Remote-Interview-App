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
} from 'react-native-webrtc'

import Utils from "../Utils"
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';


const configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };



// requires local stream en remote stream to be passed
export default function JoinScreen({ route, navigation }) {

    var iceListener;
    var removeListener;

    const [meetingLinkInput, onChangeMeetingLinkInput] = useState<string>();

    const update = async () => {
        console.log("creating firestore")
        const cRef = firestore().collection('test').doc("hello");

        console.log("hello added")
        cRef.set({ "sx": meetingLinkInput }).catch(e => {
            console.log("failure updating answer")
            console.log(e)
        });
    }

    const setinpd = async () => {
        console.log("creating firestore")
        const cRef = firestore().collection('test').doc("hello");

        console.log("hello added")
        cRef.update({ "test": meetingLinkInput }).catch(e => {
            console.log("failure updating answer")
            console.log(e)
        });
    }

    const subscribe = async () => {
        console.log("subscribing firestore")
        const cRef = firestore().collection('meet').doc("chatId");

        removeListener = cRef.collection('caller').onSnapshot(snapshot => {

            snapshot.docChanges().forEach(async (change) => {
              if (change.type == 'removed') {
                console.log("remove info detected in joining")
                console.log(change.type)
                console.log(change.doc)
                //await hangup().catch(e => {
                // console.log("failure with haning up waiting room")
                //  console.log(e)
                // })
              }else{
                console.log(change.type)
                console.log(change.doc)
              }
            });
          });
        //removeListener();

    }

    const unsubscribe = async () => {
        console.log("unsubscring firestore")
        if( removeListener){
            console.log("removed listener")
            removeListener();
            removeListener = null;
        }
    }


    return (
        <View style={styles.container}>
             <TextInput
        style={styles.input}
        value={meetingLinkInput}
        onChangeText={onChangeMeetingLinkInput}

      />
            <Button
                title="Subscribe"
                onPress={() => {
                    subscribe()
                }
                }
            />

            <Button
                title="Generate input"
                onPress={() => {
                    update()
                }
                }
            />

            <Button
                title="Unsubscribe input"
                onPress={() => {
                    unsubscribe()
                }
                }
            />

            <Button
                title="set input"
                onPress={() => {
                    setinpd()
                }
                }
            />

            <Button
                title="go back"
                onPress={() => {
                    navigation.navigate('HomeScreen')
                }
                }
            />

        </View >


    )


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },
    videoContainer: {
        flex: 1,
    },
    input: {
        borderWidth: 1,
        height: 40,
        width: 200,
        margin: 12,
        padding: 10
    }
});






