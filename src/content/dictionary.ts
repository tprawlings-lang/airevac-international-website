import type { Locale } from '@/lib/i18n';

/**
 * UI chrome strings.
 *
 * SCOPE LIMIT — blueprint page 24, "Do not build":
 *   "Unreviewed automatic Spanish translation for medical, legal, insurance, or
 *    emergency content."
 *
 * This file therefore contains ONLY navigation labels, button text, form
 * labels, and structural headings. Medical, legal, insurance, and patient-rights
 * *body copy* lives in `src/content/pages/**` and carries a per-locale review
 * status; where Spanish review has not happened, the page renders
 * `TranslationPendingNotice` and points to the coordinator phone line rather
 * than showing an unreviewed translation.
 *
 * The Spanish strings below were drafted for review and are marked
 * `reviewStatus: 'draft'`. They must be signed off under D11 before launch;
 * `npm run test` asserts that no locale is missing a key, and the launch
 * checklist asserts the review actually happened.
 */

export interface Dictionary {
  reviewStatus: 'approved' | 'draft';

  common: {
    skipToContent: string;
    callCoordinator: string;
    call24_7: string;
    secureChat: string;
    secureChatUnavailable: string;
    requestCallback: string;
    requestTransport: string;
    startReferral: string;
    languageSwitch: string;
    switchToEnglish: string;
    switchToSpanish: string;
    menu: string;
    closeMenu: string;
    home: string;
    backToTop: string;
    lastReviewed: string;
    verify: string;
    readMore: string;
    required: string;
    optional: string;
  };

  emergency: {
    /** Page 7: "For an immediate local emergency, call local emergency services." */
    notice: string;
  };

  nav: {
    services: string;
    partners: string;
    patientsFamilies: string;
    coverage: string;
    fleetSafety: string;
    about: string;
    legal: string;
  };

  referralSelector: {
    heading: string;
    description: string;
    hospital: string;
    hospitalDescription: string;
    cruise: string;
    cruiseDescription: string;
    insurance: string;
    insuranceDescription: string;
    family: string;
    familyDescription: string;
  };

  intake: {
    heading: string;
    intro: string;
    /** Page 12: mandatory warning above any free-text field. */
    phiWarning: string;
    phiWarningTitle: string;
    contactName: string;
    organization: string;
    role: string;
    originCity: string;
    originHelp: string;
    destinationCity: string;
    destinationHelp: string;
    timeframe: string;
    phone: string;
    email: string;
    preferredLanguage: string;
    note: string;
    noteHelp: string;
    callbackConsent: string;
    callbackConsentHelp: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    inquiryIdLabel: string;
    errorTitle: string;
    errorBody: string;
    rateLimitedTitle: string;
    rateLimitedBody: string;
    charactersRemaining: string;
    errorSummaryTitle: string;
  };

  timeframes: Record<
    'within-24-hours' | 'within-2-3-days' | 'within-1-week' | 'planning-ahead' | 'unsure',
    string
  >;

  credentials: {
    heading: string;
    scope: string;
    holder: string;
    issuer: string;
    effective: string;
    expires: string;
    lastReviewed: string;
    verifyLink: string;
    noneAvailable: string;
  };

  fleet: {
    tailNumber: string;
    model: string;
    status: string;
    registeredOwner: string;
    registrationExpires: string;
    configurationPending: string;
    photoPending: string;
  };

  translation: {
    pendingTitle: string;
    pendingBody: string;
    viewEnglish: string;
  };
}

