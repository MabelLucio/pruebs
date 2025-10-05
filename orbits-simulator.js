/* -----------------------------------------------------------
    Simulación de Órbitas - Sistema Solar Simplificado
    Basado en el código Python original
   ----------------------------------------------------------- */

    class OrbitsSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Constantes físicas
        this.GMs = 4 * Math.PI ** 2;  // G*M_sol en UA^3/año^2
        this.MT = 6.0e24;    // masa Tierra
        this.MJ = 1.9e27;    // masa Júpiter
        this.MS = 1.989e30;  // masa Sol
        this.GMt = this.GMs * (this.MT / this.MS);
        this.GMj = this.GMs * (this.MJ / this.MS);
        
        // Estado de la simulación
        this.isRunning = false;
        this.time = 0;
        this.h = 0.004;  // paso de tiempo
        
        // Parámetros iniciales
        this.semiMajorAxis = 2.5;
        this.eccentricity = 0.2;
        this.inclination = 0.1;
        
        // Posiciones y velocidades
        this.initSimulation();
        
        // Historial de trayectorias
        this.earthTrail = [];
        this.asteroidTrail = [];
        this.maxTrailLength = 500;
        
        this.setupControls();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    initSimulation() {
        // Tierra (órbita circular a 1 UA)
        this.r_t = { x: 1.0, y: 0.0, z: 0.0 };
        this.v_t = { x: 0.0, y: 2 * Math.PI, z: 0.0 };
        
        // Asteroide (órbita elíptica)
        const a = this.semiMajorAxis;
        const e = this.eccentricity;
        
        this.r_a = { 
            x: a * (1 - e), 
            y: 0.0, 
            z: this.inclination 
        };
        
        this.v_a = { 
            x: 0.0, 
            y: Math.sqrt(this.GMs / a), 
            z: 0.1 
        };
        
        this.earthTrail = [];
        this.asteroidTrail = [];
        this.time = 0;
    }
    
    setupControls() {
        // Sliders
        const semiMajorSlider = document.getElementById('semi-major-axis');
        const eccentricitySlider = document.getElementById('eccentricity');
        const inclinationSlider = document.getElementById('inclination');
        
        const semiMajorValue = document.getElementById('semi-major-value');
        const eccentricityValue = document.getElementById('eccentricity-value');
        const inclinationValue = document.getElementById('inclination-value');
        
        semiMajorSlider.addEventListener('input', (e) => {
            this.semiMajorAxis = parseFloat(e.target.value);
            semiMajorValue.textContent = e.target.value;
        });
        
        eccentricitySlider.addEventListener('input', (e) => {
            this.eccentricity = parseFloat(e.target.value);
            eccentricityValue.textContent = e.target.value;
        });
        
        inclinationSlider.addEventListener('input', (e) => {
            this.inclination = parseFloat(e.target.value);
            inclinationValue.textContent = e.target.value;
        });
        
        // Botones
        document.getElementById('start-orbit').addEventListener('click', () => this.start());
        document.getElementById('reset-orbit').addEventListener('click', () => this.reset());
        document.getElementById('pause-orbit').addEventListener('click', () => this.pause());
    }
    
    start() {
        this.isRunning = true;
        this.initSimulation();
        this.animate();
    }
    
    pause() {
        this.isRunning = false;
    }
    
    reset() {
        this.isRunning = false;
        this.initSimulation();
        this.draw();
    }
    
    // Método Verlet para integración
    stepVerlet() {
        const a_t = this.accEarth(this.r_t, this.r_a);
        const a_a = this.accAsteroid(this.r_a, this.r_t);
        
        // Medio paso de velocidad
        const v_t_half = {
            x: this.v_t.x + 0.5 * this.h * a_t.x,
            y: this.v_t.y + 0.5 * this.h * a_t.y,
            z: this.v_t.z + 0.5 * this.h * a_t.z
        };
        
        const v_a_half = {
            x: this.v_a.x + 0.5 * this.h * a_a.x,
            y: this.v_a.y + 0.5 * this.h * a_a.y,
            z: this.v_a.z + 0.5 * this.h * a_a.z
        };
        
        // Paso de posición
        const r_t_new = {
            x: this.r_t.x + this.h * v_t_half.x,
            y: this.r_t.y + this.h * v_t_half.y,
            z: this.r_t.z + this.h * v_t_half.z
        };
        
        const r_a_new = {
            x: this.r_a.x + this.h * v_a_half.x,
            y: this.r_a.y + this.h * v_a_half.y,
            z: this.r_a.z + this.h * v_a_half.z
        };
        
        // Nuevas aceleraciones
        const a_t_new = this.accEarth(r_t_new, r_a_new);
        const a_a_new = this.accAsteroid(r_a_new, r_t_new);
        
        // Cierre de velocidad
        this.v_t = {
            x: v_t_half.x + 0.5 * this.h * a_t_new.x,
            y: v_t_half.y + 0.5 * this.h * a_t_new.y,
            z: v_t_half.z + 0.5 * this.h * a_t_new.z
        };
        
        this.v_a = {
            x: v_a_half.x + 0.5 * this.h * a_a_new.x,
            y: v_a_half.y + 0.5 * this.h * a_a_new.y,
            z: v_a_half.z + 0.5 * this.h * a_a_new.z
        };
        
        this.r_t = r_t_new;
        this.r_a = r_a_new;
        this.time += this.h;
    }
    
    accEarth(r_t, r_a) {
        const rt = this.magnitude(r_t);
        const rtj = this.magnitude(this.subtract(r_a, r_t));
        
        const term1 = this.multiplyScalar(r_t, -this.GMs / (rt ** 3));
        const term2 = this.multiplyScalar(this.subtract(r_a, r_t), this.GMj / (rtj ** 3));
        
        return this.add(term1, term2);
    }
    
    accAsteroid(r_a, r_t) {
        const ra = this.magnitude(r_a);
        const rtj = this.magnitude(this.subtract(r_t, r_a));
        
        const term1 = this.multiplyScalar(r_a, -this.GMs / (ra ** 3));
        const term2 = this.multiplyScalar(this.subtract(r_t, r_a), this.GMt / (rtj ** 3));
        
        return this.add(term1, term2);
    }
    
    // Utilidades matemáticas
    magnitude(v) {
        return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }
    
    subtract(a, b) {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    }
    
    add(a, b) {
        return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    }
    
    multiplyScalar(v, scalar) {
        return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
    }
    
    // Proyección 3D a 2D
    project3DTo2D(point3D) {
        const scale = 150; // Escala para visualización
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Proyección simple (vista desde arriba del plano XY)
        return {
            x: centerX + point3D.x * scale,
            y: centerY - point3D.y * scale
        };
    }
    
    // Dibujar la simulación
    draw() {
        // Fondo
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Agregar puntos actuales a las trayectorias
        this.earthTrail.push({...this.r_t});
        this.asteroidTrail.push({...this.r_a});
        
        // Limitar longitud de trayectorias
        if (this.earthTrail.length > this.maxTrailLength) {
            this.earthTrail.shift();
            this.asteroidTrail.shift();
        }
        
        // Dibujar trayectorias
        this.drawTrail(this.earthTrail, '#1e90ff', 1.5); // Azul para Tierra
        this.drawTrail(this.asteroidTrail, '#ff6b6b', 1); // Rojo para asteroide
        
        // Dibujar Sol
        const sunPos = this.project3DTo2D({ x: 0, y: 0, z: 0 });
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(sunPos.x, sunPos.y, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Dibujar cuerpos
        this.drawBody(this.r_t, '#1e90ff', 6, 'Tierra'); // Tierra
        this.drawBody(this.r_a, '#ff6b6b', 3, 'Asteroide'); // Asteroide
        
        // Actualizar información
        this.updateInfo();
    }
    
    drawTrail(trail, color, lineWidth) {
        if (trail.length < 2) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        
        const firstPoint = this.project3DTo2D(trail[0]);
        this.ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < trail.length; i++) {
            const point = this.project3DTo2D(trail[i]);
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
    }
    
    drawBody(position, color, radius, label) {
        const pos2D = this.project3DTo2D(position);
        
        // Cuerpo
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(pos2D.x, pos2D.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Etiqueta
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, pos2D.x, pos2D.y - radius - 10);
    }
    
    updateInfo() {
        const distance = this.magnitude(this.subtract(this.r_t, this.r_a));
        const velocity = this.magnitude(this.v_a);
        
        document.getElementById('time-display').textContent = this.time.toFixed(2);
        document.getElementById('distance-display').textContent = distance.toFixed(3);
        document.getElementById('velocity-display').textContent = velocity.toFixed(3);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600; // Altura fija
        this.draw();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        for (let i = 0; i < 10; i++) { // Múltiples pasos por frame para mayor suavidad
            this.stepVerlet();
        }
        
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Inicializar la simulación cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    const simulator = new OrbitsSimulator('orbits-canvas');
    
    // Iniciar automáticamente después de un breve delay
    setTimeout(() => {
        simulator.start();
    }, 1000);
});