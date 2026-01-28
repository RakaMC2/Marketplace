// Access the global firebase instance loaded via script tags in index.html
// This avoids ESM 'firebase.auth is not a function' errors with the compat library
declare var firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyAr37SrpRBWv4LPiExlJG0aJT0r5EJ9wCg",
  authDomain: "voltra-essentials.firebaseapp.com",
  databaseURL: "https://voltra-essentials-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "voltra-essentials",
  storageBucket: "voltra-essentials.firebasestorage.app",
  messagingSenderId: "956503858766",
  appId: "1:956503858766:web:46bf6f30ff0c709fe6ed1f",
  measurementId: "G-K6FEG8DPV2"
};
// Use checking to prevent double initialization in some environments
const app = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig) 
  : firebase.app();

export const auth = app.auth();
export const db = app.database();
