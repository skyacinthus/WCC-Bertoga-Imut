// GALLERY
function scrollGallery(direction) {
  const gallery = document.getElementById("gallery");
  gallery.scrollBy({ left: direction * 500, behavior: "smooth" });
}

// ========================
// DATE FORM — Check Availability button
// ========================
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

  document.getElementById("rooms").scrollIntoView({ behavior: "smooth" });
}

