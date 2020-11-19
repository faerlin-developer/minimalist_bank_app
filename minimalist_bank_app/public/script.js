'use strict';

/* CHANGE THIS WHEN DEPLOYING FOR PRODUCTION */
const URL_PROTOCOL_DOMAIN = 'http://localhost:3000';

class DataController {
  constructor() {
    /* Current user information */
    this.currentUsername = '';
    this.currentToken = '';

    /* Resource URLs */
    this.URL_API = `${URL_PROTOCOL_DOMAIN}/api/v1`;
    this.URL_SIGNUP = `${this.URL_API}/users/signup`;
    this.URL_LOGIN = `${this.URL_API}/users/login`;
    this.URL_TRANSACTIONS = `${this.URL_API}/transactions`;
    this.URL_TRANSFER = `${this.URL_API}/transactions/transfer`;

    /* Socket */
    this.socket = io(URL_PROTOCOL_DOMAIN);
    this.CREATE_TRANSACTION_EVENT = 'createTransaction';
    this.MAKE_TRANSFER_EVENT = 'makeTransfer';
    this.JOIN_FAIL_EVENT = 'joinFail';

    this.joinFailed = false;
  }

  async sendRequest(url, method, body, headers = undefined) {
    if (!headers) {
      headers = {
        'Content-Type': 'application/json',
      };
    }

    let data;
    if (!body) {
      data = { headers, method };
    } else {
      data = { headers, method, body };
    }

    const res = await fetch(url, data);
    const object = await res.json();
    return object;
  }

  getUsernameToken() {
    return {
      username: this.currentUsername,
      token: this.currentToken,
    };
  }

  async getTransactions() {
    const url = `${this.URL_TRANSACTIONS}/${this.currentUsername}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.currentToken}`,
    };

    return await this.sendRequest(url, 'GET', undefined, headers);
  }

  async makeTransfer(usernameTo, amount) {
    const url = `${this.URL_TRANSFER}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.currentToken}`,
    };
    const usernameFrom = this.currentUsername;
    const body = JSON.stringify({ usernameFrom, usernameTo, amount });
    return await this.sendRequest(url, 'POST', body, headers);
  }

  async postTransaction(amount, type, transfer_username = 'none') {
    const url = `${this.URL_TRANSACTIONS}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.currentToken}`,
    };
    const body = JSON.stringify({
      username: this.currentUsername,
      amount,
      type,
      transfer_username,
    });

    return await this.sendRequest(url, 'POST', body, headers);
  }
}

class UIController {
  constructor() {
    this.DOM = {
      labelWelcome: document.querySelector('.welcome'),
      labelDate: document.querySelector('.date'),
      labelBalance: document.querySelector('.balance__value'),
      labelSumIn: document.querySelector('.summary__value--in'),
      labelSumOut: document.querySelector('.summary__value--out'),
      labelUsername: document.querySelector('.username'),
      inputLoginUsername: document.querySelector('.login__input--user'),
      inputLoginPin: document.querySelector('.login__input--pin'),
      inputLoanAmount: document.querySelector('.form__input--loan-amount'),
      inputTransferTo: document.querySelector('.form__input--to'),
      inputTransferAmount: document.querySelector('.form__input--amount'),
      containerApp: document.querySelector('.app'),
      containerMovements: document.querySelector('.movements'),
      btnLogin: document.querySelector('.login__btn'),
      btnSignup: document.querySelector('.create__btn'),
      btnLoan: document.querySelector('.form__btn--loan'),
      btnTransfer: document.querySelector('.form__btn--transfer'),
      divModalBox: document.querySelector('.login-modal'),
      divInfoBox: document.querySelector('.infobox'),
    };

    this.numOfDisplayTransactions = 0;
    this.balance = 0;
    this.sumIn = 0;
    this.sumOut = 0;
  }

  getUsernamePassword() {
    const username = this.DOM.inputLoginUsername.value;
    const password = this.DOM.inputLoginPin.value;

    return { username, password };
  }

  getTransferUsernameAndAmount() {
    const transferUsername = this.DOM.inputTransferTo.value;
    const transferAmount = this.DOM.inputTransferAmount.value;

    return { transferUsername, transferAmount };
  }

