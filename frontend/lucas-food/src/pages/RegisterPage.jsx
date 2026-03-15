import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
          },
        },
      });

      if (error) throw error;

      alert(
        data.session
          ? "Cadastro realizado e login efetuado."
          : "Cadastro realizado. Verifique seu email para confirmar a conta.",
      );

      navigate("/login");
    } catch (error) {
      alert(error.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1>Criar conta</h1>

        <input
          type="text"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={styles.input}
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>

        <Link to="/login">Já tenho conta</Link>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f4f5",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d4d4d8",
  },
  button: {
    padding: 12,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
  },
};
