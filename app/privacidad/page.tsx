import Link from 'next/link';
import Button from '@/components/ui/Button';
import Footer from '@/components/Footer';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl p-6 pb-24">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Aviso de Privacidad</h1>
          <p className="text-sm text-slate-600">
            Herramienta de Mentoría Estudiantil - Campus Monterrey
          </p>
        </header>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              1. Responsable del tratamiento de datos
            </h2>
            <p>
              Esta herramienta ha sido desarrollada por <strong>ME (Mentora Estudiantil) Karen Ariadna Guzmán Vega</strong> 
              para uso interno en el área de Mentoría Estudiantil del Tecnológico de Monterrey, Campus Monterrey. 
              Los datos personales recabados se gestionan bajo la responsabilidad del área de Mentoría Estudiantil 
              del Campus Monterrey.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              2. Datos personales que se recaban
            </h2>
            <p>Los datos personales que se recaban incluyen:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Matrícula estudiantil</li>
              <li>Correo electrónico institucional</li>
              <li>Información de registro de sesiones de mentoría</li>
              <li>Información sobre el estado emocional y bienestar (registrado de forma anónima)</li>
              <li>Datos de contacto de mentores (correo, WhatsApp, Instagram)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              3. Finalidad del tratamiento
            </h2>
            <p>Los datos personales se utilizan para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Registrar y gestionar las sesiones de mentoría estudiantil</li>
              <li>Realizar seguimiento y acompañamiento personalizado</li>
              <li>Mejorar los servicios de mentoría y bienestar estudiantil</li>
              <li>Generar estadísticas y reportes institucionales (de forma anónima)</li>
              <li>Establecer comunicación entre estudiantes y mentores</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              4. Tratamiento de datos anónimos
            </h2>
            <p>
              La información sobre estados emocionales y reflexiones se maneja de forma anónima y agregada. 
              No se relaciona directamente con tu identidad para fines de análisis estadístico, 
              respetando siempre tu privacidad y confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              5. Consentimiento
            </h2>
            <p>
              Al utilizar este sistema, otorgas tu consentimiento para el tratamiento de tus datos personales 
              conforme a lo establecido en este aviso. El consentimiento para seguimiento vía correo electrónico 
              se otorga de forma automática para facilitar el acompañamiento posterior a las sesiones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              6. Derechos ARCO
            </h2>
            <p>
              Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales 
              (derechos ARCO), así como a revocar el consentimiento. Para ejercer estos derechos, puedes 
              contactar al área de Mentoría Estudiantil del Campus Monterrey.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              7. Seguridad de los datos
            </h2>
            <p>
              Implementamos medidas de seguridad técnicas y administrativas para proteger tus datos personales 
              contra pérdida, alteración, destrucción o uso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              8. Modificaciones al aviso de privacidad
            </h2>
            <p>
              Nos reservamos el derecho de modificar este aviso de privacidad. Las modificaciones se publicarán 
              en esta página y entrarán en vigor el día de su publicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
              9. Contacto
            </h2>
            <p>
              Para cualquier duda, comentario o ejercicio de derechos, puedes contactar a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>ME (Mentora Estudiantil) Karen Ariadna Guzmán Vega</strong> - kareng@tec.mx</li>
              <li>Área de Mentoría Estudiantil, Campus Monterrey</li>
            </ul>
          </section>

          <section className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/">
            <Button variant="secondary">
              ← Volver al inicio
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
