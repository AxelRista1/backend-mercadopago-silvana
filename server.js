import express from "express";
import cors from "cors";
import mercadopago from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- CONFIG ---------- */
const FRONT_URL = "https://TU-FRONTEND-REAL.com"; // CAMBIAR
const PORT = process.env.PORT || 3000;

/* ---------- MERCADO PAGO ---------- */
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN // APP_USR
});

/* ---------- CURSOS ---------- */
const cursos = {
  te: { titulo: "Curso de Té", precio: 5000 },
  mate: { titulo: "Curso de Yerba Mate", precio: 4500 },
  feng: { titulo: "Curso de Feng Shui", precio: 6000 }
};

/* ---------- CREAR PREFERENCIA ---------- */
app.post("/crear-preferencia", async (req, res) => {
  const { curso } = req.body;

  if (!cursos[curso]) {
    return res.status(400).json({ error: "Curso inválido" });
  }

  try {
    const preference = {
      items: [
        {
          title: cursos[curso].titulo,
          quantity: 1,
          currency_id: "ARS",
          unit_price: cursos[curso].precio
        }
      ],
      back_urls: {
        success: `${FRONT_URL}/success.html?curso=${curso}`,
        failure: `${FRONT_URL}/error.html`,
        pending: `${FRONT_URL}/pending.html`
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error Mercado Pago" });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Backend activo en puerto ${PORT}`);
});