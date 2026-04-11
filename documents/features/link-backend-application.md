# Application Deployment — Link Backend Application

This document explains how the TypeScript frontend can link a backend application to another application deployment by injecting the backend's `deployment_url` into the target deployment's `backend_url`.

Endpoint
- Method: POST
- Path: `/api/v1/application-deployment/link-backend-application`
- Auth: Requires authenticated user (ROLE_USER). Include your usual auth headers/cookies.
- Content types accepted: `application/json`, `multipart/form-data`, or `application/x-www-form-urlencoded`

Purpose
- Sets the target deployment's `backend_url` from another deployment's `deployment_url`.
- If the target has an `appName` and a valid URL, backend URL is also propagated to Dokku app config variables.

Request Body (JSON recommended)
```
{
  "backendApplicationId": number, // ID of the source deployment (provides deployment_url)
  "targetApplicationId": number   // ID of the target deployment (receives backend_url)
}
```

Successful Response
- HTTP 200
- Shape (internal standard):
```
{
  "success": true,
  "data": {
    "message": "backend_url injected" | "no change",
    "backendApplicationId": number,
    "targetApplicationId": number
  },
  "error": null,
  "meta": {}
}
```

Failure Responses
- Validation error (missing/invalid IDs): HTTP 400
```
{
  "success": false,
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "backendApplicationId and targetApplicationId are required and must be positive integers"
  },
  "meta": {}
}
```

- Domain error (e.g., source/target not found, invalid source URL): HTTP 422
```
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "invalid or missing deployment_url" // or other service message
  },
  "meta": {}
}
```

- Server error: HTTP 500 with `{ code: "SERVER_ERROR" }`.

Idempotency
- If the target's `backend_url` already equals the source `deployment_url`, the operation returns success with `message = "no change"` and still may propagate config if applicable.

TypeScript Usage Examples

Using fetch
```ts
type LinkBackendRequest = {
  backendApplicationId: number;
  targetApplicationId: number;
};

type ApiSuccess<T> = { success: true; data: T; error: null; meta?: Record<string, unknown> };
type ApiError = { success: false; data: null; error: { code: string; message: string }; meta?: Record<string, unknown> };

async function linkBackendApplication(apiBaseUrl: string, payload: LinkBackendRequest, authToken?: string) {
  const res = await fetch(`${apiBaseUrl}/api/v1/application-deployment/link-backend-application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
    credentials: 'include', // if your app relies on cookies/sessions
  });

  const json = await res.json() as ApiSuccess<{ message: string; backendApplicationId: number; targetApplicationId: number }> | ApiError;

  if (!res.ok || json.success === false) {
    const message = (json as ApiError)?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json.data; // { message, backendApplicationId, targetApplicationId }
}

// Example call
// await linkBackendApplication(import.meta.env.VITE_API_URL, { backendApplicationId: 12, targetApplicationId: 34 }, userToken);
```

Using Axios
```ts
import axios from 'axios';

export async function linkBackendApplicationAxios(apiBaseUrl: string, backendApplicationId: number, targetApplicationId: number, authToken?: string) {
  const { data } = await axios.post(
    `${apiBaseUrl}/api/v1/application-deployment/link-backend-application`,
    { backendApplicationId, targetApplicationId },
    { headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined, withCredentials: true }
  );

  if (!data?.success) {
    throw new Error(data?.error?.message || 'Linking failed');
  }
  return data.data as { message: string; backendApplicationId: number; targetApplicationId: number };
}
```

Curl Example
```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{"backendApplicationId": 12, "targetApplicationId": 34}' \
  https://<api-host>/api/v1/application-deployment/link-backend-application
```

Notes for Frontend
- Provide numeric IDs for both deployments.
- Expect `message` to be either `backend_url injected` or `no change` on success.
- CORS: use the configured origin provided by the backend (`CORS_FABLAB_ORIGIN` during tests). In production, follow deployment’s CORS policy.
- The target deployment may subsequently use its `backend_url` during future deployments; the linking here persists the value server-side.

Related Backend Components
- Controller: `ApplicationDeploymentController::linkBackendApplication()`
- Service: `ApplicationsConnectorService::injectBackendUrl()`
- Entity: `ApplicationDeployment` (`backendUrl`, `deploymentUrl`, `appName`)
