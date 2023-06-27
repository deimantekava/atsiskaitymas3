/* eslint-disable no-undef */
const token = Cookies.get('token');

if (!token) {
  window.location.replace('./login.html');
}

const API_BASE = 'http://localhost:8080';

const allGroups = document.getElementById('groups');
const groupAddForm = document.getElementById('addgroup');

const getAllGroups = async () => {
  try {
    const response = await fetch(`${API_BASE}/groups`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    });
    const data = await response.json();
    renderGroups(data);
  } catch (err) {
    console.log(err);
  }
};

const addGroups = async (group) => {
  try {
    const response = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

const renderGroups = (groups) => {
  groups.forEach((group) => {
    console.log(group);
    const container = document.createElement('div');
    container.classList.add('group');
    const groupId = document.createElement('h4');
    const groupName = document.createElement('p');

    groupId.textContent = `ID: ${group.id}`;
    groupName.textContent = group.name;

    container.append(groupId, groupName);
    allGroups.append(container);
  });
};

getAllGroups();

groupAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = {
    name: event.target.querySelector('input').value,
  };
  const groupResponse = await addGroups(data);
});
