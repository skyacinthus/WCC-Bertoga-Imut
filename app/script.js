
function scrollGallery(direction) {
  const gallery = document.getElementById("gallery");
  console.log(gallery);

  gallery.scrollBy({
    left: direction * 500,
    behavior: "smooth"
  });
}

async function getRooms() {

  const response = await fetch("/rooms");

  const rooms = await response.json();

  const roomList = document.getElementById("room-list");

  roomList.innerHTML = "";

  rooms.forEach((room) => {

    roomList.innerHTML += `

      <div class="room-card">

        <h2>${room.room_type_name}</h2>

        <p>Room ${room.room_number}</p>

        <p>Status: ${room.status}</p>

        <p>Capacity: ${room.capacity} People</p>

        <p>${room.facilities}</p>

        <h3>Rp ${room.price}</h3>

      </div>

    `;

  });

}

getRooms();

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});