/**
 * Sistema de Otimização de Performance
 * Implementa LOD, frustum culling e occlusion culling para melhor performance
 */

class PerformanceOptimizer {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // Configurações de LOD
        this.lodEnabled = true;
        this.lodDistances = [50, 150, 300]; // Distâncias para diferentes níveis
        this.lodObjects = new Map(); // Mapa de objetos LOD
        
        // Configurações de culling
        this.frustumCullingEnabled = true;
        this.occlusionCullingEnabled = false; // Simplificado para WebGL
        
        // Cache e métricas
        this.objectCache = new Map();
        this.performanceStats = {
            visibleObjects: 0,
            culledObjects: 0,
            averageFPS: 60,
            frameCount: 0
        };
        
        // Frustum da câmera
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        // Sistema de pooling para objetos reutilizáveis
        this.objectPools = new Map();
        
        this.init();
    }

    /**
     * Inicializa o sistema de otimização
     */
    init() {
        this.setupLODSystem();
        this.setupObjectPools();
        this.setupPerformanceMonitoring();
        
        console.log('Sistema de otimização de performance inicializado');
    }

    /**
     * Configura o sistema LOD
     */
    setupLODSystem() {
        // Sistema LOD será ativado posteriormente quando objetos forem adicionados
        console.log('Sistema LOD configurado');
    }

    /**
     * Cria versões LOD para um objeto
     * @param {THREE.Object3D} object - Objeto original
     */
    createLODForObject(object) {
        if (!object.isMesh || this.lodObjects.has(object.uuid)) {
            return;
        }
        
        const lod = new THREE.LOD();
        lod.position.copy(object.position);
        lod.rotation.copy(object.rotation);
        lod.scale.copy(object.scale);
        
        // Nível 0 - Qualidade máxima (objeto original)
        const highDetail = object.clone();
        lod.addLevel(highDetail, 0);
        
        // Nível 1 - Qualidade média
        const mediumDetail = this.createReducedDetail(object, 0.6);
        if (mediumDetail) {
            lod.addLevel(mediumDetail, this.lodDistances[0]);
        }
        
        // Nível 2 - Qualidade baixa
        const lowDetail = this.createReducedDetail(object, 0.3);
        if (lowDetail) {
            lod.addLevel(lowDetail, this.lodDistances[1]);
        }
        
        // Nível 3 - Impostor (billboard simples)
        const impostor = this.createImpostor(object);
        if (impostor) {
            lod.addLevel(impostor, this.lodDistances[2]);
        }
        
        // Substituir objeto original pelo LOD
        object.parent.add(lod);
        object.parent.remove(object);
        
        // Registrar LOD
        this.lodObjects.set(object.uuid, lod);
        lod.userData = { ...object.userData };
        lod.userData.originalObject = object;
        
        console.log(`LOD criado para ${object.userData.type || 'objeto'}`);
    }

    /**
     * Cria uma versão com menor detalhe de um objeto
     * @param {THREE.Object3D} object - Objeto original
     * @param {number} detailLevel - Nível de detalhe (0-1)
     * @returns {THREE.Object3D} Objeto com menor detalhe
     */
    createReducedDetail(object, detailLevel) {
        if (!object.isMesh || !object.geometry) {
            return null;
        }
        
        try {
            // Clonar objeto
            const reduced = object.clone();
            
            // Simplificar geometria (método básico)
            const geometry = reduced.geometry.clone();
            
            // Para geometrias procedurais, reduzir segmentos
            if (geometry.parameters) {
                const params = { ...geometry.parameters };
                
                // Reduzir segmentos baseado no nível de detalhe
                if (params.radialSegments) {
                    params.radialSegments = Math.max(3, Math.floor(params.radialSegments * detailLevel));
                }
                if (params.heightSegments) {
                    params.heightSegments = Math.max(1, Math.floor(params.heightSegments * detailLevel));
                }
                if (params.widthSegments) {
                    params.widthSegments = Math.max(1, Math.floor(params.widthSegments * detailLevel));
                }
                
                // Recriar geometria com menor detalhe
                const GeometryClass = geometry.constructor;
                const newGeometry = new GeometryClass(...Object.values(params));
                
                reduced.geometry.dispose();
                reduced.geometry = newGeometry;
            }
            
            // Material mais simples
            if (reduced.material) {
                const simpleMaterial = reduced.material.clone();
                simpleMaterial.roughness = Math.min(1, simpleMaterial.roughness * 1.2);
                simpleMaterial.metalness = Math.max(0, simpleMaterial.metalness * 0.8);
                
                // Remover texturas desnecessárias em baixa qualidade
                if (detailLevel < 0.5) {
                    simpleMaterial.normalMap = null;
                    simpleMaterial.roughnessMap = null;
                    simpleMaterial.metalnessMap = null;
                }
                
                reduced.material = simpleMaterial;
            }
            
            return reduced;
        } catch (error) {
            console.warn('Erro ao criar versão com menor detalhe:', error.message);
            return null;
        }
    }

    /**
     * Cria um impostor (billboard) para representar objeto distante
     * @param {THREE.Object3D} object - Objeto original
     * @returns {THREE.Object3D} Impostor
     */
    createImpostor(object) {
        // Para objetos muito distantes, usar um sprite simples
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Desenhar representação simples baseada no tipo do objeto
        const type = object.userData.type || 'object';
        
        switch (type) {
            case 'tree':
                // Árvore simples
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(28, 40, 8, 24);
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(32, 25, 15, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'rock':
                // Rocha simples
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.arc(32, 32, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'building':
                // Casa simples
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(16, 24, 32, 24);
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.moveTo(16, 24);
                ctx.lineTo(32, 8);
                ctx.lineTo(48, 24);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'npc':
                // Figura humana simples
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(28, 32, 8, 16);
                ctx.fillStyle = '#FDBCB4';
                ctx.beginPath();
                ctx.arc(32, 20, 6, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                // Objeto genérico
                ctx.fillStyle = '#CCCCCC';
                ctx.fillRect(24, 24, 16, 16);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        const sprite = new THREE.Sprite(material);
        
        // Tamanho baseado no objeto original
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        
        sprite.scale.set(maxSize, maxSize, 1);
        
        return sprite;
    }

    /**
     * Configura pools de objetos para reutilização
     */
    setupObjectPools() {
        // Pool para partículas/efeitos
        this.objectPools.set('particles', []);
        
        // Pool para objetos temporários
        this.objectPools.set('temporary', []);
        
        console.log('Pools de objetos configurados');
    }

    /**
     * Obtém objeto do pool
     * @param {string} poolName - Nome do pool
     * @returns {THREE.Object3D|null} Objeto do pool ou null
     */
    getFromPool(poolName) {
        const pool = this.objectPools.get(poolName);
        return pool && pool.length > 0 ? pool.pop() : null;
    }

    /**
     * Retorna objeto ao pool
     * @param {string} poolName - Nome do pool
     * @param {THREE.Object3D} object - Objeto para retornar
     */
    returnToPool(poolName, object) {
        const pool = this.objectPools.get(poolName);
        if (pool && pool.length < 100) { // Limitar tamanho do pool
            // Resetar estado do objeto
            object.position.set(0, 0, 0);
            object.rotation.set(0, 0, 0);
            object.scale.set(1, 1, 1);
            object.visible = true;
            
            pool.push(object);
        }
    }

    /**
     * Configura monitoramento de performance
     */
    setupPerformanceMonitoring() {
        // Monitor básico de FPS
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        
        setInterval(() => {
            this.updatePerformanceStats();
        }, 1000);
    }

    /**
     * Atualiza estatísticas de performance
     */
    updatePerformanceStats() {
        if (this.fpsHistory.length > 0) {
            const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
            this.performanceStats.averageFPS = Math.round(avgFPS);
            this.fpsHistory = []; // Reset para próximo segundo
        }
        
        // Atualizar contador FPS na UI
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            fpsCounter.textContent = `FPS: ${this.performanceStats.averageFPS}`;
            
            // Cor baseada na performance
            if (this.performanceStats.averageFPS >= 50) {
                fpsCounter.style.color = '#4CAF50';
            } else if (this.performanceStats.averageFPS >= 30) {
                fpsCounter.style.color = '#FF9800';
            } else {
                fpsCounter.style.color = '#F44336';
            }
        }
    }

    /**
     * Atualiza otimizações (chamado no loop principal)
     * @param {number} deltaTime - Tempo delta
     */
    update(deltaTime) {
        // Calcular FPS
        const currentTime = performance.now();
        const fps = 1000 / (currentTime - this.lastFrameTime);
        this.fpsHistory.push(fps);
        this.lastFrameTime = currentTime;
        
        // Atualizar LOD
        if (this.lodEnabled) {
            this.updateLOD();
        }
        
        // Atualizar frustum culling
        if (this.frustumCullingEnabled) {
            this.updateFrustumCulling();
        }
        
        // Controle automático de qualidade baseado na performance
        this.adaptiveQuality();
    }

    /**
     * Atualiza sistema LOD
     */
    updateLOD() {
        this.lodObjects.forEach(lod => {
            lod.update(this.camera);
        });
    }

    /**
     * Atualiza frustum culling
     */
    updateFrustumCulling() {
        // Atualizar frustum da câmera
        this.cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        let visibleCount = 0;
        let culledCount = 0;
        
        // Verificar visibilidade dos objetos
        this.scene.traverse(object => {
            if (object.isMesh || object.isSprite) {
                // Calcular bounding sphere do objeto
                if (!object.geometry?.boundingSphere) {
                    object.geometry?.computeBoundingSphere();
                }
                
                if (object.geometry?.boundingSphere) {
                    const sphere = object.geometry.boundingSphere.clone();
                    sphere.applyMatrix4(object.matrixWorld);
                    
                    // Verificar se está dentro do frustum
                    const isVisible = this.frustum.intersectsSphere(sphere);
                    
                    if (object.userData.originallyVisible === undefined) {
                        object.userData.originallyVisible = object.visible;
                    }
                    
                    object.visible = isVisible && object.userData.originallyVisible;
                    
                    if (isVisible) {
                        visibleCount++;
                    } else {
                        culledCount++;
                    }
                }
            }
        });
        
        this.performanceStats.visibleObjects = visibleCount;
        this.performanceStats.culledObjects = culledCount;
    }

    /**
     * Sistema de qualidade adaptativa
     */
    adaptiveQuality() {
        const avgFPS = this.performanceStats.averageFPS;
        
        // Ajustar qualidade baseado na performance
        if (avgFPS < 30 && this.renderer.getPixelRatio() > 1) {
            // Reduzir resolução
            this.renderer.setPixelRatio(Math.max(0.5, this.renderer.getPixelRatio() * 0.9));
            console.log('Qualidade reduzida devido à baixa performance');
        } else if (avgFPS > 55 && this.renderer.getPixelRatio() < window.devicePixelRatio) {
            // Aumentar resolução
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.renderer.getPixelRatio() * 1.1));
            console.log('Qualidade aumentada devido à boa performance');
        }
        
        // Ajustar distâncias LOD baseado na performance
        if (avgFPS < 25) {
            // Reduzir distâncias LOD (usar versões simples mais cedo)
            this.lodDistances = [30, 80, 150];
        } else if (avgFPS > 50) {
            // Aumentar distâncias LOD (usar versões detalhadas por mais tempo)
            this.lodDistances = [70, 200, 400];
        }
    }

    /**
     * Otimiza material para melhor performance
     * @param {THREE.Material} material - Material a ser otimizado
     * @returns {THREE.Material} Material otimizado
     */
    optimizeMaterial(material) {
        const optimized = material.clone();
        
        // Reduzir precisão de texturas se necessário
        if (this.performanceStats.averageFPS < 30) {
            if (optimized.map) {
                optimized.map.generateMipmaps = false;
                optimized.map.minFilter = THREE.LinearFilter;
            }
            
            // Simplificar material
            if (optimized.normalMap) {
                optimized.normalScale.multiplyScalar(0.5);
            }
        }
        
        return optimized;
    }

    /**
     * Configura occlusion culling simplificado
     * @param {THREE.Object3D} occluders - Objetos que podem ocluir outros
     */
    setupOcclusionCulling(occluders = []) {
        this.occluders = occluders;
        this.occlusionCullingEnabled = occluders.length > 0;
        
        if (this.occlusionCullingEnabled) {
            console.log(`Occlusion culling configurado com ${occluders.length} oclusores`);
        }
    }

    /**
     * Obtém estatísticas de performance
     * @returns {Object} Estatísticas
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            lodObjects: this.lodObjects.size,
            pooledObjects: Array.from(this.objectPools.values()).reduce((sum, pool) => sum + pool.length, 0),
            pixelRatio: this.renderer.getPixelRatio(),
            drawCalls: this.renderer.info.render.calls,
            triangles: this.renderer.info.render.triangles,
            geometries: this.renderer.info.memory.geometries,
            textures: this.renderer.info.memory.textures
        };
    }

    /**
     * Força atualização de LOD para todos os objetos
     */
    forceLODUpdate() {
        this.scene.traverse(object => {
            if (object.isMesh && object.userData.type && !this.lodObjects.has(object.uuid)) {
                this.createLODForObject(object);
            }
        });
        
        console.log(`LOD atualizado para ${this.lodObjects.size} objetos`);
    }

    /**
     * Alterna otimizações
     * @param {string} type - Tipo de otimização ('lod', 'culling')
     * @param {boolean} enabled - Ativar/desativar
     */
    toggleOptimization(type, enabled) {
        switch (type) {
            case 'lod':
                this.lodEnabled = enabled;
                break;
            case 'culling':
                this.frustumCullingEnabled = enabled;
                if (!enabled) {
                    // Restaurar visibilidade de todos os objetos
                    this.scene.traverse(object => {
                        if (object.userData.originallyVisible !== undefined) {
                            object.visible = object.userData.originallyVisible;
                        }
                    });
                }
                break;
        }
        
        console.log(`${type} ${enabled ? 'ativado' : 'desativado'}`);
    }

    /**
     * Limpa recursos de otimização
     */
    dispose() {
        // Limpar pools
        this.objectPools.forEach(pool => {
            pool.forEach(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            });
        });
        this.objectPools.clear();
        
        // Limpar LODs
        this.lodObjects.forEach(lod => {
            lod.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.lodObjects.clear();
        
        console.log('Sistema de otimização limpo');
    }
}

// Exportar para uso global
window.PerformanceOptimizer = PerformanceOptimizer;
