# Guía de Integración Frontend - AgroVet API

Esta guía contiene la referencia completa, estructurada y verificada para consumir los endpoints del sistema AgroVet. Todos los endpoints retornan y reciben JSON.

---

## 1. Configuración General

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Documentación Interactiva (Swagger)**: `http://localhost:3000/ui`

---

## 2. Autenticación, Seguridad y RBAC

Se emplea el esquema de seguridad **Bearer Token**.

1. **Obtener Token**: Inicia sesión usando el endpoint `/auth/login`.
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
| **Comidas (Foods)** | Solo Lectura | Full Access | Full Access |

---

## 3. Catálogo Completo de Endpoints

A continuación se listan todos los endpoints disponibles, qué envían y qué retornan.

### 🔑 Autenticación (`/auth`)

#### `POST /auth/login` (Público)
- **Descripción**: Inicia sesión y obtiene el token JWT.
- **Request Body**:
  ```json
  {
    "email": "correo@ejemplo.com",
    "password": "MiPasswordSeguro123"
  }
  ```
- **Response (200)**: `{ "token": "eyJhbGciOiJIUzI1..." }`

#### `POST /auth/signup` (Solo Admin)
- **Descripción**: Registra nuevo personal médico/administrativo.
- **Request Body**:
  ```json
  {
    "username": "Carlos Perez",
    "email": "carlos@agrovet.com",
    "password": "password123",
    "role": "veterinarian" // Valores: "veterinarian", "zootechnician"
  }
  ```
- **Response (201)**: `{ "message": "User registered successfully" }`

---

### 🐾 Animales (`/animals`)

> **Importante:** Al crear un animal, el **ID lo genera el backend**.

#### `GET /animals`
- **Descripción**: Lista todos los animales del sistema.
- **Response (200)**: Array de animales incluyendo `id`, `status` ("active"/"inactive"), `name`, `species`, etc.

#### `GET /animals/{id}`
- **Descripción**: Obtiene los detalles de un animal específico por su UUID.
- **Response (200)**: Objeto con toda la información del animal.

#### `POST /animals`
- **Descripción**: Registra un nuevo animal.
- **Request Body**:
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
- **Response (201)**: `{ "message": "Animal registered successfully" }`

#### `PUT /animals/{id}`
- **Descripción**: Actualiza los datos físicos o el estado del animal.
- **Request Body** (Opcional - envía solo lo que quieras actualizar):
  ```json
  {
    "name": "Bessie 2",
    "color": "Negro",
    "breed": "Angus",
    "status": "inactive" // Opciones: active, inactive
  }
  ```
- **Response (200)**: `{ "message": "Animal updated successfully" }`

#### `PATCH /animals/{id}/transfer`
- **Descripción**: Transfiere la propiedad del animal a otro dueño.
- **Request Body**:
  ```json
  {
    "newOwnerId": "uuid-del-nuevo-dueño"
  }
  ```
- **Response (200)**: `{ "message": "Animal ownership transferred" }`

#### `DELETE /animals/{id}`
- **Descripción**: Elimina un animal del sistema.
- **Response (200)**: `{ "message": "Animal deleted successfully" }`

---

### 🧑‍🌾 Propietarios (`/owners`)

#### `GET /owners`
- **Descripción**: Lista todos los propietarios.
- **Response (200)**: Array de objetos Propietario.

#### `GET /owners/{id}`
- **Descripción**: Obtiene un propietario por su ID.
- **Response (200)**: Detalles completos del propietario.

#### `POST /owners`
- **Descripción**: Registra un nuevo propietario.
- **Request Body**:
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
- **Response (201)**: `{ "message": "Owner registered successfully" }`

#### `PUT /owners/{id}`
- **Descripción**: Actualiza los datos de contacto de un propietario (el documento no es editable).
- **Request Body** (Datos opcionales):
  ```json
  {
    "name": "Juan Pablo Pérez",
    "phone": "+0987654321",
    "email": "juanpablo@example.com",
    "address": "Avenida Siempre Viva",
    "ownerType": "rural"
  }
  ```
- **Response (200)**: `{ "message": "Owner updated successfully" }`

#### `DELETE /owners/{id}`
- **Descripción**: Elimina a un propietario.
- **Response (200)**: `{ "message": "Owner deleted successfully" }`

#### `GET /owners/{id}/animals`
- **Descripción**: Lista todos los animales pertenecientes a un propietario.
- **Response (200)**: Array de animales.

---

### 🥗 Alimentos (`/foods`)

#### `GET /foods`
- **Descripción**: Lista todo el catálogo de alimentos disponibles.
- **Response (200)**: Array de objetos alimento.

#### `POST /foods`
- **Descripción**: Agrega un nuevo alimento al catálogo.
- **Request Body**:
  ```json
  {
    "name": "Concentrado Lechero 16%",
    "type": "Concentrado",
    "brand": "Purina",
    "nutritionalValue": "Proteína 16%, Energía 2.5 Mcal"
  }
  ```
