# Mundo Virtual 3D Imersivo

Um ambiente virtual tridimensional completo e interativo desenvolvido com Three.js, apresentando navegação em primeira/terceira pessoa, ciclo dia/noite dinâmico, terreno procedural e sistema modular de objetos.

## 🌟 Características Principais

### 🏞️ Ambiente Realista
- **Terreno procedural** com colinas e planícies texturizadas
- **Skybox dinâmico** com ciclo dia/noite realista
- **Iluminação PBR** (Physically Based Rendering)
- **Sombras em tempo real** com soft shadows
- **Fog atmosférico** para imersão

### 🎮 Navegação Intuitiva
- **Primeira pessoa** com controle de mouse e teclado
- **Terceira pessoa** com câmera orbital
- **Movimento fluído** com colisão no terreno
- **Corrida** e movimento vertical
- **Pointer Lock API** para controle imersivo

### 🏗️ Sistema Modular de Objetos
- **Adição/remoção em tempo real** de objetos
- **NPCs animados** com diálogos
- **Construções interativas** (casas, estruturas)
- **Vegetação procedural** (árvores, rochas)
- **Sistema de interação** por clique

### 🔧 Inspetor de Mesh Avançado
- **Análise detalhada** de geometrias 3D
- **Visualização de vértices, normais e bounding boxes**
- **Exportação de dados** de mesh
- **Informações de material** e texturas
- **Sistema de seleção visual**

### ⚡ Otimização de Performance
- **Level of Detail (LOD)** automático
- **Frustum Culling** para objetos fora de vista
- **Object Pooling** para reutilização
- **Qualidade adaptativa** baseada em FPS
- **Monitoramento de performance** em tempo real

### 🥽 Suporte VR/WebXR
- **Compatibilidade com óculos VR**
- **Detecção automática** de dispositivos VR
- **Interface adaptável** para VR

## 🚀 Como Usar

### Pré-requisitos
- Navegador moderno com suporte a WebGL
- Conexão com internet (para carregar Three.js via CDN)

### Execução Local
1. Clone ou baixe o projeto
2. Abra `index.html` em um navegador web
3. Aguarde o carregamento do mundo virtual

### Hospedagem Web
1. Faça upload dos arquivos para um servidor web
2. Acesse via HTTP/HTTPS (necessário para algumas funcionalidades)

## 🎯 Controles

### Movimento
- **WASD** - Mover câmera
- **Mouse** - Olhar ao redor
- **Shift** - Correr
- **Espaço** - Subir
- **C** - Descer

### Interação
- **Click** - Interagir com objetos
- **Click nos botões da UI** - Adicionar objetos ao mundo

### Sistema
- **P** - Pausar/Despausar
- **F** - Fullscreen
- **H** - Ocultar/Mostrar UI
- **F1** - Ajuda

### Inspetor de Mesh (quando ativo)
- **I** - Ativar/Desativar inspetor
- **V** - Mostrar vértices
- **N** - Mostrar normais
- **B** - Mostrar bounding box
- **ESC** - Desselecionar objeto

## 🏗️ Arquitetura do Projeto

### Estrutura de Arquivos
```
mundi/
├── index.html              # Interface principal
├── README.md              # Documentação
└── js/
    ├── main.js            # Script principal e coordenador
    ├── terrain.js         # Geração procedural de terreno
    ├── skybox.js          # Sistema de céu dinâmico
    ├── camera-controller.js # Controle de câmera e navegação
    ├── world-manager.js    # Gerenciamento de objetos do mundo
    ├── mesh-inspector.js   # Sistema de inspeção técnica
    └── performance-optimizer.js # Otimização e LOD
```

### Componentes Principais

#### 1. VirtualWorld (main.js)
Classe principal que coordena todos os sistemas e gerencia o ciclo de vida da aplicação.

#### 2. TerrainGenerator (terrain.js)
- Gera terreno procedural usando noise
- Aplica texturas realistas
- Calcula altura para colisões

#### 3. SkyboxSystem (skybox.js)
- Ciclo dia/noite dinâmico
- Posicionamento realista do sol e lua
- Iluminação atmosférica

#### 4. CameraController (camera-controller.js)
- Navegação em primeira/terceira pessoa
- Sistema de colisão
- Controles responsivos

#### 5. WorldManager (world-manager.js)
- Sistema modular de objetos
- Interações e eventos
- Animações de NPCs

#### 6. MeshInspector (mesh-inspector.js)
- Análise técnica detalhada
- Visualização de dados de mesh
- Ferramentas de debug

