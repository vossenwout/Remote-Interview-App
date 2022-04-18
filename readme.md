----------------
algemeen:

als icoontjes niet werken of je error krijgt font niet installed
ga correct installeren en hier troubleshooten
https://github.com/oblador/react-native-vector-icons#red-screen-with-unrecognized-font-family-error-on-ios

----------------
IOS hulp:

firebase setup:
https://rnfirebase.io/#3-ios-setup

pods installen in ios file (m1 chip):
sudo arch -x86_64 gem install ffi
arch -x86_64 pod install         

meerdere simulators runnen:
npx react-native run-ios --simulator="iPhone 13"
npx react-native run-ios --simulator="iPhone 12"

---------------
Android hulp:

Als je error krijgt bij npx react-native run-android dat er geen emulators te vinden zijn
(zodat react native de android emulators kan vinden voer dit in terminal uit mac only bash commandos zoek op)
source $HOME/.zprofile    

--------------