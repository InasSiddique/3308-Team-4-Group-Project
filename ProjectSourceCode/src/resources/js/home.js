const CACHE_NAME = "cache-v1"

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// menus to ignore.
const BLACKLISTED_MENUS = ["c4c-meal-of-the-day", 'vc-meal-of-the-day']
// food categories to ignore
const BLACKLISTED_CATEGORIES = ['condiment', 'fruit', 'snack', 'salad', 'other', 'grain', 'beverage']

// ── state ──
let menuData = null;
let dates = null;
// selectedTabIndex of -1 means the ALL tab
let selectedTabIndex = -1;
let selectedDayIndex = 0;
let locationSlug = "center-for-community";

let targetDate = new Date()

let filters = {
  name: "",
  tags: new Set()
}

function getTodayIndex() {
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

function isOpenNow(dayKey) {
  const h = {
    "enabled": menuData[dayKey + "_enabled"],
    "start": menuData[dayKey + "_start"],
    "end": menuData[dayKey + "_end"],
  }
  if (!h || !h.enabled) return false;
  const now = new Date();
  const [sh, sm] = h.start.split(':').map(Number);
  const [eh, em] = h.end.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= sh * 60 + sm && mins < eh * 60 + em;
}

// ── status badge ──
function renderStatus() {
  const d = new Date(dates[selectedDayIndex] + 'T12:00:00');
  const dayKey = DAY_KEYS[d.getDay()];
  const h = {
    "enabled": menuData[dayKey + "_enabled"],
    "start": menuData[dayKey + "_start"],
    "end": menuData[dayKey + "_end"],
  }
  // menuData.hours[dayKey];

  const badge = document.getElementById('statusBadge');
  const isToday = selectedDayIndex === getTodayIndex();
  const open = isToday && isOpenNow(dayKey);
  badge.textContent = h && h.enabled ? ((h.start ? fmtTime(h.start) + ' – ' + fmtTime(h.end) : 'Closed')) : "Closed";
  badge.style.background = open ? '#2a6e2a' : '#b85c00';

  const openBadge = document.getElementById('openNowBadge');
  openBadge.style.display = open ? "block" : "none";
  openBadge.style.background = open ? "#2a6e2a" : "#b85c00";
}

// ── tabs ──
function renderTabs() {
  const el = document.getElementById('stationTabs');
  el.innerHTML = '';
  // ensure we are copying the array
  const tabs = menuData.active_menu_types.map(e => e);
  tabs.unshift({ name: "All" })

  // assign All tab an index of -1.
  tabs.forEach((mt, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i - 1 === selectedTabIndex ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i - 1 === selectedTabIndex ? 'true' : 'false');
    btn.textContent = mt.name;
    btn.addEventListener('click', () => {
      selectedTabIndex = i - 1;
      renderTabs(); renderWeekHeader(); renderMenu();
    });
    el.appendChild(btn);
  });
}

