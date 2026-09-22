/* =========================================================
   HEALTHTRACK
   SCRIPT PRINCIPAL
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

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
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { app } from "./firebase-config.js";


const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Firebase conectado correctamente");


/* =========================================================
   DATOS DE LA APLICACIÓN
   ========================================================= */

let salud = {
    agua: 0,
    sueno: 0,
    actividad: false,
    alimentacion: false,
    dientes: false
};

let citas = [];
let recordatorios = [];

let usuarioActual = null;

let detenerListenerCitas = null;
let detenerListenerRecordatorios = null;


/* =========================================================
   DATOS LOCALES
   ========================================================= */

const datosGuardados =
    localStorage.getItem("healthTrack");

if (datosGuardados) {

    try {

        const datos =
            JSON.parse(datosGuardados);

        salud =
            datos.salud || salud;

    } catch (error) {

        console.error(
            "❌ Error leyendo datos locales:",
            error
        );

    }

}


function guardarDatos() {

    localStorage.setItem(
        "healthTrack",
        JSON.stringify({
            salud: salud
        })
    );

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function actualizarDashboard() {

    if (!usuarioActual) {

        const saludo =
            document.getElementById(
                "saludoDashboard"
            );

        if (saludo) {

            saludo.textContent =
                "👋 Inicia sesión para ver tu resumen.";

        }

        return;
    }


    /* SALUDO */

    const saludo =
        document.getElementById(
            "saludoDashboard"
        );

    if (saludo) {

        const nombre =
            usuarioActual.displayName ||
            usuarioActual.email ||
            "Usuario";

        saludo.textContent =
            `👋 Hola, ${nombre}`;

    }


    /* TOTAL DE CITAS */

    const elementoCitas =
        document.getElementById(
            "dashboardCitas"
        );

    if (elementoCitas) {

        elementoCitas.textContent =
            citas.length;

    }


    /* RECORDATORIOS PENDIENTES */

    const pendientes =
        recordatorios.filter(
            function(recordatorio) {

                return (
                    recordatorio.completado !== true
                );

            }
        );


    const completados =
        recordatorios.filter(
            function(recordatorio) {

                return (
                    recordatorio.completado === true
                );

            }
        );


    const elementoRecordatorios =
        document.getElementById(
            "dashboardRecordatorios"
        );

    if (elementoRecordatorios) {

        elementoRecordatorios.textContent =
            pendientes.length;

    }


    /* RECORDATORIOS COMPLETADOS */

    const elementoCompletados =
        document.getElementById(
            "dashboardCompletados"
        );

    if (elementoCompletados) {

        elementoCompletados.textContent =
            completados.length;

    }


    /* PRÓXIMA CITA */

    const elementoProximaCita =
        document.getElementById(
            "dashboardProximaCita"
        );

    if (elementoProximaCita) {

        const ahora =
            new Date();


        const citasFuturas =
            citas.filter(
                function(cita) {

                    if (
                        !cita.fecha ||
                        !cita.hora
                    ) {

                        return false;

                    }


                    const fechaCita =
                        new Date(
                            `${cita.fecha}T${cita.hora}`
                        );


                    return (
                        fechaCita >= ahora
                    );

                }
            );


        if (citasFuturas.length === 0) {

            elementoProximaCita.innerHTML = `
                <p>
                    No tienes citas próximas.
                </p>
            `;

        } else {

            const proxima =
                citasFuturas[0];


            elementoProximaCita.innerHTML = `
                <strong>
                    ${escapeHTML(
                        proxima.tipo ||
                        "Cita médica"
                    )}
                </strong>

                <p>
                    📅 ${formatearFecha(proxima.fecha)}
                </p>

                <p>
                    ⏰ ${escapeHTML(proxima.hora)}
                </p>
            `;

        }

    }


    /* LISTA DE RECORDATORIOS DEL DASHBOARD */

    const lista =
        document.getElementById(
            "dashboardListaRecordatorios"
        );

    if (!lista) {

        return;

    }


    if (pendientes.length === 0) {

        lista.innerHTML = `
            <p>
                🎉 No tienes recordatorios pendientes.
            </p>
        `;

        return;

    }


    const proximos =
        pendientes.slice(0, 5);

    lista.innerHTML = "";


    proximos.forEach(
        function(recordatorio) {

            const elemento =
                document.createElement(
                    "div"
                );

            elemento.className =
                "dashboard-recordatorio-item";


            elemento.innerHTML = `
                <div
                    class="dashboard-recordatorio-info"
                >

                    <strong>
                        ${escapeHTML(
                            recordatorio.tipo ||
                            "🔔"
                        )}
                        ${escapeHTML(
                            recordatorio.titulo
                        )}
                    </strong>

                    <span>
                        📅 ${formatearFecha(
                            recordatorio.fecha
                        )}
                        · ⏰ ${escapeHTML(
                            recordatorio.hora
                        )}
                    </span>

                </div>
            `;


            lista.appendChild(
                elemento
            );

        }
    );

}


/* =========================================================
   RECORDATORIOS
   ========================================================= */

async function crearRecordatorio() {

    if (!usuarioActual) {

        alert(
            "🔐 Debes iniciar sesión para crear un recordatorio."
        );

        return;

    }


    const campoTitulo =
        document.getElementById(
            "tituloRecordatorio"
        );

    const campoTipo =
        document.getElementById(
            "tipoRecordatorio"
        );

    const campoFecha =
        document.getElementById(
            "fechaRecordatorio"
        );

    const campoHora =
        document.getElementById(
            "horaRecordatorio"
        );


    const titulo =
        campoTitulo.value.trim();

    const tipo =
        campoTipo.value;

    const fecha =
        campoFecha.value;

    const hora =
        campoHora.value;


    if (!titulo) {

        alert(
            "⚠️ Escribe un título para el recordatorio."
        );

        return;

    }


    if (!fecha) {

        alert(
            "⚠️ Selecciona una fecha."
        );

        return;

    }


    if (!hora) {

        alert(
            "⚠️ Selecciona una hora."
        );

        return;

    }


    const recordatoriosRef =
        collection(
            db,
            "users",
            usuarioActual.uid,
            "recordatorios"
        );


    const nuevoRecordatorio = {

        titulo: titulo,

        tipo: tipo,

        fecha: fecha,

        hora: hora,

        completado: false,

        creadoEn: serverTimestamp()

    };


    try {

        const documento =
            await addDoc(
                recordatoriosRef,
                nuevoRecordatorio
            );


        console.log(
            "✅ Recordatorio guardado:",
            documento.id
        );


        campoTitulo.value = "";
        campoFecha.value = "";
        campoHora.value = "";


        alert(
            "🔔 Recordatorio creado correctamente."
        );


    } catch (error) {

        console.error(
            "❌ Error creando recordatorio:",
            error
        );


        alert(
            "❌ No se pudo crear el recordatorio."
        );

    }

}


function cargarRecordatoriosDesdeFirebase() {

    console.log(
        "🔔 Iniciando carga de recordatorios..."
    );


    if (detenerListenerRecordatorios) {

        detenerListenerRecordatorios();

        detenerListenerRecordatorios = null;

    }


    if (!usuarioActual) {

        recordatorios = [];

        mostrarRecordatorios();

        actualizarDashboard();

        return;

    }


    const recordatoriosRef =
        collection(
            db,
            "users",
            usuarioActual.uid,
            "recordatorios"
        );


    detenerListenerRecordatorios =
        onSnapshot(

            recordatoriosRef,

            function(snapshot) {

                recordatorios = [];


                snapshot.forEach(
                    function(documento) {

                        const datos =
                            documento.data();


                        recordatorios.push({

                            id:
                                documento.id,

                            titulo:
                                datos.titulo ||
                                "Sin título",

                            tipo:
                                datos.tipo ||
                                "📌 Otro",

                            fecha:
                                datos.fecha ||
                                "",

                            hora:
                                datos.hora ||
                                "",

                            completado:
                                datos.completado === true

                        });

                    }
                );


                console.log(
                    "🔔 Recordatorios cargados:",
                    recordatorios.length
                );


                mostrarRecordatorios();

            },

            function(error) {

                console.error(
                    "❌ ERROR LEYENDO RECORDATORIOS:",
                    error
                );

            }

        );

}


function mostrarRecordatorios() {

    const contenedor =
        document.getElementById(
            "listaRecordatorios"
        );


    if (!contenedor) {

        actualizarDashboard();

        return;

    }


    contenedor.innerHTML = "";


    if (!usuarioActual) {

        contenedor.innerHTML = `
            <p>
                🔐 Inicia sesión para ver tus recordatorios.
            </p>
        `;

        actualizarDashboard();

        return;

    }


    if (recordatorios.length === 0) {

        contenedor.innerHTML = `
            <p>
                🔔 No tienes recordatorios todavía.
            </p>
        `;

        actualizarDashboard();

        return;

    }


    recordatorios.forEach(
        function(recordatorio) {

            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.classList.add(
                "recordatorio"
            );


            if (recordatorio.completado) {

                tarjeta.classList.add(
                    "completado"
                );

            }


            const titulo =
                document.createElement(
                    "h3"
                );

            titulo.textContent =
                `${recordatorio.tipo || "🔔"} ${recordatorio.titulo}`;


            const fecha =
                document.createElement(
                    "p"
                );

            fecha.textContent =
                `📅 ${formatearFecha(recordatorio.fecha)}`;


            const hora =
                document.createElement(
                    "p"
                );

            hora.textContent =
                `⏰ ${recordatorio.hora}`;


            const estado =
                document.createElement(
                    "p"
                );

            estado.textContent =
                recordatorio.completado
                    ? "✅ Completado"
                    : "🔔 Pendiente";


            const botonCompletar =
                document.createElement(
                    "button"
                );

            botonCompletar.textContent =
                recordatorio.completado
                    ? "↩️ Marcar pendiente"
                    : "✅ Completar";


            botonCompletar.onclick =
                function() {

                    cambiarEstadoRecordatorio(
                        recordatorio.id,
                        !recordatorio.completado
                    );

                };


            const botonEliminar =
                document.createElement(
                    "button"
                );

            botonEliminar.textContent =
                "🗑️ Eliminar";


            botonEliminar.onclick =
                function() {

                    eliminarRecordatorio(
                        recordatorio.id
                    );

                };


            tarjeta.appendChild(titulo);
            tarjeta.appendChild(fecha);
            tarjeta.appendChild(hora);
            tarjeta.appendChild(estado);
            tarjeta.appendChild(botonCompletar);
            tarjeta.appendChild(botonEliminar);


            contenedor.appendChild(
                tarjeta
            );

        }
    );


    actualizarDashboard();

}


async function cambiarEstadoRecordatorio(
    id,
    completado
) {

    if (!usuarioActual || !id) {

        return;

    }


    try {

        const referencia =
            doc(
                db,
                "users",
                usuarioActual.uid,
                "recordatorios",
                id
            );


        await updateDoc(
            referencia,
            {
                completado: completado
            }
        );


        console.log(
            "✅ Estado del recordatorio actualizado."
        );


    } catch (error) {

        console.error(
            "❌ Error actualizando recordatorio:",
            error
        );


        alert(
            "❌ No se pudo actualizar el recordatorio."
        );

    }

}


async function eliminarRecordatorio(id) {

    if (!usuarioActual || !id) {

        return;

    }


    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar este recordatorio?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const referencia =
            doc(
                db,
                "users",
                usuarioActual.uid,
                "recordatorios",
                id
            );


        await deleteDoc(
            referencia
        );


        console.log(
            "🗑️ Recordatorio eliminado."
        );


    } catch (error) {

        console.error(
            "❌ Error eliminando recordatorio:",
            error
        );


        alert(
            "❌ No se pudo eliminar el recordatorio."
        );

    }

}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function mostrarSeccion(nombre) {

    const secciones =
        document.querySelectorAll(
            ".seccion"
        );


    secciones.forEach(
        function(seccion) {

            seccion.classList.remove(
                "activa"
            );

        }
    );


    const seccionSeleccionada =
        document.getElementById(nombre);


    if (seccionSeleccionada) {

        seccionSeleccionada.classList.add(
            "activa"
        );

    }


    if (nombre === "citas") {

        mostrarCitas();

        mostrarProximaCita();

    }


    if (nombre === "recordatorios") {

        mostrarRecordatorios();

    }

}


