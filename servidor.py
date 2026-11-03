import os
import re
import secrets
import sqlite3
import hashlib
import smtplib
import traceback
import time
from contextlib import contextmanager
from datetime import date, datetime
from email.message import EmailMessage
from pathlib import Path
from zoneinfo import ZoneInfo

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000"
).split(",") if origin.strip()]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}, r"/chat": {"origins": ALLOWED_ORIGINS}})

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
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "reservas.sqlite3"))
HOTEL_TIMEZONE = ZoneInfo("Atlantic/Canary")

ROOMS = {
    "Estándar": {"price": 150, "inventory": 20, "adults": 3, "children": 2, "guests": 4},
    "Familiar Superior": {"price": 185, "inventory": 12, "adults": 4, "children": 2, "guests": 6},
    "Ocean Suite": {"price": 250, "inventory": 8, "adults": 3, "children": 2, "guests": 5},
}
SERVICES = {"spa", "restaurant", "activity"}
SERVICE_CAPACITY = {"spa": 8, "restaurant": 24, "activity": 16}
SERVICE_TIMES = {"spa": ("09:00", "11:00", "13:00", "15:00", "17:00"),
                 "restaurant": ("13:00", "14:00", "19:00", "20:00", "21:00"),
                 "activity": ("09:00", "11:00", "15:00", "17:00")}


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
        """)


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


def send_email(recipient, subject, body):
    host = os.getenv("SMTP_HOST")
    if not host:
        return False
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.getenv("SMTP_FROM") or HOTEL_EMAIL
    message["To"] = recipient
    message.set_content(body)
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        with smtplib.SMTP_SSL(host, port, timeout=15) if os.getenv("SMTP_SSL") == "1" \
                else smtplib.SMTP(host, port, timeout=15) as smtp:
            if os.getenv("SMTP_SSL") != "1" and os.getenv("SMTP_STARTTLS", "1") == "1":
                smtp.starttls()
            username = os.getenv("SMTP_USERNAME")
            if username:
                smtp.login(username, os.getenv("SMTP_PASSWORD", ""))
            smtp.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError):
        app.logger.exception("No se pudo enviar el correo a %s", recipient)
        return False


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


def send_booking_email(email, name, reference, token, checkin, checkout, total):
    management_link = PUBLIC_BASE_URL + "/reservas.html?manage=" + token
    body = (
        f"Hola {name}:\n\nHemos registrado tu solicitud de reserva en {HOTEL_NAME}.\n"
        f"Referencia: {reference}\nEntrada: {checkin}\nSalida: {checkout}\n"
        f"Total orientativo: {total:.2f} EUR\n\n"
        f"Puedes consultar o cancelar la solicitud aquí:\n{management_link}\n\n"
        f"El precio es orientativo. Contacta con el hotel para confirmar las condiciones."
    )
    return send_email(email, f"Reserva {reference} - {HOTEL_NAME}", body)


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
            db.execute(
                """INSERT INTO bookings
                   (reference, token_hash, name, email, checkin, checkout, room, rooms, adults,
                    children, promo, resident, message, total)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (reference, hashlib.sha256(token.encode()).hexdigest(), name, email,
                 checkin.isoformat(), checkout.isoformat(), room, rooms, adults,
                 children, promo, int(resident), message, total),
            )
    except sqlite3.IntegrityError:
        return api_error("No se pudo registrar la solicitud. Inténtalo de nuevo.", 409)

    email_sent = send_booking_email(email, name, reference, token, checkin.isoformat(), checkout.isoformat(), total)
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
        f"Hola {booking['name']}:\n\nTu reserva {booking['reference']} ha sido cancelada."
    )
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
        f"Hola {booking['name']}:\n\nTu reserva se ha actualizado.\n"
        f"Entrada: {checkin.isoformat()}\nSalida: {checkout.isoformat()}\n"
        f"Habitación: {room}\nTotal orientativo: {total:.2f} EUR."
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
            db.execute(
                """INSERT INTO service_bookings
                   (reference, name, email, service, service_date, service_time, guests, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (reference, name, email, service, service_date.isoformat(), service_time, guests, notes),
            )
    except sqlite3.IntegrityError:
        return api_error("Ya existe una reserva de ese servicio para ese email y horario.", 409)
    email_sent = send_email(
        email, f"Reserva de servicio {reference} - {HOTEL_NAME}",
        f"Hola {name}:\n\nHemos registrado tu reserva de {service} para {service_date.isoformat()} "
        f"a las {service_time} ({guests} asistentes).\nReferencia: {reference}"
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
        f"Gracias por suscribirte a las novedades de {HOTEL_NAME}."
    )
    return jsonify({
        "message": "Suscripción confirmada." if email_sent else
                   "Suscripción guardada correctamente.",
        "email_sent": email_sent,
    }), 201

CONTEXTO_HOTEL = """
Eres el recepcionista virtual del hotel La Palma Princess (Hotel Princess La Palma).
Responde en el idioma del cliente, con tono amable y respuestas breves.

REGLAS ESTRICTAS:
- Responde SOLO con la información de este texto.
- Si el dato no aparece aquí (precios, horarios, políticas...), di claramente que no
  tienes ese dato y sugiere contactar con el hotel por teléfono, email o WhatsApp.
- Nunca inventes precios, horarios, servicios ni condiciones.
- No puedes hacer reservas: indica que usen la página de Reservas.
- Si preguntan algo que no tiene que ver con el hotel, di que solo puedes ayudar con temas del hotel.

INFORMACIÓN OFICIAL:
- Hotel de 4 estrellas en Fuencaliente, al sur de La Palma, sobre un acantilado con vistas al Atlántico.
  Habitaciones de estilo colonial en edificios de baja altura rodeados de jardines y palmeras.
- Dirección: Carretera de la Costa, Cerca Vieja, 10, 38749 Fuencaliente de La Palma.
- Teléfono: +34 922 42 55 11 (lunes a viernes, de 09:00 a 17:00).
- WhatsApp: 613 48 90 55.
- Email: hotelPrincessLaPalma@gmail.com.

ZONAS:
- Zona general (familiar): siete piscinas exteriores, con piscina infantil, playa de arena artificial y solárium.
- Esencia de La Palma: zona exclusiva para adultos (+16), con cuatro piscinas, una climatizada en invierno.

HABITACIONES (el precio no está publicado: se consulta al reservar):
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
"""


@app.route('/chat', methods=['POST'])
def chat():
    try:
        datos = request.get_json(silent=True)
        if not datos or "mensaje" not in datos:
            return jsonify({"respuesta": "No se ha recibido ningún mensaje."}), 400

        pregunta_usuario = str(datos.get("mensaje", "")).strip()
        idioma_detectado = str(datos.get("idioma", "es")).strip()

        if not pregunta_usuario:
            return jsonify({"respuesta": "No se ha recibido ningún mensaje."}), 400
        if not client:
            return jsonify({"respuesta": "El asistente virtual no está configurado ahora mismo."}), 503

        # Construimos la consulta incluyendo la instrucción de idioma
        consulta_con_idioma = f"[Responder obligatoriamente en el idioma con código ISO: '{idioma_detectado}']\nPregunta: {pregunta_usuario}"

        response = None
        for intento in range(3):
            try:
                response = client.models.generate_content(
                    model='gemini-1.5-flash', # Nombre estándar de Gemini
                    contents=consulta_con_idioma,
                    config=types.GenerateContentConfig(
                        system_instruction=CONTEXTO_HOTEL,
                        temperature=0.7,
                    ),
                )
                break
            except Exception as e_google:
                if "503" in str(e_google) and intento < 2:
                    time.sleep(1.5)
                    continue
                raise e_google

        return jsonify({"respuesta": response.text})

    except Exception:
        print("--- ERROR DETALLADO EN EL SERVIDOR ---")
        traceback.print_exc()
        return jsonify({"respuesta": "Lo siento, ha ocurrido un error de conexión con la IA. Vuelve a intentarlo en unos segundos."}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
