import React, { useState, useRef, useEffect } from 'react';

import {
    SnapshotViewIOSBase,
    StyleSheet,
    View,
    Text,
    Button,
    TextInput
} from 'react-native';




export default function SelectJoinScreen({ navigation }) {

   
    const [roomCode, onChangeMeetingLinkInput] = useState<string>();
  
    
    // display uw local stream
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={roomCode}
                onChangeText={onChangeMeetingLinkInput}

            />
            <Button
                title="Join room"
                onPress={() => {
                    navigation.navigate("JoinScreen", {
                        roomCode: roomCode
                    });
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