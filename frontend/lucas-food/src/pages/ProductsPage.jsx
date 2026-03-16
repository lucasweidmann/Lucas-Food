import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    category_id: 1,
    name: "",
    description: "",
    price: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    try {
      const response = await api.get("/products?all=true");
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      alert(error.response?.data?.error || "Erro ao carregar produtos");
      setProducts([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/products", {
        category_id: Number(form.category_id),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image_url: form.image_url || null,
        active: true,
      });

      setForm({
        category_id: 1,
        name: "",
        description: "",
        price: "",
        image_url: "",
      });

      await loadProducts();
      alert("Produto criado com sucesso");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert(error.response?.data?.error || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(product) {
    try {
      await api.patch(`/products/${product.id}/active`, {
        active: !product.active,
      });

      await loadProducts();
    } catch (error) {
      console.error("Erro ao alterar produto:", error);
      alert(error.response?.data?.error || "Erro ao alterar produto");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <h1 style={{ marginTop: 0 }}>Produtos</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            placeholder="Categoria ID"
            type="number"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Preço"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="URL da imagem"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            style={styles.input}
          />

          <button type="submit" style={styles.primaryButton} disabled={loading}>
            {loading ? "Salvando..." : "Salvar produto"}
          </button>
        </form>
      </div>

      <div style={styles.list}>
        {products.map((product) => (
          <div key={product.id} style={styles.productCard}>
            <div>
              <strong>{product.name}</strong>
              <p style={styles.description}>{product.description}</p>
              <p>R$ {Number(product.price).toFixed(2)}</p>
              <p>Status: {product.active ? "Ativo" : "Inativo"}</p>
            </div>

            <button
              onClick={() => toggleActive(product)}
              style={styles.secondaryButton}
            >
              {product.active ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  headerCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d4d4d8",
  },
  primaryButton: {
    border: "none",
    borderRadius: 10,
    padding: 12,
    cursor: "pointer",
    background: "#111827",
    color: "#fff",
    fontWeight: "bold",
  },
  secondaryButton: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    background: "#111827",
    color: "#fff",
    fontWeight: "bold",
    height: "fit-content",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  productCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  description: {
    margin: "6px 0",
    opacity: 0.75,
  },
};