/* =========================================================
   HÁBITOS / SALUD
   ========================================================= */

function agregarAgua() {

    if (salud.agua < 20) {

        salud.agua++;

    }


    const aguaTexto =
        document.getElementById(
            "aguaTexto"
        );


    if (aguaTexto) {

        aguaTexto.textContent =
            salud.agua + " vasos";

    }


    guardarDatos();

    actualizarProgreso();

}


function guardarSueno() {

    const campo =
        document.getElementById(
            "horasSueno"
        );


    if (!campo) {

        return;

    }


    const horas =
        Number(campo.value);


    if (
        Number.isNaN(horas) ||
        horas < 0 ||
        horas > 24
    ) {

        alert(
            "Introduce un número válido de horas."
        );

        return;

    }


    salud.sueno =
        horas;


    const resultado =
        document.getElementById(
            "suenoResultado"
        );


    if (resultado) {

        resultado.textContent =
            "Dormiste " +
            horas +
            " horas.";

    }


    guardarDatos();

    actualizarProgreso();

}


function marcarActividad() {

    salud.actividad =
        !salud.actividad;


    const boton =
        document.getElementById(
            "actividadBtn"
        );


    if (!boton) {

        actualizarProgreso();

        return;

    }


    boton.textContent =
        salud.actividad
            ? "✅ Actividad realizada"
            : "❌ No realizada";


    guardarDatos();

    actualizarProgreso();

}


