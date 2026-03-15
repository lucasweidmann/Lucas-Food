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
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/products">Produtos</Link>
          <Link to="/orders">Pedidos</Link>
          <Link to="/pdv">PDV</Link>
          <Link to="/kitchen">Cozinha</Link>
        </nav>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>{user?.email}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </div>

      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/pdv" element={<PDVPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="*" element={<Navigate to="/pdv" replace />} />
      </Routes>
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
