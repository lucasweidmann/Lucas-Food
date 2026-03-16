import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  View,
  Pressable,
} from "react-native";
import { supabase } from "../src/lib/supabase";
import { api } from "../src/services/api";
import { useAuth } from "../src/contexts/AuthContext";

export default function OrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const response = await api.get("/orders/my");
      setOrders(response.data);
    } catch (error) {
      console.log("Erro ao carregar pedidos", error?.response?.data || error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    if (!user?.id) return;

    const channel = supabase
      .channel(`mobile-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        async () => {
          await loadOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pedidos</Text>

        <Pressable style={styles.refreshButton} onPress={loadOrders}>
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </Pressable>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={{ opacity: 0.7 }}>Você ainda não tem pedidos</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.orderTop}>
              <Text style={styles.orderTitle}>Pedido #{item.id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <Text>Cliente: {item.customer_name}</Text>
            <Text>Pagamento: {item.payment_method || "-"}</Text>
            <Text>Total: R$ {Number(item.total).toFixed(2)}</Text>

            <View style={{ marginTop: 10, gap: 6 }}>
              {item.order_items?.map((orderItem) => (
                <View key={orderItem.id}>
                  <Text>
                    {orderItem.quantity}x{" "}
                    {orderItem.products?.name || "Produto"}
                  </Text>
                  {orderItem.notes ? (
                    <Text style={{ opacity: 0.7 }}>Obs: {orderItem.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = {
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  refreshButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
};
