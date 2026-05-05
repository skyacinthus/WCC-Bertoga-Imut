console.log("JS go go!");

function scrollGallery(direction) {
  const gallery = document.getElementById("gallery");
  console.log(gallery);

  gallery.scrollBy({
    left: direction * 250,
    behavior: "smooth"
  });
}