
import { StyleSheet, Text, View, Image, ScrollView, ImageBackground } from 'react-native';
import * as React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InvitationCard from './InvitationCard';




export default function GreenBackgroundBlob() {
    const insets = useSafeAreaInsets();
   


        return (
            <ImageBackground source={require('../images/gradient.png')} style={styles.imageBackground}
                imageStyle={styles.blobSyle} >
                <Text style={{fontWeight: 'bold' , fontSize: 48, textAlign: 'center', paddingTop: insets.top, color: '#040035'}}  > Opkomende interviews</Text>


            </ImageBackground>


        )



}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageBackground: {
        width: '100%', height: 200
    },
    blobSyle: {
        borderBottomLeftRadius: 100, borderBottomRightRadius: 100
    }

});