  clearUsernamePasswordFields() {
    this.DOM.inputLoginUsername.value = '';
    this.DOM.inputLoginPin.value = '';
    this.DOM.inputLoginPin.blur();
    this.DOM.divModalBox.style.opacity = 0;
  }

  displayUI(username, token, transactions) {
    this.balance = 0;
    this.sumIn = 0;
    this.sumOut = 0;

    this.DOM.labelWelcome.innerHTML = `Welcome!`;
    this.DOM.labelUsername.innerHTML = `${username}`;
    this.DOM.containerApp.style.opacity = 100;
    this.DOM.labelBalance.innerHTML = `${this.balance} CAD`;
    this.DOM.labelSumIn.innerHTML = `${this.sumIn} CAD`;
    this.DOM.labelSumOut.innerHTML = `${this.sumOut} CAD`;

    if (transactions.length === 0) {
      this.DOM.containerMovements.innerHTML = `
        <div class=movements__row__empty>
          <h2>No transactions to display!</h2>
        </div>`;
    } else {
      this.DOM.containerMovements.innerHTML = '';
    }
    uiCtrl.numOfDisplayTransactions = transactions.length;

    let self = this;
    transactions.forEach(function (transaction, index) {
      self.displayTransaction(transaction);
    });
  }

  displayTransaction(transaction) {
    const amount = transaction.amount;

    this.balance += amount;
    this.sumIn += amount > 0 ? amount : 0;
    this.sumOut += amount < 0 ? -1 * amount : 0;

    const type = amount > 0 ? 'deposit' : 'withdrawal';
    let date = new Date(transaction.date);
    date = date.toString().split(/\s+/).slice(0, 4).join(' ');

    let details;
    if (transaction.transfer_username === 'none') {
      details = 'Direct deposit';
    } else if (transaction.type === 'DEPOSIT') {
      details = `Received from ${transaction.transfer_username}`;
    } else {
      details = `Sent to ${transaction.transfer_username}`;
    }

    const html = `
      <div class="movements__row">
          <div class="movements__type movements__type--${type}">${type} </div>
        <div>
        <div class="movements__date">${date}</div>
          <div class="details">${details}</div>
        </div>
        <div class="movements__value">${amount} CAD</div>
      </div>
      `;

    if (this.numOfDisplayTransactions === 0) {
      this.DOM.containerMovements.innerHTML = '';
    }
    this.DOM.containerMovements.insertAdjacentHTML('afterbegin', html);
    this.DOM.labelBalance.innerHTML = `${this.balance} CAD`;
    this.DOM.labelSumIn.innerHTML = `${this.sumIn} CAD`;
    this.DOM.labelSumOut.innerHTML = `${this.sumOut} CAD`;

    this.numOfDisplayTransactions += 1;
  }

  displayModalBox(message) {
    this.DOM.containerApp.style.opacity = 0;
    this.DOM.divModalBox.innerHTML = message;
    this.DOM.labelWelcome.innerHTML = 'Log in to get started';
    this.DOM.divModalBox.style.opacity = 100;
  }

  displayInfoBox(message) {
    this.DOM.divInfoBox.innerHTML = message;
  }

  resetFieldsForLogIn() {
    this.balance = 0;
    this.sumIn = 0;
    this.sumOut = 0;
    this.displayInfoBox('');
    this.DOM.inputLoginPin.value = '';
    this.DOM.inputLoginUsername.value = '';
    this.DOM.inputLoanAmount.value = '';
    this.DOM.inputTransferTo.value = '';
    this.DOM.inputTransferAmount.value = '';
  }
}

/******************
 * App Controller *
 ******************/

const dataCtrl = new DataController();
const uiCtrl = new UIController();

/* Event Listeners */

