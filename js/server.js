const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Lecture des utilisateurs depuis le fichier JSON
const USERS_PATH = path.resolve(__dirname, "..", "data", "users.json");
const CHAINES_PATH = path.resolve(__dirname, "..", "data", "chaines.json");

function getUsers() {
  const data = fs.readFileSync(USERS_PATH, "utf-8");
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// Lecture / écriture des chaînes partagées
function getChaines() {
  try {
    if (!fs.existsSync(CHAINES_PATH)) {
      return {};
    }
    const data = fs.readFileSync(CHAINES_PATH, "utf-8");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveChaines(chaines) {
  fs.writeFileSync(CHAINES_PATH, JSON.stringify(chaines, null, 2));
}

// check-email
app.get("/api/check-email", (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({
        message: "Email requis"
      });
    }
    const users = getUsers();
    const exists = users.some(u => u.email === email);
    res.json({ exists });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
});


// LOGIN
app.post("/api/login", (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({
        message: "Email et mot de passe requis"
      });
    }

    const users = getUsers();

    const userData = users.find(
      (u) => u.email === email && u.motDePasse === motDePasse
    );

    if (!userData) {
      return res.status(401).json({
        message: "Login invalide"
      });
    }

    const user = {
      id: userData.id,
      nom: userData.nom,
      email: userData.email,
      role: userData.role,
      codePermanent: userData.codePermanent || null,
      decodeurs: userData.decodeurs || [],
      chaines: userData.Chaines || userData.chaines || []
    };

    res.json({
      message: "Connexion réussie",
      user
    });

  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
});

// SIGNUP
app.post("/api/signup", (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({
        message: "Champs manquants"
      });
    }

  const users = getUsers();

  const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return res.status(400).json({
        message: "Email déjà utilisé"
      });
    }

    const newUser = {
      id: users.length + 1,
      nom,
      email,
      motDePasse,
      role: "user"
    };

    users.push(newUser);

    saveUsers(users);

    res.json({
      message: "Compte créé",
      user: {
        id: newUser.id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
});

// GET USERS (TEST)
app.get("/api/users", (req, res) => {
  try {
    const users = getUsers();

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
});

// =============================
// API chaînes partagées
// Structure: { "codePermanent": { "127.0.10.1": ["RDS", "TVA"] } }
// =============================

// Récupérer les chaînes pour un utilisateur et une adresse donnée
app.get("/api/chaines", (req, res) => {
  try {
    const { id, address } = req.query;
    if (!id || !address) {
      return res.status(400).json({ message: "id et address requis" });
    }
    const all = getChaines();
    const userChaines = all[id] && Array.isArray(all[id][address]) ? all[id][address] : [];
    res.json({ chaines: userChaines });
  } catch (error) {
    console.error("Erreur /api/chaines (GET)", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Mettre à jour les chaînes pour un utilisateur et une adresse donnée
app.post("/api/chaines", (req, res) => {
  try {
    const { id, address, chaines } = req.body;
    if (!id || !address || !Array.isArray(chaines)) {
      return res.status(400).json({ message: "id, address et chaines requis" });
    }
    const all = getChaines();
    if (!all[id] || typeof all[id] !== "object") {
      all[id] = {};
    }
    all[id][address] = chaines;
    saveChaines(all);
    res.json({ message: "OK", chaines: all[id][address] });
  } catch (error) {
    console.error("Erreur /api/chaines (POST)", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DECODEUR
app.post("/api/decoder", async (req, res) => {
  try {
    const { id, address, action } = req.body;

    if (!id || !address || !action) {
      return res.status(400).json({
        message: "Champs manquants"
      });
    }

    // Appel vers API UQTR
    const response = await fetch("https://wflageol-uqtr.net/decoder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, address, action })
    });

    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error("Erreur decodeur:", error);
    res.status(500).json({
      message: "Erreur serveur decodeur"
    });
  }
});

// GET CLIENTS
app.get("/api/clients", async (req, res) => {
	try {
		const users = getUsers();
		const clients = users.filter(u => u.role === "user").map(u => ({
			id: u.id,
			nom: u.nom,
			email: u.email,
			decodeurs: u.decodeurs || []
		}));

		res.json(clients);
	} catch (error) {
		res.status(500).json({
			message: "Erreur serveur"
		});
	}
});


// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable"
  });
});


// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});