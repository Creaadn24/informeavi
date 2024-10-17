const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://adntraining:cyZ7m9wa6ZGuNUOL@cluster0.ihjdqt8.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function calcularProgresoTotal(entrenamientos) {
  // ... (mantener la misma lógica de cálculo que teníamos antes)
}

async function actualizarProgresoUsuarios() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const database = client.db("Avicampo");
    const usuariosCollection = database.collection("usuario");
    const entrenamientosCollection = database.collection("puntaje");

    const usuarios = await usuariosCollection.find({}).toArray();

    for (const usuario of usuarios) {
      const entrenamientos = await entrenamientosCollection
        .find({ userID: usuario._id })
        .toArray();
      const progresoTotal = await calcularProgresoTotal(entrenamientos);

      await usuariosCollection.updateOne(
        { _id: usuario._id },
        { $set: { progresoTotal: progresoTotal } }
      );
    }

    console.log("Progreso de usuarios actualizado exitosamente");
  } catch (error) {
    console.error("Error al actualizar el progreso de los usuarios:", error);
  } finally {
    await client.close();
  }
}

actualizarProgresoUsuarios();