NOTEBOOK SOURCES ENDPOINTS (FRONTEND SPEC)

This document explains how the frontend should consume the notebook sources endpoints. Use the backend base URL from `BACKEND_URL` (e.g., `http://localhost:8000`). All paths below are appended to that base.

## Endpoints

### 1) List sources by notebook/tool id (REST controller)
- **URL:** `/api/v1/notebook-sources?note_book_id={toolId}` (alternative: `?tool_id={toolId}`)
- **Method:** `GET`
- **Purpose:** Retrieve all sources belonging to the notebook whose `tool_id` equals the provided id.
- **Headers:**
  - `Authorization: Bearer <token>` (required if API is secured as usual)

**Success response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "User guide",
      "type": "DOC",
      "filePath": "http://localhost:8000/uploads/note_books/note_book_sources/25/doc/user-guide-123.pdf",
      "createdAt": "2026-01-30T12:00:00+00:00"
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-01-30T12:00:00+00:00",
    "requestId": "<uuid>"
  }
}
```

**Error examples:**
- Missing id → 400 with `{ success: false, error: { code: "MISSING_FIELD", message: "note_book_id or tool_id is required" } }`
- Notebook not found → 404 with `{ success: false, error: { code: "NOT_FOUND", message: "Notebook not found" } }`

### 2) List sources by notebook/tool id (Api Platform nested)
- **URL:** `/api/note_books/{noteBookId}/sources`
- **Method:** `GET`
- **Purpose:** Same payload as above, resolved by the nested Api Platform provider.
- **Headers:** `Authorization: Bearer <token>` if required.

### 3) Create a source for a notebook/tool
- **URL:** `/api/v1/notebook-sources`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `note_book_id` (number, required) — notebook/tool id.
  - `type` (string, required) — one of `DOC | IMAGE | VIDEO | TEXT | WEBSITE | HTML` (case-insensitive; backend uppercases).
  - `name` (string, required).
  - `stream_file` (file, optional for `WEBSITE`, `HTML`, `TEXT`, `VIDEO`; required for `DOC` and `IMAGE`).
- **Headers:** `Authorization: Bearer <token>` if required.

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "id": 13,
    "name": "Dataset",
    "type": "DOC",
    "filePath": "http://localhost:8000/uploads/note_books/note_book_sources/25/doc/dataset-abc.pdf",
    "createdAt": "2026-01-30T12:00:00+00:00"
  },
  "error": null,
  "meta": {
    "timestamp": "2026-01-30T12:00:00+00:00",
    "requestId": "<uuid>"
  }
}
```

**Validation errors:**
- Missing file when type requires it → 400 with `{ success: false, error: { code: "MISSING_FIELD", message: "File is required for this source type" } }`
- Invalid type or file extension → 400 with `{ success: false, error: { code: "INVALID_INPUT", message: "..." } }`
- Notebook not found → 404 with `{ success: false, error: { code: "NOT_FOUND", message: "Notebook not found" } }`

## Notes for frontend implementation
1. Always compose requests using the runtime `BACKEND_URL` provided by environment/manifest.
2. Use `filePath` directly to render or download the source; backend already returns full URLs.
3. Keep requests wrapped by the shared HTTP client; components must not call `fetch` directly.
4. For uploads, ensure `FormData` is used and no manual `Content-Type` header is set (let the browser handle boundaries).
5. Handle `success` flag and `error` object according to the standard API response contract shown above.