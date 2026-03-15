import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    category_id: 1,
    name: "",
    description: "",
    price: "",
  });

  async function loadProducts() {
    const response = await api.get("/products");
    setProducts(response.data);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await api.post("/products", {
      ...form,
      price: Number(form.price),
      active: true,
    });

    setForm({
      category_id: 1,
      name: "",
      description: "",
      price: "",
    });

    loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Produtos</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Preço"
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <button type="submit">Salvar</button>
      </form>

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - R$ {Number(product.price).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
