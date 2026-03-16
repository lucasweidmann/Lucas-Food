import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "../src/services/api";

export default function CartPage() {
  const params = useLocalSearchParams();
  const initialCart = params.cart ? JSON.parse(params.cart) : [];

  const [cart, setCart] = useState(initialCart);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [cart]);

  function increase(productId) {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decrease(productId) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function finishOrder() {
    if (!cart.length) {
      Alert.alert("Carrinho vazio", "Adicione produtos antes de finalizar.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/orders", {
        customer_name: customerName?.trim() || "Cliente app",
        payment_method: paymentMethod.trim().toLowerCase(),
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          notes: "",
        })),
      });

      Alert.alert("Sucesso", "Pedido criado com sucesso");
      router.replace("/orders");
    } catch (error) {
      console.log("Erro ao finalizar pedido:", error?.response?.data || error);
      Alert.alert(
        "Erro",
        error?.response?.data?.error || "Não foi possível finalizar o pedido",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
        Carrinho
      </Text>

      <TextInput
        placeholder="Nome"
        value={customerName}
        onChangeText={setCustomerName}
        style={styles.input}
      />

      <TextInput
        placeholder="Pagamento: pix, dinheiro, cartao"
        value={paymentMethod}
        onChangeText={setPaymentMethod}
        style={styles.input}
        autoCapitalize="none"
      />

      <FlatList
        data={cart}
        keyExtractor={(item) => String(item.product_id)}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={{ fontWeight: "700" }}>{item.name}</Text>
            <Text>R$ {item.unit_price.toFixed(2)}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.qtyButton}
                onPress={() => decrease(item.product_id)}
              >
                <Text>-</Text>
              </Pressable>
              <Text>{item.quantity}</Text>
              <Pressable
                style={styles.qtyButton}
                onPress={() => increase(item.product_id)}
              >
                <Text>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
        Total: R$ {total.toFixed(2)}
      </Text>

      <Pressable
        style={styles.finishButton}
        onPress={finishOrder}
        disabled={loading}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {loading ? "Finalizando..." : "Finalizar pedido"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  finishButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
};
