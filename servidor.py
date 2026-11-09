import os
import re
import secrets
import sqlite3
import hashlib
import smtplib
import threading
import time
import logging
import json
import urllib.error
import urllib.request
from urllib.parse import quote

from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# En Render hay un proxy delante: sin esto todos los visitantes parecen la misma persona
# y el límite de 10 registros por hora se compartiría entre todos.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.logger.setLevel(logging.INFO)  # para que los INFO (CHAT OK ...) salgan en los logs de Render
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024

# Webs que pueden llamar al servidor. Se pueden cambiar en Render con la variable CORS_ORIGINS
# (direcciones separadas por comas, sin barra final).
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5500,http://127.0.0.1:5500,"
    "https://shouyi77.github.io"
).split(",") if origin.strip()]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS},
                     r"/chat": {"origins": ALLOWED_ORIGINS},
                     r"/enviar-email-promocional": {"origins": ALLOWED_ORIGINS}},
     allow_headers=["Content-Type", "Authorization"])

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if genai and api_key else None
HOTEL_NAME = "La Palma Princess"
HOTEL_EMAIL = os.getenv("HOTEL_EMAIL", "hotelPrincessLaPalma@gmail.com")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
BREVO_API_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")
MAIL_FROM = os.getenv("MAIL_FROM") or os.getenv("SMTP_FROM") or HOTEL_EMAIL
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "reservas.sqlite3"))
HOTEL_TIMEZONE = ZoneInfo("Atlantic/Canary")

ROOMS = {
    "Estándar": {"price": 150, "inventory": 20, "adults": 3, "children": 2, "guests": 4},
    "Familiar Superior": {"price": 185, "inventory": 12, "adults": 4, "children": 2, "guests": 6},
    "Ocean Suite": {"price": 250, "inventory": 8, "adults": 3, "children": 2, "guests": 5},
}
def _horas(inicio, fin):
    return tuple(f"{h:02d}:00" for h in range(inicio, fin + 1))

# id (máx. 20 caracteres): (aforo por franja, horas disponibles)
_SERVICIOS = {
    "spa":      (8,  ("09:00", "11:00", "13:00", "15:00", "17:00")),
    "gym":      (4,  _horas(8, 20)),
    "pilates":  (12, ("09:30", "18:00")),          # mañana y tarde
    "solarium": (12, ("10:00", "12:00", "14:00", "16:00")),
    "padel1":   (4,  _horas(9, 20)),               # 4 jugadores por pista
    "padel2":   (4,  _horas(9, 20)),
    "volley":   (12, _horas(10, 19)),
    "cancha":   (10, _horas(9, 20)),               # baloncesto y fútbol comparten espacio
}
SERVICES = set(_SERVICIOS)
SERVICE_CAPACITY = {k: v[0] for k, v in _SERVICIOS.items()}
SERVICE_TIMES = {k: v[1] for k, v in _SERVICIOS.items()}

# Modelos de la IA del chatbot. Se pueden cambiar SIN tocar el codigo: en Render -> Environment
# -> MODELOS_IA (nombres separados por comas, el primero es el preferido).
MODELOS_IA = [
    m.strip() for m in os.getenv(
        "MODELOS_IA",
        "gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-flash-lite"
    ).split(",") if m.strip()
]


