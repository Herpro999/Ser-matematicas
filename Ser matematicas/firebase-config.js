import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQTzz_tYva33Ut6dm2qri_ofdfbljBYtU",
  authDomain: "healthtrack-15ced.firebaseapp.com",
  projectId: "healthtrack-15ced",
  storageBucket: "healthtrack-15ced.firebasestorage.app",
  messagingSenderId: "56375548115",
  appId: "1:56375548115:web:5374ddbf561992b9c31c26",
  measurementId: "G-KNF0HHX47J"
};

const app = initializeApp(firebaseConfig);

console.log("🔥 Firebase conectado correctamente");

export { app };