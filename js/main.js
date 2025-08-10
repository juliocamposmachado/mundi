/**
 * Mundo Virtual 3D - Script Principal
 * Integra todos os sistemas: terrain, skybox, camera, world manager, etc.
 */

class VirtualWorld {
    constructor() {
        // Elementos DOM
        this.canvasContainer = document.getElementById('canvas-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.timeSlider = document.getElementById('time-slider');
        this.timeDisplay = document.getElementById('time-display');
        this.vrButton = document.getElementById('vr-button');
        
        // Componentes do Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Sistemas do mundo virtual
        this.terrainGenerator = null;
        this.skyboxSystem = null;
        this.cameraController = null;
        this.worldManager = null;
        this.meshInspector = null;
        this.performanceOptimizer = null;
        
        // Estado da aplicação
        this.isLoaded = false;
        this.isPaused = false;
        
        this.init();
    }

    /**
     * Inicializa o mundo virtual
     */
    async init() {
        try {
            console.log('Iniciando Mundo Virtual 3D...');
            
            await this.setupThreeJS();
            await this.setupSystems();
            await this.setupEventListeners();
            await this.setupVR();
            
            this.startRenderLoop();
            this.hideLoadingScreen();
            
            console.log('Mundo Virtual 3D carregado com sucesso!');
        } catch (error) {
            console.error('Erro ao inicializar mundo virtual:', error);
            this.showError(error.message);
        }
    }

    /**
     * Configura Three.js (cena, câmera, renderer)
     */
    async setupThreeJS() {
        console.log('Configurando Three.js...');
        
        // Criar cena
        this.scene = new THREE.Scene();
        this.scene.name = 'MainScene';
        
        // Configurar câmera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 10, 0);
        
        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Configurações de renderização
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Adicionar canvas ao container
        this.canvasContainer.appendChild(this.renderer.domElement);
        
        // Clock para timing
        this.clock = new THREE.Clock();
        
        console.log('Three.js configurado');
    }

    /**
     * Configura todos os sistemas do mundo virtual
     */
    async setupSystems() {
        console.log('Configurando sistemas...');
        
        // 1. Sistema de terreno
        this.terrainGenerator = new TerrainGenerator();
        await this.terrainGenerator.generateTerrain(this.scene);
        
        // 2. Sistema de skybox
        this.skyboxSystem = new SkyboxSystem(this.scene, this.renderer);
        
        // 3. Sistema de controle de câmera
        this.cameraController = new CameraController(
            this.camera,
            this.scene,
            this.terrainGenerator
        );
        
        // 4. Gerenciador do mundo
        this.worldManager = new WorldManager(
            this.scene,
            this.terrainGenerator,
            this.camera
        );
        
        // 5. Inspetor de mesh
        this.meshInspector = new MeshInspector(this.scene, this.camera);
        
        // 6. Otimizador de performance
        this.performanceOptimizer = new PerformanceOptimizer(
            this.scene,
            this.camera,
            this.renderer
        );
        
        console.log('Todos os sistemas configurados');
    }

    /**
     * Configura event listeners
     */
    async setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Redimensionamento da janela
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Controle de tempo
        if (this.timeSlider) {
            this.timeSlider.addEventListener('input', (event) => {
                const time = parseFloat(event.target.value);
                this.skyboxSystem.setTimeOfDay(time);
                this.updateTimeDisplay(time);
            });
        }
        
        // Botões de controle (já configurados no HTML via onclick)
        
        // Teclas de atalho
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyP':
                    this.togglePause();
                    break;
                case 'KeyF':
                    this.toggleFullscreen();
                    break;
                case 'KeyH':
                    this.toggleUI();
                    break;
                case 'F1':
                    this.showHelp();
                    event.preventDefault();
                    break;
                case 'F11':
                    // F11 é tratado pelo navegador
                    break;
            }
        });
        
        // Controle de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        console.log('Event listeners configurados');
    }

    /**
     * Configura suporte a VR/WebXR
     */
    async setupVR() {
        console.log('Configurando VR...');
        
        if ('xr' in navigator) {
            try {
                // Verificar suporte a VR
                const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
                
                if (isSupported) {
                    // Habilitar VR no renderer
                    this.renderer.xr.enabled = true;
                    
                    // Configurar botão VR
                    if (this.vrButton) {
                        this.vrButton.addEventListener('click', this.enterVR.bind(this));
                        this.vrButton.style.display = 'block';
                        this.vrButton.textContent = 'Entrar VR';
                    }
                    
                    console.log('VR configurado e disponível');
                } else {
                    console.log('VR não suportado');
                    if (this.vrButton) {
                        this.vrButton.style.display = 'none';
                    }
                }
            } catch (error) {
                console.warn('Erro ao configurar VR:', error.message);
                if (this.vrButton) {
                    this.vrButton.style.display = 'none';
                }
            }
        } else {
            console.log('WebXR não disponível');
            if (this.vrButton) {
                this.vrButton.style.display = 'none';
            }
        }
    }

    /**
     * Inicia VR
     */
    async enterVR() {
        try {
            const session = await navigator.xr.requestSession('immersive-vr');
            this.renderer.xr.setSession(session);
            
            console.log('Sessão VR iniciada');
        } catch (error) {
            console.error('Erro ao iniciar VR:', error.message);
            alert('Erro ao iniciar VR: ' + error.message);
        }
    }

    /**
     * Loop principal de renderização
     */
    startRenderLoop() {
        console.log('Iniciando loop de renderização...');
        
        const animate = () => {
            // Usar XR frame loop se em VR
            this.renderer.setAnimationLoop(animate);
            
            if (this.isPaused) return;
            
            // Obter delta time
            const deltaTime = this.clock.getDelta();
            
            // Atualizar sistemas
            this.update(deltaTime);
            
            // Renderizar
            this.render();
        };
        
        animate();
    }

    /**
     * Atualiza todos os sistemas
     * @param {number} deltaTime - Tempo delta
     */
    update(deltaTime) {
        // Atualizar controlador de câmera
        if (this.cameraController) {
            this.cameraController.update(deltaTime);
        }
        
        // Atualizar skybox (ciclo automático opcional)
        if (this.skyboxSystem && !this.timeSlider.matches(':focus')) {
            // this.skyboxSystem.updateTime(deltaTime); // Descomentado para ciclo automático
        }
        
        // Atualizar gerenciador do mundo
        if (this.worldManager) {
            this.worldManager.update(deltaTime);
        }
        
        // Atualizar otimizador de performance
        if (this.performanceOptimizer) {
            this.performanceOptimizer.update(deltaTime);
        }
        
        // Atualizar informações de debug se necessário
        this.updateDebugInfo();
    }

    /**
     * Renderiza a cena
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Manipula redimensionamento da janela
     */
    onWindowResize() {
        // Atualizar câmera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Atualizar renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        console.log(`Janela redimensionada: ${window.innerWidth}x${window.innerHeight}`);
    }

    /**
     * Atualiza display do tempo
     * @param {number} time - Hora do dia
     */
    updateTimeDisplay(time) {
        if (this.timeDisplay) {
            const hours = Math.floor(time);
            const minutes = Math.floor((time - hours) * 60);
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            this.timeDisplay.textContent = timeString;
        }
    }

    /**
     * Alterna pausa/play
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? 'Pausado' : 'Despausado');
        
        if (this.isPaused) {
            this.clock.stop();
        } else {
            this.clock.start();
        }
    }

    /**
     * Pausa o mundo
     */
    pause() {
        this.isPaused = true;
        this.clock.stop();
    }

    /**
     * Retoma o mundo
     */
    resume() {
        this.isPaused = false;
        this.clock.start();
    }

    /**
     * Alterna fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Alterna visibilidade da UI
     */
    toggleUI() {
        const uiElements = [
            document.getElementById('ui-overlay'),
            document.getElementById('controls-panel'),
            document.getElementById('vr-button')
        ];
        
        uiElements.forEach(element => {
            if (element) {
                element.classList.toggle('hidden');
            }
        });
    }

    /**
     * Mostra ajuda
     */
    showHelp() {
        const helpText = `
CONTROLES DO MUNDO VIRTUAL 3D:

Movimento:
• WASD - Mover câmera
• Mouse - Olhar ao redor
• Shift - Correr
• Espaço - Subir
• C - Descer

Interação:
• Click - Interagir com objetos
• Click nos botões da UI - Adicionar objetos

Controles de Sistema:
• P - Pausar/Despausar
• F - Fullscreen
• H - Ocultar/Mostrar UI
• F1 - Esta ajuda

Inspetor de Mesh (quando ativo):
• I - Ativar/Desativar inspetor
• V - Mostrar vértices
• N - Mostrar normais
• B - Mostrar bounding box
• ESC - Desselecionar objeto

Dicas:
• Use o slider para controlar o tempo do dia
• Clique em objetos para interagir
• A performance é otimizada automaticamente
• VR disponível se suportado pelo dispositivo
        `;
        
        alert(helpText);
    }

    /**
     * Atualiza informações de debug
     */
    updateDebugInfo() {
        // Implementar se necessário
        // Por exemplo, atualizar contadores, estatísticas, etc.
    }

    /**
     * Oculta a tela de carregamento
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.loadingScreen.remove();
            }, 500);
        }
        
        this.isLoaded = true;
    }

    /**
     * Mostra erro na tela
     * @param {string} message - Mensagem de erro
     */
    showError(message) {
        if (this.loadingScreen) {
            this.loadingScreen.innerHTML = `
                <div style="color: #ff6b6b;">
                    <h2>Erro ao carregar</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()">Recarregar</button>
                </div>
            `;
        } else {
            alert('Erro: ' + message);
        }
    }

    /**
     * Obtém estatísticas do mundo
     * @returns {Object} Estatísticas completas
     */
    getWorldStats() {
        const stats = {
            loaded: this.isLoaded,
            paused: this.isPaused,
            frameRate: this.performanceOptimizer?.getPerformanceStats()?.averageFPS || 0,
            objects: this.worldManager?.getWorldStats() || {},
            camera: this.cameraController?.getInfo() || {},
            skybox: this.skyboxSystem?.getInfo() || {},
            terrain: this.terrainGenerator?.getMeshInfo() || {},
            performance: this.performanceOptimizer?.getPerformanceStats() || {},
            meshInspector: this.meshInspector?.getInfo() || {}
        };
        
        return stats;
    }

    /**
     * Exporta dados do mundo
     */
    exportWorldData() {
        if (this.worldManager) {
            this.worldManager.exportWorldData();
        }
    }

    /**
     * Limpa recursos antes de fechar
     */
    dispose() {
        console.log('Limpando recursos...');
        
        // Parar renderização
        this.renderer.setAnimationLoop(null);
        
        // Limpar sistemas
        if (this.cameraController) this.cameraController.dispose();
        if (this.worldManager) this.worldManager.dispose();
        if (this.skyboxSystem) this.skyboxSystem.dispose();
        if (this.meshInspector) this.meshInspector.dispose();
        if (this.performanceOptimizer) this.performanceOptimizer.dispose();
        
        // Limpar Three.js
        this.scene.clear();
        this.renderer.dispose();
        
        // Remover event listeners
        window.removeEventListener('resize', this.onWindowResize);
        
        console.log('Recursos limpos');
    }
}

// Variáveis globais para acesso via console e funções HTML
let virtualWorld = null;
let terrainGenerator = null;
let skyboxSystem = null;
let cameraController = null;
let worldManager = null;
let meshInspector = null;
let performanceOptimizer = null;

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    virtualWorld = new VirtualWorld();
    
    // Expor sistemas globalmente para acesso via HTML
    setTimeout(() => {
        terrainGenerator = virtualWorld.terrainGenerator;
        skyboxSystem = virtualWorld.skyboxSystem;
        cameraController = virtualWorld.cameraController;
        worldManager = virtualWorld.worldManager;
        meshInspector = virtualWorld.meshInspector;
        performanceOptimizer = virtualWorld.performanceOptimizer;
    }, 1000);
});

// Limpeza ao fechar página
window.addEventListener('beforeunload', () => {
    if (virtualWorld) {
        virtualWorld.dispose();
    }
});

// Exportar para uso global
window.VirtualWorld = VirtualWorld;
