# Guía de Integración Frontend - AgroVet API

Esta guía contiene la referencia completa, estructurada y verificada para consumir los endpoints del sistema AgroVet.

---

## 1. Configuración General

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Documentación Interactiva (Swagger)**: `http://localhost:3000/ui`

---

## 2. Autenticación, Seguridad y RBAC

Se emplea el esquema de seguridad **Bearer Token**.

1. **Obtener Token**: Loguéate usando el endpoint `/auth/login`.
2. **Uso del Token**: Envía el header en cada petición:
   `Authorization: Bearer <TU_TOKEN>`

### Matriz de Permisos por Rol

| Recurso / Módulo | Veterinario | Zootecnista | Administrador |
| :--- | :--- | :--- | :--- |
| **Animales** | Full Access | Full Access | Full Access |
| **Historial Médico** | Full Access | Solo Lectura | Solo Lectura |
| **Vacunas** | Full Access | Solo Lectura | Solo Lectura |
| **Consultas** | Full Access | No | Solo Lectura |
| **Producción** | Solo Lectura | Full Access | Solo Lectura |
| **Alimentación** | No | Full Access | Solo Lectura |
| **Reproducción** | No | Full Access | Solo Lectura |
| **Propietarios** | Solo Lectura | No | Full Access |
| **Usuarios / Personal**| No | No | Full Access |

---

## 3. Catálogo de Endpoints

### 🔑 Autenticación (`/auth`)

#### 1. Iniciar Sesión (Público)
- **Método y Ruta**: `POST /auth/login`
- **Body Esperado**:
  ```json
  {
    "email": "jspuentes@ucundinamar.edu.co",
    "password": "AgroVet2026*"
  }
  ```
- **Respuesta (200)**: Devuelve un `{ "token": "..." }`.

#### 2. Registrar Personal (Solo Admin)
- **Método y Ruta**: `POST /auth/signup`
- **Body Esperado**:
  ```json
  {
    "username": "Carlos Perez",
    "email": "carlos@agrovet.com",
    "password": "password123",
    "role": "veterinarian" // Valores: "veterinarian", "zootechnician"
  }
  ```
  *(Nota: El backend bloquea intencionalmente la creación de un rol "administrator" aquí).*

---

### 🐾 Animales (`/animals`)

> **Importante:** Al crear un animal, el **ID lo genera el backend**. El frontend NO debe enviar la propiedad `id`. 

#### 1. Registrar Animal
- **Método y Ruta**: `POST /animals`
- **Body Esperado**:
  ```json
  {
    "name": "Bessie",
    "species": "bovine", // Opciones: canine, feline, bovine, caprine, equine, poultry, pig
    "animalType": "rural", // Opciones: urban, rural
    "breed": "Holstein",
    "gender": "female", // Opciones: male, female
    "birthDate": "2022-01-15T00:00:00.000Z", // Formato ISO 8601
    "color": "Blanco y Negro",
    "ownerId": "uuid-del-propietario"
  }
  ```

#### 2. Actualizar Datos Físicos del Animal
- **Método y Ruta**: `PUT /animals/{id}`
- **Body Esperado** (Envia solo lo que quieras actualizar):
  ```json
  {
    "name": "Bessie 2",
    "color": "Negro",
    "breed": "Angus",
    "status": "inactive" // Opciones: active, inactive
  }
  ```

#### 3. Transferir Dueño
- **Método y Ruta**: `PATCH /animals/{id}/transfer`
- **Body Esperado**:
  ```json
  {
    "newOwnerId": "uuid-del-nuevo-dueño"
  }
  ```

#### 4. Listar Animales
- **Método y Ruta**: `GET /animals`
- **Respuesta (200)**: Array de objetos que incluirán el `id`, el `status` por defecto ("active"), y todos sus atributos.

---

### 🧑‍🌾 Propietarios (`/owners`)

#### 1. Registrar Propietario (Solo Admin)
- **Método y Ruta**: `POST /owners`
- **Body Esperado**:
  ```json
  {
    "name": "Juan Pérez",
    "document": "1234567890",
    "phone": "+1234567890",
    "email": "juan@example.com",
    "address": "Calle Falsa 123",
    "ownerType": "urban" // Opciones: urban, rural
  }
  ```

#### 2. Actualizar Propietario
- **Método y Ruta**: `PUT /owners/{id}`
- **Body Esperado**: Igual al registro, pero **no** se envía la propiedad `document` (el número de documento no es editable).

#### 3. Ver Animales del Propietario
- **Método y Ruta**: `GET /owners/{id}/animals`
- **Respuesta (200)**: Array de animales asociados a ese ID de propietario.

---

### 🩺 Gestión Clínica, Nutricional y Productiva (Sub-rutas de Animal)

Se accede a ellos a través del ID del animal. **El backend inyecta el `id` del animal automáticamente a través de la URL**, no lo mandes en el body.

| Módulo | Creación (POST) | Lectura (GET) | Body (Ejemplo para POST) |
| :--- | :--- | :--- | :--- |
| **Historial Médico** | `/animals/{id}/history` | `/animals/{id}/history` | `{"diagnosis": "Fiebre", "treatment": "Reposo", "notes": "..."}` |
| **Vacunas** | `/animals/{id}/vaccines` | `/animals/{id}/vaccines` | `{"vaccineName": "Antirrábica", "dose": "2ml", "applicationDate": "2023-10-05"}` |
| **Alimentación** | `/animals/{id}/diet` | `/animals/{id}/diet` | `{"foodId": "uuid-comida", "quantity": 2.5, "frequency": "Diario"}` |
| **Producción** | `/animals/{id}/production`| `/animals/{id}/production` | `{"type": "Leche", "quantity": 15, "unit": "Litros", "date": "2023-11-01"}` |
| **Reproducción** | `/animals/{id}/reproduction`| `/animals/{id}/reproduction`| `{"eventType": "Inseminación", "date": "2023-12-01"}` |

---

## 4. Códigos de Estado y Manejo de Errores

El backend está programado con `zod-openapi`, por lo cual las validaciones son muy estrictas. 

- `200 / 201`: Éxito.
- `400 Bad Request`: Si fallas al enviar un Enum (ej. envías `dog` en lugar de `canine`) o te falta un dato requerido, recibirás un arreglo de `errors` detallando exactamente qué campo falló.
- `401 Unauthorized`: No has enviado el Bearer Token, o ya expiró (dura 1 hora).
- `403 Forbidden`: Tienes un token válido, pero tu rol actual no te permite hacer la acción (ej. un Veterinario tratando de cambiar la Dieta).
- `404 Not Found`: El `id` buscado en la URL no existe en la base de datos.
- `500 Internal Server Error`: Problemas con la base de datos o lógica interna.

### Recomendaciones para el Frontend (React / Angular / Vue)
1. Extrae tus enums del backend (ej. `canine`, `urban`, `male`) en variables estáticas para tus Selects/Dropdowns.
2. Formatea todas las fechas (`birthDate`, `applicationDate`, etc.) usando `toISOString()` o librerías como `date-fns` antes de enviarlas.
3. Si el usuario recibe un código `401`, usa tus interceptores de HTTP (ej. de Axios) para limpiar el estado global de Redux/Context y regresarlo a la pantalla de Login.
