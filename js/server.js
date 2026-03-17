const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Autorise ton frontend (Live Server, localhost, etc.)
app.use(cors());

// Permet de lire le JSON du body
app.use(express.json());

// Route principale pour parler au simulateur UQTR
app.post("/api/decoder", async (req, res) => {
  try {
    const { id, address, action } = req.body;

    // Validation simple
    if (!id || !address || !action) {
      return res.status(400).json({
        response: "Error",
        message: "Paramètres manquants (id, address, action)"
      });
    }

    // Appel vers l'API UQTR
    const apiResponse = await fetch("https://wflageol-uqtr.net/decoder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ id, address, action })
    });

    const text = await apiResponse.text();

    // Renvoie la réponse telle quelle au frontend
    res.status(apiResponse.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);

  } catch (error) {
    console.error("Erreur serveur:", error);

    res.status(500).json({
      response: "Error",
      message: error.message
    });
  }
});

// (OPTIONNEL) Route pour la page /list
app.get("/api/list/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const response = await fetch(
      `https://wflageol-uqtr.net/list?id=${encodeURIComponent(id)}`
    );

    const html = await response.text();

    res.status(response.status).send(html);

  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Backend lancé sur http://localhost:${PORT}`);
});