@contextmanager
def connect_db():
    if str(DATABASE_PATH.parent) not in ("", "."):
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db():
    with connect_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY,
                reference TEXT NOT NULL UNIQUE,
                token_hash TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                checkin TEXT NOT NULL,
                checkout TEXT NOT NULL,
                room TEXT NOT NULL,
                rooms INTEGER NOT NULL,
                adults INTEGER NOT NULL,
                children INTEGER NOT NULL,
                promo TEXT NOT NULL DEFAULT '',
                resident INTEGER NOT NULL DEFAULT 0,
                message TEXT NOT NULL DEFAULT '',
                total REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'confirmed',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS bookings_dates ON bookings(room, status, checkin, checkout);
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                consent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS service_bookings (
                id INTEGER PRIMARY KEY,
                reference TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                service TEXT NOT NULL,
                service_date TEXT NOT NULL,
                service_time TEXT NOT NULL,
                guests INTEGER NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(service, service_date, service_time, email)
            );
            CREATE INDEX IF NOT EXISTS service_slots ON service_bookings(service, service_date, service_time);
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
        """)
        # Bases de datos creadas antes de las cuentas: añade la columna user_id si falta.
        for table in ("bookings", "service_bookings"):
            columns = [row["name"] for row in db.execute(f"PRAGMA table_info({table})")]
            if "user_id" not in columns:
                db.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER")
            db.execute(f"CREATE INDEX IF NOT EXISTS {table}_user ON {table}(user_id)")


init_db()


def api_error(message, status):
    return jsonify({"error": message}), status


def json_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else None


def valid_date(value):
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d").date()
        return parsed if parsed.isoformat() == value else None
    except (TypeError, ValueError):
        return None


def hotel_today():
    return datetime.now(HOTEL_TIMEZONE).date()


def clean_text(value, maximum):
    return str(value or "").strip()[:maximum]


def parse_integer(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and re.fullmatch(r"-?\d+", value.strip()):
        return int(value)
    return None


def email_valid(value):
    return len(value) <= 254 and re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value) is not None


def _enviar_brevo(recipient, subject, body, reply_to=None):
    """Envía con la API de Brevo (HTTPS, puerto 443). Funciona en Render gratis."""
    es_html = body.lstrip().startswith("<")
    payload = {
        "sender": {"name": HOTEL_NAME, "email": MAIL_FROM},
        "to": [{"email": recipient}],
        "subject": subject,
    }
    payload["htmlContent" if es_html else "textContent"] = body
    if reply_to:
        payload["replyTo"] = {"email": reply_to}
    peticion = urllib.request.Request(
        BREVO_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=15) as respuesta:
            return 200 <= respuesta.status < 300
    except urllib.error.HTTPError as error:
        # Aquí sale el motivo real: 401 = clave mala, 400 = remitente sin verificar
        app.logger.error("Brevo rechazó el correo a %s: HTTP %s %s", recipient, error.code,
                         error.read().decode("utf-8", "replace")[:300])
    except (urllib.error.URLError, OSError, ValueError):
        app.logger.exception("No se pudo conectar con Brevo para enviar el correo a %s", recipient)
    return False
 
 
def _enviar_smtp(recipient, subject, body, reply_to=None):
    """SMTP clásico. En Render gratis los puertos 25/465/587 están bloqueados: allí usa Brevo."""
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "465"))
    username = os.getenv("SMTP_USERNAME", "hotelprincesslapalmatrabajo@gmail.com")
    password = os.getenv("SMTP_PASSWORD")
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.getenv("SMTP_FROM") or username
    message["To"] = recipient
    if reply_to:
        message["Reply-To"] = reply_to
    if body.lstrip().startswith("<"):
        message.set_content("Este mensaje está en formato HTML.")
        message.add_alternative(body, subtype="html")
    else:
        message.set_content(body)
    try:
        usar_ssl = port == 465 or os.getenv("SMTP_SSL") == "1"
        conexion = smtplib.SMTP_SSL(host, port, timeout=15) if usar_ssl else smtplib.SMTP(host, port, timeout=15)
        with conexion as smtp:
            if not usar_ssl and os.getenv("SMTP_STARTTLS", "1") == "1":
                smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError):
        app.logger.exception("No se pudo enviar el correo a %s por SMTP", recipient)
        return False
 
 
def send_email(recipient, subject, body, reply_to=None):
    """Envía un correo (HTML si el cuerpo empieza por '<'). Usa Brevo si hay BREVO_API_KEY."""
    if BREVO_API_KEY:
        return _enviar_brevo(recipient, subject, body, reply_to)
    if os.getenv("SMTP_PASSWORD"):
        return _enviar_smtp(recipient, subject, body, reply_to)
    app.logger.warning("Correo NO enviado a %s: falta BREVO_API_KEY (o SMTP_PASSWORD).", recipient)
    return False
 
 
def send_async(recipient, subject, body, reply_to=None):
    """Envía en segundo plano para no hacer esperar al visitante."""
    threading.Thread(target=send_email, args=(recipient, subject, body, reply_to), daemon=True).start()
 
 
def notify_hotel(subject, body, reply_to=None):
    """Aviso al buzón del propietario (HOTEL_EMAIL). 'Responder' contesta al cliente."""
    if HOTEL_EMAIL:
        try:
            body = email_aviso_hotel_html(subject, body)
        except Exception:
            app.logger.exception("No se pudo dar formato al aviso del hotel; se envía en texto simple")
        send_async(HOTEL_EMAIL, "[Web] " + subject, body, reply_to)


# ───────────────────────── Diseño de los correos ─────────────────────────
# Todos los correos usan la misma plantilla (email_layout) con los colores de la web.
# Está hecha con tablas y estilos "en línea" porque es lo único que se ve bien en Gmail, Outlook y móviles.
EMAIL_INK, EMAIL_SEA, EMAIL_SUN = "#12303a", "#2f7f86", "#f2b84b"
EMAIL_SAND, EMAIL_FOAM, EMAIL_TEXT = "#efe6d6", "#dcebe6", "#2b3f46"
_FUENTE_TEXTO = "Arial,Helvetica,sans-serif"
_FUENTE_TITULO = "Georgia,'Times New Roman',serif"

SERVICIOS_NOMBRES = {
    "spa": "Aqua Princess Spa", "gym": "Gimnasio (máquinas)", "pilates": "Pilates",
    "solarium": "Solarium", "padel1": "Pádel · Pista 1", "padel2": "Pádel · Pista 2",
    "volley": "Arenero de vóley", "cancha": "Cancha de baloncesto y fútbol",
    "restaurant": "Restaurante", "activity": "Actividad",
}
_DIAS = ("lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo")
_MESES = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
          "agosto", "septiembre", "octubre", "noviembre", "diciembre")


def email_fecha(valor):
    """'2026-12-20' -> 'domingo 20 de diciembre de 2026' (si no se entiende, la deja como está)."""
    try:
        d = date.fromisoformat(str(valor))
        return f"{_DIAS[d.weekday()]} {d.day} de {_MESES[d.month - 1]} de {d.year}"
    except ValueError:
        return str(valor)


def email_euros(valor):
    """1295.5 -> '1.295,50 €'"""
    try:
        texto = f"{float(valor):,.2f}"
    except (TypeError, ValueError):
        return str(valor)
    return texto.replace(",", "X").replace(".", ",").replace("X", ".") + " €"


def email_parrafo(texto):
    return (f'<p style="margin:0 0 16px;font:400 16px/1.6 {_FUENTE_TEXTO};color:{EMAIL_TEXT};">{texto}</p>')


EMAIL_REDES = (
    ("Instagram", "https://www.instagram.com/princesshotels/"),
    ("Facebook", "https://www.facebook.com/PrincessHotelsResorts/"),
    ("X", "https://x.com/PrincessHotels"),
    ("TikTok", "https://www.tiktok.com/@princesshotelsresorts"),
    ("YouTube", "https://www.youtube.com/channel/UC6Jx3EjAbSS7NRlfNhyW1PA"),
)


def email_utm(url, campana):
    """Añade parámetros UTM al enlace para medir en Google Analytics de qué correo llegan las visitas."""
    union = "&" if "?" in url else "?"
    return f"{url}{union}utm_source=email&utm_medium=correo&utm_campaign={quote(campana)}"


def email_app_aviso():
    """Caja que invita a instalar la app (la web instalable)."""
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;'
        f'background:{EMAIL_FOAM};border-radius:12px;"><tr><td style="padding:16px 20px;'
        f'font:400 14px/1.55 {_FUENTE_TEXTO};color:{EMAIL_INK};">'
        f'<strong style="font-size:15px;">📱 Lleva el hotel en tu móvil</strong><br>'
        f'Instala nuestra app en Android o iPhone: abre la web y pulsa «Instalar app». '
        f'<a href="{PUBLIC_BASE_URL}/index.html" style="color:{EMAIL_SEA};font-weight:700;">Abrir la web</a>'
        f'</td></tr></table>')


def email_tabla(filas):
    """Tabla de datos. filas = [(etiqueta, valor), ...]. Escapa los valores por ti."""
    celdas = ""
    for i, (etiqueta, valor) in enumerate(filas):
        borde = "" if i == len(filas) - 1 else f"border-bottom:1px solid {EMAIL_FOAM};"
        celdas += (
            f'<tr><td style="padding:12px 16px;{borde}font:700 12px {_FUENTE_TEXTO};letter-spacing:.06em;'
            f'text-transform:uppercase;color:{EMAIL_SEA};width:38%;vertical-align:top;">{escape(str(etiqueta))}</td>'
            f'<td style="padding:12px 16px;{borde}font:400 15px/1.45 {_FUENTE_TEXTO};color:{EMAIL_INK};">'
            f'{escape(str(valor))}</td></tr>')
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            f'style="margin:6px 0 20px;background:#f6faf8;border:1px solid {EMAIL_FOAM};border-radius:12px;'
            f'border-collapse:separate;">{celdas}</table>')


def email_layout(titulo, contenido, boton=None, email_baja=None, preheader="", imagen=None, campana=None):
    """Envuelve el contenido en la plantilla del hotel.
    boton = (texto, url) o None. email_baja = email para el enlace de darse de baja (solo comerciales).
    imagen = (archivo de la carpeta fotos, texto alternativo) o None. campana = nombre para medir con UTM."""
    boton_html = ""
    if boton:
        url_boton = email_utm(boton[1], campana) if campana else boton[1]
        boton_html = (
            f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;"><tr>'
            f'<td align="center" style="background:{EMAIL_SUN};border-radius:999px;">'
            f'<a href="{escape(url_boton)}" target="_blank" style="display:inline-block;padding:14px 30px;'
            f'font:700 16px {_FUENTE_TEXTO};color:{EMAIL_INK};text-decoration:none;">{escape(boton[0])}</a>'
            f'</td></tr></table>')
    imagen_html = ""
    if imagen:
        imagen_html = (
            f'<tr><td style="padding:0;font-size:0;line-height:0;">'
            f'<img src="{PUBLIC_BASE_URL}/fotos/{quote(imagen[0])}" width="600" alt="{escape(imagen[1])}" '
            f'style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>')
    redes_html = " &nbsp;·&nbsp; ".join(
        f'<a href="{escape(url)}" target="_blank" style="color:{EMAIL_INK};font-weight:700;'
        f'text-decoration:none;">{escape(nombre)}</a>' for nombre, url in EMAIL_REDES)
    baja_html = ""
    if email_baja:
        baja_html = (f'<p style="margin:12px 0 0;">Si no quieres recibir más avisos, puedes '
                     f'<a href="{PUBLIC_BASE_URL}/desuscrito.html?email={quote(email_baja)}" '
                     f'style="color:{EMAIL_SEA};text-decoration:underline;">darte de baja</a>.</p>')
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(titulo)}</title></head>
<body style="margin:0;padding:0;background:{EMAIL_SAND};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:{EMAIL_SAND};">{escape(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{EMAIL_SAND};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
         style="width:100%;max-width:600px;background:#fbfdfc;border-radius:18px;overflow:hidden;border-collapse:separate;">
    <tr><td align="center" style="background:{EMAIL_INK};padding:30px 24px 26px;">
      <div style="font:600 28px {_FUENTE_TITULO};color:#fbfdfc;letter-spacing:.5px;">La Palma <span style="color:{EMAIL_SUN};">Princess</span></div>
      <div style="margin-top:6px;font:400 12px {_FUENTE_TEXTO};letter-spacing:.18em;text-transform:uppercase;color:{EMAIL_FOAM};">Hotel 4 estrellas · Fuencaliente</div>
    </td></tr>
    <tr><td style="background:{EMAIL_SUN};height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
    {imagen_html}
    <tr><td style="padding:34px 32px 26px;">
      <h1 style="margin:0 0 18px;font:600 26px/1.2 {_FUENTE_TITULO};color:{EMAIL_INK};">{escape(titulo)}</h1>
      {contenido}
      {boton_html}
    </td></tr>
    <tr><td style="background:{EMAIL_FOAM};padding:22px 32px;text-align:center;font:400 13px/1.6 {_FUENTE_TEXTO};color:{EMAIL_INK};">
      <div style="margin-bottom:12px;font-size:14px;"><strong>Síguenos:</strong> {redes_html}</div>
      <strong>Hotel Princess La Palma</strong><br>
      Carretera de la Costa, Cerca Vieja, 10 · 38749 Fuencaliente de La Palma<br>
      Tel. +34 922 42 55 11 · WhatsApp 613 48 90 55<br>
      <a href="mailto:{escape(HOTEL_EMAIL)}" style="color:{EMAIL_SEA};">{escape(HOTEL_EMAIL)}</a>
      {baja_html}
    </td></tr>
  </table>
</td></tr></table>
</body></html>"""


