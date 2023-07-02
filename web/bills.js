/* eslint-disable no-undef */
const token = Cookies.get('token');

if (!token) {
  window.location.replace('./login.html');
}

const API_BASE = 'http://localhost:8080';

const addBills = document.getElementById('addbills');
const BillOutput = document.getElementById('output');

const getBillById = async () => {
  try {
    const response = await fetch(`${API_BASE}/bills/${group_id}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    });
    const data = await response.json();
    renderAllGroupsById(data);
  } catch (err) {
    console.log(err);
  }
};

const getBill = async () => {
  try {
    const response = await fetch(`${API_BASE}/bills`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
    });
    const data = await response.json();
    renderAllBills(data);
  } catch (err) {
    console.log(err);
  }
};

const postBills = async (bill) => {
  try {
    const response = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Cookies.get('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bill),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

addBills.addEventListener('submit', async (event) => {
  event.preventDefault();
  const amountInput = event.target.querySelector('[name=billamount]');
  const descriptionInput = event.target.querySelector('[name=billdescription]');
  const groupIdInput = event.target.querySelector('[name=groupid]');

  const data = {
    amount: amountInput.value,
    description: descriptionInput.value,
    group_id: groupIdInput.value,
  };
  await postBills(data);
});

const renderAllBills = (bills) => {
  bills.forEach((bill) => {
    const container = document.createElement('div');
    const groupId = document.createElement('h4');
    const billAmount = document.createElement('p');
    const billDescription = document.createElement('p');

    billAmount.textContent = `Amount: ${bill.amount}`;
    billDescription.textContent = `Description: ${bill.description}`;
    groupId.textContent = `Group ID: ${bill.group_id}`;

    container.append(billAmount, billDescription, groupId);
    BillOutput.append(container);
  });
};

getBill();
