export function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/<script[^>]*?>.*?<\/script>/gi, '')   
    .replace(/<[^>]*?onerror\s*=\s*(['"]).*?\1[^>]*?>/gi, '') 
    .replace(/<[^>]*?javascript:.*?[^>]*?>/gi, '');  
}

export function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return sanitizeInput(obj);
}

export function withSanitization(handler) {
  return async function (request) {
    const clonedReq = request.clone();
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
         const body = await clonedReq.json();
         const sanitizedBody = sanitizeObject(body);
         request.json = async () => sanitizedBody;
      }
    } catch (e) {}
    return handler(request);
  };
}

export function withUploadHardening(handler) {
  return async function (request) {
    const cloned = request.clone();
    try {
      const formData = await cloned.formData();
      const files = formData.getAll("files");
      for (const file of files) {
         if (!(file instanceof File)) continue;
         const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
         if (!validTypes.includes(file.type)) {
           return Response.json({ error: "Upload ditolak. Opsi file khusus." }, { status: 400 });
         }
         if (file.size > 5 * 1024 * 1024) {
           return Response.json({ error: "Ukuran file maksimum 5MB." }, { status: 400 });
         }
      }
    } catch(e) {}
    return handler(request);
  }
}
