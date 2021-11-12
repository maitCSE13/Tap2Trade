import * as firebase from "firebase";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPfs1I2r3UDveshS1gI8NiCVCMgjTW3rY",
  authDomain: "tap-2-trade-406e8.firebaseapp.com",
  projectId: "tap-2-trade-406e8",
  storageBucket: "tap-2-trade-406e8.appspot.com",
  messagingSenderId: "788417600435",
  appId: "1:788417600435:web:0b7a83092cfba232c349c6",
  measurementId: "G-56KV6EQD5D"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// export
export const auth = firebase.auth();
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
