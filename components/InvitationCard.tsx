import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as React from "react";
import { Card, Button } from "@rneui/themed";
import { Icon } from '@rneui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface Props{
    onPress: any;
    date: string;
    interviewerMessage: string;
}


export default function InvitationCard(props: Props) {
    
        return (
         
                <Card
                    containerStyle={{
                        borderRadius: 20,
                        borderWidth: 2,
                        shadowColor: "black"
                    }}
                >
                    <View
                        style={{
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: 'space-between'
                        }}
                    >

                        <View style={{
                            alignItems: "center",
                            flexDirection: "row",
                            padding: 5
                        }} >


                            <Image
                                style={{ width: 50, height: 50, borderRadius: 30, paddingHorizontal: 10 }}
                                resizeMode="contain"
                                source={require('../images/interviewer.jpg')}
                            />

                            <View>
                                <Text style={{ fontWeight: 'bold' ,  color: '#040035', fontSize: 16, paddingHorizontal: 10 }}  >Anja Daems</Text>
                                <Text style={{ fontSize: 10, opacity: 0.5, paddingHorizontal: 10 }}  >Radio 2</Text>
                            </View>


                        </View>

                        <Image
                            style={{ width: 50, height: 50, borderRadius: 30, }}
                            resizeMode="contain"
                            source={require('../images/logo.jpg')}
                        />

                    </View>


                    <Card.Divider style={{ opacity: 0.6 }} />


                    <View
                        style={{
                            position: "relative",
                        }}
                    >

                        <View style={{
                            alignItems: "flex-start",
                            flexDirection: "row",

                        }} >

                            <Image
                                style={{ width: 16, height: 18.5, opacity: 0.5, paddingHorizontal: 5 }}
                                resizeMode="contain"
                                source={require('../images/clock.png')}
                            />

                            <Text style={{  fontSize: 12, paddingHorizontal: 2, paddingVertical: 1, color: '#040035' }}  > Vrijdag 03/06, 08:00 - 09:00  </Text>

                        </View>


                        <Text style={{  fontSize: 12, paddingHorizontal: 0, paddingVertical: 8, color: '#030025' }}  > {props.interviewerMessage}  </Text>
                        <Button
                            title="Begin gesprek"
                            titleStyle={{ color: 'black',  fontSize: 15 }}
                            icon={{
                                name: 'phone',
                                size: 20,
                                color: 'black',
                            }}
                            iconContainerStyle={{ marginRight: 10 }}
                            buttonStyle={{
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: 'grey',
                                borderRadius: 30,

                            }}
                            onPress={props.onPress}
                        />

                    </View>



                </Card>
     
        );
    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

});
