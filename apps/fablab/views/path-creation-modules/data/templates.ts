import { Template } from '../types';

export const predefinedTemplates: Template[] = [
  // ===== HEADERS =====
  {
    id: 'header-modern-nav',
    name: 'Modern Navigation',
    description: 'Header con navegación moderna y botón CTA',
    type: 'header',
    html: `<nav class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
  <div class="container mx-auto px-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">Mi Sitio</h1>
    <ul class="flex gap-6">
      <li><a href="#home" class="hover:underline">Inicio</a></li>
      <li><a href="#about" class="hover:underline">Acerca</a></li>
      <li><a href="#services" class="hover:underline">Servicios</a></li>
      <li><a href="#contact" class="hover:underline">Contacto</a></li>
    </ul>
    <button class="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold">
      Comenzar
    </button>
  </div>
</nav>`,
    css: '',
    useTailwind: true,
  },
  

  // ===== BODIES =====
  {
    id: 'body-hero-section',
    name: 'Hero Section',
    description: 'Sección hero con llamado a la acción',
    type: 'body',
    html: `<section class="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-5xl font-bold mb-6">Bienvenido a Tu Proyecto</h1>
    <p class="text-xl mb-8 max-w-2xl mx-auto">
      Crea sitios web increíbles con nuestro orquestador de módulos. 
      Rápido, eficiente y totalmente personalizable.
    </p>
    <div class="flex gap-4 justify-center">
      <button class="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100">
        Comenzar Ahora
      </button>
      <button class="border-2 border-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white hover:text-purple-600">
        Ver Demo
      </button>
    </div>
  </div>
</section>`,
    css: '',
    useTailwind: true,
  },

  // ===== FOOTERS =====
  {
    id: 'footer-modern',
    name: 'Footer Moderno',
    description: 'Footer con múltiples columnas y redes sociales',
    type: 'footer',
    html: `<footer class="bg-gray-900 text-gray-300 py-12">
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8 mb-8">
      <div>
        <h3 class="text-white text-xl font-bold mb-4">COMPANY</h3>
        <p class="text-sm">Creando experiencias digitales excepcionales desde 2020.</p>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Enlaces</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white">Inicio</a></li>
          <li><a href="#" class="hover:text-white">Servicios</a></li>
          <li><a href="#" class="hover:text-white">Blog</a></li>
          <li><a href="#" class="hover:text-white">Contacto</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Legal</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white">Privacidad</a></li>
          <li><a href="#" class="hover:text-white">Términos</a></li>
          <li><a href="#" class="hover:text-white">Cookies</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Síguenos</h4>
        <div class="flex gap-4 text-xl">
          <a href="#" class="hover:text-white">📘</a>
          <a href="#" class="hover:text-white">🐦</a>
          <a href="#" class="hover:text-white">📷</a>
          <a href="#" class="hover:text-white">💼</a>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-6 text-center text-sm">
      <p>&copy; 2026 Company Name. Todos los derechos reservados.</p>
    </div>
  </div>
</footer>`,
    css: '',
    useTailwind: true,
  },

];
