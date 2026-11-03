const API_BASE = window.PRINCESS_API_BASE ||
	((location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		? 'http://127.0.0.1:5000'
		: 'https://asistente-princess.onrender.com');

(function () {
	'use strict';

	const $ = function (s) { return document.querySelector(s); };
	const $$ = function (s) { return Array.from(document.querySelectorAll(s)); };

	const root = document.documentElement;
	root.classList.add('js');
	window.addEventListener('load', function () { root.classList.add('loaded'); });
	// Coordenadas del hotel: las usan el mapa y el tiempo (cópialas de Google Maps si quieres afinarlas)
	const HOTEL = [28.503096663660557, -17.873709776845214];
	
	/* ---- Pantalla de carga ---- */
	const loader = $('#loader');
	if (loader) {
	    // Verificamos si la pantalla de carga ya se mostró en esta sesión
	    let loaderShown = false;
	    try {
	        loaderShown = sessionStorage.getItem('loader-shown') === '1';
	    } catch (e) { /* sin almacenamiento */ }
	
	    if (loaderShown) {
	        // Si ya se mostró previamente, ocultamos/eliminamos el loader al instante
	        loader.remove();
	    } else {
	        // Es la primera vez en la sesión: lo guardamos en sessionStorage
	        try {
	            sessionStorage.setItem('loader-shown', '1');
	        } catch (e) { /* sin almacenamiento */ }
	
	        const MIN_TIME = 1200; // milisegundos que se ve como mínimo
	        const startTime = Date.now();
	
	        function hideLoader() {
	            const wait = Math.max(0, MIN_TIME - (Date.now() - startTime));
	            setTimeout(function () {
	                loader.classList.add('hide');
	                // Cuando termina el desvanecido, se elimina del todo
	                setTimeout(function () { loader.remove(); }, 700);
	            }, wait);
	        }
	
	        if (document.readyState === 'complete') hideLoader();
	        else window.addEventListener('load', hideLoader);
	    }
	}

	/* ---- Cabecera, barra de progreso de lectura y control de scroll ---- */
	const header = $('#header');
	const progressBar = $('#scroll-progress');
	const quickbar = $('#quickbar');
	let lastScrollY = window.scrollY;
	const scrollThreshold = 10; // Margen para evitar parpadeos con movimientos leves

	function handleScroll() {
		const currentScrollY = window.scrollY;
		
		// 1. Cabecera fija con sombra al bajar
		if (header) {
			header.classList.toggle('scrolled', currentScrollY > 40);
		}

		// 2. Barra de progreso superior
		if (progressBar) {
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			if (docHeight > 0) {
				const progressPercent = Math.min(100, Math.max(0, (currentScrollY / docHeight) * 100));
				progressBar.style.width = progressPercent + '%';
			}
		}

		// 3. Ocultar / Mostrar la barra de reserva dinámicamente
		if (quickbar) {
			const guestsPanel = $('#guests-panel');
			const isPanelOpen = guestsPanel && !guestsPanel.hidden;

			// Si el desplegable de huéspedes está abierto, no la ocultamos
			if (!isPanelOpen && Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
				if (currentScrollY > lastScrollY && currentScrollY > 120) {
					// Bajando por la página: se esconde hacia arriba
					quickbar.classList.add('qb-hidden');
				} else {
					// Subiendo por la página: vuelve a aparecer
					quickbar.classList.remove('qb-hidden');
				}
				lastScrollY = currentScrollY;
			}
		}
	}

	window.addEventListener('scroll', handleScroll, { passive: true });
	handleScroll();

		/* ---- Botón "volver arriba" ---- */
	const toTop = $('#to-top');
	if (toTop) {
		function checkToTop() {
			const show = window.scrollY > 400;
			if (show && toTop.hidden) {
				toTop.hidden = false;
				// Dos fotogramas para que se vea la animación de entrada
				requestAnimationFrame(function () {
					requestAnimationFrame(function () { toTop.classList.add('show'); });
				});
			} else if (!show && !toTop.hidden) {
				toTop.classList.remove('show');
				setTimeout(function () {
					if (!toTop.classList.contains('show')) toTop.hidden = true;
				}, 300);
			}
		}
		window.addEventListener('scroll', checkToTop, { passive: true });
		toTop.addEventListener('click', function () { window.scrollTo(0, 0); });
		checkToTop();
	}

	/* ---- Menú móvil ---- */
	const nav = $('#nav');
	const toggle = $('.menu-toggle');
	toggle.addEventListener('click', function () {
		const open = nav.classList.toggle('open');
		toggle.setAttribute('aria-expanded', open);
		toggle.setAttribute('aria-label', window.siteText(open ? 'Cerrar menú' : 'Abrir menú'));
	});

	/* ---- Enlace activo según la página actual ---- */
	const page = location.pathname.split('/').pop() || 'index.html';
	$$('#nav a:not(.btn)').forEach(function (a) {
		a.classList.toggle('active', a.getAttribute('href') === page);
	});

	/* ---- Hero (solo inicio): imágenes que se desvanecen ---- */
	const slides = $$('.hero .slide');
	let current = 0;
	if (slides.length > 1) {
		setInterval(function () {
			slides[current].classList.remove('active');
			current = (current + 1) % slides.length;
			slides[current].classList.add('active');
		}, 5000);
	}

	/* ---- Textos e imágenes entran por los lados cada vez que aparecen ---- */
	const revealItems = [];
	function addReveal(el, side) {
		el.classList.add(side === 'left' ? 'from-left' : 'from-right');
		revealItems.push(el);
	}
	function opposite(side) { return side === 'left' ? 'right' : 'left'; }
	function all(selector, side) {
		$$(selector).forEach(function (el) { addReveal(el, side); });
	}
	function alternate(selector) {
		$$(selector).forEach(function (el, i) { addReveal(el, i % 2 ? 'right' : 'left'); });
	}

	all('.hero-content', 'left');
	all('.page-hero h1', 'left');
	all('.page-hero p', 'right');
	all('.section-head', 'left');
	all('.welcome-text', 'left');
	all('.welcome-img', 'right');
	all('.cta > *', 'right');
	all('.booking', 'right');
	all('.gallery-intro h2', 'left');
	all('.gallery-intro p', 'right');
	alternate('.card');
	alternate('.services li');
	alternate('.gallery .gallery-item');

	$$('.room').forEach(function (room, i) {
		const side = i % 2 ? 'right' : 'left';
		addReveal(room.querySelector('.room-img'), side);
		Array.from(room.querySelectorAll('h3, p')).forEach(function (t) {
			addReveal(t, opposite(side));
		});
	});

	const revealObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			entry.target.classList.toggle('is-visible', entry.isIntersecting);
		});
	}, { threshold: 0, rootMargin: '-12% 0px -12% 0px' });
	revealItems.forEach(function (el) { revealObserver.observe(el); });

	/* ---- Visor de galería (solo galeria.html) ---- */
	const lightbox = $('#lightbox');
	if (lightbox) {
		const lbView = lightbox.querySelector('.lightbox-view');
		const lbTitle = $('#lightbox-title');
		let lastFocus = null;

		const openLightbox = function (item) {
			lastFocus = item;
			lbView.style.background = 'url("' + encodeURI(item.dataset.src) + '") center / contain no-repeat #0c2229';
			lbTitle.textContent = item.dataset.title;
			lightbox.hidden = false;
			lightbox.querySelector('.lightbox-close').focus();
		};
		const closeLightbox = function () {
			lightbox.hidden = true;
			if (lastFocus) lastFocus.focus();
		};
		$$('.gallery-item').forEach(function (item) {
			item.setAttribute('aria-label', 'Ampliar: ' + item.dataset.title);
			item.addEventListener('click', function () { openLightbox(item); });
		});
		lightbox.addEventListener('click', function (e) {
			if (e.target === lightbox || e.target.closest('.lightbox-close')) closeLightbox();
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
		});
	}

	/* ---- Formulario de reserva (solo reservas.html) ---- */
	const form = $('#booking-form');
	if (form) {
		const status = $('#form-status');
		const checkin = $('#checkin');
		const checkout = $('#checkout');
		const today = toISO(new Date());
		checkin.min = today;
		checkout.min = addDays(today, 1);
		checkin.addEventListener('change', function () {
			checkout.min = addDays(checkin.value || today, 1);
			if (!checkout.value || checkout.value <= checkin.value) checkout.value = checkout.min;
		});

		const setStatus = function (msg, type) { status.textContent = msg; status.className = type; };

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			let valid = true;
			form.querySelectorAll('input, select, textarea').forEach(function (input) {
				const ok = !input.willValidate || input.checkValidity();
				input.classList.toggle('invalid', !ok);
				if (!ok) valid = false;
			});
			if (!valid) { setStatus('Revisa los campos marcados en rojo.', 'error'); return; }
			if (checkout.value <= checkin.value) {
				checkout.classList.add('invalid');
				setStatus('La fecha de salida debe ser posterior a la de entrada.', 'error');
				return;
			}
			const submitButton = form.querySelector('[type="submit"]');
			submitButton.disabled = true;
			setStatus('Comprobando disponibilidad…', '');
			fetch(API_BASE + '/api/bookings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.elements.name.value.trim(),
					email: form.elements.email.value.trim(),
					checkin: checkin.value,
					checkout: checkout.value,
					room: form.elements.room.value,
					rooms: form.elements.rooms.value,
					adults: form.elements.adults.value,
					children: form.elements.children.value,
					promo: form.elements.promo.value,
					resident: form.elements.resident.checked,
					message: form.elements.message.value
				})
			})
				.then(function (response) {
					return response.json().then(function (data) {
						if (!response.ok) throw new Error(data.error || 'No se pudo registrar la reserva.');
						return data;
					});
				})
				.then(function (data) {
					form.reset();
					const manageUrl = new URL('reservas.html', location.href);
					manageUrl.searchParams.set('manage', data.management_token);
					setStatus(window.siteText(data.message) + ' Referencia: ' + data.reference + '.', 'ok');
					const manageLink = $('#booking-manage-link');
					manageLink.href = manageUrl.href;
					manageLink.textContent = 'Abrir gestión de la reserva';
					manageLink.hidden = false;
				})
				.catch(function (error) {
					setStatus(window.siteText(error.message || 'No se pudo conectar con el servidor. Inténtalo de nuevo.'), 'error');
				})
				.then(function () { submitButton.disabled = false; });
		});
	}

	/* ---- Gestión segura de reservas ---- */
	const manageForm = $('#manage-booking-form');
	if (manageForm) {
		const tokenInput = $('#manage-token');
		const manageStatus = $('#manage-status');
		const setManageStatus = function (message, type) {
			manageStatus.textContent = message;
			manageStatus.className = type;
		};
		const tokenFromUrl = new URLSearchParams(location.search).get('manage');
		if (tokenFromUrl) tokenInput.value = tokenFromUrl;

		function loadManagedBooking() {
			const token = tokenInput.value.trim();
			if (!token) {
				setManageStatus('Introduce el código seguro recibido en el correo.', 'error');
				return Promise.resolve();
			}
			return fetch(API_BASE + '/api/bookings/' + encodeURIComponent(token))
				.then(function (response) {
					return response.json().then(function (data) {
						if (!response.ok) throw new Error(data.error || 'No se encontró la reserva.');
						return data;
					});
				})
				.then(function (booking) {
					manageForm.elements.checkin.value = booking.checkin;
					manageForm.elements.checkout.value = booking.checkout;
					manageForm.elements.room.value = booking.room;
					manageForm.elements.rooms.value = booking.rooms;
					setManageStatus(window.siteText('Reserva') + ' ' + booking.reference + ': ' +
						window.siteText(booking.status) + '. ' + window.siteText('Total orientativo: ') +
						new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(booking.total), 'ok');
				})
				.catch(function (error) { setManageStatus(window.siteText(error.message), 'error'); });
		}

		$('#load-booking').addEventListener('click', loadManagedBooking);
		manageForm.addEventListener('submit', function (event) {
			event.preventDefault();
			fetch(API_BASE + '/api/bookings/' + encodeURIComponent(tokenInput.value.trim()), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					checkin: manageForm.elements.checkin.value,
					checkout: manageForm.elements.checkout.value,
					room: manageForm.elements.room.value,
					rooms: manageForm.elements.rooms.value
				})
			})
				.then(function (response) {
					return response.json().then(function (data) {
						if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la reserva.');
						return data;
					});
				})
				.then(function (data) { setManageStatus(window.siteText(data.message) + ' Nuevo total orientativo: ' +
					new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.total), 'ok'); })
				.catch(function (error) { setManageStatus(window.siteText(error.message), 'error'); });
		});
		$('#cancel-booking').addEventListener('click', function () {
			if (!tokenInput.value.trim() || !window.confirm('¿Quieres cancelar esta reserva?')) return;
			fetch(API_BASE + '/api/bookings/' + encodeURIComponent(tokenInput.value.trim()) + '/cancel', { method: 'POST' })
				.then(function (response) {
					return response.json().then(function (data) {
						if (!response.ok) throw new Error(data.error || 'No se pudo cancelar la reserva.');
						return data;
					});
				})
				.then(function (data) { setManageStatus(window.siteText(data.message), 'ok'); })
				.catch(function (error) { setManageStatus(error.message, 'error'); });
		});
		if (tokenFromUrl) loadManagedBooking();
	}

	/* ---- Barra de reserva fija ---- */
	const qbIn = $('#qb-checkin');
	const qbOut = $('#qb-checkout');

	// Fecha local en formato AAAA-MM-DD (toISOString usa UTC y puede dar el día anterior)
	function toISO(date) {
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return date.getFullYear() + '-' + m + '-' + d;
	}
	function addDays(iso, n) {
		const [y, m, d] = iso.split('-').map(Number);
		return toISO(new Date(y, m - 1, d + n));
	}

	if (qbIn && qbOut) {
		const todayStr = toISO(new Date());

		// Fechas por defecto: hoy y dentro de 2 días
		qbIn.min = todayStr;
		qbIn.value = todayStr;
		qbOut.value = addDays(todayStr, 2);
		qbOut.min = addDays(todayStr, 1);

		// Si cambias la entrada, la salida se ajusta sola cuando queda antes
		qbIn.addEventListener('change', function () {
			if (!qbIn.value) qbIn.value = todayStr;
			qbOut.min = addDays(qbIn.value, 1);
			if (!qbOut.value || qbOut.value <= qbIn.value) qbOut.value = addDays(qbIn.value, 2);
		});

		$('#quickbar').addEventListener('submit', function (e) {
			if (!qbOut.value || qbOut.value <= qbIn.value) {
				e.preventDefault();
				qbOut.setCustomValidity('La salida debe ser posterior a la entrada.');
				qbOut.reportValidity();
				qbOut.setCustomValidity('');
			}
		});
	}

	/* ---- Persistencia de datos de reserva en toda la web ----
	   (CORREGIDO: antes estaba fuera de la función y no veía qbIn, qbOut ni $) */
	const STORAGE_KEY = 'princess_booking_data';
	let savedQuickbarState = null;
	let guestRooms = null;

	function saveQuickbarState() {
		if (!qbIn || !qbOut) return;
		const data = {
			checkin: qbIn.value,
			checkout: qbOut.value,
			adults: $('#qb-adults') ? $('#qb-adults').value : '2',
			children: $('#qb-children') ? $('#qb-children').value : '0',
			rooms: $('#qb-rooms') ? $('#qb-rooms').value : '1',
			guestRooms: guestRooms ? guestRooms.map(function (room) {
				return { adults: room.adults, children: room.children };
			}) : undefined,
			promo: $('input[name="promo"]') ? $('input[name="promo"]').value : '',
			resident: $('input[name="resident"]') ? $('input[name="resident"]').checked : false
		};
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (e) {}
	}

	function loadQuickbarState() {
		try {
			const raw = sessionStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const data = JSON.parse(raw);
			if (!data || typeof data !== 'object') return;
			savedQuickbarState = data;

			if (qbIn && /^\d{4}-\d{2}-\d{2}$/.test(data.checkin || '') && data.checkin >= toISO(new Date())) {
				qbIn.value = data.checkin;
			}
			if (qbOut && /^\d{4}-\d{2}-\d{2}$/.test(data.checkout || '') && data.checkout > qbIn.value) {
				qbOut.value = data.checkout;
			}
			if (qbIn && qbOut) qbOut.min = addDays(qbIn.value, 1);

			const promoInput = $('input[name="promo"]');
			if (promoInput && data.promo) promoInput.value = data.promo;

			const resInput = $('input[name="resident"]');
			if (resInput && data.resident !== undefined) resInput.checked = Boolean(data.resident);
		} catch (e) {}
	}

	// Escuchar cambios en la quickbar para guardar automáticamente
	if (quickbar) {
		loadQuickbarState();
		quickbar.addEventListener('input', saveQuickbarState);
		quickbar.addEventListener('change', saveQuickbarState);
	}

	/* ---- Selector de huéspedes y habitaciones ---- */
	const guestsBtn = $('#guests-btn');
	if (guestsBtn) {
		const wrap = guestsBtn.closest('.qb-guests');
		const panel = $('#guests-panel');
		const list = $('#rooms-list');
		const addBtn = $('#add-room');
		const MAX_ROOMS = 4, MAX_ADULTS = 4, MAX_CHILDREN = 3;
		function validGuestRoom(room) {
			return room && Number.isInteger(room.adults) && room.adults >= 1 && room.adults <= MAX_ADULTS &&
				Number.isInteger(room.children) && room.children >= 0 && room.children <= MAX_CHILDREN;
		}
		function initialGuestRooms() {
			if (savedQuickbarState && Array.isArray(savedQuickbarState.guestRooms)) {
				const stored = savedQuickbarState.guestRooms.slice(0, MAX_ROOMS);
				if (stored.length && stored.every(validGuestRoom)) return stored;
			}

			const totalRooms = Math.min(MAX_ROOMS, Math.max(1, parseInt(savedQuickbarState && savedQuickbarState.rooms, 10) || 1));
			const totalAdults = Math.min(MAX_ADULTS * MAX_ROOMS, Math.max(totalRooms, parseInt(savedQuickbarState && savedQuickbarState.adults, 10) || 2));
			const totalChildren = Math.min(MAX_CHILDREN * MAX_ROOMS, Math.max(0, parseInt(savedQuickbarState && savedQuickbarState.children, 10) || 0));
			const roomCount = Math.min(MAX_ROOMS, Math.max(totalRooms, Math.ceil(totalAdults / MAX_ADULTS), Math.ceil(totalChildren / MAX_CHILDREN)));
			const restored = Array.from({ length: roomCount }, function () {
				return { adults: 1, children: 0 };
			});
			for (let i = restored.length; i < totalAdults; i++) {
				const room = restored.find(function (item) { return item.adults < MAX_ADULTS; });
				if (room) room.adults++;
			}
			for (let i = 0; i < totalChildren; i++) {
				const room = restored.find(function (item) { return item.children < MAX_CHILDREN; });
				if (room) room.children++;
			}
			return restored;
		}
		guestRooms = initialGuestRooms();

		function plural(n, one, many) { return n + ' ' + window.siteText(n === 1 ? one : many); }

		function stepper(label, hint, key, i, value, min, max) {
			const base = ' data-i="' + i + '" data-key="' + key + '"';
			return '<div class="guest-row"><div><span class="g-name">' + label + '</span><span class="g-hint">' + hint + '</span></div>' +
				'<div class="stepper">' +
				'<button type="button" class="step"' + base + ' data-d="-1" aria-label="Menos ' + label.toLowerCase() + '"' + (value <= min ? ' disabled' : '') + '>−</button>' +
				'<span class="g-count">' + value + '</span>' +
				'<button type="button" class="step"' + base + ' data-d="1" aria-label="Más ' + label.toLowerCase() + '"' + (value >= max ? ' disabled' : '') + '>+</button>' +
				'</div></div>';
		}

		function render() {
			list.innerHTML = guestRooms.map(function (room, i) {
				return '<div class="room-block"><div class="room-title"><strong>Habitación ' + (i + 1) + '</strong>' +
					(i > 0 ? '<button type="button" class="remove-room" data-i="' + i + '">Quitar</button>' : '') + '</div>' +
					stepper('Adultos', 'Desde 12 años', 'adults', i, room.adults, 1, MAX_ADULTS) +
					stepper('Niños', 'Hasta 11 años', 'children', i, room.children, 0, MAX_CHILDREN) + '</div>';
			}).join('');

			const adults = guestRooms.reduce(function (s, r) { return s + r.adults; }, 0);
			const children = guestRooms.reduce(function (s, r) { return s + r.children; }, 0);
			guestsBtn.textContent = plural(adults, 'adulto', 'adultos') + ', ' + plural(children, 'niño', 'niños') + ', ' + guestRooms.length + ' ' + window.siteText('hab.');
			$('#qb-adults').value = adults;
			$('#qb-children').value = children;
			$('#qb-rooms').value = guestRooms.length;
			addBtn.disabled = guestRooms.length >= MAX_ROOMS;
			saveQuickbarState();
		}

		function stepSelector(i, key, d) {
			return '.step[data-i="' + i + '"][data-key="' + key + '"][data-d="' + d + '"]';
		}

		panel.addEventListener('click', function (e) {
			const step = e.target.closest('.step');
			const remove = e.target.closest('.remove-room');
			if (step) {
				const i = Number(step.dataset.i), key = step.dataset.key, d = Number(step.dataset.d);
				const max = key === 'adults' ? MAX_ADULTS : MAX_CHILDREN;
				const min = key === 'adults' ? 1 : 0;
				guestRooms[i][key] = Math.min(max, Math.max(min, guestRooms[i][key] + d));
				render();
				// Devuelve el foco al botón pulsado (o a su opuesto si quedó desactivado)
				const same = list.querySelector(stepSelector(i, key, d));
				const other = list.querySelector(stepSelector(i, key, -d));
				const target = same && !same.disabled ? same : other;
				if (target) target.focus();
			} else if (remove) {
				guestRooms.splice(Number(remove.dataset.i), 1);
				render();
			}
		});

		addBtn.addEventListener('click', function () {
			if (guestRooms.length < MAX_ROOMS) {
				guestRooms.push({ adults: 2, children: 0 });
				render();
			}
		});

		function setOpen(open) {
			panel.hidden = !open;
			guestsBtn.setAttribute('aria-expanded', open);
		}
		guestsBtn.addEventListener('click', function () { setOpen(panel.hidden); });
		document.addEventListener('click', function (e) {
			if (!e.composedPath().includes(wrap)) setOpen(false);
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !panel.hidden) { setOpen(false); guestsBtn.focus(); }
		});

		render();
	}

	/* ---- Rellenar el formulario de reservas con los datos de la barra ---- */
	if (form) {
		const params = new URLSearchParams(location.search);
		// Si no vienen datos en la URL, usa los de la barra
		if (qbIn && !params.get('checkin')) form.elements.checkin.value = qbIn.value;
		if (qbOut && !params.get('checkout')) form.elements.checkout.value = qbOut.value;

		['checkin', 'checkout', 'adults', 'children', 'rooms', 'promo'].forEach(function (name) {
			const field = form.elements[name];
			if (field && params.has(name)) field.value = params.get(name);
			else if (field && savedQuickbarState && savedQuickbarState[name] !== undefined) field.value = savedQuickbarState[name];
		});
		if (form.elements.resident) {
			form.elements.resident.checked = params.has('resident')
				? params.get('resident') === '1'
				: Boolean(savedQuickbarState && savedQuickbarState.resident);
		}
		if (checkin && checkout) {
			checkout.min = addDays(checkin.value || toISO(new Date()), 1);
		}
	}

	/* ---- Código promocional: solo 6 dígitos ---- */
	$$('input[name="promo"]').forEach(function (promo) {
		promo.addEventListener('input', function () {
			promo.value = promo.value.replace(/\D/g, '').slice(0, 6);
		});
	});

	/* ---- Newsletter del pie ---- */
	const newsletter = $('#newsletter');
	if (newsletter) {
		const nlEmail = $('#nl-email');
		const nlStatus = $('#nl-status');
		newsletter.addEventListener('submit', function (e) {
			e.preventDefault();
			const consent = $('#nl-consent');
			if (!newsletter.checkValidity() || !nlEmail.value.trim() || !consent.checked) {
				newsletter.reportValidity();
				nlStatus.textContent = 'Escribe un email válido y acepta recibir comunicaciones.';
				nlStatus.className = 'error';
				return;
			}
			const submitButton = newsletter.querySelector('[type="submit"]');
			submitButton.disabled = true;
			fetch(API_BASE + '/api/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: nlEmail.value.trim(), consent: consent.checked })
			})
				.then(function (response) {
					return response.json().then(function (data) {
						if (!response.ok) throw new Error(data.error || 'No se pudo completar la suscripción.');
						return data;
					});
				})
				.then(function (data) {
					nlStatus.textContent = window.siteText(data.message);
					nlStatus.className = 'ok';
					newsletter.reset();
				})
				.catch(function (error) {
					nlStatus.textContent = window.siteText(error.message || 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
					nlStatus.className = 'error';
				})
				.then(function () { submitButton.disabled = false; });
		});
	}

	/* ---- Cookies: aparecen cada vez que se abre la página ---- */
	const cookieBanner = $('#cookie-banner');
	if (cookieBanner) {
		const cookieOptions = $('#cookie-options');
		const cookieConfig = $('#cookie-config');
		let configuring = false;

		function openCookies() {
			configuring = false;
			cookieOptions.hidden = true;
			cookieConfig.textContent = 'Configurar';
			cookieBanner.hidden = false;
			// Dos fotogramas para que la animación de entrada se vea
			requestAnimationFrame(function () {
				requestAnimationFrame(function () { cookieBanner.classList.add('show'); });
			});
		}

		function closeCookies(choice) {
			cookieBanner.classList.remove('show');
			setTimeout(function () { cookieBanner.hidden = true; }, 400);
			// Aquí se podría activar o desactivar cada tipo de cookie según la elección
			console.log('Cookies:', choice);
		}

		$('#cookie-accept').addEventListener('click', function () {
			closeCookies({ necesarias: true, analiticas: true, marketing: true });
		});
		$('#cookie-reject').addEventListener('click', function () {
			closeCookies({ necesarias: true, analiticas: false, marketing: false });
		});
		cookieConfig.addEventListener('click', function () {
			if (!configuring) {
				configuring = true;
				cookieOptions.hidden = false;
				cookieConfig.textContent = 'Guardar selección';
			} else {
				closeCookies({
					necesarias: true,
					analiticas: $('#ck-analytics').checked,
					marketing: $('#ck-marketing').checked
				});
			}
		});

		const reopen = $('#open-cookies');
		if (reopen) {
			reopen.addEventListener('click', function (e) { e.preventDefault(); openCookies(); });
		}

		// Aparece una vez cada vez que se abre la web (pestaña nueva), sea cual sea la página de entrada
		let shown = false;
		try { shown = sessionStorage.getItem('cookies-shown') === '1'; } catch (e) { /* sin almacenamiento */ }
		if (!shown) {
			try { sessionStorage.setItem('cookies-shown', '1'); } catch (e) { /* sin almacenamiento */ }
			setTimeout(openCookies, 2000);
		}
	}

	/* ---- Pop-up de usuario (registro simulado) ---- */
	const userBtn = $('#user-btn');
	if (userBtn) {
		const modal = $('#user-modal');
		const formView = $('#user-form-view');
		const loggedView = $('#user-logged-view');
		const userForm = $('#user-form');
		const userStatus = $('#user-status');
		const USER_KEY = 'la-palma-princess-user';
		let opener = null;

		function getUser() {
			try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
		}
		function saveUser(user) {
			try {
				if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
				else localStorage.removeItem(USER_KEY);
			} catch (e) { /* sin almacenamiento */ }
		}

		// Muestra el formulario o la vista de sesión iniciada
		function refreshUser() {
			const user = getUser();
			$('#user-label').textContent = user ? 'Hola, ' + user.name.split(' ')[0] : 'Usuario';
			formView.hidden = !!user;
			loggedView.hidden = !user;
			if (user) $('#user-logged-text').textContent = user.name + ' (' + user.email + ')';
		}

		function openModal() {
			opener = userBtn;
			refreshUser();
			userStatus.textContent = '';
			modal.hidden = false;
			const first = getUser() ? $('#user-logout') : $('#u-name');
			first.focus();
		}
		function closeModal() {
			modal.hidden = true;
			if (opener) opener.focus();
		}

		userBtn.addEventListener('click', openModal);
		$('#user-close').addEventListener('click', closeModal);
		modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

		// Escape cierra y Tab no sale del pop-up
		document.addEventListener('keydown', function (e) {
			if (modal.hidden) return;
			if (e.key === 'Escape') { closeModal(); return; }
			if (e.key !== 'Tab') return;
			const items = Array.from(modal.querySelectorAll('button, input, a[href]')).filter(function (el) {
				return !el.disabled && el.offsetParent !== null;
			});
			const first = items[0], last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		});

		userForm.addEventListener('submit', function (e) {
			e.preventDefault();
			const fields = ['#u-name', '#u-email', '#u-pass', '#u-pass2'].map($);
			let valid = true;
			fields.forEach(function (input) {
				const ok = input.value.trim() !== '' && input.checkValidity();
				input.classList.toggle('invalid', !ok);
				if (!ok) valid = false;
			});
			if (!valid) { userStatus.textContent = 'Revisa los campos marcados en rojo (la contraseña necesita 8 caracteres).'; userStatus.className = 'error'; return; }
			if ($('#u-pass').value !== $('#u-pass2').value) {
				$('#u-pass2').classList.add('invalid');
				userStatus.textContent = 'Las contraseñas no coinciden.'; userStatus.className = 'error'; return;
			}
			if (!$('#u-terms').checked) { userStatus.textContent = 'Debes aceptar las condiciones de uso.'; userStatus.className = 'error'; return; }

			// Registro simulado: no se guarda la contraseña
			saveUser({ name: $('#u-name').value.trim(), email: $('#u-email').value.trim() });
			userForm.reset();
			refreshUser();
			closeModal();
		});

		$('#user-logout').addEventListener('click', function () {
			saveUser(null);
			refreshUser();
			closeModal();
		});

		refreshUser();
	}

	/* ---- Mapa de ubicación (Leaflet, con plan B) ---- */
	const mapaEl = $('#mapa');
	if (mapaEl) {
		const hotel = [28.502987365006245, -17.87326696564629]; // pon aquí TUS coordenadas

		if (location.protocol === 'file:' || !window.L) {
			// Plan B: mapa incrustado de OpenStreetMap (funciona sin servidor)
			const d = 0.02;
			const bbox = [hotel[1] - d, hotel[0] - d, hotel[1] + d, hotel[0] + d].join('%2C');
			mapaEl.innerHTML =
				'<iframe title="Mapa con la ubicación del hotel" loading="lazy" ' +
				'style="width:100%;height:100%;border:0;border-radius:8px" ' +
				'src="https://www.openstreetmap.org/export/embed.html?bbox=' + bbox +
				'&layer=mapnik&marker=' + hotel[0] + '%2C' + hotel[1] + '"></iframe>';
		} else {
			const mapa = L.map('mapa', { scrollWheelZoom: false }).setView(hotel, 13);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(mapa);

			L.marker(hotel).addTo(mapa)
				.bindPopup('<strong>La Palma Princess</strong><br>Fuencaliente, La Palma')
				.openPopup();

			mapa.on('click', function () { mapa.scrollWheelZoom.enable(); });
			mapa.on('mouseout', function () { mapa.scrollWheelZoom.disable(); });
		}
	}

	/* ---- Música de fondo con ondas ---- */
	const music = $('#bg-music');
	const musicBtn = $('#music-btn');
	if (music && musicBtn) {
		music.volume = 0.3; // volumen suave (de 0 a 1)

		function setMusicUI(on) {
			musicBtn.classList.toggle('on', on);
			musicBtn.setAttribute('aria-pressed', on);
			musicBtn.setAttribute('aria-label', on ? 'Silenciar música' : 'Activar música');
		}

		musicBtn.addEventListener('click', function () {
			if (music.paused) {
				// play() devuelve una promesa: puede fallar si el navegador lo bloquea
				music.play().then(function () { setMusicUI(true); })
					.catch(function () { setMusicUI(false); });
			} else {
				music.pause();
				setMusicUI(false);
			}
		});
	}	

	/* ---- Widget del tiempo (Open-Meteo) ---- */
	const weatherEl = $('#weather');
	if (weatherEl) {
		const LAT = HOTEL[0].toFixed(3), LON = HOTEL[1].toFixed(3);
		const url = 'https://api.open-meteo.com/v1/forecast' +
			'?latitude=' + LAT + '&longitude=' + LON +
			'&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
			'&timezone=auto';

		// Código del tiempo -> [icono, texto]
		function describeWeather(code) {
			if (code === 0) return ['☀️', 'Despejado'];
			if (code === 1) return ['🌤️', 'Casi despejado'];
			if (code === 2) return ['⛅', 'Parcialmente nublado'];
			if (code === 3) return ['☁️', 'Nublado'];
			if (code === 45 || code === 48) return ['🌫️', 'Niebla'];
			if (code >= 51 && code <= 57) return ['🌦️', 'Llovizna'];
			if (code >= 61 && code <= 67) return ['🌧️', 'Lluvia'];
			if (code >= 71 && code <= 77) return ['❄️', 'Nieve'];
			if (code >= 80 && code <= 82) return ['🌦️', 'Chubascos'];
			if (code >= 95) return ['⛈️', 'Tormenta'];
			return ['🌡️', 'Tiempo variable'];
		}

		fetch(url)
			.then(function (res) {
				if (!res.ok) throw new Error('HTTP ' + res.status);
				return res.json();
			})
			.then(function (data) {
				const c = data.current;
				const info = describeWeather(c.weather_code);
				$('#weather-icon').textContent = info[0];
				$('#weather-temp').textContent = Math.round(c.temperature_2m) + '°C';
				$('#weather-desc').textContent = info[1];
				$('#weather-extra').textContent =
					'💨 ' + Math.round(c.wind_speed_10m) + ' km/h · 💧 ' + c.relative_humidity_2m + '%';
			})
			.catch(function (err) {
				console.error('Tiempo:', err);
				$('#weather-icon').textContent = '🌡️';
				$('#weather-desc').textContent = 'Tiempo no disponible';
			});
	}

		/* ---- Resumen de precio (reservas.html) ---- */
	const summary = $('#summary');
	if (form && summary) {
		const ROOM_PRICES = [150, 185, 250];   // Estándar, Superior, Suite (mismo orden que el <select>)
		const EXTRA_ADULT = 30;                // € por noche, adulto a partir del tercero por habitación
		const CHILD = 12;                      // € por noche
		const RESIDENT_DISC = 0.10;
		const PROMO_DISC = 0.05;
		function money() {
			const locale = document.documentElement.lang === 'de' ? 'de-DE' :
				(document.documentElement.lang === 'en' ? 'en-GB' : 'es-ES');
			return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
		}

		function parseISO(iso) {
			const p = iso.split('-').map(Number);
			return new Date(p[0], p[1] - 1, p[2]);
		}
		function fmtDate(iso) {
			const locale = document.documentElement.lang === 'de' ? 'de-DE' :
				(document.documentElement.lang === 'en' ? 'en-GB' : 'es-ES');
			return parseISO(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
		}
		function num(name, fallback) {
			const v = parseInt(form.elements[name].value, 10);
			return isNaN(v) ? fallback : v;
		}
		function line(label, amount, cls) {
			return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span>' + label + '</span><span>' + money().format(amount) + '</span></li>';
		}

		let availabilityRequest = 0;
		function updateSummary() {
			const cin = form.elements.checkin.value;
			const cout = form.elements.checkout.value;
			const nights = (cin && cout) ? Math.round((parseISO(cout) - parseISO(cin)) / 86400000) : 0;

			// Sin fechas válidas se oculta el desglose
			if (nights < 1) {
				$('#sum-empty').hidden = false;
				$('#sum-body').hidden = true;
				return;
			}
			$('#sum-empty').hidden = true;
			$('#sum-body').hidden = false;

			const rooms = Math.max(1, num('rooms', 1));
			const adults = Math.max(1, num('adults', 1));
			const children = Math.max(0, num('children', 0));
			const roomSelect = form.elements.room;
			const price = ROOM_PRICES[roomSelect.selectedIndex] || ROOM_PRICES[0];
			const nightsTxt = nights + ' ' + window.siteText(nights === 1 ? 'noche' : 'noches');

			// Datos de la estancia
			$('#sum-in').textContent = fmtDate(cin);
			$('#sum-out').textContent = fmtDate(cout);
			$('#sum-nights').textContent = nights;
			$('#sum-room').textContent = window.siteText(roomSelect.value);
			$('#sum-rooms').textContent = rooms;
			$('#sum-guests').textContent = adults + ' ' + window.siteText(adults === 1 ? 'adulto' : 'adultos') +
				(children ? ', ' + children + ' ' + window.siteText(children === 1 ? 'niño' : 'niños') : '');

			// Cálculo
			const base = nights * rooms * price;
			const extraAdults = Math.max(0, adults - 2 * rooms);
			const extraAdultsCost = extraAdults * EXTRA_ADULT * nights;
			const childrenCost = children * CHILD * nights;
			const subtotal = base + extraAdultsCost + childrenCost;

			let html = line(nightsTxt + ' × ' + rooms + ' ' + window.siteText('hab.') + ' × ' + money().format(price), base);
			if (extraAdults) html += line(extraAdults + ' ' + window.siteText(extraAdults === 1 ? 'adulto extra' : 'adultos extra'), extraAdultsCost);
			if (children) html += line(children + ' ' + window.siteText(children === 1 ? 'niño' : 'niños'), childrenCost);

			let total = subtotal;
			if (form.elements.resident.checked) {
				const d = subtotal * RESIDENT_DISC;
				total -= d;
				html += line(window.siteText('Residente (-10 %)'), -d, 'discount');
			}
			if (/^\d{6}$/.test(form.elements.promo.value)) {
				const d = subtotal * PROMO_DISC;
				total -= d;
				html += line(window.siteText('Código promocional (-5 %)'), -d, 'discount');
			}

			$('#sum-lines').innerHTML = html;
			$('#sum-total').textContent = money().format(total);
			const requestId = ++availabilityRequest;
			const availabilityStatus = $('#availability-status');
			availabilityStatus.textContent = 'Comprobando disponibilidad…';
			const query = new URLSearchParams({
				checkin: cin,
				checkout: cout,
				room: roomSelect.value,
				rooms: String(rooms),
				adults: String(adults),
				children: String(children),
				promo: form.elements.promo.value,
				resident: form.elements.resident.checked ? '1' : '0'
			});
			fetch(API_BASE + '/api/availability?' + query.toString())
				.then(function (response) {
					return response.json().then(function (data) {
						if (!response.ok) throw new Error(data.error || 'No se pudo consultar la disponibilidad.');
						return data;
					});
				})
				.then(function (data) {
					if (requestId !== availabilityRequest) return;
					availabilityStatus.textContent = data.available
						? window.siteText('Disponible para estas fechas') + ' (' + data.rooms_available + ' ' +
							window.siteText('habitaciones libres') + '). ' + window.siteText('Precio orientativo de demostración.')
						: window.siteText('No hay disponibilidad suficiente para esas fechas.');
					availabilityStatus.className = data.available ? 'availability-ok' : 'availability-error';
				})
				.catch(function (error) {
					if (requestId !== availabilityRequest) return;
					availabilityStatus.textContent = error.message;
					availabilityStatus.className = 'availability-error';
				});
		}

		form.addEventListener('input', updateSummary);
		form.addEventListener('change', updateSummary);
		// form.reset() no dispara "input", así que se recalcula a mano
		form.addEventListener('reset', function () { setTimeout(updateSummary, 0); });
		window.addEventListener('site-language-change', updateSummary);
		updateSummary();
	}

		/* ---- Reserva de spa, restaurante y actividades ---- */
		const serviceForm = $('#service-booking-form');
		if (serviceForm) {
			const serviceDate = $('#service-date');
			const serviceType = $('#service-type');
			const serviceTime = $('#service-time');
			const serviceGuests = $('#service-guests');
			const serviceStatus = $('#service-booking-status');
			serviceDate.min = toISO(new Date());

			function loadServiceSlots() {
				if (!serviceDate.value) {
					serviceTime.innerHTML = '<option value="">' + window.siteText('Elige una fecha primero') + '</option>';
					return;
				}
				serviceTime.innerHTML = '<option value="">Buscando horas…</option>';
				const query = new URLSearchParams({ service: serviceType.value, date: serviceDate.value });
				fetch(API_BASE + '/api/service-slots?' + query.toString())
					.then(function (response) {
						return response.json().then(function (data) {
							if (!response.ok) throw new Error(data.error || 'No se pudieron consultar las horas.');
							return data;
						});
					})
					.then(function (data) {
						serviceTime.replaceChildren();
						const suitable = data.slots.filter(function (slot) {
							return slot.available >= Number(serviceGuests.value || 1);
						});
						if (!suitable.length) {
							serviceTime.add(new Option(window.siteText('Sin plazas disponibles'), ''));
							return;
						}
						serviceTime.add(new Option(window.siteText('Selecciona una hora'), ''));
						suitable.forEach(function (slot) {
							serviceTime.add(new Option(slot.time + ' (' + slot.available + ' ' + window.siteText('plazas') + ')', slot.time));
						});
					})
					.catch(function (error) {
						serviceTime.replaceChildren(new Option(window.siteText('No se pudieron cargar las horas'), ''));
						serviceStatus.textContent = window.siteText(error.message);
						serviceStatus.className = 'error';
					});
			}

			window.addEventListener('site-language-change', loadServiceSlots);
			serviceDate.addEventListener('change', loadServiceSlots);
			serviceType.addEventListener('change', loadServiceSlots);
			serviceGuests.addEventListener('input', loadServiceSlots);
			serviceForm.addEventListener('submit', function (event) {
				event.preventDefault();
				if (!serviceForm.checkValidity()) {
					serviceForm.reportValidity();
					return;
				}
				const submitButton = serviceForm.querySelector('[type="submit"]');
				submitButton.disabled = true;
				fetch(API_BASE + '/api/service-bookings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: serviceForm.elements.name.value.trim(),
						email: serviceForm.elements.email.value.trim(),
						service: serviceType.value,
						date: serviceDate.value,
						time: serviceTime.value,
						guests: serviceGuests.value,
						notes: serviceForm.elements.notes.value
					})
				})
					.then(function (response) {
						return response.json().then(function (data) {
							if (!response.ok) throw new Error(data.error || 'No se pudo registrar la cita.');
							return data;
						});
					})
					.then(function (data) {
						serviceStatus.textContent = window.siteText(data.message) + ' Referencia: ' + data.reference + '.';
						serviceStatus.className = 'ok';
						serviceForm.reset();
						serviceDate.min = toISO(new Date());
						serviceTime.replaceChildren(new Option(window.siteText('Elige una fecha primero'), ''));
					})
					.catch(function (error) {
						serviceStatus.textContent = window.siteText(error.message || 'No se pudo conectar con el servidor.');
						serviceStatus.className = 'error';
						loadServiceSlots();
					})
					.then(function () { submitButton.disabled = false; });
			});
		}

		/* ---- Servicios: pestañas con imagen ---- */
	const svcTabs = $$('.svc-tab');
	if (svcTabs.length) {
		const explorer = $('#svc-explorer');
		const svcPanels = $$('.svc-panel');
		let svcCurrent = 0;

		function selectService(i, focus) {
			svcCurrent = i;
			svcTabs.forEach(function (tab, n) {
				const on = n === i;
				tab.setAttribute('aria-selected', on);
				tab.tabIndex = on ? 0 : -1;
				svcPanels[n].classList.toggle('active', on);
			});
			if (focus) svcTabs[i].focus();
		}

		function stopAuto() { explorer.classList.remove('auto'); }

		svcTabs.forEach(function (tab, i) {
			tab.addEventListener('click', function () { stopAuto(); selectService(i); });
			tab.addEventListener('keydown', function (e) {
				const last = svcTabs.length - 1;
				let next = null;
				if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
				else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
				else if (e.key === 'Home') next = 0;
				else if (e.key === 'End') next = last;
				if (next !== null) { e.preventDefault(); stopAuto(); selectService(next, true); }
			});
		});

		// Cambio automático: avanza cuando termina la barra de progreso
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) stopAuto();
		explorer.addEventListener('animationend', function (e) {
			if (e.pseudoElement === '::after' && explorer.classList.contains('auto')) {
				selectService((svcCurrent + 1) % svcTabs.length);
			}
		});
	}
	
	/* ---- Año del pie ---- */
	const year = $('#year');
	if (year) year.textContent = new Date().getFullYear();

	/* ---- Filtros de excursiones ---- */
	const excursionList = $('#excursion-list');
	if (excursionList) {
		let category = 'all';
		const duration = $('#excursion-duration');
		const difficulty = $('#excursion-difficulty');
		function filterExcursions() {
			excursionList.querySelectorAll('.excursion-card').forEach(function (card) {
				const visible = (category === 'all' || card.dataset.category === category) &&
					(duration.value === 'all' || card.dataset.duration === duration.value) &&
					(difficulty.value === 'all' || card.dataset.difficulty === difficulty.value);
				card.hidden = !visible;
			});
		}
		$$('.excursion-filter').forEach(function (button) {
			button.addEventListener('click', function () {
				category = button.dataset.filter;
				$$('.excursion-filter').forEach(function (item) {
					const active = item === button;
					item.classList.toggle('active', active);
					item.setAttribute('aria-pressed', active);
				});
				filterExcursions();
			});
		});
		duration.addEventListener('change', filterExcursions);
		difficulty.addEventListener('change', filterExcursions);
	}
})();


