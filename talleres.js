
    const menuArrow = document.querySelector('.menu-arrow');
    const navMenu = document.querySelector('.nav-menu');
  
    // Mostrar menú completo en móvil
    menuArrow.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      menuArrow.style.transform = navMenu.classList.contains('active')
        ? 'rotate(180deg)'
        : 'rotate(0)';
    });

    document.addEventListener("DOMContentLoaded", function() {
      const toggles = document.querySelectorAll(".toggle-btn");
  
      toggles.forEach(btn => {
        btn.addEventListener("click", function() {
          const content = this.nextElementSibling;
          if(content.style.display === "block") {
            content.style.display = "none";
          } else {
            content.style.display = "block";
          }
        });
      });
    });

const PASSWORD = "yervamate2026";

/* =========================
   MODAL
========================= */
function abrirModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "flex"; // 👈 esto es la clave
  mostrarLogin();
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

/* =========================
   LOGIN
========================= */
function mostrarLogin() {
  document.getElementById("contenido").innerHTML = `
    <h2>Acceso a la Autoevaluación</h2>
    
    <input id="nombre" placeholder="Nombre y Apellido"><br><br>
    <div class="password-container">
    <input id="pass" type="password" placeholder="Contraseña">
    <span class="tooltip">
      La contraseña se obtiene una vez comprado el Curso mi Primer Mate.
    </span>
    </div>
    <button class="btn2" onclick="validar()">Ingresar</button>
    <p id="error" style="color:red;"></p>
  `;
}

function validar() {
  const nombre = document.getElementById("nombre").value;
  const pass = document.getElementById("pass").value;

  if (!nombre || !pass) {
    document.getElementById("error").innerText = "Completá todos los campos";
    return;
  }

  if (pass !== PASSWORD) {
    document.getElementById("error").innerText = "Contraseña incorrecta";
    return;
  }

  iniciarEvaluacion(nombre);
}

/* =========================
   PREGUNTAS
========================= */
const preguntas = [
{
texto: "¿Quiénes fueron los principales impulsores de la domesticación y expansión de la yerba mate en Sudamérica durante la época colonial?",
opciones: ["Los colonos españoles","Los jesuitas","Los bandeirantes portugueses"],
correcta: 1,
feedback: "Los jesuitas domesticaron la planta y organizaron su producción, expandiendo el consumo y mejorando la calidad de la yerba mate."
},
{
texto: "¿Cuál es el nombre científico de la planta de yerba mate?",
opciones: ["Camellia sinensis","Ilex paraguariensis","Lagenaria siceraria"],
correcta: 1,
feedback: "Ilex paraguariensis es el nombre científico de la planta de yerba mate."
},
{
texto: "¿En qué países se produce yerba mate a nivel mundial?",
opciones: ["Argentina, Brasil, Paraguay y Uruguay","Argentina, Chile y Bolivia","Brasil, Perú y Ecuador"],
correcta: 0,
feedback: "Solo Argentina, Brasil, Paraguay y Uruguay son productores mundiales de yerba mate."
},
{
texto: "¿Qué país cuenta con el complejo productivo de yerba mate más avanzado tecnológicamente?",
opciones: ["Paraguay","Argentina","Brasil"],
correcta: 1,
feedback: "Argentina produce el 45% de la yerba mate mundial y lidera en tecnología productiva."
},
{
texto: "¿Cuál de los siguientes componentes NO aporta sabor a la infusión pero sí estructura y suavidad?",
opciones: ["Hojas de molienda gruesa","Palo","Polvo de hoja"],
correcta: 1,
feedback: "El palo aporta estructura y suavidad, pero no sabor significativo al mate."
},
{
texto: "¿Cuál es el primer paso para preparar un buen mate?",
opciones: ["Colocar la bombilla","Llenar 3/4 partes del mate con yerba mate","Servir agua caliente directamente"],
correcta: 1,
feedback: "El primer paso es llenar el mate con yerba antes de acomodarla y humedecerla."
},
{
texto: "¿Cuál es el material tradicional del mate más usado históricamente?",
opciones: ["Calabaza","Vidrio","Silicona"],
correcta: 0,
feedback: "El mate de calabaza es el más tradicional y usado desde tiempos de los guaraníes."
},
{
texto: "¿Por qué es importante curar un mate de madera antes de usarlo?",
opciones: ["Para darle color","Para sellar sus paredes y evitar fisuras","Para hacerlo más liviano"],
correcta: 1,
feedback: "Curar el mate de madera y/o calabaza sella los poros y lo protege para un uso prolongado."
},
{
texto: "¿Cuál fue el primer pueblo en incorporar la yerba mate a su espiritualidad y vida cotidiana?",
opciones: ["Los incas","Los guaraníes","Los jesuitas"],
correcta: 1,
feedback: "Los guaraníes fueron los primeros en consumir y valorar la yerba mate como planta sagrada."
},
{
texto: "¿Qué simboliza el ritual del mate en la cultura argentina?",
opciones: ["Un simple hábito alimenticio","Un código emocional y un instante sagrado de encuentro","Una moda pasajera"],
correcta: 1,
feedback: "El mate es mucho más que una bebida: es un ritual de encuentro, amistad y tradición en Argentina."
}
];

