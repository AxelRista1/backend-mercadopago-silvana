const menuArrow = document.querySelector('.menu-arrow');
const navMenu = document.querySelector('.nav-menu');

if(menuArrow){
  menuArrow.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuArrow.style.transform = navMenu.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
  });
}

let cursoSeleccionado = "";

function abrirModal(curso) {
  cursoSeleccionado = curso;
  document.getElementById("modalCompra").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modalCompra").style.display = "none";
}

// ⚠️ PONÉ ACA TU PUBLIC KEY (NO EL ACCESS TOKEN)
const mp = new MercadoPago("APP_USR-495e53b8-f8c9-4134-bdab-9ba0bdecb8ae");

function confirmarCompra() {
  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;

  if (!nombre || !email.includes("@")) {
    alert("Por favor completa los datos correctamente");
    return;
  }

  fetch("https://backend-mercadopago-silvana.onrender.com/crear-preferencia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      curso: cursoSeleccionado,
      nombre,
      email
    })
  })
  .then(res => res.json())
  .then(data => {
    mp.checkout({
      preference: { id: data.id },
      autoOpen: true
    });
  })
  .catch(err => console.error(err));
}

let slideActualMate = 0;


function confirmarCompraPaypal() {

  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;

  if (!nombre || !email.includes("@")) {
    alert("Por favor completa los datos correctamente");
    return;
  }

  fetch("https://backend-mercadopago-silvana.onrender.com/crear-paypal-order", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      curso: cursoSeleccionado,
      nombre,
      email
    })

  })

  .then(res => res.json())

  .then(order => {

    const approvalLink = order.links.find(
      link => link.rel === "approve"
    );

    if (!approvalLink) {
      alert("No se pudo iniciar PayPal.");
      return;
    }

    window.location.href = approvalLink.href;

  })

  .catch(err => {

    console.error(err);

    alert("Error al conectar con PayPal.");

  });

}

function abrirModalMate() {
  document.getElementById("modalCursoMate").style.display = "flex";
}

function cerrarModalMate() {
  document.getElementById("modalCursoMate").style.display = "none";
}

function cambiarSlideMate(direccion) {
  const slidesMate = document.querySelectorAll(".slide-mate");

  slidesMate[slideActualMate].classList.remove("active-mate");

  slideActualMate += direccion;

  if (slideActualMate >= slidesMate.length) slideActualMate = 0;
  if (slideActualMate < 0) slideActualMate = slidesMate.length - 1;

  slidesMate[slideActualMate].classList.add("active-mate");
}

function continuarCompraMate() {
  const mensaje = document.getElementById("mensajeMate").value;
  console.log("Mensaje curso mate:", mensaje);

  alert("Redirigiendo a Mercado Pago...");
}

function enviarMailMate() {

  const nombre = document.getElementById("nombreMate").value;
  const email = document.getElementById("emailMateModal").value;
  const mensaje = document.getElementById("mensajeMate").value;

  if (!nombre || !email) {
    alert("Por favor completá nombre y correo electrónico.");
    return;
  }

  const asunto = "Solicitud Experiencia yerva mate";

  const cuerpo = `
Nueva solicitud para Experiencia yerva mate

Nombre: ${nombre}
Email: ${email}

Detalles:
${mensaje}
  `;

  const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=silvanasommelierweb@gmail.com&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  // Abrir en nueva pestaña
  window.open(gmailURL, "_blank");
}
