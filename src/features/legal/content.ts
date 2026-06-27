/**
 * Legal documents shown to candidates (Terms of Service & Privacy Policy).
 *
 * Drafted as a BASE TEMPLATE aligned with Ecuadorian law — notably the Ley
 * Orgánica de Protección de Datos Personales (LOPDP, R.O. Suplemento 459 of
 * 2021-05-26) and the ARCO+ data-subject rights. THIS IS NOT LEGAL ADVICE and
 * must be reviewed by the company's legal counsel before production use.
 *
 * Placeholders wrapped in brackets — e.g. [RUC], [dirección] — MUST be completed
 * with the company's real registration data and contact channels.
 */

export type LegalDocId = 'terms' | 'privacy';

export interface LegalSection {
  heading: string;
  /** One entry per paragraph. */
  body: string[];
}

export interface LegalDocument {
  title: string;
  /** Human-readable last-revision date, e.g. "Junio 2026". */
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
}

const COMPANY = 'Integrity Solutions';
const LAST_UPDATED = 'Junio 2026';

export const TERMS: LegalDocument = {
  title: 'Términos y Condiciones',
  lastUpdated: LAST_UPDATED,
  intro: [
    `Estos Términos y Condiciones regulan el acceso y uso del portal de empleo de ${COMPANY} (en adelante, "el Portal") por parte de las personas que se registran como candidatos. Al crear una cuenta y utilizar el Portal, usted declara haber leído, entendido y aceptado estos términos.`,
  ],
  sections: [
    {
      heading: '1. Objeto del servicio',
      body: [
        `El Portal permite a los candidatos registrarse, completar su perfil profesional, cargar su hoja de vida y postularse a las vacantes que ${COMPANY} gestiona para sus empresas clientes.`,
        `${COMPANY} actúa como intermediario de selección de personal. El registro y la postulación a una vacante no garantizan, en ningún caso, la contratación del candidato.`,
      ],
    },
    {
      heading: '2. Registro y cuenta',
      body: [
        'Para usar el Portal usted debe ser mayor de edad y proporcionar información veraz, exacta y actualizada. Es responsable de mantener la confidencialidad de sus credenciales de acceso y de toda actividad realizada desde su cuenta.',
        'Debe notificar de inmediato cualquier uso no autorizado de su cuenta. El Portal no será responsable por pérdidas derivadas del incumplimiento de esta obligación.',
      ],
    },
    {
      heading: '3. Veracidad de la información',
      body: [
        'Usted es el único responsable de la veracidad de los datos, documentos y declaraciones que proporcione, incluyendo su hoja de vida, formación académica y experiencia laboral.',
        `La entrega de información falsa o engañosa podrá ser causa de descarte de su postulación y de la baja de su cuenta, sin perjuicio de las responsabilidades legales que correspondan.`,
      ],
    },
    {
      heading: '4. Uso permitido',
      body: [
        'Usted se compromete a utilizar el Portal de forma lícita y a no realizar acciones que afecten su funcionamiento, seguridad o disponibilidad, ni a intentar acceder a áreas o datos para los que no esté autorizado.',
      ],
    },
    {
      heading: '5. Tratamiento de datos personales',
      body: [
        'El tratamiento de sus datos personales se rige por la Política de Privacidad, que forma parte integrante de estos Términos. Al aceptar estos Términos usted reconoce haber sido informado sobre dicho tratamiento conforme a la normativa ecuatoriana vigente.',
      ],
    },
    {
      heading: '6. Propiedad intelectual',
      body: [
        `Los contenidos, marcas, logotipos y el software del Portal son propiedad de ${COMPANY} o de sus licenciantes y están protegidos por la legislación aplicable. No se concede ningún derecho sobre ellos más allá del uso necesario para operar como candidato.`,
      ],
    },
    {
      heading: '7. Limitación de responsabilidad',
      body: [
        `${COMPANY} procura que el Portal esté disponible y funcione correctamente, pero no garantiza la ausencia de interrupciones o errores. En la medida permitida por la ley, ${COMPANY} no será responsable por daños indirectos derivados del uso o la imposibilidad de uso del Portal.`,
      ],
    },
    {
      heading: '8. Modificaciones',
      body: [
        `${COMPANY} podrá actualizar estos Términos en cualquier momento. Los cambios entrarán en vigencia desde su publicación en el Portal. El uso continuado del Portal tras una modificación implica la aceptación de los nuevos términos.`,
      ],
    },
    {
      heading: '9. Legislación aplicable y jurisdicción',
      body: [
        'Estos Términos se rigen por las leyes de la República del Ecuador. Cualquier controversia se someterá a los jueces y tribunales competentes del Ecuador.',
      ],
    },
    {
      heading: '10. Contacto',
      body: [
        `Para consultas sobre estos Términos puede escribir a info@integritysolutions.com.ec o a talentohumano@integritysolutions.com.ec.`,
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Política de Privacidad',
  lastUpdated: LAST_UPDATED,
  intro: [
    `En ${COMPANY} protegemos sus datos personales conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador. Esta Política explica qué datos recopilamos, con qué finalidad, con quién los compartimos y cómo puede ejercer sus derechos.`,
  ],
  sections: [
    {
      heading: '1. Responsable del tratamiento',
      body: [
        `Responsable: ${COMPANY}, con RUC [RUC: completar] y domicilio en [dirección: completar], Ecuador.`,
        'Canal de contacto en materia de protección de datos / Delegado de Protección de Datos (DPO): [correo de protección de datos: completar].',
      ],
    },
    {
      heading: '2. Datos que recopilamos',
      body: [
        'Datos de identificación y contacto: nombres, apellidos, cédula o identificación, fecha de nacimiento, correo electrónico, teléfono, ciudad y dirección de residencia.',
        'Datos profesionales: formación académica, carrera, título, universidad, experiencia laboral, situación laboral actual, hoja de vida (CV) y aspiración salarial.',
        'Datos de uso de la cuenta: credenciales de acceso (almacenadas de forma cifrada) y registros técnicos necesarios para la seguridad del servicio.',
      ],
    },
    {
      heading: '3. Finalidad del tratamiento',
      body: [
        'Gestionar su registro y cuenta en el Portal.',
        'Evaluar su perfil y gestionar sus postulaciones a las vacantes disponibles.',
        'Presentar su candidatura a las empresas clientes para las que realizamos procesos de selección.',
        'Comunicarnos con usted respecto del estado de sus postulaciones y procesos.',
      ],
    },
    {
      heading: '4. Base legal',
      body: [
        'El tratamiento se basa principalmente en su consentimiento, otorgado al aceptar esta Política durante el registro, así como en la ejecución de las medidas precontractuales que usted solicita al postularse. Usted puede retirar su consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento previo.',
      ],
    },
    {
      heading: '5. Con quién compartimos sus datos',
      body: [
        'Empresas clientes: compartimos su perfil y hoja de vida con las empresas para las que gestionamos la vacante a la que usted se postula, con el fin de evaluar su candidatura.',
        'Proveedores tecnológicos (encargados del tratamiento): utilizamos servicios de almacenamiento de archivos, envío de correos y procesamiento que actúan bajo nuestras instrucciones y con las debidas garantías de confidencialidad y seguridad.',
        'Autoridades: cuando exista una obligación legal de hacerlo.',
      ],
    },
    {
      heading: '6. Conservación de los datos',
      body: [
        'Conservamos sus datos mientras su cuenta permanezca activa y durante el tiempo necesario para los procesos de selección y para cumplir obligaciones legales. Cuando ya no sean necesarios, serán eliminados o anonimizados de forma segura.',
      ],
    },
    {
      heading: '7. Sus derechos (ARCO+)',
      body: [
        'Conforme a la LOPDP, usted tiene derecho a: acceder a sus datos, rectificarlos, eliminarlos, oponerse a su tratamiento, solicitar la portabilidad y la limitación del tratamiento, así como a no ser objeto de decisiones automatizadas con efectos jurídicos.',
        'Para ejercer estos derechos puede escribir a [correo de protección de datos: completar]. Atenderemos su solicitud en los plazos previstos por la ley.',
      ],
    },
    {
      heading: '8. Seguridad de la información',
      body: [
        'Aplicamos medidas técnicas y organizativas razonables para proteger sus datos frente a accesos no autorizados, pérdida o alteración, incluyendo el cifrado de credenciales y el control de accesos.',
      ],
    },
    {
      heading: '9. Cookies',
      body: [
        'Utilizamos únicamente cookies estrictamente necesarias para el funcionamiento del Portal y para mantener tu sesión iniciada (autenticación). No utilizamos cookies de analítica, publicidad ni seguimiento de terceros.',
        'Por ser indispensables para prestar el servicio que solicitas, estas cookies no requieren consentimiento previo. Si en el futuro incorporamos cookies opcionales, te solicitaremos tu consentimiento antes de activarlas.',
      ],
    },
    {
      heading: '10. Cambios a esta Política',
      body: [
        `Podemos actualizar esta Política para reflejar cambios legales u operativos. Publicaremos la versión vigente en el Portal indicando su fecha de actualización.`,
      ],
    },
    {
      heading: '11. Autoridad de control',
      body: [
        'Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar un reclamo ante la Superintendencia de Protección de Datos Personales del Ecuador.',
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDocument> = {
  terms: TERMS,
  privacy: PRIVACY,
};
