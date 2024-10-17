const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = 3000;

const uri =
  "mongodb+srv://adntraining:cyZ7m9wa6ZGuNUOL@cluster0.ihjdqt8.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/api/usuarios", async (req, res) => {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const database = client.db("Avicampo");
    const usuariosCollection = database.collection("usuario");
    const puntajeCollection = database.collection("puntaje");

    const usuarios = await usuariosCollection.find({}).toArray();

    const usuariosConProgreso = await Promise.all(
      usuarios.map(async (usuario) => {
        const entrenamientos = await puntajeCollection
          .find({ userID: usuario._id })
          .toArray();

        let contenidosVistos = 0;
        let practicasCompletadas = 0;
        let practicaFinalCompletada = 0;

        entrenamientos.forEach((entrenamiento) => {
          if (entrenamiento.tipo === "video" && entrenamiento.valor >= 50) {
            contenidosVistos++;
          } else if (
            entrenamiento.tipo === "practica" &&
            entrenamiento.valor >= 50
          ) {
            practicasCompletadas++;
          } else if (
            entrenamiento.tipo === "practica_final" &&
            entrenamiento.valor >= 50
          ) {
            practicaFinalCompletada = 1;
          }
        });

        const porcentajeVideos = (contenidosVistos / 18) * 20;
        const porcentajePracticas = (practicasCompletadas / 3) * 50;
        const porcentajePracticaFinal = practicaFinalCompletada * 30;
        const progresoTotal =
          porcentajeVideos + porcentajePracticas + porcentajePracticaFinal;

        return {
          ...usuario,
          progresoTotal,
        };
      })
    );

    console.log("Usuarios encontrados:", usuariosConProgreso);

    res.json(usuariosConProgreso);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  } finally {
    await client.close();
  }
});

app.get("/api/usuarios/:regional", async (req, res) => {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const database = client.db("Avicampo");
    const collection = database.collection("usuario");

    const regional = req.params.regional;

    const usuarios = await collection
      .find(
        { regional: regional },
        {
          projection: {
            user: 1,
            fullName: 1,
            regional: 1,
            celphone: 1,
            score: 1,
            _id: 1,
          },
        }
      )
      .sort({ score: -1 })
      .toArray();

    console.log("Usuarios encontrados:", usuarios);

    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  } finally {
    await client.close();
  }
});

app.get("/api/usuario/:id", async (req, res) => {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const database = client.db("Avicampo");
    const usuariosCollection = database.collection("usuario");
    const entrenamientosCollection = database.collection("puntaje");

    const userId = new ObjectId(req.params.id);

    const usuario = await usuariosCollection.findOne({ _id: userId });
    const entrenamientos = await entrenamientosCollection
      .find({ userID: userId })
      .toArray();

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuarioConEntrenamientos = {
      ...usuario,
      entrenamientos: entrenamientos,
    };

    res.json(usuarioConEntrenamientos);
  } catch (error) {
    console.error("Error al obtener detalles del usuario:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  } finally {
    await client.close();
  }
});

app.get("/api/regional/:nombre", async (req, res) => {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const database = client.db("Avicampo");
    const usuariosCollection = database.collection("usuario");
    const entrenamientosCollection = database.collection("puntaje");

    const regional = req.params.nombre;

    const usuarios = await usuariosCollection
      .find({ regional: regional })
      .toArray();
    const userIds = usuarios.map((u) => u._id);

    const entrenamientos = await entrenamientosCollection
      .find({ userID: { $in: userIds } })
      .toArray();

    // Aquí realizamos los cálculos para obtener los datos agregados
    const totalVideos = 15;
    const totalPracticas = 3;
    const totalPracticaFinal = 1;

    const videosVistos = new Set();
    const practicasCompletadas = new Set();
    let practicaFinalCompletada = 0;

    entrenamientos.forEach((e) => {
      if (e.tipo === "video") videosVistos.add(e.id);
      if (e.tipo === "practica") practicasCompletadas.add(e.id);
      if (e.tipo === "practica_final") practicaFinalCompletada = 1;
    });

    const datosRegional = {
      videosVistos: videosVistos.size,
      totalVideos,
      practicasCompletadas: practicasCompletadas.size,
      totalPracticas,
      practicaFinalCompletada,
      totalPracticaFinal,
    };

    res.json(datosRegional);
  } catch (error) {
    console.error("Error al obtener datos de la regional:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  } finally {
    await client.close();
  }
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});