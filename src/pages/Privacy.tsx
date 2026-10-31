import type { ReactNode } from 'react'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-3xl font-bold uppercase">{title}</h2>
      <div className="space-y-3 text-ash">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl space-y-10 px-5 py-14">
      <header className="space-y-3">
        <p className="label">Última actualización: 31 de octubre de 2026</p>
        <h1 className="font-display text-6xl leading-[0.9] font-black uppercase">
          Política de <em className="font-serif font-normal text-brass normal-case italic">privacidad</em>
        </h1>
        <p className="text-ash">
          En Edgar Barber solo pedimos los datos imprescindibles para gestionar tus citas. Aquí te contamos cuáles, para qué y qué puedes hacer con ellos.
        </p>
      </header>

      <Section title="Quién es el responsable">
        <p>
          El responsable del tratamiento es la barbería Edgar Barber, titular de la web <b className="text-bone">edgarbarber.jcrlabs.net</b> y de su app.
        </p>
      </Section>

      <Section title="Qué datos recogemos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b className="text-bone">Datos de tu cuenta:</b> nombre, email, teléfono móvil y contraseña (guardada cifrada, nunca en texto plano).
          </li>
          <li>
            <b className="text-bone">Si entras con Google:</b> tu nombre, tu email y tu foto de perfil. No accedemos a tus contactos, correos ni a ningún otro
            dato de tu cuenta de Google.
          </li>
          <li>
            <b className="text-bone">Tus citas:</b> día, hora, servicio, estado y las notas que añadas al reservar.
          </li>
          <li>
            <b className="text-bone">Datos técnicos:</b> registros del servidor (dirección IP, fecha y página visitada) para seguridad y para evitar abusos.
          </li>
        </ul>
      </Section>

      <Section title="Para qué los usamos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Gestionar tus reservas y mostrarte tu historial de citas.</li>
          <li>Avisar al barbero de tu cita y poder llamarte o escribirte si hay algún cambio.</li>
          <li>Mantener tu sesión iniciada y proteger la web frente a usos indebidos.</li>
        </ul>
        <p>No enviamos publicidad, no vendemos tus datos y no los usamos para elaborar perfiles.</p>
      </Section>

      <Section title="Base legal">
        <p>
          Tratamos tus datos porque son necesarios para darte el servicio que pides al reservar (ejecución de un contrato) y, en el caso de los registros
          técnicos, por nuestro interés legítimo en mantener la web segura.
        </p>
      </Section>

      <Section title="Con quién se comparten">
        <p>
          Con nadie, salvo los proveedores técnicos necesarios para que la web funcione: el servidor donde se aloja y, si el barbero los activa, los servicios
          que le hacen llegar el aviso de tu cita (notificaciones push, email o WhatsApp). Solo reciben los datos de la cita.
        </p>
      </Section>

      <Section title="Cuánto tiempo los guardamos">
        <p>
          Mientras tengas cuenta. Si nos pides eliminarla, borramos tus datos personales, salvo lo que la ley nos obligue a conservar. Los registros técnicos se
          eliminan automáticamente en pocas semanas.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes pedir acceso a tus datos, corregirlos, borrarlos, limitar su uso, oponerte a su tratamiento o llevártelos (portabilidad). Tu nombre y teléfono
          los cambias tú mismo desde tu perfil; para todo lo demás, pídeselo directamente en la barbería.
        </p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (
          <a className="text-brass underline" href="https://www.aepd.es" target="_blank" rel="noreferrer">
            aepd.es
          </a>
          ).
        </p>
      </Section>

      <Section title="Cookies">
        <p>Solo usamos una cookie técnica imprescindible para mantener tu sesión iniciada. No usamos cookies de analítica ni de publicidad.</p>
      </Section>
    </article>
  )
}
