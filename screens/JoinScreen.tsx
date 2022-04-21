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
    const [localStream, setLocalStream] = useState<MediaStream | null>()
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>()
    const [gettingCall, setGettingCall] = useState(false);
    const pc = useRef<RTCPeerConnection>();
    const [meetingLinkInput, onChangeMeetingLinkInput] = useState<string>();
    //const connecting = useRef(false);

    console.log("join screen")
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
            console.log("remote stream found");
            setGettingCall(true);
        }
    };

    const hangup = async () => {
        console.log("hang up")
        //setGettingCall(false);
        //connecting.current =false;
        streamCleanUp();
        fireStoreCleanUp();
        //if (pc.current){
        //  pc.current.close();
        // }
    
    
        // TODO navigate to previous
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
        //const cRef = firestore().collection('meet').doc(meetingLinkInput);
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


    
    const collectIceCandidates = async (
        cRef: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentChange>,
        localName: string,
        remoteName: string
    
      ) => {
        console.log("collecting ice candidates")
        const candidateCollection = cRef.collection(localName);
    
    
        if(pc.current){
          // on new ICE candidate add it to firesstore
          pc.current.onicecandidate = (event) => {
            if(event.candidate){
              candidateCollection.add(event.candidate);
            }
          };
        }
    
          // Get the ice candidate added to firestore and update local pc
          cRef.collection(remoteName).onSnapshot(snapshot =>{
            snapshot.docChanges().forEach((change) =>{
              if(change.type == 'added'){
                const candidate = new RTCIceCandidate(change.doc.data())
                pc.current?.addIceCandidate(candidate);
              
              } 
            })
          })
        };

    const join = async () => {
        console.log("Joining the call");
        //connecting.current = true;
        //setGettingCall(false);

        const cRef = firestore().collection('meet').doc('chatId');
        //const cRef = firestore().collection('meet').doc(meetingLinkInput);
        const offer = (await cRef.get()).data()?.offer;


        if (offer) {

            // Setup Webrtc
            await setUpWebrtc();

            // Exchange the ICE candidates
            // check the parameters its reversed since the joing part is callee
            collectIceCandidates(cRef, "callee", "caller");

            if (pc.current) {
                pc.current.setRemoteDescription(new RTCSessionDescription(offer));

                // Create the answer for the call
                // Update the document with answer
                const answer = await pc.current.createAnswer();
                pc.current.setLocalDescription(answer)
                const cWithAnswer = {
                    answer: {
                        type: answer.type,
                        sdp: answer.sdp,
                    },
                };
                cRef.update(cWithAnswer);
            }
        }


        /**
         * For disconnecting the call close the connection, release the stream
         * Delte the document for the call
         */

    };

    if(gettingCall){
        return(
            <View style={styles.videoContainer}>
            <Video hangup={hangup} localStream={localStream} remoteStream={remoteStream} />
            
        </View>
        )

    }

    // displayed uw local en remote stream als connected
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Fill in meeting link</Text>
            <TextInput 
                style = {styles.input}
                value={meetingLinkInput}
                onChangeText={onChangeMeetingLinkInput}
        
                />
            <Button
                title="Join"
                onPress={() => {
                    join()
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
    },
    input:{
        borderWidth:1,
        height:40,
        width:200,
        margin:12,
        padding: 10
    }
});






