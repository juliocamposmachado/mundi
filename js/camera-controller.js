/**
 * Sistema de Controle de Câmera
 * Implementa navegação em primeira e terceira pessoa com movimento fluído
 */

class CameraController {
    constructor(camera, scene, terrain) {
        this.camera = camera;
        this.scene = scene;
        this.terrain = terrain;
        
        // Estados de controle
        this.isFirstPerson = true;
        this.isPointerLocked = false;
        
        // Configurações de movimento
        this.moveSpeed = 50;
        this.runMultiplier = 2.0;
        this.mouseSensitivity = 0.002;
        this.minPolarAngle = 0.1;
        this.maxPolarAngle = Math.PI - 0.1;
        
        // Estado de movimento
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            run: false
        };
        
        // Posição e rotação
        this.position = new THREE.Vector3(0, 10, 0);
        this.velocity = new THREE.Vector3();
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        
        // Terceira pessoa
        this.thirdPersonDistance = 15;
        this.thirdPersonHeight = 5;
        this.cameraTarget = new THREE.Vector3();
        
        // Controles
        this.controls = null;
        
        // Raycaster para colisão
        this.raycaster = new THREE.Raycaster();
        this.downVector = new THREE.Vector3(0, -1, 0);
        
        this.init();
    }

    /**
     * Inicializa o sistema de controle
     */
    init() {
        this.setupEventListeners();
        this.setupPointerLockAPI();
        
        // Posição inicial
        this.position.y = this.terrain.getHeightAt(0, 0) + 2;
        this.updateCamera();
        
        console.log('Sistema de controle de câmera inicializado');
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mouse
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('click', this.onClick.bind(this));
        
        // Redimensionamento
        window.addEventListener('resize', this.onResize.bind(this));
    }

    /**
     * Configura Pointer Lock API para primeira pessoa
     */
    setupPointerLockAPI() {
        const canvasContainer = document.getElementById('canvas-container');
        
        // Eventos do Pointer Lock
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvasContainer;
        });
        
        document.addEventListener('pointerlockerror', () => {
            console.warn('Erro ao tentar bloquear o pointer');
        });
    }

    /**
     * Manipula eventos de tecla pressionada
     */
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.up = true;
                event.preventDefault();
                break;
            case 'KeyC':
                this.keys.down = true;
                break;
            case 'ShiftLeft':
                this.keys.run = true;
                break;
        }
    }

    /**
     * Manipula eventos de tecla solta
     */
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.up = false;
                break;
            case 'KeyC':
                this.keys.down = false;
                break;
            case 'ShiftLeft':
                this.keys.run = false;
                break;
        }
    }

    /**
     * Manipula movimento do mouse
     */
    onMouseMove(event) {
        if (!this.isPointerLocked && this.isFirstPerson) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        // Atualizar rotação
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * this.mouseSensitivity;
        this.euler.x -= movementY * this.mouseSensitivity;
        
        // Limitar ângulo vertical
        this.euler.x = Math.max(
            this.minPolarAngle - Math.PI / 2,
            Math.min(this.maxPolarAngle - Math.PI / 2, this.euler.x)
        );
        
        if (this.isFirstPerson) {
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }

    /**
     * Manipula cliques para ativar pointer lock
     */
    onClick() {
        if (this.isFirstPerson && !this.isPointerLocked) {
            const canvasContainer = document.getElementById('canvas-container');
            canvasContainer.requestPointerLock();
        }
    }

    /**
     * Manipula redimensionamento da janela
     */
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Alterna entre primeira e terceira pessoa
     */
    toggleMode() {
        this.isFirstPerson = !this.isFirstPerson;
        
        if (!this.isFirstPerson && this.isPointerLocked) {
            document.exitPointerLock();
        }
        
        this.updateCamera();
        
        console.log(`Modo: ${this.isFirstPerson ? 'Primeira' : 'Terceira'} pessoa`);
    }

    /**
     * Atualiza o movimento da câmera
     */
    update(deltaTime) {
        if (deltaTime > 0.1) deltaTime = 0.1; // Limitar delta time
        
        // Calcular movimento
        this.updateMovement(deltaTime);
        
        // Aplicar colisão com terreno
        this.applyTerrainCollision();
        
        // Atualizar posição da câmera
        this.updateCamera();
        
        // Atualizar UI
        this.updateUI();
    }

    /**
     * Atualiza o movimento baseado nas teclas pressionadas
     */
    updateMovement(deltaTime) {
        const speed = this.moveSpeed * (this.keys.run ? this.runMultiplier : 1) * deltaTime;
        
        // Obter direções baseadas na rotação da câmera
        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        
        if (this.isFirstPerson) {
            this.camera.getWorldDirection(direction);
            right.crossVectors(direction, up).normalize();
        } else {
            // Em terceira pessoa, usar a rotação do alvo
            direction.set(0, 0, -1).applyEuler(this.euler);
            right.crossVectors(direction, up).normalize();
        }
        
        // Resetar velocidade horizontal
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        // Aplicar movimento horizontal
        if (this.keys.forward) {
            this.velocity.add(direction.clone().multiplyScalar(speed));
        }
        if (this.keys.backward) {
            this.velocity.add(direction.clone().multiplyScalar(-speed));
        }
        if (this.keys.left) {
            this.velocity.add(right.clone().multiplyScalar(-speed));
        }
        if (this.keys.right) {
            this.velocity.add(right.clone().multiplyScalar(speed));
        }
        
        // Movimento vertical
        if (this.keys.up) {
            this.velocity.y = speed;
        } else if (this.keys.down) {
            this.velocity.y = -speed;
        } else {
            this.velocity.y = 0;
        }
        
        // Aplicar movimento à posição
        this.position.add(this.velocity);
    }

    /**
     * Aplica colisão com o terreno
     */
    applyTerrainCollision() {
        const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        const minHeight = terrainHeight + 2; // Altura mínima sobre o terreno
        
        if (this.position.y < minHeight) {
            this.position.y = minHeight;
        }
        
        // Verificar colisão com objetos
        this.checkObjectCollisions();
    }

    /**
     * Verifica colisões com objetos da cena
     */
    checkObjectCollisions() {
        // Raycaster para baixo (apoio no chão)
        this.raycaster.set(this.position, this.downVector);
        
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        for (const intersect of intersects) {
            if (intersect.object.name === 'terrain') continue;
            
            // Ajustar altura se necessário
            if (intersect.distance < 2) {
                this.position.y = intersect.point.y + 2;
            }
        }
    }

    /**
     * Atualiza a posição da câmera
     */
    updateCamera() {
        if (this.isFirstPerson) {
            // Primeira pessoa - câmera na posição do jogador
            this.camera.position.copy(this.position);
        } else {
            // Terceira pessoa - câmera atrás do jogador
            const offset = new THREE.Vector3(0, 0, this.thirdPersonDistance);
            offset.applyEuler(this.euler);
            
            this.camera.position.copy(this.position);
            this.camera.position.add(offset);
            this.camera.position.y += this.thirdPersonHeight;
            
            // Olhar para o alvo
            this.cameraTarget.copy(this.position);
            this.cameraTarget.y += 2;
            this.camera.lookAt(this.cameraTarget);
        }
    }

    /**
     * Atualiza informações da UI
     */
    updateUI() {
        const positionInfo = document.getElementById('position-info');
        if (positionInfo) {
            positionInfo.textContent = `Posição: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})`;
        }
    }

    /**
     * Define a posição da câmera
     * @param {THREE.Vector3} position - Nova posição
     */
    setPosition(position) {
        this.position.copy(position);
        this.updateCamera();
    }

    /**
     * Obtém a posição atual
     * @returns {THREE.Vector3} Posição atual
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * Define a rotação da câmera
     * @param {number} yaw - Rotação horizontal (radianos)
     * @param {number} pitch - Rotação vertical (radianos)
     */
    setRotation(yaw, pitch) {
        this.euler.y = yaw;
        this.euler.x = pitch;
        
        if (this.isFirstPerson) {
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }

    /**
     * Teleporta para uma posição
     * @param {number} x - Coordenada X
     * @param {number} z - Coordenada Z
     */
    teleportTo(x, z) {
        const y = this.terrain.getHeightAt(x, z) + 2;
        this.setPosition(new THREE.Vector3(x, y, z));
    }

    /**
     * Obtém informações do controlador para debug
     * @returns {Object} Informações do controlador
     */
    getInfo() {
        return {
            position: this.position.clone(),
            mode: this.isFirstPerson ? 'Primeira Pessoa' : 'Terceira Pessoa',
            pointerLocked: this.isPointerLocked,
            moveSpeed: this.moveSpeed,
            isMoving: Object.values(this.keys).some(key => key)
        };
    }

    /**
     * Limpa recursos e event listeners
     */
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('click', this.onClick);
        window.removeEventListener('resize', this.onResize);
        
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
    }
}

// Exportar para uso global
window.CameraController = CameraController;
