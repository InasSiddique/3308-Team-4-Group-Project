const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── state ──
let selectedTabIndex = 0;
let selectedDayIndex = 0;

function getTodayIndex(dates) {
	const today = new Date();
	today.setHours(12, 0, 0, 0);
	for (let i = 0; i < dates.length; i++) {
		if (new Date(dates[i] + 'T12:00:00').toDateString() === today.toDateString()) return i;
	}
	return 0;
}

function fmtTime(t) {
	const [h, m] = t.split(':').map(Number);
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hr = h % 12 || 12;
	return m === 0 ? `${hr} ${ampm}` : `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isOpenNow(dayKey, menuData) {
	const h = menuData.hours[dayKey];
	if (!h || !h.enabled) return false;
	const now = new Date();
	const [sh, sm] = h.start.split(':').map(Number);
	const [eh, em] = h.end.split(':').map(Number);
	const mins = now.getHours() * 60 + now.getMinutes();
	return mins >= sh * 60 + sm && mins < eh * 60 + em;
}

// ── status badge ──
function renderStatus(menuData, dates) {
	const d = new Date(dates[selectedDayIndex] + 'T12:00:00');
	const dayKey = DAY_KEYS[d.getDay()];
	console.log(dayKey);
	console.log(menuData[dayKey + "_start"])
	const h = {
		"enabled": menuData[dayKey + "_enabled"],
		"start": menuData[dayKey + "_start"],
		"end": menuData[dayKey + "_end"],
	}
	// menuData.hours[dayKey];

	const badge = document.getElementById('statusBadge');
	const isToday = selectedDayIndex === getTodayIndex(dates);
	const open = isToday && isOpenNow(dayKey);
	badge.textContent = open ? 'Open Now' : (h && h.enabled ? (isToday ? 'Closed' : (h.start ? fmtTime(h.start) + ' – ' + fmtTime(h.end) : 'Closed')) : 'Closed');
	badge.style.background = open ? '#2a6e2a' : '#b85c00';
}

// ── tabs ──
function renderTabs(menuData, dates) {
	const el = document.getElementById('stationTabs');
	el.innerHTML = '';
	menuData.active_menu_types.forEach((mt, i) => {
		const btn = document.createElement('button');
		btn.className = 'tab' + (i === selectedTabIndex ? ' active' : '');
		btn.setAttribute('role', 'tab');
		btn.setAttribute('aria-selected', i === selectedTabIndex ? 'true' : 'false');
		btn.textContent = mt.name;
		btn.addEventListener('click', () => {
			selectedTabIndex = i;
			renderTabs(menuData, dates); renderWeekHeader(menuData, dates); renderMenu(menuData);
		});
		el.appendChild(btn);
	});
}

// ── week header ──
function renderWeekHeader(menuData, dates) {
	const el = document.getElementById('weekHeader');
	el.innerHTML = '';

	// Date range label
	const s = new Date(dates[0] + 'T12:00:00'), e = new Date(dates[6] + 'T12:00:00');
	document.getElementById('dateRangeLabel').textContent =
		`${MONTH_NAMES[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;

	dates.forEach((dateStr, i) => {
		const d = new Date(dateStr + 'T12:00:00');
		const mt = menuData.active_menu_types[selectedTabIndex].data;
		// const hasItems = mt.days[i].stations.some(s => s.items.length > 0);

		const btn = document.createElement('button');
		btn.className = 'day-col' + (i === selectedDayIndex ? ' active' : '') // + (!hasItems ? ' no-menu' : '');
		btn.setAttribute('aria-pressed', i === selectedDayIndex ? 'true' : 'false');
		btn.setAttribute('aria-label', `${DAY_NAMES[d.getDay()]} ${MONTH_NAMES_LONG[d.getMonth()]} ${d.getDate()}`);
		btn.innerHTML = `
							<div class="day-name">${DAY_NAMES[d.getDay()]}</div>
							<div class="day-num-wrap"><div class="day-num">${d.getDate()}</div></div>`;
		btn.addEventListener('click', () => {
			selectedDayIndex = i;
			// Update date input display
			const sd = new Date(dates[i] + 'T12:00:00');
			document.getElementById('selectedDateDisplay').textContent =
				`${sd.getMonth() + 1}/${sd.getDate()}/${sd.getFullYear()}`;
			renderWeekHeader(menuData, dates); renderMenu(menuData); renderStatus(menuData, dates);
		});
		el.appendChild(btn);
	});

	// Init date display
	const sd = new Date(dates[selectedDayIndex] + 'T12:00:00');
	document.getElementById('selectedDateDisplay').textContent =
		`${sd.getMonth() + 1}/${sd.getDate()}/${sd.getFullYear()}`;
}

// ── tags ──
const ALLERGENS = new Set(['Milk', 'Egg', 'Wheat', 'Soy', 'Peanuts', 'Tree Nuts', 'Sesame', 'Shellfish', 'Fish', 'Gluten']);
function tagsHTML(icons) {
	return icons.map(icon => {
		if (icon === 'Vegan') return `<span class="tag tag-vegan">Vegan</span>`;
		if (icon === 'Vegetarian') return `<span class="tag tag-veg">Vegetarian</span>`;
		if (icon === 'Smart Pick' || icon === "Dietitian's Pick") return `<span class="tag tag-smart">✦ Smart Pick</span>`;
		if (icon === 'Pork') return `<span class="tag tag-pork">Pork</span>`;
		if (ALLERGENS.has(icon)) return `<span class="tag tag-allergen">${icon}</span>`;
		return '';
	}).join('');
}

// ── menu ──
function renderMenu(menuData) {
	const el = document.getElementById('menuContent');
	const mt = menuData.active_menu_types[selectedTabIndex].data;
	const day = mt.days[selectedDayIndex];
	const stations = [day] //.stations.filter(s => s.items.length > 0);

	if (!stations.length) {
		el.innerHTML = `
										<div class="empty-state" role="status" aria-live="polite">
										<div class="empty-icon" aria-hidden="true">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A2A4A3" stroke-width="1.5">
										<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
										<line x1="10" y1="11" x2="10" y2="17"/>
										<line x1="14" y1="11" x2="14" y2="17"/>
										</svg>
										</div>
										<p>No menu available for this day</p>
										<span>Check back closer to the service date or select another day</span>
										</div>`;
		return;
	}

	el.innerHTML = stations.map(station => `
									<div class="station-block">
									<div class="station-name">${station.name}</div>
									<div class="station-items">
									${station.menu_items.map(item => `
									<div class="food-item">
									<div class="food-item-left">
									<div class="food-name">${item.food?.name}</div>
									<div class="food-tags">${/*tagsHTML(item.icons)*/""}</div>
									</div>
									${item.cal ? `<div class="food-calories">${item.cal} cal</div>` : ''}
									</div>`).join('')}
									</div>
									</div>`).join('');
}

async function getMenuDataAndRender() {
	const response = await fetch("/getWeeklyMenu?" + new URLSearchParams({ location: "center-for-community" }), {
		method: "GET",
	});

	let menuJson = await response.json()
	let menuData = menuJson.data;

	console.log(menuData);
	console.log(menuData.active_menu_types[0].data);

	let dates = menuData.active_menu_types[0].data.days.map(d => d.date);

	// selectedDayIndex = getTodayIndex(dates);

	renderStatus(menuData, dates);
	renderTabs(menuData, dates);
	renderWeekHeader(menuData, dates);
	renderMenu(menuData);
}

// ── init ──
getMenuDataAndRender();

document.getElementById('prevWeek').addEventListener('click', () => {
	alert('Navigation to other weeks requires a live API connection.');
});
document.getElementById('nextWeek').addEventListener('click', () => {
	alert('Navigation to other weeks requires a live API connection.');
});
