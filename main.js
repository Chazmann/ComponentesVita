async function cargarVista(url, botonActivo = null) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al cargar ${url}: ${response.statusText}`);
    }
    const html = await response.text();
    const container = document.getElementById("dvContainer");
    container.innerHTML = html;

    // Gestionar el estado activo del botón (icono)
    document.querySelectorAll(".btn.btn-secondary").forEach((btn) => {
      const icono = btn.querySelector(".fa-arrow-right");
      if (icono) icono.remove();
    });

    if (botonActivo) {
      const icon = document.createElement("i");
      icon.className = "fa fa-arrow-right me-2";
      botonActivo.prepend(icon);
    }

    // Si la vista cargada es la de los gráficos, se llama a su función de inicialización.
    // Es necesario que el archivo 'graficarSignosVitales.js' exponga esta función.
    if (
      url === "GsignosVitales.html" &&
      typeof initGraficosSignosVitales === "function"
    ) {
      initGraficosSignosVitales();
    }
    if (url === "ResumenHCEmer.html") {
      cargarPartialsResumenHCEmer();
      
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById(
      "dvContainer"
    ).innerHTML = `<p>No se pudo cargar el contenido de <strong>${url}</strong>.</p>`;
  }

  document.body.classList.remove("bg-emer", "bg-ambulatorio");

if (url.includes("ResumenHCEmer.html")) {
    document.body.classList.add("bg-emer");
} else {
    document.body.classList.add("bg-ambulatorio");
}
}

// Cargar SignosVitales.html por defecto al cargar la página
window.onload = function () {
  const tercerBoton = document.querySelector(
    'button[onclick*="ResumenHCEmer.html"]'
    
  );
  document.body.classList.add("bg-emer");
  cargarVista("ResumenHCEmer.html", tercerBoton);
};

function cargarPartialsResumenHCEmer() {
  const partials = [
    "_1resEvoluciones.html",
    "_2resBalance.html",
    "_3resAntecedentes.html",
    "_4resEstudios.html",
    "_5resMedHabitual.html",
  ];

  const container = document.getElementById("resumenHCEmergencias");
  if (!container) {
    console.error("No se encontró el contenedor #resumenHCEmergencias");
    return;
  }

  partials.forEach((file) => {
    fetch(`./Views/${file}`)
      .then((response) => response.text())
      .then((html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        container.appendChild(temp.firstElementChild);
      })
      .catch((error) => console.error(`Error cargando ${file}:`, error));
  });
}