- **Response (201)**: `{ "message": "Food registered successfully" }`

---

### 📅 Consultas / Citas (`/appointments`)

#### `GET /appointments`
- **Descripción**: Lista todas las citas médicas programadas.
- **Response (200)**: Array de citas.

#### `POST /appointments`
- **Descripción**: Programa una nueva cita.
- **Request Body**:
  ```json
  {
    "date": "2023-12-01T10:00:00Z",
    "reason": "Revisión general",
    "animalId": "uuid-del-animal",
    "status": "Scheduled" // Scheduled, Completed, Cancelled
  }
  ```
- **Response (201)**: `{ "message": "Appointment registered successfully" }`

#### `PUT /appointments/{id}`
- **Descripción**: Actualiza el estado de una cita.
- **Request Body**:
  ```json
  {
    "status": "Completed"
  }
  ```
- **Response (200)**: `{ "message": "Appointment updated successfully" }`

---

### 🩺 Gestión Clínica, Nutricional y Productiva (Sub-rutas de Animal)

Se accede a estos endpoints a través del ID del animal específico. **El backend inyecta el `id` del animal automáticamente a través de la URL**.

#### 1. Historial Médico (`/animals/{id}/history`)
- **GET**: Devuelve el historial médico del animal.
- **POST Body**:
  ```json
  {
    "date": "2023-10-01T00:00:00Z",
    "reason": "Decaimiento",
    "diagnosis": "Fiebre aftosa",
    "treatment": "Antibióticos y reposo",
    "observations": "Observar evolución en 3 días"
  }
  ```

#### 2. Vacunas (`/animals/{id}/vaccines`)
- **GET**: Devuelve el registro de vacunación.
- **POST Body**:
  ```json
  {
    "vaccineName": "Antiaftosa",
    "dose": "5ml",
    "applicationDate": "2023-10-05T00:00:00Z",
    "nextDoseDate": "2024-10-05T00:00:00Z", 
    "batchNumber": "LOTE123"
  }
  ```

#### 3. Alimentación / Dieta (`/animals/{id}/diet`)
- **GET**: Devuelve el plan de alimentación.
- **POST Body**:
  ```json
  {
    "foodId": "uuid-del-alimento",
    "quantity": 2.5,
    "frequency": "Diario",
    "startDate": "2023-10-01T00:00:00Z",
    "endDate": "2023-11-01T00:00:00Z",
    "observations": "Mezclar con forraje"
  }
  ```
  *(Nota: Asegúrate de enviar un `foodId` válido existente en `/foods`)*

#### 4. Producción (`/animals/{id}/production`)
- **GET**: Devuelve los registros de producción.
- **POST Body**:
  ```json
  {
    "type": "Leche",
    "quantity": 15.5,
    "unit": "Litros",
    "date": "2023-10-12T00:00:00Z"
  }
  ```

#### 5. Reproducción (`/animals/{id}/reproduction`)
- **GET**: Devuelve el registro reproductivo.
- **POST Body**:
  ```json
  {
    "date": "2023-11-01T00:00:00Z",
    "eventType": "Inseminación",
    "notes": "Procedimiento exitoso"
  }
  ```

---

## 4. Códigos de Estado y Manejo de Errores

El backend está programado con `zod-openapi`, por lo cual las validaciones son muy estrictas. 

- `200 / 201`: Éxito.
- `400 Bad Request`: Si fallas al enviar un Enum (ej. envías `perro` en lugar de `canine`) o te falta un dato requerido, recibirás un arreglo de `errors` detallando exactamente qué campo falló en la respuesta JSON.
- `401 Unauthorized`: No has enviado el Bearer Token, o ya expiró (dura 1 hora).
- `403 Forbidden`: Tienes un token válido, pero tu rol actual no te permite hacer la acción (ej. un Veterinario tratando de cambiar la Dieta).
- `404 Not Found`: El recurso buscado o el ID especificado en la URL no existe en la base de datos.
- `500 Internal Server Error`: Problemas con la base de datos o lógica interna.

### Recomendaciones para el Frontend
1. Extrae tus enums del backend (ej. `canine`, `urban`, `male`, `active`) en variables estáticas o types de TypeScript para tus Selects/Dropdowns. La UI puede mostrar "Canino", pero el valor enviado **debe ser** `canine`.
2. Formatea todas las fechas usando `new Date().toISOString()` antes de enviarlas al servidor.
3. El Backend asocia automáticamente a los responsables (`createdBy`, `administeredBy`) a partir del usuario logueado en base al Token JWT. ¡No intentes enviarlos en los cuerpos de las peticiones (Body)!
4. Configura interceptores en tu cliente HTTP (Axios / Fetch) para atrapar el código `401` y redirigir al usuario al login globalmente.