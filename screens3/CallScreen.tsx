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



// requires local stream en remote stream to be passed
export default function CallScreen(route) {

  const [localStream, setLocalStream] = useState<MediaStream | null>(route.localStream)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(route.localStream)
  
  //const [gettingCall, setGettingCall] = useState(false);
  //const pc = useRef<RTCPeerConnection>();
  console.log("call screen")
  console.log(route)
  
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

  // displayed uw local en remote stream als connected
  return (
    <View style={styles.videoContainer}>

      <Video hangup={hangup} localStream={route.localStream} remoteStream={route.remoteStream} />
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






