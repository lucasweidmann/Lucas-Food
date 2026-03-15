import { supabase } from "../config/supabase.js";

export async function getProducts(req, res) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
}

export async function createProduct(req, res) {
  const { category_id, name, description, price, image_url, active } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        category_id,
        name,
        description,
        price,
        image_url,
        active,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}
