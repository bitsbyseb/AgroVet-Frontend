describe('Flujo E2E - Agrovet: Dueño y Animal', () => {
  const adminEmail = 'jspuentes@ucundinamarca.edu.co';
  const adminPassword = 'AgroVet2026*';

  // Variables para almacenar datos generados aleatoriamente en cada corrida
  const timestamp = new Date().getTime();
  const ownerName = `E2E Owner ${timestamp}`;
  const ownerDoc = `${timestamp}`.substring(0, 10);
  const animalName = `E2E Animal ${timestamp}`;

  before(() => {
    // 1. Login
    cy.visit('/login');
    cy.get('input#email').type(adminEmail);
    cy.get('input#password').type(adminPassword);
    cy.get('button[type="submit"]').click();

    // Verificamos que entramos al dashboard (la ruta / por defecto)
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  after(() => {
    // Opcional: Limpiar sesion
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });
  });

  it('Debe crear un dueño, asociarle un animal, eliminar el animal y luego el dueño', () => {
    // --- 2. Ir a Dueños ---
    // Asumimos que hay una navegación (sidebar) con enlace a "owners" o directamente navegamos a la url
    cy.visit('/owners');
    cy.contains('Propietarios').should('be.visible');

    // --- 3. Crear Dueño ---
    cy.contains('Nuevo Propietario').click();
    cy.url().should('include', '/owners/new');

    // Llenar formulario de Dueño
    cy.contains('label', 'Nombre Completo').next('input').type(ownerName);
    cy.contains('label', 'Documento / CC').next('input').type(ownerDoc);
    cy.contains('label', 'Teléfono').next('input').type('3001234567');
    cy.contains('label', 'Correo Electrónico').next('input').type(`e2e_${timestamp}@test.com`);
    cy.contains('label', 'Dirección').next('input').type('Calle Falsa 123');
    cy.contains('label', 'Tipo de Propietario').next('select').select('urban');
    
    // Guardar
    cy.contains('button', 'Guardar Propietario').click();

    // Verificar redirección y listado
    cy.url().should('include', '/owners');
    cy.contains(ownerName).should('be.visible');

    // --- 4. Ir a Animales ---
    cy.visit('/animals');
    cy.contains('Lista de todos los animales registrados').should('be.visible');

    // --- 5. Crear Animal ---
    cy.contains('Nuevo Registro').click();
    cy.url().should('include', '/animals/new');

    // Llenar formulario de Animal
    cy.contains('label', 'Nombre del Animal').next('input').type(animalName);
    cy.contains('label', 'Género').next('select').select('male');
    cy.contains('label', 'Especie').next('select').select('canine');
    cy.contains('label', 'Tipo de Entorno').next('select').select('urban');
    cy.contains('label', 'Raza').next('input').type('Labrador');
    cy.contains('label', 'Color').next('input').type('Dorado');
    cy.contains('label', 'Fecha de Nacimiento').next('input').type('2020-01-01');
    
    // Seleccionar propietario (podría ser por texto o value, aquí buscamos la opción por texto o esperamos a que carguen)
    // El select muestra `owner.name (owner.document)`
    cy.contains('label', 'Propietario').next('select').select(`${ownerName} (${ownerDoc})`);

    // Guardar
    cy.contains('button', 'Guardar Registro').click();

    // Verificar redirección y listado
    cy.url().should('include', '/animals');
    cy.contains(animalName).should('be.visible');

    // --- 6. Eliminar Animal ---
    // Buscamos la fila que contenga el animal y damos clic en su botón de eliminar
    cy.contains('tr', animalName).within(() => {
      // Asumimos que el botón de eliminar tiene el icono de Trash (rojo)
      // Buscamos el botón dentro de la fila. Podría no tener texto si es solo icono.
      cy.get('button.text-red-600, button[title="Eliminar"], .lucide-trash-2').first().click();
    });
    
    // Confirmar eliminación (Si hay un window.confirm o un modal)
    // Cypress acepta window.confirm por defecto, pero si es un modal del DOM hay que hacer clic:
    // Si usaron un componente modal, buscamos el botón "Eliminar" de confirmación.
    cy.get('body').then($body => {
      if ($body.find('button:contains("Eliminar")').length > 0) {
        // Asume modal
        cy.contains('button', 'Eliminar').click();
      }
    });

    // Verificar que el animal ya no existe en la tabla
    cy.contains(animalName).should('not.exist');

    // --- 7. Eliminar Dueño ---
    cy.visit('/owners');
    cy.contains('tr', ownerName).within(() => {
      // Botón de eliminar
      cy.get('button.text-red-600, button[title="Eliminar"], .lucide-trash-2').first().click();
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Eliminar")').length > 0) {
        // Asume modal
        cy.contains('button', 'Eliminar').click();
      }
    });

    cy.contains(ownerName).should('not.exist');
  });
});
