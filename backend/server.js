import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import nodemailer from "nodemailer";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FRONT_URL = process.env.FRONT_URL; // ejemplo: https://tu-sitio.netlify.app

/* MERCADO PAGO */
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/* CURSOS */
const cursos = {
  te: { titulo: "Curso de Té", precio: 5000, pdf: "pdf/curso-te.pdf" },
  mate: { titulo: "Curso de Yerba Mate", precio: 4500, pdf: "pdf/curso-mate.pdf" },
  feng: { titulo: "Curso de Feng Shui", precio: 6000, pdf: "pdf/curso-feng.pdf" }
};

/* NODEMAILER */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function enviarPDF(email, archivoPDF) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Tu curso comprado",
    text: "¡Gracias por tu compra! Adjuntamos tu archivo.",
    attachments: [
      { filename: path.basename(archivoPDF), path: archivoPDF }
    ]
  });
  console.log(`PDF enviado a ${email}`);
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

/* ENDPOINT: verificar pago y enviar PDF */
app.get("/verificar-pago/:paymentId", async (req, res) => {
  try {
    const paymentId = req.params.paymentId;

    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status === "approved") {

      const { curso, email } = payment.metadata;

      const archivoPDF = cursos[curso].pdf;

      await enviarPDF(email, archivoPDF);

      res.json({ aprobado: true, enviado: true });

    } else {
      res.json({ aprobado: false, enviado: false });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ aprobado: false, enviado: false });
  }
});