import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { app } from "./firebase-config.js";


console.log("🔥 AUTH.JS SE CARGÓ");


const auth = getAuth(app);

const db = getFirestore(app);


/* =========================
   REGISTRO
========================= */

const registroForm =
    document.getElementById("registroForm");


if (registroForm) {

    console.log("✅ Formulario de registro encontrado");

    registroForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const nombre =
                document.getElementById("nombre").value;

            const email =
                document.getElementById("email").value;

            const password =
                document.getElementById("password").value;

            const mensaje =
                document.getElementById(
                    "mensajeRegistro"
                );


            console.log("📝 Intentando registrar:", email);


            try {

                /* Crear usuario en Authentication */

                const resultado =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const usuario =
                    resultado.user;


                console.log(
                    "👤 Usuario creado:",
                    usuario.uid
                );


                /* Guardar nombre */

                await updateProfile(usuario, {

                    displayName: nombre

                });


                /* Crear documento en Firestore */

                await setDoc(
                    doc(
                        db,
                        "users",
                        usuario.uid
                    ),
                    {

                        nombre: nombre,

                        email: email,

                        fechaRegistro: new Date()

                    }
                );


                console.log(
                    "☁️ Usuario guardado en Firestore"
                );


                mensaje.textContent =
                    "✅ Cuenta creada correctamente.";


                setTimeout(function() {

                    window.location.href =
                        "index.html";

                }, 1500);


            } catch (error) {

                console.error(
                    "❌ Error de registro:",
                    error
                );


                mensaje.textContent =
                    obtenerMensajeError(
                        error.code
                    );

            }

        }
    );

}


/* =========================
   LOGIN
========================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "loginEmail"
                ).value;

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;

            const mensaje =
                document.getElementById(
                    "mensajeLogin"
                );


            try {

                const resultado =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "🔐 Sesión iniciada:",
                    resultado.user.uid
                );


                mensaje.textContent =
                    "✅ Inicio de sesión exitoso.";


                setTimeout(function() {

                    window.location.href =
                        "index.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "❌ Error de login:",
                    error
                );


                mensaje.textContent =
                    obtenerMensajeError(
                        error.code
                    );

            }

        }
    );

}


/* =========================
   MENSAJES DE ERROR
========================= */

function obtenerMensajeError(codigo) {

    switch (codigo) {

        case "auth/email-already-in-use":

            return "❌ Ese correo ya está registrado.";


        case "auth/invalid-email":

            return "❌ El correo electrónico no es válido.";


        case "auth/weak-password":

            return "❌ La contraseña debe tener al menos 6 caracteres.";


        case "auth/invalid-credential":

            return "❌ Correo o contraseña incorrectos.";


        case "auth/network-request-failed":

            return "❌ Error de conexión con Firebase.";


        default:

            return "❌ Ocurrió un error. Revisa la consola.";

    }

}