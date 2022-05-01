
import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InvitationCard from './InvitationCard';


import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';


const configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };

interface Props{
    navigation: any;
}

export default function InvitationsScrollView(props: Props) {
    const insets = useSafeAreaInsets();
    
    const [cards, updateArray] = useState([]);


    useEffect(() => {
        console.log("using effect")
       
        // all the calls for this person
        const callDoc = firestore().collection('plannedInterviews').doc("Wout");
        const subscribe = callDoc.onSnapshot((snapshot) => {
            updateArray([]);
            if (snapshot.data()) {
                Object.entries(snapshot.data()).forEach(([roomKey, message]) => {
                    updateArray(existingItems => {
                        /** 
                        return [<Button key={roomKey} title={message} onPress={() => {
                            navigation.navigate("JoinScreenNew", {
                                roomCode: roomKey
                            });
                        }} />, ...existingItems]
                        */

                        return [ <InvitationCard key={roomKey} interviewerMessage ={message} onPress={() => {
                            console.log("working")
                            props.navigation.navigate("JoinScreenNew", {
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



    
    if(cards.length){
    
   
        return (
            <ScrollView style={{ }}>
                {cards}
            </ScrollView>


        )
    }
    else{
        return (
            <View style = {{justifyContent: 'flex-end', paddingTop: 150}}>
            <Text style={{  fontSize: 18, textAlign: 'center', paddingTop: insets.top, color: '#040035'}}  > U heeft geen opkomende interviews</Text>
            </View>
        )
    }

    

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

});
