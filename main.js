


import firebase from 'firebase/app';
import 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// de config van de firestore die ik opgezet heb. Soort van database.
const firebaseConfig = {
    apiKey: "AIzaSyCJKgJ9ZiJ5u4d8FmYyOltI3w15YVkc1VY",
    authDomain: "fir-rtc-46f38.firebaseapp.com",
    projectId: "fir-rtc-46f38",
    storageBucket: "fir-rtc-46f38.appspot.com",
    messagingSenderId: "394227434571",
    appId: "1:394227434571:web:752f62eaf3219955de79ce",
    measurementId: "G-3KKB8MV3R4"
};

// firebase wordt gebruikt als database waarmee clients elkaar voor de eerste keer kunnen bereiken
// daarna werkt het p2p over udp
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// Html Elements
const inviteButton = document.getElementById('inviteButton');
const inviteMessage = document.getElementById('inviteMessage');
const plannedInterviewsList = document.getElementById('plannedInterviews');

const webcamVideo = document.getElementById('webcamVideo');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
//const testButton = document.getElementById('testButton')



// listeners
var subscribe;
var subscribeDelete;
var iceListener;

var roomId;

// 1. Setup media sources

const fetchMeetings = async () => {

    const callDoc = firestore.collection('plannedInterviews').doc("Wout")
    const data = await callDoc.get();
    const key_value_pairs = data.data();

    plannedInterviewsList.innerHTML = ''
    Object.entries(key_value_pairs).forEach(([key, value]) => {
        console.log(`${key}: ${value}`)


        var button = document.createElement('button');
        button.innerHTML = value;
        button.onclick = function () { call(key); }


        plannedInterviewsList.appendChild(button)

    });


};







const setUpWebRTC = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

    remoteStream = new MediaStream();
    console.log('hello')
    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });



    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };


    // mute our own playback voice
    webcamVideo.autoplay = true;
    webcamVideo.muted = true;


    webcamVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;

    //callButton.disabled = false;
    //answerButton.disabled = false;
    //webcamButton.disabled = true;
}


inviteButton.onclick = async () => {
    // get the fair
    const callDoc = firestore.collection('plannedInterviews').doc("Wout");
    var uuid = uuidv4();
    var callInfo = {}
    callInfo[uuid] = inviteMessage.value
    //callDoc.update(callInfo)
    callDoc.set(callInfo, { merge: true })
    //callDoc.set({ "bd": inviteMessage.value })
}




// collect ice candidates
const collectIceCandidates = async (
    cRef,
    localName,
    remoteName
) => {

    const candidateCollection = cRef.collection(localName);


    if (pc) {
        // after setLocalDescription the ice candidates of the caller gets searched
        // when found the onicecandidate event is triggered and we add the ice candidate to the firestore
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                candidateCollection.add(event.candidate.toJSON()).catch(e => {
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
                pc?.addIceCandidate(candidate).catch(e => {
                    console.log("failure with getting remote ice candidate from firebase (waiting)")
                    console.log(e)
                });

            }
        })
    })
};

const hangup = async () => {
    if (pc) {
        console.log("hang up waiting")

        //removeListeners();
        subscribe()
        subscribeDelete()
        iceListener()

        webcamVideo.pause();
        webcamVideo.removeAttribute('src'); // empty source
        webcamVideo.load();

        remoteVideo.pause();
        remoteVideo.removeAttribute('src'); // empty source
        remoteVideo.load();


        await streamCleanUp().catch(e => {
            console.log("failure with cleaning stream")
            console.log(e)
        });
        await fireStoreCleanUp().catch(e => {
            console.log("failure with cleining firebase")
            console.log(e)
        });

        // removed planned interviews

    }
    //navigation.navigate('HomeScreen');

};


// Helper function
const streamCleanUp = async () => {
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        //localStream.release();
        localStream = null;
        remoteStream = null;
    }

};


const fireStoreCleanUp = async () => {

    //const cRef = firestore().collection('meet').doc('chatId');
    //const cRef = firestore.collection('meet').doc("wouttest");
    console.log(roomId);


    //removeMeeting()

    const callDoc = firestore.collection('plannedInterviews').doc("Wout")

    callDoc.update({
        ['' + roomId]: firebase.firestore.FieldValue.delete()
    });


    const cRef = firestore.collection('meet').doc(roomId);
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




const callDoc = firestore.collection('plannedInterviews').doc("Wout");
// add planned interviews to list
callDoc.onSnapshot((snapshot) => {
    plannedInterviewsList.innerHTML = ''
    if (snapshot.data()) {
        Object.entries(snapshot.data()).forEach(([key, value]) => {
            //console.log(`${key}: ${value}`)
            //var node = document.createElement('li');
            //node.appendChild(document.createTextNode(value));

            var button = document.createElement('button');
            button.innerHTML = value;
            button.onclick = function () { call(key); }

            //button.setAttribute('onclick','call(' +key + ')')

            plannedInterviewsList.appendChild(button)
        });
    }

    //var node = document.createElement('li');
    // node.appendChild(document.createTextNode('Scooter'));
    //plannedInterviewsList.appendChild(node)

});



//fetchMeetings()


const call = async (chatId) => {
    // Reference Firestore collections for signaling

    await setUpWebRTC();

    roomId = chatId;
    const callDoc = firestore.collection('meet').doc(chatId);


    // Listen for remote answer
    subscribe = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });

    subscribeDelete = callDoc.collection('callee').onSnapshot(snapshot => {
        snapshot.docChanges().forEach((change) => {
            if (change.type == 'removed') {
                console.log("remove info detected in waiting");
                //hangup()
                hangup()
            }
        });
    });

    collectIceCandidates(callDoc, "caller", "callee")

    // Get candidates for caller, save to db
    //pc.onicecandidate = (event) => {
    //    event.candidate && offerCandidates.add(event.candidate.toJSON());
    //};


    // Create offer
    if (pc) {
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await callDoc.set({ offer });
    }

    // When answered, add candidate to peer connection
    //answerCandidates.onSnapshot((snapshot) => {
    //    snapshot.docChanges().forEach((change) => {
    //        if (change.type === 'added') {
    //            const candidate = new RTCIceCandidate(change.doc.data());
    // /           pc.addIceCandidate(candidate);
    //        }
    //    });
    //});

    //hangupButton.disabled = false;
};

hangupButton.onclick = async () => {
    hangup();
}

/** 

var plannedInterviewsList = document.getElementById("plannedInterviews");
inviteButton.onclick = async () => {
    var node = document.createElement('li');
    node.appendChild(document.createTextNode('Scooter'));
    plannedInterviewsList.appendChild(node)
}

*/


