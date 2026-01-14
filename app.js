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

  shoppingList.push({ name, qty });
  nameInput.value = "";
  qtyInput.value = 1;

  save();
  render();
}

function editItem(index) {
  const newName = prompt("Editar item:", shoppingList[index].name);
  const newQty = prompt("Editar quantidade:", shoppingList[index].qty);
  const qty = parseInt(newQty);

  if (newName && qty > 0) {
    shoppingList[index] = { name: newName.trim(), qty };
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
  const price = parseFloat(document.getElementById(`price-${index}`).value);
  if (!price) return alert("Informe o preço unitário");

  const item = shoppingList[index];
  boughtList.push({
    name: item.name,
    qty: item.qty,
    unitPrice: price,
    total: item.qty * price
  });

  shoppingList.splice(index, 1);
  save();
  render();
}

function editBoughtItem(index) {
  const item = boughtList[index];
  const newName = prompt("Editar nome:", item.name);
  const newQty = parseInt(prompt("Editar quantidade:", item.qty));
  const newPrice = parseFloat(prompt("Editar preço unitário:", item.unitPrice));

  if (newName && newQty > 0 && newPrice) {
    boughtList[index] = {
      name: newName.trim(),
      qty: newQty,
      unitPrice: newPrice,
      total: newQty * newPrice
    };
    save();
    render();
  }
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
    alert("Voz não suportada neste navegador");
    return;
  }

  if (!recognition) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;

    recognition.onresult = e => {
      const text = e.results[e.results.length - 1][0].transcript
        .toLowerCase()
        .replace("comprar", "")
        .trim();

      addItem(text.charAt(0).toUpperCase() + text.slice(1));
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

/* ===== COMPARTILHAMENTO ===== */
function shareText() {
  let text = "🛒 Lista de Compras\n";
  shoppingList.forEach(i => text += `- ${i.name} (${i.qty})\n`);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

function shareLink() {
  const data = btoa(JSON.stringify(shoppingList));
  const base = window.location.origin + window.location.pathname;
  const link = `${base}?lista=${data}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank");
}

function loadFromLink() {
  const params = new URLSearchParams(window.location.search);
  const lista = params.get("lista");
  if (lista) {
    shoppingList = JSON.parse(atob(lista));
    save();
    render();
    alert("Lista importada com sucesso!");
  }
}
loadFromLink();

/* ===== PROMOÇÕES ===== */
function openPromos() {
  const cep = document.getElementById("cep").value.trim();
  if (!cep) return alert("Informe o CEP");
  window.open(`https://www.google.com/search?q=encarte+supermercado+${cep}`, "_blank");
}

function render() {
  const shoppingUl = document.getElementById("shoppingList");
  const boughtUl = document.getElementById("boughtList");

  shoppingUl.innerHTML = "";
  boughtUl.innerHTML = "";

  shoppingList.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-text">${item.name} (x${item.qty})</span>
      <input type="number" id="price-${i}" placeholder="R$ unit">
      <button class="btn-small btn-buy" onclick="buyItem(${i})">✔</button>
      <button class="btn-small btn-edit" onclick="editItem(${i})">✏️</button>
      <button class="btn-small btn-delete" onclick="deleteItem(${i})">❌</button>
    `;
    shoppingUl.appendChild(li);
  });

  let total = 0;
  boughtList.forEach((item, i) => {
    total += item.total;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-text">${item.name} (x${item.qty}) – R$ ${item.total.toFixed(2)}</span>
      <button class="btn-small btn-edit" onclick="editBoughtItem(${i})">✏️</button>
      <button class="btn-small btn-delete" onclick="deleteBoughtItem(${i})">❌</button>
    `;
    boughtUl.appendChild(li);
  });

  document.getElementById("total").innerText = total.toFixed(2);
  const budget = parseFloat(document.getElementById("budget").value) || 0;
  document.getElementById("balance").innerText = (budget - total).toFixed(2);
}

document.getElementById("budget").addEventListener("change", render);
render();

/* ===== SERVICE WORKER ===== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