function marcarAlimentacion() {

    salud.alimentacion =
        !salud.alimentacion;


    const boton =
        document.getElementById(
            "alimentacionBtn"
        );


    if (!boton) {

        actualizarProgreso();

        return;

    }


    boton.textContent =
        salud.alimentacion
            ? "✅ Alimentación registrada"
            : "❌ Registrar alimentación";


    guardarDatos();

    actualizarProgreso();

}


function marcarDientes() {

    salud.dientes =
        !salud.dientes;


    const boton =
        document.getElementById(
            "dientesBtn"
        );


    if (!boton) {

        actualizarProgreso();

        return;

    }


    boton.textContent =
        salud.dientes
            ? "✅ Realizada"
            : "❌ Realizada";


    guardarDatos();

    actualizarProgreso();

}


function actualizarProgreso() {

    let puntos = 0;

    const total = 5;


    if (salud.agua >= 8) {

        puntos++;

    }


    if (salud.sueno >= 7) {

        puntos++;

    }


    if (salud.actividad) {

        puntos++;

    }


    if (salud.alimentacion) {

        puntos++;

    }


    if (salud.dientes) {

        puntos++;

    }


    const porcentaje =
        Math.round(
            (puntos / total) * 100
        );


    const barra =
        document.getElementById(
            "barraProgreso"
        );


    if (barra) {

        barra.style.width =
            porcentaje + "%";

    }


    const texto =
        document.getElementById(
            "textoProgreso"
        );


    if (texto) {

        texto.textContent =
            porcentaje +
            "% completado (" +
            puntos +
            "/" +
            total +
            ")";

    }

}


