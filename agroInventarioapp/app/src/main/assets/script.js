
    function activarSonido() {
        let video = document.getElementById("videoFondo");
        let boton = document.querySelector(".btn-sonido");

        // Toggle: si está muted, lo desmutea; si no está muted, lo mutea
        if (video.muted) {
            video.muted = false;
            video.play();
            boton.textContent = "🔇 Detener música";
        } else {
            video.muted = true;
            boton.textContent = "🔊 Activar música";
        }
    }

    // Función para mostrar/ocultar contraseña
    const mostrarContrasenaCheckbox = document.getElementById('mostrarContrasena');
    if (mostrarContrasenaCheckbox) {
        mostrarContrasenaCheckbox.addEventListener('change', function() {
            let inputContrasena = document.getElementById('contrasena');
            if (inputContrasena) {
                inputContrasena.type = this.checked ? 'text' : 'password';
            }
        });
    }

// --- NAVEGACIÓN ---
function hideAll() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('recover-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}
function showLogin() { hideAll(); document.getElementById('login-section').style.display = 'block'; }
function showRegister() { hideAll(); document.getElementById('register-section').style.display = 'block'; }
function showRecover() { hideAll(); document.getElementById('recover-section').style.display = 'block'; }

// CORREGIDO: Ahora incluye 'staff' y limpia secciones correctamente
function showModule(name) {
    document.getElementById('welcome-msg').style.display = 'none';
    document.querySelectorAll('.module-section').forEach(s => s.style.display = 'none');

    const section = document.getElementById('mod-' + name);
    if(section) section.style.display = 'block';

    if(name === 'crops') renderCrops();
    if(name === 'warehouse') renderWarehouse();
    if(name === 'harvests') renderHarvests();
    if(name === 'animals') renderAnimals();
    if(name === 'staff') renderStaff(); // <-- Línea agregada
}

// --- AUTENTICACIÓN CON SERVICIO WEB ---
/**
 * URL base del servicio web (cambiar si está en otro host)
 */
const API_URL = 'http://192.168.1.9:3000/api/auth';
const API_BASE = 'http://192.168.1.9:3000/api';
let currentCropList = [];

/**
 * Registra un nuevo usuario mediante el servicio web
 * Validaciones: nombre, email válido, contraseña mínimo 6 caracteres
 */
async function registerUser() {
    try {
        const nombre = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const contraseña = document.getElementById('reg-pass').value;

        // Validar campos obligatorios
        if(!nombre || !email || !contraseña) {
            return alert("❌ Error: Completa todos los campos");
        }

        // Validar que la contraseña tenga mínimo 6 caracteres
        if(contraseña.length < 6) {
            return alert("❌ Error: La contraseña debe tener al menos 6 caracteres");
        }

        // Mostrar indicador de carga
        const boton = event.target;
        const textOriginal = boton.textContent;
        boton.disabled = true;
        boton.textContent = "Registrando...";

        // Enviar petición al servicio web
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                email: email,
                contraseña: contraseña
            })
        });

        // Procesar respuesta
        const data = await response.json();

        if (data.success) {
            alert("✅ " + data.message);
            // Limpiar formulario
            document.getElementById('reg-name').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-pass').value = '';
            // Ir a login
            showLogin();
        } else {
            alert("❌ " + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert("❌ Error de conexión: Verifica que el servidor esté ejecutándose en http://localhost:3000");
    } finally {
        // Restaurar botón
        const boton = event.target;
        boton.disabled = false;
        boton.textContent = "Registrarse";
    }
}

/**
 * Inicia sesión de usuario mediante el servicio web
 * Si la autenticación es correcta, muestra el dashboard
 * Si falla, muestra mensaje de error
 */
async function loginUser() {
    try {
        const email = document.getElementById('login-email').value.trim();
        const contraseña = document.getElementById('login-password').value;

        // Validar campos obligatorios
        if(!email || !contraseña) {
            return alert("❌ Error: Completa email y contraseña");
        }

        // Mostrar indicador de carga
        const boton = event.target;
        boton.disabled = true;
        boton.textContent = "Ingresando...";

        // Enviar petición al servicio web
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                contraseña: contraseña
            })
        });

        // Procesar respuesta
        const data = await response.json();

        if (data.success) {
            // Autenticación satisfactoria
            alert("✅ " + data.message);

            // Guardar usuario en localStorage
            localStorage.setItem('currentUser', JSON.stringify(data.usuario));

            // Limpiar formulario
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';

            // Mostrar dashboard
            hideAll();
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('user-display').innerText = data.usuario.nombre;
        } else {
            // Error en autenticación
            alert("❌ " + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert("❌ Error de conexión: Verifica que el servidor esté ejecutándose en http://localhost:3000");
    } finally {
        // Restaurar botón
        const boton = event.target;
        boton.disabled = false;
        boton.textContent = "Ingresar";
    }
}

