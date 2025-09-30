# 📝 INF Meets Auditor

**Auditor de transcripciones y síntesis de reuniones** - Herramienta web para revisar, anotar y exportar análisis de calidad de transcripciones automáticas.

## 🎯 Descripción

El INF Meets Auditor es una aplicación web que permite a los usuarios auditar la calidad de transcripciones y síntesis generadas automáticamente por sistemas de IA. Facilita la identificación, categorización y cuantificación de errores para mejorar la precisión de los sistemas de transcripción.

## ✨ Características Principales

### 🔍 **Auditoría Completa**
- **Transcripciones**: Revisión de texto hablado con identificación de errores de speaker, contenido, timestamps, etc.
- **Síntesis**: Análisis de resúmenes automáticos con detección de imprecisiones, omisiones y alucinaciones
- **Timestamps relativos**: Visualización de tiempos basados en el inicio de la reunión

### 📊 **Sistema de Errores**
- **10 tipos de errores** para transcripciones
- **6 tipos de errores** para síntesis  
- **Contadores por bloque** y totales globales
- **Notas personalizadas** por bloque
- **Filtrado dinámico** por tipo de error

### 💾 **Gestión de Datos**
- **Carga desde JSON**: Importación directa desde APIs de reuniones
- **Backup completo**: Exportación/importación del estado completo
- **Export CSV**: Datos listos para análisis en Excel
- **Persistencia local**: Estado guardado automáticamente

### 🎨 **Experiencia de Usuario**
- **3 tabs principales**: Transcripción, Síntesis, Ayuda
- **Navegación con URL**: Tabs persistentes en la URL (F5 friendly)
- **Ayuda integrada**: Documentación completa en la aplicación
- **Versionado visible**: Badge de versión en la interfaz

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd INF-meets-auditor/auditor_de_transcripciones

# Instalar dependencias
npm install

# Desarrollo (con hot reload)
npm run dev

# Compilar para producción
npm run build
```

### Uso

1. **Abrir la aplicación**: `dist/index.html` después de compilar
2. **Cargar datos**: 
   - Usar archivos JSON de ejemplo en `mock/`
   - Importar desde DevTools de la app de reuniones (ver tab Ayuda)
3. **Auditar**: Hacer clic en chips de errores para incrementar contadores
4. **Exportar**: CSV para análisis o backup JSON para persistencia

## 📁 Estructura del Proyecto

```
auditor_de_transcripciones/
├── 📄 index.html          # Template principal
├── 📁 js/                 # Código JavaScript modular
│   ├── main.js           # Lógica principal y estado
│   ├── render.js         # Renderizado de UI
│   ├── export.js         # Exportación CSV/backup
│   ├── jsonSource.js     # Carga de JSON desde APIs
│   ├── storage.js        # Persistencia localStorage
│   ├── utils.js          # Utilidades comunes
│   └── errorCatalogs.js  # Catálogos de tipos de error
├── 📁 css/
│   └── styles.scss       # Estilos principales
├── 📁 mock/              # Datos de ejemplo
│   ├── source-transcription.json
│   └── source-sintesis.json
├── 📁 assets/legacy/     # Versiones anteriores
├── 📁 dist/              # Archivos compilados
├── 📄 package.json       # Dependencias y scripts
└── 📄 webpack.config.cjs # Configuración de build
```

## 🔧 Desarrollo

### Scripts Disponibles

```bash
npm run dev     # Servidor de desarrollo con hot reload
npm run build   # Compilación para producción
npm run watch   # Compilación en modo watch
```

### Tecnologías

- **Frontend**: HTML5, JavaScript ES6+, SCSS
- **Build**: Webpack 5, Babel
- **Arquitectura**: Modular con ES6 modules
- **Persistencia**: localStorage del navegador

## 📖 Documentación

### Tipos de Errores

**Transcripción (10 tipos)**:
- Err. orador, Err. contenido, Err. timestamp, Palabra inventada, etc.

**Síntesis (6 tipos)**:
- Imprecisión, Omisión importante, Alucinación, etc.

Ver documentación completa en el **tab Ayuda** de la aplicación.

### Formato de Datos

La aplicación acepta JSON con estructura específica:

```json
{
  "bites": [...],
  "title": "Título de la reunión",
  "date": "2025-07-08T08:35:00Z"
}
```

Ver archivos en `mock/` para ejemplos completos.

## 🔄 Versionado

- **Versionado automático**: Badge visible en la interfaz
- **Changelog**: Ver commits para historial detallado


## 🆘 Soporte

Para soporte técnico o preguntas:
- Consultar el **tab Ayuda** en la aplicación
- Revisar archivos en `assets/legacy/` para versiones anteriores

---

**Desarrollado con ❤️ Juan Ruiz Contreras para el equipo de Infinia**

*Última actualización: Septiembre 2025 - v2.0.0*
