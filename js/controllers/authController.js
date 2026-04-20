import {
  signin,
  signup,
  validateEmail,
  validateEmailAlreadyExists,
  validatePassword,
} from '../services/userService.js';

// Fonctions de gestion de l'utilisateur dans le localStorage
export function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

// Fonction pour stocker l'utilisateur dans le localStorage
export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Fonction de déconnexion
export function logout() {
  localStorage.removeItem('user');
  window.location.href = '/pages/signin.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const user = getUser();
  const path = window.location.pathname;

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée, rediriger vers signin
  if (!user && !path.endsWith('/signin.html') && !path.endsWith('/signup.html')) {
    alert('Accès refusé : veuillez vous connecter.');
    window.location.href = '/pages/signin.html';
    // Si l'utilisateur est connecté et essaie d'accéder à signin ou signup, rediriger vers dashboard
  } else if (user && (path.endsWith('/signin.html') || path.endsWith('/signup.html'))) {
    window.location.href = '/pages/dashboard.html';
    // Si l'utilisateur est connecté mais n'est pas admin et essaie d'accéder à admin.html, rediriger vers signin
  } else if (user && path.endsWith('/admin.html') && user.role !== 'admin') {
    alert('Accès refusé : page réservée aux administrateurs.');
    window.location.href = '/pages/signin.html';
  } else if (user && path.endsWith('/client.html') && user.role !== 'admin') {
    alert('Accès refusé : page réservée aux administrateurs.');
    window.location.href = '/pages/signin.html';
    // Si l'utilisateur est connecté mais n'est pas admin et essaie d'accéder à createClient.html, rediriger vers signin
  } else if (user && path.endsWith('/createClient.html') && user.role !== 'admin') {
    alert('Accès refusé : page réservée aux administrateurs.');
    window.location.href = '/pages/signin.html';
  }

  const btnSignin = document.getElementById('btn-signin');
  const messageSignin = document.getElementById('login-message');

  if (btnSignin) {
    btnSignin.addEventListener('click', async (e) => {
      e.preventDefault();

      if (messageSignin) {
        messageSignin.textContent = '';
        messageSignin.className = '';
      }
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('motdepasse').value.trim();
      if (!email || !password) {
        if (messageSignin) {
          messageSignin.textContent = 'Veuillez remplir tous les champs.';
          messageSignin.className = 'error';
        }
        return;
      }
      try {
        const user = await signin(email, password);

        setUser(user);
        window.location.href = '/pages/dashboard.html';
      } catch (error) {
        console.error("L'ERREUR RÉELLE EST :", error); // Regarde ceci dans la console (F12)
        alert('Erreur détectée : ' + error.message);
        /*if (messageSignin) {
          messageSignin.textContent = error.message;
          messageSignin.className = 'error';
        } else {
          alert(error.message);
        }*/
      }
    });
  }

  const btnSignup = document.getElementById('btn-signup');
  const messageSignup = document.getElementById('signup-message');

  if (btnSignup) {
    btnSignup.addEventListener('click', async (e) => {
      e.preventDefault();

      const nom = document.getElementById('nom')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const codePermanent = document.getElementById('code-permanent')?.value.trim();
      const motDePasse = document.getElementById('motdepasse')?.value.trim();
      const confirmPwd = document.getElementById('confirm-motdepasse')?.value.trim();

      // Validation des champs
      if (!nom || !email || !motDePasse || !confirmPwd) {
        if (messageSignup) messageSignup.textContent = 'Veuillez remplir tous les champs.';
        messageSignup.className = 'error';
        return;
      }

      // Validation de l'email
      if (!validateEmail(email)) {
        if (messageSignup) messageSignup.textContent = 'Email invalide';
        messageSignup.className = 'error';
        return;
      }

      // Vérification si l'email existe déjà
      if (await validateEmailAlreadyExists(email)) {
        if (messageSignup) messageSignup.textContent = 'Email déjà utilisé';
        messageSignup.className = 'error';
        return;
      }

      // Validation du mot de passe
      if (!validatePassword(motDePasse)) {
        if (messageSignup)
          messageSignup.textContent =
            'Mot de passe doit avoir au moins 8 caractères et une majuscule';
        messageSignup.className = 'error';
        return;
      }

      // Validation du code permanent (format AAAA00000000)
      if (!/^[A-Z]{4}\d{8}$/.test(codePermanent)) {
        if (messageSignup)
          messageSignup.textContent = 'Code permanent invalide (format AAAA00000000)';
        messageSignup.className = 'error';
        return;
      }

      // Validation du mot de passe
      if (!validatePassword(motDePasse)) {
        if (messageSignup)
          messageSignup.textContent =
            'Mot de passe doit avoir au moins 8 caractères et une majuscule';
        messageSignup.className = 'error';
        return;
      }

      // Validation de la confirmation du mot de passe
      if (motDePasse !== confirmPwd) {
        if (messageSignup) messageSignup.textContent = 'Les mots de passe ne correspondent pas';
        messageSignup.className = 'error';
        return;
      }

      try {
        await signup(nom, email, codePermanent, motDePasse);

        alert('Inscription réussie ! Vous allez être redirigé.');
        window.location.href = '/pages/signin.html';
      } catch (error) {
        if (messageSignup) {
          messageSignup.textContent = error.message;
          messageSignup.className = 'error';
        } else {
          alert(error.message);
        }
      }
    });
  }
});