function marcarHabito(boton) {

    if (!boton) {

        return;

    }


    const li =
        boton.parentElement;


    if (!li) {

        return;

    }


    li.classList.toggle(
        "habito-completado"
    );


    boton.textContent =
        li.classList.contains(
            "habito-completado"
        )
            ? "✅ Completado"
            : "Completar";

}


/* =========================================================
   CITAS MÉDICAS
   ========================================================= */

function usuarioEstaConectado() {

    if (!usuarioActual) {

        alert(
            "Debes iniciar sesión para utilizar las citas médicas."
        );

        return false;

    }


    return true;

}


async function agregarCita() {

    if (!usuarioEstaConectado()) {

        return;

    }


    const campoTipo =
        document.getElementById(
            "tipoCita"
        );

    const campoFecha =
        document.getElementById(
            "fechaCita"
        );

    const campoHora =
        document.getElementById(
            "horaCita"
        );

    const campoNota =
        document.getElementById(
            "notaCita"
        );


    if (
        !campoTipo ||
        !campoFecha ||
        !campoHora ||
        !campoNota
    ) {

        console.error(
            "❌ No se encontraron los campos de citas."
        );

        return;

    }


    const tipo =
        campoTipo.value.trim();

    const fecha =
        campoFecha.value;

    const hora =
        campoHora.value;

    const nota =
        campoNota.value.trim();


    if (
        !tipo ||
        !fecha ||
        !hora
    ) {

        alert(
            "Completa el tipo, fecha y hora de la cita."
        );

        return;

    }


    const fechaCita =
        new Date(
            `${fecha}T${hora}`
        );


    if (
        Number.isNaN(
            fechaCita.getTime()
        )
    ) {

        alert(
            "La fecha o la hora no son válidas."
        );

        return;

    }


    const nuevaCita = {

        tipo: tipo,

        fecha: fecha,

        hora: hora,

        nota: nota,

        creadaEn:
            new Date().toISOString()

    };


    try {

        console.log(
            "📤 Guardando cita en Firebase..."
        );


        const citasRef =
            collection(
                db,
                "users",
                usuarioActual.uid,
                "citas"
            );


        const documento =
            await addDoc(
                citasRef,
                nuevaCita
            );


        console.log(
            "✅ Cita guardada:",
            documento.id
        );


        campoTipo.value = "";
        campoFecha.value = "";
        campoHora.value = "";
        campoNota.value = "";


        alert(
            "✅ Cita guardada correctamente."
        );


    } catch (error) {

        console.error(
            "❌ Error guardando la cita:",
            error
        );


        alert(
            "❌ No se pudo guardar la cita. Revisa la consola."
        );

    }

}


