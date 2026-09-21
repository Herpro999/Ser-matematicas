import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { app } from "./firebase-config.js";


const auth = getAuth(app);

const db = getFirestore(app);


const citaForm =
    document.getElementById("citaForm");

const listaCitas =
    document.getElementById("listaCitas");

const mensajeCita =
    document.getElementById("mensajeCita");


let usuarioActual = null;


/* =========================
   COMPROBAR SESIÓN
========================= */

onAuthStateChanged(auth, (usuario) => {

    if (!usuario) {

        window.location.href = "login.html";

        return;

    }

    usuarioActual = usuario;

    console.log(
        "👤 Usuario conectado:",
        usuarioActual.uid
    );

    cargarCitas();

});


/* =========================
   GUARDAR CITA
========================= */

citaForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!usuarioActual) {

            mensajeCita.textContent =
                "❌ Debes iniciar sesión.";

            return;

        }


        const tipo =
            document.getElementById(
                "tipoCita"
            ).value;

        const fecha =
            document.getElementById(
                "fechaCita"
            ).value;

        const hora =
            document.getElementById(
                "horaCita"
            ).value;

        const nota =
            document.getElementById(
                "notaCita"
            ).value;


        try {

            await addDoc(

                collection(
                    db,
                    "users",
                    usuarioActual.uid,
                    "citas"
                ),

                {
                    tipo: tipo,
                    fecha: fecha,
                    hora: hora,
                    nota: nota,
                    creada: new Date()
                }

            );


            console.log(
                "📅 Cita guardada correctamente"
            );


            mensajeCita.textContent =
                "✅ Cita guardada correctamente.";

            citaForm.reset();


        } catch (error) {

            console.error(
                "❌ Error guardando cita:",
                error
            );

            mensajeCita.textContent =
                "❌ No se pudo guardar la cita.";

        }

    }
);


/* =========================
   CARGAR CITAS
========================= */

function cargarCitas() {

    const citasRef = collection(
        db,
        "users",
        usuarioActual.uid,
        "citas"
    );


    onSnapshot(
        citasRef,
        (snapshot) => {

            listaCitas.innerHTML = "";


            if (snapshot.empty) {

                listaCitas.innerHTML =
                    "<p>No tienes citas guardadas.</p>";

                return;

            }


            snapshot.forEach(
                (documento) => {

                    const cita =
                        documento.data();


                    const tarjeta =
                        document.createElement(
                            "div"
                        );


                    tarjeta.className =
                        "tarjeta";


                    tarjeta.innerHTML = `

                        <h3>
                            📅 ${cita.tipo}
                        </h3>

                        <p>
                            📆 ${cita.fecha}
                        </p>

                        <p>
                            🕐 ${cita.hora}
                        </p>

                        <p>
                            📝 ${
                                cita.nota ||
                                "Sin notas"
                            }
                        </p>

                        <button
                            class="eliminar-cita"
                            data-id="${documento.id}"
                        >
                            🗑️ Eliminar
                        </button>

                    `;


                    listaCitas.appendChild(
                        tarjeta
                    );

                }
            );


            document
                .querySelectorAll(
                    ".eliminar-cita"
                )
                .forEach(
                    (boton) => {

                        boton.addEventListener(
                            "click",
                            eliminarCita
                        );

                    }
                );

        },

        (error) => {

            console.error(
                "❌ Error cargando citas:",
                error
            );

            listaCitas.innerHTML =
                "<p>❌ No se pudieron cargar las citas.</p>";

        }
    );

}


/* =========================
   ELIMINAR CITA
========================= */

async function eliminarCita(event) {

    const id =
        event.target.dataset.id;


    try {

        await deleteDoc(

            doc(
                db,
                "users",
                usuarioActual.uid,
                "citas",
                id
            )

        );


        console.log(
            "🗑️ Cita eliminada"
        );


    } catch (error) {

        console.error(
            "❌ Error eliminando cita:",
            error
        );

    }

}