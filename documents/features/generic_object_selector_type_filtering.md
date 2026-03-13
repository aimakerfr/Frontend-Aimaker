### GenericObjectSelector — Type-only filtering (Frontend → Backend spec)

#### Overview
The FabLab UI includes a reusable selector component named `GenericObjectSelector`. In “type-only” mode, it lists Objects filtered exclusively by their `type` (e.g., `HTML`, `CONFIG`, `TEXT`) without any assembly hints. This document specifies how the frontend queries the backend in this mode so the API can implement and maintain a compatible endpoint.

#### Why type-only
Some assembler workflows (e.g., Landing Page Assembler) need to let the user choose any object of a given `type` (like `HTML`) regardless of `product_type_for_assembly` or `module_name_for_assembly`. This avoids over-constraining the selection and supports general reuse of previously created objects.

---

### Endpoint contract

- Method: GET
- Path: `/api/v1/objects`
- Auth: Bearer token (same as other private endpoints)
- Query params:
  - `type` (required): one of the allowed object types used across the platform. Current frontend enum includes:
    - `PDF | IMAGE | VIDEO | TEXT | WEBSITE | HTML | TRANSLATION | CODE | DOC | CONFIG | JSON | PRODUCT`

Example URL:
```
/api/v1/objects?type=HTML
```

Notes:
- Only the `type` param is sent in type-only mode. No assembly filters are included.
- If the value is invalid or missing, return a 400 with a clear validation message.

---

### Expected response

- Status: 200 OK
- Body: JSON array of objects (no envelope required for this endpoint; if an envelope is standard in your API, `{ data: ObjectItem[] }` is also acceptable).

Each object MUST include at least:
```
{
  id: number,
  name: string,
  type: string,
  // Optional but supported by the UI when present:
  title?: string | null,
  url?: string | null,
  relative_path?: string | null,
  product_type_for_assembly?: string | null,
  module_name_for_assembly?: string | null,
  data?: Record<string, unknown> | null,
  makerPathId?: number | null,
  createdAt?: string,
  updatedAt?: string
}
```

Behavioral expectations:
- Only return objects owned by the authenticated user (standard ownership rules).
- Filter server-side by `type` equality (case-sensitive or insensitive; frontend sends canonical uppercase strings like `HTML`).
- If no results, return an empty array `[]` with 200 OK.

---

### Examples

Curl
```
curl -s -X GET \
  -H "Authorization: Bearer <token>" \
  "/api/v1/objects?type=HTML"
```

Axios (TypeScript)
```ts
import axios from 'axios';

async function listObjectsByType(token: string, type: string) {
  const res = await axios.get(`/api/v1/objects`, {
    params: { type },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // ObjectItem[]
}
```

Fetch (TypeScript)
```ts
async function listObjectsByType(token: string, type: string) {
  const params = new URLSearchParams({ type });
  const res = await fetch(`/api/v1/objects?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json(); // ObjectItem[]
}
```

---

### Error handling

- 400 Bad Request: missing or invalid `type`.
  - `{ "success": false, "error": { "code": "INVALID_INPUT", "message": "Query param 'type' is required and must be one of: HTML, CONFIG, ..." } }`
- 401 Unauthorized: missing/invalid token.
- 500 Server Error: unexpected failures.

Frontend behavior:
- Displays a generic localized error string on failure (`Unable to load objects`).
- Shows an empty-state message if the response is `[]`.

---

### Frontend implementation reference

- Selector component: `apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector.tsx`
  - Falls back to type-only mode when `product_type_for_assembly` and `module_name_for_assembly` are not provided.
- Fetch helper: `apps/fablab/modules/object-selector/services/api_handler.ts`
  - `OBJECTS_GENERIC_ENDPOINT = '/api/v1/objects'`
  - `fetchObjectsByType(type)` issues `GET /api/v1/objects?type=<TYPE>`

No additional headers beyond Authorization are required.

---

### Optional extensions (nice-to-have)

Pagination (optional, for large datasets):
- Support `page` (1-based) and `limit` query params.
- Return either a simple array (current behavior) or an envelope:
  - `{ data: ObjectItem[], page, limit, total }`

Sorting and search (optional):
- `q` (string): fuzzy search by `name`/`title`.
- `sort` (string): e.g., `createdAt:desc` or `name:asc`.

Backward compatibility:
- Keep `/api/v1/objects/by-assembly` intact for assembly-hinted filtering. Type-only queries should continue to work via `/api/v1/objects`.
