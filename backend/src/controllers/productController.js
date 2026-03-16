import { supabase, supabaseAuth } from "../config/supabase.js";

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

function sanitizeProductPayload(body) {
  return {
    category_id:
      body.category_id === null || body.category_id === undefined
        ? null
        : Number(body.category_id),
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price),
    image_url: body.image_url ? String(body.image_url).trim() : null,
    active: typeof body.active === "boolean" ? body.active : true,
  };
}

function validateProductPayload(payload) {
  if (!payload.name) {
    return "Nome do produto é obrigatório";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Preço inválido";
  }

  if (
    payload.category_id !== null &&
    (!Number.isInteger(payload.category_id) || payload.category_id <= 0)
  ) {
    return "Categoria inválida";
  }

  return null;
}

export async function getProducts(req, res) {
  try {
    let canSeeInactive = false;

    const token = getToken(req);

    if (token) {
      const auth = await authenticateRequest(req);

      if (!auth.error) {
        canSeeInactive = ["admin", "staff"].includes(auth.user.role);
      }
    }

    const showAll = req.query.all === "true";

    let query = supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (!(showAll && canSeeInactive)) {
      query = query.eq("active", true);
    }

    if (req.query.category_id) {
      query = query.eq("category_id", Number(req.query.category_id));
    }

    if (req.query.search) {
      query = query.ilike("name", `%${String(req.query.search).trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return internalError(res, error);
    }

    return res.json(data);
  } catch (error) {
    return internalError(res, error);
  }
}

export async function createProduct(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    if (auth.user.role !== "admin") {
      return forbidden(res, "Você não tem permissão para acessar esta rota");
    }

    const payload = sanitizeProductPayload(req.body);
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return badRequest(res, validationError);
    }

    const { data, error } = await supabase
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return internalError(res, error);
    }

    return res.status(201).json(data);
  } catch (error) {
    return internalError(res, error);
  }
}

export async function updateProduct(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    if (auth.user.role !== "admin") {
      return forbidden(res, "Você não tem permissão para acessar esta rota");
    }

    const { id } = req.params;
    const payload = sanitizeProductPayload(req.body);
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return badRequest(res, validationError);
    }

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", Number(id))
      .select()
      .maybeSingle();

    if (error) {
      return internalError(res, error);
    }

    if (!data) {
      return notFound(res, "Produto não encontrado");
    }

    return res.json(data);
  } catch (error) {
    return internalError(res, error);
  }
}

export async function toggleProductStatus(req, res) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.error) {
      return unauthorized(res, auth.error.message);
    }

    if (auth.user.role !== "admin") {
      return forbidden(res, "Você não tem permissão para acessar esta rota");
    }

    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return badRequest(res, "Campo active deve ser true ou false");
    }

    const { data, error } = await supabase
      .from("products")
      .update({ active })
      .eq("id", Number(id))
      .select()
      .maybeSingle();

    if (error) {
      return internalError(res, error);
    }

    if (!data) {
      return notFound(res, "Produto não encontrado");
    }

    return res.json(data);
  } catch (error) {
    return internalError(res, error);
  }
}
