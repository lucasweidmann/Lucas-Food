import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { supabase } from "../lib/supabase";

const columns = [
  { key: "pendente", title: "Pendentes" },
  { key: "preparando", title: "Preparando" },
  { key: "pronto", title: "Prontos" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  async function loadOrders() {
    try {
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      alert(error.response?.data?.error || "Erro ao carregar pedidos");
      setOrders([]);
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("kitchen-orders-realtime")
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

  async function updateStatus(orderId, status) {
    try {
      setLoadingAction(true);
      await api.patch(`/orders/${orderId}/status`, { status });
      await loadOrders();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert(error.response?.data?.error || "Erro ao atualizar status");
    } finally {
      setLoadingAction(false);
    }
  }

  const groupedOrders = useMemo(() => {
    return {
      pendente: orders.filter((order) => order.status === "pendente"),
      preparando: orders.filter((order) => order.status === "preparando"),
      pronto: orders.filter((order) => order.status === "pronto"),
    };
  }, [orders]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Cozinha</h1>
          <p style={{ marginTop: 8 }}>Pedidos atualizando em tempo real</p>
        </div>

        <button onClick={loadOrders} style={styles.refreshButton}>
          Atualizar
        </button>
      </div>

      {loadingPage ? (
        <div style={styles.emptyPage}>Carregando...</div>
      ) : (
        <div style={styles.board}>
          {columns.map((column) => (
            <div key={column.key} style={styles.column}>
              <h2 style={styles.columnTitle}>
                {column.title} ({groupedOrders[column.key].length})
              </h2>

              <div style={styles.cards}>
                {groupedOrders[column.key].length === 0 && (
                  <div style={styles.emptyCard}>Nenhum pedido</div>
                )}

                {groupedOrders[column.key].map((order) => (
                  <div key={order.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <strong>Pedido #{order.id}</strong>
                      <span>{order.customer_name || "Cliente balcão"}</span>
                    </div>

                    <div style={styles.itemsList}>
                      {order.order_items?.map((item) => (
                        <div key={item.id} style={styles.itemRow}>
                          <span>
                            {item.quantity}x {item.products?.name || "Produto"}
                          </span>

                          {item.notes ? (
                            <small style={styles.note}>Obs: {item.notes}</small>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div style={styles.total}>
                      Total: R$ {Number(order.total).toFixed(2)}
                    </div>

                    <div style={styles.actions}>
                      {order.status === "pendente" && (
                        <button
                          disabled={loadingAction}
                          style={styles.actionButton}
                          onClick={() => updateStatus(order.id, "preparando")}
                        >
                          Iniciar preparo
                        </button>
                      )}

                      {order.status === "preparando" && (
                        <button
                          disabled={loadingAction}
                          style={styles.actionButton}
                          onClick={() => updateStatus(order.id, "pronto")}
                        >
                          Marcar como pronto
                        </button>
                      )}

                      {order.status === "pronto" && (
                        <button
                          disabled={loadingAction}
                          style={styles.actionButton}
                          onClick={() => updateStatus(order.id, "entregue")}
                        >
                          Entregue
                        </button>
                      )}
                    </div>
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
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    background: "#111827",
    color: "#fff",
    fontWeight: "bold",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  column: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    minHeight: 500,
  },
  columnTitle: {
    marginTop: 0,
    marginBottom: 16,
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  emptyCard: {
    padding: 16,
    border: "1px dashed #ccc",
    borderRadius: 10,
    textAlign: "center",
  },
  emptyPage: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    background: "#fafafa",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 10,
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },
  itemRow: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  note: {
    opacity: 0.8,
  },
  total: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  actions: {
    display: "flex",
  },
  actionButton: {
    width: "100%",
    border: "none",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
    background: "#111827",
    color: "#fff",
  },
};
