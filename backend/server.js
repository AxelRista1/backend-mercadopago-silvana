import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FRONT_URL = process.env.FRONT_URL;

/* MERCADO PAGO */
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/* CURSOS */
const cursos = {
  te: { titulo: "Curso de Té", precio: 5000, pdf: "pdf/curso-te.pdf" },

  mate: { titulo: "Curso mi Primer Mate", precio: 1, pdf: "pdf/curso-mate.pdf" },

  experiencia: { titulo: "Experiencia Yerba Mate", precio: 71000, pdf: "pdf/curso-experiencia.pdf" },

  feng: { titulo: "Curso de Feng Shui", precio: 1, pdf: "pdf/curso-feng.pdf" },

  // 👇 NUEVO
  jardines: {   titulo: "Jardines",   precio: 1,   pdf: "pdf/curso-jardines.pdf"}
};

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});