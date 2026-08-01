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


/* =========================
        PAYPAL
========================= */


const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;


// Guarda temporalmente las órdenes creadas
const ordenesPaypal = {};


const PAYPAL_API =
process.env.PAYPAL_API ||
"https://api-m.paypal.com";




/* =========================
        MERCADO PAGO
========================= */


const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});




/* =========================
        CURSOS
========================= */


const cursos = {

  te:{
    titulo:"Curso de Té",
    precio:5000,          // Mercado Pago (ARS)
    precioUSD:"5.00",     // PayPal (USD)
    pdf:"pdf/curso-te.pdf"
  },

  mate:{
    titulo:"Curso mi Primer Mate",
    precio:77000,
    precioUSD:"77",
    pdf:"pdf/curso-yerva-mate.zip"
  },

  experiencia:{
    titulo:"Experiencia Yerba Mate",
    precio:137000,
    precioUSD:"137",
    pdf:"pdf/curso-experiencia.pdf"
  },

  feng:{
    titulo:"Curso de Feng Shui",
    precio:87000,
    precioUSD:"87",
    pdf:"pdf/curso-feng.pdf"
  },

  jardines:{
    titulo:"Jardines",
    precio:17000,
    precioUSD:"17",
    pdf:"pdf/curso-jardines.pdf"
  }

};





/* =========================
    TOKEN PAYPAL
========================= */


async function obtenerAccessToken(){


const auth = Buffer.from(
`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
).toString("base64");



const response = await fetch(
`${PAYPAL_API}/v1/oauth2/token`,
{

method:"POST",

headers:{
Authorization:`Basic ${auth}`,
"Content-Type":"application/x-www-form-urlencoded"
},

body:"grant_type=client_credentials"

});


const data = await response.json();


if(!response.ok){

console.error(data);

throw new Error(
"No se pudo obtener token PayPal"
);

}


return data.access_token;


}







/* =========================
    CREAR ORDEN PAYPAL
========================= */


async function crearOrdenPaypal(curso,nombre,email){


const accessToken = await obtenerAccessToken();



const response = await fetch(

`${PAYPAL_API}/v2/checkout/orders`,

{

method:"POST",

headers:{
Authorization:`Bearer ${accessToken}`,
"Content-Type":"application/json"
},


body:JSON.stringify({

intent:"CAPTURE",


purchase_units:[

{

description:cursos[curso].titulo,


amount:{

  currency_code:"USD",

  value:cursos[curso].precioUSD

}

}

],


application_context:{

brand_name:"Silvana Schenk",

landing_page:"LOGIN",

user_action:"PAY_NOW",


return_url:
`${FRONT_URL}/success.html`,


cancel_url:
`${FRONT_URL}/error.html`

}


})

});


const data = await response.json();



if(!response.ok){

console.error(data);

throw new Error(
"No se pudo crear orden PayPal"
);

}


// GUARDAMOS CURSO ASOCIADO A LA ORDEN

ordenesPaypal[data.id] = {

curso,

nombre,

email

};



console.log(
"Orden PayPal creada:",
data.id,
curso
);



return data;


}







/* =========================
    CAPTURAR PAYPAL
========================= */


async function capturarOrdenPaypal(orderId){


const accessToken =
await obtenerAccessToken();



const response = await fetch(

`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,

{

method:"POST",

headers:{

Authorization:
`Bearer ${accessToken}`,

"Content-Type":
"application/json"

}

});



const data =
await response.json();



if(!response.ok){

console.error(data);

throw new Error(
"No se pudo capturar pago"
);

}



return data;


}








/* =========================
    VERIFICAR PAYPAL
========================= */


async function verificarOrdenPaypal(orderId){



const captura =
await capturarOrdenPaypal(orderId);



if(captura.status==="COMPLETED"){



const info =
ordenesPaypal[orderId];



if(!info){

return {

aprobado:false

};

}



return {


aprobado:true,

curso:info.curso


};



}



return {

aprobado:false

};


}







/* =========================
    MERCADO PAGO
========================= */


app.post(
"/crear-preferencia",

async(req,res)=>{


const {
curso,
nombre,
email
}=req.body;



if(!cursos[curso]){

return res.status(400).json({
error:"Curso inválido"
});

}



try{


const preferenceClient =
new Preference(mpClient);



const response =
await preferenceClient.create({

body:{


items:[

{

title:cursos[curso].titulo,

quantity:1,

currency_id:"ARS",

unit_price:cursos[curso].precio

}

],


metadata:{

curso,

nombre,

email

},


back_urls:{

success:
`${FRONT_URL}/success.html`,

failure:
`${FRONT_URL}/error.html`,

pending:
`${FRONT_URL}/pending.html`

},


auto_return:"approved"


}


});



res.json({

id:response.id

});


}

catch(error){

console.error(error);

res.status(500).json({
error:"Error Mercado Pago"
});


}


});









/* =========================
    CREAR PAYPAL ORDER
========================= */


app.post(
"/crear-paypal-order",

async(req,res)=>{


const {
curso,
nombre,
email
}=req.body;



if(!cursos[curso]){

return res.status(400).json({
error:"Curso inválido"
});

}



try{


const order =
await crearOrdenPaypal(
curso,
nombre,
email
);



res.json(order);



}

catch(error){

console.error(error);

res.status(500).json({
error:"Error PayPal"
});


}


});








/* =========================
 VERIFICAR MERCADO PAGO
========================= */


app.get(
"/verificar-pago/:paymentId",

async(req,res)=>{


try{


const paymentClient =
new Payment(mpClient);



const payment =
await paymentClient.get({

id:req.params.paymentId

});



if(payment.status==="approved"){


res.json({

aprobado:true,

curso:
payment.metadata.curso

});


}

else{


res.json({

aprobado:false

});


}


}


catch(error){

console.error(error);

res.status(500).json({

aprobado:false

});


}


});









/* =========================
 VERIFICAR PAYPAL
========================= */


app.get(

"/verificar-paypal/:orderId",

async(req,res)=>{


try{


const resultado =
await verificarOrdenPaypal(
req.params.orderId
);


res.json(resultado);


}

catch(error){


console.error(error);


res.status(500).json({

aprobado:false

});


}


});









app.listen(PORT,()=>{

console.log(
`Servidor corriendo en puerto ${PORT}`
);

});