const en: Dictionary = {
  reviewStatus: 'approved',

  common: {
    skipToContent: 'Skip to main content',
    callCoordinator: 'Call a Flight Coordinator',
    call24_7: 'Flight coordinators, 24/7',
    secureChat: 'Start Secure Chat',
    secureChatUnavailable: 'Secure chat is not yet available. Call or request a callback.',
    requestCallback: 'Request a Callback',
    requestTransport: 'Request Transport',
    startReferral: 'Start a Referral',
    languageSwitch: 'Language',
    switchToEnglish: 'English',
    switchToSpanish: 'Español',
    menu: 'Menu',
    closeMenu: 'Close menu',
    home: 'Home',
    backToTop: 'Back to top',
    lastReviewed: 'Last reviewed',
    verify: 'Verify with the issuer',
    readMore: 'Read more',
    required: 'required',
    optional: 'optional',
  },

  emergency: {
    notice:
      'For an immediate local emergency, call your local emergency services first. ' +
      'AirEvac coordinates planned and urgent medical transport; we are not a local ' +
      'emergency response service.',
  },

  nav: {
    services: 'Services',
    partners: 'For Partners',
    patientsFamilies: 'Patients and Families',
    coverage: 'Coverage',
    fleetSafety: 'Fleet and Safety',
    about: 'About',
    legal: 'Legal and Privacy',
  },

  referralSelector: {
    heading: 'Who are you coordinating for?',
    description: 'Choose a path and we will show the steps, documents, and contacts that apply to you.',
    hospital: 'Hospital or Case Manager',
    hospitalDescription: 'Feasibility, records path, and receiving facility coordination.',
    cruise: 'Cruise or Maritime Team',
    cruiseDescription: 'Port-to-hospital planning and passenger transfer steps.',
    insurance: 'Insurer or Assistance Company',
    insuranceDescription: 'Authorization, documentation, billing, and case updates.',
    family: 'Patient or Family',
    familyDescription: 'What happens next, cost process, and patient rights.',
  },

  intake: {
    heading: 'Request a Callback',
    intro:
      'Share only the logistics below. A flight coordinator will call you, and any ' +
      'clinical or insurance details are collected afterwards through a protected channel.',
    phiWarningTitle: 'Do not enter protected information on this form',
    phiWarning:
      'Do not enter medical, insurance, identification, or payment information here. ' +
      'This form is not a secure clinical channel. A coordinator will open a protected ' +
      'channel for patient details, records, and insurance documents.',
    contactName: 'Your name',
    organization: 'Organization or facility',
    role: 'You are contacting us as',
    originCity: 'Origin city or facility',
    originHelp: 'City, hospital, ship, or port. No patient details.',
    destinationCity: 'Destination city or facility',
    destinationHelp: 'Where the patient needs to go. City or receiving facility.',
    timeframe: 'Needed timeframe',
    phone: 'Phone number for callback',
    email: 'Email address',
    preferredLanguage: 'Preferred language',
    note: 'Logistics note',
    noteHelp: 'Logistics only, for example airport access or ground transfer needs.',
    callbackConsent: 'A flight coordinator may call or text me at this number about this request.',
    callbackConsentHelp:
      'We use this number only to coordinate this transport request. Message and data ' +
      'rates may apply. Reply STOP to opt out of texts at any time.',
    submit: 'Request a Callback',
    submitting: 'Sending…',
    successTitle: 'Request received',
    successBody:
      'A flight coordinator will call you. If this is time-critical, call now rather than waiting.',
    inquiryIdLabel: 'Reference number',
    errorTitle: 'We could not send that request',
    errorBody: 'Please call a flight coordinator so nothing is delayed.',
    rateLimitedTitle: 'Too many requests from this connection',
    rateLimitedBody:
      'To keep the line clear for urgent cases we limit repeat submissions. Please call ' +
      'a flight coordinator directly.',
    charactersRemaining: 'characters remaining',
    errorSummaryTitle: 'Please correct the following before sending',
  },

  timeframes: {
    'within-24-hours': 'Within 24 hours',
    'within-2-3-days': 'Within 2 to 3 days',
    'within-1-week': 'Within a week',
    'planning-ahead': 'Planning ahead',
    unsure: 'Not sure yet',
  },

  credentials: {
    heading: 'Credentials and Licenses',
    scope: 'Scope',
    holder: 'Holder',
    issuer: 'Issuer',
    effective: 'Approved',
    expires: 'Valid through',
    lastReviewed: 'Last reviewed',
    verifyLink: 'Verify with the issuer',
    noneAvailable:
      'No credential is currently cleared for publication. Credentials appear here only ' +
      'when the certificate, scope, and expiry date have been verified.',
  },

  fleet: {
    tailNumber: 'Registration',
    model: 'Model',
    status: 'Status',
    registeredOwner: 'Registered owner',
    registrationExpires: 'Registration valid through',
    configurationPending: 'Medical configuration details are under clinical review.',
    photoPending: 'Photography pending permission clearance.',
  },

  translation: {
    pendingTitle: 'This page is not yet available in Spanish',
    pendingBody:
      'Medical, legal, insurance, and patient-rights content is published in Spanish only ' +
      'after human review. Call a flight coordinator for assistance in Spanish, or read the ' +
      'English version.',
    viewEnglish: 'Read the English version',
  },
};

