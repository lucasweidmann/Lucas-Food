export function badRequest(res, message) {
  return res.status(400).json({
    error: message,
  });
}

export function unauthorized(res, message = "Não autenticado") {
  return res.status(401).json({
    error: message,
  });
}

export function forbidden(res, message = "Sem permissão") {
  return res.status(403).json({
    error: message,
  });
}

export function notFound(res, message = "Registro não encontrado") {
  return res.status(404).json({
    error: message,
  });
}

export function internalError(res, error) {
  console.error(error);

  return res.status(500).json({
    error: error?.message || "Erro interno do servidor",
  });
}
