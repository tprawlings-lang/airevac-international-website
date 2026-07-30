import type { Locale } from '@/lib/i18n';

/**
 * UI chrome strings.
 *
 * SCOPE LIMIT - blueprint page 24, "Do not build":
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
    requestCallback: string;
    emailCoordinator: string;
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

  /**
   * Live chat. Copy rules that apply to every string here:
   *  - Never state or imply a response time. None is published anywhere.
   *  - Never present chat as the fastest route. The phone is, and it is
   *    answered 24 hours a day; chat is only answered while a coordinator is
   *    signed in.
   *  - Say plainly when nobody is available. A visitor who waits on an
   *    unattended chat instead of calling is the failure this feature must
   *    not have.
   */
  chat: {
    launch: string;
    close: string;
    heading: string;
    unavailableHeading: string;
    unavailableBody: string;
    intakeIntro: string;
    roleLabel: string;
    roleFamily: string;
    roleHospital: string;
    roleCruise: string;
    roleInsurer: string;
    nameLabel: string;
    phoneLabel: string;
    phoneHelp: string;
    organizationLabel: string;
    originLabel: string;
    destinationLabel: string;
    timeframeLabel: string;
    timeframeImmediate: string;
    timeframe24: string;
    timeframe72: string;
    timeframePlanning: string;
    languageLabel: string;
    start: string;
    starting: string;
    waitingHeading: string;
    waitingBody: string;
    connectedHeading: string;
    composerLabel: string;
    composerPlaceholder: string;
    send: string;
    endedHeading: string;
    endedBody: string;
    endChat: string;
    reference: string;
    youLabel: string;
    coordinatorLabel: string;
    machineTranslated: string;
    translationUnavailable: string;
    originalLabel: string;
    noRecordsNotice: string;
    errorGeneric: string;
    errorNobodyAvailable: string;
    errorRateLimited: string;
    reconnecting: string;
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
    /** The approved public fleet statement: model and quantity only (G-04). */
    statement: string;
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
    call24_7: '24/7 Flight Coordination by Phone and Email',
    requestCallback: 'Request a Callback',
    emailCoordinator: 'Email a Flight Coordinator',
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

  chat: {
    launch: 'Chat with a coordinator',
    close: 'Close chat',
    heading: 'Chat with a flight coordinator',
    unavailableHeading: 'No coordinator is signed in to chat',
    unavailableBody:
      'Chat is answered only while a coordinator is signed in, and nobody is right now. ' +
      'The phone line is answered 24 hours a day, every day. Please call.',
    intakeIntro:
      'A few details before you are connected, so the coordinator does not have to ask. ' +
      'Please do not include medical details here; you can describe the situation in the ' +
      'conversation.',
    roleLabel: 'You are contacting us as',
    roleFamily: 'A patient, family member, or friend',
    roleHospital: 'A hospital or case manager',
    roleCruise: 'A cruise or maritime team',
    roleInsurer: 'An insurer or assistance company',
    nameLabel: 'Your name',
    phoneLabel: 'Phone number',
    phoneHelp: 'So a coordinator can call you back if the chat disconnects.',
    organizationLabel: 'Organization',
    originLabel: 'Where is the patient now? (city or facility)',
    destinationLabel: 'Where do they need to go?',
    timeframeLabel: 'How soon',
    timeframeImmediate: 'As soon as possible',
    timeframe24: 'Within 24 hours',
    timeframe72: 'Within 3 days',
    timeframePlanning: 'Still planning',
    languageLabel: 'Preferred language',
    start: 'Start chat',
    starting: 'Starting...',
    waitingHeading: 'Waiting for a coordinator',
    waitingBody:
      'You are in the queue. If this is urgent, call rather than wait: the phone is ' +
      'answered 24 hours a day.',
    connectedHeading: 'A coordinator has joined',
    composerLabel: 'Your message',
    composerPlaceholder: 'Type your message',
    send: 'Send',
    endedHeading: 'This chat has ended',
    endedBody:
      'Call the number below if you need anything else. A record of this conversation is ' +
      'kept for our coordinators.',
    endChat: 'End chat',
    reference: 'Reference',
    youLabel: 'You',
    coordinatorLabel: 'Coordinator',
    machineTranslated: 'Machine translated. The original is shown below it.',
    translationUnavailable:
      'This message could not be translated automatically. It is shown as written.',
    originalLabel: 'Original',
    noRecordsNotice:
      'Do not send records or documents here. Email them to ops@aeiamericas.com or fax ' +
      '(619) 330-4551.',
    errorGeneric: 'Something went wrong. Please call instead.',
    errorNobodyAvailable:
      'A coordinator signed off while you were filling this in. Please call.',
    errorRateLimited: 'Too many attempts from this connection. Please call instead.',
    reconnecting: 'Reconnecting...',
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
      'Share only the logistics below. A flight coordinator will call you. Our ' +
      'coordinators will identify any records needed and you can send them by email ' +
      'or fax.',
    phiWarningTitle: 'Do not enter protected information on this form',
    phiWarning:
      'Do not enter medical, insurance, identification, or payment information here. ' +
      'Our coordinators will identify the records needed for review. Email them to ' +
      'ops@aeiamericas.com or fax them to (619) 330-4551.',
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
    statement: 'The current working fleet is two Learjet 31A aircraft.',
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
 * DRAFT - pending D11 sign-off. Chrome only; no medical, legal, insurance, or
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
    call24_7: 'Coordinación de vuelos 24/7 por teléfono y correo electrónico',
    requestCallback: 'Solicitar una llamada',
    emailCoordinator: 'Escribir a un coordinador de vuelo',
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

  chat: {
    launch: 'Chatear con un coordinador',
    close: 'Cerrar el chat',
    heading: 'Chatee con un coordinador de vuelo',
    unavailableHeading: 'No hay ningún coordinador conectado al chat',
    unavailableBody:
      'El chat se atiende solo mientras hay un coordinador conectado, y en este momento no ' +
      'hay ninguno. La línea telefónica se atiende las 24 horas, todos los días. Por favor ' +
      'llame.',
    intakeIntro:
      'Algunos datos antes de conectarle, para que el coordinador no tenga que preguntarlos. ' +
      'Por favor no incluya datos médicos aquí; podrá describir la situación en la ' +
      'conversación.',
    roleLabel: 'Usted nos contacta como',
    roleFamily: 'Paciente, familiar o amistad',
    roleHospital: 'Hospital o gestor de casos',
    roleCruise: 'Equipo de crucero o marítimo',
    roleInsurer: 'Aseguradora o compañía de asistencia',
    nameLabel: 'Su nombre',
    phoneLabel: 'Número de teléfono',
    phoneHelp: 'Para que un coordinador pueda llamarle si el chat se desconecta.',
    organizationLabel: 'Organización',
    originLabel: '¿Dónde está el paciente ahora? (ciudad o centro)',
    destinationLabel: '¿A dónde necesita ir?',
    timeframeLabel: 'Con qué urgencia',
    timeframeImmediate: 'Lo antes posible',
    timeframe24: 'Dentro de 24 horas',
    timeframe72: 'Dentro de 3 días',
    timeframePlanning: 'Aún en planificación',
    languageLabel: 'Idioma preferido',
    start: 'Iniciar el chat',
    starting: 'Iniciando...',
    waitingHeading: 'Esperando a un coordinador',
    waitingBody:
      'Está en la fila. Si es urgente, llame en lugar de esperar: el teléfono se atiende las ' +
      '24 horas.',
    connectedHeading: 'Un coordinador se ha unido',
    composerLabel: 'Su mensaje',
    composerPlaceholder: 'Escriba su mensaje',
    send: 'Enviar',
    endedHeading: 'Este chat ha finalizado',
    endedBody:
      'Llame al número de abajo si necesita algo más. Nuestros coordinadores conservan un ' +
      'registro de esta conversación.',
    endChat: 'Finalizar el chat',
    reference: 'Referencia',
    youLabel: 'Usted',
    coordinatorLabel: 'Coordinador',
    machineTranslated: 'Traducido automáticamente. El texto original aparece debajo.',
    translationUnavailable:
      'Este mensaje no se pudo traducir automáticamente. Se muestra tal como se escribió.',
    originalLabel: 'Original',
    noRecordsNotice:
      'No envíe expedientes ni documentos por aquí. Envíelos por correo a ops@aeiamericas.com ' +
      'o por fax al (619) 330-4551.',
    errorGeneric: 'Algo salió mal. Por favor llame.',
    errorNobodyAvailable:
      'Un coordinador se desconectó mientras usted completaba el formulario. Por favor llame.',
    errorRateLimited: 'Demasiados intentos desde esta conexión. Por favor llame.',
    reconnecting: 'Reconectando...',
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
      'llamará. Nuestros coordinadores le indicarán qué expedientes se necesitan y usted ' +
      'puede enviarlos por correo electrónico o fax.',
    phiWarningTitle: 'No ingrese información protegida en este formulario',
    phiWarning:
      'No ingrese información médica, de seguro, de identificación ni de pago aquí. ' +
      'Nuestros coordinadores le indicarán qué expedientes se necesitan. Envíelos por ' +
      'correo a ops@aeiamericas.com o por fax al (619) 330-4551.',
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
    statement: 'La flota de trabajo actual consta de dos aeronaves Learjet 31A.',
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