/**
 * Cierra la sesión del usuario actual
 */
function logout() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        localStorage.removeItem('currentUser');
        showLogin();
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        alert("✅ Sesión cerrada correctamente");
    }
}

// --- LÓGICA DE DATOS ---

// Cultivos
async function saveCrop(e) {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser || !currentUser.id) {
        return alert('Debes iniciar sesión para guardar un cultivo.');
    }

    const tipo = document.getElementById('crop-type').value.trim();
    const area = document.getElementById('crop-area').value;
    const fecha_siembra = document.getElementById('crop-date').value;
    const fecha_cosecha = document.getElementById('crop-harvest-date').value;
    const produccion_esperada = document.getElementById('crop-expected-yield').value;
    const estado = document.getElementById('crop-status').value;

    if (!tipo || !area || !fecha_siembra || !fecha_cosecha || !produccion_esperada) {
        return alert('Completa todos los campos requeridos para guardar el cultivo.');
    }

    try {
        const response = await fetch(`${API_BASE}/cultivos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                tipo,
                area: Number(area),
                fecha_siembra,
                fecha_cosecha,
                produccion_esperada: Number(produccion_esperada),
                estado
            })
        });

        const data = await response.json();

        if (!data.success) {
            return alert('Error al guardar el cultivo: ' + data.message);
        }

        alert('✅ Cultivo guardado correctamente.');
        e.target.reset();
        document.getElementById('hectares-display').innerText = '0.0000';
        document.getElementById('crop-area-hectares').value = '';
        await renderCrops();
    } catch (error) {
        console.error('Error guardando cultivo:', error);
        alert('Error de conexión: no se pudo guardar el cultivo.');
    }
}

async function renderCrops() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let list = [];

    if (currentUser && currentUser.id) {
        try {
            const response = await fetch(`${API_BASE}/cultivos?usuario_id=${currentUser.id}`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                list = data.data.map(i => ({
                    id: i.id,
                    usuario_id: i.usuario_id,
                    type: i.tipo,
                    area: i.area,
                    date: i.fecha_siembra,
                    harvestDate: i.fecha_cosecha,
                    expectedYield: i.produccion_esperada,
                    status: i.estado,
                    insumos: i.insumos || [],
                    labores: i.labores || []
                }));
            }
        } catch (error) {
            console.error('Error cargando cultivos:', error);
        }
    }

    currentCropList = list;
    document.getElementById('table-crops').innerHTML = list.map(i => {
        const statusClass = getStatusClass(i);
        const insumosCount = i.insumos ? i.insumos.length : 0;
        const laboresCount = i.labores ? i.labores.length : 0;
        const areaHectares = parseFloat(i.area) / 10000;
        return `<tr>
            <td onclick="openEditCropModal(${i.id})" style="cursor:pointer;">${i.type}</td>
            <td onclick="openEditCropModal(${i.id})" style="cursor:pointer;">${i.area} m²<br><small style=\"color: #666;\">(${areaHectares.toFixed(2)} ha)</small></td>
            <td onclick="openEditCropModal(${i.id})" style="cursor:pointer;">${i.date}</td>
            <td onclick="openEditCropModal(${i.id})" style="cursor:pointer;"><span class="status-semaphore ${statusClass}">${i.status}</span></td>
            <td onclick="openEditCropModal(${i.id})" style="cursor:pointer;">${i.expectedYield || 0} kg</td>
            <td>
                <button class="btn-insumos" onclick="openInsumosModal(${i.id})">📦 Insumos (${insumosCount})</button>
            </td>
            <td>
                <button class="btn-labores" onclick="openLaboresModal(${i.id})">📋 Labores (${laboresCount})</button>
            </td>
            <td>
                <button class="btn-edit" onclick="openEditCropModal(${i.id})">✏️ Editar</button>
                <button class="btn-delete" onclick="deleteItem('crops', ${i.id})">X</button>
            </td>
        </tr>`;
    }).join('');
}

function openEditCropModal(cropId) {
    const crop = currentCropList.find(c => c.id == cropId);
    if (!crop) return;

    document.getElementById('edit-crop-id').value = crop.id;
    document.getElementById('edit-crop-type').value = crop.type || '';
    document.getElementById('edit-crop-area').value = crop.area || '';
    document.getElementById('edit-crop-date').value = crop.date || '';
    document.getElementById('edit-crop-harvest-date').value = crop.harvestDate || '';
    document.getElementById('edit-crop-expected-yield').value = crop.expectedYield || '';
    document.getElementById('edit-crop-status').value = crop.status || 'Siembra';

    document.getElementById('edit-crop-modal').style.display = 'block';
}

function closeEditCropModal() {
    document.getElementById('edit-crop-modal').style.display = 'none';
}

async function saveCropEdit(e) {
    e.preventDefault();
    const id = Number(document.getElementById('edit-crop-id').value);
    const crop = currentCropList.find(c => c.id === id);
    if (!crop) return;

    const tipo = document.getElementById('edit-crop-type').value.trim();
    const area = Number(document.getElementById('edit-crop-area').value);
    const fecha_siembra = document.getElementById('edit-crop-date').value;
    const fecha_cosecha = document.getElementById('edit-crop-harvest-date').value;
    const produccion_esperada = Number(document.getElementById('edit-crop-expected-yield').value);
    const estado = document.getElementById('edit-crop-status').value;

    if (!tipo || !area || !fecha_siembra || !fecha_cosecha || isNaN(produccion_esperada)) {
        return alert('Completa todos los campos para editar el cultivo.');
    }

    try {
        const response = await fetch(`${API_BASE}/cultivos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: crop.usuario_id,
                tipo,
                area,
                fecha_siembra,
                fecha_cosecha,
                produccion_esperada,
                estado
            })
        });

        const data = await response.json();
        if (!data.success) {
            return alert('Error al actualizar el cultivo: ' + data.message);
        }

        alert('✅ Cultivo actualizado correctamente.');
        closeEditCropModal();
        await renderCrops();
    } catch (error) {
        console.error('Error actualizando cultivo:', error);
        alert('Error de conexión: no se pudo actualizar el cultivo.');
    }
}

