import React, {useState, useRef, useEffect} from 'react';
import Button from '../components/Button';
import GettingCall from '../components/GettingCall';
import Video from'../components/Video'

import {
  SnapshotViewIOSBase,
  StyleSheet,
  View,
  Text,
} from 'react-native';


import {
  MediaStream, 
  RTCPeerConnection,
  EventOnAddStream,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc' 

import Utils from "../Utils"
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';


const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

export default function JoinScreen({route,navigation}) {

  const [localStream, setLocalStream] = useState<MediaStream | null>()
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>()
  const [gettingCall, setGettingCall] = useState(false);
  const pc = useRef<RTCPeerConnection>();
  const connecting = useRef(false);


  // Gets called when componen mounts
  useEffect(()=> {
    console.log("using effect")
    const cRef = firestore().collection('meet').doc(route.params.roomCode);

    const subscribe = cRef.onSnapshot(snapshot => {
      const data = snapshot.data();

      // On asnwer start the call
      if(pc.current && !pc.current.remoteDescription && data && data.answer){
        pc.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      }

      // if there is offer for chatId set the getting call flag
      if(data && data.offer && !connecting.current){
        setGettingCall(true);
      }
    });
    
    // On delte of collection call hangup
    // The other side has clicked on hangup
    const subscribeDelete =  cRef.collection('callee').onSnapshot(snapshot =>
      {
        snapshot.docChanges().forEach((change) =>{
          if (change.type == 'removed'){
            console.log("Hung up");
            hangup()
          }
        });
      });

      join()

      return () => {
        subscribe();
        subscribeDelete();
      }


  }, [])

  const setUpWebrtc = async () => {
    console.log("Set up")
    pc.current = new RTCPeerConnection(configuration);

    // Get the audio and video stream for the call
    const stream = await Utils.getStream() 
    if(stream){
      setLocalStream(stream);
      pc.current.addStream(stream);
    } 

    // Get the remote sstream once it is available
    pc.current.onaddstream = (event : EventOnAddStream) => {
      setRemoteStream(event.stream)
    }
  };

  


  const join = async () => {
    console.log("Joining the call");
    connecting.current = true;
    setGettingCall(false);

    const cRef = firestore().collection('meet').doc(route.params.roomCode);
    const offer = (await cRef.get()).data()?.offer;


    if(offer){

      // Setup Webrtc
      await setUpWebrtc();

      // Exchange the ICE candidates
      // check the parameters its reversed since the joing part is callee
      collectIceCandidates(cRef, "callee", "caller");

      if(pc.current){
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


  const hangup = async () => {
    console.log("hang up")
    setGettingCall(false);
    connecting.current =false;
    streamCleanUp();
    fireStoreCleanUp();
    if (pc.current){
      pc.current.close();
    }
    if (navigation.canGoBack()) {
        navigation.popToTop()
    }
  };

  // Helper function
  const streamCleanUp = async () => {
    if(localStream){
      localStream.getTracks().forEach(t=> t.stop());
      localStream.release();
    }
    // door deze setters op te roepen wordt de hele app herladen en daarom wordt correct teruggegaan naar de vorige screen
    setLocalStream(null);
    setRemoteStream(null);

  };


  const fireStoreCleanUp = async () => {
    const cRef = firestore().collection('meet').doc(route.params.roomCode);

    if(cRef){
      const calleeCandidate = await cRef.collection('callee').get();
      calleeCandidate.forEach( async (candidate) => {
          await candidate.ref.delete();
      })
      const callerCandidate = await cRef.collection('caller').get();
      callerCandidate.forEach( async (candidate) => {
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
  

  // Displays the local stream on calling
  // Displays both local and remote stream once a call is connected
  if(localStream){
    console.log("camera turned on")
    return (
        <View style = {styles.videoContainer}>

          <Video hangup = {hangup} localStream = {localStream} remoteStream = {remoteStream}/>
        </View>

       )
  }

  // displays the call button
  return (
    
      <View style={styles.container}>
      <Text>Turn on screen</Text>
      
      </View>
    
    
  );
};

const styles = StyleSheet.create({ 
  container:{
    flex:1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  videoContainer:{
    flex:1,
  }
});
