import { supabase } from "../config/supabase.js";

const orderSelect = `
  *,
  order_items (
    *,
    products (
      id,
      name
    )
  )
`;

const allowedPaymentMethods = ["pix", "dinheiro", "cartao"];

const allowedStatus = [
  "pendente",
  "preparando",
  "pronto",
  "entregue",
  "cancelado",
];

const validTransitions = {
  pendente: ["preparando", "cancelado"],
  preparando: ["pronto", "cancelado"],
  pronto: ["entregue"],
  entregue: [],
  cancelado: [],
};

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function unauthorized(res, message = "Não autenticado") {
  return res.status(401).json({ error: message });
}

function forbidden(res, message = "Sem permissão") {
  return res.status(403).json({ error: message });
}

function notFound(res, message = "Registro não encontrado") {
  return res.status(404).json({ error: message });
}

function internalError(res, error) {
  console.error(error);

  return res.status(500).json({
    error: error?.message || "Erro interno do servidor",
  });
}

function getToken(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

async function authenticateRequest(req) {
  const token = getToken(req);

  if (!token) {
    return {
      error: { type: "unauthorized", message: "Token não enviado" },
    };
  }

  const { supabaseAuth } = await import("../config/supabase.js");

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data?.user) {
    return {
      error: { type: "unauthorized", message: "Token inválido" },
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: {
        type: "unauthorized",
        message: "Falha ao carregar perfil do usuário",
      },
    };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || "",
      role: profile?.role || "customer",
      name: profile?.name || data.user.user_metadata?.name || "",
    },
  };
}

function requireRoles(user, roles) {
  return roles.includes(user.role);
}

async function loadOrderById(id) {
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("id", Number(id))
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getOrders(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    if (!requireRoles(auth.user, ["admin", "staff"])) {
      return forbidden(res, "Você não tem permissão para acessar esta rota");
    }

    const { data, error } = await supabase
      .from("orders")
      .select(orderSelect)
      .order("id", { ascending: false });

    if (error) {
      return internalError(res, error);
    }

    return res.json(data);
  } catch (error) {
    return internalError(res, error);
  }
}

export async function getMyOrders(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    const { data, error } = await supabase
      .from("orders")
      .select(orderSelect)
      .eq("customer_id", auth.user.id)
      .order("id", { ascending: false });

    if (error) {
      return internalError(res, error);
    }

    return res.json(data);
  } catch (error) {
    return internalError(res, error);
  }
}

export async function getOrderById(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    const { id } = req.params;
    const order = await loadOrderById(id);

    if (!order) {
      return notFound(res, "Pedido não encontrado");
    }

    const privileged = ["admin", "staff"].includes(auth.user.role);

    if (!privileged && order.customer_id !== auth.user.id) {
      return forbidden(res, "Você não pode acessar este pedido");
    }

    return res.json(order);
  } catch (error) {
    return internalError(res, error);
  }
}

export async function createOrder(req, res) {
  let createdOrderId = null;

  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    if (!requireRoles(auth.user, ["admin", "staff", "customer"])) {
      return forbidden(res, "Você não tem permissão para acessar esta rota");
    }

    const { customer_name, payment_method, items } = req.body;

    if (!allowedPaymentMethods.includes(String(payment_method))) {
      return badRequest(
        res,
        "Forma de pagamento inválida. Use pix, dinheiro ou cartao",
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest(res, "Itens do pedido são obrigatórios");
    }

    const normalizedItems = items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      notes: item.notes ? String(item.notes).trim() : null,
    }));

    for (const item of normalizedItems) {
      if (!Number.isInteger(item.product_id) || item.product_id <= 0) {
        return badRequest(res, "product_id inválido");
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return badRequest(res, "quantity inválido");
      }
    }

    const productIds = [
      ...new Set(normalizedItems.map((item) => item.product_id)),
    ];

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,price,active")
      .in("id", productIds);

    if (productsError) {
      return internalError(res, productsError);
    }

    const productsMap = new Map();

    for (const product of products || []) {
      productsMap.set(product.id, product);
    }

    for (const item of normalizedItems) {
      const product = productsMap.get(item.product_id);

      if (!product) {
        return badRequest(res, `Produto ${item.product_id} não encontrado`);
      }

      if (!product.active) {
        return badRequest(res, `Produto ${product.name} está inativo`);
      }
    }

    let total = 0;

    const orderItems = normalizedItems.map((item) => {
      const product = productsMap.get(item.product_id);
      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;

      total += subtotal;

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
        notes: item.notes,
      };
    });

    const finalCustomerName = String(
      customer_name || auth.user.name || "Cliente",
    ).trim();

    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_id: auth.user.id,
          customer_name: finalCustomerName,
          payment_method,
          status: "pendente",
          total,
        },
      ])
      .select()
      .single();

    if (orderError || !createdOrder) {
      return internalError(
        res,
        orderError || new Error("Falha ao criar pedido"),
      );
    }

    createdOrderId = createdOrder.id;

    const orderItemsPayload = orderItems.map((item) => ({
      order_id: createdOrder.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", createdOrder.id);
      return internalError(res, itemsError);
    }

    const fullOrder = await loadOrderById(createdOrder.id);

    return res.status(201).json({
      message: "Pedido criado com sucesso",
      order: fullOrder,
    });
  } catch (error) {
    if (createdOrderId) {
      await supabase.from("orders").delete().eq("id", createdOrderId);
    }

    return internalError(res, error);
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    if (!requireRoles(auth.user, ["admin", "staff"])) {
      return forbidden(res, "Você não tem permissão para acessar esta rota");
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!allowedStatus.includes(String(status))) {
      return badRequest(res, "Status inválido");
    }

    const currentOrder = await loadOrderById(id);

    if (!currentOrder) {
      return notFound(res, "Pedido não encontrado");
    }

    if (!validTransitions[currentOrder.status]?.includes(status)) {
      return badRequest(
        res,
        `Não é permitido alterar de ${currentOrder.status} para ${status}`,
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", Number(id))
      .select(orderSelect)
      .single();

    if (error) {
      return internalError(res, error);
    }

    return res.json(data);
  } catch (error) {
    return internalError(res, error);
  }
}
