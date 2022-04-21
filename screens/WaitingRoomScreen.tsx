import React, { useState, useRef, useEffect } from 'react';

import Video from '../components/Video'

import {
    SnapshotViewIOSBase,
    StyleSheet,
    View,
    Text,
    Button,
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


export default function WaitingRoomScreen({ navigation }) {

    const [localStream, setLocalStream] = useState<MediaStream | null>()
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>()
    const [gettingCall, setGettingCall] = useState(false);
    const pc = useRef<RTCPeerConnection>();
    const connecting = useRef(false);
    const [roomCode, setRoomCode] = useState<string>();

    console.log("waiting room")

    
    useEffect(() => {
        console.log("using effect")
        const cRef = firestore().collection('meet').doc('chatId');
        //const cRef = firestore().collection('meet').doc(roomCode);
        const subscribe = cRef.onSnapshot(snapshot => {
            const data = snapshot.data();

            // On asnwer start the call
            if (pc.current && !pc.current.remoteDescription && data && data.answer) {
                pc.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            }

        });

        // On delte of collection call hangup
        // The other side has clicked on hangup
        const subscribeDelete = cRef.collection('callee').onSnapshot(snapshot => {
            snapshot.docChanges().forEach((change) => {
                if (change.type == 'removed') {
                    console.log("Hung up");
                    hangup()
                }
            });
        });

        return () => {
            subscribe();
            subscribeDelete();
        }


    }, [])
    

    const hangup = async () => {
        console.log("hang up")
        //setGettingCall(false);
        connecting.current = false;
        streamCleanUp();
        fireStoreCleanUp();
        if (pc.current) {
            pc.current.close();
        }
        navigation.navigate('HomeScreen');
    };

    // Helper function
    const streamCleanUp = async () => {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream.release();
        }
        // door deze setters op te roepen wordt de hele app herladen en daarom wordt correct teruggegaan naar de vorige screen
        setLocalStream(null);
        setRemoteStream(null);

    };


    const fireStoreCleanUp = async () => {
        const cRef = firestore().collection('meet').doc('chatId');
        //const cRef = firestore().collection('meet').doc(roomCode);

        if (cRef) {
            const calleeCandidate = await cRef.collection('callee').get();
            calleeCandidate.forEach(async (candidate) => {
                await candidate.ref.delete();
            })
            const callerCandidate = await cRef.collection('caller').get();
            callerCandidate.forEach(async (candidate) => {
                await candidate.ref.delete();
            })

            cRef.delete();
        }
    };


    // setup webrtc
    const setUpWebrtc = async () => {
        console.log("Set up")
        pc.current = new RTCPeerConnection(configuration);

        // Get the audio and video stream for the call
        const stream = await Utils.getStream()
        if (stream) {
            setLocalStream(stream);
            pc.current.addStream(stream);
        }

        // Get the remote sstream once it is available
        pc.current.onaddstream = (event: EventOnAddStream) => {
            setRemoteStream(event.stream)
            // van zodra er een remote stream beschikbaar is navigaten we naar het callscreen
            console.log('new stream')
            setGettingCall(true);
            
        }
    };

   

    // collect ice candidates
    const collectIceCandidates = async (
        cRef: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentChange>,
        localName: string,
        remoteName: string

    ) => {
        console.log("collecting ice candidates")
        const candidateCollection = cRef.collection(localName);


        if (pc.current) {
            // on new ICE candidate add it to firesstore
            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    candidateCollection.add(event.candidate);
                }
            };
        }

        // Get the ice candidate added to firestore and update local pc
        cRef.collection(remoteName).onSnapshot(snapshot => {
            snapshot.docChanges().forEach((change) => {
                if (change.type == 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data())
                    pc.current?.addIceCandidate(candidate);

                }
            })
        })
    };


    const generateRoomCode = () => {
        return "testroom";
    }

    // create the room
    const create = async () => {
        console.log("Creating room");
        connecting.current = true;
        // setUp webrtc
        await setUpWebrtc();
        
        //const roomCode = generateRoomCode()
        //setRoomCode(roomCode)
        //Document for the call
        const cRef = firestore().collection("meet").doc('chatId');
        //const cRef = firestore().collection("meet").doc(roomCode);


        /** 
        // SUBSCRIBE
        cRef.onSnapshot(snapshot => {
            const data = snapshot.data();

            // On asnwer start the call
            if (pc.current && !pc.current.remoteDescription && data && data.answer) {
                pc.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            }
        })


        cRef.collection('callee').onSnapshot(snapshot => {
            snapshot.docChanges().forEach((change) => {
                if (change.type == 'removed') {
                    console.log("Hung up");
                    hangup()
                }
            });
        });
        */
        // Exchange the ICE candidates between teh caller and callee
        collectIceCandidates(cRef, "caller", "callee")

        if (pc.current) {
            // Create the offer for the call
            // Store the offer under the document
            const offer = await pc.current.createOffer(undefined);
            pc.current.setLocalDescription(offer);


            const cWithOffer = {
                offer: {
                    type: offer.type,
                    sdp: offer.sdp,

                },
            };

            cRef.set(cWithOffer);
        }
    };

    if(gettingCall){
        return(
            <View style={styles.videoContainer}>
            <Video hangup={hangup} localStream={localStream} remoteStream={remoteStream} />
            
        </View>
        )

    }
   
    if (roomCode){
        return (
            <View style={styles.videoContainer}>
                <Video hangup={hangup} localStream={localStream} remoteStream={null} />
                <Text> roomcode = {roomCode}</Text>
             
            </View>
    
    
        )
    }
    // display uw local stream
    return (
        
        
         
        <View style={styles.videoContainer}>
            <Video hangup={hangup} localStream={localStream} remoteStream={null} />

            <Button
                title="Create room"
                onPress={() => {
                    create()
                }
                }
            />
        </View>


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
    }
});