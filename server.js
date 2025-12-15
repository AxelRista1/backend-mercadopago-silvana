import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

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
  te: { titulo: "Curso de Té", precio: 5000 },
  mate: { titulo: "Curso de Yerba Mate", precio: 4500 },
  feng: { titulo: "Curso de Feng Shui", precio: 6000 }
};

/* ENDPOINT */
app.post("/crear-preferencia", async (req, res) => {
  const { curso } = req.body;

  if (!cursos[curso]) {
    return res.status(400).json({ error: "Curso inválido" });
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
        back_urls: {
          success: `${FRONT_URL}/success.html?curso=${curso}`,
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

app.get("/", (req, res) => {
  res.send("✅ Backend Mercado Pago activo");
});

app.listen(PORT, () => {
  console.log(`🔥 Backend activo en puerto ${PORT}`);
});