// Sistema de Semáforo
function getStatusClass(crop) {
    const today = new Date();
    const plantDate = new Date(crop.date);
    const harvestDate = crop.harvestDate ? new Date(crop.harvestDate) : null;
    const daysSincePlanting = Math.floor((today - plantDate) / (1000 * 60 * 60 * 24));

    if (crop.status === 'Siembra') return 'verde';
    if (crop.status === 'Crecimiento') return 'verde';
    if (crop.status === 'Mantenimiento') return 'amarillo';
    if (crop.status === 'Cosecha Próxima') return 'rojo';

    // Lógica automática basada en tiempo
    if (harvestDate) {
        const daysToHarvest = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24));
        if (daysToHarvest <= 7) return 'rojo'; // Menos de 7 días para cosecha
    }

    if (daysSincePlanting > 30) return 'amarillo'; // Necesita mantenimiento
    return 'verde'; // Recién sembrado
}

// Calculadora de Densidad
function calculatePlantDensity() {
    const area = parseFloat(document.getElementById('crop-area').value) || 0;
    const distPlantas = parseFloat(document.getElementById('calc-dist-plantas').value) / 100; // Convertir cm a m
    const distSurcos = parseFloat(document.getElementById('calc-dist-surcos').value) / 100; // Convertir cm a m

    if (!area || !distPlantas || !distSurcos) {
        document.getElementById('density-result').innerText = 'Complete todos los campos';
        return;
    }

    const plantasPorSurco = Math.floor(area / distSurcos);
    const plantasTotal = Math.floor(plantasPorSurco / distPlantas);

    const areaHectares = area / 10000;
    document.getElementById('density-result').innerText =
        `🌱 Caben aproximadamente ${plantasTotal.toLocaleString()} plantas en ${area.toLocaleString()} m² (${areaHectares.toFixed(2)} ha)`;
}

function clearDensityCalculator() {
    document.getElementById('calc-dist-plantas').value = '';
    document.getElementById('calc-dist-surcos').value = '';
    document.getElementById('density-result').innerText = '';
}