/* =========================================================
   CARGAR CITAS DESDE FIRESTORE
   ========================================================= */

function cargarCitasDesdeFirebase() {

    console.log(
        "📅 Iniciando carga de citas..."
    );


    if (detenerListenerCitas) {

        detenerListenerCitas();

        detenerListenerCitas = null;

    }


    if (!usuarioActual) {

        citas = [];

        mostrarCitas();

        mostrarProximaCita();

        actualizarDashboard();

        return;

    }


    const citasRef =
        collection(
            db,
            "users",
            usuarioActual.uid,
            "citas"
        );


    console.log(
        "📡 Escuchando Firestore:",
        `users/${usuarioActual.uid}/citas`
    );


    detenerListenerCitas =
        onSnapshot(

            citasRef,

            function(snapshot) {

                citas = [];


                snapshot.forEach(
                    function(documento) {

                        const datos =
                            documento.data();


                        citas.push({

                            id:
                                documento.id,

                            tipo:
                                datos.tipo ||
                                "Cita médica",

                            fecha:
                                datos.fecha ||
                                "",

                            hora:
                                datos.hora ||
                                "",

                            nota:
                                datos.nota ||
                                "",

                            creadaEn:
                                datos.creadaEn ||
                                ""

                        });

                    }
                );


                /*
                   Ordenar por fecha y hora.
                */

                citas.sort(
                    function(a, b) {

                        const fechaA =
                            new Date(
                                `${a.fecha}T${a.hora || "00:00"}`
                            );

                        const fechaB =
                            new Date(
                                `${b.fecha}T${b.hora || "00:00"}`
                            );

                        return (
                            fechaA - fechaB
                        );

                    }
                );


                console.log(
                    "📅 Citas cargadas:",
                    citas.length
                );


                console.log(
                    "📦 Datos de citas:",
                    citas
                );


                /*
                   Actualizar la lista.
                */

                mostrarCitas();


                /*
                   Actualizar próxima cita.
                */

                mostrarProximaCita();


                /*
                   ⭐ FIX:
                   Actualizar dashboard inmediatamente.
                */

                actualizarDashboard();

            },

            function(error) {

                console.error(
                    "❌ ERROR LEYENDO CITAS:",
                    error
                );


                actualizarDashboard();

            }

        );

}


