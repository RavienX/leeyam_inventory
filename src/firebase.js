// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCdpagb7wzM3RJGpm5_XTJ--_fnDpdE9sQ",
    authDomain: "leeyam-inventory.firebaseapp.com",
    projectId: "leeyam-inventory",
    storageBucket: "leeyam-inventory.firebasestorage.app",
    messagingSenderId: "614598175857",
    appId: "1:614598175857:web:e7d30e4fc7bfd65a72ffd0",
    measurementId: "G-PX68F7C90M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);