/* =====================================================================
   ASISTENTE VIRTUAL (Gemini en la nube + plan B con palabras clave)
   ===================================================================== */
(function () {
	'use strict';

	const API_CHAT = API_BASE + '/chat';
	const TIEMPO_MAX = 30000; // 30 s: Render gratuito puede tardar en "despertar"

	// Plan B: solo usa datos reales del hotel (los mismos que CONTEXTO_HOTEL de servidor.py)
	const BASE_LOCAL = [
		{ claves: ['hola', 'buenas', 'buenos dias'], texto: '¡Hola! Bienvenido al Hotel Princess La Palma. ¿En qué te puedo ayudar?' },
		{ claves: ['piscina'], texto: 'Tenemos 11 piscinas: 7 en la zona general (con piscina infantil y playa de arena artificial) y 4 en Esencia de La Palma (solo adultos +16), una de ellas climatizada en invierno.' },
		{ claves: ['spa', 'masaje', 'tratamiento'], texto: 'El Aqua Princess Spa ofrece circuito de aguas, masajes y tratamientos. Conviene reservar con antelación.' },
		{ claves: ['parking', 'aparcamiento', 'aparcar', 'coche'], texto: 'Sí, el parking es gratuito para huéspedes durante toda la estancia.' },
		{ claves: ['gimnasio', 'gym'], texto: 'Hay gimnasio con equipamiento de cardio y musculación, para huéspedes.' },
		{ claves: ['restaurante', 'bufe', 'comer', 'cenar', 'bar'], texto: 'Contamos con restaurantes con bufé, bar piscina, piano bar y un restaurante con menú de degustación.' },
		{ claves: ['adultos', 'esencia'], texto: 'Esencia de La Palma es la zona exclusiva para mayores de 16 años, con cuatro piscinas.' },
		{ claves: ['nino', 'ninos', 'infantil', 'familia'], texto: 'Tenemos piscina infantil, espacios y actividades para niños, y habitaciones familiares.' },
		{ claves: ['habitacion', 'suite', 'estandar', 'familiar'], texto: 'Tenemos Estándar (22 m²), Familiar Superior (44 m², dos habitaciones comunicadas) y Ocean Suite (44 m², salón y dormitorio). Mira la sección Habitaciones.' },
		{ claves: ['reserva', 'reservar', 'precio', 'tarifa', 'cuesta'], texto: 'Puedes reservar en la sección Reservas; respondemos por email en menos de 24 horas. Los precios se consultan al reservar.' },
		{ claves: ['telefono', 'llamar', 'whatsapp', 'email', 'contacto'], texto: 'Teléfono: +34 922 42 55 11 (lunes a viernes, 09:00-17:00). WhatsApp: 613 48 90 55. Email: hotelPrincessLaPalma@gmail.com.' },
		{ claves: ['donde', 'direccion', 'llegar', 'ubicacion'], texto: 'Estamos en Carretera de la Costa, Cerca Vieja, 10, 38749 Fuencaliente de La Palma.' }
	];

	function respuestaLocal(texto) {
		const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const hit = BASE_LOCAL.find(function (r) {
			return r.claves.some(function (c) { return t.includes(c); });
		});
		const aviso = navigator.onLine ? '' : '(Sin conexión) ';
		return aviso + (hit ? hit.texto : 'No tengo ese dato ahora mismo. Escríbenos por WhatsApp al 613 48 90 55 o llámanos al +34 922 42 55 11.');
	}

	// Convierte **negrita** y las listas con guiones que devuelve Gemini (escapando el HTML)
	function formatear(texto) {
		return texto
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/^\s*[-*] /gm, '• ');
}


	/* ---- Interfaz del chat ---- */
	const chatBtn = document.createElement('button');
	chatBtn.type = 'button';
	chatBtn.className = 'chatbot-floating-btn';
	chatBtn.textContent = '💬 Asistente';
	document.body.appendChild(chatBtn);

	const chatBox = document.createElement('div');
	chatBox.className = 'chatbot-box';
	chatBox.hidden = true;
	chatBox.innerHTML =
		'<div class="chatbot-header">' +
			'<h4>Asistente La Palma Princess</h4>' +
			'<button type="button" id="chatbot-close-btn" aria-label="Cerrar">&times;</button>' +
		'</div>' +
		'<div id="chatbot-messages" class="chatbot-messages-area">' +
			'<div class="msg-bot">¡Hola! Soy el recepcionista virtual del hotel La Palma Princess. ¿En qué te puedo ayudar hoy?</div>' +
		'</div>' +
		'<div class="chatbot-input-area">' +
			'<input type="text" id="chatbot-input" placeholder="Escribe tu pregunta...">' +
			'<button type="button" id="chatbot-send-btn" class="btn btn-small">Enviar</button>' +
		'</div>';
	document.body.appendChild(chatBox);

	chatBtn.addEventListener('click', function () {
		chatBox.hidden = !chatBox.hidden;
		if (!chatBox.hidden) {
			const inputField = document.getElementById('chatbot-input');
			if (inputField) inputField.focus();
		}
	});

	const closeChatBtn = document.getElementById('chatbot-close-btn');
	if (closeChatBtn) {
		closeChatBtn.addEventListener('click', function () { chatBox.hidden = true; });
	}

	function nuevoMensaje(area, clase, texto) {
		const div = document.createElement('div');
		div.className = clase;
		div.textContent = texto;
		area.appendChild(div);
		area.scrollTop = area.scrollHeight;
		return div;
	}

	// Pide la respuesta a la IA (con límite de tiempo); si algo falla, se rechaza la promesa
// Pide la respuesta a la IA (con límite de tiempo); si algo falla, se rechaza la promesa
	function preguntarIA(texto) {
		if (!API_CHAT) return Promise.reject(new Error('sin servidor'));
		const control = new AbortController();
		const temporizador = setTimeout(function () { control.abort(); }, TIEMPO_MAX);
		return fetch(API_CHAT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mensaje: texto }),
			signal: control.signal
		})
			.then(function (res) {
				clearTimeout(temporizador);
				if (!res.ok) throw new Error('HTTP ' + res.status);
				return res.json();
			})
			.then(function (data) {
				if (!data.respuesta) throw new Error('respuesta vacía');
				return data.respuesta;
			})
			.catch(function (err) {
				clearTimeout(temporizador);
				throw err;
			});
	}

	const sendMsg = function () {
		const input = document.getElementById('chatbot-input');
		const msgArea = document.getElementById('chatbot-messages');
		if (!input || !msgArea) return;

		const text = input.value.trim();
		if (!text) return;

		nuevoMensaje(msgArea, 'msg-user', text);
		input.value = '';

		const escribiendo = nuevoMensaje(msgArea, 'msg-bot', 'Escribiendo…');

		preguntarIA(text)
			.then(function (respuesta) {
				escribiendo.innerHTML = formatear(respuesta);
			})
			.catch(function (err) {
				console.warn('Asistente en modo local:', err.message);
				escribiendo.textContent = respuestaLocal(text);
			})
			.then(function () { msgArea.scrollTop = msgArea.scrollHeight; });
	};

	const sendBtn = document.getElementById('chatbot-send-btn');
	const chatInput = document.getElementById('chatbot-input');

	if (sendBtn) sendBtn.addEventListener('click', sendMsg);
	if (chatInput) {
		chatInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') sendMsg();
		});
	}
})();