function mostrarCitas() {

    const contenedor =
        document.getElementById(
            "listaCitas"
        );


    if (!contenedor) {

        return;

    }


    contenedor.innerHTML = "";


    if (!usuarioActual) {

        contenedor.innerHTML = `
            <p>
                🔐 Inicia sesión para ver tus citas.
            </p>
        `;

        return;

    }


    if (citas.length === 0) {

        contenedor.innerHTML = `
            <p>
                No tienes citas registradas.
            </p>
        `;

        return;

    }


    citas.forEach(
        function(cita) {

            const div =
                document.createElement(
                    "div"
                );


            div.classList.add(
                "cita"
            );


            const contenido =
                document.createElement(
                    "div"
                );


            const titulo =
                document.createElement(
                    "strong"
                );


            titulo.textContent =
                "🩺 " +
                cita.tipo;


            contenido.appendChild(
                titulo
            );


            contenido.appendChild(
                document.createElement(
                    "br"
                )
            );


            contenido.appendChild(
                document.createTextNode(
                    "📅 " +
                    formatearFecha(
                        cita.fecha
                    )
                )
            );


            contenido.appendChild(
                document.createElement(
                    "br"
                )
            );


            contenido.appendChild(
                document.createTextNode(
                    "⏰ " +
                    cita.hora
                )
            );


            if (cita.nota) {

                contenido.appendChild(
                    document.createElement(
                        "br"
                    )
                );


                contenido.appendChild(
                    document.createTextNode(
                        "📝 " +
                        cita.nota
                    )
                );

            }


            const boton =
                document.createElement(
                    "button"
                );


            boton.textContent =
                "Eliminar";


            boton.addEventListener(
                "click",
                function() {

                    eliminarCita(
                        cita.id
                    );

                }
            );


            div.appendChild(
                contenido
            );

            div.appendChild(
                boton
            );


            contenedor.appendChild(
                div
            );

        }
    );

}


async function eliminarCita(id) {

    if (!usuarioEstaConectado()) {

        return;

    }


    if (!id) {

        console.error(
            "❌ ID de cita inválido."
        );

        return;

    }


    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar esta cita?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const referencia =
            doc(
                db,
                "users",
                usuarioActual.uid,
                "citas",
                id
            );


        await deleteDoc(
            referencia
        );


        console.log(
            "🗑️ Cita eliminada correctamente."
        );


    } catch (error) {

        console.error(
            "❌ Error eliminando cita:",
            error
        );


        alert(
            "❌ No se pudo eliminar la cita."
        );

    }

}


/* =========================================================
   PRÓXIMA CITA
   ========================================================= */

function obtenerProximaCita() {

    if (
        !citas ||
        citas.length === 0
    ) {

        return null;

    }


    const ahora =
        new Date();


    for (
        let i = 0;
        i < citas.length;
        i++
    ) {

        const cita =
            citas[i];


        if (
            !cita.fecha ||
            !cita.hora
        ) {

            continue;

        }


        const fecha =
            new Date(
                `${cita.fecha}T${cita.hora}`
            );


        if (
            fecha.getTime() >=
            ahora.getTime()
        ) {

            return cita;

        }

    }


    return null;

}


