(function () {
	'use strict';

	const $ = function (s) { return document.querySelector(s); };
	const $$ = function (s) { return Array.from(document.querySelectorAll(s)); };

	const root = document.documentElement;
	root.classList.add('js');
	window.addEventListener('load', function () { root.classList.add('loaded'); });
	
		/* ---- Pantalla de carga ---- */
	const loader = $('#loader');
	if (loader) {
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

	/* ---- Cabecera: fondo sólido al hacer scroll ---- */
	const header = $('#header');
	function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();

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
	alternate('.quotes li');
	alternate('.services li');
	alternate('.gallery-item');

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
		const today = new Date().toISOString().split('T')[0];
		checkin.min = today;
		checkout.min = today;
		checkin.addEventListener('change', function () { checkout.min = checkin.value || today; });

		const setStatus = function (msg, type) { status.textContent = msg; status.className = type; };

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			let valid = true;
			form.querySelectorAll('[required]').forEach(function (input) {
				const ok = input.value.trim() !== '' && input.checkValidity();
				input.classList.toggle('invalid', !ok);
				if (!ok) valid = false;
			});
			if (!valid) { setStatus('Revisa los campos marcados en rojo.', 'error'); return; }
			if (checkout.value <= checkin.value) {
				checkout.classList.add('invalid');
				setStatus('La fecha de salida debe ser posterior a la de entrada.', 'error');
				return;
			}
			// Aquí conectarías con tu backend o servicio de reservas (fetch/POST).
			setStatus('Solicitud enviada. Te escribiremos en menos de 24 horas.', 'ok');
			form.reset();
		});
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

	/* ---- Selector de huéspedes y habitaciones ---- */
	const guestsBtn = $('#guests-btn');
	if (guestsBtn) {
		const wrap = guestsBtn.closest('.qb-guests');
		const panel = $('#guests-panel');
		const list = $('#rooms-list');
		const addBtn = $('#add-room');
		const MAX_ROOMS = 4, MAX_ADULTS = 4, MAX_CHILDREN = 3;
		const rooms = [{ adults: 2, children: 0 }];

		function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

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
			list.innerHTML = rooms.map(function (room, i) {
				return '<div class="room-block"><div class="room-title"><strong>Habitación ' + (i + 1) + '</strong>' +
					(i > 0 ? '<button type="button" class="remove-room" data-i="' + i + '">Quitar</button>' : '') + '</div>' +
					stepper('Adultos', 'Desde 12 años', 'adults', i, room.adults, 1, MAX_ADULTS) +
					stepper('Niños', 'Hasta 11 años', 'children', i, room.children, 0, MAX_CHILDREN) + '</div>';
			}).join('');

			const adults = rooms.reduce(function (s, r) { return s + r.adults; }, 0);
			const children = rooms.reduce(function (s, r) { return s + r.children; }, 0);
			guestsBtn.textContent = plural(adults, 'adulto', 'adultos') + ', ' + plural(children, 'niño', 'niños') + ', ' + rooms.length + ' hab.';
			$('#qb-adults').value = adults;
			$('#qb-children').value = children;
			$('#qb-rooms').value = rooms.length;
			addBtn.disabled = rooms.length >= MAX_ROOMS;
		}

		function stepSelector(i, key, d) {
			return '.step[data-i="' + i + '"][data-key="' + key + '"][data-d="' + d + '"]';
		}

		panel.addEventListener('click', function (e) {
			const step = e.target.closest('.step');
			const remove = e.target.closest('.remove-room');
			if (step) {
				const i = step.dataset.i, key = step.dataset.key, d = Number(step.dataset.d);
				const max = key === 'adults' ? MAX_ADULTS : MAX_CHILDREN;
				const min = key === 'adults' ? 1 : 0;
				rooms[i][key] = Math.min(max, Math.max(min, rooms[i][key] + d));
				render();
				// Devuelve el foco al botón pulsado (o a su opuesto si quedó desactivado)
				const same = list.querySelector(stepSelector(i, key, d));
				const other = list.querySelector(stepSelector(i, key, -d));
				const target = same && !same.disabled ? same : other;
				if (target) target.focus();
			} else if (remove) {
				rooms.splice(Number(remove.dataset.i), 1);
				render();
			}
		});

		addBtn.addEventListener('click', function () {
			if (rooms.length < MAX_ROOMS) {
				rooms.push({ adults: 2, children: 0 });
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
			if (field && params.get(name)) field.value = params.get(name);
		});
		if (params.get('resident') === '1' && form.elements.resident) form.elements.resident.checked = true;
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
			if (!nlEmail.value.trim() || !nlEmail.checkValidity()) {
				nlStatus.textContent = 'Escribe un email válido.';
				nlStatus.className = 'error';
				return;
			}
			// Aquí conectarías con tu servicio de newsletter (fetch/POST).
			nlStatus.textContent = 'Listo, te hemos suscrito.';
			nlStatus.className = 'ok';
			newsletter.reset();
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

		/* ---- Mapa de ubicación (Leaflet) ---- */
	const mapaEl = $('#mapa');
	if (mapaEl && window.L) {
		const hotel = [28.503096663660557, -17.873709776845214]; // PROVISIONAL: cámbialas por las reales

		const mapa = L.map('mapa', { scrollWheelZoom: false }).setView(hotel, 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(mapa);

		L.marker(hotel).addTo(mapa)
			.bindPopup('<strong>La Palma Princess</strong><br>Fuencaliente, La Palma')
			.openPopup();

		// Activa el zoom con la rueda solo cuando haces clic en el mapa
		mapa.on('click', function () { mapa.scrollWheelZoom.enable(); });
		mapa.on('mouseout', function () { mapa.scrollWheelZoom.disable(); });
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
		const LAT = 28.47, LON = -17.85; // Fuencaliente (aprox.)
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
		const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

		function parseISO(iso) {
			const p = iso.split('-').map(Number);
			return new Date(p[0], p[1] - 1, p[2]);
		}
		function fmtDate(iso) {
			return parseISO(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
		}
		function num(name, fallback) {
			const v = parseInt(form.elements[name].value, 10);
			return isNaN(v) ? fallback : v;
		}
		function line(label, amount, cls) {
			return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span>' + label + '</span><span>' + money.format(amount) + '</span></li>';
		}

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
			const nightsTxt = nights + (nights === 1 ? ' noche' : ' noches');

			// Datos de la estancia
			$('#sum-in').textContent = fmtDate(cin);
			$('#sum-out').textContent = fmtDate(cout);
			$('#sum-nights').textContent = nights;
			$('#sum-room').textContent = roomSelect.value;
			$('#sum-rooms').textContent = rooms;
			$('#sum-guests').textContent = adults + (adults === 1 ? ' adulto' : ' adultos') +
				(children ? ', ' + children + (children === 1 ? ' niño' : ' niños') : '');

			// Cálculo
			const base = nights * rooms * price;
			const extraAdults = Math.max(0, adults - 2 * rooms);
			const extraAdultsCost = extraAdults * EXTRA_ADULT * nights;
			const childrenCost = children * CHILD * nights;
			const subtotal = base + extraAdultsCost + childrenCost;

			let html = line(nightsTxt + ' × ' + rooms + (rooms === 1 ? ' hab.' : ' hab.') + ' × ' + money.format(price), base);
			if (extraAdults) html += line(extraAdults + (extraAdults === 1 ? ' adulto extra' : ' adultos extra'), extraAdultsCost);
			if (children) html += line(children + (children === 1 ? ' niño' : ' niños'), childrenCost);

			let total = subtotal;
			if (form.elements.resident.checked) {
				const d = subtotal * RESIDENT_DISC;
				total -= d;
				html += line('Residente (-10 %)', -d, 'discount');
			}
			if (/^\d{6}$/.test(form.elements.promo.value)) {
				const d = subtotal * PROMO_DISC;
				total -= d;
				html += line('Código promocional (-5 %)', -d, 'discount');
			}

			$('#sum-lines').innerHTML = html;
			$('#sum-total').textContent = money.format(total);
		}

		form.addEventListener('input', updateSummary);
		form.addEventListener('change', updateSummary);
		// form.reset() no dispara "input", así que se recalcula a mano
		form.addEventListener('reset', function () { setTimeout(updateSummary, 0); });
		updateSummary();
	}
	
	/* ---- Año del pie ---- */
	const year = $('#year');
	if (year) year.textContent = new Date().getFullYear();
})();
