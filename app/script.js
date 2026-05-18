// GALLERY
function scrollGallery(direction) {
  const gallery = document.getElementById("gallery");
  gallery.scrollBy({ left: direction * 500, behavior: "smooth" });
}


window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ci = urlParams.get("check_in");
  const co = urlParams.get("check_out");
  const g  = urlParams.get("guests");

  if (ci) document.getElementById("check-in").value = ci;
  if (co) document.getElementById("check-out").value = co;
  if (g)  document.getElementById("guests").value = g;

  if (ci && co && g) {
    fetchRooms(ci, co, g);
  } else {
    fetchRooms();
  }
});

// CHECK-IN FORM, Check Availability button
function checkAvailability() {
  const checkIn  = document.getElementById("check-in")?.value || null;
  const checkOut = document.getElementById("check-out")?.value || null;
  const guests   = document.getElementById("guests")?.value || null;
  const building = document.getElementById("building")?.value || null;

  if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
    showToast("Check-out must be after check-in.", "error");
    return;
  }

  fetchRooms(checkIn, checkOut, guests, building);
  document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
}

// FETCH ROOMS
async function fetchRooms(checkIn = null, checkOut = null, guests = null, building = null) {
  const container = document.getElementById("rooms-list");
  container.innerHTML = "<p>Loading rooms...</p>";

  const params = new URLSearchParams();

  let url = "/api/rooms";
  if (checkIn && checkOut) {
    url = "/api/rooms/available";
    params.set("check_in", checkIn);
    params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
  }

  if (building && building !== "") {
    params.set("building", building);
  }
  const query = params.toString();
  if (query) url += `?${query}`;

  try {
    const res = await fetch(url);
    const rooms = await res.json();
    renderRooms(rooms, checkIn, checkOut, guests);
  } catch (err) {
    container.innerHTML = "<p>Failed to load rooms. Please try again.</p>";
    console.error(err);
  }
}

function renderRooms(rooms, checkIn, checkOut, guests) {
  const container = document.getElementById("rooms-list");
  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = `<p>No rooms available for the selected dates.</p>`;
    return;
  }

  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 1;

  rooms.forEach((room) => {
    const facilities = room.facilities
      ? room.facilities.split(",").map(f =>
          `<span><i class="fa-solid fa-check"></i> ${f.trim()}</span>`
        ).join("")
      : "";

    const totalPrice = nights * room.price;

    const selectionParams = new URLSearchParams({
      id_room_type: room.id_room_type,
      room_type: room.room_type_name,
      price: room.price,
      capacity: room.capacity,
      facilities: room.facilities || "",
      image_url: room.image_url || "",
      building: room.building,
      nights: nights,
      total_price: totalPrice,
      ...(checkIn && { check_in: checkIn }),
      ...(checkOut && { check_out: checkOut }),
      ...(guests && { guests: guests }),
    });

    const card = document.createElement("div");
    card.className = "room-card";
    card.innerHTML = `
      <img src="${room.image_url || "public/img1.jpg"}" alt="${room.room_type_name}">

      <div class="room-info">
        <span class="badge">
          <span style="display: flex; flex-direction: row; gap: 10px">
            <i class="fa-solid fa-location-dot"></i> 
            <span>${room.building}</span>
          </span>
        </span>

        <h2>${room.room_type_name}</h2>

        <div class="features">${facilities}</div>

        <div class="meta">
          <span style="display: flex; flex-direction: row; gap: 5px">
            <i class="fa-solid fa-user"></i> 
            ${room.capacity} 
            <span>Persons</span>
            </span>
        </div>

      </div>

      <div class="room-price">
        <p>Price per night</p>
        <h2>IDR ${Number(room.price).toLocaleString("id-ID")}</h2>
        ${nights > 1
          ? `<span>${nights} nights: IDR ${Number(totalPrice).toLocaleString("id-ID")}</span>`
          : "<span>Includes Taxes & Fees</span>"
        }
      <button onclick="selectRoom('${selectionParams}')">
        Select
      </button>
      </div>
    `;

    container.appendChild(card);
  });
}

