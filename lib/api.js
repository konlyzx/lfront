const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://a31f-181-79-85-202.ngrok-free.app";
const API_SEND_FIRMA_UPLOAD_URL = `${API_BASE_URL}/api/send-firma-with-upload`;
const API_HISTORIAL_URL = `${API_BASE_URL}/api/historial`;
const API_CANCEL_URL = `${API_BASE_URL}/api/cancel`;
const SUPABASE_REST_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/envios_historial`
    : "";

export async function checkBackendHealth() {
    try {
        const res = await fetch(API_BASE_URL, {
            method: "GET",
            signal: AbortSignal.timeout(3000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function sendFirmaWithUpload({ to, param1, param2, pdfFile, authToken }) {
    const formData = new FormData();
    formData.append("to", to.replace("+", ""));
    formData.append("template", "firma");
    formData.append("language", "es_CO");
    formData.append("param1", param1);
    formData.append("param2", param2);
    formData.append("pdfFile", pdfFile, pdfFile.name);

    const res = await fetch(API_SEND_FIRMA_UPLOAD_URL, {
        method: "POST",
        body: formData,
        headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
    });

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Respuesta inválida del servidor.");
    }
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
}

export async function fetchHistorial(authToken) {
    const res = await fetch(API_HISTORIAL_URL, {
        headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${text.slice(0, 160) || "Sin detalle"}`);
    }

    try {
        return JSON.parse(text);
    } catch (err) {
        // Si no es JSON, devolvemos un payload vacío pero usable
        return { success: true, data: [], warning: "Respuesta no JSON" };
    }
}

export async function fetchHistorialSupabase() {
    if (!SUPABASE_REST_URL) throw new Error("Supabase URL no configurada");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = `${SUPABASE_REST_URL}?select=id,cedula,fecha,firma&order=fecha.desc`;
    const res = await fetch(url, {
        headers: {
            apikey: anon || "",
            Authorization: anon ? `Bearer ${anon}` : "",
        },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return res.json();
}

export async function cancelEnvio({ id, authToken }) {
    if (!id) throw new Error("ID requerido para cancelar.");
    const res = await fetch(API_CANCEL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
}

export { API_BASE_URL, API_SEND_FIRMA_UPLOAD_URL, API_HISTORIAL_URL, API_CANCEL_URL, SUPABASE_REST_URL };