def email_bienvenida_html(name, email):
    return email_layout(
        "¡Bienvenido/a a La Palma Princess!",
        email_parrafo(f"Hola <strong>{escape(name)}</strong>,")
        + email_parrafo("Gracias por registrarte. Tu cuenta ya está creada y lista para usar.")
        + email_parrafo("Con tu cuenta puedes reservar con tus datos ya rellenados y consultar o cancelar "
                        "tus reservas desde «Mis reservas».")
        + email_parrafo("Esperamos darte la bienvenida pronto en Fuencaliente.")
        + email_app_aviso(),
        boton=("Ver habitaciones", PUBLIC_BASE_URL + "/habitaciones.html"),
        email_baja=email,
        preheader="Tu cuenta en La Palma Princess ya está creada.",
        imagen=("foto2.jpg", "Piscinas de La Palma Princess al atardecer"),
        campana="bienvenida",
    )


def email_reserva_html(name, email, reference, token, checkin, checkout, total, room=None, rooms=None):
    filas = [("Referencia", reference), ("Entrada", email_fecha(checkin)), ("Salida", email_fecha(checkout))]
    try:
        noches = (date.fromisoformat(checkout) - date.fromisoformat(checkin)).days
        if noches > 0:
            filas.append(("Noches", noches))
    except ValueError:
        pass
    if room:
        filas.append(("Habitación", f"{room} × {rooms}" if rooms and rooms > 1 else room))
    filas.append(("Total orientativo", email_euros(total)))
    return email_layout(
        "Hemos recibido tu reserva",
        email_parrafo(f"Hola <strong>{escape(name)}</strong>,")
        + email_parrafo("Hemos recibido tu solicitud de reserva en el <strong>Hotel Princess La Palma</strong>. "
                        "Estos son los datos:")
        + email_tabla(filas)
        + email_parrafo("Revisaremos tu solicitud y te responderemos por email en menos de 24 horas. "
                        "Guarda tu referencia por si necesitas escribirnos."),
        boton=("Gestionar o cancelar mi reserva", PUBLIC_BASE_URL + "/reservas.html?manage=" + token),
        email_baja=email,
        preheader=f"Reserva {reference} · {email_fecha(checkin)} → {email_fecha(checkout)}",
    )


def email_servicio_html(name, email, reference, service, service_date, service_time, guests, notes=""):
    filas = [("Referencia", reference), ("Servicio", SERVICIOS_NOMBRES.get(service, service)),
             ("Fecha", email_fecha(service_date)), ("Hora", service_time),
             ("Asistentes", guests)]
    if notes:
        filas.append(("Comentarios", notes))
    return email_layout(
        "Reserva de servicio registrada",
        email_parrafo(f"Hola <strong>{escape(name)}</strong>,")
        + email_parrafo("Hemos registrado tu reserva. Estos son los datos:")
        + email_tabla(filas)
        + email_parrafo("Las tarifas se confirman al llegar al hotel. Si no puedes asistir, "
                        "avísanos para liberar tu plaza."),
        boton=("Ver todos los servicios", PUBLIC_BASE_URL + "/servicios.html"),
        email_baja=email,
        preheader=f"{SERVICIOS_NOMBRES.get(service, service)} · {email_fecha(service_date)} a las {service_time}",
    )


def email_suscripcion_html(email):
    return email_layout(
        "Suscripción confirmada",
        email_parrafo("Gracias por suscribirte a las novedades de <strong>La Palma Princess</strong>.")
        + email_parrafo("Te escribiremos solo cuando tengamos algo que merezca la pena: ofertas, "
                        "novedades del hotel y propuestas para tu escapada a La Palma.")
        + email_app_aviso(),
        boton=("Descubrir el hotel", PUBLIC_BASE_URL + "/index.html"),
        email_baja=email,
        preheader="Ya estás suscrito/a a las novedades de La Palma Princess.",
        imagen=("foto5.jpg", "Vista del hotel y las piscinas sobre el Atlántico"),
        campana="suscripcion",
    )


def email_promocional_html(email):
    ventajas = "".join(
        f'<tr><td style="padding:5px 0;font:400 15px/1.5 {_FUENTE_TEXTO};color:{EMAIL_INK};">'
        f'<span style="color:{EMAIL_SEA};font-weight:700;">✔</span>&nbsp; {t}</td></tr>'
        for t in ("<strong>10% adicional</strong> sobre el precio base.",
                  "Cancelación gratuita hasta 48 h antes.",
                  "Cóctel de bienvenida incluido en Esencia de La Palma."))
    return email_layout(
        "¡Desconecta en el sur de La Palma con un 10% de descuento!",
        email_parrafo("Hola,")
        + email_parrafo("Te echamos de menos en <strong>La Palma Princess</strong>. Para celebrar la llegada de la "
                        "nueva temporada, queremos ofrecerte una promoción exclusiva para tu próxima escapada a Fuencaliente.")
        + email_parrafo("Disfruta de nuestras 7 piscinas al aire libre, del <em>Aqua Princess Spa</em> y de las "
                        "mejores vistas al Atlántico, rodeado de naturaleza volcánica.")
        + f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;'
          f'background:#f6faf8;border-left:4px solid {EMAIL_SUN};border-radius:6px;"><tr><td style="padding:14px 18px;">'
          f'<table role="presentation" cellpadding="0" cellspacing="0">{ventajas}</table></td></tr></table>',
        boton=("Reservar con descuento", PUBLIC_BASE_URL + "/reservas.html"),
        email_baja=email,
        preheader="10% de descuento para tu próxima escapada a La Palma.",
        imagen=("pisci.jpg", "Piscinas de La Palma Princess con vistas al océano Atlántico"),
        campana="oferta_temporada",
    )


def email_cancelacion_html(name, reference):
    return email_layout(
        "Reserva cancelada",
        email_parrafo(f"Hola <strong>{escape(name)}</strong>,")
        + email_parrafo("Te confirmamos que tu reserva ha sido cancelada:")
        + email_tabla([("Referencia", reference), ("Estado", "Cancelada")])
        + email_parrafo("Sentimos que no puedas venir esta vez. Cuando quieras volver a Fuencaliente, "
                        "aquí estaremos."),
        boton=("Hacer una nueva reserva", PUBLIC_BASE_URL + "/reservas.html"),
        preheader=f"Reserva {reference} cancelada.",
    )


def email_modificacion_html(name, reference, token, checkin, checkout, room, rooms, total):
    filas = [("Referencia", reference), ("Entrada", email_fecha(checkin)), ("Salida", email_fecha(checkout)),
             ("Habitación", f"{room} × {rooms}" if rooms and rooms > 1 else room),
             ("Total orientativo", email_euros(total))]
    return email_layout(
        "Tu reserva se ha actualizado",
        email_parrafo(f"Hola <strong>{escape(name)}</strong>,")
        + email_parrafo("Hemos actualizado tu reserva. Estos son los datos nuevos:")
        + email_tabla(filas),
        boton=("Gestionar mi reserva", PUBLIC_BASE_URL + "/reservas.html?manage=" + token),
        preheader=f"Reserva {reference} actualizada.",
    )


def email_baja_newsletter_html():
    return email_layout(
        "Baja confirmada",
        email_parrafo("Te has dado de baja de las novedades de <strong>La Palma Princess</strong>. "
                      "No recibirás más correos comerciales.")
        + email_parrafo("Si fue un error, puedes volver a suscribirte cuando quieras desde nuestra web."),
        boton=("Volver a la web", PUBLIC_BASE_URL + "/index.html"),
        preheader="Ya no recibirás más correos comerciales.",
    )


def email_cuenta_eliminada_html(name):
    return email_layout(
        "Tu cuenta ha sido eliminada",
        email_parrafo(f"Hola <strong>{escape(name)}</strong>,")
        + email_parrafo("Tu cuenta de La Palma Princess se ha eliminado de forma permanente.")
        + email_parrafo("Gracias por haber confiado en nosotros. Siempre serás bienvenido/a en Fuencaliente."),
        boton=("Visitar la web", PUBLIC_BASE_URL + "/index.html"),
        preheader="Tu cuenta se ha eliminado de forma permanente.",
    )