#### 7. PerformanceOptimizer (performance-optimizer.js)
- LOD automático
- Culling inteligente
- Adaptação de qualidade

## 🛠️ Funcionalidades Técnicas

### Renderização
- **WebGL** com Three.js r158
- **PBR Materials** para realismo
- **Shadow Mapping** com PCF soft shadows
- **Tone Mapping** ACES Filmic
- **Anti-aliasing** MSAA

### Geometrias
- **Terreno procedural** com múltiplas oitavas de noise
- **Objetos paramétricos** (árvores, construções, NPCs)
- **LOD automático** com 4 níveis de detalhe
- **Impostors** para objetos distantes

### Materiais
- **PBR Standard Materials** com roughness e metalness
- **Texturas procedurais** geradas via Canvas 2D
- **Normal mapping** para detalhes
- **Emissive materials** para efeitos

### Performance
- **Frustum Culling** automático
- **Object Pooling** para reciclagem
- **Adaptive Quality** baseada em FPS
- **Memory Management** com dispose adequado

## 🔧 Personalização

### Adicionando Novos Objetos
```javascript
// No WorldManager
addCustomObject(x, z) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const object = new THREE.Mesh(geometry, material);
    
    object.position.set(x, this.terrain.getHeightAt(x, z), z);
    object.userData.type = 'custom';
    object.userData.interactive = true;
    
    this.scene.add(object);
    this.registerObject('custom', object);
}
```

### Modificando Terreno
```javascript
// No TerrainGenerator
// Altere as configurações no construtor:
this.size = 2000;           // Tamanho do terreno
this.segments = 512;        // Resolução da malha
this.heightScale = 100;     // Escala das montanhas
```

### Customizando Skybox
```javascript
// No SkyboxSystem
// Modifique as cores do céu:
this.skyColors = {
    dawn: new THREE.Color(0xff6b35),
    day: new THREE.Color(0x87ceeb),
    dusk: new THREE.Color(0xff4500),
    night: new THREE.Color(0x191970)
};
```

## 📊 Monitoramento

### Estatísticas em Tempo Real
- FPS médio com indicador visual
- Objetos visíveis vs. culled
- Informações de memória GPU
- Contadores de draw calls

### Console API
```javascript
// Obter estatísticas completas
const stats = virtualWorld.getWorldStats();

// Exportar dados do mundo
virtualWorld.exportWorldData();

// Controlar sistemas individualmente
performanceOptimizer.toggleOptimization('lod', false);
meshInspector.toggleEnabled();
```

## 🌐 Compatibilidade

### Navegadores Suportados
- **Chrome/Chromium** 80+
- **Firefox** 75+
- **Safari** 13.1+
- **Edge** 80+

### Dispositivos VR
- **Oculus Rift/Quest**
- **HTC Vive**
- **Windows Mixed Reality**
- **Outros headsets WebXR compatíveis**

### Requisitos de Hardware
- **GPU** com suporte a WebGL 2.0
- **RAM** mínima 4GB
- **CPU** dual-core moderno

## 🐛 Troubleshooting

### Performance Baixa
1. O sistema reduz automaticamente a qualidade
2. Verifique se WebGL está habilitado
3. Atualize drivers da GPU
4. Feche outras abas/aplicações pesadas

### Objetos Não Aparecem
1. Verifique o console para erros
2. Aguarde o carregamento completo
3. Teste em navegador diferente

### VR Não Funciona
1. Use HTTPS (necessário para WebXR)
2. Verifique se o headset está conectado
3. Confirme suporte do navegador a WebXR

## 📈 Roadmap Futuro

### Funcionalidades Planejadas
- [ ] **Sistema de física** com Cannon.js
- [ ] **Multiplayer** com WebRTC
- [ ] **Texturas externas** carregáveis
- [ ] **Editor visual** de mundo
- [ ] **Partículas avançadas** (clima, fogo)
- [ ] **Audio espacial** 3D
- [ ] **Salvamento/carregamento** de mundos
- [ ] **Scripting** personalizado para objetos

### Melhorias Técnicas
- [ ] **WebGPU** quando disponível
- [ ] **Web Workers** para processamento pesado
- [ ] **Instanced Rendering** para vegetação
- [ ] **Temporal AA** para melhor qualidade
- [ ] **SSAO** (Screen Space Ambient Occlusion)

## 📝 Licença

Este projeto está disponível sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas, sugestões ou problemas:
- Abra uma issue no repositório
- Consulte a documentação do Three.js
- Verifique o console do navegador para erros

---

**Desenvolvido com ❤️ usando Three.js e WebGL**

*Mundo Virtual 3D - Uma experiência imersiva completa no navegador*
