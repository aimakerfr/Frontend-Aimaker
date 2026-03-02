 # Application Deployment API (v1)
 
 This document describes the REST endpoints that manage the lifecycle of an Application Deployment: creation, file upload, and deployment. These endpoints are implemented by `App\\Controller\\Api\\V1\\ApplicationDeploymentController` and are prefixed with:
 
 - Base path: `/api/v1/application-deployment`
 
 All endpoints require an authenticated user with `ROLE_USER` and enforce ownership checks where applicable.
 
 ## Related Database Schema
 
 The underlying table created in `database/001_init.sql`:
 
 ```
 CREATE TABLE `application_deployment` (
   `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
   `maker_path_id`  INT                   DEFAULT NULL,
   `files_url`      VARCHAR(500)          DEFAULT NULL,
   `deployment_url` VARCHAR(500)          DEFAULT NULL,
   `database_url`   VARCHAR(500)          DEFAULT NULL,
   `data_base_name` VARCHAR(140)          DEFAULT NULL,
   `app_name`       VARCHAR(140)          DEFAULT NULL,
   `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `idx_application_deployment__maker_path_id` (`maker_path_id`),
   CONSTRAINT `fk_application_deployment__maker_path_id__maker_path__id`
       FOREIGN KEY (`maker_path_id`) REFERENCES `maker_path` (`id`)
       ON UPDATE CASCADE ON DELETE SET NULL
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 ```
 
 Key fields exposed by the API: `id`, `maker_path_id`, `files_url`, `deployment_url`, `database_url`, `data_base_name`, `app_name`.
 
 ## Authentication and Authorization
 
 - All routes require `IS_AUTHENTICATED_FULLY` and `ROLE_USER`.
 - For operations on an existing ApplicationDeployment (upload files, deploy):
   - The current user must be the owner of the associated `MakerPath` or be the admin user (ID = 2, as per controller logic).
   - If not owner/admin, the API returns `403 Access denied`.
 
 Include your authentication (e.g., session cookie or bearer token) in requests. Example with bearer token:
 
 ```
 Authorization: Bearer <token>
 ```
 
 ## Content Types
 
 - JSON requests: `Content-Type: application/json`
 - Form requests (including uploads): `multipart/form-data`
 
 The controller accepts both JSON and form-data for simple fields. For file uploads, use `multipart/form-data`.
 
 ---
 
 ## 1) Create a new ApplicationDeployment
 
 POST `/api/v1/application-deployment/new`
 
 Creates a new deployment record. Optionally links it to an existing `MakerPath` you own.
 
 Request body (JSON or form-data):
 - `maker_path_id` | `makerPathId` (optional, integer) — ID of an existing MakerPath. If provided, you must be its owner (or admin).
 
 Responses:
 - 201 Created
   - Payload:
     ```json
     {
       "deployment": {
         "id": 123,
         "maker_path_id": 45,
         "files_url": null,
         "deployment_url": null,
         "database_url": null,
         "data_base_name": null,
         "app_name": null
       }
     }
     ```
 - 400 Bad Request — invalid `maker_path_id` (non-integer)
 - 403 Forbidden — user is not the owner/admin of the provided MakerPath
 - 404 Not Found — MakerPath does not exist
 - 500 Server Error — unexpected error
 
 Example (JSON):
 
 ```bash
 curl -X POST "http://localhost:8000/api/v1/application-deployment/new" \
   -H "Authorization: Bearer $TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"maker_path_id": 45}'
 ```
 
 Example (form-data):
 
 ```bash
 curl -X POST "http://localhost:8000/api/v1/application-deployment/new" \
   -H "Authorization: Bearer $TOKEN" \
   -F maker_path_id=45
 ```
 
 ---
 
 ## 2) Upload project files for a deployment
 
 POST `/api/v1/application-deployment/upload-files`
 
 Uploads one or more files associated with an existing ApplicationDeployment.
 
 Required fields (form-data or JSON for the id):
 - `application_deployment_id` (integer) — ID of the deployment to receive the files
   - Accepted aliases: `deployment_id`, `applicationDeploymentId`
 
 Files (multipart/form-data):
 - Use `files` as the field name. You can submit either a single file or multiple files:
   - Single file: `-F files=@/path/to/file.zip`
   - Multiple files: `-F files[]=@/path/a -F files[]=@/path/b`
 
 Notes on accepted structures:
 - The controller will also recognize nested Symfony form keys such as `project_upload_type_form[files]` or `project_upload_new_type_form[files]`. Prefer using a flat `files` or `files[]` field unless integrating with those specific forms.
 
 Authorization/ownership:
 - You must be the owner of the linked `MakerPath` or admin user (ID=2).
 
 Responses:
 - 201 Created
   - Payload:
     ```json
     {
       "success": true,
       "application_deployment_id": 123,
       "files_url": "https://example.com/uploads/deployments/123",
       "uploaded_files": 2,
       "relative_url": "/uploads/deployments/123"
     }
     ```
 - 400 Bad Request — missing/invalid `application_deployment_id`, or no files provided, or upload failed (message in `error`)
 - 403 Forbidden — access denied (not owner/admin)
 - 404 Not Found — ApplicationDeployment does not exist
 - 500 Server Error — unexpected error
 
 Example (multiple files):
 
 ```bash
 curl -X POST "http://localhost:8000/api/v1/application-deployment/upload-files" \
   -H "Authorization: Bearer $TOKEN" \
   -F application_deployment_id=123 \
   -F files[]=@/tmp/app.tar.gz \
   -F files[]=@/tmp/Dockerfile
 ```
 
 Example (single file, alias field):
 
 ```bash
 curl -X POST "http://localhost:8000/api/v1/application-deployment/upload-files" \
   -H "Authorization: Bearer $TOKEN" \
   -F deployment_id=123 \
   -F files=@/tmp/app.zip
 ```
 
 ---
 
 ## 3) Trigger deployment
 
 POST `/api/v1/application-deployment/deploy`
 
 Triggers the deployment process for an existing ApplicationDeployment.
 
 Required fields (JSON or form-data):
 - `application_deployment_id` (integer) — ID of the deployment
   - Accepted aliases: `deployment_id`, `applicationDeploymentId`
 
 Optional fields:
 - `department` (string) — optional hint used by the deployment manager (free-form string; if not provided, the manager applies defaults/detection internally)
 
 Authorization/ownership:
 - You must be the owner of the linked `MakerPath` or admin user (ID=2).
 
 Responses:
 - 200 OK — when the deploy manager returns `status: "success"`
   - Payload:
     ```json
     {
       "status": "success",
       "message": "Deployment completed",
       "detected_category": "default",
       "deploy_url": "https://myapp.example.com",
       "application_deployment_id": 123
     }
     ```
 - 400 Bad Request — when the deploy manager reports a failure (same payload fields, with `status != "success"`)
 - 400 Bad Request — missing/invalid `application_deployment_id`
 - 403 Forbidden — access denied (not owner/admin)
 - 404 Not Found — ApplicationDeployment does not exist
 - 500 Server Error — unexpected error
 
 Example (JSON):
 
 ```bash
 curl -X POST "http://localhost:8000/api/v1/application-deployment/deploy" \
   -H "Authorization: Bearer $TOKEN" \
   -H "Content-Type: application/json" \
   -d '{
     "application_deployment_id": 123,
     "department": "webapps"
   }'
 ```
 
 Example (form-data):
 
 ```bash
 curl -X POST "http://localhost:8000/api/v1/application-deployment/deploy" \
   -H "Authorization: Bearer $TOKEN" \
   -F applicationDeploymentId=123 \
   -F department=webapps
 ```
 
 ---
 
 ## Error format
 
 When a request is rejected by validation helpers, typical error responses look like:
 
 ```json
 {
   "error": "<message>",
   "code": "BAD_REQUEST"
 }
 ```
 
 Other errors may return `{ "error": "Server error", "code": "SERVER_ERROR" }` with status 500.
 
 ---
 
 ## Implementation Notes (for integrators)
 
 - Request parsing: The controller supports both `application/json` and `multipart/form-data`. For JSON, payload is read from the raw body; otherwise Symfony's form parsing is used.
 - File extraction: Uploaded files are read from `files` or `files[]` fields. If integrating via one of the existing Symfony forms, `project_upload_type_form[files]` and `project_upload_new_type_form[files]` are also recognized.
 - Ownership check: For upload/deploy, the controller compares the current user ID with `MakerPath->User->id`. Admin user ID `2` bypasses this check.
 - Response fields are populated from `ApplicationDeploymentManager` results:
   - Upload: `success`, `files_url`, `uploaded_files`, `relative_url`
   - Deploy: `status`, `message`, `detected_category`, `deploy_url`
 
 If you need to persist or display deployment metadata, the `application_deployment` table columns above indicate what may be available after manager actions (e.g., `files_url`, `deployment_url`).