// Gestión de Insumos
function openInsumosModal(cropId) {
    const modal = document.getElementById('insumos-modal');
    const cropSelect = document.getElementById('insumo-crop-select');
    const insumoSelect = document.getElementById('insumo-select');

    // Llenar select de cultivos
    const crops = JSON.parse(localStorage.getItem('crops')) || [];
    cropSelect.innerHTML = crops.map(c => {
        const areaHa = (parseFloat(c.area) / 10000).toFixed(2);
        return `<option value="${c.id}" ${c.id == cropId ? 'selected' : ''}>${c.type} - ${c.area}m² (${areaHa}ha)</option>`;
    }).join('');

    // Llenar select de insumos disponibles
    const warehouse = JSON.parse(localStorage.getItem('warehouse')) || [];
    insumoSelect.innerHTML = '<option value="">Seleccionar insumo</option>' +
        warehouse.filter(w => parseFloat(w.qty) > 0).map(w => `<option value="${w.id}">${w.name} (${w.qty} ${w.unit})</option>`).join('');

    modal.style.display = 'block';
    modal.dataset.cropId = cropId;
}

function closeInsumosModal() {
    document.getElementById('insumos-modal').style.display = 'none';
}

function applyInsumo() {
    const cropId = document.getElementById('insumos-modal').dataset.cropId;
    const insumoId = document.getElementById('insumo-select').value;
    const quantity = parseFloat(document.getElementById('insumo-quantity').value);
    const date = document.getElementById('insumo-date').value;

    if (!insumoId || !quantity || !date) {
        alert('Complete todos los campos');
        return;
    }

    // Verificar stock disponible
    const warehouse = JSON.parse(localStorage.getItem('warehouse')) || [];
    const insumo = warehouse.find(w => w.id == insumoId);

    if (!insumo || parseFloat(insumo.qty) < quantity) {
        alert('Stock insuficiente');
        return;
    }

    // Restar del inventario
    insumo.qty = (parseFloat(insumo.qty) - quantity).toString();
    localStorage.setItem('warehouse', JSON.stringify(warehouse));

    // Agregar al historial del cultivo
    const crops = JSON.parse(localStorage.getItem('crops')) || [];
    const crop = crops.find(c => c.id == cropId);
    if (crop) {
        if (!crop.insumos) crop.insumos = [];
        crop.insumos.push({
            id: Date.now(),
            insumoId: insumoId,
            insumoName: insumo.name,
            quantity: quantity,
            unit: insumo.unit,
            date: date
        });
        localStorage.setItem('crops', JSON.stringify(crops));
    }

    closeInsumosModal();
    renderCrops();
    renderWarehouse();
}

// Gestión de Labores
function openLaboresModal(cropId) {
    const modal = document.getElementById('labores-modal');
    const crops = JSON.parse(localStorage.getItem('crops')) || [];
    const crop = crops.find(c => c.id == cropId);
    const employeeSelect = document.getElementById('labor-employee');

    // Llenar select de trabajadores
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    employeeSelect.innerHTML = '<option value="">Seleccionar trabajador</option>' +
        employees.map(emp => `<option value="${emp.id}">${emp.name} (${emp.cargo})</option>`).join('');

    if (crop && crop.labores) {
        const laboresHtml = crop.labores.map(l =>
            `<div style="padding: 8px; border-bottom: 1px solid #eee;">
                <strong>${l.date}:</strong> ${l.description}<br>
                <small style="color:#555;">Trabajador: ${l.workerName || 'No asignado'}</small>
                <button onclick="deleteLabor(${cropId}, ${l.id})" style="float:right; background:red; color:white; border:none; padding:2px 6px; border-radius:3px;">X</button>
            </div>`
        ).join('');
        document.getElementById('labores-list').innerHTML = laboresHtml || '<p>No hay labores registradas</p>';
    } else {
        document.getElementById('labores-list').innerHTML = '<p>No hay labores registradas</p>';
    }

    document.getElementById('labor-date').value = '';
    document.getElementById('labor-description').value = '';
    document.getElementById('labor-employee').value = '';
    modal.style.display = 'block';
    modal.dataset.cropId = cropId;
}

function closeLaboresModal() {
    document.getElementById('labores-modal').style.display = 'none';
}