def email_aviso_hotel_html(asunto, cuerpo):
    """Aviso interno para el hotel: convierte las líneas 'Clave: valor' en una tabla."""
    filas, texto = [], ""
    for linea in str(cuerpo).splitlines():
        for trozo in re.split(r"\s{2,}", linea.strip()):
            if not trozo:
                continue
            clave, sep, valor = trozo.partition(": ")
            if sep and 0 < len(clave) <= 30:
                filas.append((clave, valor))
            else:
                texto += email_parrafo(escape(trozo))
    return email_layout(asunto, texto + (email_tabla(filas) if filas else ""),
                        preheader="Aviso automático de la web")


def booking_total(room, rooms, adults, children, nights, resident, promo):
    subtotal = ROOMS[room]["price"] * rooms * nights
    subtotal += max(0, adults - 2 * rooms) * 30 * nights + children * 12 * nights
    total = subtotal
    if resident:
        total -= subtotal * 0.10
    if promo:
        total -= subtotal * 0.05
    return round(total, 2)


def valid_occupancy(room, rooms, adults, children):
    capacity = ROOMS[room]
    return (
        adults <= capacity["adults"] * rooms and
        children <= capacity["children"] * rooms and
        adults + children <= capacity["guests"] * rooms
    )


def room_availability(db, room, checkin, checkout):
    reserved = db.execute(
        """SELECT COALESCE(SUM(rooms), 0) FROM bookings
           WHERE room = ? AND status = 'confirmed' AND checkin < ? AND checkout > ?""",
        (room, checkout, checkin),
    ).fetchone()[0]
    return max(0, ROOMS[room]["inventory"] - reserved)


def send_booking_email(email, name, reference, token, checkin, checkout, total, room=None, rooms=None):
    html = email_reserva_html(name, email, reference, token, checkin, checkout, total, room, rooms)
    return send_email(email, f"Reserva {reference} - {HOTEL_NAME}", html)


# ───────────────────────── Cuentas de usuario y sesiones ─────────────────────────
# El navegador guarda un token aleatorio (en localStorage) y lo envía en la cabecera
# "Authorization: Bearer <token>". En la base de datos solo se guarda su hash SHA-256.
SESSION_DAYS = 30
MAX_LOGIN_FAILS = 8
LOGIN_WINDOW = 10 * 60
MAX_REGISTRATIONS = 10
REGISTER_WINDOW = 60 * 60
DUMMY_HASH = generate_password_hash("contraseña-ficticia")
_attempts = {}
_attempts_lock = threading.Lock()


def utc_now():
    return datetime.now(timezone.utc)


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def attempts_count(key, window):
    cutoff = time.time() - window
    with _attempts_lock:
        recent = [t for t in _attempts.get(key, []) if t > cutoff]
        if recent:
            _attempts[key] = recent
        else:
            _attempts.pop(key, None)
        return len(recent)


def attempts_add(key):
    with _attempts_lock:
        _attempts.setdefault(key, []).append(time.time())


def attempts_clear(key):
    with _attempts_lock:
        _attempts.pop(key, None)


def create_session(db, user_id):
    token = secrets.token_urlsafe(32)
    now = utc_now()
    db.execute("DELETE FROM sessions WHERE expires_at < ?", (now.isoformat(),))
    db.execute(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (hash_token(token), user_id, now.isoformat(), (now + timedelta(days=SESSION_DAYS)).isoformat()),
    )
    return token


def bearer_token():
    header = request.headers.get("Authorization", "")
    return header[7:].strip() if header.lower().startswith("bearer ") else ""


def current_user(db):
    token = bearer_token()
    if not token:
        return None
    return db.execute(
        """SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token_hash = ? AND s.expires_at > ?""",
        (hash_token(token), utc_now().isoformat()),
    ).fetchone()


def user_json(user):
    return {"name": user["name"], "email": user["email"]}


@app.post("/api/auth/register")
def register():
    """Crea la cuenta y deja la sesión iniciada en el mismo paso."""
    data = json_payload()
    if not data:
        return api_error("Envía los datos de registro en formato JSON.", 400)
    name = clean_text(data.get("name"), 100)
    email = clean_text(data.get("email"), 254).lower()
    password = data.get("password")
    if not name or not email_valid(email):
        return api_error("Escribe tu nombre y un email válido.", 400)
    if not isinstance(password, str) or not 8 <= len(password) <= 128:
        return api_error("La contraseña debe tener entre 8 y 128 caracteres.", 400)
    if data.get("terms") is not True:
        return api_error("Debes aceptar las condiciones de uso.", 400)
    ip_key = "register|" + (request.remote_addr or "")
    if attempts_count(ip_key, REGISTER_WINDOW) >= MAX_REGISTRATIONS:
        return api_error("Demasiados registros desde esta conexión. Inténtalo más tarde.", 429)
    try:
        with connect_db() as db:
            cursor = db.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, email, generate_password_hash(password)),
            )
            token = create_session(db, cursor.lastrowid)
    except sqlite3.IntegrityError:
        return api_error("Ya existe una cuenta con ese email. Inicia sesión.", 409)
    attempts_add(ip_key)

    # Email de bienvenida (si falla el envío, la cuenta se crea igualmente)
    html_bienvenida = email_bienvenida_html(name, email)
    send_email(email, "¡Bienvenido/a a La Palma Princess!", html_bienvenida)
    notify_hotel("Nueva alta de usuario", f"Nombre: {name}\nEmail: {email}", reply_to=email)

    return jsonify({"token": token, "user": {"name": name, "email": email}}), 201


@app.post("/api/auth/login")
def login():
    data = json_payload()
    if not data:
        return api_error("Envía los datos de acceso en formato JSON.", 400)
    email = clean_text(data.get("email"), 254).lower()
    password = data.get("password")
    if not email or not isinstance(password, str) or not password:
        return api_error("Escribe tu email y tu contraseña.", 400)
    key = "login|" + (request.remote_addr or "") + "|" + email
    if attempts_count(key, LOGIN_WINDOW) >= MAX_LOGIN_FAILS:
        return api_error("Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.", 429)
    with connect_db() as db:
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        # Se comprueba siempre un hash para que el tiempo de respuesta no delate si el email existe.
        valid = check_password_hash(user["password_hash"] if user else DUMMY_HASH, password)
        if not user or not valid:
            attempts_add(key)
            return api_error("Email o contraseña incorrectos.", 401)
        token = create_session(db, user["id"])
    attempts_clear(key)
    return jsonify({"token": token, "user": user_json(user)})


@app.post("/api/auth/logout")
def logout():
    token = bearer_token()
    if token:
        with connect_db() as db:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_token(token),))
    return jsonify({"message": "Sesión cerrada."})

@app.delete("/api/auth/delete-account")
def delete_account():
    token = bearer_token()
    if not token:
        return api_error("No hay una sesión activa.", 401)
    with connect_db() as db:
        user = current_user(db)
        if not user:
            return api_error("La sesión ha caducado.", 401)
        
        db.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        db.execute("UPDATE bookings SET user_id = NULL WHERE user_id = ?", (user["id"],))
        db.execute("UPDATE service_bookings SET user_id = NULL WHERE user_id = ?", (user["id"],))
        db.execute("DELETE FROM users WHERE id = ?", (user["id"],))
        
        send_async(user["email"], "Cuenta eliminada - La Palma Princess",
                   email_cuenta_eliminada_html(user["name"]))
        notify_hotel("Baja de usuario", f"El usuario {user['name']} ({user['email']}) ha eliminado su cuenta.")

    return jsonify({"message": "Cuenta eliminada permanentemente."}), 200

@app.get("/api/auth/me")
def me():
    with connect_db() as db:
        user = current_user(db)
    if not user:
        return api_error("La sesión ha caducado. Inicia sesión de nuevo.", 401)
    return jsonify({"user": user_json(user)})


@app.get("/api/me/bookings")
def my_bookings():
    with connect_db() as db:
        user = current_user(db)
        if not user:
            return api_error("Inicia sesión para ver tus reservas.", 401)
        rooms = db.execute(
            """SELECT reference, checkin, checkout, room, rooms, adults, children, total, status
               FROM bookings WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50""",
            (user["id"],),
        ).fetchall()
        services = db.execute(
            """SELECT reference, service, service_date, service_time, guests
               FROM service_bookings WHERE user_id = ? ORDER BY service_date DESC, service_time DESC LIMIT 50""",
            (user["id"],),
        ).fetchall()
    return jsonify({"bookings": [dict(row) for row in rooms], "services": [dict(row) for row in services]})