async function selectRoom(selectionParams) {
  const checkIn  = document.getElementById("check-in")?.value || null;
  const checkOut = document.getElementById("check-out")?.value || null;

  if (checkIn && checkOut) {
    // dates already filled, check availability first
    const existing = new URLSearchParams(selectionParams);
    const roomTypeId = existing.get("id_room_type");
    const guests = document.getElementById("guests")?.value || 1;
    const nights = calcNights(checkIn, checkOut);
    const building = document.getElementById("building")?.value || null;
    const totalPrice = nights * parseFloat(existing.get("price"));

    try {
      const res = await fetch(`/api/rooms/available?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}${building ? `&building=${building}` : ""}`);      
      const availableRooms = await res.json();
      const isAvailable = availableRooms.some(r => r.id_room_type == roomTypeId);

      if (!isAvailable) {
        showToast("Sorry, this room is not available for the selected dates. Please choose different dates.", "error");
        return;
      }

      existing.set("check_in", checkIn);
      existing.set("check_out", checkOut);
      existing.set("guests", guests);
      existing.set("nights", nights);
      existing.set("total_price", totalPrice);
      window.location.href = `/booking/selection.html?${existing.toString()}`;

    } catch (err) {
      console.error(err);
      showToast("Failed to check availability. Please try again.", "error");
    }

  } else {
    // no dates yet, open modal
    document.getElementById("modal-params").value = selectionParams;
    document.getElementById("modal-overlay").style.display = "flex";
  }
}

function calcNights(checkIn, checkOut) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay));
}

function closeDateModal() {
  document.getElementById("modal-overlay").style.display = "none";
  document.getElementById("modal-check-in").value = "";
  document.getElementById("modal-check-out").value = "";
}

async function confirmModalDates() {
  const checkIn  = document.getElementById("modal-check-in").value;
  const checkOut = document.getElementById("modal-check-out").value;
  const existing = new URLSearchParams(document.getElementById("modal-params").value);
  const roomTypeId = existing.get("id_room_type");


  if (!checkIn || !checkOut) {
    showToast("Please fill in both dates.", "error");
    return;
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    showToast("Check-out must be after check-in.", "error");
    return;
  }

  try {
    const res = await fetch(`/api/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
    const availableRooms = await res.json();
    const isAvailable = availableRooms.some(r => r.id_room_type == roomTypeId);

  if (!isAvailable) {
      showToast("Sorry, this room is not available for the selected dates. Please choose different dates.", "error");
      return;
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to check availability. Please try again.", "error");
    return;
  }

  const nights = calcNights(checkIn, checkOut);
  const totalPrice = nights * parseFloat(existing.get("price"));

  existing.set("check_in", checkIn);
  existing.set("check_out", checkOut);
  existing.set("nights", nights);
  existing.set("total_price", totalPrice);
  existing.set("guests", document.getElementById("guests")?.value || 1);
  const b = document.getElementById("building")?.value;
  if (b) existing.set("building", b);

  window.location.href = `/booking/selection.html?${existing.toString()}`;
}
//SCROLL AWARE NAVBAR
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');

  if (window.innerWidth > 768) {

    if (window.scrollY > 50) {
      nav.style.width = 'calc(100% - 80px)';
      nav.style.top = '20px';
      nav.style.borderRadius = '20px';
    } else {
      nav.style.width = '100%';
      nav.style.top = '0px';
      nav.style.borderRadius = '0px';
    }

  }
});

function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `show ${type}`;
  setTimeout(() => toast.className = "", 3000);

}
// FOOTER LOCATION SWITCH
const footerLocations = {

  alodie1: {
    address: `
      Jl. Wijaya Kusuma, Dero,
      Condongcatur, Kec. Depok,
      Kabupaten Sleman,
      Daerah Istimewa Yogyakarta 55281
    `,

    map: "https://maps.google.com/maps?q=-7.7528351,110.4098662&z=17&output=embed"
  },

alodie2: {
  address: `
    Jl. Alodie 2,
    Sleman,
    Daerah Istimewa Yogyakarta
  `,
  map: "https://maps.google.com/maps?q=-7.7562536,110.391681&z=17&output=embed"
}

};

function changeLocation(location) {

  // CHANGE ADDRESS
  document.getElementById("footer-address").innerHTML =
    footerLocations[location].address;

  // CHANGE MAP
  document.getElementById("footer-map").src =
    footerLocations[location].map;

  // ACTIVE BUTTON
  document.getElementById("btn-alodie1").classList.remove("active");
  document.getElementById("btn-alodie2").classList.remove("active");

  document.getElementById(`btn-${location}`).classList.add("active");
}

// MOBILE NAVBAR
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  document.body.classList.toggle("menu-open");
});

// CLOSE MENU WHEN CLICK LINK
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    document.body.classList.remove("menu-open");
  });
});