/**
 * DRAFT — pending D11 sign-off. Chrome only; no medical, legal, insurance, or
 * emergency body copy is translated here.
 *
 * The emergency notice IS translated because withholding an emergency
 * instruction from a Spanish-speaking reader is more dangerous than publishing a
 * reviewed-but-not-yet-signed-off translation of a single sentence. It is
 * flagged for priority review in docs/open-decisions.md (D11).
 */
const es: Dictionary = {
  reviewStatus: 'draft',

  common: {
    skipToContent: 'Saltar al contenido principal',
    callCoordinator: 'Llame a un coordinador de vuelo',
    call24_7: 'Coordinadores de vuelo, 24/7',
    secureChat: 'Iniciar chat seguro',
    secureChatUnavailable:
      'El chat seguro aún no está disponible. Llame o solicite que lo contactemos.',
    requestCallback: 'Solicitar una llamada',
    requestTransport: 'Solicitar transporte',
    startReferral: 'Iniciar una remisión',
    languageSwitch: 'Idioma',
    switchToEnglish: 'English',
    switchToSpanish: 'Español',
    menu: 'Menú',
    closeMenu: 'Cerrar menú',
    home: 'Inicio',
    backToTop: 'Volver al inicio',
    lastReviewed: 'Última revisión',
    verify: 'Verificar con el emisor',
    readMore: 'Leer más',
    required: 'obligatorio',
    optional: 'opcional',
  },

  emergency: {
    notice:
      'Si se trata de una emergencia local inmediata, llame primero a los servicios de ' +
      'emergencia de su localidad. AirEvac coordina transporte médico programado y urgente; ' +
      'no somos un servicio local de respuesta a emergencias.',
  },

  nav: {
    services: 'Servicios',
    partners: 'Para socios',
    patientsFamilies: 'Pacientes y familias',
    coverage: 'Cobertura',
    fleetSafety: 'Flota y seguridad',
    about: 'Nosotros',
    legal: 'Aviso legal y privacidad',
  },

  referralSelector: {
    heading: '¿Para quién está coordinando?',
    description:
      'Elija una ruta y le mostraremos los pasos, documentos y contactos que le corresponden.',
    hospital: 'Hospital o gestor de casos',
    hospitalDescription: 'Viabilidad, ruta de expedientes y coordinación con el centro receptor.',
    cruise: 'Equipo de crucero o marítimo',
    cruiseDescription: 'Planificación de puerto a hospital y pasos de traslado del pasajero.',
    insurance: 'Aseguradora o compañía de asistencia',
    insuranceDescription: 'Autorización, documentación, facturación y actualizaciones del caso.',
    family: 'Paciente o familia',
    familyDescription: 'Qué sucede después, proceso de costos y derechos del paciente.',
  },

  intake: {
    heading: 'Solicitar una llamada',
    intro:
      'Comparta únicamente la información logística indicada. Un coordinador de vuelo lo ' +
      'llamará, y los datos clínicos o de seguro se recopilan después por un canal protegido.',
    phiWarningTitle: 'No ingrese información protegida en este formulario',
    phiWarning:
      'No ingrese información médica, de seguro, de identificación ni de pago aquí. Este ' +
      'formulario no es un canal clínico seguro. Un coordinador abrirá un canal protegido ' +
      'para los datos del paciente, los expedientes y los documentos del seguro.',
    contactName: 'Su nombre',
    organization: 'Organización o centro',
    role: 'Nos contacta como',
    originCity: 'Ciudad o centro de origen',
    originHelp: 'Ciudad, hospital, barco o puerto. Sin datos del paciente.',
    destinationCity: 'Ciudad o centro de destino',
    destinationHelp: 'A dónde necesita ir el paciente. Ciudad o centro receptor.',
    timeframe: 'Plazo necesario',
    phone: 'Número de teléfono para la llamada',
    email: 'Correo electrónico',
    preferredLanguage: 'Idioma preferido',
    note: 'Nota logística',
    noteHelp: 'Solo logística, por ejemplo acceso al aeropuerto o traslado terrestre.',
    callbackConsent:
      'Un coordinador de vuelo puede llamarme o enviarme mensajes de texto a este número ' +
      'sobre esta solicitud.',
    callbackConsentHelp:
      'Usamos este número únicamente para coordinar esta solicitud de transporte. Pueden ' +
      'aplicarse tarifas de mensajes y datos. Responda STOP para dejar de recibir mensajes.',
    submit: 'Solicitar una llamada',
    submitting: 'Enviando…',
    successTitle: 'Solicitud recibida',
    successBody:
      'Un coordinador de vuelo lo llamará. Si el caso es urgente, llame ahora en lugar de esperar.',
    inquiryIdLabel: 'Número de referencia',
    errorTitle: 'No pudimos enviar esa solicitud',
    errorBody: 'Por favor llame a un coordinador de vuelo para que nada se retrase.',
    rateLimitedTitle: 'Demasiadas solicitudes desde esta conexión',
    rateLimitedBody:
      'Para mantener la línea disponible para casos urgentes limitamos los envíos repetidos. ' +
      'Por favor llame directamente a un coordinador de vuelo.',
    charactersRemaining: 'caracteres restantes',
    errorSummaryTitle: 'Corrija lo siguiente antes de enviar',
  },

  timeframes: {
    'within-24-hours': 'Dentro de 24 horas',
    'within-2-3-days': 'Dentro de 2 a 3 días',
    'within-1-week': 'Dentro de una semana',
    'planning-ahead': 'Planificando con anticipación',
    unsure: 'Aún no estoy seguro',
  },

  credentials: {
    heading: 'Credenciales y licencias',
    scope: 'Alcance',
    holder: 'Titular',
    issuer: 'Emisor',
    effective: 'Aprobado',
    expires: 'Vigente hasta',
    lastReviewed: 'Última revisión',
    verifyLink: 'Verificar con el emisor',
    noneAvailable:
      'Actualmente no hay ninguna credencial autorizada para publicación. Las credenciales ' +
      'aparecen aquí solo cuando se han verificado el certificado, el alcance y la fecha de ' +
      'vencimiento.',
  },

  fleet: {
    tailNumber: 'Matrícula',
    model: 'Modelo',
    status: 'Estado',
    registeredOwner: 'Propietario registrado',
    registrationExpires: 'Matrícula vigente hasta',
    configurationPending: 'Los detalles de configuración médica están en revisión clínica.',
    photoPending: 'Fotografía pendiente de autorización.',
  },

  translation: {
    pendingTitle: 'Esta página aún no está disponible en español',
    pendingBody:
      'El contenido médico, legal, de seguros y de derechos del paciente se publica en ' +
      'español solo después de una revisión humana. Llame a un coordinador de vuelo para ' +
      'recibir asistencia en español, o lea la versión en inglés.',
    viewEnglish: 'Leer la versión en inglés',
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