@app.post("/api/me/bookings/<reference>/cancel")
def cancel_my_booking(reference):
    with connect_db() as db:
        user = current_user(db)
        if not user:
            return api_error("Inicia sesión para gestionar tus reservas.", 401)
        cursor = db.execute(
            "UPDATE bookings SET status = 'cancelled' WHERE reference = ? AND user_id = ? AND status = 'confirmed'",
            (reference.upper(), user["id"]),
        )
        if cursor.rowcount == 0:
            return api_error("No se encontró una reserva activa tuya con esa referencia.", 404)
    email_sent = send_email(
        user["email"], f"Cancelación {reference.upper()} - {HOTEL_NAME}",
        email_cancelacion_html(user["name"], reference.upper())
    )
    notify_hotel(f"Reserva cancelada {reference.upper()}",
                 f"Referencia: {reference.upper()}\nCliente: {user['name']}\nEmail: {user['email']}",
                 reply_to=user["email"])
    return jsonify({"message": "Reserva cancelada.", "email_sent": email_sent})


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.get("/api/availability")
def availability():
    checkin = valid_date(request.args.get("checkin"))
    checkout = valid_date(request.args.get("checkout"))
    room = request.args.get("room", "Estándar")
    rooms = parse_integer(request.args.get("rooms", "1"))
    adults = parse_integer(request.args.get("adults", "2"))
    children = parse_integer(request.args.get("children", "0"))
    if None in (rooms, adults, children):
        return api_error("Los huéspedes y las habitaciones deben ser números válidos.", 400)
    resident = request.args.get("resident") == "1"
    promo = request.args.get("promo", "")
    if not checkin or not checkout or checkin < hotel_today() or checkout <= checkin:
        return api_error("Indica fechas válidas y una salida posterior a la entrada.", 400)
    if room not in ROOMS or not 1 <= rooms <= 4 or adults < 1 or adults > 16 or not 0 <= children <= 12:
        return api_error("Revisa el tipo de habitación y el número de huéspedes.", 400)
    if not valid_occupancy(room, rooms, adults, children):
        return api_error("El número de huéspedes supera la capacidad del tipo de habitación.", 400)
    if promo and not re.fullmatch(r"\d{6}", promo):
        return api_error("El código promocional debe tener seis dígitos.", 400)
    nights = (checkout - checkin).days
    with connect_db() as db:
        available = room_availability(db, room, checkin.isoformat(), checkout.isoformat())
    return jsonify({
        "available": available >= rooms,
        "rooms_available": available,
        "nights": nights,
        "total": booking_total(room, rooms, adults, children, nights, resident, promo),
        "currency": "EUR",
        "demo": True,
    })


