import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAHaVINrN0ve_D57zI59sdKWvaIctQaw5c",
    authDomain: "agri-app-704d1.firebaseapp.com",
    projectId: "agri-app-704d1",
    storageBucket: "agri-app-704d1.firebasestorage.app",
    messagingSenderId: "253646556338",
    appId: "1:253646556338:web:0ae8543ef84fb23cfc8dab",
    measurementId: "G-ZHSE51YNKN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