let respuestas = [];

/* =========================
   INICIAR EVALUACIÓN
========================= */
function iniciarEvaluacion(nombre) {
  respuestas = new Array(preguntas.length).fill(null);

  let html = `
    <h2>Autoevaluación – Curso de Yerba Mate 2026</h2>
    <p>¡Hola <b>${nombre}</b>! Felicitaciones por llegar al final del curso de Yerba Mate. Esta autoevaluación te
        ayudará a repasar y consolidar lo aprendido. ¡Intenta responder todas las preguntas! Al finalizar, revisa tus
        respuestas para fortalecer tu comprensión del ebook de Yerba Mate. Recuerda que cada pregunta tiene una sola
        respuesta correcta y recibirás una breve explicación para cada una. ¡Mucho éxito!</p>
    <p>Respondé todas las preguntas.</p>
    <hr>
  `;

  preguntas.forEach((p, i) => {
    html += `
    <div class="pregunta">
      <p><b>${i+1}. ${p.texto}</b></p>
      ${p.opciones.map((op, j)=>`
        <div class="opcion" onclick="seleccionar(${i},${j},this)">
          ${op}
        </div>
      `).join("")}
    </div>
    `;
  });

  html += `<button class="btn2" onclick="finalizar('${nombre}')">Finalizar evaluación</button>`;
  document.getElementById("contenido").innerHTML = html;
}

/* =========================
   SELECCIONAR RESPUESTA
========================= */
function seleccionar(i, seleccion, elemento) {
  respuestas[i] = seleccion;

  const opciones = elemento.parentNode.querySelectorAll(".opcion");
  opciones.forEach(op => op.classList.remove("seleccionada"));
  elemento.classList.add("seleccionada");
}

/* =========================
   FINALIZAR
========================= */
function finalizar(nombre) {
  let puntos = 0;

  respuestas.forEach((r,i)=>{
    if(r === preguntas[i].correcta) puntos++;
  });

  let aprobado = puntos >= 6;

  let html = `
    <h2>Resultado final</h2>
    <p>Alumno: <b>${nombre}</b></p>
    <p>Puntaje: <b>${puntos}/10</b></p>
    <h3>${aprobado ? "🎉 Aprobado" : "❌ Reprobado"}</h3>
    <hr>
  `;

  preguntas.forEach((p,i)=>{
    html += `
      <div class="pregunta">
        <p><b>${i+1}. ${p.texto}</b></p>
        <p><b>Tu respuesta:</b> ${respuestas[i] !== null ? p.opciones[respuestas[i]] : "No respondida"}</p>
        <p><b>Respuesta correcta:</b> ${p.opciones[p.correcta]}</p>
        <p class="feedback">${p.feedback}</p>
      </div>
    `;
  });

  html += `
    <hr>
    <h3>Conclusión</h3>
    <p>¡Gracias por participar <b>${nombre}</b>! <br> Te invito a releer el Curso sobre Yerba Mate, para fortalecer tus conocimientos. Recuerda, equivocarse no está mal, es parte del aprendizaje. <br> Sigue adelante!</p>
  `;

  if (aprobado) {
    html += `
      <h3>🎓 Certificado disponible</h3>
      <button class="btn2" onclick="descargarCertificado('${nombre}')">
        Descargar Certificado
      </button>
    `;
  }

  html += `<br><br><button class="btn2" onclick="cerrarModal()">Cerrar</button>`;

  document.getElementById("contenido").innerHTML = html;
}

/* =========================
   DESCARGAR CERTIFICADO
========================= */
function descargarCertificado(nombre) {
  const url = "pdf/Certificado-MI-PRIMER-MATE.png";

  fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Certificado_${nombre}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      alert("Error al descargar el certificado");
    });
}
