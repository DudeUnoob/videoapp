// Import the functions you need from the SDKs you need
const { initializeApp } =require("firebase/app");
const { getAnalytics } =require("firebase/analytics");
const { getStorage } = require("firebase/storage")
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHDROkgPqoy6xkc9W37KSE-6NxPJUlVmQ",
  authDomain: "video-app-3d061.firebaseapp.com",
  projectId: "video-app-3d061",
  storageBucket: "video-app-3d061.appspot.com",
  messagingSenderId: "1038997883193",
  appId: "1:1038997883193:web:50464fd2877822885500e8",
  measurementId: "G-3BGFGBRTKZ"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(firebaseApp)

module.exports = firebaseApp, firebaseStorage

