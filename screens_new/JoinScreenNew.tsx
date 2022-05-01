import React, { useState, useRef, useEffect } from 'react';

import Video from '../components/Video'
import { firebase } from '@react-native-firebase/firestore';
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

  const pc = useRef<RTCPeerConnection>();

  var iceListener;
  var subscribeDelete;

  // Gets called when componen mounts
  useEffect(() => {
    console.log("using effect")
    const cRef = firestore().collection('meet').doc(route.params.roomCode);


    const join = async () => {

      // wait untill caller has put the call offer in the firebase
      const offer = (await cRef.get()).data()?.offer;

      if (offer) {

        // On delte of collection call hangup
        // The other side has clicked on hangup
        subscribeDelete = cRef.collection('callee').onSnapshot(snapshot => {
          snapshot.docChanges().forEach((change) => {
            if (change.type == 'removed') {
              console.log("Hung up");
              hangup()
            }
          });
        });

        // Setup Webrtc
        await setUpWebrtc()

        // Exchange the ICE candidates
        collectIceCandidates(cRef, "callee", "caller")

        if (pc.current) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(offer)).catch(e => {
            console.log("failure with setting remote description join screen")
            console.log(e)
          });

          // Create the answer for the call
          // Update the document with answer
          const answer = await pc.current.createAnswer().catch(e => {
            console.log("cannot create answer")
            console.log(e)
          });;

          pc.current.setLocalDescription(answer).catch(e => {
            console.log("failure with setting local Descprtion")
            console.log(e)
          });

          const cWithAnswer = {
            answer: {
              type: answer.type,
              sdp: answer.sdp,
            },
          };

          cRef.update(cWithAnswer).catch(e => {
            console.log("failure updating answer")
            console.log(e)
          });
        }
      }
      else{
        console.log("call not ready yet")
        if (navigation.canGoBack()) {
          navigation.goBack()
        }

      }

    };

    join()

    return () => {
      if (iceListener) {
        iceListener();
      }
      if (subscribeDelete) {
        subscribeDelete();
      }
    }


  }, [])

  const setUpWebrtc = async () => {
    console.log("Setting up webrtc join screen")
    pc.current = new RTCPeerConnection(configuration);

    // Get the audio and video stream for the call
    const stream = await Utils.getStream()

    if (stream) {
      console.log("adding local stream (joining)")
      setLocalStream(stream);
      pc.current.addStream(stream);
    }
    else {
      console.log("stream could not be caught")
    }

    // Get the remote sstream once it is available
    pc.current.onaddstream = (event) => {
      console.log("found remote stream (joining)")
      setRemoteStream(event.stream)
    }
  };

  const hangup = async () => {
    if (pc.current) {

      console.log("hanging up joining")


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
          navigation.goBack()
        }
      }

      // delete the refference to the interview
      const callDoc = firestore().collection('plannedInterviews').doc("Wout")
      const chatId = route.params.roomCode
      var removePlannedInterviews = callDoc.update({
        chatId: firebase.firestore.FieldValue.delete()
      });



    }


    //navigation.navigate('HomeScreen');

  };


  const callerHungup = async () => {
    if (pc.current) {
      console.log("other hun up (joining)")

      //removeListeners();
      await streamCleanUp().catch(e => {
        console.log("failure with cleaning stream")
        console.log(e)
      });

      if (pc.current) {
        pc.current.close();
        pc.current = null;

        if (navigation.canGoBack()) {
          navigation.goBack()
        }
      }
    }

    //navigation.navigate('HomeScreen');


  };


  // Helper function
  const streamCleanUp = async () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream.release();
      if (remoteStream) {
        remoteStream.getTracks().forEach(t => t.stop());
        remoteStream.release();
      }
      setLocalStream(null);
      setRemoteStream(null);
    }


  };


  const fireStoreCleanUp = async () => {
    //const cRef = firestore().collection('meet').doc('chatId');
    const cRef = firestore().collection('meet').doc(route.params.roomCode);


    if (cRef) {
      const calleeCandidate = await cRef.collection('callee').get();
      calleeCandidate.forEach(async (candidate) => {
        console.log("ice from join deleted (join)")
        await candidate.ref.delete();
      })
      const callerCandidate = await cRef.collection('caller').get();
      callerCandidate.forEach(async (candidate) => {
        console.log("ice from waiting deleted (join)")
        await candidate.ref.delete();
      })

      cRef.delete();
    }


  };



  // collect ice candidates
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
            console.log("failure with putting local ice candidate on firebase (join screen)")
            console.log(e)
          });
        }
      };
    }

    // If callee adds his ice candidates to the firestore they get added to the peer connection
    // of the caller so the caller knows how to reach the callee
    iceListener = cRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change) => {
        if (change.type == 'added') {

          const candidate = new RTCIceCandidate(change.doc.data())
          pc.current?.addIceCandidate(candidate).catch(e => {
            console.log("failure with getting remote ice candidate from firebase (join screen)")
            console.log(e)
          });

        }
      })
    })

  };



  if (localStream) {
    console.log("reloading stream")
    if (remoteStream) {
      console.log("remote")
    }


    return (
      <View style={styles.videoContainer}>
        <Video hangup={hangup} localStream={localStream} remoteStream={remoteStream} />
      </View>
    )

  }


  // display uw local stream
  return (
    <View style={styles.container}>
      <Text>Turn on screen</Text>
    </View>


  );


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






