let shoppingList = JSON.parse(localStorage.getItem("shoppingList")) || [];
let boughtList = JSON.parse(localStorage.getItem("boughtList")) || [];

let recognition = null;
let listening = false;

function save() {
  localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  localStorage.setItem("boughtList", JSON.stringify(boughtList));
}

function addItem(nameFromVoice = null) {
  const nameInput = document.getElementById("itemName");
  const qtyInput = document.getElementById("itemQty");

  const name = nameFromVoice || nameInput.value.trim();
  const qty = parseInt(qtyInput.value) || 1;

  if (!name) return;

  shoppingList.push({
    name,
    qty
  });

  nameInput.value = "";
  qtyInput.value = 1;

  save();
  render();
}

function editItem(index) {
  const newName = prompt("Editar item:", shoppingList[index].name);
  const newQty = prompt("Editar quantidade:", shoppingList[index].qty);

  const qtyNumber = parseInt(newQty);

  if (newName && qtyNumber > 0) {
    shoppingList[index] = {
      name: newName.trim(),
      qty: qtyNumber
    };
    save();
    render();
  }
}

function deleteItem(index) {
  if (confirm("Excluir item da lista?")) {
    shoppingList.splice(index, 1);
    save();
    render();
  }
}

function buyItem(index) {
  const priceInput = document.getElementById(`price-${index}`);
  const unitPrice = parseFloat(priceInput.value);

  if (!unitPrice) {
    alert("Informe o preço unitário");
    return;
  }

  const item = shoppingList[index];

  boughtList.push({
    name: item.name,
    qty: item.qty,
    unitPrice,
    total: item.qty * unitPrice
  });

  shoppingList.splice(index, 1);
  save();
  render();
}

function editBoughtItem(index) {
  const item = boughtList[index];

  const newName = prompt("Editar nome:", item.name);
  const newQty = prompt("Editar quantidade:", item.qty);
  const newPrice = prompt("Editar preço unitário:", item.unitPrice);

  const qtyNumber = parseInt(newQty);
  const priceNumber = parseFloat(newPrice);

  if (!newName || qtyNumber <= 0 || !priceNumber) return;

  boughtList[index] = {
    name: newName.trim(),
    qty: qtyNumber,
    unitPrice: priceNumber,
    total: qtyNumber * priceNumber
  };

  save();
  render();
}

function deleteBoughtItem(index) {
  if (confirm("Excluir item comprado?")) {
    boughtList.splice(index, 1);
    save();
    render();
  }
}

function clearAll() {
  if (!confirm("Deseja limpar TODA a lista?")) return;
  shoppingList = [];
  boughtList = [];
  save();
  render();
}

/* ===== VOZ CONTÍNUA ===== */
function toggleVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Reconhecimento de voz não suportado");
    return;
  }

  if (!recognition) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = function(event) {
      const lastResult = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .replace("comprar", "")
        .trim();

      const item =
        lastResult.charAt(0).toUpperCase() + lastResult.slice(1);

      addItem(item);
    };

    recognition.onerror = function() {
      stopVoice();
    };
  }

  listening ? stopVoice() : startVoice();
}

function startVoice() {
  recognition.start();
  listening = true;
  document.getElementById("micBtn").innerText = "🛑";
}

function stopVoice() {
  recognition.stop();
  listening = false;
  document.getElementById("micBtn").innerText = "🎤";
}

function render() {
  const shoppingUl = document.getElementById("shoppingList");
  const boughtUl = document.getElementById("boughtList");

  shoppingUl.innerHTML = "";
  boughtUl.innerHTML = "";

  shoppingList.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-text">${item.name} (x${item.qty})</span>
      <input type="number" id="price-${index}" placeholder="R$ unit">
      <button class="btn-small btn-buy" onclick="buyItem(${index})">✔</button>
      <button class="btn-small btn-edit" onclick="editItem(${index})">✏️</button>
      <button class="btn-small btn-delete" onclick="deleteItem(${index})">❌</button>
    `;
    shoppingUl.appendChild(li);
  });

  let total = 0;
  boughtList.forEach((item, index) => {
    total += item.total;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-text">
        ${item.name} (x${item.qty}) – R$ ${item.total.toFixed(2)}
      </span>
      <button class="btn-small btn-edit" onclick="editBoughtItem(${index})">✏️</button>
      <button class="btn-small btn-delete" onclick="deleteBoughtItem(${index})">❌</button>
    `;
    boughtUl.appendChild(li);
  });

  document.getElementById("total").innerText = total.toFixed(2);

  const budget = parseFloat(document.getElementById("budget").value) || 0;
  document.getElementById("balance").innerText = (budget - total).toFixed(2);
}

document.getElementById("budget").addEventListener("change", render);
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