function addLabor() {
    const cropId = document.getElementById('labores-modal').dataset.cropId;
    const date = document.getElementById('labor-date').value;
    const description = document.getElementById('labor-description').value;
    const workerId = document.getElementById('labor-employee').value;

    if (!date || !description || !workerId) {
        alert('Complete fecha, descripción y trabajador responsable');
        return;
    }

    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const worker = employees.find(emp => emp.id == workerId);

    const crops = JSON.parse(localStorage.getItem('crops')) || [];
    const crop = crops.find(c => c.id == cropId);
    if (crop) {
        if (!crop.labores) crop.labores = [];
        crop.labores.push({
            id: Date.now(),
            date: date,
            description: description,
            workerId: workerId,
            workerName: worker ? worker.name : 'Desconocido'
        });
        localStorage.setItem('crops', JSON.stringify(crops));
    }

    document.getElementById('labor-date').value = '';
    document.getElementById('labor-description').value = '';
    document.getElementById('labor-employee').value = '';
    openLaboresModal(cropId); // Recargar la lista
}

function deleteLabor(cropId, laborId) {
    const crops = JSON.parse(localStorage.getItem('crops')) || [];
    const crop = crops.find(c => c.id == cropId);
    if (crop && crop.labores) {
        crop.labores = crop.labores.filter(l => l.id != laborId);
        localStorage.setItem('crops', JSON.stringify(crops));
        openLaboresModal(cropId); // Recargar la lista
    }
}

