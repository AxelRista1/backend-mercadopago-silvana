import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FRONT_URL = process.env.FRONT_URL;

/* PAYPAL */
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Sandbox para pruebas.
// Mañana, cuando tengas la App Live, si querés cobrar de verdad,
// lo cambiamos por:
// https://api-m.paypal.com
const PAYPAL_API =
  process.env.PAYPAL_API ||
  "https://api-m.sandbox.paypal.com";





/* MERCADO PAGO */
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/* CURSOS */
const cursos = {
  te: { titulo: "Curso de Té", precio: 5000, pdf: "pdf/curso-te.pdf" },

  mate: { titulo: "Curso mi Primer Mate", precio: 35635, pdf: "pdf/curso-mate.pdf" },

  experiencia: { titulo: "Experiencia Yerba Mate", precio: 71000, pdf: "pdf/curso-experiencia.pdf" },

  feng: { titulo: "Curso de Feng Shui", precio: 67500, pdf: "pdf/curso-feng.pdf" },

  // 👇 NUEVO
  jardines: {   titulo: "Jardines",   precio: 17125,   pdf: "pdf/curso-jardines.pdf"}
};



/* ==========================================================
                        PAYPAL
==========================================================

ESTADO:
✔ Backend preparado.
✔ Endpoints creados.
✔ Variables de entorno preparadas.

MAÑANA SE AGREGARÁ:

1) Obtener Access Token desde PayPal.
2) Crear la orden de pago.
3) Capturar el pago cuando el cliente apruebe la compra.
4) Verificar que el pago esté COMPLETED.
5) Devolver:
   {
      aprobado: true,
      curso: "mate"
   }

Con esto PayPal utilizará exactamente el mismo flujo
que Mercado Pago y success.html funcionará para ambos.

========================================================== */

async function obtenerAccessToken() {

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_API}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Error obteniendo Access Token:", data);
    throw new Error("No se pudo obtener el Access Token de PayPal.");
  }

  return data.access_token;

}

async function crearOrdenPaypal(curso, nombre, email) {

  const accessToken = await obtenerAccessToken();

  const response = await fetch(
    `${PAYPAL_API}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",

        purchase_units: [
          {
            description: cursos[curso].titulo,

            amount: {
              currency_code: "USD",
              value: (cursos[curso].precio / 1400).toFixed(2)
            },

            custom_id: curso
          }
        ],

        application_context: {
          brand_name: "Silvana Schenk",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",

          return_url: `${FRONT_URL}/success.html`,
          cancel_url: `${FRONT_URL}/error.html`
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    throw new Error("No se pudo crear la orden.");
  }

  return data;

}



async function capturarOrdenPaypal(orderId) {

  const accessToken = await obtenerAccessToken();

  const response = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    throw new Error("No se pudo capturar el pago.");
  }

  return data;

}



async function verificarOrdenPaypal(orderId) {

  const captura = await capturarOrdenPaypal(orderId);

  if (captura.status === "COMPLETED") {

    return {

      aprobado: true,

      curso: captura.purchase_units[0].custom_id

    };

  }

  return {

    aprobado: false

  };

}




/* ENDPOINT: crear preferencia de pago */
app.post("/crear-preferencia", async (req, res) => {
  const { curso, nombre, email } = req.body;

  if (!cursos[curso]) {
    return res.status(400).json({ error: "Curso inválido" });
  }

  if (!email || !nombre) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const preferenceClient = new Preference(mpClient);

    const response = await preferenceClient.create({
      body: {
        items: [
          {
            title: cursos[curso].titulo,
            quantity: 1,
            currency_id: "ARS",
            unit_price: cursos[curso].precio
          }
        ],
        metadata: {
          curso,
          nombre,
          email
        },
        back_urls: {
          success: `${FRONT_URL}/success.html`,
          failure: `${FRONT_URL}/error.html`,
          pending: `${FRONT_URL}/pending.html`
        },
        auto_return: "approved"
      }
    });

    res.json({ id: response.id });

  } catch (error) {
    console.error("Mercado Pago error:", error);
    res.status(500).json({ error: "Error Mercado Pago" });
  }
});




/* ==========================================================
   PAYPAL
   Este endpoint quedará operativo cuando se implemente
   la API oficial de PayPal Developer.
========================================================== */

/* ENDPOINT: crear orden PayPal */
app.post("/crear-paypal-order", async (req, res) => {

  const { curso, nombre, email } = req.body;

  if (!cursos[curso]) {
    return res.status(400).json({
      error: "Curso inválido"
    });
  }

  if (!nombre || !email) {
    return res.status(400).json({
      error: "Faltan datos"
    });
  }

  try {

    const order = await crearOrdenPaypal(
      curso,
      nombre,
      email
    );

    res.json(order);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error PayPal"
    });

  }

});





/* ENDPOINT: verificar pago */
app.get("/verificar-pago/:paymentId", async (req, res) => {
  try {
    const paymentId = req.params.paymentId;

    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status === "approved") {
      res.json({ 
        aprobado: true,
        curso: payment.metadata.curso // 👈 CLAVE
      });
    } else {
      res.json({ aprobado: false });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ aprobado: false });
  }
});





/* ENDPOINT: verificar pago PayPal */
app.get("/verificar-paypal/:orderId", async (req, res) => {

  try {

    const resultado = await verificarOrdenPaypal(
      req.params.orderId
    );

    res.json(resultado);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      aprobado: false
    });

  }

});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});