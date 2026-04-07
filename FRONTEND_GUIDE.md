# Guía de Integración Frontend - AgroVet API

Esta guía contiene toda la información necesaria para consumir los servicios del backend de AgroVet.

## 1. Configuración General

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Documentación Interactiva**: `http://localhost:3000/ui` (Swagger)

---

## 2. Autenticación y Seguridad

La mayoría de los endpoints están protegidos. Se utiliza el esquema **Bearer Token**.

1. **Obtener Token**: Realizar login en `/auth/login`.
2. **Uso**: Incluir el token en el header de cada petición:
   `Authorization: Bearer <TU_TOKEN_JWT>`

### Roles y Permisos (RBAC)

| Recurso | Veterinario | Zootecnista | Administrador |
| :--- | :--- | :--- | :--- |
| **Animales** | Full Access | Full Access | Full Access |
| **Historial Médico** | Full Access | Solo Lectura | Solo Lectura |
| **Vacunas** | Full Access | Solo Lectura | Solo Lectura |
| **Consultas** | Full Access | No | Solo Lectura |
| **Producción** | Solo Lectura | Full Access | Solo Lectura |
| **Alimentación** | No | Full Access | Solo Lectura |
| **Reproducción** | No | Full Access | Solo Lectura |
| **Propietarios** | Solo Lectura | No | Full Access |
| **Usuarios** | No | No | Full Access |

---

## 3. Endpoints de Autenticación (`/auth`)

### Login
- **Método**: `POST /auth/login`
- **Público**: Sí
- **Request Body**:
```json
{
  "email": "jspuentes@ucundinamar.edu.co",
  "password": "AgroVet2026*"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbG..."
}
```

### Registro de Usuario
- **Método**: `POST /auth/signup`
- **Protegido**: Sí (Solo ADMINISTRADOR)
- **Regla Especial**: Solo se pueden crear cuentas de tipo Veterinario o Zootecnista. No se pueden crear Administradores por aquí.
- **Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@agrovet.com",
  "password": "password123",
  "role": "veterinarian" // Valores permitidos: "veterinarian", "zootechnician"
}
```

---

## 4. Endpoints de Animales (`/animals`)

### Listar Animales
- **Método**: `GET /animals`
- **Protegido**: Sí (Todos los roles)
- **Response**: Array de objetos Animal.

### Registrar Animal
- **Método**: `POST /animals`
- **Request Body**:
```json
{
  "name": "Bessie",
  "species": "Bovino",
  "breed": "Holstein",
  "birthDate": "2022-01-15",
  "ownerId": "uuid-propietario"
}
```

### Gestión Clínica y Nutricional (Sub-rutas)
- **Historial Médico**: `GET` / `POST` `/animals/:id/history`
- **Vacunas**: `GET` / `POST` `/animals/:id/vaccines`
- **Dietas**: `GET` / `POST` `/animals/:id/diet`
- **Producción**: `GET` / `POST` `/animals/:id/production`
- **Reproducción**: `GET` / `POST` `/animals/:id/reproduction`

*(Recuerda revisar la tabla de permisos RBAC para saber qué rol puede hacer POST en cada ruta).*

---

## 5. Endpoints de Propietarios (`/owners`)

### Listar Propietarios
- **Método**: `GET /owners`
- **Protegido**: Sí (Veterinario: Lectura / Admin: Full)

### Registrar Propietario
- **Método**: `POST /owners`
- **Protegido**: Sí (Solo Administrador)
- **Request Body**:
```json
{
  "name": "Juan Pérez",
  "document": "1234567890",
  "phone": "+1234567890",
  "email": "juan@example.com",
  "address": "Calle Falsa 123",
  "ownerType": "urban" // Valores permitidos: "urban", "rural"
}
```

---

## 6. Manejo de Errores

El backend responde con códigos HTTP estándar:
- `400 Bad Request`: Error en los datos enviados o validación de formulario fallida.
- `401 Unauthorized`: Token faltante o expirado.
- `403 Forbidden`: El usuario no tiene el rol necesario para esta acción.
- `404 Not Found`: El recurso o ID solicitado no existe.

### Formato de Error de Validación
Cuando envías datos incorrectos, el backend responde así (útil para mapear errores en formularios):
```json
{
  "errors": [
    "password must be at least 10 characters long",
    "email is invalid"
  ]
}
```
O en errores de lógica de negocio general:
```json
{
  "error": "User is already in the system"
}
```

---

## 7. Consejos para el Frontend

1. **Persistencia**: Guarda el token en `localStorage` o `sessionStorage`.
2. **Intercepción de Peticiones**: Usa algo como Axios Interceptors para añadir automáticamente el header `Authorization: Bearer <token>` a todas las llamadas.
3. **Manejo de Expiración**: El token dura 1 hora. Si el backend responde `401`, limpia el `localStorage` y redirige al usuario a la pantalla de login.
4. **UI Dinámica**: Puedes decodificar el JWT en el frontend (con librerías como `jwt-decode`) para obtener el rol del usuario actual. Úsalo para ocultar botones o menús a los que no tienen permiso (por ejemplo, ocultar el botón "Nuevo Propietario" si no es administrador).