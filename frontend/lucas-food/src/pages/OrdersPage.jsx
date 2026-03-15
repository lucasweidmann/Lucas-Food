import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  async function loadOrders() {
    const response = await api.get("/orders");
    setOrders(response.data);
  }

  async function updateStatus(id, status) {
    await api.patch(`/orders/${id}/status`, { status });
    loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Pedidos</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 12,
            padding: 12,
          }}
        >
          <h3>Pedido #{order.id}</h3>
          <p>Cliente: {order.customer_name}</p>
          <p>Status: {order.status}</p>
          <p>Total: R$ {Number(order.total).toFixed(2)}</p>

          <button onClick={() => updateStatus(order.id, "preparando")}>
            Preparando
          </button>
          <button onClick={() => updateStatus(order.id, "pronto")}>
            Pronto
          </button>
          <button onClick={() => updateStatus(order.id, "entregue")}>
            Entregue
          </button>
        </div>
      ))}
    </div>
  );
}
