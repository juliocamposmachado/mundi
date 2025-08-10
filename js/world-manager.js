/**
 * Gerenciador do Mundo Virtual
 * Sistema modular para adicionar, remover e gerenciar objetos interativos
 */

class WorldManager {
    constructor(scene, terrain, camera) {
        this.scene = scene;
        this.terrain = terrain;
        this.camera = camera;
        
        // Coleções de objetos
        this.objects = new Map();
        this.interactiveObjects = [];
        this.npcs = [];
        
        // Configurações
        this.objectIdCounter = 0;
        this.wireframeMode = false;
        
        // Sistema de áudio
        this.audioListener = null;
        this.sounds = new Map();
        
        // Raycaster para interações
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }

    /**
     * Inicializa o gerenciador
     */
    init() {
        this.setupAudioSystem();
        this.setupInteractionSystem();
        this.populateInitialWorld();
        
        console.log('Gerenciador do mundo inicializado');
    }

    /**
     * Configura o sistema de áudio
     */
    setupAudioSystem() {
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        
        // Criar alguns sons básicos
        this.createBasicSounds();
    }

    /**
     * Cria sons básicos para o mundo
     */
    createBasicSounds() {
        // Som ambiente de vento (placeholder)
        const windSound = new THREE.Audio(this.audioListener);
        this.sounds.set('wind', windSound);
        
        // Som de passos (placeholder)
        const stepSound = new THREE.Audio(this.audioListener);
        this.sounds.set('steps', stepSound);
        
        // Som de interação
        const interactSound = new THREE.Audio(this.audioListener);
        this.sounds.set('interact', interactSound);
    }

    /**
     * Configura sistema de interação
     */
    setupInteractionSystem() {
        document.addEventListener('click', this.onInteract.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    /**
     * Popula o mundo inicial com alguns objetos
     */
    populateInitialWorld() {
        // Adicionar algumas árvores aleatórias
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 800;
            const z = (Math.random() - 0.5) * 800;
            this.addTree(x, z, Math.random() * 0.5 + 0.8);
        }
        
        // Adicionar algumas rochas
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 600;
            const z = (Math.random() - 0.5) * 600;
            this.addRock(x, z);
        }
        
        // Adicionar uma casa inicial
        this.addBuilding(50, 50);
        
        // Adicionar alguns NPCs
        this.addNPC(-30, -30);
        this.addNPC(80, -40);
    }

    /**
     * Adiciona uma árvore ao mundo
     */
    addRandomTree() {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const scale = Math.random() * 0.5 + 0.8;
        return this.addTree(x, z, scale);
    }

    /**
     * Cria uma árvore em uma posição específica
     * @param {number} x - Posição X
     * @param {number} z - Posição Z
     * @param {number} scale - Escala da árvore
     */
    addTree(x, z, scale = 1.0) {
        const treeGroup = new THREE.Group();
        
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 4 * scale, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2 * scale;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        // Copa da árvore
        const crownGeometry = new THREE.SphereGeometry(2.5 * scale, 8, 6);
        const crownMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.9,
            metalness: 0.0
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 5 * scale;
        crown.castShadow = true;
        crown.receiveShadow = true;
        treeGroup.add(crown);
        
        // Posicionar no terreno
        const terrainHeight = this.terrain.getHeightAt(x, z);
        treeGroup.position.set(x, terrainHeight, z);
        
        // Adicionar à cena e registrar
        const id = this.registerObject('tree', treeGroup);
        treeGroup.userData.id = id;
        treeGroup.userData.type = 'tree';
        treeGroup.userData.interactive = false;
        
        this.scene.add(treeGroup);
        
        console.log(`Árvore adicionada em (${x.toFixed(1)}, ${z.toFixed(1)})`);
        return treeGroup;
    }

    /**
     * Adiciona uma rocha ao mundo
     */
    addRock(x = null, z = null) {
        if (x === null) x = (Math.random() - 0.5) * 400;
        if (z === null) z = (Math.random() - 0.5) * 400;
        
        // Geometria irregular para a rocha
        const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1, 0);
        
