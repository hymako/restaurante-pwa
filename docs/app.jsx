import React, { useMemo, useState } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

// ======= Datos de ejemplo (frontend) =======
const CATEGORIES = [
  { id: "destacados", label: "Destacados" },
  { id: "entrantes", label: "Entrantes" },
  { id: "principales", label: "Principales" },
  { id: "postres", label: "Postres" },
  { id: "bebidas", label: "Bebidas" }
];

const PRODUCTS = [
  { id: 1, name: "Combo Pareja", price: 8.0, category: "destacados", img: "https://images.unsplash.com/photo-1604908554007-1d5859c181df?q=80&w=600&auto=format&fit=crop" },
  { id: 2, name: "Arroz del Chef", price: 3.5, category: "principales", img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop" },
  { id: 3, name: "Carne salteada", price: 6.8, category: "principales", img: "https://images.unsplash.com/photo-1559628233-7ea3b2e5d8d5?q=80&w=600&auto=format&fit=crop" },
  { id: 4, name: "Ensalada + atún", price: 5.5, category: "entrantes", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop" },
  { id: 5, name: "Filet Argentino", price: 8.9, category: "principales", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" },
  { id: 6, name: "Tarta de queso", price: 4.2, category: "postres", img: "https://images.unsplash.com/photo-1551024709-8f23befc6cf7?q=80&w=600&auto=format&fit=crop" },
  { id: 7, name: "Agua 50cl", price: 1.5, category: "bebidas", img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=600&auto=format&fit=crop" },
  { id: 8, name: "Café", price: 1.3, category: "bebidas", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop" },
  { id: 9, name: "Helado vainilla", price: 3.1, category: "postres", img: "https://images.unsplash.com/photo-1495197359483-d092478c170a?q=80&w=600&auto=format&fit=crop" }
];

const TABLES = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: `Mesa ${i + 1}`
}));

// ======= Utilidades =======
const money = n =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const subtotal = items => items.reduce((acc, it) => acc + it.price * it.qty, 0);

// ======= App =======
function App() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orderSeq, setOrderSeq] = useState(1);

  // Cliente
  const [selectedTableId, setSelectedTableId] = useState(1);
  const [activeCategory, setActiveCategory] = useState("destacados");
  const [cart, setCart] = useState([]);

  // Camarero
  const [filterMesa, setFilterMesa] = useState(0);

  const mesasConPendientes = useMemo(() => {
    const map = new Map();
    orders
      .filter(o => !o.paid && o.status !== "cerrado")
      .forEach(o => map.set(o.tableId, (map.get(o.tableId) || 0) + 1));
    return map;
  }, [orders]);

  const totalCobradoHoy = payments.reduce((a, p) => a + p.amount, 0);

  // ==== Acciones cliente ====
  function addToCart(p) {
    setCart(prev => {
      const i = prev.findIndex(x => x.productId === p.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function removeFromCart(productId) {
    setCart(prev =>
      prev.flatMap(it =>
        it.productId === productId ? (it.qty > 1 ? [{ ...it, qty: it.qty - 1 }] : []) : [it]
      )
    );
  }

  function sendOrder() {
    if (cart.length === 0) return;
    const newOrder = {
      id: orderSeq,
      items: cart,
      tableId: selectedTableId,
      status: "en_cocina",
      paid: false,
      createdAt: Date.now()
    };
    setOrderSeq(s => s + 1);
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
  }

  function payFromClient(method) {
    const open = orders.filter(
      o => o.tableId === selectedTableId && !o.paid && o.status !== "cerrado"
    );
    if (!open.length) return;
    const amount = open.reduce((a, o) => a + subtotal(o.items), 0);
    const updated = orders.map(o =>
      open.includes(o) ? { ...o, paid: true, status: "cerrado", paymentMethod: method } : o
    );
    setOrders(updated);
    setPayments(prev => [
      { id: crypto.randomUUID(), tableId: selectedTableId, amount, method, at: Date.now() },
      ...prev
    ]);
    alert(`Pago registrado: ${money(amount)} (${method})`);
  }

  // ==== Acciones camarero ====
  function setOrderStatus(orderId, status) {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
  }
  function cobrarMesa(tableId, method) {
    const open = orders.filter(
      o => o.tableId === tableId && !o.paid && o.status !== "cerrado"
    );
    if (!open.length) return;
    const amount = open.reduce((a, o) => a + subtotal(o.items), 0);
    setOrders(prev =>
      prev.map(o => (open.includes(o) ? { ...o, paid: true, status: "cerrado", paymentMethod: method } : o))
    );
    setPayments(prev => [
      { id: crypto.randomUUID(), tableId, amount, method, at: Date.now() },
      ...prev
    ]);
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-4">
      <header className="max-w-7xl mx-auto flex items-center gap-3 mb-4">
        <div className="font-black text-2xl">🍽️ Demo PWA Restaurante</div>
        <div className="text-xs ml-auto px-2 py-1 rounded bg-slate-800 text-white">
          Demo local sin backend
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLIENTE */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📱 PWA Cliente <span className="text-xs font-medium text-slate-500">(simula QR)</span>
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <label className="text-sm">Mesa</label>
            <select
              value={selectedTableId}
              onChange={e => setSelectedTableId(parseInt(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {TABLES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2 text-sm">
              <button onClick={() => payFromClient("online")} className="rounded-xl border px-3 py-1 hover:bg-slate-100">
                💳 Pagar online
              </button>
              <button onClick={() => payFromClient("barra")} className="rounded-xl border px-3 py-1 hover:bg-slate-100">
                🧾 Pagar en barra
              </button>
              <button onClick={() => payFromClient("efectivo")} className="rounded-xl border px-3 py-1 hover:bg-slate-100">
                💶 Efectivo
              </button>
            </div>
          </div>

          {/* Categorías */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1 rounded-full border whitespace-nowrap ${
                  activeCategory === c.id ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Productos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {PRODUCTS.filter(p => (activeCategory === "destacados" ? true : p.category === activeCategory)).map(p => (
              <article key={p.id} className="rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition">
                <img src={p.img} alt={p.name} className="h-28 w-full object-cover" />
                <div className="p-2">
                  <div className="font-semibold leading-tight line-clamp-1">{p.name}</div>
                  <div className="text-sm text-slate-600">{money(p.price)}</div>
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 text-sm"
                  >
                    Añadir
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Carrito */}
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">🧺 Tu pedido</h3>
              <div className="text-sm text-slate-500">{cart.length} líneas</div>
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500 mt-2">Aún no has añadido nada.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {cart.map(it => (
                  <div key={it.productId} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-slate-500">
                        {it.qty} × {money(it.price)}
                      </div>
                    </div>
                    <div className="font-semibold">{money(it.qty * it.price)}</div>
                    <div className="flex gap-1">
                      <button onClick={() => removeFromCart(it.productId)} className="w-8 h-8 rounded-full border hover:bg-slate-100">
                        −
                      </button>
                      <button
                        onClick={() => addToCart(PRODUCTS.find(p => p.id === it.productId))}
                        className="w-8 h-8 rounded-full border hover:bg-slate-100"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <div className="text-sm text-slate-600">Subtotal</div>
                  <div className="text-lg font-bold">{money(subtotal(cart))}</div>
                </div>
                <button onClick={sendOrder} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 font-semibold">
                  Enviar a cocina
                </button>
              </div>
            )}
          </div>
        </section>

        {/* CAMARERO */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">🧑‍🍳 PWA Camarero</h2>
            <span className="text-xs text-slate-500">(cliente y camarero comparten estado)</span>
            <div className="ml-auto flex items-center gap-2">
              <select
                value={filterMesa}
                onChange={e => setFilterMesa(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={0}>Todas las mesas</option>
                {TABLES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="text-sm rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-200">
                Cobrado hoy: <b>{money(totalCobradoHoy)}</b>
              </div>
            </div>
          </div>

          {/* Mesas */}
          <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
            {TABLES.map(t => {
              const abiertos = mesasConPendientes.get(t.id) || 0;
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border p-2 text-center ${
                    abiertos ? "bg-amber-50 border-amber-200" : "bg-slate-50"
                  }`}
                >
                  <div className="text-xs text-slate-500">{t.name}</div>
                  <div className="text-lg font-bold">{abiertos}</div>
                  <div className="text-[10px] text-slate-400">pedidos abiertos</div>
                  <button onClick={() => setFilterMesa(t.id)} className="mt-1 text-xs underline">
                    ver
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pedidos */}
          <h3 className="mt-4 font-bold">Pedidos</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {orders
              .filter(o => (filterMesa === 0 || o.tableId === filterMesa) && o.status !== "cerrado")
              .map(o => (
                <article key={o.id} className="rounded-xl border shadow-sm p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-xs px-2 py-0.5 rounded-full border">#{o.id}</div>
                    <div className="font-semibold">Mesa {o.tableId}</div>
                    <div
                      className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${
                        o.status === "en_cocina"
                          ? "bg-amber-50 border-amber-200"
                          : o.status === "listo"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50"
                      }`}
                    >
                      {o.status}
                    </div>
                  </div>
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="flex-1">
                          {it.qty}× {it.name}
                        </span>
                        <span className="font-medium">{money(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between mt-3">
                    <div className="font-bold">{money(subtotal(o.items))}</div>
                    <div className="flex gap-2">
                      {o.status === "en_cocina" && (
                        <button onClick={() => setOrderStatus(o.id, "listo")} className="px-3 py-1 rounded-lg border hover:bg-slate-100">
                          Marcar listo
                        </button>
                      )}
                      {o.status === "listo" && (
                        <button onClick={() => setOrderStatus(o.id, "servido")} className="px-3 py-1 rounded-lg border hover:bg-slate-100">
                          Marcar servido
                        </button>
                      )}
                      {o.status === "servido" && (
                        <button onClick={() => setOrderStatus(o.id, "en_cocina")} className="px-3 py-1 rounded-lg border hover:bg-slate-100">
                          ↺ A cocina
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            {orders.filter(o => (filterMesa === 0 || o.tableId === filterMesa) && o.status !== "cerrado").length === 0 && (
              <div className="text-sm text-slate-500">No hay pedidos en curso.</div>
            )}
          </div>

          {/* Cobro */}
          <div className="mt-4 border-t pt-3">
            <h3 className="font-bold">Cobrar mesa</h3>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <select
                value={filterMesa}
                onChange={e => setFilterMesa(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={0}>Selecciona mesa…</option>
                {TABLES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button onClick={() => cobrarMesa(filterMesa || 1, "efectivo")} className="px-3 py-1 rounded-lg border hover:bg-slate-100">
                💶 Efectivo
              </button>
              <button onClick={() => cobrarMesa(filterMesa || 1, "barra")} className="px-3 py-1 rounded-lg border hover:bg-slate-100">
                🧾 Barra/TPV
              </button>
              <button onClick={() => cobrarMesa(filterMesa || 1, "online")} className="px-3 py-1 rounded-lg border hover:bg-slate-100">
                💳 Online
              </button>
            </div>
          </div>

          {/* Caja */}
          <div className="mt-4 border-t pt-3">
            <h3 className="font-bold">Caja de hoy</h3>
            <div className="text-sm text-slate-600">
              Total cobrado: <b>{money(totalCobradoHoy)}</b>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["efectivo", "barra", "online"].map(method => {
                const sum = payments.filter(p => p.method === method).reduce((a, p) => a + p.amount, 0);
                const max = Math.max(1, ...payments.map(p => p.amount));
                const height = Math.round((sum / Math.max(sum, max)) * 100);
                return (
                  <div key={method} className="flex flex-col items-center justify-end h-32 bg-slate-50 rounded-xl border p-2">
                    <div className="w-8 rounded bg-slate-900" style={{ height: `${height}%` }}></div>
                    <div className="text-xs mt-2">{method}</div>
                    <div className="text-xs font-medium">{money(sum)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto mt-6 text-xs text-slate-500">
        <ol className="list-decimal pl-5 space-y-1">
          <li>El cliente escoge mesa (QR), añade productos y pulsa <b>Enviar a cocina</b>.</li>
          <li>El pedido aparece en <b>Camarero</b>. Cambia estados: <i>en_cocina → listo → servido</i>.</li>
          <li>Pago desde el móvil o desde la vista de camarero.</li>
          <li><b>Caja</b> se actualiza en tiempo real (demo local).</li>
        </ol>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