/* =====================================================================
   PWA: service worker y botón "Instalar app"
   ===================================================================== */
(function () {
	'use strict';

	if ('serviceWorker' in navigator) {
		window.addEventListener('load', function () {
			navigator.serviceWorker.register('sw.js').catch(function (e) { console.error('SW:', e); });
		});
	}

	const yaInstalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
	if (yaInstalada) return;

	const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	const esAndroid = /android/i.test(navigator.userAgent);
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'install-btn';
	btn.textContent = window.siteText('Instalar app');
	btn.setAttribute('aria-haspopup', 'dialog');
	btn.hidden = !esIOS && !esAndroid;
	document.body.appendChild(btn);

	let promptInstalar = null;
	window.addEventListener('beforeinstallprompt', function (e) {
		e.preventDefault();
		promptInstalar = e;
		btn.hidden = false;
	});

	const guide = document.createElement('dialog');
	guide.className = 'install-dialog';
	guide.id = 'install-guide';
	guide.setAttribute('aria-labelledby', 'install-dialog-title');
	btn.setAttribute('aria-controls', guide.id);
	const guideTitle = document.createElement('h2');
	guideTitle.id = 'install-dialog-title';
	guideTitle.textContent = window.siteText('Instala La Palma Princess');
	const guideIntro = document.createElement('p');
	guideIntro.textContent = window.siteText('Agrega esta app a tu pantalla de inicio para abrirla rápidamente.');
	const guideSteps = document.createElement('ol');
	const steps = esIOS
		? [
			'Abre esta página en Safari.',
			'Pulsa Compartir y selecciona «Añadir a pantalla de inicio».',
			'Confirma con «Añadir». Después, abre la app desde tu pantalla de inicio.'
		]
		: esAndroid
			? [
				'Abre el menú del navegador (⋮) y elige «Instalar app» o «Añadir a pantalla de inicio».',
				'Confirma la instalación y abre la app desde tu pantalla de inicio.'
			]
			: ['Usa la opción «Instalar» o «Añadir a pantalla de inicio» del menú del navegador.'];
	steps.forEach(function (step) {
		const item = document.createElement('li');
		item.textContent = window.siteText(step);
		guideSteps.appendChild(item);
	});
	const closeGuide = document.createElement('button');
	closeGuide.type = 'button';
	closeGuide.className = 'install-dialog-close';
	closeGuide.textContent = window.siteText('Cerrar');
	guide.append(guideTitle, guideIntro, guideSteps, closeGuide);
	document.body.appendChild(guide);

	function showInstallGuide() {
		if (!guide.open) guide.showModal();
		closeGuide.focus();
	}

	closeGuide.addEventListener('click', function () { guide.close(); });
	guide.addEventListener('click', function (event) {
		if (event.target === guide) guide.close();
	});

	btn.addEventListener('click', async function () {
		if (promptInstalar) {
			try {
				const installPrompt = promptInstalar;
				promptInstalar = null;
				await installPrompt.prompt();
				const choice = await installPrompt.userChoice;
				if (choice.outcome === 'accepted') btn.hidden = true;
			} catch (error) {
				console.warn('No se pudo mostrar la instalación nativa.', error);
				showInstallGuide();
			}
			return;
		}
		showInstallGuide();
	});

	window.addEventListener('appinstalled', function () {
		btn.hidden = true;
	});
})();
