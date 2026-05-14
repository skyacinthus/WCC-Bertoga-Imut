// GALLERY
function scrollGallery(direction) {
  const gallery = document.getElementById("gallery");
  gallery.scrollBy({ left: direction * 500, behavior: "smooth" });
}


window.addEventListener("DOMContentLoaded", () => {
  fetchRooms();
});

// CHECK-IN FORM, Check Availability button
function checkAvailability() {
  const checkIn = document.getElementById("check-in").value;
  const checkOut = document.getElementById("check-out").value;
  const guests = document.getElementById("guests").value;

  if (!checkIn || !checkOut || !guests) {
    alert("Please fill in all fields.");
    return;
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    alert("Check-out must be after check-in.");
    return;
  }

  fetchRooms(checkIn, checkOut, guests);

  document.getElementById("rooms").scrollIntoView({ behavior: "smooth" });
}

// FETCH ROOMS
async function fetchRooms(checkIn = null, checkOut = null, guests = null) {
  const container = document.getElementById("rooms-list");
  container.innerHTML = "<p>Loading rooms...</p>";

  let url = "/api/rooms";
  if (checkIn && checkOut && guests) {
    url = `/api/rooms/available?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`;
  }

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
      image_url: room.image_url || "",
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
          <i class="fa-solid fa-circle-info"></i> Room ${room.room_number}
        </span>

        <h2>${room.room_type_name}</h2>

        <div class="features">${facilities}</div>

        <div class="meta">
          <span><i class="fa-solid fa-user"></i> ${room.capacity} Persons</span>
        </div>

        <a href="#">Room details</a>
      </div>

      <div class="room-price">
        <p>Price per night</p>
        <h2>IDR ${Number(room.price).toLocaleString("id-ID")}</h2>
        ${nights > 1
          ? `<span>${nights} nights: IDR ${Number(totalPrice).toLocaleString("id-ID")}</span>`
          : "<span>Includes Taxes & Fees</span>"
        }
      <button onclick="selectRoom('${selectionParams}', ${room.id_room_type}, ${!checkIn})">
        Select
      </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function selectRoom(selectionParams, roomId, needsDates) {
  if (needsDates) {
    openDateModal(roomId, selectionParams);
  } else {
    window.location.href = `/booking/selection.html?${selectionParams}`;
  }
}

function calcNights(checkIn, checkOut) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay));
}


// ========================
// SELECT ROOM
// if no dates yet (rooms method), show modal first
// if dates exist (date method), go straight to selection page
// ========================
function selectRoom(selectionParams, roomId, needsDates) {
  if (needsDates) {
    openDateModal(roomId, selectionParams);
  } else {
    window.location.href = `/booking/selection.html?${selectionParams}`;
  }
}

// ========================
// DATE MODAL (rooms method)
// ========================
async function openDateModal(roomId, existingParams) {
  document.getElementById("modal-overlay").style.display = "flex";
  document.getElementById("modal-room-id").value = roomId;
  document.getElementById("modal-existing-params").value = existingParams;

  // fetch booked dates for this room to block them
  try {
    const res = await fetch(`/api/rooms/${roomId}/booked-dates`);
    const bookedDates = await res.json();
    window._bookedDates = bookedDates; // store for validation
  } catch (err) {
    console.error("Failed to fetch booked dates", err);
  }
}

function closeDateModal() {
  document.getElementById("modal-overlay").style.display = "none";
  document.getElementById("modal-check-in").value = "";
  document.getElementById("modal-check-out").value = "";
  document.getElementById("modal-guests").value = "";
}

function confirmModalDates() {
  const checkIn = document.getElementById("modal-check-in").value;
  const checkOut = document.getElementById("modal-check-out").value;
  const guests = document.getElementById("modal-guests").value;
  const roomId = document.getElementById("modal-room-id").value;

  if (!checkIn || !checkOut || !guests) {
    alert("Please fill in all fields.");
    return;
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    alert("Check-out must be after check-in.");
    return;
  }

  // check if selected dates overlap with any booked dates
  const conflict = (window._bookedDates || []).some(b => {
    return new Date(checkIn) < new Date(b.check_out) &&
           new Date(checkOut) > new Date(b.check_in);
  });

  if (conflict) {
    alert("These dates are already booked. Please choose different dates.");
    return;
  }

  const nights = calcNights(checkIn, checkOut);

  // get room data from existing params to rebuild properly
  const existing = new URLSearchParams(document.getElementById("modal-existing-params").value);
  const price = existing.get("price");
  const totalPrice = nights * parseFloat(price);

  const finalParams = new URLSearchParams({
    id_room: roomId,
    room_type: existing.get("room_type"),
    price: price,
    capacity: existing.get("capacity"),
    image_url: existing.get("image_url"),
    nights: nights,
    total_price: totalPrice,
    check_in: checkIn,
    check_out: checkOut,
    guests: guests,
  });

  window.location.href = `/booking/selection.html?${finalParams}`;
}