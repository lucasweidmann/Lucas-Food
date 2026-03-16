import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import PDVPage from "./pages/PDVPage";
import KitchenPage from "./pages/KitchenPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

function AppLayout() {
  const { signOut, user } = useAuth();

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      alert("Erro ao sair");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f5" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <nav
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link to="/pdv">PDV</Link>
            <Link to="/orders">Meus pedidos</Link>
            <Link to="/products">Produtos</Link>
            <Link to="/kitchen">Cozinha</Link>
          </nav>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span>{user?.email}</span>
            <button onClick={handleLogout}>Sair</button>
          </div>
        </div>

        <Routes>
          <Route path="/pdv" element={<PDVPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="*" element={<Navigate to="/pdv" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