        // Distorcer a geometria para parecer mais natural
        const vertices = rockGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (Math.random() - 0.5) * 0.5;
            vertices[i + 1] += (Math.random() - 0.5) * 0.5;
            vertices[i + 2] += (Math.random() - 0.5) * 0.5;
        }
        rockGeometry.computeVertexNormals();
        
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Posicionar no terreno
        const terrainHeight = this.terrain.getHeightAt(x, z);
        rock.position.set(x, terrainHeight + 0.5, z);
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        // Registrar objeto
        const id = this.registerObject('rock', rock);
        rock.userData.id = id;
        rock.userData.type = 'rock';
        rock.userData.interactive = false;
        
        this.scene.add(rock);
        
        console.log(`Rocha adicionada em (${x.toFixed(1)}, ${z.toFixed(1)})`);
        return rock;
    }

    /**
     * Adiciona uma construção (casa simples)
     */
    addBuilding(x = null, z = null) {
        if (x === null) x = (Math.random() - 0.5) * 200;
        if (z === null) z = (Math.random() - 0.5) * 200;
        
        const buildingGroup = new THREE.Group();
        
        // Base da casa
        const baseGeometry = new THREE.BoxGeometry(8, 6, 10);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xDEB887,
            roughness: 0.7,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 3;
        base.castShadow = true;
        base.receiveShadow = true;
        buildingGroup.add(base);
        
        // Telhado
        const roofGeometry = new THREE.ConeGeometry(7, 4, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 8;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        roof.receiveShadow = true;
        buildingGroup.add(roof);
        
        // Porta
        const doorGeometry = new THREE.BoxGeometry(1.5, 3, 0.2);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A4A4A,
            roughness: 0.6,
            metalness: 0.2
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1.5, 5.1);
        door.castShadow = true;
        buildingGroup.add(door);
        
        // Janelas
        const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });
        
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(-2.5, 4, 5.05);
        buildingGroup.add(window1);
        
        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(2.5, 4, 5.05);
        buildingGroup.add(window2);
        
        // Posicionar no terreno
        const terrainHeight = this.terrain.getHeightAt(x, z);
        buildingGroup.position.set(x, terrainHeight, z);
        
        // Registrar como objeto interativo
        const id = this.registerObject('building', buildingGroup);
        buildingGroup.userData.id = id;
        buildingGroup.userData.type = 'building';
        buildingGroup.userData.interactive = true;
        buildingGroup.userData.interactionText = 'Pressione para entrar na casa';
        
        this.interactiveObjects.push(buildingGroup);
        this.scene.add(buildingGroup);
        
        console.log(`Casa adicionada em (${x.toFixed(1)}, ${z.toFixed(1)})`);
        return buildingGroup;
    }

    /**
     * Adiciona um NPC ao mundo
     */
    addNPC(x = null, z = null) {
        if (x === null) x = (Math.random() - 0.5) * 300;
        if (z === null) z = (Math.random() - 0.5) * 300;
        
        const npcGroup = new THREE.Group();
        
        // Corpo
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 1, 3, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4169E1,
            roughness: 0.6,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        body.receiveShadow = true;
        npcGroup.add(body);
        
        // Cabeça
        const headGeometry = new THREE.SphereGeometry(0.6, 8, 6);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xFDBCB4,
            roughness: 0.8,
            metalness: 0.0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.6;
        head.castShadow = true;
        head.receiveShadow = true;
        npcGroup.add(head);
        
        // Olhos simples
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye1.position.set(-0.2, 3.8, 0.5);
        npcGroup.add(eye1);
        
        const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye2.position.set(0.2, 3.8, 0.5);
        npcGroup.add(eye2);
        
        // Posicionar no terreno
        const terrainHeight = this.terrain.getHeightAt(x, z);
        npcGroup.position.set(x, terrainHeight, z);
        
        // Registrar como NPC
        const id = this.registerObject('npc', npcGroup);
        npcGroup.userData.id = id;
        npcGroup.userData.type = 'npc';
        npcGroup.userData.interactive = true;
        npcGroup.userData.interactionText = 'Conversar com NPC';
        npcGroup.userData.dialogue = [
            'Olá, aventureiro!',
            'Este é um mundo virtual incrível!',
            'Explore e descubra novos lugares!'
        ];
        npcGroup.userData.dialogueIndex = 0;
        
        // Adicionar animação simples de movimento
        npcGroup.userData.animationTime = Math.random() * Math.PI * 2;
        npcGroup.userData.originalPosition = npcGroup.position.clone();
        
        this.interactiveObjects.push(npcGroup);
        this.npcs.push(npcGroup);
        this.scene.add(npcGroup);
        
        console.log(`NPC adicionado em (${x.toFixed(1)}, ${z.toFixed(1)})`);
        return npcGroup;
    }

    /**
     * Registra um objeto no sistema
     * @param {string} type - Tipo do objeto
     * @param {THREE.Object3D} object - Objeto 3D
     * @returns {string} ID do objeto
     */
    registerObject(type, object) {
        const id = `${type}_${this.objectIdCounter++}`;
        this.objects.set(id, object);
        return id;
    }

    /**
     * Remove um objeto do mundo
     * @param {string} id - ID do objeto
     */
    removeObject(id) {
        const object = this.objects.get(id);
        if (object) {
            this.scene.remove(object);
            this.objects.delete(id);
            
            // Remover de listas específicas
            const interactiveIndex = this.interactiveObjects.indexOf(object);
            if (interactiveIndex > -1) {
                this.interactiveObjects.splice(interactiveIndex, 1);
            }
            
            const npcIndex = this.npcs.indexOf(object);
            if (npcIndex > -1) {
                this.npcs.splice(npcIndex, 1);
            }
            
            console.log(`Objeto ${id} removido`);
        }
    }

    /**
     * Manipula interações com objetos
     */
    onInteract(event) {
        // Calcular posição do mouse normalizada
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycast para detectar objetos
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object.parent || intersects[0].object;
            this.interactWithObject(object);
        }
    }

    /**
     * Executa interação com um objeto específico
     * @param {THREE.Object3D} object - Objeto interativo
     */
    interactWithObject(object) {
        if (!object.userData.interactive) return;
        
        switch (object.userData.type) {
            case 'building':
                this.interactWithBuilding(object);
                break;
            case 'npc':
                this.interactWithNPC(object);
                break;
            default:
                console.log(`Interação com ${object.userData.type}`);
        }
        
        // Tocar som de interação
        this.playSound('interact');
    }

    /**
     * Interage com uma construção
     * @param {THREE.Object3D} building - Construção
     */
    interactWithBuilding(building) {
        console.log('Entrando na casa...');
        
        // Efeito visual simples - piscar a casa
        const originalMaterial = building.children[0].material;
        building.children[0].material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0x444444
        });
        
        setTimeout(() => {
            building.children[0].material = originalMaterial;
        }, 200);
        
        // Aqui você pode adicionar lógica para entrar na casa
        alert('Você entrou na casa! (implementar interior)');
    }

    /**
     * Interage com um NPC
     * @param {THREE.Object3D} npc - NPC
     */
    interactWithNPC(npc) {
        const dialogue = npc.userData.dialogue;
        const index = npc.userData.dialogueIndex;
        
        if (dialogue && index < dialogue.length) {
            alert(`NPC: ${dialogue[index]}`);
            npc.userData.dialogueIndex = (index + 1) % dialogue.length;
        }
        
        // Animação simples - npc "acena"
        const originalRotation = npc.rotation.y;
        npc.rotation.y += 0.2;
        
        setTimeout(() => {
            npc.rotation.y = originalRotation;
        }, 500);
    }

    /**
     * Atualiza animações dos NPCs
     * @param {number} deltaTime - Tempo delta
     */
    updateNPCs(deltaTime) {
        this.npcs.forEach(npc => {
            // Animação simples de movimento oscilatório
            npc.userData.animationTime += deltaTime;
            const offset = Math.sin(npc.userData.animationTime) * 0.3;
            
            npc.position.x = npc.userData.originalPosition.x + offset;
            npc.position.z = npc.userData.originalPosition.z + Math.cos(npc.userData.animationTime) * 0.2;
            
            // Manter no terreno
            const terrainHeight = this.terrain.getHeightAt(npc.position.x, npc.position.z);
            npc.position.y = terrainHeight;
        });
    }

    /**
     * Alterna modo wireframe para todos os objetos
     */
    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        
        this.objects.forEach(object => {
            object.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.wireframe = this.wireframeMode;
                }
            });
        });
        
        console.log(`Modo wireframe: ${this.wireframeMode ? 'ON' : 'OFF'}`);
    }

    /**
     * Alterna visibilidade do inspetor de mesh
     */
    toggleMeshInspector() {
        const inspector = document.getElementById('mesh-inspector');
        inspector.classList.toggle('hidden');
        
        if (!inspector.classList.contains('hidden')) {
            this.updateMeshInspector();
        }
    }

    /**
     * Atualiza informações do inspetor de mesh
     */
    updateMeshInspector() {
        const meshInfo = document.getElementById('mesh-info');
        if (!meshInfo) return;
        
        let info = `<strong>Objetos no mundo:</strong> ${this.objects.size}<br>`;
        info += `<strong>Objetos interativos:</strong> ${this.interactiveObjects.length}<br>`;
        info += `<strong>NPCs:</strong> ${this.npcs.length}<br><br>`;
        
        // Listar objetos por tipo
        const typeCount = {};
        this.objects.forEach(object => {
            const type = object.userData.type || 'unknown';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        info += '<strong>Por tipo:</strong><br>';
        Object.entries(typeCount).forEach(([type, count]) => {
            info += `• ${type}: ${count}<br>`;
        });
        
        meshInfo.innerHTML = info;
    }

    /**
     * Detecta movimento do mouse para highlight de objetos interativos
     */
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
        
        // Resetar highlight anterior
        this.interactiveObjects.forEach(obj => {
            obj.traverse(child => {
                if (child.isMesh && child.material.emissive) {
                    child.material.emissive.setHex(0x000000);
                }
            });
        });
        
        // Aplicar highlight ao objeto sob o cursor
        if (intersects.length > 0) {
            const object = intersects[0].object.parent || intersects[0].object;
            if (object.userData.interactive) {
                object.traverse(child => {
                    if (child.isMesh && child.material.emissive) {
                        child.material.emissive.setHex(0x222222);
                    }
                });
                
                // Mostrar cursor de interação
                document.body.style.cursor = 'pointer';
            }
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * Reproduz um som
     * @param {string} soundName - Nome do som
     */
    playSound(soundName) {
        const sound = this.sounds.get(soundName);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
        if (sound) {
            // Como não temos arquivos de áudio reais, apenas logamos
            console.log(`Playing sound: ${soundName}`);
        }
    }

    /**
     * Atualiza o gerenciador (chamado no loop principal)
     * @param {number} deltaTime - Tempo delta
     */
    update(deltaTime) {
        this.updateNPCs(deltaTime);
    }

    /**
     * Exporta dados dos objetos para arquivo
     */
    exportWorldData() {
        const worldData = {
            objects: [],
            timestamp: new Date().toISOString()
        };
        
        this.objects.forEach((object, id) => {
            worldData.objects.push({
                id: id,
                type: object.userData.type,
                position: {
                    x: object.position.x,
                    y: object.position.y,
                    z: object.position.z
                },
                rotation: {
                    x: object.rotation.x,
                    y: object.rotation.y,
                    z: object.rotation.z
                },
                scale: {
                    x: object.scale.x,
                    y: object.scale.y,
                    z: object.scale.z
                }
            });
        });
        
        const dataStr = JSON.stringify(worldData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mundo-virtual-data.json';
        link.click();
        
        console.log('Dados do mundo exportados');
    }

    /**
     * Obtém estatísticas do mundo
     * @returns {Object} Estatísticas
     */
    getWorldStats() {
        return {
            totalObjects: this.objects.size,
            interactiveObjects: this.interactiveObjects.length,
            npcs: this.npcs.length,
            wireframeMode: this.wireframeMode
        };
    }

    /**
     * Limpa recursos
     */
    dispose() {
        this.objects.forEach((object, id) => {
            this.removeObject(id);
        });
        
        document.removeEventListener('click', this.onInteract);
        document.removeEventListener('mousemove', this.onMouseMove);
    }
}

// Exportar para uso global
window.WorldManager = WorldManager;
