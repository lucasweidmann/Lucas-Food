import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function PDVPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      alert("Erro ao carregar produtos");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addToCart(product) {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product_id === product.id,
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unit_price,
              }
            : item,
        );
      }

      return [
        ...prevCart,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: Number(product.price),
          subtotal: Number(product.price),
          notes: "",
        },
      ];
    });
  }

  function increaseQuantity(productId) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unit_price,
            }
          : item,
      ),
    );
  }

  function decreaseQuantity(productId) {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
                subtotal: (item.quantity - 1) * item.unit_price,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId) {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product_id !== productId),
    );
  }

  function updateNotes(productId, notes) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === productId ? { ...item, notes } : item,
      ),
    );
  }

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  async function finalizeOrder() {
    if (cart.length === 0) {
      alert("Adicione itens no carrinho");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customer_name: customerName || "Cliente balcão",
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes,
        })),
      };

      await api.post("/orders", payload);

      alert("Pedido criado com sucesso");

      setCart([]);
      setCustomerName("");
      setPaymentMethod("pix");
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <h1>PDV - Lucas Food</h1>
        <p>Selecione os produtos</p>

        <div style={styles.productGrid}>
          {products.map((product) => (
            <button
              key={product.id}
              style={styles.productCard}
              onClick={() => addToCart(product)}
            >
              <strong>{product.name}</strong>
              <span>{product.description}</span>
              <span>R$ {Number(product.price).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.rightPanel}>
        <h2>Carrinho</h2>

        <input
          type="text"
          placeholder="Nome do cliente"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={styles.input}
        />

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={styles.input}
        >
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
        </select>

        <div style={styles.cartList}>
          {cart.length === 0 && <p>Nenhum item no carrinho</p>}

          {cart.map((item) => (
            <div key={item.product_id} style={styles.cartItem}>
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} x R$ {item.unit_price.toFixed(2)}
                </p>
                <p>Subtotal: R$ {item.subtotal.toFixed(2)}</p>
              </div>

              <div style={styles.cartActions}>
                <button onClick={() => decreaseQuantity(item.product_id)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => increaseQuantity(item.product_id)}>
                  +
                </button>
                <button onClick={() => removeItem(item.product_id)}>
                  Remover
                </button>
              </div>

              <input
                type="text"
                placeholder="Observação"
                value={item.notes}
                onChange={(e) => updateNotes(item.product_id, e.target.value)}
                style={styles.notesInput}
              />
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <h3>Total: R$ {total.toFixed(2)}</h3>
          <button
            onClick={finalizeOrder}
            disabled={loading}
            style={styles.finalizeButton}
          >
            {loading ? "Finalizando..." : "Finalizar Pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  leftPanel: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
  },
  rightPanel: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "20px",
  },
  productCard: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "#fafafa",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  cartList: {
    flex: 1,
    overflowY: "auto",
    marginTop: "10px",
  },
  cartItem: {
    borderBottom: "1px solid #eee",
    padding: "12px 0",
  },
  cartActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginTop: "8px",
  },
  notesInput: {
    width: "100%",
    marginTop: "8px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  footer: {
    borderTop: "1px solid #eee",
    paddingTop: "16px",
    marginTop: "16px",
  },
  finalizeButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
