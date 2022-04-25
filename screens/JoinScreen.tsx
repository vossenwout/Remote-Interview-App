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

  var iceListener;
  var removeListener;


  const hangup = async () => {
    if (pc.current) {
      console.log("hanging up joining")
      // remove listeners
      removeListeners()
      //connecting.current = false;
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
    }


    //navigation.navigate('HomeScreen');



  };


  const callerHungup = async () => {
    if (pc.current) {
      console.log("other hun up (joining)")

      removeListeners();
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
    if (removeListener || iceListener) {
      console.log("remove listeners joining")
      if (removeListener) {
        removeListener();
        removeListener = null;
      }
      if (iceListener) {
        iceListener();
        iceListener = null;
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
    const cRef = firestore().collection('meet').doc(meetingLinkInput);


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
          console.log("add join screen ice candidate")
        }
      };
    }

    // If callee adds his ice candidates to the firestore they get added to the peer connection
    // of the caller so the caller knows how to reach the callee
    iceListener = cRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change) => {
        if (change.type == 'added') {
          console.log("recieved ice listener  in join screen")
          console.log(change.doc.data().candidate)
          const candidate = new RTCIceCandidate(change.doc.data())
          pc.current?.addIceCandidate(candidate).catch(e => {
            console.log("failure with getting remote ice candidate from firebase (join screen)")
            console.log(e)
          });

        }
      })
    })

  };


  const clearLeftOverEvents = (cRef) => {
    const clearListener = cRef.collection('callee').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async (change) => {
        console.log("change detected in startup")
      });
    });
    // unsubscribe
    clearListener();
  }



  const join = async () => {


    //connecting.current = true;
    //setGettingCall(false);

    //const cRef = firestore().collection('meet').doc('chatId');

    const cRef = firestore().collection('meet').doc(meetingLinkInput);

    const offer = (await cRef.get()).data()?.offer;



    if (offer) {

      // Setup Webrtc
      //await setUpWebrtc()

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
        console.log("new stream joining")
        setRemoteStream(event.stream)
        // van zodra er een remote stream beschikbaar is navigaten we naar het callscreen
        setGettingCall(true);
      }

      // Exchange the ICE candidates



      // check the parameters its reversed since the joing part is callee
      collectIceCandidates(cRef, "callee", "caller")



      if (pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer)).catch(e => {
          console.log("failure with setting remote description join screen")
          console.log(e)
        });


        clearLeftOverEvents(cRef)
        // if info is removed from the database the callee has hung up and we end the stream
        // (normaal van calleer checken)
        removeListener = cRef.collection('callee').onSnapshot(snapshot => {

          snapshot.docChanges().forEach(async (change) => {
            if (change.type == 'removed') {
              console.log("remove info detected in joining")
              console.log(change.type)
              console.log(change.doc)
              //await hangup().catch(e => {
              // console.log("failure with haning up waiting room")
              //  console.log(e)
              // })
              //removeListeners();
              callerHungup();
            }
          });
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



    /**
     * For disconnecting the call close the connection, release the stream
     * Delte the document for the call
     */

  };

  if (gettingCall) {
    return (
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
        style={styles.input}
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
  input: {
    borderWidth: 1,
    height: 40,
    width: 200,
    margin: 12,
    padding: 10
  }
});






