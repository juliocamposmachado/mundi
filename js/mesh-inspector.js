/**
 * Sistema de Inspeção de Mesh
 * Permite inspecionar detalhes técnicos das geometrias e materiais
 */

class MeshInspector {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Estado de inspeção
        this.isEnabled = false;
        this.selectedObject = null;
        this.wireframeMode = false;
        
        // Raycaster para seleção
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Helpers visuais
        this.boundingBoxHelper = null;
        this.vertexHelper = null;
        this.normalHelper = null;
        
        this.init();
    }

    /**
     * Inicializa o inspetor
     */
    init() {
        this.setupEventListeners();
        console.log('Inspetor de mesh inicializado');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        document.addEventListener('click', this.onMouseClick.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    /**
     * Manipula clique do mouse para seleção de objetos
     */
    onMouseClick(event) {
        if (!this.isEnabled) return;
        
        // Evitar conflito com UI
        if (event.target.tagName !== 'CANVAS') return;
        
        // Calcular posição do mouse
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            this.selectObject(object);
        } else {
            this.deselectObject();
        }
    }

    /**
     * Manipula teclas para controles de inspeção
     */
    onKeyDown(event) {
        if (!this.isEnabled) return;
        
        switch (event.code) {
            case 'KeyI':
                this.toggleEnabled();
                break;
            case 'KeyV':
                this.toggleVertexDisplay();
                break;
            case 'KeyN':
                this.toggleNormalDisplay();
                break;
            case 'KeyB':
                this.toggleBoundingBox();
                break;
            case 'Escape':
                this.deselectObject();
                break;
        }
    }

    /**
     * Ativa/desativa o modo de inspeção
     */
    toggleEnabled() {
        this.isEnabled = !this.isEnabled;
        
        if (!this.isEnabled) {
            this.deselectObject();
        }
        
        this.updateUI();
        console.log(`Inspetor de mesh: ${this.isEnabled ? 'ATIVO' : 'INATIVO'}`);
    }

    /**
     * Seleciona um objeto para inspeção
     * @param {THREE.Object3D} object - Objeto a ser inspecionado
     */
    selectObject(object) {
        // Deselecionar objeto anterior
        this.deselectObject();
        
        // Selecionar novo objeto
        this.selectedObject = object;
        
        // Destacar visualmente
        this.highlightObject(object);
        
        // Atualizar informações
        this.updateObjectInfo();
        
        // Mostrar helpers se ativados
        this.updateHelpers();
        
        console.log('Objeto selecionado:', object.name || 'Unnamed');
    }

    /**
     * Deseleciona o objeto atual
     */
    deselectObject() {
        if (this.selectedObject) {
            this.unhighlightObject(this.selectedObject);
            this.selectedObject = null;
        }
        
        this.clearHelpers();
        this.updateObjectInfo();
    }

    /**
     * Destaca visualmente um objeto
     * @param {THREE.Object3D} object - Objeto para destacar
     */
    highlightObject(object) {
        if (object.isMesh && object.material) {
            // Salvar material original
            object.userData.originalMaterial = object.material;
            
            // Criar material de seleção
            const highlightMaterial = object.material.clone();
            highlightMaterial.emissive = new THREE.Color(0x444444);
            highlightMaterial.emissiveIntensity = 0.3;
            
            object.material = highlightMaterial;
        }
    }

    /**
     * Remove destaque visual de um objeto
     * @param {THREE.Object3D} object - Objeto para remover destaque
     */
    unhighlightObject(object) {
        if (object.userData.originalMaterial) {
            object.material = object.userData.originalMaterial;
            delete object.userData.originalMaterial;
        }
    }

    /**
     * Atualiza as informações do objeto selecionado
     */
    updateObjectInfo() {
        const meshInfo = document.getElementById('mesh-info');
        if (!meshInfo) return;
        
        if (!this.selectedObject) {
            meshInfo.innerHTML = '<p>Nenhum objeto selecionado</p><p>Clique em um objeto para inspecionar</p>';
            return;
        }
        
        const obj = this.selectedObject;
        let info = `<h4>Objeto: ${obj.name || 'Unnamed'}</h4>`;
        
        // Informações básicas
        info += '<div class="info-section">';
        info += '<strong>Informações Básicas:</strong><br>';
        info += `Tipo: ${obj.type}<br>`;
        info += `ID: ${obj.id}<br>`;
        info += `UUID: ${obj.uuid}<br>`;
        info += `Visível: ${obj.visible ? 'Sim' : 'Não'}<br>`;
        info += '</div>';
        
        // Posição, rotação, escala
        info += '<div class="info-section">';
        info += '<strong>Transformações:</strong><br>';
        info += `Posição: (${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)})<br>`;
        info += `Rotação: (${obj.rotation.x.toFixed(2)}, ${obj.rotation.y.toFixed(2)}, ${obj.rotation.z.toFixed(2)})<br>`;
        info += `Escala: (${obj.scale.x.toFixed(2)}, ${obj.scale.y.toFixed(2)}, ${obj.scale.z.toFixed(2)})<br>`;
        info += '</div>';
        
        // Informações da geometria (se for mesh)
        if (obj.isMesh && obj.geometry) {
            const geo = obj.geometry;
            info += '<div class="info-section">';
            info += '<strong>Geometria:</strong><br>';
            info += `Tipo: ${geo.type}<br>`;
            
            if (geo.attributes.position) {
                info += `Vértices: ${geo.attributes.position.count}<br>`;
            }
            
            if (geo.index) {
                info += `Triângulos: ${geo.index.count / 3}<br>`;
            } else if (geo.attributes.position) {
                info += `Triângulos: ${geo.attributes.position.count / 3}<br>`;
            }
            
            // Bounding box
            if (!geo.boundingBox) {
                geo.computeBoundingBox();
            }
            
            if (geo.boundingBox) {
                const size = geo.boundingBox.getSize(new THREE.Vector3());
                info += `Dimensões: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}<br>`;
            }
            
            // Atributos disponíveis
            const attributes = Object.keys(geo.attributes);
            info += `Atributos: ${attributes.join(', ')}<br>`;
            info += '</div>';
            
            // Informações detalhadas dos atributos
            info += this.getAttributeDetails(geo);
        }
        
        // Informações do material
        if (obj.material) {
            info += this.getMaterialDetails(obj.material);
        }
        
        // Sombras
        info += '<div class="info-section">';
        info += '<strong>Sombras:</strong><br>';
        info += `Projeta sombra: ${obj.castShadow ? 'Sim' : 'Não'}<br>`;
        info += `Recebe sombra: ${obj.receiveShadow ? 'Sim' : 'Não'}<br>`;
        info += '</div>';
        
        meshInfo.innerHTML = info;
    }

    /**
     * Obtém detalhes dos atributos da geometria
     * @param {THREE.BufferGeometry} geometry - Geometria
     * @returns {string} HTML com detalhes
     */
    getAttributeDetails(geometry) {
        let info = '<div class="info-section">';
        info += '<strong>Detalhes dos Atributos:</strong><br>';
        
        Object.entries(geometry.attributes).forEach(([name, attribute]) => {
            info += `<div style="margin-left: 10px;">`;
            info += `<strong>${name}:</strong><br>`;
            info += `• Componentes: ${attribute.itemSize}<br>`;
            info += `• Tipo: ${attribute.array.constructor.name}<br>`;
            info += `• Elementos: ${attribute.count}<br>`;
            info += `• Normalizado: ${attribute.normalized ? 'Sim' : 'Não'}<br>`;
            
            // Amostra de valores (primeiros 3 elementos)
            if (attribute.count > 0) {
                const sample = [];
                const maxSample = Math.min(3, attribute.count);
                
                for (let i = 0; i < maxSample; i++) {
                    const values = [];
                    for (let j = 0; j < attribute.itemSize; j++) {
                        values.push(attribute.array[i * attribute.itemSize + j].toFixed(3));
                    }
                    sample.push(`(${values.join(', ')})`);
                }
                
                info += `• Amostra: ${sample.join(', ')}<br>`;
            }
            info += '</div>';
        });
        
        info += '</div>';
        return info;
    }

    /**
     * Obtém detalhes do material
     * @param {THREE.Material} material - Material
     * @returns {string} HTML com detalhes
     */
    getMaterialDetails(material) {
        let info = '<div class="info-section">';
        info += '<strong>Material:</strong><br>';
        info += `Tipo: ${material.type}<br>`;
        info += `Nome: ${material.name || 'Unnamed'}<br>`;
        info += `Transparente: ${material.transparent ? 'Sim' : 'Não'}<br>`;
        info += `Opacidade: ${material.opacity.toFixed(2)}<br>`;
        info += `Lado visível: ${this.getSideString(material.side)}<br>`;
        
        // Propriedades específicas do material
        if (material.color) {
            info += `Cor: #${material.color.getHexString().toUpperCase()}<br>`;
        }
        
        if (material.emissive) {
            info += `Emissiva: #${material.emissive.getHexString().toUpperCase()}<br>`;
        }
        
        if (material.roughness !== undefined) {
            info += `Rugosidade: ${material.roughness.toFixed(2)}<br>`;
        }
        
        if (material.metalness !== undefined) {
            info += `Metalicidade: ${material.metalness.toFixed(2)}<br>`;
        }
        
        // Texturas
        const textureTypes = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'];
        const activeTextures = textureTypes.filter(type => material[type]);
        
        if (activeTextures.length > 0) {
            info += `Texturas: ${activeTextures.join(', ')}<br>`;
        }
        
        info += '</div>';
        return info;
    }

    /**
     * Converte valor de side para string
     * @param {number} side - Valor do side
     * @returns {string} Descrição do side
     */
    getSideString(side) {
        switch (side) {
            case THREE.FrontSide: return 'Frente';
            case THREE.BackSide: return 'Trás';
            case THREE.DoubleSide: return 'Ambos';
            default: return 'Desconhecido';
        }
    }

    /**
     * Alterna exibição de vértices
     */
    toggleVertexDisplay() {
        if (!this.selectedObject || !this.selectedObject.geometry) return;
        
        if (this.vertexHelper) {
            this.clearVertexHelper();
        } else {
            this.showVertices();
        }
    }

    /**
     * Exibe os vértices do objeto selecionado
     */
    showVertices() {
        if (!this.selectedObject || !this.selectedObject.geometry) return;
        
        const geometry = this.selectedObject.geometry;
        const positions = geometry.attributes.position;
        
        if (!positions) return;
        
        // Criar pontos para os vértices
        const vertexGeometry = new THREE.BufferGeometry();
        vertexGeometry.setAttribute('position', positions.clone());
        
        const vertexMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 0.1,
            sizeAttenuation: false
        });
        
        this.vertexHelper = new THREE.Points(vertexGeometry, vertexMaterial);
        this.vertexHelper.position.copy(this.selectedObject.position);
        this.vertexHelper.rotation.copy(this.selectedObject.rotation);
        this.vertexHelper.scale.copy(this.selectedObject.scale);
        
        this.scene.add(this.vertexHelper);
        
        console.log(`Exibindo ${positions.count} vértices`);
    }

    /**
     * Remove helper de vértices
     */
    clearVertexHelper() {
        if (this.vertexHelper) {
            this.scene.remove(this.vertexHelper);
            this.vertexHelper.geometry.dispose();
            this.vertexHelper.material.dispose();
            this.vertexHelper = null;
        }
    }

    /**
     * Alterna exibição de normais
     */
    toggleNormalDisplay() {
        if (!this.selectedObject || !this.selectedObject.geometry) return;
        
        if (this.normalHelper) {
            this.clearNormalHelper();
        } else {
            this.showNormals();
        }
    }

    /**
     * Exibe as normais do objeto selecionado
     */
    showNormals() {
        if (!this.selectedObject || !this.selectedObject.geometry) return;
        
        try {
            // Implementação simplificada sem VertexNormalsHelper
            const geometry = this.selectedObject.geometry;
            const positions = geometry.attributes.position;
            const normals = geometry.attributes.normal;
            
            if (!positions || !normals) {
                console.warn('Geometria não possui normais');
                return;
            }
            
            // Criar linhas para representar normais
            const normalLines = [];
            
            for (let i = 0; i < positions.count; i += 10) { // Mostrar apenas algumas normais
                const px = positions.getX(i);
                const py = positions.getY(i);
                const pz = positions.getZ(i);
                
                const nx = normals.getX(i);
                const ny = normals.getY(i);
                const nz = normals.getZ(i);
                
                normalLines.push(px, py, pz);
                normalLines.push(px + nx, py + ny, pz + nz);
            }
            
            const normalGeometry = new THREE.BufferGeometry();
            normalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(normalLines, 3));
            
            const normalMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            this.normalHelper = new THREE.LineSegments(normalGeometry, normalMaterial);
            
            this.normalHelper.position.copy(this.selectedObject.position);
            this.normalHelper.rotation.copy(this.selectedObject.rotation);
            this.normalHelper.scale.copy(this.selectedObject.scale);
            
            this.scene.add(this.normalHelper);
            console.log('Exibindo normais dos vértices (simplificado)');
        } catch (error) {
            console.warn('Erro ao criar helper de normais:', error.message);
        }
    }

    /**
     * Remove helper de normais
     */
    clearNormalHelper() {
        if (this.normalHelper) {
            this.scene.remove(this.normalHelper);
            this.normalHelper.dispose();
            this.normalHelper = null;
        }
    }

    /**
     * Alterna exibição da bounding box
     */
    toggleBoundingBox() {
        if (!this.selectedObject) return;
        
        if (this.boundingBoxHelper) {
            this.clearBoundingBoxHelper();
        } else {
            this.showBoundingBox();
        }
    }

    /**
     * Exibe a bounding box do objeto selecionado
     */
    showBoundingBox() {
        if (!this.selectedObject) return;
        
        this.boundingBoxHelper = new THREE.BoxHelper(this.selectedObject, 0xffff00);
        this.scene.add(this.boundingBoxHelper);
        
        console.log('Exibindo bounding box');
    }

    /**
     * Remove helper de bounding box
     */
    clearBoundingBoxHelper() {
        if (this.boundingBoxHelper) {
            this.scene.remove(this.boundingBoxHelper);
            this.boundingBoxHelper.dispose();
            this.boundingBoxHelper = null;
        }
    }

    /**
     * Atualiza helpers visuais
     */
    updateHelpers() {
        this.clearHelpers();
        
        // Recriar helpers se necessário
        // Implementar lógica de estado se quiser manter helpers ativos
    }

    /**
     * Remove todos os helpers
     */
    clearHelpers() {
        this.clearVertexHelper();
        this.clearNormalHelper();
        this.clearBoundingBoxHelper();
    }

    /**
     * Atualiza a interface do usuário
     */
    updateUI() {
        const inspector = document.getElementById('mesh-inspector');
        if (!inspector) return;
        
        if (this.isEnabled) {
            inspector.classList.remove('hidden');
        } else {
            inspector.classList.add('hidden');
        }
    }

    /**
     * Exporta dados da mesh selecionada
     */
    exportMeshData() {
        if (!this.selectedObject || !this.selectedObject.geometry) {
            console.warn('Nenhum objeto com geometria selecionado');
            return;
        }
        
        const geometry = this.selectedObject.geometry;
        const meshData = {
            name: this.selectedObject.name || 'unnamed',
            type: geometry.type,
            vertices: [],
            normals: [],
            uvs: [],
            indices: [],
            timestamp: new Date().toISOString()
        };
        
        // Extrair vértices
        if (geometry.attributes.position) {
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                meshData.vertices.push([
                    positions[i],
                    positions[i + 1],
                    positions[i + 2]
                ]);
            }
        }
        
        // Extrair normais
        if (geometry.attributes.normal) {
            const normals = geometry.attributes.normal.array;
            for (let i = 0; i < normals.length; i += 3) {
                meshData.normals.push([
                    normals[i],
                    normals[i + 1],
                    normals[i + 2]
                ]);
            }
        }
        
        // Extrair coordenadas UV
        if (geometry.attributes.uv) {
            const uvs = geometry.attributes.uv.array;
            for (let i = 0; i < uvs.length; i += 2) {
                meshData.uvs.push([
                    uvs[i],
                    uvs[i + 1]
                ]);
            }
        }
        
        // Extrair índices
        if (geometry.index) {
            meshData.indices = Array.from(geometry.index.array);
        }
        
        // Criar arquivo para download
        const dataStr = JSON.stringify(meshData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mesh-${meshData.name}-data.json`;
        link.click();
        
        console.log('Dados da mesh exportados');
    }

    /**
     * Obtém informações para debug
     * @returns {Object} Informações do inspetor
     */
    getInfo() {
        return {
            enabled: this.isEnabled,
            selectedObject: this.selectedObject ? this.selectedObject.name || 'Unnamed' : null,
            helpersActive: {
                vertices: !!this.vertexHelper,
                normals: !!this.normalHelper,
                boundingBox: !!this.boundingBoxHelper
            }
        };
    }

    /**
     * Limpa recursos
     */
    dispose() {
        this.deselectObject();
        this.clearHelpers();
        
        document.removeEventListener('click', this.onMouseClick);
        document.removeEventListener('keydown', this.onKeyDown);
    }
}

// Exportar para uso global
window.MeshInspector = MeshInspector;