// Bodega
function saveWarehouse(e) {
    e.preventDefault();
    const data = { id: Date.now(), name: document.getElementById('wh-name').value, qty: document.getElementById('wh-qty').value, unit: document.getElementById('wh-unit').value };
    let list = JSON.parse(localStorage.getItem('warehouse')) || [];
    list.push(data);
    localStorage.setItem('warehouse', JSON.stringify(list));
    e.target.reset(); renderWarehouse();
}
function renderWarehouse() {
    const list = JSON.parse(localStorage.getItem('warehouse')) || [];
    document.getElementById('table-warehouse').innerHTML = list.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unit}</td><td><button class="btn-delete" onclick="deleteItem('warehouse', ${i.id})">X</button></td></tr>`).join('');
}

// Cosechas
function saveHarvest(e) {
    e.preventDefault();
    const cropName = document.getElementById('hv-crop').value;
    const kilos = parseFloat(document.getElementById('hv-kilos').value);
    const date = document.getElementById('hv-date').value;

    // Buscar el cultivo para comparar rendimiento esperado
    const crops = JSON.parse(localStorage.getItem('crops')) || [];
    const crop = crops.find(c => c.type.toLowerCase() === cropName.toLowerCase());

    let expectedYield = 0;
    let efficiency = 0;

    if (crop && crop.expectedYield) {
        expectedYield = parseFloat(crop.expectedYield);
        efficiency = expectedYield > 0 ? ((kilos / expectedYield) * 100).toFixed(1) : 0;
    }

    const data = {
        id: Date.now(),
        crop: cropName,
        kilos: kilos,
        date: date,
        expectedYield: expectedYield,
        efficiency: efficiency
    };

    let list = JSON.parse(localStorage.getItem('harvests')) || [];
    list.push(data);
    localStorage.setItem('harvests', JSON.stringify(list));
    e.target.reset(); renderHarvests();
}

function renderHarvests() {
    const list = JSON.parse(localStorage.getItem('harvests')) || [];
    document.getElementById('table-harvests').innerHTML = list.map(i => {
        const efficiencyText = i.expectedYield > 0 ?
            `<br><small style="color: ${i.efficiency >= 100 ? 'green' : i.efficiency >= 80 ? 'orange' : 'red'};">Eficiencia: ${i.efficiency}%</small>` : '';
        return `<tr>
            <td>${i.crop}</td>
            <td>${i.kilos} kg${efficiencyText}</td>
            <td>${i.date}</td>
            <td><button class="btn-delete" onclick="deleteItem('harvests', ${i.id})">X</button></td>
        </tr>`;
    }).join('');
}

// Animales
function saveAnimal(e) {
    e.preventDefault();
    const data = { id: Date.now(), type: document.getElementById('an-type').value, qty: document.getElementById('an-qty').value, age: document.getElementById('an-age').value };
    let list = JSON.parse(localStorage.getItem('animals')) || [];
    list.push(data);
    localStorage.setItem('animals', JSON.stringify(list));
    e.target.reset(); renderAnimals();
}
function renderAnimals() {
    const list = JSON.parse(localStorage.getItem('animals')) || [];
    document.getElementById('table-animals').innerHTML = list.map(i => `<tr><td>${i.type}</td><td>${i.qty}</td><td>${i.age}</td><td><button class="btn-delete" onclick="deleteItem('animals', ${i.id})">X</button></td></tr>`).join('');
}

// --- EMPLEADOS Y NÓMINA ---

// Registro de Empleados
function saveEmployee(e) {
    e.preventDefault();
    const data = {
        id: Date.now(),
        name: document.getElementById('emp-name').value,
        cedula: document.getElementById('emp-cedula').value,
        cargo: document.getElementById('emp-cargo').value
    };
    let list = JSON.parse(localStorage.getItem('employees')) || [];
    list.push(data);
    localStorage.setItem('employees', JSON.stringify(list));
    e.target.reset();
    renderEmployees();
    updateEmployeeSelect();
}

function renderEmployees() {
    const list = JSON.parse(localStorage.getItem('employees')) || [];
    const tbody = document.getElementById('table-employees');
    if(!tbody) return;
    tbody.innerHTML = list.map(i => `
        <tr>
            <td>${i.name}</td>
            <td>${i.cedula}</td>
            <td>${i.cargo}</td>
            <td><button class="btn-delete" onclick="deleteItem('employees', ${i.id})">X</button></td>
        </tr>`).join('');
}

function updateEmployeeSelect() {
    const list = JSON.parse(localStorage.getItem('employees')) || [];
    const select = document.getElementById('sal-emp');
    if(!select) return;
    const defaultOption = select.innerHTML.split('</option>')[0] + '</option>';
    select.innerHTML = defaultOption + list.map(i => `<option value="${i.id}|${i.name}|${i.cargo}">${i.name} (${i.cargo})</option>`).join('');
}

// Cálculo de Salarios
function calculateSalaryTotal() {
    const horasExtras = Number(document.getElementById('sal-horas-extras').value) || 0;
    const precioHoraExtra = Number(document.getElementById('sal-precio-hora-extra').value) || 0;
    const descSalud = Number(document.getElementById('sal-desc-salud').value) || 0;
    const descPension = Number(document.getElementById('sal-desc-pension').value) || 0;
    const descPrestamo = Number(document.getElementById('sal-desc-prestamo').value) || 0;
    const diasTrabajados = Number(document.getElementById('sal-dias-trabajados').value) || 0;
    const pagoDia = Number(document.getElementById('sal-pago-dia').value) || 0;

    const salarioBase = diasTrabajados * pagoDia;
    const pagoExtras = horasExtras * precioHoraExtra;
    const totalDescuentos = descSalud + descPension + descPrestamo;
    const total = salarioBase + pagoExtras - totalDescuentos;

    document.getElementById('sal-total-display').innerText = Math.max(0, total).toLocaleString('es-CO', {minimumFractionDigits: 2});
}

function saveSalary(e) {
    e.preventDefault();
    const empData = document.getElementById('sal-emp').value.split('|');
    const empId = empData[0];
    const empName = empData[1];
    const empCargo = empData[2];

    const horasExtras = Number(document.getElementById('sal-horas-extras').value) || 0;
    const precioHoraExtra = Number(document.getElementById('sal-precio-hora-extra').value) || 0;
    const descSalud = Number(document.getElementById('sal-desc-salud').value) || 0;
    const descPension = Number(document.getElementById('sal-desc-pension').value) || 0;
    const descPrestamo = Number(document.getElementById('sal-desc-prestamo').value) || 0;
    const diasTrabajados = Number(document.getElementById('sal-dias-trabajados').value);
    const pagoDia = Number(document.getElementById('sal-pago-dia').value);

    const salarioBase = diasTrabajados * pagoDia;
    const pagoExtras = horasExtras * precioHoraExtra;
    const totalDescuentos = descSalud + descPension + descPrestamo;
    const totalAPagar = Math.max(0, salarioBase + pagoExtras - totalDescuentos);

    const data = {
        id: Date.now(),
        empId: empId,
        empName: empName,
        empCargo: empCargo,
        pagoDia: pagoDia,
        horaEntrada: document.getElementById('sal-hora-entrada').value,
        horaSalida: document.getElementById('sal-hora-salida').value,
        diasPermiso: Number(document.getElementById('sal-dias-permiso').value) || 0,
        horasExtras: horasExtras,
        precioHoraExtra: precioHoraExtra,
        descSalud: descSalud,
        descPension: descPension,
        descPrestamo: descPrestamo,
        diasTrabajados: diasTrabajados,
        salarioBase: salarioBase,
        pagoExtras: pagoExtras,
        totalDescuentos: totalDescuentos,
        totalAPagar: totalAPagar,
        fecha: new Date().toISOString().split('T')[0]
    };

    let list = JSON.parse(localStorage.getItem('salaries')) || [];
    list.push(data);
    localStorage.setItem('salaries', JSON.stringify(list));
    e.target.reset();
    document.getElementById('sal-total-display').innerText = "0";
    renderSalaries();
}

function renderSalaries() {
    const list = JSON.parse(localStorage.getItem('salaries')) || [];
    const tbody = document.getElementById('table-salaries');
    if(!tbody) return;

    let totalGeneral = 0;
    tbody.innerHTML = list.map(i => {
        const descuentosText = `Salud:$${i.descSalud} Pensión:$${i.descPension} Préstamo:$${i.descPrestamo}`;
        const horasExtrasText = i.horasExtras > 0 ? `${i.horasExtras}h x $${i.precioHoraExtra} = $${Number(i.pagoExtras).toLocaleString()}` : 'Ninguna';
        totalGeneral += i.totalAPagar;
        return `
        <tr>
            <td>${i.empName}</td>
            <td>${i.empCargo}</td>
            <td>${i.diasTrabajados}</td>
            <td>${horasExtrasText}</td>
            <td>${descuentosText}</td>
            <td><strong>$${Number(i.totalAPagar).toLocaleString()}</strong></td>
            <td><button class="btn-delete" onclick="deleteItem('salaries', ${i.id})">X</button></td>
        </tr>`;
    }).join('');

    document.getElementById('total-all-salaries').innerText = Number(totalGeneral).toLocaleString();
}

function renderStaff() {
    renderEmployees();
    renderSalaries();
    updateEmployeeSelect();
}

// Función para convertir m² a hectáreas
function updateHectares() {
    const areaM2 = parseFloat(document.getElementById('crop-area').value) || 0;
    const areaHectares = areaM2 / 10000; // 1 hectárea = 10,000 m²
    document.getElementById('hectares-display').innerText = areaHectares.toFixed(4);
    document.getElementById('crop-area-hectares').value = areaHectares.toFixed(4);
}

// Función para convertir hectáreas a m²
function updateFromHectares() {
    const areaHectares = parseFloat(document.getElementById('crop-area-hectares').value) || 0;
    const areaM2 = areaHectares * 10000; // 1 hectárea = 10,000 m²
    document.getElementById('crop-area').value = Math.round(areaM2);
    document.getElementById('hectares-display').innerText = areaHectares.toFixed(4);
}

// Inicializar conversión de área al cargar
document.addEventListener('DOMContentLoaded', function() {
    const areaInput = document.getElementById('crop-area');
    const hectaresInput = document.getElementById('crop-area-hectares');

    if (areaInput) {
        areaInput.addEventListener('input', updateHectares);
        if (areaInput.value) {
            updateHectares();
        }
    }

    if (hectaresInput) {
        hectaresInput.addEventListener('input', updateFromHectares);
    }
});

// Función para eliminar elementos
async function deleteItem(key, id) {
    if (key === 'crops') {
        try {
            const response = await fetch(`${API_BASE}/cultivos/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) {
                return alert('Error al eliminar el cultivo: ' + data.message);
            }
            await renderCrops();
        } catch (error) {
            console.error('Error eliminando cultivo:', error);
            alert('Error de conexión: no se pudo eliminar el cultivo.');
        }
        return;
    }

    let list = JSON.parse(localStorage.getItem(key)) || [];
    list = list.filter(i => i.id !== id);
    localStorage.setItem(key, JSON.stringify(list));
    if(key === 'warehouse') renderWarehouse();
    if(key === 'harvests') renderHarvests();
    if(key === 'animals') renderAnimals();
    if(key === 'staff') renderStaff();
    if(key === 'employees') renderEmployees();
    if(key === 'salaries') renderSalaries();
}