@app.post("/api/bookings")
def create_booking():
    data = json_payload()
    if not data:
        return api_error("Envía los datos de la reserva en formato JSON.", 400)
    name = clean_text(data.get("name"), 100)
    email = clean_text(data.get("email"), 254)
    checkin = valid_date(data.get("checkin"))
    checkout = valid_date(data.get("checkout"))
    room = clean_text(data.get("room"), 40)
    message = clean_text(data.get("message"), 1000)
    promo = clean_text(data.get("promo"), 6)
    rooms = parse_integer(data.get("rooms", 1))
    adults = parse_integer(data.get("adults", 2))
    children = parse_integer(data.get("children", 0))
    if None in (rooms, adults, children):
        return api_error("El número de huéspedes y habitaciones no es válido.", 400)
    resident_value = data.get("resident", False)
    if not isinstance(resident_value, bool):
        return api_error("El indicador de residente no es válido.", 400)
    resident = resident_value
    if not name or not email_valid(email) or not checkin or not checkout or checkin < hotel_today() or checkout <= checkin:
        return api_error("Revisa el nombre, el email y las fechas de la reserva.", 400)
    if room not in ROOMS or not 1 <= rooms <= 4 or not 1 <= adults <= 16 or not 0 <= children <= 12:
        return api_error("Revisa el tipo de habitación y el número de huéspedes.", 400)
    if not valid_occupancy(room, rooms, adults, children):
        return api_error("El número de huéspedes supera la capacidad del tipo de habitación.", 400)
    if promo and not re.fullmatch(r"\d{6}", promo):
        return api_error("El código promocional debe tener seis dígitos.", 400)

    reference = secrets.token_hex(4).upper()
    token = secrets.token_urlsafe(32)
    total = booking_total(room, rooms, adults, children, (checkout - checkin).days, resident, promo)
    try:
        with connect_db() as db:
            db.execute("BEGIN IMMEDIATE")
            available = room_availability(db, room, checkin.isoformat(), checkout.isoformat())
            if available < rooms:
                return jsonify({"error": "No hay disponibilidad para esas fechas.", "rooms_available": available}), 409
            user = current_user(db)
            db.execute(
                """INSERT INTO bookings
                   (reference, token_hash, name, email, checkin, checkout, room, rooms, adults,
                    children, promo, resident, message, total, user_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (reference, hashlib.sha256(token.encode()).hexdigest(), name, email,
                 checkin.isoformat(), checkout.isoformat(), room, rooms, adults,
                 children, promo, int(resident), message, total, user["id"] if user else None),
            )
    except sqlite3.IntegrityError:
        return api_error("No se pudo registrar la solicitud. Inténtalo de nuevo.", 409)

    email_sent = send_booking_email(email, name, reference, token, checkin.isoformat(), checkout.isoformat(), total,
                                    room=room, rooms=rooms)
    notify_hotel(
        f"Nueva reserva {reference}",
        f"Referencia: {reference}\nCliente: {name}\nEmail: {email}\n"
        f"Habitación: {room} x{rooms}\nEntrada: {checkin.isoformat()}\nSalida: {checkout.isoformat()}\n"
        f"Adultos: {adults}  Niños: {children}\nResidente: {'sí' if resident else 'no'}\n"
        f"Código promocional: {promo or '-'}\nTotal orientativo: {total:.2f} EUR\n"
        f"Comentarios: {message or '-'}",
        reply_to=email,
    )
    return jsonify({
        "reference": reference,
        "management_token": token,
        "total": total,
        "email_sent": email_sent,
        "message": "Solicitud registrada y confirmación enviada." if email_sent else
                   "Solicitud registrada. La confirmación por correo está pendiente de configurar.",
    }), 201


def find_booking(token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with connect_db() as db:
        return db.execute("SELECT * FROM bookings WHERE token_hash = ?", (token_hash,)).fetchone()


@app.get("/api/bookings/<token>")
def get_booking(token):
    booking = find_booking(token)
    if not booking:
        return api_error("No se encontró una reserva con ese enlace.", 404)
    return jsonify({key: booking[key] for key in (
        "reference", "name", "email", "checkin", "checkout", "room", "rooms",
        "adults", "children", "total", "status"
    )})


@app.post("/api/bookings/<token>/cancel")
def cancel_booking(token):
    with connect_db() as db:
        cursor = db.execute(
            "UPDATE bookings SET status = 'cancelled' WHERE token_hash = ? AND status = 'confirmed'",
            (hashlib.sha256(token.encode()).hexdigest(),),
        )
        if cursor.rowcount == 0:
            return api_error("No se encontró una reserva activa para cancelar.", 404)
        booking = db.execute("SELECT * FROM bookings WHERE token_hash = ?",
                             (hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
    email_sent = send_email(
        booking["email"], f"Cancelación {booking['reference']} - {HOTEL_NAME}",
        email_cancelacion_html(booking["name"], booking["reference"])
    )
    notify_hotel(f"Reserva cancelada {booking['reference']}",
                 f"Referencia: {booking['reference']}\nCliente: {booking['name']}\nEmail: {booking['email']}",
                 reply_to=booking["email"])
    return jsonify({"message": "Reserva cancelada.", "email_sent": email_sent})


@app.patch("/api/bookings/<token>")
def update_booking(token):
    data = json_payload()
    if not data:
        return api_error("Envía los nuevos datos en formato JSON.", 400)
    booking = find_booking(token)
    if not booking or booking["status"] != "confirmed":
        return api_error("No se encontró una reserva activa para modificar.", 404)
    checkin = valid_date(data.get("checkin", booking["checkin"]))
    checkout = valid_date(data.get("checkout", booking["checkout"]))
    room = clean_text(data.get("room", booking["room"]), 40)
    rooms = parse_integer(data.get("rooms", booking["rooms"]))
    if rooms is None:
        return api_error("El número de habitaciones no es válido.", 400)
    if not checkin or not checkout or checkin < hotel_today() or checkout <= checkin or room not in ROOMS or not 1 <= rooms <= 4:
        return api_error("Revisa las fechas, el tipo de habitación y el número de habitaciones.", 400)
    adults = booking["adults"]
    children = booking["children"]
    if not valid_occupancy(room, rooms, adults, children):
        return api_error("El tipo de habitación elegido no admite a todos los huéspedes.", 400)
    resident = booking["resident"]
    promo = booking["promo"]
    total = booking_total(room, rooms, adults, children, (checkout - checkin).days, resident, promo)
    with connect_db() as db:
        db.execute("BEGIN IMMEDIATE")
        available = room_availability(db, room, checkin.isoformat(), checkout.isoformat())
        if room == booking["room"] and checkin < date.fromisoformat(booking["checkout"]) and checkout > date.fromisoformat(booking["checkin"]):
            available += booking["rooms"]
        if available < rooms:
            return jsonify({"error": "No hay disponibilidad para esos cambios.", "rooms_available": available}), 409
        db.execute(
            "UPDATE bookings SET checkin = ?, checkout = ?, room = ?, rooms = ?, total = ? WHERE id = ?",
            (checkin.isoformat(), checkout.isoformat(), room, rooms, total, booking["id"]),
        )
    email_sent = send_email(
        booking["email"], f"Actualización de reserva {booking['reference']} - {HOTEL_NAME}",
        email_modificacion_html(booking["name"], booking["reference"], token,
                                checkin.isoformat(), checkout.isoformat(), room, rooms, total)
    )
    notify_hotel(
        f"Reserva modificada {booking['reference']}",
        f"Referencia: {booking['reference']}\nCliente: {booking['name']}\nEmail: {booking['email']}\n"
        f"Entrada: {checkin.isoformat()}\nSalida: {checkout.isoformat()}\n"
        f"Habitación: {room} x{rooms}\nTotal orientativo: {total:.2f} EUR",
        reply_to=booking["email"],
    )
    return jsonify({
        "message": "Reserva actualizada.",
        "total": total,
        "email_sent": email_sent,
    })


@app.get("/api/service-slots")
def service_slots():
    service = request.args.get("service", "")
    service_date = valid_date(request.args.get("date"))
    if service not in SERVICES or not service_date or service_date < hotel_today():
        return api_error("Indica un servicio y una fecha futura válidos.", 400)
    with connect_db() as db:
        slots = []
        for service_time in SERVICE_TIMES[service]:
            if service_date == hotel_today() and service_time <= datetime.now(HOTEL_TIMEZONE).strftime("%H:%M"):
                continue
            occupied = db.execute(
                "SELECT COALESCE(SUM(guests), 0) FROM service_bookings WHERE service = ? AND service_date = ? AND service_time = ?",
                (service, service_date.isoformat(), service_time),
            ).fetchone()[0]
            remaining = max(0, SERVICE_CAPACITY[service] - occupied)
            if remaining:
                slots.append({"time": service_time, "available": remaining})
    return jsonify({"service": service, "date": service_date.isoformat(), "slots": slots})


@app.post("/api/service-bookings")
def create_service_booking():
    data = json_payload()
    if not data:
        return api_error("Envía los datos de la cita en formato JSON.", 400)
    name = clean_text(data.get("name"), 100)
    email = clean_text(data.get("email"), 254)
    service = clean_text(data.get("service"), 20)
    service_date = valid_date(data.get("date"))
    service_time = clean_text(data.get("time"), 5)
    notes = clean_text(data.get("notes"), 500)
    guests = parse_integer(data.get("guests", 1))
    if guests is None:
        return api_error("El número de asistentes no es válido.", 400)
    if not name or not email_valid(email) or service not in SERVICES or not service_date or service_date < hotel_today():
        return api_error("Revisa el nombre, el email, el servicio y la fecha.", 400)
    if service_time not in SERVICE_TIMES[service] or not 1 <= guests <= 12:
        return api_error("Elige una hora disponible y un número válido de asistentes.", 400)
    if service_date == hotel_today() and service_time <= datetime.now(HOTEL_TIMEZONE).strftime("%H:%M"):
        return api_error("La hora elegida ya ha pasado.", 400)
    reference = secrets.token_hex(4).upper()
    try:
        with connect_db() as db:
            db.execute("BEGIN IMMEDIATE")
            occupied = db.execute(
                "SELECT COALESCE(SUM(guests), 0) FROM service_bookings WHERE service = ? AND service_date = ? AND service_time = ?",
                (service, service_date.isoformat(), service_time),
            ).fetchone()[0]
            if occupied + guests > SERVICE_CAPACITY[service]:
                return api_error("Ya no quedan plazas suficientes en esa hora.", 409)
            user = current_user(db)
            db.execute(
                """INSERT INTO service_bookings
                   (reference, name, email, service, service_date, service_time, guests, notes, user_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (reference, name, email, service, service_date.isoformat(), service_time, guests, notes,
                 user["id"] if user else None),
            )
    except sqlite3.IntegrityError:
        return api_error("Ya existe una reserva de ese servicio para ese email y horario.", 409)
    email_sent = send_email(
        email, f"Reserva de servicio {reference} - {HOTEL_NAME}",
        email_servicio_html(name, email, reference, service, service_date.isoformat(), service_time, guests, notes)
    )
    notify_hotel(
        f"Nueva reserva de servicio {reference}",
        f"Referencia: {reference}\nCliente: {name}\nEmail: {email}\nServicio: {service}\n"
        f"Fecha: {service_date.isoformat()} {service_time}\nAsistentes: {guests}\nNotas: {notes or '-'}",
        reply_to=email,
    )
    return jsonify({
        "reference": reference,
        "email_sent": email_sent,
        "message": "Cita registrada y confirmación enviada." if email_sent else
                   "Cita registrada. La confirmación por correo está pendiente de configurar.",
    }), 201


@app.post("/api/newsletter")
def subscribe_newsletter():
    data = json_payload()
    email = clean_text(data.get("email"), 254) if data else ""
    if not email_valid(email):
        return api_error("Escribe un email válido.", 400)
    if data.get("consent") is not True:
        return api_error("Necesitas aceptar las comunicaciones comerciales para suscribirte.", 400)
    try:
        with connect_db() as db:
            db.execute("INSERT INTO subscribers (email) VALUES (?)", (email.lower(),))
    except sqlite3.IntegrityError:
        return jsonify({"message": "Ese email ya está suscrito."})
    email_sent = send_email(
        email, f"Suscripción confirmada - {HOTEL_NAME}",
        email_suscripcion_html(email)
    )
    notify_hotel("Nueva suscripción a la newsletter", f"Email: {email.lower()}", reply_to=email)
    return jsonify({
        "message": "Suscripción confirmada." if email_sent else
                   "Suscripción guardada correctamente.",
        "email_sent": email_sent,
    }), 201

@app.post("/api/newsletter/unsubscribe")
def unsubscribe_newsletter():
    data = json_payload()
    email = clean_text(data.get("email"), 254).lower() if data else ""
    if not email_valid(email):
        return api_error("Escribe un email válido.", 400)
    with connect_db() as db:
        removed = db.execute("DELETE FROM subscribers WHERE email = ?", (email,)).rowcount > 0
    if removed:
        send_async(email, f"Baja confirmada - {HOTEL_NAME}", email_baja_newsletter_html())
        notify_hotel("Baja de la newsletter", f"Email: {email}")
    return jsonify({"message": "Baja realizada." if removed else "Ese email no estaba suscrito."})

def _datos_dinamicos():
    precios = "\n".join(
        f"- {nombre}: desde {datos['price']} EUR por habitacion y noche."
        for nombre, datos in ROOMS.items()
    )
    nombres = {"spa": "Spa", "gym": "Gimnasio (máquinas)", "pilates": "Pilates",
               "solarium": "Solarium", "padel1": "Pádel pista 1", "padel2": "Pádel pista 2",
               "volley": "Arenero de vóley", "cancha": "Cancha de baloncesto y fútbol"}
    horarios = "\n".join(
        f"- {nombres[k]} (reservable en la web): {', '.join(v)}."
        for k, v in SERVICE_TIMES.items()
    )
    return precios, horarios


_PRECIOS, _HORARIOS = _datos_dinamicos()

CONTEXTO_HOTEL = """
Eres el recepcionista virtual del hotel La Palma Princess (Hotel Princess La Palma).
Responde en el idioma del cliente, con tono amable y respuestas breves.

REGLAS ESTRICTAS:
- Responde SOLO con la información de este texto.
- Antes de decir que no tienes un dato, revisa TODO el texto de abajo. Solo si de verdad
  no aparece, di que no lo tienes y sugiere contactar con el hotel por teléfono, email o WhatsApp.
- Nunca inventes precios, horarios, servicios ni condiciones.
- No puedes hacer reservas: indica que usen la página de Reservas.
- Si preguntan algo que no tiene que ver con el hotel, di que solo puedes ayudar con temas del hotel.

INFORMACIÓN OFICIAL:
- Hotel de 4 estrellas en Fuencaliente, al sur de La Palma, sobre un acantilado con vistas al Atlántico.
  Habitaciones de estilo colonial en edificios de baja altura rodeados de jardines y palmeras.
- Dirección: Carretera de la Costa, Cerca Vieja, 10, 38749 Fuencaliente de La Palma.
- Teléfono: +34 922 42 55 11 (lunes a viernes, de 09:00 a 17:00).
- WhatsApp: 613 48 90 55.
- Email: {EMAIL}.

ZONAS:
- Zona general (familiar): siete piscinas exteriores, con piscina infantil, playa de arena artificial y solárium.
- Esencia de La Palma: zona exclusiva para adultos (+16), con cuatro piscinas, una climatizada en invierno.

PRECIOS (por noche, segun la pagina de Reservas):
{PRECIOS}
- Suplemento por adulto extra (mas de 2 por habitacion): 30 EUR/noche. Por nino: 12 EUR/noche.
- Descuento de residente: 10%. Codigo promocional: 5%.

HABITACIONES:
- Estándar: 22 m², estilo colonial, cama king size o dos individuales, sofá, baño con bañera y ducha,
  aire acondicionado y terraza o balcón. Hasta 3 adultos o 2 adultos y 2 niños.
- Familiar Superior: 44 m², dos habitaciones Estándar comunicadas, dos baños, vistas al jardín.
  Hasta 4 adultos y 2 niños.
- Ocean Suite: 44 m², salón y dormitorio independientes, dos baños, dos terrazas o balcones.
  Hasta 3 adultos y 2 niños.

SERVICIOS:
- Parking gratuito para huéspedes durante toda la estancia.
- Gimnasio con equipamiento de cardio y musculación, para huéspedes.
- Aqua Princess Spa: circuito de aguas, masajes y tratamientos. Recomendable reservar con antelación.
- Terrazas con vistas al Atlántico, rodeadas de jardines.
- Actividades y deportes para todas las edades.
- Servicio para niños: espacios y actividades infantiles y piscina infantil.
- Restaurantes con bufé, bar piscina, piano bar y un restaurante con menú de degustación.

RESERVAS:
- Se hacen en la página de Reservas. Responden por email en menos de 24 horas.
- Se pueden reservar hasta 4 habitaciones. Hay campo para código promocional (6 dígitos) y opción de residente.
- Adultos: desde 12 años. Niños: hasta 11 años.

SERVICIOS RESERVABLES EN LA WEB (horas disponibles):
{HORARIOS}
""".replace("{PRECIOS}", _PRECIOS).replace("{HORARIOS}", _HORARIOS).replace("{EMAIL}", HOTEL_EMAIL)


def _error_temporal(exc):
    t = str(exc).upper()
    return any(c in t for c in ("429", "500", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE", "OVERLOADED", "TIMEOUT"))


@app.route('/chat', methods=['POST'])
def chat():
    try:
        datos = request.get_json(silent=True)
        if not datos or "mensaje" not in datos:
            return jsonify({"respuesta": "No se ha recibido ningún mensaje."}), 400

        pregunta_usuario = str(datos.get("mensaje", "")).strip()[:1000]
        idioma_detectado = str(datos.get("idioma", "es")).strip()[:10]

        if not pregunta_usuario:
            return jsonify({"respuesta": "No se ha recibido ningún mensaje."}), 400
        if not client:
            app.logger.error("Chat sin cliente Gemini: falta GEMINI_API_KEY o el paquete google-genai")
            return jsonify({"respuesta": "El asistente virtual no está configurado.", "error": "sin_configurar"}), 503

        consulta_con_idioma = f"[Responder obligatoriamente en el idioma con código ISO: '{idioma_detectado}']\nPregunta: {pregunta_usuario}"

        for modelo_nombre in MODELOS_IA:
            for intento in range(2):
                try:
                    response = client.models.generate_content(
                        model=modelo_nombre,
                        contents=consulta_con_idioma,
                        config=types.GenerateContentConfig(
                            system_instruction=CONTEXTO_HOTEL,
                            temperature=0.3,
                        ),
                    )
                    texto = (response.text or "").strip() if response else ""
                    if texto:
                        app.logger.info("CHAT OK -> respondió la IA con el modelo %s | pregunta: %.80s", modelo_nombre, pregunta_usuario)
                        return jsonify({"respuesta": texto, "modelo": modelo_nombre})
                    app.logger.warning("Modelo %s devolvió respuesta vacía", modelo_nombre)
                    break
                except Exception as e_modelo:
                    # error (no warning) para que se vea claro en los logs de Render
                    app.logger.error("Fallo con modelo %s (intento %s): %s", modelo_nombre, intento + 1, e_modelo)
                    if intento == 0 and _error_temporal(e_modelo):
                        time.sleep(1.5)
                        continue
                    break

        app.logger.error("CHAT FALLO -> ningún modelo respondió (probados: %s)", ", ".join(MODELOS_IA))
        # Si llegamos aquí NO es que falte el dato: es que la IA no ha respondido.
        return jsonify({
            "respuesta": "El asistente está saturado en este momento. Inténtalo de nuevo en unos segundos.",
            "error": "ia_no_disponible",
        }), 503

    except Exception:
        app.logger.exception("Error general en endpoint /chat")
        return jsonify({"respuesta": "Lo siento, ha ocurrido un error. Vuelve a intentarlo en unos segundos.", "error": "interno"}), 500


@app.get("/api/chat-debug")
def chat_debug():
    """Solo si pones CHAT_DEBUG=1 en Render. Muestra que modelos ve tu API key."""
    if os.getenv("CHAT_DEBUG") != "1":
        return api_error("No disponible.", 404)
    if not client:
        return jsonify({"cliente": False, "modelos_configurados": MODELOS_IA})
    try:
        disponibles = sorted(m.name.replace("models/", "") for m in client.models.list())
    except Exception as e:
        return jsonify({"cliente": True, "error": str(e), "modelos_configurados": MODELOS_IA}), 500
    return jsonify({
        "modelos_configurados": MODELOS_IA,
        "configurados_que_existen": [m for m in MODELOS_IA if m in disponibles],
        "disponibles": [m for m in disponibles if "gemini" in m],
    })



# ───────────────────────── Correos sueltos (una sola definición de cada ruta) ─────────────────────────
@app.route('/enviar-email-promocional', methods=['POST'])
def enviar_email_promocional():
    datos = request.get_json(silent=True) or {}
    email_destino = clean_text(datos.get("email"), 254)

    if not email_destino or not email_valid(email_destino):
        return jsonify({"error": "Hace falta especificar un email válido"}), 400

    try:
        contenido_html = email_promocional_html(email_destino)
        if send_email(email_destino, "¡Oferta especial 10% Dto! - Hotel Princess La Palma", contenido_html):
            return jsonify({"mensaje": f"Correo promocional enviado a {email_destino} correctamente."}), 200
        return jsonify({"error": "No se pudo enviar el correo promocional."}), 500
    except Exception:
        app.logger.exception("Error en /enviar-email-promocional")
        return jsonify({"error": "Error procesando la plantilla del correo."}), 500


# ───────────────────────── Panel de administración (lista de registros) ─────────────────────────
# Solo funciona si en Render pones la variable ADMIN_KEY. Se abre en: /admin?clave=TU_CLAVE
ADMIN_KEY = os.getenv("ADMIN_KEY", "").strip()


ADMIN_CSS = """
:root{--ink:#12303a;--sea:#2f7f86;--foam:#dcebe6;--sand:#efe6d6;--sun:#f2b84b;--white:#fbfdfc;
--serif:"Fraunces",Georgia,serif;--sans:"Hanken Grotesk",system-ui,sans-serif}
*{box-sizing:border-box}
body{margin:0;font:400 15px/1.5 var(--sans);color:var(--ink);background:var(--sand)}
header{background:var(--ink);color:var(--white);padding:18px 5vw;display:flex;align-items:center;
justify-content:space-between;gap:16px;flex-wrap:wrap;position:sticky;top:0;z-index:5;
box-shadow:0 2px 12px rgba(0,0,0,.25)}
header h1{margin:0;font:600 1.4rem var(--serif)}
header h1 span{color:var(--sun)}
header input{height:40px;min-width:240px;padding:0 16px;border:0;border-radius:999px;
background:rgba(255,255,255,.12);color:var(--white);font:400 15px var(--sans)}
header input::placeholder{color:rgba(255,255,255,.6)}
header input:focus{outline:2px solid var(--sun)}
main{padding:28px 5vw 48px;max-width:1400px;margin:0 auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:28px}
.stat{background:var(--white);border-radius:16px;padding:18px 20px;box-shadow:0 2px 10px rgba(18,48,58,.08);
border-top:4px solid var(--sun)}
.stat:nth-child(2){border-top-color:var(--sea)}
.stat:nth-child(3){border-top-color:var(--ink)}
.stat:nth-child(4){border-top-color:var(--foam)}
.stat b{display:block;font:600 2.2rem/1 var(--serif)}
.stat small{color:var(--sea);font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:.72rem}
section{background:var(--white);border-radius:18px;padding:22px 22px 10px;margin-bottom:24px;
box-shadow:0 2px 10px rgba(18,48,58,.08)}
section h2{margin:0 0 14px;font:600 1.5rem var(--serif);display:flex;align-items:center;gap:10px}
section h2 em{font:700 .8rem var(--sans);font-style:normal;background:var(--foam);color:var(--ink);
border-radius:999px;padding:3px 11px}
.scroll{overflow-x:auto;margin:0 -22px;padding:0 22px 12px}
table{border-collapse:collapse;width:100%;min-width:640px;font-size:14px}
th{position:sticky;top:0;background:var(--ink);color:var(--white);text-align:left;font-weight:700;
font-size:.78rem;letter-spacing:.05em;text-transform:uppercase;padding:11px 12px;white-space:nowrap}
th:first-child{border-radius:10px 0 0 10px}th:last-child{border-radius:0 10px 10px 0}
td{padding:11px 12px;border-bottom:1px solid var(--foam);vertical-align:top}
tbody tr:nth-child(even){background:#f4f9f7}
tbody tr:hover{background:var(--foam)}
td.ref{font-weight:700;color:var(--sea);white-space:nowrap}
td.vacio{text-align:center;color:#7a8e93;padding:26px}
.badge{display:inline-block;padding:3px 11px;border-radius:999px;font-size:.78rem;font-weight:700}
.ok{background:#d8f0e2;color:#14683a}
.ko{background:#fbdcdc;color:#a22626}
.otro{background:var(--sand);color:var(--ink)}
@media(max-width:600px){header{position:static}header input{width:100%}main{padding:20px 4vw}
section{padding:18px 16px 6px}.scroll{margin:0 -16px;padding:0 16px 10px}}
"""

ADMIN_JS = """
var q=document.getElementById('buscar');
q.addEventListener('input',function(){
  var t=q.value.trim().toLowerCase();
  document.querySelectorAll('tbody tr[data-f]').forEach(function(tr){
    tr.style.display=tr.textContent.toLowerCase().indexOf(t)>-1?'':'none';
  });
});
"""


def _tabla_html(titulo, cabeceras, filas, col_estado=None):
    cab = "".join(f"<th>{escape(c)}</th>" for c in cabeceras)
    cuerpo = ""
    for fila in filas:
        celdas = ""
        for i, v in enumerate(fila):
            txt = escape(str(v if v is not None else ""))
            if i == col_estado:
                clase, etiqueta = {
                    "confirmed": ("ok", "Confirmada"),
                    "cancelled": ("ko", "Cancelada"),
                }.get(str(v), ("otro", txt))
                celdas += f'<td><span class="badge {clase}">{etiqueta}</span></td>'
            elif i == 0 and cabeceras[0] == "Ref.":
                celdas += f'<td class="ref">{txt}</td>'
            else:
                celdas += f"<td>{txt}</td>"
        cuerpo += f"<tr data-f>{celdas}</tr>"
    if not cuerpo:
        cuerpo = f'<tr><td class="vacio" colspan="{len(cabeceras)}">Sin datos todavía</td></tr>'
    return (f'<section><h2>{escape(titulo)} <em>{len(filas)}</em></h2>'
            f'<div class="scroll"><table><thead><tr>{cab}</tr></thead>'
            f'<tbody>{cuerpo}</tbody></table></div></section>')


@app.get("/admin")
def admin_panel():
    if not ADMIN_KEY:
        return api_error("No disponible.", 404)
    ip_key = "admin|" + (request.remote_addr or "")
    if attempts_count(ip_key, LOGIN_WINDOW) >= MAX_LOGIN_FAILS:
        return api_error("Demasiados intentos. Espera unos minutos.", 429)
    if not secrets.compare_digest(request.args.get("clave", "").encode(), ADMIN_KEY.encode()):
        attempts_add(ip_key)
        return api_error("No disponible.", 404)
    with connect_db() as db:
        usuarios = db.execute("SELECT name, email, created_at FROM users ORDER BY id DESC").fetchall()
        reservas = db.execute(
            "SELECT reference, name, email, room, rooms, checkin, checkout, total, status "
            "FROM bookings ORDER BY id DESC LIMIT 200").fetchall()
        servicios = db.execute(
            "SELECT reference, name, email, service, service_date, service_time, guests "
            "FROM service_bookings ORDER BY id DESC LIMIT 200").fetchall()
        suscriptores = db.execute("SELECT email, created_at FROM subscribers ORDER BY id DESC").fetchall()
        nombres_servicio = {"spa": "Aqua Princess Spa", "gym": "Gimnasio (máquinas)", "pilates": "Pilates",
                    "solarium": "Solarium", "padel1": "Pádel · Pista 1", "padel2": "Pádel · Pista 2",
                    "volley": "Arenero de vóley", "cancha": "Cancha de baloncesto y fútbol",
                    "restaurant": "Restaurante", "activity": "Actividad"}
        servicios = [(*r[:3], nombres_servicio.get(r[3], r[3]), *r[4:]) for r in servicios]

        def euros(v):
            if v is None:
                return ""
            return f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".").replace(",00", "") + " €"

        reservas = [(*r[:7], euros(r[7]), r[8]) for r in reservas]

        def stat(numero, etiqueta):
            return f'<div class="stat"><b>{numero}</b><small>{etiqueta}</small></div>'

    pagina = (
        '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
        '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Panel · La Palma Princess</title>'
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600'
        '&family=Hanken+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">'
        f'<style>{ADMIN_CSS}</style></head><body>'
        '<header><h1>La Palma <span>Princess</span> · Panel</h1>'
        '<input id="buscar" type="search" placeholder="Buscar nombre, email, referencia…" autocomplete="off">'
        '</header><main>'
        '<div class="stats">'
        + stat(len(usuarios), "Cuentas")
        + stat(len(reservas), "Reservas hab.")
        + stat(len(servicios), "Reservas servicios")
        + stat(len(suscriptores), "Suscriptores")
        + '</div>'
        + _tabla_html("Reservas de habitación", ["Ref.", "Nombre", "Email", "Habitación", "Hab.", "Entrada", "Salida", "Total", "Estado"], reservas, col_estado=8)
        + _tabla_html("Reservas de servicios", ["Ref.", "Nombre", "Email", "Servicio", "Fecha", "Hora", "Personas"], servicios)
        + _tabla_html("Cuentas", ["Nombre", "Email", "Alta (UTC)"], usuarios)
        + _tabla_html("Suscriptores", ["Email", "Alta (UTC)"], suscriptores)
        + f'</main><script>{ADMIN_JS}</script></body></html>'
    )
    return pagina, 200, {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
                         "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex"}

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
