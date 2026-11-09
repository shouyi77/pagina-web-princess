(function () {
	'use strict';

	const translations = {
		'Inicio': ['Home', 'Startseite'],
		'Habitaciones': ['Rooms', 'Zimmer'],
		'Servicios': ['Services', 'Angebote'],
		'Galería': ['Gallery', 'Galerie'],
		'Reservas': ['Bookings', 'Reservierungen'],
		'Abrir menú': ['Open menu', 'Menü öffnen'],
		'Idioma': ['Language', 'Sprache'],
		'Usuario': ['Account', 'Konto'],
		'Menú': ['Menu', 'Menü'],
		'Entrada': ['Check-in', 'Anreise'],
		'Salida': ['Check-out', 'Abreise'],
		'Huéspedes': ['Guests', 'Gäste'],
		'Añadir habitación': ['Add room', 'Zimmer hinzufügen'],
		'Código promocional': ['Promo code', 'Aktionscode'],
		'Soy residente': ['I am a resident', 'Ich bin Einwohner/in'],
		'Reservar': ['Book', 'Buchen'],
		'Despierta frente al Atlántico': ['Wake up facing the Atlantic', 'Erwachen mit Blick auf den Atlantik'],
		'Resort de 4 estrellas en Fuencaliente, con piscinas, spa y zona solo para adultos, Esencia de La Palma.': ['A 4-star resort in Fuencaliente, with pools, a spa and Esencia de La Palma, an adults-only area.', 'Ein 4-Sterne-Resort in Fuencaliente mit Pools, Spa und dem Erwachsenenbereich Esencia de La Palma.'],
		'Reservar una habitación': ['Book a room', 'Zimmer buchen'],
		'Un resort volcánico en el sur de La Palma': ['A volcanic resort in southern La Palma', 'Ein Vulkanresort im Süden von La Palma'],
		'La Palma Princess es un hotel de 4 estrellas situado en Fuencaliente, sobre un acantilado con vistas al océano. Sus habitaciones, de estilo colonial, están repartidas en edificios de baja altura rodeados de jardines y palmeras.': ['La Palma Princess is a 4-star hotel in Fuencaliente, on a cliff overlooking the ocean. Its colonial-style rooms are spread across low-rise buildings surrounded by gardens and palm trees.', 'Das La Palma Princess ist ein 4-Sterne-Hotel in Fuencaliente auf einer Klippe mit Blick auf den Ozean. Die Zimmer im Kolonialstil verteilen sich auf niedrige Gebäude inmitten von Gärten und Palmen.'],
		'El complejo tiene una zona familiar y otra exclusiva para adultos, Esencia de La Palma. Puedes venir a descansar junto a la piscina, probar el spa o recorrer la isla desde el sur.': ['The resort has a family area and an adults-only area, Esencia de La Palma. Relax by the pool, enjoy the spa or explore the island from the south.', 'Das Resort bietet einen Familienbereich und den Erwachsenenbereich Esencia de La Palma. Entspannen Sie am Pool, genießen Sie das Spa oder erkunden Sie die Insel vom Süden aus.'],
		'Ver habitaciones': ['View rooms', 'Zimmer ansehen'],
		'Descubre el hotel': ['Discover the hotel', 'Entdecken Sie das Hotel'],
		'Elige por dónde quieres empezar.': ['Choose where to start.', 'Wählen Sie, womit Sie beginnen möchten.'],
		'Galería': ['Gallery', 'Galerie'],
		'Mira las piscinas, las habitaciones y el entorno del hotel.': ['Explore the pools, rooms and hotel surroundings.', 'Entdecken Sie Pools, Zimmer und die Umgebung des Hotels.'],
		'Lo que encontrarás': ['What you will find', 'Das erwartet Sie'],
		'Siete piscinas en la zona general, con piscina infantil y una playa de arena artificial.': ['Seven pools in the main area, including a children’s pool and an artificial-sand beach.', 'Sieben Pools im Hauptbereich, darunter ein Kinderpool und ein künstlicher Sandstrand.'],
		'Esencia de La Palma: zona solo adultos (+16) con cuatro piscinas, una climatizada en invierno.': ['Esencia de La Palma: adults-only area (16+) with four pools, one heated in winter.', 'Esencia de La Palma: Erwachsenenbereich ab 16 Jahren mit vier Pools, davon einer im Winter beheizt.'],
		'¿Preparas tu próxima escapada?': ['Planning your next getaway?', 'Planen Sie Ihren nächsten Urlaub?'],
		'¿Preparas tu escapada?': ['Planning your getaway?', 'Planen Sie Ihren Urlaub?'],
		'Reservar ahora': ['Book now', 'Jetzt buchen'],
		'¿Dónde estamos?': ['Where are we?', 'Wo finden Sie uns?'],
		'En Fuencaliente, al sur de La Palma, frente al Atlántico.': ['In Fuencaliente, in southern La Palma, facing the Atlantic.', 'In Fuencaliente im Süden von La Palma, mit Blick auf den Atlantik.'],
		'Recibe nuestras ofertas por email': ['Get our offers by email', 'Angebote per E-Mail erhalten'],
		'Suscribirme': ['Subscribe', 'Abonnieren'],
		'Contacto': ['Contact', 'Kontakt'],
		'Explora': ['Explore', 'Entdecken'],
		'Síguenos': ['Follow us', 'Folgen Sie uns'],
		'Política de privacidad': ['Privacy policy', 'Datenschutzerklärung'],
		'Aviso legal': ['Legal notice', 'Impressum'],
		'Cookies': ['Cookies', 'Cookies'],
		'Hotel de 4 estrellas en Fuencaliente, con siete piscinas, spa y una zona solo adultos.': ['A 4-star hotel in Fuencaliente, with seven pools, a spa and an adults-only area.', 'Ein 4-Sterne-Hotel in Fuencaliente mit sieben Pools, Spa und einem Erwachsenenbereich.'],
		'Haz clic en cualquier imagen del catálogo para ampliarla y explorar los detalles.': ['Select any image to enlarge it and explore the details.', 'Wählen Sie ein Bild aus, um es zu vergrößern und Details zu entdecken.'],
		'Todo en un mismo lugar': ['Everything in one place', 'Alles an einem Ort'],
		'Reserva tu estancia': ['Book your stay', 'Aufenthalt buchen'],
		'Consulta disponibilidad, registra tu estancia y recibe una confirmación con los datos de gestión.': ['Check availability, submit your stay and receive a confirmation with management details.', 'Prüfen Sie die Verfügbarkeit, buchen Sie Ihren Aufenthalt und erhalten Sie eine Bestätigung mit Verwaltungsdaten.'],
		'Nombre': ['Name', 'Name'],
		'Email': ['Email', 'E-Mail'],
		'Tipo de habitación': ['Room type', 'Zimmertyp'],
		'Habitaciones': ['Rooms', 'Zimmer'],
		'Adultos': ['Adults', 'Erwachsene'],
		'Niños': ['Children', 'Kinder'],
		'Comentarios': ['Comments', 'Anmerkungen'],
		'Enviar solicitud': ['Submit request', 'Anfrage senden'],
		'Tu estancia': ['Your stay', 'Ihr Aufenthalt'],
		'Elige las fechas de entrada y salida para ver el precio.': ['Choose your check-in and check-out dates to see the price.', 'Wählen Sie An- und Abreisedatum, um den Preis zu sehen.'],
		'Entrada': ['Check-in', 'Anreise'],
		'Salida': ['Check-out', 'Abreise'],
		'Noches': ['Nights', 'Nächte'],
		'Habitación': ['Room', 'Zimmer'],
		'Huéspedes': ['Guests', 'Gäste'],
		'Total': ['Total', 'Gesamt'],
		'Precio de demostración, sin valor contractual. Consulta disponibilidad real con el hotel.': ['Demonstration price, not binding. Contact the hotel to confirm availability.', 'Demo-Preis, unverbindlich. Bitte bestätigen Sie die Verfügbarkeit beim Hotel.'],
		'Gestionar una reserva': ['Manage a booking', 'Buchung verwalten'],
		'Usa el enlace seguro recibido en tu correo o pega aquí tu código de gestión.': ['Use the secure link in your email or paste your management code here.', 'Verwenden Sie den sicheren Link aus Ihrer E-Mail oder fügen Sie hier Ihren Verwaltungscode ein.'],
		'Código de gestión': ['Management code', 'Verwaltungscode'],
		'Consultar reserva': ['Look up booking', 'Buchung abrufen'],
		'Guardar cambios': ['Save changes', 'Änderungen speichern'],
		'Cancelar reserva': ['Cancel booking', 'Buchung stornieren'],
		'Reserva una actividad': ['Book an experience', 'Erlebnis buchen'],
		'Solicita plaza para el spa, el gimnasio, el pilates, el solarium o las pistas deportivas. Las tarifas se confirman al llegar al hotel.': ['Request a place at the spa, gym, pilates, solarium or sports courts. Prices are confirmed at the hotel.', 'Reservieren Sie einen Platz im Spa, Fitnessstudio, Pilates, Solarium oder auf den Sportplätzen. Preise werden im Hotel bestätigt.'],
		'Bienestar': ['Wellness', 'Wellness'],
		'Actividades y deportes': ['Activities and sports', 'Aktivitäten und Sport'],
		'Gimnasio (máquinas)': ['Gym (machines)', 'Fitnessstudio (Geräte)'],
		'Pilates': ['Pilates', 'Pilates'],
		'Solarium': ['Solarium', 'Solarium'],
		'Pádel · Pista 1': ['Padel · Court 1', 'Padel · Platz 1'],
		'Pádel · Pista 2': ['Padel · Court 2', 'Padel · Platz 2'],
		'Arenero de vóley': ['Beach volleyball court', 'Beachvolleyballfeld'],
		'Cancha de baloncesto y fútbol': ['Basketball and football court', 'Basketball- und Fußballplatz'],
		'Servicio': ['Service', 'Angebot'],
		'Fecha': ['Date', 'Datum'],
		'Hora disponible': ['Available time', 'Verfügbare Uhrzeit'],
		'Asistentes': ['Guests', 'Teilnehmende'],
		'Comentarios (opcional)': ['Comments (optional)', 'Anmerkungen (optional)'],
		'Solicitar plaza': ['Request a place', 'Platz anfragen'],
		'Elige una fecha primero': ['Choose a date first', 'Wählen Sie zuerst ein Datum'],
		'El número de huéspedes supera la capacidad del tipo de habitación.': ['The number of guests exceeds this room type’s capacity.', 'Die Gästezahl überschreitet die Kapazität dieses Zimmertyps.'],
		'Revisa el tipo de habitación y el número de huéspedes.': ['Check the room type and number of guests.', 'Bitte überprüfen Sie Zimmertyp und Gästezahl.'],
		'Revisa las fechas, el tipo de habitación y el número de habitaciones.': ['Check the dates, room type and number of rooms.', 'Bitte überprüfen Sie Datum, Zimmertyp und Zimmeranzahl.'],
		'El tipo de habitación elegido no admite a todos los huéspedes.': ['The selected room type cannot accommodate all guests.', 'Der gewählte Zimmertyp bietet nicht für alle Gäste Platz.'],
		'Indica fechas válidas y una salida posterior a la entrada.': ['Enter valid dates and a check-out after check-in.', 'Geben Sie gültige Daten ein. Die Abreise muss nach der Anreise liegen.'],
		'El código promocional debe tener seis dígitos.': ['The promo code must contain six digits.', 'Der Aktionscode muss aus sechs Ziffern bestehen.'],
		'No hay disponibilidad para esas fechas.': ['No availability for these dates.', 'Für diese Daten ist nichts verfügbar.'],
		'No hay disponibilidad suficiente para esos cambios.': ['There is not enough availability for these changes.', 'Für diese Änderungen ist nicht genügend verfügbar.'],
		'No se encontró una reserva activa para modificar.': ['No active booking was found to update.', 'Es wurde keine aktive Buchung zum Ändern gefunden.'],
		'Elige una hora disponible y un número válido de asistentes.': ['Choose an available time and a valid number of guests.', 'Wählen Sie eine verfügbare Uhrzeit und eine gültige Gästezahl.'],
		'La hora elegida ya ha pasado.': ['The selected time has already passed.', 'Die gewählte Uhrzeit ist bereits vorbei.'],
		'Ya existe una reserva de ese servicio para ese email y horario.': ['A booking for this service, email and time already exists.', 'Für diesen Service, diese E-Mail und diese Uhrzeit besteht bereits eine Buchung.'],
		'Necesitas aceptar las comunicaciones comerciales para suscribirte.': ['You need to agree to marketing emails to subscribe.', 'Sie müssen dem Erhalt von Werbe-E-Mails zustimmen, um sich anzumelden.'],
		'Escribe un email válido.': ['Enter a valid email address.', 'Geben Sie eine gültige E-Mail-Adresse ein.'],
		'Ese email ya está suscrito.': ['This email is already subscribed.', 'Diese E-Mail-Adresse ist bereits angemeldet.'],
		'Reserva actualizada.': ['Booking updated.', 'Buchung aktualisiert.'],
		'Reserva cancelada.': ['Booking cancelled.', 'Buchung storniert.'],
		'Reserva': ['Booking', 'Buchung'],
		'Referencia': ['Reference', 'Referenz'],
		'disponibles': ['available', 'verfügbar'],
		'Disponible para estas fechas': ['Available for these dates', 'Für diese Daten verfügbar'],
		'habitaciones libres': ['rooms available', 'Zimmer verfügbar'],
		'Precio orientativo de demostración.': ['Demonstration price estimate.', 'Unverbindlicher Demo-Preis.'],
		'Total orientativo: ': ['Estimated total: ', 'Unverbindliche Gesamtsumme: '],
		'confirmed': ['confirmed', 'bestätigt'],
		'cancelled': ['cancelled', 'storniert'],
		'Selecciona una hora': ['Select a time', 'Uhrzeit auswählen'],
		'Aqua Princess Spa': ['Aqua Princess Spa', 'Aqua Princess Spa'],
		'Restaurante': ['Restaurant', 'Restaurant'],
		'Actividad': ['Activity', 'Aktivität'],
		'Explora La Palma': ['Explore La Palma', 'La Palma entdecken'],
		'Ideas para descubrir la isla. Comprueba condiciones, accesos y avisos antes de salir.': ['Ideas for discovering the island. Check conditions, access and alerts before setting out.', 'Ideen, um die Insel zu entdecken. Prüfen Sie vor dem Aufbruch Bedingungen, Zugang und Hinweise.'],
		'Todas': ['All', 'Alle'],
		'Naturaleza': ['Nature', 'Natur'],
		'Volcanes': ['Volcanoes', 'Vulkane'],
		'Cultura y costa': ['Culture and coast', 'Kultur und Küste'],
		'Duración': ['Duration', 'Dauer'],
		'Cualquiera': ['Any', 'Beliebig'],
		'Hasta 2 horas': ['Up to 2 hours', 'Bis zu 2 Stunden'],
		'2-4 horas': ['2-4 hours', '2-4 Stunden'],
		'Más de 4 horas': ['Over 4 hours', 'Mehr als 4 Stunden'],
		'Dificultad': ['Difficulty', 'Schwierigkeit'],
		'Baja': ['Easy', 'Leicht'],
		'Media': ['Moderate', 'Mittel'],
		'Alta': ['Hard', 'Schwer'],
		'Ruta de los Volcanes': ['Volcano Route', 'Vulkanroute'],
		'Los Tilos': ['Los Tilos', 'Los Tilos'],
		'Roque de los Muchachos': ['Roque de los Muchachos', 'Roque de los Muchachos'],
		'Volcán de San Antonio': ['San Antonio Volcano', 'Vulkan San Antonio'],
		'Salinas de Fuencaliente': ['Fuencaliente Salt Pans', 'Salinen von Fuencaliente'],
		'Santa Cruz de La Palma': ['Santa Cruz de La Palma', 'Santa Cruz de La Palma'],
		'Ver ubicación ↗': ['View location ↗', 'Standort ansehen ↗'],
		'Tiempo y dificultad orientativos. No son actividades organizadas ni guiadas por el hotel.': ['Duration and difficulty are estimates. These activities are not organized or guided by the hotel.', 'Dauer und Schwierigkeit sind Richtwerte. Diese Aktivitäten werden nicht vom Hotel organisiert oder geführt.'],
		'De un vistazo': ['At a glance', 'Auf einen Blick'],
		'Llegada fácil': ['Easy arrival', 'Bequeme Anreise'],
		'Agua por todas partes': ['Water everywhere', 'Wasser überall'],
		'Siempre en forma': ['Stay active', 'Aktiv bleiben'],
		'Para toda la familia': ['For the whole family', 'Für die ganze Familie'],
		'7 piscinas': ['7 pools', '7 Pools'],
		'Parking gratuito': ['Free parking', 'Kostenloser Parkplatz'],
		'Gimnasio': ['Gym', 'Fitnessstudio'],
		'Actividades y deportes': ['Activities and sports', 'Aktivitäten und Sport'],
		'Servicio para niños': ['Children’s services', 'Angebote für Kinder'],
		'Terrazas': ['Terraces', 'Terrassen'],
		'Despierta frente al Atlántico': ['Wake up facing the Atlantic', 'Erwachen mit Blick auf den Atlantik'],
		'Cerrar': ['Close', 'Schließen'],
		'Regístrate para guardar tus datos en tus próximas reservas.': ['Sign up to save your details for future bookings.', 'Registrieren Sie sich, um Ihre Daten für zukünftige Buchungen zu speichern.'],
		'Crea tu cuenta': ['Create your account', 'Konto erstellen'],
		'Contraseña': ['Password', 'Passwort'],
		'Repetir contraseña': ['Repeat password', 'Passwort wiederholen'],
		'Acepto las condiciones de uso': ['I accept the terms of use', 'Ich akzeptiere die Nutzungsbedingungen'],
		'Registrarme': ['Sign up', 'Registrieren'],
		'Sesión iniciada': ['Signed in', 'Angemeldet'],
		'Cerrar sesión': ['Sign out', 'Abmelden'],
		'Aceptar todas': ['Accept all', 'Alle akzeptieren'],
		'Rechazar todas': ['Reject all', 'Alle ablehnen'],
		'Configurar': ['Settings', 'Einstellungen'],
		'Necesarias': ['Necessary', 'Notwendig'],
		'Analíticas': ['Analytics', 'Analyse'],
		'Marketing': ['Marketing', 'Marketing'],
		'Ver habitaciones': ['View rooms', 'Zimmer ansehen'],
		'El tiempo en Fuencaliente en directo': ['Live weather in Fuencaliente', 'Aktuelles Wetter in Fuencaliente'],
		'Elige entre tres tipos de habitación en La Palma Princess, en Fuencaliente.': ['Choose from three room types at La Palma Princess in Fuencaliente.', 'Wählen Sie zwischen drei Zimmertypen im La Palma Princess in Fuencaliente.'],
		'22 m² de estilo colonial, con cama king size o dos individuales, sofá, baño con bañera y ducha, aire acondicionado y terraza o balcón. Admite hasta 3 adultos o 2 adultos y 2 niños.': ['22 m² in colonial style, with a king-size or twin beds, sofa, bathroom with bath and shower, air conditioning and a terrace or balcony. Sleeps up to 3 adults or 2 adults and 2 children.', '22 m² im Kolonialstil mit Kingsize-Bett oder zwei Einzelbetten, Sofa, Bad mit Badewanne und Dusche, Klimaanlage sowie Terrasse oder Balkon. Für bis zu 3 Erwachsene oder 2 Erwachsene und 2 Kinder.'],
		'44 m² formados por dos habitaciones Estándar comunicadas, con dos baños y vistas al jardín. Admite hasta 4 adultos y 2 niños.': ['44 m² comprising two connecting Standard rooms, with two bathrooms and garden views. Sleeps up to 4 adults and 2 children.', '44 m² mit zwei verbundenen Standardzimmern, zwei Bädern und Gartenblick. Für bis zu 4 Erwachsene und 2 Kinder.'],
		'44 m² con salón y dormitorio independientes, dos baños y dos terrazas o balcones. Admite hasta 3 adultos y 2 niños.': ['44 m² with a separate living room and bedroom, two bathrooms, and two terraces or balconies. Sleeps up to 3 adults and 2 children.', '44 m² mit getrenntem Wohnzimmer und Schlafzimmer, zwei Bädern sowie zwei Terrassen oder Balkonen. Für bis zu 3 Erwachsene und 2 Kinder.'],
		'Consulta el precio al reservar': ['Check the price when booking', 'Preis bei der Buchung erfragen'],
		'Un pequeño vistazo a nuestras instalaciones.': ['A glimpse of our facilities.', 'Ein kleiner Einblick in unsere Einrichtungen.'],
		'Un vistazo a tu próxima escapada': ['A preview of your next getaway', 'Ein Vorgeschmack auf Ihren nächsten Urlaub'],
		'Hemos seleccionado cuidadosamente los rincones más icónicos de nuestro resort en Fuencaliente para que comiences a vivir tus vacaciones antes de llegar.': ['We have carefully selected iconic corners of our Fuencaliente resort so you can start enjoying your holiday before you arrive.', 'Wir haben besondere Orte unseres Resorts in Fuencaliente ausgewählt, damit Ihr Urlaub schon vor der Anreise beginnt.'],
		'Experiencia Princess': ['Princess experience', 'Princess-Erlebnis'],
		'7 Piscinas': ['7 pools', '7 Pools'],
		'Agua dulce y vistas al océano': ['Fresh water and ocean views', 'Süßwasser und Meerblick'],
		'Spa & Wellness': ['Spa & wellness', 'Spa & Wellness'],
		'Circuito térmico y masajes': ['Thermal circuit and massages', 'Thermalbereich und Massagen'],
		'Suites & Confort': ['Suites & comfort', 'Suiten & Komfort'],
		'Espacios de diseño canario': ['Canarian-style spaces', 'Räume im kanarischen Stil'],
		'Atardeceres Únicos': ['Unique sunsets', 'Einzigartige Sonnenuntergänge'],
		'En plena naturaleza volcánica': ['Surrounded by volcanic nature', 'Inmitten vulkanischer Natur'],
		'Todo lo que necesitas para que tu estancia sea cómoda, activa o simplemente tranquila.': ['Everything you need for a comfortable, active or relaxing stay.', 'Alles für einen komfortablen, aktiven oder entspannten Aufenthalt.'],
		'Comodidades & Ocio': ['Comfort & leisure', 'Komfort & Freizeit'],
		'En La Palma Princess hemos pensado en cada detalle. Desde que llegas y aparcas sin coste hasta que te tumbas junto a una de nuestras siete piscinas, el hotel está diseñado para que disfrutes de la isla a tu ritmo.': ['At La Palma Princess, we have thought of every detail. From free parking on arrival to relaxing by one of our seven pools, the hotel is designed for you to enjoy the island at your own pace.', 'Im La Palma Princess ist an jedes Detail gedacht. Vom kostenlosen Parkplatz bis zur Entspannung an einem der sieben Pools: Genießen Sie die Insel in Ihrem eigenen Tempo.'],
		'Haz clic en cualquier servicio para consultar sus detalles o reservas.': ['Select a service to see details or make a booking.', 'Wählen Sie ein Angebot, um Details oder Buchungsmöglichkeiten zu sehen.'],
		'Actividades & Deporte ↗': ['Activities & sports ↗', 'Aktivitäten & Sport ↗'],
		'Animación, gym y deportes al aire libre': ['Entertainment, gym and outdoor sports', 'Unterhaltung, Fitnessstudio und Sport im Freien'],
		'Servicios Niños ↗': ['Children’s services ↗', 'Angebote für Kinder ↗'],
		'Miniclub y piscinas infantiles': ['Kids’ club and children’s pools', 'Kinderclub und Kinderpools'],
		'Aqua Princess Spa ↗': ['Aqua Princess Spa ↗', 'Aqua Princess Spa ↗'],
		'Circuito térmico y masajes': ['Thermal circuit and massages', 'Thermalbereich und Massagen'],
		'Parking & Confort ↗': ['Parking & comfort ↗', 'Parken & Komfort ↗'],
		'Aparcamiento gratuito e instalaciones': ['Free parking and facilities', 'Kostenloser Parkplatz und Einrichtungen'],
		'Todo lo que necesitas para que tu estancia sea cómoda, activa o simplemente tranquila.': ['Everything you need for a comfortable, active or relaxing stay.', 'Alles für einen komfortablen, aktiven oder entspannten Aufenthalt.'],
		'Un espacio pensado para desconectar. En el Aqua Princess Spa puedes disfrutar de un circuito de aguas y de tratamientos y masajes para recuperar energía.': ['A space designed to help you unwind. Enjoy a water circuit, treatments and massages at Aqua Princess Spa.', 'Ein Ort zum Abschalten. Genießen Sie im Aqua Princess Spa einen Wasserkreislauf, Anwendungen und Massagen.'],
		'Siete piscinas al aire libre para todos los gustos: zonas para nadar, para relajarse al sol y espacios pensados para las familias, con piscina infantil y una playa de arena artificial.': ['Seven outdoor pools for every mood, from swimming and sunbathing to family areas with a children’s pool and an artificial-sand beach.', 'Sieben Außenpools für jeden Geschmack: zum Schwimmen, Entspannen und für Familien mit Kinderpool und künstlichem Sandstrand.'],
		'Desayuna, toma algo o simplemente contempla el Atlántico desde nuestras terrazas. Un rincón tranquilo para cualquier momento del día, rodeado de jardines y palmeras.': ['Enjoy breakfast, a drink or the Atlantic views from our terraces, a quiet spot surrounded by gardens and palm trees.', 'Genießen Sie Frühstück, ein Getränk oder den Atlantikblick auf unseren Terrassen, umgeben von Gärten und Palmen.'],
		'Si prefieres no parar, el hotel organiza actividades y deportes para todas las edades. Una forma divertida de conocer a otros viajeros y pasar el día activo.': ['If you like to keep moving, the hotel organizes activities and sports for all ages, a fun way to meet fellow travellers and stay active.', 'Wenn Sie aktiv bleiben möchten, organisiert das Hotel Aktivitäten und Sport für jedes Alter - eine gute Gelegenheit, andere Reisende kennenzulernen.'],
		'Los más pequeños también tienen su sitio. Contamos con servicios y espacios pensados para ellos, para que los padres descansen y los niños se lo pasen en grande.': ['Little ones have their own space too. Our family-friendly services let children have fun while parents relax.', 'Auch die Kleinen haben ihren Platz. Familienangebote sorgen dafür, dass Kinder Spaß haben und Eltern entspannen können.'],
		'Sin coste adicional durante toda la estancia': ['No extra cost during your stay', 'Während des gesamten Aufenthalts kostenlos'],
		'Cerca de la entrada del hotel': ['Close to the hotel entrance', 'In der Nähe des Hoteleingangs'],
		'Perfecto para excursiones por la isla': ['Ideal for island trips', 'Ideal für Ausflüge auf der Insel'],
		'Equipamiento de cardio y musculación': ['Cardio and strength equipment', 'Cardio- und Kraftgeräte'],
		'Acceso para los huéspedes del hotel': ['Access for hotel guests', 'Zugang für Hotelgäste'],
		'Recomendable reservar con antelación': ['Advance booking recommended', 'Eine Reservierung im Voraus wird empfohlen'],
		'Piscina infantil': ['Children’s pool', 'Kinderpool'],
		'Playa de arena artificial': ['Artificial-sand beach', 'Künstlicher Sandstrand'],
		'Solárium para tomar el sol': ['Sun terrace', 'Sonnenterrasse'],
		'Vistas al océano Atlántico': ['Atlantic Ocean views', 'Blick auf den Atlantik'],
		'Rodeadas de jardines': ['Surrounded by gardens', 'Von Gärten umgeben'],
		'Perfectas para el desayuno y el atardecer': ['Perfect for breakfast and sunset', 'Ideal zum Frühstück und für den Sonnenuntergang'],
		'Actividades para toda la familia': ['Activities for the whole family', 'Aktivitäten für die ganze Familie'],
		'Deportes al aire libre': ['Outdoor sports', 'Sport im Freien'],
		'Opciones para todas las edades': ['Options for all ages', 'Angebote für jedes Alter'],
		'Espacios y actividades infantiles': ['Children’s spaces and activities', 'Bereiche und Aktivitäten für Kinder'],
		'Pensado para que toda la familia disfrute': ['Designed for the whole family to enjoy', 'Damit die ganze Familie Freude hat'],
		'Lo esencial de tu estancia, en pocas palabras.': ['The essentials of your stay, at a glance.', 'Das Wichtigste für Ihren Aufenthalt auf einen Blick.'],
		'Parking gratuito para los huéspedes.': ['Free parking for guests.', 'Kostenloser Parkplatz für Gäste.'],
		'Siete piscinas exteriores y el Aqua Princess Spa.': ['Seven outdoor pools and Aqua Princess Spa.', 'Sieben Außenpools und das Aqua Princess Spa.'],
		'Gimnasio, actividades y deportes.': ['Gym, activities and sports.', 'Fitnessstudio, Aktivitäten und Sport.'],
		'Servicio para niños y terrazas para descansar.': ['Children’s services and terraces to unwind.', 'Angebote für Kinder und Terrassen zum Entspannen.'],
		'Elige tus fechas y reserva tu habitación. Te respondemos en menos de 24 horas.': ['Choose your dates and book your room. We will reply within 24 hours.', 'Wählen Sie Ihre Daten und buchen Sie Ihr Zimmer. Wir antworten innerhalb von 24 Stunden.'],
		'¿Te apetece probarlo?': ['Would you like to try it?', 'Möchten Sie es ausprobieren?'],
		'Disponible para estas fechas': ['Available for these dates', 'Für diese Daten verfügbar'],
		'No hay disponibilidad suficiente para esas fechas.': ['Not enough availability for these dates.', 'Für diese Daten ist nicht genügend verfügbar.'],
		'Comprobando disponibilidad…': ['Checking availability…', 'Verfügbarkeit wird geprüft…'],
		'Reserva actualizada.': ['Booking updated.', 'Buchung aktualisiert.'],
		'Reserva cancelada.': ['Booking cancelled.', 'Buchung storniert.'],
		'Solicitud registrada.': ['Request registered.', 'Anfrage gespeichert.'],
		'Reserva registrada.': ['Booking registered.', 'Buchung gespeichert.'],
		'La Palma Princess - Hotel 4 estrellas en Fuencaliente, La Palma': ['La Palma Princess - 4-star hotel in Fuencaliente, La Palma', 'La Palma Princess - 4-Sterne-Hotel in Fuencaliente, La Palma'],
		'La Palma Princess - Habitaciones': ['La Palma Princess - Rooms', 'La Palma Princess - Zimmer'],
		'La Palma Princess - Servicios': ['La Palma Princess - Services', 'La Palma Princess - Angebote'],
		'La Palma Princess - Galería': ['La Palma Princess - Gallery', 'La Palma Princess - Galerie'],
		'La Palma Princess - Reservas': ['La Palma Princess - Bookings', 'La Palma Princess - Reservierungen'],
		'Hoteles con bufé, bar piscina, piano bar y un restaurante con menú de degustación.': ['Buffet restaurants, a pool bar, piano bar and a tasting-menu restaurant.', 'Buffetrestaurants, Poolbar, Pianobar und ein Restaurant mit Degustationsmenü.'],
		'Restaurantes con bufé, bar piscina, piano bar y un restaurante con menú de degustación.': ['Buffet restaurants, a pool bar, piano bar and a tasting-menu restaurant.', 'Buffetrestaurants, Poolbar, Pianobar und ein Restaurant mit Degustationsmenü.'],
		'Spa Aqua Princess, gimnasio y actividades para toda la familia.': ['Aqua Princess Spa, a gym and activities for the whole family.', 'Aqua Princess Spa, Fitnessstudio und Aktivitäten für die ganze Familie.'],
		'Habitaciones en la zona familiar y en Esencia de La Palma, solo adultos.': ['Rooms in the family area and the adults-only Esencia de La Palma.', 'Zimmer im Familienbereich und im Erwachsenenbereich Esencia de La Palma.'],
		'Siete piscinas, Spa Aqua Princess, gimnasio y varios restaurantes.': ['Seven pools, Aqua Princess Spa, a gym and several restaurants.', 'Sieben Pools, Aqua Princess Spa, Fitnessstudio und mehrere Restaurants.'],
		'Mira las piscinas, las habitaciones y el entorno del hotel.': ['Explore the pools, rooms and hotel surroundings.', 'Entdecken Sie Pools, Zimmer und die Umgebung des Hotels.'],
		'Restaurantes con bufé, bar piscina, piano bar y un restaurante con menú de degustación.': ['Buffet restaurants, a pool bar, piano bar and a tasting-menu restaurant.', 'Buffetrestaurants, Poolbar, Pianobar und ein Restaurant mit Degustationsmenü.'],
		'Dinos las fechas o llámanos al +34 922 42 55 11, de lunes a viernes de 09:00 a 17:00.': ['Send us your dates or call +34 922 42 55 11, Monday to Friday, 09:00-17:00.', 'Senden Sie uns Ihre Reisedaten oder rufen Sie uns unter +34 922 42 55 11 an, Montag bis Freitag, 09:00-17:00 Uhr.'],
		'Volcanes · 2-3 h · Media': ['Volcanoes · 2-3 h · Moderate', 'Vulkane · 2-3 Std. · Mittel'],
		'Naturaleza · 2-4 h · Media': ['Nature · 2-4 h · Moderate', 'Natur · 2-4 Std. · Mittel'],
		'Naturaleza · 3-5 h · Alta': ['Nature · 3-5 h · Hard', 'Natur · 3-5 Std. · Schwer'],
		'Volcanes · 1-2 h · Baja': ['Volcanoes · 1-2 h · Easy', 'Vulkane · 1-2 Std. · Leicht'],
		'Cultura y costa · 1-3 h · Baja': ['Culture and coast · 1-3 h · Easy', 'Kultur und Küste · 1-3 Std. · Leicht'],
		'Cultura y costa · 2-4 h · Baja': ['Culture and coast · 2-4 h · Easy', 'Kultur und Küste · 2-4 Std. · Leicht'],
		'Un recorrido por paisajes volcánicos del sur de la isla. Elige el tramo según tu experiencia y consulta avisos de senderos.': ['Explore volcanic landscapes in the south of the island. Choose a section to suit your experience and check trail alerts.', 'Entdecken Sie Vulkanlandschaften im Süden der Insel. Wählen Sie eine passende Strecke und prüfen Sie Wegsperrungen.'],
		'Senderos entre laurisilva y barrancos verdes en el noreste de La Palma. La duración varía según la ruta elegida.': ['Trails through laurel forest and green ravines in northeast La Palma. Duration depends on the route you choose.', 'Wanderwege durch Lorbeerwald und grüne Schluchten im Nordosten von La Palma. Die Dauer hängt von der gewählten Route ab.'],
		'Miradores de altura y vistas sobre la isla. Consulta el estado de la carretera y las condiciones meteorológicas.': ['High-altitude viewpoints and island views. Check road conditions and the weather before you go.', 'Aussichtspunkte in großer Höhe mit Blick über die Insel. Prüfen Sie Straßen- und Wetterbedingungen.'],
		'Centro de visitantes y sendero junto al cráter, cerca de Fuencaliente. Revisa horarios y accesibilidad antes de la visita.': ['Visitor centre and trail beside the crater near Fuencaliente. Check opening times and accessibility before your visit.', 'Besucherzentrum und Weg am Krater bei Fuencaliente. Prüfen Sie Öffnungszeiten und Zugänglichkeit vor Ihrem Besuch.'],
		'Un paseo por el paisaje costero del sur, con salinas y vistas al faro. Ideal para combinar con una parada en el entorno.': ['A walk along the southern coastline, with salt pans and lighthouse views. Combine it with a stop in the area.', 'Ein Spaziergang an der Südküste mit Salinen und Blick auf den Leuchtturm. Lässt sich gut mit einem Aufenthalt in der Umgebung verbinden.'],
		'Casco histórico, arquitectura tradicional y paseo marítimo en la capital de la isla.': ['Historic centre, traditional architecture and a seafront promenade in the island’s capital.', 'Historische Altstadt, traditionelle Architektur und Promenade in der Inselhauptstadt.'],
		'Un paseo por el paisaje costero del sur, con salinas y vistas al faro. Ideal para combinar con una parada en el entorno.': ['A walk along the southern coastline, with salt pans and lighthouse views. Combine it with a stop in the area.', 'Ein Spaziergang an der Südküste mit Salinen und Blick auf den Leuchtturm. Lässt sich gut mit einem Aufenthalt in der Umgebung verbinden.'],
		'Fuencaliente ahora ↗': ['Fuencaliente now ↗', 'Fuencaliente jetzt ↗'],
		'Cargando el tiempo…': ['Loading weather…', 'Wetter wird geladen…'],
		'Carretera de la Costa, Cerca Vieja, 10': ['Carretera de la Costa, Cerca Vieja, 10', 'Carretera de la Costa, Cerca Vieja, 10'],
		'38749 Fuencaliente de La Palma': ['38749 Fuencaliente de La Palma', '38749 Fuencaliente de La Palma'],
		'WhatsApp: 613 48 90 55': ['WhatsApp: +34 613 48 90 55', 'WhatsApp: +34 613 48 90 55'],
		'Usamos cookies para que la web funcione y para analizar cómo se usa. Puedes aceptarlas, rechazarlas o elegir cuáles activar.': ['We use essential cookies to run this website and optional cookies to understand how it is used. Accept, reject or choose which optional cookies to enable.', 'Wir verwenden notwendige Cookies für den Betrieb der Website und optionale Cookies zur Analyse. Sie können optionale Cookies annehmen, ablehnen oder auswählen.'],
		'Familiar Superior': ['Family Superior', 'Familienzimmer Superior'],
		'Estándar': ['Standard', 'Standard'],
		'Ocean Suite': ['Ocean Suite', 'Ocean Suite'],
		'Hotel de 4 estrellas en Fuencaliente, con siete piscinas, spa y una zona solo adultos.': ['A 4-star hotel in Fuencaliente, with seven pools, a spa and an adults-only area.', 'Ein 4-Sterne-Hotel in Fuencaliente mit sieben Pools, Spa und einem Erwachsenenbereich.'],
		'Acepto recibir comunicaciones comerciales por email.': ['I agree to receive marketing emails.', 'Ich möchte Werbe-E-Mails erhalten.'],
		'La solicitud se ha registrado correctamente.': ['Your request has been registered.', 'Ihre Anfrage wurde gespeichert.'],
		'Solicitud registrada y confirmación enviada.': ['Request registered and confirmation sent.', 'Anfrage gespeichert und Bestätigung gesendet.'],
		'Solicitud registrada. La confirmación por correo está pendiente de configurar.': ['Request registered. Email confirmation is pending email setup.', 'Anfrage gespeichert. Die E-Mail-Bestätigung kann nach Einrichtung versendet werden.'],
		'Cita registrada y confirmación enviada.': ['Appointment registered and confirmation sent.', 'Termin gespeichert und Bestätigung gesendet.'],
		'Cita registrada. La confirmación por correo está pendiente de configurar.': ['Appointment registered. Email confirmation is pending email setup.', 'Termin gespeichert. Die E-Mail-Bestätigung kann nach Einrichtung versendet werden.'],
		'Suscripción confirmada.': ['Subscription confirmed.', 'Abonnement bestätigt.'],
		'Suscripción guardada correctamente.': ['Subscription saved successfully.', 'Abonnement erfolgreich gespeichert.'],
		'El asistente virtual no está configurado ahora mismo.': ['The virtual assistant is not configured right now.', 'Der virtuelle Assistent ist derzeit nicht konfiguriert.'],
		'Escribe un email válido y acepta recibir comunicaciones.': ['Enter a valid email and agree to receive communications.', 'Geben Sie eine gültige E-Mail-Adresse ein und stimmen Sie dem Erhalt von Mitteilungen zu.'],
		'No hay disponibilidad para esas fechas.': ['No availability for these dates.', 'Für diese Daten ist nichts verfügbar.'],
		'Ya no quedan plazas suficientes en esa hora.': ['There are not enough places left at that time.', 'Zu dieser Uhrzeit sind nicht mehr genügend Plätze frei.'],
		'Elige una hora disponible': ['Choose an available time', 'Wählen Sie eine verfügbare Uhrzeit'],
		'Sin plazas disponibles': ['No places available', 'Keine Plätze verfügbar'],
		'No se pudieron cargar las horas': ['Times could not be loaded', 'Uhrzeiten konnten nicht geladen werden'],
		'Cerrar menú': ['Close menu', 'Menü schließen'],
		'Asistente': ['Assistant', 'Assistent'],
		'adulto': ['adult', 'Erwachsener'],
		'adultos': ['adults', 'Erwachsene'],
		'niño': ['child', 'Kind'],
		'niños': ['children', 'Kinder'],
		'hab.': ['rooms', 'Zimmer'],
		'noche': ['night', 'Nacht'],
		'noches': ['nights', 'Nächte'],
		'adulto extra': ['extra adult', 'zusätzlicher Erwachsener'],
		'adultos extra': ['extra adults', 'zusätzliche Erwachsene'],
		'Residente (-10 %)': ['Resident discount (-10%)', 'Einwohner-Rabatt (-10 %)'],
		'Código promocional (-5 %)': ['Promo code (-5%)', 'Aktionscode (-5 %)'],
		'Referencia: ': ['Reference: ', 'Referenz: '],
		'plazas': ['places', 'Plätze'],
		'Elige una hora': ['Choose a time', 'Wählen Sie eine Uhrzeit'],
		'Consultando reserva…': ['Looking up your booking…', 'Buchung wird abgerufen…'],
		'Gracias por suscribirte a las novedades de La Palma Princess.': ['Thank you for subscribing to La Palma Princess updates.', 'Vielen Dank für Ihr Abonnement der Neuigkeiten des La Palma Princess.'],
		'Ideas para descubrir la isla. Comprueba condiciones, accesos y avisos antes de salir.': ['Ideas for discovering the island. Check conditions, access and alerts before setting out.', 'Ideen, um die Insel zu entdecken. Prüfen Sie vor dem Aufbruch Bedingungen, Zugang und Hinweise.']
		,
		'¡Hola! Soy el recepcionista virtual del hotel La Palma Princess. ¿En qué te puedo ayudar hoy?': ['Hello! I am the virtual receptionist at La Palma Princess. How can I help you today?', 'Hallo! Ich bin der virtuelle Empfang des La Palma Princess. Wie kann ich Ihnen helfen?'],
		'Escribe tu pregunta...': ['Type your question...', 'Geben Sie Ihre Frage ein...'],
		'Enviar': ['Send', 'Senden'],
		'Escribiendo…': ['Typing…', 'Schreibt…'],
		'Volver arriba': ['Back to top', 'Nach oben'],
		'Tiempo no disponible': ['Weather unavailable', 'Wetter nicht verfügbar'],
		'No tengo ese dato ahora mismo. Escríbenos por WhatsApp al 613 48 90 55 o llámanos al +34 922 42 55 11.': ['I do not have that information right now. Message us on WhatsApp at +34 613 48 90 55 or call +34 922 42 55 11.', 'Diese Information liegt mir derzeit nicht vor. Schreiben Sie uns per WhatsApp unter +34 613 48 90 55 oder rufen Sie +34 922 42 55 11 an.'],
		'No se pudo completar la suscripción.': ['The subscription could not be completed.', 'Das Abonnement konnte nicht abgeschlossen werden.'],
		'No se pudo conectar con el servidor. Inténtalo de nuevo.': ['Could not connect to the server. Please try again.', 'Verbindung zum Server nicht möglich. Bitte versuchen Sie es erneut.'],
		'Revisa los campos marcados en rojo.': ['Check the fields marked in red.', 'Überprüfen Sie die rot markierten Felder.'],
		'La fecha de salida debe ser posterior a la de entrada.': ['Check-out must be after check-in.', 'Die Abreise muss nach der Anreise liegen.'],
		'Introduce el código seguro recibido en el correo.': ['Enter the secure code sent by email.', 'Geben Sie den sicheren Code aus der E-Mail ein.'],
		'No se encontró una reserva con ese enlace.': ['No booking was found for that link.', 'Für diesen Link wurde keine Buchung gefunden.'],
		'No se encontró una reserva activa para cancelar.': ['No active booking was found to cancel.', 'Es wurde keine aktive Buchung zum Stornieren gefunden.'],
		'¿Quieres cancelar esta reserva?': ['Do you want to cancel this booking?', 'Möchten Sie diese Buchung stornieren?'],
		'El asistente virtual no está configurado ahora mismo.': ['The virtual assistant is not configured right now.', 'Der virtuelle Assistent ist derzeit nicht konfiguriert.'],
		'Reserva actualizada.': ['Booking updated.', 'Buchung aktualisiert.'],
		'Reserva cancelada.': ['Booking cancelled.', 'Buchung storniert.'],
		'Tiempos y dificultad orientativos. No son actividades organizadas ni guiadas por el hotel.': ['Times and difficulty are estimates. These activities are not organized or guided by the hotel.', 'Dauer und Schwierigkeit sind Richtwerte. Diese Aktivitäten werden nicht vom Hotel organisiert oder geführt.'],
		'7 piscinas exteriores': ['7 outdoor pools', '7 Außenpools'],
		'Llega en coche y olvídate de buscar sitio. Los huéspedes disponen de aparcamiento sin coste durante toda su estancia, ideal para recorrer La Palma a tu aire.': ['Arrive by car and park with ease. Guests have free parking throughout their stay, ideal for exploring La Palma at your own pace.', 'Kommen Sie mit dem Auto und parken Sie bequem. Gästen steht während ihres Aufenthalts ein kostenloser Parkplatz zur Verfügung.'],
		'Mantén tu rutina de entrenamiento también de vacaciones. Nuestro gimnasio cuenta con máquinas de cardio y de fuerza para que te muevas a tu manera.': ['Keep up your workout routine on holiday. Our gym has cardio and strength equipment so you can exercise your way.', 'Bleiben Sie auch im Urlaub fit. Unser Fitnessstudio bietet Cardio- und Kraftgeräte für Ihr Training.'],
		'Ideal antes de un día de playa o senderismo': ['Ideal before a day at the beach or on the trails', 'Ideal vor einem Tag am Strand oder auf Wanderwegen'],
		'Masajes y tratamientos': ['Massages and treatments', 'Massagen und Anwendungen'],
		'Reservar una estancia': ['Book a stay', 'Aufenthalt buchen'],
		'Referencia: ': ['Reference: ', 'Referenz: '],
		' Nuevo total orientativo: ': [' New estimated total: ', ' Neue unverbindliche Gesamtsumme: '],
		'Comprobando disponibilidad…': ['Checking availability…', 'Verfügbarkeit wird geprüft…'],
		'No hay disponibilidad suficiente para esas fechas.': ['Not enough availability for these dates.', 'Für diese Daten ist nicht genügend verfügbar.'],
		'El formulario todavía no se ha enviado.': ['The form has not been submitted yet.', 'Das Formular wurde noch nicht übermittelt.'],
		'Revisa el nombre, el email y las fechas de la reserva.': ['Check your name, email and booking dates.', 'Bitte überprüfen Sie Name, E-Mail und Buchungsdaten.'],
		'No hay disponibilidad para esas fechas.': ['No availability for these dates.', 'Für diese Daten ist nichts verfügbar.'],
		'Elige una fecha primero': ['Choose a date first', 'Wählen Sie zuerst ein Datum'],
		'Instalar app': ['Install app', 'App installieren'],
		'Instala La Palma Princess': ['Install La Palma Princess', 'La Palma Princess installieren'],
		'Agrega esta app a tu pantalla de inicio para abrirla rápidamente.': ['Add this app to your home screen for quick access.', 'Fügen Sie diese App zum schnellen Zugriff Ihrem Startbildschirm hinzu.'],
		'Abre esta página en Safari.': ['Open this page in Safari.', 'Öffnen Sie diese Seite in Safari.'],
		'Pulsa Compartir y selecciona «Añadir a pantalla de inicio».': ['Tap Share, then choose “Add to Home Screen”.', 'Tippen Sie auf „Teilen“ und wählen Sie „Zum Home-Bildschirm“.'],
		'Confirma con «Añadir». Después, abre la app desde tu pantalla de inicio.': ['Confirm by tapping “Add”, then open the app from your home screen.', 'Bestätigen Sie mit „Hinzufügen“ und öffnen Sie die App anschließend vom Startbildschirm.'],
		'Abre el menú del navegador (⋮) y elige «Instalar app» o «Añadir a pantalla de inicio».': ['Open your browser menu (⋮) and choose “Install app” or “Add to Home Screen”.', 'Öffnen Sie das Browsermenü (⋮) und wählen Sie „App installieren“ oder „Zum Startbildschirm hinzufügen“.'],
		'Confirma la instalación y abre la app desde tu pantalla de inicio.': ['Confirm the installation and open the app from your home screen.', 'Bestätigen Sie die Installation und öffnen Sie die App vom Startbildschirm.'],
		'Pulsa el icono de instalar (un monitor con una flecha) a la derecha de la barra de direcciones, o abre el menú (⋮) y elige «Instalar La Palma Princess».': ['Click the install icon (a monitor with an arrow) on the right of the address bar, or open the menu (⋮) and choose “Install La Palma Princess”.', 'Klicken Sie rechts in der Adressleiste auf das Installationssymbol (Monitor mit Pfeil) oder öffnen Sie das Menü (⋮) und wählen Sie „La Palma Princess installieren“.'],
		'Confirma con «Instalar». Se abrirá como una aplicación y tendrás un acceso directo.': ['Confirm with “Install”. It will open as an app and you will get a shortcut.', 'Bestätigen Sie mit „Installieren“. Die App öffnet sich in einem eigenen Fenster und Sie erhalten eine Verknüpfung.'],
		'En el menú Archivo, elige «Añadir al Dock».': ['In the File menu, choose “Add to Dock”.', 'Wählen Sie im Menü „Ablage“ die Option „Zum Dock hinzufügen“.'],
		'Confirma con «Añadir». Después, abre la app desde el Dock.': ['Confirm with “Add”. Then open the app from the Dock.', 'Bestätigen Sie mit „Hinzufügen“. Öffnen Sie die App danach über das Dock.'],
		'Este navegador no permite instalar aplicaciones web en el ordenador.': ['This browser cannot install web apps on a computer.', 'Dieser Browser kann Web-Apps auf dem Computer nicht installieren.'],
		'Abre esta página en Chrome o Edge, o instálala desde tu móvil Android o iPhone.': ['Open this page in Chrome or Edge, or install it from your Android or iPhone.', 'Öffnen Sie diese Seite in Chrome oder Edge oder installieren Sie sie auf Ihrem Android- oder iPhone-Handy.'],
		'Usa la opción «Instalar» o «Añadir a pantalla de inicio» del menú del navegador.': ['Use “Install” or “Add to Home Screen” in your browser menu.', 'Wählen Sie im Browsermenü „Installieren“ oder „Zum Startbildschirm hinzufügen“.'],
		'Tu cuenta': ['Your account', 'Ihr Konto'],
		'Iniciar sesión': ['Sign in', 'Anmelden'],
		'Crear cuenta': ['Create account', 'Konto erstellen'],
		'Hola': ['Hello', 'Hallo'],
		'Conectando…': ['Connecting…', 'Verbindung wird hergestellt…'],
		'Escribe tu email y tu contraseña.': ['Enter your email and password.', 'Geben Sie E-Mail und Passwort ein.'],
		'Has iniciado sesión.': ['You are signed in.', 'Sie sind angemeldet.'],
		'Cuenta creada. Ya has iniciado sesión.': ['Account created. You are now signed in.', 'Konto erstellt. Sie sind jetzt angemeldet.'],
		'Revisa los campos marcados en rojo (la contraseña necesita 8 caracteres).': ['Check the fields marked in red (the password needs 8 characters).', 'Prüfen Sie die rot markierten Felder (das Passwort braucht 8 Zeichen).'],
		'Las contraseñas no coinciden.': ['The passwords do not match.', 'Die Passwörter stimmen nicht überein.'],
		'Debes aceptar las condiciones de uso.': ['You must accept the terms of use.', 'Sie müssen die Nutzungsbedingungen akzeptieren.'],
		'Ya existe una cuenta con ese email. Inicia sesión.': ['An account with that email already exists. Please sign in.', 'Es gibt bereits ein Konto mit dieser E-Mail. Bitte melden Sie sich an.'],
		'Email o contraseña incorrectos.': ['Incorrect email or password.', 'E-Mail oder Passwort falsch.'],
		'La contraseña debe tener entre 8 y 128 caracteres.': ['The password must be between 8 and 128 characters.', 'Das Passwort muss 8 bis 128 Zeichen lang sein.'],
		'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.': ['Too many failed attempts. Wait a few minutes and try again.', 'Zu viele Fehlversuche. Warten Sie einige Minuten und versuchen Sie es erneut.'],
		'Mis reservas': ['My bookings', 'Meine Buchungen'],
		'Aún no tienes reservas hechas con tu cuenta.': ['You have no bookings made with your account yet.', 'Sie haben noch keine Buchungen mit Ihrem Konto.'],
		'Cancelar reserva': ['Cancel booking', 'Buchung stornieren'],
		'¿Quieres cancelar esta reserva?': ['Do you want to cancel this booking?', 'Möchten Sie diese Buchung stornieren?'],
		'confirmada': ['confirmed', 'bestätigt'],
		'cancelada': ['cancelled', 'storniert'],
		'persona': ['person', 'Person'],
		'personas': ['people', 'Personen'],
		'Aqua Princess Spa': ['Aqua Princess Spa', 'Aqua Princess Spa'],
		'Restaurante': ['Restaurant', 'Restaurant'],
		'Actividad': ['Activity', 'Aktivität'],
		'Buscando horas…': ['Looking for times…', 'Zeiten werden gesucht…'],
		'Abrir gestión de la reserva': ['Open booking management', 'Buchungsverwaltung öffnen'],
		'Nuevo total orientativo: ': ['New estimated total: ', 'Neue unverbindliche Gesamtsumme: '],
		'Nuevo total orientativo:': ['New estimated total:', 'Neue unverbindliche Gesamtsumme:'],
		'También la verás en tu cuenta, en «Mis reservas».': ['You will also see it in your account, under “My bookings”.', 'Sie finden sie auch in Ihrem Konto unter „Meine Buchungen“.'],
		'Guarda este enlace: es la forma de consultar o cancelar la reserva. Con una cuenta la verás siempre en «Mis reservas».': ['Keep this link: it is how you view or cancel the booking. With an account you will always see it under “My bookings”.', 'Speichern Sie diesen Link: Damit können Sie die Buchung einsehen oder stornieren. Mit einem Konto finden Sie sie immer unter „Meine Buchungen“.'],
		'Este tipo de habitación no admite a todos los huéspedes.': ['This room type cannot accommodate all guests.', 'Dieser Zimmertyp bietet nicht für alle Gäste Platz.'],
		'Prueba con': ['Try', 'Versuchen Sie'],
		'Añade otra habitación o reparte los huéspedes.': ['Add another room or split the guests.', 'Fügen Sie ein weiteres Zimmer hinzu oder verteilen Sie die Gäste.'],
		'No se pudo conectar con el servidor. Si acaba de arrancar, espera unos segundos e inténtalo de nuevo.': ['Could not reach the server. If it has just started up, wait a few seconds and try again.', 'Der Server ist nicht erreichbar. Falls er gerade startet, warten Sie einige Sekunden und versuchen Sie es erneut.']
	};

	const reverse = { en: {}, de: {} };
	Object.keys(translations).forEach(function (spanish) {
		reverse.en[translations[spanish][0]] = spanish;
		reverse.de[translations[spanish][1]] = spanish;
	});

	function sourceText(value) {
		return reverse.en[value] || reverse.de[value] || value;
	}

	window.siteText = function (spanish) {
		const language = document.documentElement.lang;
		const translation = translations[spanish];
		return language === 'es' || !translation ? spanish : translation[language === 'de' ? 1 : 0];
	};

	const picker = document.getElementById('language-select');
	if (!picker) return;
	let language = 'es';
	try {
		const stored = localStorage.getItem('princess-language');
		if (stored === 'en' || stored === 'de') language = stored;
	} catch (error) {
		console.warn('No se pudo recuperar el idioma guardado.', error);
	}

	function applyLanguage(nextLanguage) {
		document.documentElement.lang = nextLanguage;
		const titleKey = sourceText(document.title);
		if (translations[titleKey]) {
			document.title = nextLanguage === 'es' ? titleKey :
				translations[titleKey][nextLanguage === 'de' ? 1 : 0];
		}
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		let node;
		while ((node = walker.nextNode())) {
			const current = node.nodeValue.trim();
			if (!current) continue;
			const spanish = sourceText(current);
			const translation = translations[spanish];
			if (!translation) continue;
			const replacement = nextLanguage === 'es' ? spanish : translation[nextLanguage === 'de' ? 1 : 0];
			node.nodeValue = node.nodeValue.replace(current, replacement);
		}
		document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(function (element) {
			['placeholder', 'title', 'aria-label'].forEach(function (attribute) {
				if (!element.hasAttribute(attribute)) return;
				const value = element.getAttribute(attribute);
				const spanish = sourceText(value);
				if (translations[spanish]) {
					element.setAttribute(attribute, nextLanguage === 'es' ? spanish :
						translations[spanish][nextLanguage === 'de' ? 1 : 0]);
				}
			});
		});
		picker.value = nextLanguage;
	}

	const translator = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			const nodes = mutation.type === 'characterData' ? [mutation.target] : [];
			Array.from(mutation.addedNodes).forEach(function (added) {
				if (added.nodeType === Node.TEXT_NODE) nodes.push(added);
				else if (added.nodeType === Node.ELEMENT_NODE) {
					const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
					let textNode;
					while ((textNode = walker.nextNode())) nodes.push(textNode);
				}
			});
			nodes.forEach(function (node) {
				if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) return;
				const current = node.nodeValue.trim();
				const spanish = sourceText(current);
				const translation = translations[spanish];
				if (!translation) return;
				const replacement = document.documentElement.lang === 'es'
					? spanish : translation[document.documentElement.lang === 'de' ? 1 : 0];
				if (replacement !== current) node.nodeValue = node.nodeValue.replace(current, replacement);
			});
		});
	});
	translator.observe(document.body, { childList: true, characterData: true, subtree: true });

	picker.addEventListener('change', function () {
		language = picker.value;
		try {
			localStorage.setItem('princess-language', language);
		} catch (error) {
			console.warn('No se pudo guardar el idioma elegido.', error);
		}
		applyLanguage(language);
		window.dispatchEvent(new CustomEvent('site-language-change', { detail: { language: language } }));
	});
	applyLanguage(language);
})();