function mostrarProximaCita() {

    const proxima =
        obtenerProximaCita();


    const contenedor =
        document.getElementById(
            "proximaCita"
        );


    if (!contenedor) {

        return;

    }


    if (!usuarioActual) {

        contenedor.innerHTML = `
            <p>
                🔐 Inicia sesión para ver tu próxima cita.
            </p>
        `;

        return;

    }


    if (!proxima) {

        contenedor.innerHTML = `
            <p>
                📅 No tienes próximas citas.
            </p>
        `;

        return;

    }


    contenedor.innerHTML = `
        <strong>
            🩺 ${escapeHTML(proxima.tipo)}
        </strong>

        <br>

        📅 ${formatearFecha(proxima.fecha)}

        <br>

        ⏰ ${escapeHTML(proxima.hora)}
    `;

}


/* =========================================================
   ELIMINAR HTML NO DESEADO
   ========================================================= */

function escapeHTML(texto) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto || "";


    return div.innerHTML;

}


/* =========================================================
   FORMATEAR FECHA
   ========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {

        return "Fecha no disponible";

    }


    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;

    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


/* =========================================================
   INFORMACIÓN PREVENTIVA
   ========================================================= */

function mostrarInfo(tipo) {

    let mensaje = "";


    if (tipo === "visual") {

        mensaje =
            "Los controles de salud visual pueden ayudar a identificar cambios en la visión. Consulta a un profesional para saber qué controles son adecuados para ti.";

    }

    else if (tipo === "dental") {

        mensaje =
            "Las revisiones odontológicas ayudan a mantener la salud de los dientes y las encías y permiten detectar problemas de forma temprana.";

    }

    else if (tipo === "femenina") {

        mensaje =
            "La prevención de la salud femenina incluye controles médicos apropiados para cada edad y situación. Consulta a un profesional para conocer cuáles corresponden a ti.";

    }

    else if (tipo === "masculina") {

        mensaje =
            "La salud masculina también requiere controles preventivos. Ante cambios, molestias o síntomas persistentes, es importante consultar a un profesional.";

    }

    else if (tipo === "solar") {

        mensaje =
            "La exposición excesiva a la radiación ultravioleta puede afectar la piel. Utilizar protección solar y evitar exposiciones excesivas ayuda a reducir riesgos.";

    }

    else if (tipo === "vacunas") {

        mensaje =
            "Las vacunas ayudan a prevenir diversas enfermedades. Mantén tu esquema de vacunación actualizado según las recomendaciones de salud de tu país.";

    }

    else {

        mensaje =
            "Consulta información de salud en fuentes confiables y habla con un profesional cuando tengas dudas.";

    }


    alert(mensaje);

}


/* =========================================================
   CONSEJOS
   ========================================================= */

const consejos = [

    "Mantener buenos hábitos diariamente puede contribuir a una vida saludable.",

    "Dormir adecuadamente es importante para el bienestar físico y mental.",

    "La actividad física regular puede beneficiar la salud cardiovascular y muscular.",

    "Una alimentación variada ayuda a proporcionar diferentes nutrientes.",

    "Los controles médicos permiten hablar con profesionales sobre tu estado de salud.",

    "La prevención es una parte importante del cuidado de la salud."

];


function mostrarConsejo() {

    const numero =
        Math.floor(
            Math.random() *
            consejos.length
        );


    const elemento =
        document.getElementById(
            "consejoTexto"
        );


    if (elemento) {

        elemento.textContent =
            consejos[numero];

    }

}


/* =========================================================
   ACTUALIZAR INTERFAZ
   ========================================================= */

