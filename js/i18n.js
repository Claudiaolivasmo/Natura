// === 🌐 i18n.js — gestor simple de textos ES/EN ===
(function () {
  // Detectar idioma desde <html lang="...">
  const htmlLang = (document.documentElement.lang || 'es').toLowerCase();

  // Normalizamos solo 'es' o 'en' (por si usas 'en-US', 'es-CR', etc.)
  let LANG = 'es';
  if (htmlLang.startsWith('en')) LANG = 'en';
  if (htmlLang.startsWith('es')) LANG = 'es';

  // Diccionario de traducciones
  const TRANSLATIONS = {
    es: {
      // --- Navegación / header ---
      navHome: "Inicio",
      navProperties: "Propiedades",
      navAbout: "Sobre Nosotros",
      navContact: "Contacto",
      headerMenuOpen: "Abrir menú",

      // --- Form handler (mensajes de estado) ---
      formRequiredFields: "Por favor complete todos los campos obligatorios.",
      formSending: "Enviando…",
      formSuccess: "¡Gracias! Hemos recibido su solicitud. Nos pondremos en contacto pronto.",
      formGenericError: "Hubo un problema al enviar. Intente de nuevo.",
      formNetworkError: "Error de red. Revise su conexión e intente nuevamente.",

      // --- Home / propiedades destacadas (home.js) ---
      labelBedrooms: "Hab",
      labelBathrooms: "Baños",
      labelLot: "lote",
      priceOnRequest: "Precio a consultar",
      viewDetails: "Ver detalles",
      homeNoFeatured: "Aún no hay propiedades destacadas.",
      homePropsLoadError: "No se pudieron cargar las propiedades.",
      propertyAltFallback: "Propiedad",

      // --- Home: hero ---
      homeTagline: "Bienes con raíces en la naturaleza",
      homeHeroText:
        "Ofrecemos espacios donde el lujo habita en la sencillez, el entorno y la conexión. Hogares que nacen de la tierra y se funden con la naturaleza.",
      homeBtnExplore: "Explorar Propiedades",
      homeBtnContact: "Contactar Agente",

      // --- Home: stats ---
      homeStatFinance: "Años de Experiencia en Finanzas",
      homeStatRealEstate: "Años de Experiencia en Bienes Raíces",
      homeStatActiveProperties: "Propiedades Activas",

      // --- Home: Sobre Natura ---
      homeAboutTitle: "Sobre Natura Real Estate",
      homeAboutText:
        "Acompañamos cada paso de su inversión inmobiliaria con experiencia, transparencia y compromiso con la sostenibilidad.",
      homeAboutExperienceTitle: "Experiencia Comprobada",
      homeAboutExperienceText:
        "Más de 25 años especializándonos en el mercado de La Fortuna y San Carlos.",
      homeAboutSustainableTitle: "Compromiso Sostenible",
      homeAboutSustainableText:
        "Promovemos desarrollos que respetan el medio ambiente y la belleza natural de la región.",
      homeAboutServiceTitle: "Servicio Personalizado",
      homeAboutServiceText:
        "Atención personalizada con un agente dedicado que entiende sus metas de inversión.",
      homeAboutCreditTitle: "Gestión de Créditos",
      homeAboutCreditText:
        "Asistencia en trámites y documentación para su crédito hipotecario.",

      // --- Home: Propiedades destacadas ---
      homeFeaturedTitle: "Propiedades Destacadas",
      homeFeaturedSubtitle: "Conoce nuestras selecciones más exclusivas en armonía con la naturaleza.",
      homeBtnViewAll: "Ver Todas las Propiedades",

      // --- Home: Vivir en La Fortuna ---
      homeLaFortunaTitle: "Vivir en La Fortuna",
      homeLaFortunaIntro:
        "Rodeada por el majestuoso Volcán Arenal, aguas termales y selva tropical, La Fortuna es un santuario de tranquilidad y conexión con la naturaleza.",
      homeLaFortunaNatureTitle: "Naturaleza Viva",
      homeLaFortunaNatureText: "Vistas al volcán, senderos y cataratas.",
      homeLaFortunaWellnessTitle: "Bienestar Natural",
      homeLaFortunaWellnessText: "Termales, yoga y aire puro.",
      homeLaFortunaCommunityTitle: "Comunidad Vibrante",
      homeLaFortunaCommunityText: "Vecinos acogedores y espíritu sostenible.",

      // --- Home: Servicios ---
      homeServicesTitle: "Servicios Integrales de Bienes Raíces",
      homeServicesIntro:
        "Servicio completo y personalizado desde la búsqueda hasta la entrega de llaves, con más de 25 años de experiencia.",
      homeServicesBuySellTitle: "Compra y Venta de Propiedades",
      homeServicesBuySellText:
        "Asesoría experta para encontrar o vender con las mejores condiciones.",
      homeServicesLegalTitle: "Gestión Legal Completa",
      homeServicesLegalText:
        "Trámites notariales, permisos y acompañamiento legal integral.",
      homeServicesFinanceTitle: "Financiamiento y Créditos",
      homeServicesFinanceText:
        "Asistencia para obtener créditos hipotecarios en buenas condiciones.",

      // --- Home: formulario de cita ---
      homeFormTitle: "Agende una Cita",
      homeFormIntro: "Le acompañamos en el descubrimiento de su propiedad ideal en La Fortuna.",

      formFirstNameLabel: "Nombre",
      formFirstNamePlaceholder: "Su nombre",
      formLastNameLabel: "Apellido",
      formLastNamePlaceholder: "Su apellido",
      formEmailLabel: "Email",
      formEmailPlaceholder: "su@email.com",
      formPhoneLabel: "Teléfono",
      formPhonePlaceholder: "+506 0000-0000",

      formServiceLabel: "Servicio de Interés",
      formServiceOptionSelect: "Seleccione un servicio",
      formServiceOptionBuy: "Compra de Propiedad",
      formServiceOptionSell: "Venta de Propiedad",
      formServiceOptionFinance: "Asesoría Financiera",

      formBudgetLabel: "Presupuesto (USD)",
      formBudgetOptionSelect: "Seleccione rango",
      formBudget100_250: "$100,000 - $250,000",
      formBudget250_500: "$250,000 - $500,000",
      formBudget500_1000: "$500,000 - $1,000,000",
      formBudget1000plus: "$1,000,000+",

      formPreferredDateLabel: "Fecha Preferida",
      formPreferredTimeLabel: "Hora Preferida",
      formTimeOptionSelect: "Seleccione hora",
      formTimeMorning: "Mañana (8:00 AM - 12:00 PM)",
      formTimeAfternoon: "Tarde (1:00 PM - 5:00 PM)",
      formTimeEvening: "Noche (6:00 PM - 8:00 PM)",

      formMessageLabel: "Mensaje Adicional",
      formMessagePlaceholder: "Cuéntenos sobre sus necesidades específicas...",
      formSubmitBtn: "Enviar Consulta",

      // --- Footer / newsletter ---
      footerTagline: "Propiedades seleccionadas en La Fortuna y alrededores.",
      newsletterPlaceholder: "Tu email",
      newsletterButton: "Suscribirse",
      footerLocation: "La Fortuna · Costa Rica",
      footerCopyright: "© 2025 Natura Real Estate · Todos los derechos reservados",

      // --- Properties / listados ---
      propNoResults: "No se encontraron propiedades con los filtros seleccionados.",
      propHideAdvanced: "Ocultar avanzado",
      propShowAdvanced: "Avanzado",
      propTopography: "Topografía",
      propUse: "Uso",
      propLandBadge: "Terreno",
      propContactPrice: "Consultar",
      propSold: "VENDIDO",
      propSoldLabel: "Propiedad vendida",
      propPrevPageLabel: "Página anterior",
      propPrevPage: "Anterior",
      propNextPageLabel: "Página siguiente",
      propNextPage: "Siguiente",

      // --- Property details ---
      interestMessage: "Hola, me interesa la propiedad",
    },

    en: {
      // --- Navigation / header ---
      navHome: "Home",
      navProperties: "Properties",
      navAbout: "About Us",
      navContact: "Contact",
      headerMenuOpen: "Open menu",

      // --- Form handler ---
      formRequiredFields: "Please fill in all required fields.",
      formSending: "Sending…",
      formSuccess: "Thank you! Your request has been received. We will contact you soon.",
      formGenericError: "There was an issue submitting the form. Please try again.",
      formNetworkError: "Network error. Please check your connection and try again.",

      // --- Home / featured properties (home.js) ---
      labelBedrooms: "Bed",
      labelBathrooms: "Bath",
      labelLot: "lot",
      priceOnRequest: "Price on request",
      viewDetails: "View details",
      homeNoFeatured: "There are no featured properties yet.",
      homePropsLoadError: "Properties could not be loaded.",
      propertyAltFallback: "Property",

      // --- Home: hero ---
      homeTagline: "Homes rooted in nature",
      homeHeroText:
        "We present spaces where comfort lives in simplicity, landscape and connection. Homes that are born from the land and blend with their surroundings.",
      homeBtnExplore: "Explore Properties",
      homeBtnContact: "Contact Agent",

      // --- Home: stats ---
      homeStatFinance: "Years of Experience in Finance",
      homeStatRealEstate: "Years of Real Estate Experience",
      homeStatActiveProperties: "Active Listings",

      // --- Home: About Natura ---
      homeAboutTitle: "About Natura Real Estate",
      homeAboutText:
        "We accompany every step of your real estate investment with experience, transparency and a commitment to sustainability.",
      homeAboutExperienceTitle: "Proven Experience",
      homeAboutExperienceText:
        "Over 25 years specializing in the La Fortuna and San Carlos markets.",
      homeAboutSustainableTitle: "Sustainable Commitment",
      homeAboutSustainableText:
        "We promote projects that respect the environment and the natural beauty of the region.",
      homeAboutServiceTitle: "Personalized Service",
      homeAboutServiceText:
        "Personal attention from an agent who understands your investment goals.",
      homeAboutCreditTitle: "Credit Support",
      homeAboutCreditText:
        "Guidance with procedures and documentation for your mortgage or financing.",

      // --- Home: Featured properties ---
      homeFeaturedTitle: "Featured Properties",
      homeFeaturedSubtitle: "Discover a selection of properties in harmony with nature.",
      homeBtnViewAll: "View All Properties",

      // --- Home: Living in La Fortuna ---
      homeLaFortunaTitle: "Living in La Fortuna",
      homeLaFortunaIntro:
        "Surrounded by the Arenal Volcano, hot springs and tropical forest, La Fortuna is a sanctuary of peace and connection with nature.",
      homeLaFortunaNatureTitle: "Living Nature",
      homeLaFortunaNatureText: "Volcano views, trails and waterfalls.",
      homeLaFortunaWellnessTitle: "Natural Wellness",
      homeLaFortunaWellnessText: "Hot springs, yoga and fresh air.",
      homeLaFortunaCommunityTitle: "Vibrant Community",
      homeLaFortunaCommunityText: "Welcoming neighbors and a sustainable mindset.",

      // --- Home: Services ---
      homeServicesTitle: "Comprehensive Real Estate Services",
      homeServicesIntro:
        "A complete and personalized service from the search to the handover of keys, backed by more than 25 years of experience.",
      homeServicesBuySellTitle: "Property Purchase and Sale",
      homeServicesBuySellText:
        "Expert advice to buy or sell under the best conditions.",
      homeServicesLegalTitle: "Full Legal Support",
      homeServicesLegalText:
        "Notarial procedures, permits and comprehensive legal guidance.",
      homeServicesFinanceTitle: "Financing and Credit",
      homeServicesFinanceText:
        "Support to obtain mortgage loans under favorable terms.",

      // --- Home: appointment form ---
      homeFormTitle: "Schedule an Appointment",
      homeFormIntro:
        "We help you find your ideal property in La Fortuna and its surroundings.",

      formFirstNameLabel: "First Name",
      formFirstNamePlaceholder: "Your first name",
      formLastNameLabel: "Last Name",
      formLastNamePlaceholder: "Your last name",
      formEmailLabel: "Email",
      formEmailPlaceholder: "you@email.com",
      formPhoneLabel: "Phone",
      formPhonePlaceholder: "+506 0000-0000",

      formServiceLabel: "Service of Interest",
      formServiceOptionSelect: "Select a service",
      formServiceOptionBuy: "Buying a Property",
      formServiceOptionSell: "Selling a Property",
      formServiceOptionFinance: "Financial Advisory",

      formBudgetLabel: "Budget (USD)",
      formBudgetOptionSelect: "Select a range",
      formBudget100_250: "$100,000 - $250,000",
      formBudget250_500: "$250,000 - $500,000",
      formBudget500_1000: "$500,000 - $1,000,000",
      formBudget1000plus: "$1,000,000+",

      formPreferredDateLabel: "Preferred Date",
      formPreferredTimeLabel: "Preferred Time",
      formTimeOptionSelect: "Select a time slot",
      formTimeMorning: "Morning (8:00 AM - 12:00 PM)",
      formTimeAfternoon: "Afternoon (1:00 PM - 5:00 PM)",
      formTimeEvening: "Evening (6:00 PM - 8:00 PM)",

      formMessageLabel: "Additional Message",
      formMessagePlaceholder: "Tell us about your specific needs...",
      formSubmitBtn: "Send Inquiry",

      // --- Footer / newsletter ---
      footerTagline: "Handpicked properties in La Fortuna and surrounding areas.",
      newsletterPlaceholder: "Your email",
      newsletterButton: "Subscribe",
      footerLocation: "La Fortuna · Costa Rica",
      footerCopyright: "© 2025 Natura Real Estate · All rights reserved",
      
      // --- Properties / listings ---
      propNoResults: "No properties matched the selected filters.",
      propHideAdvanced: "Hide advanced",
      propShowAdvanced: "Advanced",
      propTopography: "Topography",
      propUse: "Use",
      propLandBadge: "Land",
      propContactPrice: "Contact for price",
      propSold: "SOLD",
      propSoldLabel: "Property sold",
      propPrevPageLabel: "Previous page",
      propPrevPage: "Previous",
      propNextPageLabel: "Next page",
      propNextPage: "Next",

      // --- Property details ---
      interestMessage: "Hello, I'm interested in the property",
    }
  };

  // Exponer idioma actual (por si lo quieres usar en otros JS)
  window.LANG = LANG;

  // Función de traducción global
  window.t = function t(key) {
    const dict = TRANSLATIONS[LANG] || TRANSLATIONS.es || {};
    return dict[key] || key;
  };
})();
