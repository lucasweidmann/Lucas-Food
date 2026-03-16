import { useEffect, useState } from "react";
import { api } from "../services/api";
import { supabase } from "../lib/supabase";

function getStatusLabel(status) {
  switch (status) {
    case "pendente":
      return "Pendente";
    case "preparando":
      return "Preparando";
    case "pronto":
      return "Pronto";
    case "entregue":
      return "Entregue";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "pendente":
      return "#f59e0b";
    case "preparando":
      return "#3b82f6";
    case "pronto":
      return "#10b981";
    case "entregue":
      return "#6b7280";
    case "cancelado":
      return "#ef4444";
    default:
      return "#111827";
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const response = await api.get("/orders/my");
      setOrders(response.data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      alert(error.response?.data?.error || "Erro ao carregar pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("web-my-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async () => {
          await loadOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Meus pedidos</h1>
          <p style={{ marginTop: 8, opacity: 0.7 }}>
            Acompanhe os pedidos da sua conta
          </p>
        </div>

        <button onClick={loadOrders} style={styles.refreshButton}>
          Atualizar
        </button>
      </div>

      {loading ? (
        <div style={styles.emptyCard}>Carregando...</div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyCard}>Você ainda não tem pedidos</div>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <h3 style={{ margin: 0 }}>Pedido #{order.id}</h3>
                  <p style={{ margin: "6px 0 0 0", opacity: 0.75 }}>
                    Cliente: {order.customer_name || "Cliente"}
                  </p>
                </div>

                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: getStatusColor(order.status),
                  }}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div style={styles.meta}>
                <span>Pagamento: {order.payment_method || "-"}</span>
                <strong>Total: R$ {Number(order.total).toFixed(2)}</strong>
              </div>

              <div style={styles.items}>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={styles.item}>
                    <div>
                      <strong>
                        {item.quantity}x {item.products?.name || "Produto"}
                      </strong>
                      {item.notes ? (
                        <p style={styles.note}>Obs: {item.notes}</p>
                      ) : null}
                    </div>

                    <span>R$ {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  refreshButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  badge: {
    color: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: "bold",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fafafa",
  },
  note: {
    margin: "6px 0 0 0",
    opacity: 0.75,
  },
  emptyCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
  },
};
