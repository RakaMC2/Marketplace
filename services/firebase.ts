// Access the global firebase instance loaded via script tags in index.html
// This avoids ESM 'firebase.auth is not a function' errors with the compat library
declare var firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyBcYhpGSSEImXWov92ievzBgHrvODa0b1M",
  authDomain: "visualmcraft.firebaseapp.com",
  databaseURL: "https://visualmcraft-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "visualmcraft",
  storageBucket: "visualmcraft.firebasestorage.app",
  messagingSenderId: "699644931018",
  appId: "1:699644931018:web:1560a9e10885ee8ee97d33"
};

// Use checking to prevent double initialization in some environments
const app = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig) 
  : firebase.app();

export const auth = app.auth();
export const db = app.database();