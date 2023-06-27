const form = document.querySelector('form');

const API_BASE = 'http://localhost:8080';

const onRegisterUser = async (payload) => {
  try {
    const response = await fetch('http://localhost:8080/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (err) {
    return console.log(err);
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    full_name: event.target.name.value,
    email: event.target.email.value,
    password: event.target.password.value,
  };

  const userData = await onRegisterUser(payload);
  console.log(userData);
  if (userData.token) {
    Cookies.set('token', userData.token);
    window.location.replace('./groups.html');
  }
});
