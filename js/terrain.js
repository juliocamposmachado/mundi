/**
 * Sistema de Terreno Procedural
 * Gera terrenos com colinas, planícies e texturas realistas
 */

class TerrainGenerator {
    constructor() {
        this.size = 1000; // Tamanho do terreno
        this.segments = 256; // Resolução da malha
        this.heightScale = 50; // Escala da altura
        this.textureScale = 10; // Escala da textura
        
        this.terrain = null;
        this.heightData = [];
    }

    /**
     * Gera o terreno principal
     * @param {THREE.Scene} scene - Cena do Three.js
     */
    generateTerrain(scene) {
        // Criar geometria do plano
        const geometry = new THREE.PlaneGeometry(
            this.size, 
            this.size, 
            this.segments, 
            this.segments
        );
        
        // Rotacionar para ficar horizontal
        geometry.rotateX(-Math.PI / 2);
        
        // Gerar dados de altura usando noise
        this.generateHeightData();
        
        // Aplicar altura aos vértices
        this.applyHeightToGeometry(geometry);
        
        // Calcular normais para iluminação correta
        geometry.computeVertexNormals();
        
        // Criar material PBR realista
        const material = this.createTerrainMaterial();
        
        // Criar mesh do terreno
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.name = 'terrain';
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = false;
        
        scene.add(this.terrain);
        
        console.log('Terreno gerado com sucesso!');
        return this.terrain;
    }

    /**
     * Gera dados de altura usando múltiplas oitavas de noise
     */
    generateHeightData() {
        this.heightData = [];
        
        for (let x = 0; x <= this.segments; x++) {
            this.heightData[x] = [];
            
            for (let z = 0; z <= this.segments; z++) {
                // Coordenadas normalizadas
                const nx = x / this.segments;
                const nz = z / this.segments;
                
                // Múltiplas oitavas de noise para terrain realista
                let height = 0;
                
                // Noise base - colinas grandes
                height += this.noise(nx * 2, nz * 2) * 0.5;
                
                // Noise médio - detalhes médios
                height += this.noise(nx * 8, nz * 8) * 0.25;
                
                // Noise fino - detalhes pequenos
                height += this.noise(nx * 32, nz * 32) * 0.125;
                
                // Aplicar escala de altura
                this.heightData[x][z] = height * this.heightScale;
            }
        }
    }

    /**
     * Aplica os dados de altura à geometria
     * @param {THREE.PlaneGeometry} geometry - Geometria do terreno
     */
    applyHeightToGeometry(geometry) {
        const vertices = geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = Math.floor((vertices[i] + this.size / 2) / this.size * this.segments);
            const z = Math.floor((vertices[i + 2] + this.size / 2) / this.size * this.segments);
            
            if (this.heightData[x] && this.heightData[x][z] !== undefined) {
                vertices[i + 1] = this.heightData[x][z];
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Cria material PBR realista para o terreno
     * @returns {THREE.Material} Material do terreno
     */
    createTerrainMaterial() {
        // Texturas procedurais básicas (simuladas)
        const grassTexture = this.createProceduralTexture('#4a7c36', '#2d5a21');
        const dirtTexture = this.createProceduralTexture('#8b4513', '#5d2f0a');
        const rockTexture = this.createProceduralTexture('#696969', '#2f2f2f');
        
        // Material usando múltiplas texturas
        const material = new THREE.MeshStandardMaterial({
            map: grassTexture,
            normalScale: new THREE.Vector2(0.5, 0.5),
            roughness: 0.8,
            metalness: 0.1
        });

        // Configurar repetição de textura
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(this.textureScale, this.textureScale);
        
        return material;
    }

    /**
     * Cria textura procedural simples
     * @param {string} color1 - Cor primária
     * @param {string} color2 - Cor secundária
     * @returns {THREE.Texture} Textura gerada
     */
    createProceduralTexture(color1, color2) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Gradiente base
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Adicionar noise para textura orgânica
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 50;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }

    /**
     * Função de noise simples (Perlin noise simplificado)
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {number} Valor de noise entre -1 e 1
     */
    noise(x, y) {
        // Implementação simplificada de noise
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return 2 * (n - Math.floor(n)) - 1;
    }

    /**
     * Obtém a altura do terreno em uma coordenada específica
     * @param {number} x - Coordenada X do mundo
     * @param {number} z - Coordenada Z do mundo
     * @returns {number} Altura do terreno
     */
    getHeightAt(x, z) {
        if (!this.heightData.length) return 0;
        
        // Converter coordenadas do mundo para índices do array
        const nx = Math.floor(((x + this.size / 2) / this.size) * this.segments);
        const nz = Math.floor(((z + this.size / 2) / this.size) * this.segments);
        
        // Verificar limites
        if (nx < 0 || nx >= this.segments || nz < 0 || nz >= this.segments) {
            return 0;
        }
        
        return this.heightData[nx] ? (this.heightData[nx][nz] || 0) : 0;
    }

    /**
     * Atualiza o material do terreno (para efeitos dinâmicos)
     */
    updateMaterial() {
        if (this.terrain) {
            // Pode ser usado para mudanças sazonais, clima, etc.
            this.terrain.material.needsUpdate = true;
        }
    }

    /**
     * Obtém informações da mesh para inspeção
     * @returns {Object} Informações do terreno
     */
    getMeshInfo() {
        if (!this.terrain) return null;
        
        const geometry = this.terrain.geometry;
        return {
            vertices: geometry.attributes.position.count,
            triangles: geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3,
            size: this.size,
            segments: this.segments,
            material: this.terrain.material.type
        };
    }
}

// Exportar para uso global
window.TerrainGenerator = TerrainGenerator;
