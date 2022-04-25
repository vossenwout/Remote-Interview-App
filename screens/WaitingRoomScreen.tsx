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


export default function WaitingRoomScreen({ navigation }) {

    const [localStream, setLocalStream] = useState<MediaStream | null>()
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>()
    const [gettingCall, setGettingCall] = useState(false);
    const pc = useRef<RTCPeerConnection>();
    //const connecting = useRef(false);
    const [roomCode, setRoomCode] = useState<string>();
    const [meetingLinkInput, onChangeMeetingLinkInput] = useState<string>();
    var removeListener;
    var iceListener;
    var snapshotListener;


    //console.log("waiting room")

    const hangup = async () => {
        if (pc.current) {
            console.log("hang up waiting")

            removeListeners();

            await streamCleanUp().catch(e => {
                console.log("failure with cleaning stream")
                console.log(e)
            });
            await fireStoreCleanUp().catch(e => {
                console.log("failure with cleining firebase")
                console.log(e)
            });
            if (pc.current) {
                pc.current.close();
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }
            }
        }
        //navigation.navigate('HomeScreen');

    };

    const callerHungup = async () => {
        if (pc.current) {
            removeListeners();

            console.log("other hung up (waiting)")
            await streamCleanUp().catch(e => {
                console.log("failure with cleaning stream")
                console.log(e)
            });

            if (pc.current) {
                pc.current.close();
                if (navigation.canGoBack()) {
                    navigation.goBack()
                }
            }
        }
        //navigation.navigate('HomeScreen');



    };

    const removeListeners = () => {
        if (removeListener || iceListener || snapshotListener) {
            console.log("remove listeners joining")
            if (removeListener) {
                removeListener();
                removeListener = null;
            }
            if (iceListener) {
                iceListener();
                iceListener = null;
            }
            if (removeListener) {
                removeListener()
                removeListener = null;
            }
        }
    }

    // Helper function
    const streamCleanUp = async () => {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream.release();
            setLocalStream(null);
            setRemoteStream(null);
        }


    };


    const fireStoreCleanUp = async () => {

        //const cRef = firestore().collection('meet').doc('chatId');
        const cRef = firestore().collection('meet').doc(roomCode);

        if (cRef) {
            const calleeCandidate = await cRef.collection('callee').get();
            calleeCandidate.forEach(async (candidate) => {
                console.log("ice from join deleted")
                await candidate.ref.delete();
            })
            const callerCandidate = await cRef.collection('caller').get();
            callerCandidate.forEach(async (candidate) => {
                console.log("ice from waiting deleted")
                await candidate.ref.delete();
            })

            cRef.delete();
        }
    };


    // collect ice candidates
    const collectIceCandidates = async (
        cRef: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentChange>,
        localName: string,
        remoteName: string

    ) => {

        const candidateCollection = cRef.collection(localName);


        if (pc.current) {
            // after setLocalDescription the ice candidates of the caller gets searched
            // when found the onicecandidate event is triggered and we add the ice candidate to the firestore
            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    candidateCollection.add(event.candidate).catch(e => {
                        console.log("failure with putting local ice candidate on firebase (waiting)")
                        console.log(e)
                    });
                    console.log("added ice candidate from waiting ")
                }
            };
        }

        // If callee adds his ice candidates to the firestore they get added to the peer connection
        // of the caller so the caller knows how to reach the callee
        iceListener = cRef.collection(remoteName).onSnapshot(snapshot => {
            snapshot.docChanges().forEach((change) => {

                if (change.type == 'added') {
                    console.log("received ice candidate  from join in waiting room ")
                    const candidate = new RTCIceCandidate(change.doc.data())
                    pc.current?.addIceCandidate(candidate).catch(e => {
                        console.log("failure with getting remote ice candidate from firebase (waiting)")
                        console.log(e)
                    });

                }
            })
        })
    };

    // TODO generate unique codes
    const generateRoomCode = () => {
        return meetingLinkInput;
    }


    // For some reason sometimes firebase is still reporting events of the previous time the room was used (after it was cleared)
    // so we flush the vents with this
    const clearLeftOverEvents = (cRef) => {
        console.log("cref")
        console.log(cRef)
        var clearRemoveListener = cRef.collection('callee').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async (change) => {
                console.log("change detected in startup")
            });
        });
        // unsubscribe


        var clearIceListener = cRef.collection("callee").onSnapshot(snapshot => {
            snapshot.docChanges().forEach((change) => {
                console.log("change detected in startup")
            })
        })
        clearRemoveListener();
        clearIceListener();
    }

    // create the room
    const create = async () => {

        // Communication over webrtc happens with peer connection
        pc.current = new RTCPeerConnection(configuration);

        // Get the audio and video stream for the call
        const stream = await Utils.getStream().catch(error => console.log(error))

        // Add local stream to peer connection
        if (stream) {
            setLocalStream(stream);
            pc.current.addStream(stream);
        }

        // Get the remote sstream once it is available
        pc.current.onaddstream = (event) => {
            console.log("new stream found (waiting)")
            setRemoteStream(event.stream)
            // van zodra er een remote stream beschikbaar is navigaten we naar het callscreen
            console.log('new stream set waiting')
            setGettingCall(true);
        }

        // generate unique code for the room
        const roomCode = generateRoomCode()

        setRoomCode(roomCode)

        // firebase is useed to communicate info how the peers can connect
        const cRef = firestore().collection("meet").doc(roomCode);

        clearLeftOverEvents(cRef);

        // listen for connection information from callee
        snapshotListener = cRef.onSnapshot(async snapshot => {
            const data = snapshot.data();
            // add info to the remote description
            if (pc.current && !pc.current.remoteDescription && data && data.answer) {
                console.log("setting remote descirption waiting room")
                await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(e => {
                    console.log("failure with setting remote description waiting room")
                    console.log(e)
                })
                console.log("set romte discription waiting")
            }
        })
        



        // if info is removed from the database the callee has hung up and we end the stream
        removeListener = cRef.collection('callee').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type == 'removed') {
                    console.log("remove info detected in waiting")
                    //await hangup().catch(e => {
                    //    console.log("failure with haning up waiting room")
                    //     console.log(e)
                    // })
                    //removeListeners()
                    callerHungup();
                }
            });
        });


        // Exchange the ICE candidates between teh caller and callee
        collectIceCandidates(cRef, "caller", "callee")


        if (pc.current) {
            // Create the offer for the call
            // Store the offer under the document
            const offer = await pc.current.createOffer(undefined);
            // set local description with the offer
            await pc.current.setLocalDescription(offer).catch(e => {
                console.log("failure with setting local description")
                console.log(e)
            })

            const cWithOffer = {
                offer: {
                    type: offer.type,
                    sdp: offer.sdp,

                },
            };

            await cRef.set(cWithOffer).catch(e => {
                console.log("failure with adding offer to firebase")
                console.log(e)
            });
        }

    };

    if (gettingCall) {
        console.log("getting call in waiting")
        console.log("remote stream")
        //console.log(remoteStream.toURL())
        //console.log(remoteStream)


        //return (
        //    <View style={styles.videoContainer}>
        //        <Text> Hello</Text>

        //    </View>
        //)

        //TODO dit loopt fout de 2de keer (enkel op ios).3

        // we kunnen niet de remote stream displayen
        //return (<View style = {styles.RTCcontainer}> 
        //    <RTCView 
        //   streamURL= {remoteStream.toURL()}
        //   objectFit={'cover'}
        //    style={styles.video}/>
        //</View>
        //   )       ;

        return (
            <View style={styles.videoContainer}>
                <Video hangup={hangup} localStream={localStream} remoteStream={remoteStream} />

            </View>
        )

    }



    if (roomCode) {
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
            <TextInput
                style={styles.input}
                value={meetingLinkInput}
                onChangeText={onChangeMeetingLinkInput}

            />
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
    RTCcontainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
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
    },
    video: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    videoLocal: {
        position: 'absolute',
        width: 100,
        height: 150,
        top: 0,
        left: 20,
        elevation: 10,
    },
});