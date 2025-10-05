/* -----------------------------------------------------------
    SIMULADOR DE IMPACTOS - VERSIÓN CORREGIDA
    - Mapa visible y funcional
    - Sin recarga de página
    - Botones funcionando
    - Interacción con mapa
   ----------------------------------------------------------- */

// Constantes físicas
const K_RADIUS = 1.5;
const J_PER_MT = 4.184e15;

// Coordenadas iniciales
const INITIAL_LAT = 25.4146;
const INITIAL_LNG = -101.0076;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos DOM
    const $ = (id) => document.getElementById(id);
    const form = $("impact-form");
    const latEl = $("lat");
    const lngEl = $("lng");
    const detailsEl = $("impact-details");
    const resetBtn = $("reset");

    console.log("Elementos cargados:", { form, latEl, lngEl, detailsEl, resetBtn });

    // 1. INICIALIZAR MAPA - ESTO ES CLAVE
    const map = L.map('map-impact', {
      worldCopyJump: true,
      noWrap: true,
      zoomControl: false,
    });

    // Capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    console.log("Mapa inicializado");

    // Marcador de impacto
    let marker = L.marker([INITIAL_LAT, INITIAL_LNG], {
        draggable: true
    }).addTo(map);

    // Capa de área de impacto (color rojizo transparente)
    let impactArea = L.circle([INITIAL_LAT, INITIAL_LNG], {
        radius: 0,
        color: '#ff0000',
        fillColor: '#ff4444',
        fillOpacity: 0.3,
        weight: 2
    }).addTo(map);

    // 2. SINCRONIZAR MAPA CON FORMULARIO
    marker.on('dragend', function(e) {
        const position = marker.getLatLng();
        latEl.value = position.lat.toFixed(4);
        lngEl.value = position.lng.toFixed(4);
        console.log("Marcador movido:", position);
    });

    // Al hacer clic en el mapa, actualizar coordenadas
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        latEl.value = e.latlng.lat.toFixed(4);
        lngEl.value = e.latlng.lng.toFixed(4);
        console.log("Clic en mapa:", e.latlng);
    });

    // 3. FUNCIÓN DE SIMULACIÓN CORREGIDA (SIN RECARGA)
    function runImpactSimulation(event) {
        // PREVENIR RECARGA DE PÁGINA
        if (event) {
            event.preventDefault();
        }
        
        console.log("Ejecutando simulación...");
        
        // Obtener valores del formulario
        const diameter = parseFloat($('diametro').value);
        const density = parseFloat($('densidad').value);
        const velocity = parseFloat($('velocidad').value);
        const angle = parseFloat($('angulo').value);
        const lat = parseFloat($('lat').value);
        const lng = parseFloat($('lng').value);
        
        console.log("Parámetros:", { diameter, density, velocity, angle, lat, lng });
        
        // Validaciones básicas
        if (isNaN(diameter) || isNaN(density) || isNaN(velocity) || isNaN(angle)) {
            alert('Por favor, ingresa valores válidos en todos los campos.');
            return;
        }
        
        // Cálculos físicos
        const volume = (Math.PI * Math.pow(diameter, 3)) / 6;
        const mass = volume * density;
        const energy_Joules = 0.5 * mass * Math.pow(velocity * 1000, 2);
        const energy_Mt = energy_Joules / J_PER_MT;
        
        // Radio de impacto
        const impactRadius_km = K_RADIUS * Math.cbrt(energy_Mt);
        const impactRadius_m = impactRadius_km * 1000;
        
        // Actualizar posición
        const impactLatLng = L.latLng(lat, lng);
        marker.setLatLng(impactLatLng);
        
        // Actualizar área de impacto
        impactArea.setLatLng(impactLatLng).setRadius(impactRadius_m);
        
        // Calcular datos de impacto
        const impactData = calculateImpactData(energy_Mt, impactRadius_km, impactLatLng);
        
        // Mostrar resultados
        displayImpactResults(energy_Joules, energy_Mt, impactData);
        
        // Ajustar vista del mapa
        map.setView(impactLatLng, 8);
        
        console.log("Simulación completada");
    }

    // Función para calcular datos de impacto
    function calculateImpactData(energy_Mt, radius_km, latlng) {
        // Simulación de datos de población
        const baseDensity = Math.random() * 500 + 100; // personas/km²
        const area_km2 = Math.PI * Math.pow(radius_km, 2);
        const affectedPopulation = Math.round(baseDensity * area_km2);
        const estimatedDeaths = Math.round(affectedPopulation * 0.7); // 70% de mortalidad
        
        return {
            populationDensity: Math.round(baseDensity),
            affectedPopulation: affectedPopulation,
            estimatedDeaths: estimatedDeaths,
            impactRadius: radius_km,
            coordinates: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
            areaAffected: Math.round(area_km2)
        };
    }

    // Función para mostrar resultados
    function displayImpactResults(energy_J, energy_Mt, impactData) {
        const resultsHTML = `
            <div class="impact-results">
                <h3>📊 Resultados del Impacto</h3>
                
                <div class="result-grid">
                    <div class="result-item">
                        <strong>💥 Energía Liberada:</strong>
                        <div>${formatNumber(energy_J)} J</div>
                        <div>${formatNumber(energy_Mt)} Mt de TNT</div>
                    </div>
                    
                    <div class="result-item">
                        <strong>📍 Coordenadas:</strong>
                        <div>${impactData.coordinates}</div>
                    </div>
                    
                    <div class="result-item">
                        <strong>📏 Radio de Impacto:</strong>
                        <div>${formatNumber(impactData.impactRadius)} km</div>
                    </div>
                    
                    <div class="result-item">
                        <strong>🗺️ Área Afectada:</strong>
                        <div>${formatNumber(impactData.areaAffected)} km²</div>
                    </div>
                    
                    <div class="result-item">
                        <strong>👥 Densidad Poblacional:</strong>
                        <div>${formatNumber(impactData.populationDensity)} pers/km²</div>
                    </div>
                    
                    <div class="result-item">
                        <strong>🚨 Población Afectada:</strong>
                        <div>${formatNumber(impactData.affectedPopulation)} personas</div>
                    </div>
                    
                    <div class="result-item">
                        <strong>💀 Muertes Estimadas:</strong>
                        <div class="casualties">${formatNumber(impactData.estimatedDeaths)} personas</div>
                    </div>
                </div>
                
                <div class="impact-notes">
                    <p><strong>📝 Nota:</strong> Los datos de población son estimaciones basadas en densidades promedio.</p>
                </div>
            </div>
        `;
        
        detailsEl.innerHTML = resultsHTML;
    }

    // 4. FUNCIÓN RESET CORREGIDA
    function resetSimulation() {
        console.log("Restableciendo simulación...");
        
        // Restablecer valores del formulario
        $('diametro').value = 50;
        $('densidad').value = 3000;
        $('velocidad').value = 20;
        $('angulo').value = 45;
        $('lat').value = INITIAL_LAT;
        $('lng').value = INITIAL_LNG;
        
        // Restablecer marcador y áreas
        const initialLatLng = L.latLng(INITIAL_LAT, INITIAL_LNG);
        marker.setLatLng(initialLatLng);
        impactArea.setLatLng(initialLatLng).setRadius(0);
        
        // Restablecer resultados
        detailsEl.innerHTML = "<div style='text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);'>💫 Configura los parámetros y haz clic en 'Simular Impacto'</div>";
        
        // Recentrar mapa
        map.setView(initialLatLng, 5);
        
        console.log("Simulación restablecida");
    }

    // Utilidades
    function formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        }
        if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        }
        if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }

    // 5. EVENT LISTENERS CORREGIDOS
    form.addEventListener('submit', runImpactSimulation);
    resetBtn.addEventListener('click', resetSimulation);

    console.log("Event listeners configurados");

    // Simulación inicial después de 1 segundo
    setTimeout(() => {
        console.log("Ejecutando simulación inicial...");
        runImpactSimulation();
    }, 1000);

});