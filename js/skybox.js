/**
 * Sistema de Skybox Dinâmico
 * Implementa céu com ciclo dia/noite, sol, lua e iluminação realista
 */

class SkyboxSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Configurações de tempo
        this.timeOfDay = 12.0; // Hora do dia (0-24)
        this.skybox = null;
        this.sun = null;
        this.moon = null;
        
        // Luzes da cena
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Cores do céu em diferentes momentos
        this.skyColors = {
            dawn: new THREE.Color(0xff6b35),      // Nascer do sol
            day: new THREE.Color(0x87ceeb),       // Meio-dia
            dusk: new THREE.Color(0xff4500),      // Por do sol
            night: new THREE.Color(0x191970)      // Noite
        };
        
        this.init();
    }

    /**
     * Inicializa o sistema de skybox
     */
    init() {
        this.createSkybox();
        this.createCelestialBodies();
        this.setupLighting();
        this.updateSky();
        
        console.log('Sistema de Skybox inicializado');
    }

    /**
     * Cria o skybox usando shader personalizado
     */
    createSkybox() {
        // Geometria da esfera
        const geometry = new THREE.SphereGeometry(500, 32, 16);
        
        // Shader personalizado para gradiente de céu
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;
        
        // Material do shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x87ceeb) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });
        
        this.skybox = new THREE.Mesh(geometry, material);
        this.skybox.name = 'skybox';
        this.scene.add(this.skybox);
    }

    /**
     * Cria sol e lua
     */
    createCelestialBodies() {
        // Sol
        const sunGeometry = new THREE.SphereGeometry(5, 16, 8);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.name = 'sun';
        this.scene.add(this.sun);
        
        // Lua
        const moonGeometry = new THREE.SphereGeometry(3, 16, 8);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true
        });
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moon.name = 'moon';
        this.scene.add(this.moon);
    }

    /**
     * Configura a iluminação da cena
     */
    setupLighting() {
        // Luz ambiente suave
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.ambientLight.name = 'ambientLight';
        this.scene.add(this.ambientLight);
        
        // Luz direcional principal (sol)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.name = 'sunLight';
        this.directionalLight.castShadow = true;
        
        // Configurações de sombra
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 1;
        this.directionalLight.shadow.camera.far = 1000;
        this.directionalLight.shadow.camera.left = -200;
        this.directionalLight.shadow.camera.right = 200;
        this.directionalLight.shadow.camera.top = 200;
        this.directionalLight.shadow.camera.bottom = -200;
        
        this.scene.add(this.directionalLight);
        this.scene.add(this.directionalLight.target);
        
        // Habilitar sombras no renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    /**
     * Atualiza o tempo do dia
     * @param {number} time - Hora do dia (0-24)
     */
    setTimeOfDay(time) {
        this.timeOfDay = Math.max(0, Math.min(24, time));
        this.updateSky();
    }

    /**
     * Atualiza o céu baseado no tempo do dia
     */
    updateSky() {
        const time = this.timeOfDay;
        
        // Calcular ângulo do sol (-90 a +90 graus)
        const sunAngle = ((time - 6) / 12) * Math.PI; // 6h = nascer, 18h = por do sol
        
        // Posição do sol
        const sunDistance = 400;
        const sunX = Math.cos(sunAngle) * sunDistance;
        const sunY = Math.sin(sunAngle) * sunDistance;
        
        this.sun.position.set(sunX, sunY, 0);
        this.directionalLight.position.copy(this.sun.position);
        
        // Posição da lua (oposta ao sol)
        const moonX = -sunX;
        const moonY = -sunY;
        this.moon.position.set(moonX, moonY, 0);
        
        // Determinar cores baseadas no tempo
        let skyColor, lightColor, lightIntensity, fogColor;
        
        if (time >= 5 && time < 7) {
            // Nascer do sol
            const t = (time - 5) / 2;
            skyColor = this.interpolateColor(this.skyColors.night, this.skyColors.dawn, t);
            lightColor = new THREE.Color(0xffa500);
            lightIntensity = 0.3 + t * 0.7;
            fogColor = skyColor;
        } else if (time >= 7 && time < 17) {
            // Dia
            const t = Math.min(1, (time - 7) / 3); // Transição suave para meio-dia
            skyColor = this.interpolateColor(this.skyColors.dawn, this.skyColors.day, t);
            lightColor = new THREE.Color(0xffffff);
            lightIntensity = 1.0;
            fogColor = skyColor;
        } else if (time >= 17 && time < 19) {
            // Por do sol
            const t = (time - 17) / 2;
            skyColor = this.interpolateColor(this.skyColors.day, this.skyColors.dusk, t);
            lightColor = new THREE.Color(0xff6b35);
            lightIntensity = 1.0 - t * 0.7;
            fogColor = skyColor;
        } else {
            // Noite
            const t = time < 5 ? (time + 24 - 19) / 10 : (time - 19) / 10;
            const clampedT = Math.min(1, Math.max(0, t));
            skyColor = this.interpolateColor(this.skyColors.dusk, this.skyColors.night, clampedT);
            lightColor = new THREE.Color(0x404080);
            lightIntensity = 0.1;
            fogColor = skyColor;
        }
        
        // Atualizar material do skybox
        if (this.skybox && this.skybox.material.uniforms) {
            this.skybox.material.uniforms.topColor.value = skyColor;
            this.skybox.material.uniforms.bottomColor.value = this.lightenColor(skyColor, 0.3);
        }
        
        // Atualizar luzes
        this.directionalLight.color = lightColor;
        this.directionalLight.intensity = lightIntensity;
        
        // Luz ambiente baseada no tempo do dia
        const ambientIntensity = time >= 6 && time <= 18 ? 0.4 : 0.1;
        this.ambientLight.intensity = ambientIntensity;
        
        // Visibilidade dos corpos celestes
        this.sun.material.opacity = sunY > 0 ? 1.0 : 0.0;
        this.moon.material.opacity = moonY > 0 && sunY < 50 ? 0.8 : 0.0;
        
        // Configurar fog atmosférico
        if (!this.scene.fog) {
            this.scene.fog = new THREE.Fog(fogColor, 200, 800);
        }
        this.scene.fog.color = fogColor;
        
        // Atualizar background
        this.scene.background = skyColor;
    }

    /**
     * Interpola entre duas cores
     * @param {THREE.Color} color1 - Primeira cor
     * @param {THREE.Color} color2 - Segunda cor
     * @param {number} t - Fator de interpolação (0-1)
     * @returns {THREE.Color} Cor interpolada
     */
    interpolateColor(color1, color2, t) {
        const result = new THREE.Color();
        result.r = color1.r + (color2.r - color1.r) * t;
        result.g = color1.g + (color2.g - color1.g) * t;
        result.b = color1.b + (color2.b - color1.b) * t;
        return result;
    }

    /**
     * Clareia uma cor por um fator
     * @param {THREE.Color} color - Cor base
     * @param {number} factor - Fator de clareamento
     * @returns {THREE.Color} Cor clareada
     */
    lightenColor(color, factor) {
        const result = new THREE.Color();
        result.r = Math.min(1, color.r + factor);
        result.g = Math.min(1, color.g + factor);
        result.b = Math.min(1, color.b + factor);
        return result;
    }

    /**
     * Avança o tempo automaticamente (ciclo automático)
     * @param {number} deltaTime - Delta time em segundos
     */
    updateTime(deltaTime) {
        // Avançar 1 hora a cada 60 segundos (ajustável)
        this.timeOfDay += deltaTime / 60;
        
        if (this.timeOfDay >= 24) {
            this.timeOfDay -= 24;
        }
        
        this.updateSky();
    }

    /**
     * Obtém informações do sistema para debug
     * @returns {Object} Informações do skybox
     */
    getInfo() {
        return {
            timeOfDay: this.timeOfDay.toFixed(2),
            sunPosition: this.sun.position.clone(),
            moonPosition: this.moon.position.clone(),
            lightIntensity: this.directionalLight.intensity,
            ambientIntensity: this.ambientLight.intensity
        };
    }

    /**
     * Limpa recursos
     */
    dispose() {
        if (this.skybox) {
            this.scene.remove(this.skybox);
            this.skybox.geometry.dispose();
            this.skybox.material.dispose();
        }
        
        if (this.sun) {
            this.scene.remove(this.sun);
            this.sun.geometry.dispose();
            this.sun.material.dispose();
        }
        
        if (this.moon) {
            this.scene.remove(this.moon);
            this.moon.geometry.dispose();
            this.moon.material.dispose();
        }
    }
}

// Exportar para uso global
window.SkyboxSystem = SkyboxSystem;
