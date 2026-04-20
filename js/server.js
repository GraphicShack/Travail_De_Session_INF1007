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
        role: newUser.role,
      },
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

// GET A CLIENT
app.get('/api/client/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = getUsers();
    const user = users.find((u) => u.id === userId && u.role === 'user');

    if (!user) {
      return res.status(404).json({
        message: 'Client non trouvé',
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

// UPDATE A CLIENT
app.post('/api/client/update', (req, res) => {
  try {
    const { userId, nom, email, codePermanent } = req.body;

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        message: 'Client non trouvé',
      });
    }

    // Mise à jour des informations du client
    users[userIndex].nom = nom;
    users[userIndex].email = email;
    users[userIndex].codePermanent = codePermanent;

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    res.json({
      message: 'Client modifié avec succès',
      user: users[userIndex],
    });
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

app.post('/api/users/assign-decoder', (req, res) => {
  const { id, address } = req.body;

  try {
    let users = getUsers();

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const isAlreadyAssigned = users.some((u) => u.decodeurs && u.decodeurs.includes(address));
    if (isAlreadyAssigned) {
      return res
        .status(400)
        .json({ message: 'Ce décodeur est déjà assigné à un autre utilisateur' });
    }

    if (!users[userIndex].decodeurs) {
      users[userIndex].decodeurs = [];
    }
    users[userIndex].decodeurs.push({ adresse: address, chaine: [] });

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    res.status(200).json({ message: 'Décodeur assigné avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de l'assignation" });
  }
});

app.post('/api/users/unassign-decoder', (req, res) => {
  const { id, address } = req.body;

  try {
    let users = getUsers();

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (users[userIndex].decodeurs) {
      users[userIndex].decodeurs = users[userIndex].decodeurs.filter((a) => a !== address);
    }

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    res.status(200).json({ message: 'Décodeur dissocié avec succès !' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la dissociation.' });
  }
});

// Assigner chaine
app.post('/api/decoder/assign-channel', (req, res) => {
  const { codePermanent, address, chaine } = req.body;

  if (!codePermanent || !address || !chaine) {
    return res.status(400).json({
      message: 'Champs manquants',
    });
  }

  try {
    let users = getUsers();
    const userIndex = users.findIndex((u) => u.codePermanent === codePermanent);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const decodeur = users[userIndex].decodeurs.find((d) => d.address === address);

    if (!decodeur) {
      return res.status(403).json({ message: "Ce decodeur n'appartient pas à ce client" });
    }

    if (!decodeur.chaines.includes(chaine)) {
      decodeur.chaines.push(chaine);
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      return res.status(200).json({ message: 'Chaîne ajoutée avec succès' });
    } else {
      return res.status(400).json({ message: 'Cette chaîne est déjà sur ce décodeur' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/decoder/remove-channel', (req, res) => {
  const { codePermanent, address, chaine } = req.body;

  try {
    let users = getUsers();
    const userIndex = users.findIndex((u) => u.codePermanent === codePermanent);

    if (userIndex === -1) return res.status(404).json({ message: 'Client introuvable' });

    const decodeur = users[userIndex].decodeurs.find((d) => d.adresse === address);

    if (!decodeur)
      return res.status(403).json({ message: "Ce décodeur n'appartient pas à ce client" });

    const indexChaine = decodeur.chaines.indexOf(chaine);
    if (indexChaine !== -1) {
      decodeur.chaines.splice(indexChaine, 1);
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      return res.status(200).json({ message: 'Chaîne retirée avec succès' });
    } else {
      return res.status(400).json({ message: "Cette chaîne n'est pas sur ce décodeur" });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