uiCtrl.DOM.btnSignup.addEventListener('click', async function (event) {
  event.preventDefault();

  const { username, password } = uiCtrl.getUsernamePassword();
  if (!username || !password) {
    uiCtrl.displayModalBox('username or password cannot be empty');
    return;
  }

  const body = JSON.stringify({
    username: username,
    password: password,
    passwordConfirm: password,
  });

  const object = await dataCtrl.sendRequest(dataCtrl.URL_SIGNUP, 'POST', body);
  if (object.status === 'fail') {
    uiCtrl.displayModalBox(
      'Sign up failed. Username may already exists or password is too short.'
    );
    return;
  }

  const oldRoom = dataCtrl.currentUsername;
  const newRoom = object.data.username;
  dataCtrl.currentUsername = object.data.username;
  dataCtrl.currentToken = object.token;

  uiCtrl.resetFieldsForLogIn();
  uiCtrl.clearUsernamePasswordFields();
  uiCtrl.displayUI(dataCtrl.currentUsername, dataCtrl.currentToken, []);

  // This needs to be the final statement
  leaveAndJoinRoom(oldRoom, newRoom, object.token);
});

uiCtrl.DOM.btnLogin.addEventListener('click', async function (event) {
  event.preventDefault();

  const { username, password } = uiCtrl.getUsernamePassword();
  if (!username || !password) {
    uiCtrl.displayModalBox('username or password cannot be empty');
    return;
  }

  const body = JSON.stringify({
    username: username,
    password: password,
    passwordConfirm: password,
  });

  const object = await dataCtrl.sendRequest(dataCtrl.URL_LOGIN, 'POST', body);
  if (object.status === 'fail') {
    uiCtrl.displayModalBox(object.message);
    return;
  }

  const oldRoom = dataCtrl.currentUsername;
  const newRoom = object.data.username;
  dataCtrl.currentUsername = object.data.username;
  dataCtrl.currentToken = object.token;

  const transactions = await dataCtrl.getTransactions();
  if (transactions.status === 'fail') {
    uiCtrl.displayModalBox(`Failed to get transactions`);
    return;
  }

  uiCtrl.clearUsernamePasswordFields();
  uiCtrl.resetFieldsForLogIn();
  uiCtrl.displayUI(
    dataCtrl.currentUsername,
    dataCtrl.currentToken,
    transactions.data.transactions
  );

  // This needs to be the final statement
  leaveAndJoinRoom(oldRoom, newRoom, object.token);
});

uiCtrl.DOM.btnLoan.addEventListener('click', async function (event) {
  event.preventDefault();

  const deposit = uiCtrl.DOM.inputLoanAmount.value;
  if (!deposit || deposit <= 0) {
    uiCtrl.displayInfoBox('Deposit amount must be greater than 0');
    return;
  }

  const date = new Date();
  const type = 'DEPOSIT';
  const object = await dataCtrl.postTransaction(deposit, type);
  if (object.status === 'fail') {
    uiCtrl.displayInfoBox('Failed to deposit');
    return;
  }
});

uiCtrl.DOM.btnTransfer.addEventListener('click', async function (event) {
  event.preventDefault();

  const {
    transferUsername,
    transferAmount,
  } = uiCtrl.getTransferUsernameAndAmount();
  if (!transferUsername || !transferAmount) {
    uiCtrl.displayInfoBox('Transfer To or Amount cannot be empty');
    return;
  }

  if (transferAmount <= 0) {
    uiCtrl.displayInfoBox('Transfer amount must be greater than 0');
    return;
  }

  const object = await dataCtrl.makeTransfer(transferUsername, transferAmount);
  if (object.status === 'fail') {
    uiCtrl.displayInfoBox(object.message);
    return;
  }
});

dataCtrl.socket.on(dataCtrl.CREATE_TRANSACTION_EVENT, function (transaction) {
  uiCtrl.displayTransaction(transaction);
});

dataCtrl.socket.on(dataCtrl.MAKE_TRANSFER_EVENT, function (transaction) {
  uiCtrl.displayTransaction(transaction);
});

dataCtrl.socket.on(dataCtrl.JOIN_FAIL_EVENT, function (message) {
  dataCtrl.joinFailed = true;
  uiCtrl.displayModalBox('Log in failed. Failed to join socket.');
});

function leaveAndJoinRoom(oldRoom, newRoom, token) {
  if (oldRoom !== '') {
    dataCtrl.socket.emit('leave', oldRoom);
  }
  dataCtrl.socket.emit('join', {
    room: newRoom,
    token: token,
  });
}
