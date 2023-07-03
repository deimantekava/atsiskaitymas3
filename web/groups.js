/* eslint-disable no-undef */
const token = Cookies.get('token');

if (!token) {
  window.location.replace('./login.html');
}

const API_BASE = 'http://localhost:8080';

const allGroups = document.getElementById('allgroups');
const myGroups = document.getElementById('groups');
const groupAddForm = document.getElementById('addgroup');
const selectYouGroup = document.getElementById('selectgroup');
const clickbutton = document.getElementById('test');

const getAllGroups = async () => {
  try {
    const response = await fetch(`${API_BASE}/groups`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    });
    const data = await response.json();
    renderAllGroups(data);
  } catch (err) {
    console.log(err);
  }
};

const getbills = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/bills/${group_id}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    });
    const data = await response.json(id);
  } catch (err) {
    console.log(err);
  }
};

const getUserGroups = async () => {
  try {
    const response = await fetch(`${API_BASE}/accounts`, {
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

const selectGroup = async (account) => {
  try {
    const response = await fetch(`http://localhost:8080/accounts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

const renderGroups = (groups) => {
  groups.forEach((group) => {
    const container = document.createElement('button');
    container.classList.add('group');
    const groupId = document.createElement('h4');
    const groupName = document.createElement('p');

    groupId.textContent = group.id;
    groupName.textContent = group.name;

    myGroups.addEventListener('click', async () => {
      const id = groupId.value;
      localStorage.setItem('selectedGroup', id);
      window.location.replace(`./bills.html`);
    });

    container.append(groupId, groupName);
    myGroups.append(container);
  });
};

getUserGroups();
getbills();

const renderAllGroups = (groups) => {
  groups.forEach((group) => {
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
  await addGroups(data);
  window.location.reload();
});

selectYouGroup.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = {
    group_id: event.target.querySelector('input').value,
  };
  await selectGroup(data);
  window.location.reload();
});

selectGroup();