function actualizarInterfazSalud() {

    const aguaTexto =
        document.getElementById(
            "aguaTexto"
        );


    if (aguaTexto) {

        aguaTexto.textContent =
            salud.agua +
            " vasos";

    }


    const resultadoSueno =
        document.getElementById(
            "suenoResultado"
        );


    if (
        resultadoSueno &&
        salud.sueno !== undefined
    ) {

        resultadoSueno.textContent =
            "Dormiste " +
            salud.sueno +
            " horas.";

    }


    const actividadBtn =
        document.getElementById(
            "actividadBtn"
        );


    if (actividadBtn) {

        actividadBtn.textContent =
            salud.actividad
                ? "✅ Actividad realizada"
                : "❌ No realizada";

    }


    const alimentacionBtn =
        document.getElementById(
            "alimentacionBtn"
        );


    if (alimentacionBtn) {

        alimentacionBtn.textContent =
            salud.alimentacion
                ? "✅ Alimentación registrada"
                : "❌ Registrar alimentación";

    }


    const dientesBtn =
        document.getElementById(
            "dientesBtn"
        );


    if (dientesBtn) {

        dientesBtn.textContent =
            salud.dientes
                ? "✅ Realizada"
                : "❌ Realizada";

    }


    actualizarProgreso();

}


/* =========================================================
   CAMBIO DE USUARIO
   ========================================================= */

function manejarCambioUsuario(usuario) {

    /*
       Detener listener anterior de citas.
    */

    if (detenerListenerCitas) {

        detenerListenerCitas();

        detenerListenerCitas = null;

    }


    /*
       Detener listener anterior de recordatorios.
    */

    if (detenerListenerRecordatorios) {

        detenerListenerRecordatorios();

        detenerListenerRecordatorios = null;

    }


    usuarioActual =
        usuario;


    /*
       Usuario desconectado.
    */

    if (!usuarioActual) {

        console.log(
            "🔐 No hay usuario conectado."
        );


        citas = [];

        recordatorios = [];


        mostrarCitas();

        mostrarProximaCita();

        actualizarDashboard();


        return;

    }


    console.log(
        "👤 Usuario conectado:",
        usuarioActual.uid
    );


    console.log(
        "📧 Correo:",
        usuarioActual.email
    );


    console.log(
        "👤 Nombre:",
        usuarioActual.displayName
    );


    const saludoPrincipal =
        document.getElementById(
            "saludoPrincipal"
        );


    if (saludoPrincipal) {

        const nombre =
            usuarioActual.displayName ||
            usuarioActual.email ||
            "Usuario";


        saludoPrincipal.textContent =
            `Hola, ${nombre} 👋`;

    }


    /*
       ⭐ Cargar citas.
    */

    cargarCitasDesdeFirebase();


    /*
       ⭐ Cargar recordatorios.
    */

    cargarRecordatoriosDesdeFirebase();


    /*
       Actualizar dashboard.
    */

    actualizarDashboard();

}


/* =========================================================
   FIREBASE AUTHENTICATION
   ========================================================= */

onAuthStateChanged(

    auth,

    function(usuario) {

        manejarCambioUsuario(
            usuario
        );

    }

);


/* =========================================================
   EXPONER FUNCIONES AL HTML
   ========================================================= */

window.mostrarSeccion =
    mostrarSeccion;

window.agregarAgua =
    agregarAgua;

window.guardarSueno =
    guardarSueno;

window.marcarActividad =
    marcarActividad;

window.marcarAlimentacion =
    marcarAlimentacion;

window.marcarDientes =
    marcarDientes;

window.marcarHabito =
    marcarHabito;

window.agregarCita =
    agregarCita;

window.eliminarCita =
    eliminarCita;

window.crearRecordatorio =
    crearRecordatorio;

window.eliminarRecordatorio =
    eliminarRecordatorio;

window.cambiarEstadoRecordatorio =
    cambiarEstadoRecordatorio;

window.mostrarRecordatorios =
    mostrarRecordatorios;

window.mostrarInfo =
    mostrarInfo;

window.mostrarConsejo =
    mostrarConsejo;

window.actualizarProgreso =
    actualizarProgreso;

window.actualizarDashboard =
    actualizarDashboard;


/* =========================================================
   INICIAR APLICACIÓN
   ========================================================= */

actualizarInterfazSalud();

actualizarProgreso();

mostrarCitas();

mostrarConsejo();


console.log(
    "🚀 HealthTrack iniciado correctamente."
);
