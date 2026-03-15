import { supabase } from "../config/supabase.js";

export async function getOrders(req, res) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (
          id,
          name
        )
      )
    `,
    )
    .order("id", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
}

export async function createOrder(req, res) {
  const { customer_name, payment_method, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Itens do pedido são obrigatórios" });
  }

  let total = 0;

  for (const item of items) {
    total += Number(item.unit_price) * Number(item.quantity);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        customer_name,
        payment_method,
        status: "pendente",
        total,
      },
    ])
    .select()
    .single();

  if (orderError) {
    return res.status(500).json({ error: orderError.message });
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: Number(item.unit_price) * Number(item.quantity),
    notes: item.notes || null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return res.status(500).json({ error: itemsError.message });
  }

  return res.status(201).json({
    message: "Pedido criado com sucesso",
    order,
  });
}

export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatus = [
    "pendente",
    "preparando",
    "pronto",
    "entregue",
    "cancelado",
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
}
