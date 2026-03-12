## Notebook assembler data flow

- **PRODUCT_TYPE:** `notebook`
- **Product definition by modules**
  - `TOTAL_MODULES = 5`
  - `N_REQUIRED_MODULES = 5`
  - `SELECTABLE_MODULES = 3`
- **Assembly modules**
  1. `RAG` — `selectable: false`, `required: true`
  2. `ASSISTANT` — `selectable: false`, `required: true`
  3. `api_key` — `selectable: true`, `type: text`
  4. `chat_instruction` — `selectable: true`, `type: CONFIG`
  5. `main_visual_template` — `selectable: true`, `type: HTML`

### Input DTO example (selectable modules only)

```json
{
  "PRODUCT_TYPE": "notebook",
  "INPUT_MODULES": [
    { "index": 3, "module_name_for_assembly": "api_key", "object_id": 1 },
    { "index": 4, "module_name_for_assembly": "chat_instruction", "object_id": 2 },
    { "index": 5, "module_name_for_assembly": "main_visual_template", "object_id": 3 }
  ]
}
```

### Validation flow

1. Resolve `PRODUCT_TYPE` and load the `ASSEMBLY_MODULES` definition for `notebook`.
2. Iterate each module in `ASSEMBLY_MODULES` by index:
   - **Non‑selectable modules (`RAG`, `ASSISTANT`)**
     - Ensure the required directory or internal reference exists.
   - **Selectable modules (`api_key`, `chat_instruction`, `main_visual_template`)**
     - Locate the corresponding entry in `INPUT_MODULES` by the same index.
     - Verify `INPUT.module_name_for_assembly === MODULE.module_name_for_assembly`.
     - Fetch the object by `object_id`.
     - Validate:
       - Object exists.
       - `object.type === MODULE.type`.
       - `object.product_type_for_assembly === PRODUCT_TYPE`.
       - `object.module_name_for_assembly === MODULE.module_name_for_assembly`.

### Assembly logic

1. After all modules pass validation, execute the `notebook` product logic.
2. The assembler service creates the assembled product and generates its directory.