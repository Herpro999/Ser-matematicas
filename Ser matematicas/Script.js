/* =========================================================
   HEALTHTRACK
   SCRIPT PRINCIPAL
   ========================================================= */

   /* =========================================================
   RECORDATORIOS DE SALUD
   ========================================================= */

let recordatorios = [];


/* =========================================================
   CREAR RECORDATORIO
   ========================================================= */

async function crearRecordatorio() {

    /*
       Comprobar usuario.
    */

    if (!usuarioActual) {

        alert(
            "🔐 Debes iniciar sesión para crear un recordatorio."
        );

        return;
    }


    /*
       Obtener campos del formulario.
    */

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


    /*
       Obtener valores.
    */

    const titulo =
        campoTitulo.value.trim();

    const tipo =
        campoTipo.value;

    const fecha =
        campoFecha.value;

    const hora =
        campoHora.value;


    /*
       Validar información.
    */

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


    /*
       Crear referencia:
       
       users/
          UID/
             recordatorios/
    */

    const recordatoriosRef =
        collection(
            db,
            "users",
            usuarioActual.uid,
            "recordatorios"
        );


    /*
       Datos del recordatorio.
    */

    const nuevoRecordatorio = {

        titulo: titulo,

        tipo: tipo,

        fecha: fecha,

        hora: hora,

        completado: false,

        creadoEn: serverTimestamp()

    };


    try {

        /*
           Guardar en Firestore.
        */

        const documento =
            await addDoc(
                recordatoriosRef,
                nuevoRecordatorio
            );


        console.log(
            "✅ Recordatorio guardado:",
            documento.id
        );


        /*
           Limpiar formulario.
        */

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


/* =========================================================
   CARGAR RECORDATORIOS DESDE FIRESTORE
   ========================================================= */
/* =========================================================
   DASHBOARD DE SALUD
   ========================================================= */

function actualizarDashboard() {

    /*
       Si no hay usuario,
       mostrar información básica.
    */

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


    /*
       SALUDO
    */

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


    /*
       TOTAL DE CITAS
    */

    const elementoCitas =
        document.getElementById(
            "dashboardCitas"
        );


    if (elementoCitas) {

        elementoCitas.textContent =
            citas.length;

    }


    /*
       RECORDATORIOS PENDIENTES
    */

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


    /*
       RECORDATORIOS COMPLETADOS
    */

    const elementoCompletados =
        document.getElementById(
            "dashboardCompletados"
        );


    if (elementoCompletados) {

        elementoCompletados.textContent =
            completados.length;

    }


    /*
       PRÓXIMA CITA
    */

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


        if (
            citasFuturas.length === 0
        ) {

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
                    ${proxima.tipo || "Cita médica"}
                </strong>

                <p>
                    📅 ${formatearFecha(proxima.fecha)}
                </p>

                <p>
                    ⏰ ${proxima.hora}
                </p>

            `;

        }

    }


    /*
       LISTA DE RECORDATORIOS
    */

    const lista =
        document.getElementById(
            "dashboardListaRecordatorios"
        );


    if (!lista) {

        return;

    }


    if (
        pendientes.length === 0
    ) {

        lista.innerHTML = `

            <p>
                🎉 No tienes recordatorios pendientes.
            </p>

        `;

        return;

    }


    /*
       Mostrar máximo 5.
    */

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
                        ${recordatorio.tipo || "🔔"}
                        ${recordatorio.titulo}
                    </strong>

                    <span>
                        📅 ${formatearFecha(recordatorio.fecha)}
                        · ⏰ ${recordatorio.hora}
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
   MOSTRAR RECORDATORIOS
   ========================================================= */

function mostrarRecordatorios() {

    const contenedor =
        document.getElementById(
            "listaRecordatorios"
        );


    /*
       Si todavía no existe el elemento,
       terminamos.
    */

    if (!contenedor) {

        return;

    }


    /*
       Limpiar contenido anterior.
    */

    contenedor.innerHTML = "";


    /*
       Usuario no conectado.
    */

    if (!usuarioActual) {

        contenedor.innerHTML = `

            <p>
                🔐 Inicia sesión para ver tus recordatorios.
            </p>

        `;

        return;

    }


    /*
       No hay recordatorios.
    */

    if (recordatorios.length === 0) {

        contenedor.innerHTML = `

            <p>
                🔔 No tienes recordatorios todavía.
            </p>

        `;

        return;

    }


    /*
       Crear cada recordatorio.
    */

    recordatorios.forEach(
        function(recordatorio) {

            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.classList.add(
                "recordatorio"
            );


            /*
               Estado visual.
            */

            if (
                recordatorio.completado
            ) {

                tarjeta.classList.add(
                    "completado"
                );

            }


            /*
               Crear título.
            */

            const titulo =
                document.createElement(
                    "h3"
                );

            titulo.textContent =
                `${recordatorio.tipo || "🔔"} ${recordatorio.titulo}`;


            /*
               Crear fecha.
            */

            const fecha =
                document.createElement(
                    "p"
                );

            fecha.textContent =
                `📅 ${formatearFecha(recordatorio.fecha)}`;


            /*
               Crear hora.
            */

            const hora =
                document.createElement(
                    "p"
                );

            hora.textContent =
                `⏰ ${recordatorio.hora}`;


            /*
               Estado.
            */

            const estado =
                document.createElement(
                    "p"
                );

            estado.textContent =
                recordatorio.completado
                    ? "✅ Completado"
                    : "🔔 Pendiente";


            /*
               Botón completar.
            */

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


            /*
               Botón eliminar.
            */

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


            /*
               Agregar elementos.
            */

            tarjeta.appendChild(
                titulo
            );

            tarjeta.appendChild(
                fecha
            );

            tarjeta.appendChild(
                hora
            );

            tarjeta.appendChild(
                estado
            );

            tarjeta.appendChild(
                botonCompletar
            );

            tarjeta.appendChild(
                botonEliminar
            );


            contenedor.appendChild(
                tarjeta
            );

        }
    );
actualizarDashboard();
}


/* =========================================================
   CAMBIAR ESTADO DEL RECORDATORIO
   ========================================================= */

async function cambiarEstadoRecordatorio(
    id,
    completado
) {

    if (!usuarioActual) {

        return;

    }


    if (!id) {

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

                completado:
                    completado

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


/* =========================================================
   ELIMINAR RECORDATORIO
   ========================================================= */

async function eliminarRecordatorio(id) {

    if (!usuarioActual) {

        return;

    }


    if (!id) {

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


/* =========================================================
   INICIALIZAR FIREBASE
   ========================================================= */

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



/*
   Las citas ya NO se guardan en localStorage.

   Ahora se guardan en:

   users
      └── UID
           └── citas
                └── ID_DE_CITA

*/

let citas = [];


/*
   Usuario actualmente conectado.
*/

let usuarioActual = null;

let detenerListenerRecordatorios = null;

/*
   Función para detener el listener
   de Firestore cuando sea necesario.
*/

let detenerListenerCitas = null;



/* =========================================================
   CARGAR DATOS LOCALES DE SALUD
   ========================================================= */

/*
   Mantenemos temporalmente los hábitos en localStorage.

   Las CITAS, en cambio, utilizan Firebase.

   Más adelante podemos pasar también los hábitos
   a Firestore para que funcionen igual en todos
   los dispositivos.
*/


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



/* =========================================================
   GUARDAR DATOS LOCALES
   ========================================================= */

/*
   IMPORTANTE:

   Aquí solamente guardamos salud.

   Las citas NO se guardan aquí porque ahora
   pertenecen a Firebase.
*/

function guardarDatos() {

    localStorage.setItem(

        "healthTrack",

        JSON.stringify({

            salud: salud

        })

    );

}



/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function mostrarSeccion(nombre) {

    const secciones =
        document.querySelectorAll(".seccion");


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


    /*
       Si el usuario entra a Citas,
       nos aseguramos de mostrar
       la información más reciente.
    */

    if (nombre === "citas") {

    mostrarCitas();

}


if (nombre === "recordatorios") {

    mostrarRecordatorios();

}

}



/* =========================================================
   AGREGAR AGUA
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



/* =========================================================
   SUEÑO
   ========================================================= */

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



/* =========================================================
   ACTIVIDAD FÍSICA
   ========================================================= */

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


    if (salud.actividad) {

        boton.textContent =
            "✅ Actividad realizada";

    } else {

        boton.textContent =
            "❌ No realizada";

    }


    guardarDatos();

    actualizarProgreso();

}



/* =========================================================
   ALIMENTACIÓN
   ========================================================= */

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


    if (salud.alimentacion) {

        boton.textContent =
            "✅ Alimentación registrada";

    } else {

        boton.textContent =
            "❌ Registrar alimentación";

    }


    guardarDatos();

    actualizarProgreso();

}



/* =========================================================
   HIGIENE DENTAL
   ========================================================= */

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


    if (salud.dientes) {

        boton.textContent =
            "✅ Realizada";

    } else {

        boton.textContent =
            "❌ Realizada";

    }


    guardarDatos();

    actualizarProgreso();

}



/* =========================================================
   CALCULAR PROGRESO
   ========================================================= */

function actualizarProgreso() {

    let puntos = 0;

    let total = 5;


    /*
       AGUA
    */

    if (salud.agua >= 8) {

        puntos++;

    }


    /*
       SUEÑO
    */

    if (salud.sueno >= 7) {

        puntos++;

    }


    /*
       ACTIVIDAD
    */

    if (salud.actividad) {

        puntos++;

    }


    /*
       ALIMENTACIÓN
    */

    if (salud.alimentacion) {

        puntos++;

    }


    /*
       DIENTES
    */

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



/* =========================================================
   HABITOS
   ========================================================= */

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


    if (
        li.classList.contains(
            "habito-completado"
        )
    ) {

        boton.textContent =
            "✅ Completado";

    } else {

        boton.textContent =
            "Completar";

    }

}



/* =========================================================
   CITAS MÉDICAS
   FIRESTORE
   ========================================================= */


/*
   Esta función comprueba que haya
   un usuario conectado.
*/

function usuarioEstaConectado() {

    if (!usuarioActual) {

        alert(
            "Debes iniciar sesión para utilizar las citas médicas."
        );

        return false;

    }


    return true;

}



/* =========================================================
   AGREGAR CITA
   ========================================================= */

async function agregarCita() {

    /*
       Comprobar usuario
    */

    if (!usuarioEstaConectado()) {

        return;

    }


    /*
       Obtener campos
    */

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


    /*
       Comprobar que existan
    */

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


    /*
       Obtener valores
    */

    const tipo =
        campoTipo.value.trim();


    const fecha =
        campoFecha.value;


    const hora =
        campoHora.value;


    const nota =
        campoNota.value.trim();


    /*
       Validación
    */

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


    /*
       Evitar citas con fechas inválidas.
    */

    const fechaCita =
        new Date(
            fecha + "T" + hora
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


    /*
       Objeto que enviaremos a Firestore.
    */

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


        /*
           Ruta:

           users/
             UID/
               citas/
        */

        const citasRef =
            collection(

                db,

                "users",

                usuarioActual.uid,

                "citas"

            );


        /*
           Crear documento.
        */

        const documento =
            await addDoc(
                citasRef,
                nuevaCita
            );


        console.log(
            "✅ Cita guardada:",
            documento.id
        );


        /*
           Limpiar formulario.
        */

        campoTipo.value = "";

        campoFecha.value = "";

        campoHora.value = "";

        campoNota.value = "";


        /*
           Mostrar mensaje.
        */

        alert(
            "✅ Cita guardada correctamente."
        );


        /*
           mostrarCitas() se actualizará
           automáticamente gracias a
           onSnapshot().
        */


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

function cargarRecordatoriosDesdeFirebase() {

    console.log("🔔 Iniciando carga de recordatorios...");

    // Limpiar listener anterior
    if (detenerListenerRecordatorios) {

        detenerListenerRecordatorios();

        detenerListenerRecordatorios = null;

    }

    // Si no hay usuario
    if (!usuarioActual) {

        console.log(
            "⚠️ No hay usuario conectado para cargar recordatorios."
        );

        recordatorios = [];

        mostrarRecordatorios();

        actualizarDashboard();

        return;
    }

    console.log(
        "👤 Usuario para recordatorios:",
        usuarioActual.uid
    );


    // Mostrar estado inicial
    const contenedor =
        document.getElementById(
            "listaRecordatorios"
        );

    if (contenedor) {

        contenedor.innerHTML = `
            <p>🔄 Conectando con tus recordatorios...</p>
        `;

    }


    // Ruta:
    // users / UID / recordatorios

    const recordatoriosRef =
        collection(
            db,
            "users",
            usuarioActual.uid,
            "recordatorios"
        );


    console.log(
        "📡 Escuchando Firestore:",
        `users/${usuarioActual.uid}/recordatorios`
    );


    // Listener en tiempo real

    detenerListenerRecordatorios =
        onSnapshot(

            recordatoriosRef,

            function(snapshot) {

                console.log(
                    "📦 Firestore respondió para recordatorios."
                );


                recordatorios = [];


                snapshot.forEach(
                    function(documento) {

                        const datos =
                            documento.data();


                        recordatorios.push({

                            id:
                                documento.id,

                            titulo:
                                datos.titulo || "Sin título",

                            tipo:
                                datos.tipo || "📌 Otro",

                            fecha:
                                datos.fecha || "",

                            hora:
                                datos.hora || "",

                            completado:
                                datos.completado === true

                        });

                    }
                );


                console.log(
                    "🔔 Recordatorios cargados:",
                    recordatorios.length
                );


                // Mostrar inmediatamente en la página

                mostrarRecordatorios();

            },

            function(error) {

                console.error(
                    "❌ ERROR LEYENDO RECORDATORIOS:",
                    error
                );


                const contenedor =
                    document.getElementById(
                        "listaRecordatorios"
                    );


                if (contenedor) {

                    contenedor.innerHTML = `
                        <p style="color:red;">
                            ❌ No se pudieron cargar los recordatorios.
                        </p>

                        <p>
                            Revisa la consola para ver el error.
                        </p>
                    `;

                }

            }

        );

}   

/* =========================================================
   MOSTRAR CITAS
   ========================================================= */

function mostrarCitas() {

    const contenedor =
        document.getElementById(
            "listaCitas"
        );


    /*
       Si el elemento todavía no existe,
       simplemente terminamos.
    */

    if (!contenedor) {

        return;

    }


    contenedor.innerHTML = "";


    /*
       No usuario
    */

    if (!usuarioActual) {

        contenedor.innerHTML = `

            <p>
                🔐 Inicia sesión para ver tus citas.
            </p>

        `;

        return;

    }


    /*
       Sin citas
    */

    if (citas.length === 0) {

        contenedor.innerHTML = `

            <p>
                No tienes citas registradas.
            </p>

        `;

        return;

    }


    /*
       Crear cada tarjeta.
    */

    citas.forEach(
        function(cita) {

            const div =
                document.createElement(
                    "div"
                );


            div.classList.add(
                "cita"
            );


            /*
               Crear contenido sin utilizar
               datos directamente como HTML
               para reducir problemas con
               texto introducido por usuarios.
            */

            const contenido =
                document.createElement(
                    "div"
                );


            const titulo =
                document.createElement(
                    "strong"
                );


            titulo.textContent =
                "🩺 " + cita.tipo;


            contenido.appendChild(
                titulo
            );


            contenido.appendChild(
                document.createElement(
                    "br"
                )
            );


            const fechaTexto =
                document.createTextNode(
                    "📅 " +
                    formatearFecha(
                        cita.fecha
                    )
                );


            contenido.appendChild(
                fechaTexto
            );


            contenido.appendChild(
                document.createElement(
                    "br"
                )
            );


            const horaTexto =
                document.createTextNode(
                    "⏰ " +
                    cita.hora
                );


            contenido.appendChild(
                horaTexto
            );


            /*
               Nota
            */

            if (cita.nota) {

                contenido.appendChild(
                    document.createElement(
                        "br"
                    )
                );


                const notaTexto =
                    document.createTextNode(
                        "📝 " +
                        cita.nota
                    );


                contenido.appendChild(
                    notaTexto
                );

            }


            /*
               Botón eliminar
            */

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



/* =========================================================
   ELIMINAR CITA
   ========================================================= */

async function eliminarCita(id) {

    /*
       Comprobar usuario.
    */

    if (!usuarioEstaConectado()) {

        return;

    }


    /*
       Comprobar ID.
    */

    if (!id) {

        console.error(
            "❌ ID de cita inválido."
        );

        return;

    }


    /*
       Confirmación.
    */

    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar esta cita?"
        );


    if (!confirmar) {

        return;

    }


    try {

        console.log(
            "🗑️ Eliminando cita:",
            id
        );


        /*
           Ruta exacta:

           users/
             UID/
               citas/
                 ID
        */

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
            "✅ Cita eliminada correctamente."
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
   FORMATEAR FECHA
   ========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {

        return "Fecha no disponible";

    }


    /*
       YYYY-MM-DD
       ↓
       DD/MM/YYYY
    */

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
   OBTENER PRÓXIMA CITA
   ========================================================= */

function obtenerProximaCita() {

    if (!citas || citas.length === 0) {

        return null;

    }


    const ahora =
        new Date();


    /*
       Buscar la primera cita
       que todavía no haya pasado.
    */

    for (
        let i = 0;
        i < citas.length;
        i++
    ) {

        const cita =
            citas[i];


        const fecha =
            new Date(

                cita.fecha +
                "T" +
                cita.hora

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



/* =========================================================
   MOSTRAR PRÓXIMA CITA
   ========================================================= */

function mostrarProximaCita() {

    const proxima =
        obtenerProximaCita();


    /*
       Esta función busca varios posibles
       elementos para que podamos integrarla
       fácilmente en tu index.html.
    */

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
   ESCAPAR TEXTO PARA PREVENIR HTML NO DESEADO
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



/* =========================================================
   MOSTRAR CONSEJO ALEATORIO
   ========================================================= */

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
   ACTUALIZAR INTERFAZ DE USUARIO
   ========================================================= */

function actualizarInterfazSalud() {

    /*
       Agua
    */

    const aguaTexto =
        document.getElementById(
            "aguaTexto"
        );


    if (aguaTexto) {

        aguaTexto.textContent =
            salud.agua +
            " vasos";

    }


    /*
       Sueño
    */

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


    /*
       Actividad
    */

    const actividadBtn =
        document.getElementById(
            "actividadBtn"
        );


    if (actividadBtn) {

        if (salud.actividad) {

            actividadBtn.textContent =
                "✅ Actividad realizada";

        } else {

            actividadBtn.textContent =
                "❌ No realizada";

        }

    }


    /*
       Alimentación
    */

    const alimentacionBtn =
        document.getElementById(
            "alimentacionBtn"
        );


    if (alimentacionBtn) {

        if (salud.alimentacion) {

            alimentacionBtn.textContent =
                "✅ Alimentación registrada";

        } else {

            alimentacionBtn.textContent =
                "❌ Registrar alimentación";

        }

    }


    /*
       Dientes
    */

    const dientesBtn =
        document.getElementById(
            "dientesBtn"
        );


    if (dientesBtn) {

        if (salud.dientes) {

            dientesBtn.textContent =
                "✅ Realizada";

        } else {

            dientesBtn.textContent =
                "❌ Realizada";

        }

    }


    actualizarProgreso();

}



/* =========================================================
   CAMBIO DE USUARIO
   ========================================================= */

function manejarCambioUsuario(usuario) {

    /*
       Si había listener anterior,
       detenerlo.
    */

    if (detenerListenerCitas) {

        detenerListenerCitas();

        detenerListenerCitas = null;

    }


    usuarioActual =
        usuario;


    /*
       Usuario no conectado.
    */

    if (!usuarioActual) {

        console.log(
            "🔐 No hay usuario conectado."
        );


        citas = [];


        mostrarCitas();

        mostrarProximaCita();


        return;

    }


    /*
       Usuario conectado.
    */

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

cargarCitasDesdeFirebase();

    /*
       Cargar citas específicas
       de este UID.
    */

function cargarCitasDesdeFirebase() {

    // Detener listener anterior
    if (detenerListenerCitas) {

        detenerListenerCitas();

        detenerListenerCitas = null;

    }


    // Comprobar usuario

    if (!usuarioActual) {

        citas = [];

        mostrarCitas();

        mostrarProximaCita();

        return;

    }


    console.log(
        "📥 Cargando citas del usuario:",
        usuarioActual.uid
    );


    // Ruta:
    // users / UID / citas

    const citasRef =
        collection(
            db,
            "users",
            usuarioActual.uid,
            "citas"
        );


    // Escuchar cambios en tiempo real

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
                                datos.tipo || "",

                            fecha:
                                datos.fecha || "",

                            hora:
                                datos.hora || "",

                            nota:
                                datos.nota || "",

                            creadaEn:
                                datos.creadaEn || ""

                        });

                    }
                );


                // Ordenar por fecha y hora

                citas.sort(
                    function(a, b) {

                        const fechaA =
                            new Date(
                                a.fecha +
                                "T" +
                                a.hora
                            );


                        const fechaB =
                            new Date(
                                b.fecha +
                                "T" +
                                b.hora
                            );


                        return (
                            fechaA.getTime() -
                            fechaB.getTime()
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

console.log(
    "🎯 Contenedor de citas:",
    document.getElementById("listaCitas")
);

                mostrarCitas();

                mostrarProximaCita();

            },


            function(error) {

                console.error(
                    "❌ Error leyendo citas:",
                    error
                );


                citas = [];

                mostrarCitas();

                mostrarProximaCita();

                actualizarDashboard();


                const contenedor =
                    document.getElementById(
                        "listaCitas"
                    );


                if (contenedor) {

                    contenedor.innerHTML = `

                        <p>
                            ❌ No se pudieron cargar tus citas.
                        </p>

                    `;

                }

            }

        );

}

cargarRecordatoriosDesdeFirebase();

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

/*
   IMPORTANTE:

   Tu index.html utiliza onclick="..."

   Como este archivo ahora es un módulo,
   las funciones no serían globales automáticamente.

   Por eso las agregamos a window.
*/


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