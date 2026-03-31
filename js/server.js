const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Lecture des utilisateurs depuis le fichier JSON
const USERS_PATH = path.resolve(__dirname, '..', 'data', 'users.json');

function getUsers() {
  const data = fs.readFileSync(USERS_PATH, 'utf-8');
  return JSON.parse(data);
}

// check-email
app.get('/api/check-email', (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({
        message: 'Email requis',
      });
    }
    const users = getUsers();
    const exists = users.some((u) => u.email === email);
    res.json({ exists });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// LOGIN
app.post('/api/login', (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({
        message: 'Email et mot de passe requis',
      });
    }

    const users = getUsers();

    const userData = users.find((u) => u.email === email && u.motDePasse === motDePasse);

    if (!userData) {
      return res.status(401).json({
        message: 'Login invalide',
      });
    }

    const user = {
      id: userData.id,
      nom: userData.nom,
      email: userData.email,
      role: userData.role,
      codePermanent: userData.codePermanent,
      decodeurs: userData.decodeurs || [],
      chaines: userData.Chaines || userData.chaines || [],
    };

    res.json({
      message: 'Connexion réussie',
      user,
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// SIGNUP
app.post('/api/signup', (req, res) => {
  try {
    const { nom, email, motDePasse, codePermanent } = req.body;

    if (!nom || !email || !motDePasse || !codePermanent) {
      return res.status(400).json({
        message: 'Champs manquants',
      });
    }

    const users = getUsers();

    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res.status(400).json({
        message: 'Email déjà utilisé',
      });
    }

    const newUser = {
      id: users.length + 1,
      nom,
      email,
      motDePasse,
      codePermanent,
      role: 'user',
    };

    users.push(newUser);

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    res.json({
      message: 'Compte créé',
      user: {
        id: newUser.id,
        nom: newUser.nom,
        email: newUser.email,
        codePermanent: newUser.codePermanent,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// GET USERS (TEST)
app.get('/api/users', (req, res) => {
  try {
    const users = getUsers();

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// DECODEUR
app.post('/api/decoder', async (req, res) => {
  try {
    const { id, address, action } = req.body;

    if (!id || !address || !action) {
      return res.status(400).json({
        message: 'Champs manquants',
      });
    }

    // Appel vers API UQTR
    const response = await fetch('https://wflageol-uqtr.net/decoder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, address, action }),
    });

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Erreur decodeur:', error);
    res.status(500).json({
      message: 'Erreur serveur decodeur',
    });
  }
});

// GET CLIENTS
app.get('/api/clients', async (req, res) => {
  try {
    const users = getUsers();
    const clients = users
      .filter((u) => u.role === 'user')
      .map((u) => ({
        id: u.id,
        nom: u.nom,
        email: u.email,
        codePermanent: u.codePermanent,
        decodeurs: u.decodeurs || [],
      }));

    res.json(clients);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// DELETE A USER
app.delete('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    let users = getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    users.splice(userIndex, 1);
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({
      message: 'Utilisateur supprimé',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    message: 'Route introuvable',
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