// ── week header ──
function renderWeekHeader() {
  const el = document.getElementById('weekHeader');
  el.innerHTML = '';

  // Date range label
  const s = new Date(dates[0] + 'T12:00:00'), e = new Date(dates[6] + 'T12:00:00');
  document.getElementById('dateRangeLabel').textContent =
    `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;

  dates.forEach((dateStr, i) => {
    const d = new Date(dateStr + 'T12:00:00');
    // const mt = menuData.active_menu_types[selectedTabIndex].data;
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
      renderWeekHeader(); renderMenu(); renderStatus();
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
const TAGS = new Set(['Vegan', 'Vegetarian', 'Pork', ...ALLERGENS]);
function tagsHTML(icons) {
  if (icons == undefined) return "";

  return icons.map(icon => {
    if (icon.name === 'Vegan') return `<span class="tag tag-vegan">Vegan</span>`;
    if (icon.name === 'Vegetarian') return `<span class="tag tag-veg">Vegetarian</span>`;
    // if (icon.name === 'Smart Pick' || icon.name === "Dietitian's Pick") return `<span class="tag tag-smart">✦ Smart Pick</span>`;
    if (icon.name === 'Pork') return `<span class="tag tag-pork">Pork</span>`;
    if (ALLERGENS.has(icon.name)) return `<span class="tag tag-allergen">${icon.name}</span>`;
    return '';
  }).join('');
}

function createElement(element, elementClass, innerHTML = "") {
  let elt = document.createElement(element);
  elt.className = elementClass;
  elt.innerHTML = innerHTML;
  return elt;
}

function createFoodItem(food) {
  let foodItem = createElement('div', 'food-item');
  let foodItemLeft = createElement('div', 'food-item-left');
  foodItem.appendChild(foodItemLeft);

  foodItemLeft.appendChild(createElement('div', 'food-name', food?.name))
  foodItemLeft.appendChild(createElement('div', 'food-tags', tagsHTML(food?.icons?.food_icons)))

  foodItem.appendChild(createElement('div', 'food-calories', food?.rounded_nutrition_info?.calories))

  return foodItem;
}

function createSection(name) {
  let section = createElement('div', 'station-section');
  let header = createElement('div', 'station-section-name active', name);
  let collapse = createElement('div', 'station-section-content');

  header.addEventListener('click', () => {
    collapse.classList.toggle('collapsed');
    header.classList.toggle('collapse-active');
  });

  section.appendChild(header);
  section.appendChild(collapse);

  return section;
}

function renderMenu() {
  const el = document.getElementById('menuContent');
  el.innerHTML = "";
  const stations = selectedTabIndex <= -1 ? menuData.active_menu_types : [menuData.active_menu_types[selectedTabIndex]];
  // const day = mt.days[selectedDayIndex];
  // const stations = [day] //.stations.filter(s => s.items.length > 0);
  for (let station of stations) {
    let stationBlock = createElement('div', 'station-block')
    stationBlock.appendChild(createElement('div', 'station-name', station.name))

    let stationItems = createElement('div', 'station-items');

    let section = null;
    let sectionCollapse = null;
    // keep track of empty sections to avoid adding
    let sectionHasChildren = false;

    for (let item of station.data.days[selectedDayIndex].menu_items) {
      if (BLACKLISTED_CATEGORIES.includes(item.category)) continue;

      if (item.is_section_title) {
        if (section != null && sectionHasChildren) {
          stationBlock.appendChild(section);
        }
        section = createSection(item.text);
        sectionCollapse = section.lastElementChild;
        sectionHasChildren = false;
        continue;
      }

      if (item.food == null) continue;

      let parent = section != null ? sectionCollapse : stationItems;
      if (section) sectionHasChildren = true;
      parent.appendChild(createFoodItem(item.food));
    }

    stationBlock.appendChild(stationItems);

    el.appendChild(stationBlock);
  }


  filterItems(filters);
}

async function getLocationsAndRender() {
  let locationsData = await fetchWithCache("/getLocations", { method: "GET" });

  let locationSelect = document.getElementById("location-select");
  locationSelect.innerHTML = "";

  for (let location of locationsData.data) {
    let btn = document.createElement('button');
    btn.classList.add('w-100')
    btn.innerText = location.name;

    btn.onclick = () => {
      locationSlug = location.slug;
      getMenuDataAndRender(targetDate);
      locationSelect.classList.add("d-none");
      document.getElementById("location-header").classList.remove("open");
    };

    locationSelect.appendChild(btn);
  }
}

async function fetchWithCache(url, options) {
  let cache = await caches.open(CACHE_NAME);

  let cacheResponse = await cache.match(url + ".json");
  let cacheJson = await cacheResponse?.json();

  if (cacheJson) {
    console.log(`Fetched data for ${url} from cache`)
    return cacheJson;
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new TypeError("bad response");
  }

  let responseJson = await response.json();
  const jsonResponse = new Response(JSON.stringify(responseJson), {
    headers: { 'content-type': 'application/json' }
  });

  await cache.put(`${url}.json`, jsonResponse);

  return responseJson;
}

function updateUrlWithLocation() {
  const url = new URL(window.location.href);
  url.searchParams.set("location", locationSlug);

  history.pushState({}, '', url);
}

function loadQueryParams() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("location")) return;
  locationSlug = url.searchParams.get("location");
}

async function getMenuDataAndRender(date) {
  // round date to nearest day to help cache requests
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  updateUrlWithLocation();

  let menuJson = await fetchWithCache("/getWeeklyMenu?" + new URLSearchParams({ location: locationSlug, date: date }), {
    method: "GET",
  })
  menuData = menuJson.data;

  document.getElementById("location-header").innerText = menuData.name;

  menuData.active_menu_types = menuData.active_menu_types.filter(t => !BLACKLISTED_MENUS.includes(t.slug))

  console.log(menuData);
  console.log(menuData.active_menu_types[0].data);

  dates = menuData.active_menu_types[0].data.days.map(d => d.date);

  selectedDayIndex = getTodayIndex();

  renderStatus();
  renderTabs();
  renderWeekHeader();
  renderMenu();
}

// ── init ──
loadQueryParams();
getLocationsAndRender();
getMenuDataAndRender(targetDate);

const locationHeader = document.getElementById('location-header')
const locationSelect = document.getElementById('location-select')

document.addEventListener('click', (e) => {
  locationHeader.classList.remove('open')
  locationSelect.classList.add("d-none");
});

document.getElementById('prevWeek').addEventListener('click', () => {
  targetDate.setDate(targetDate.getDate() - 7);
  getMenuDataAndRender(targetDate);
});
document.getElementById('nextWeek').addEventListener('click', () => {
  targetDate.setDate(targetDate.getDate() + 7);
  getMenuDataAndRender(targetDate);
});

document.getElementById("location-header").addEventListener('click', (e) => {
  locationSelect.classList.toggle("d-none");
  locationHeader.classList.toggle("open");
  e.stopPropagation();
})

function filterItems() {
  let foodItems = document.getElementsByClassName('food-item');

  for (let foodItem of foodItems) {
    let foodName = foodItem.querySelector(".food-name");


    // filter by tag
    let foodTags = [...foodItem.querySelectorAll(".tag")].map(e => e.textContent.toLowerCase());
    if (foodTags.some(tag => filters.tags.has(tag))) {
      foodItem.classList.add('d-none');
      continue;
    }

    // filter by name
    let foodText = foodName.textContent.toLowerCase();
    let nameLower = filters.name.toLowerCase();

    let match = foodText.includes(nameLower);

    if (match) {
      foodItem.classList.remove('d-none');
    } else {
      foodItem.classList.add('d-none');
    }
  }
}

document.getElementById("item-search").addEventListener('input', (event) => {
  filters.name = event.target.value.toLowerCase();
  filterItems();
})

const filterButton = document.getElementById('filter-button');
const filterMenu = document.getElementById('filter-menu');

function toggleFilterTag(key) {
  if (filters.tags.has(key)) {
    filters.tags.delete(key);
    return;
  }
  filters.tags.add(key);
}

function createTagButton(tag) {
  tag = tag.toLowerCase();
  let btn = document.createElement('span')
  btn.innerText = tag;
  btn.addEventListener('click', () => {
    toggleFilterTag(tag);
    btn.classList.toggle("inactive")
    filterItems();
  });
  btn.classList.add('filter-button');
  filterMenu.appendChild(btn);
}

function createTagButtons() {
  for (let tag of TAGS) {
    createTagButton(tag);
  }
}

filterButton.addEventListener('click', (e) => {
  filterMenu.classList.toggle('d-none');
  e.stopPropagation();
});

createTagButtons();
