/* eslint-disable no-undef */
const token = Cookies.get('token');

if (!token) {
  window.location.replace('./login.html');
}

const API_BASE = 'http://localhost:8080';

const getBillById = async () => {
  try {
    const response = await fetch(`${API_BASE}/bills/${group_id}`, {
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

const postBills = async () => {
  try {
    const response = await fetch(`${API_BASE}/bills`, {
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
