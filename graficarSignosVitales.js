const registrosSignosVitales = [
  {
    "fecha": "2025-08-04T08:30:00",
    "profesional": "Dr. Bizzotto Pablo",
    "signos_vitales": {
      "FC": 78,
      "PA": "120/80",
      "Temp": 36.7,
      "FR": 16,
      "SpO2": 98,
      "GLC": 92
    }
  },
  {
    "fecha": "2025-08-03T14:15:00",
    "profesional": "Enf. Villavicencio Antonella",
    "signos_vitales": {
      "FC": 84,
      "PA": "130/85",
      "Temp": 37.2,
      "FR": 18,
      "SpO2": 97,
      "GLC": 104
    }
  },
  {
    "fecha": "2025-08-02T09:00:00",
    "profesional": "Dr. Damián Calvo",
    "signos_vitales": {
      "FC": 72,
      "PA": "115/75",
      "Temp": 39.5,
      "FR": 15,
      "SpO2": 99,
      "GLC": 88
    }
  },
  {
    "fecha": "2025-08-01T17:45:00",
    "profesional": "Enf. Villavicencio Antonella",
    "signos_vitales": {
      "FC": 90,
      "PA": "140/90",
      "Temp": 37.8,
      "FR": 20,
      "SpO2": 95,
      "GLC": 110
    }
  },
  {
    "fecha": "2025-07-31T11:00:00",
    "profesional": "Dra. Magdalena Princz",
    "signos_vitales": {
      "FC": 76,
      "PA": "125/82",
      "Temp": 36.9,
      "FR": 17,
      "SpO2": 96,
      "GLC": 99
    }
  },
  {
     "fecha": "2025-07-30T11:00:00",
    "profesional": "Dra. Magdalena Princz",
    "signos_vitales": {
      "FC": 62,
      "PA": "110/82",
      "Temp": 36.0,
      "FR": 22,
      "SpO2": 90,
      "GLC": 99
    }
  }
]

/**
 * Función principal que inicializa la vista de los gráficos de signos vitales.
 * Esta función debe ser llamada después de que el HTML de GsignosVitales.html se haya cargado en el DOM.
 */
function initGraficosSignosVitales() {
    // Ordenamos los registros de más reciente a más antiguo y los guardamos globalmente.
    window.registrosGlobal = registrosSignosVitales.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    window.parametrosSeleccionados = [];
    
    renderizarTarjetasParametros();
    limpiarGraficoComparativo(); // Asegura que la vista de comparación inicie oculta.
}
    
    const nombres = { FC: "Frecuencia Cardíaca", PA: "Presión Arterial", Temp: "Temperatura", FR: "Frecuencia Respiratoria", SpO2: "Saturación de Oxígeno", GLC: "Glucosa" };

    function renderizarTarjetasParametros() {
        const container = document.getElementById("registros");
        container.innerHTML = '';
        const parametros = ["FC", "PA", "Temp", "FR", "SpO2", "GLC"];

        parametros.forEach(param => {
            const card = document.createElement("article");
            card.className = "card shadow-sm cardParametro mb-1 col-12 col-md-6 col-lg-4";
            card.id = `CardParametro-${param}`;
            const chartId = `chart-param-${param}`;

            card.innerHTML = `
                <div class="card-header">
                    <h5 class="card-title mb-0 d-flex justify-content-between align-items-center">
                        <div class="fw-bold">${nombres[param] || param}</div>
                        <div class="d-flex align-items-center">
                            <label for="switchParametro-${param}" class="form-check-label me-2">Comparar</label>
                            <div class="form-check form-switch"> 
                                <input class="form-check-input switchParametro" type="checkbox" role="switch" 
                                       id="switchParametro-${param}" data-parametro="${param}">
                            </div>
                        </div>
                    </h5>
                </div>
                <div class="card-body">
                    <canvas id="${chartId}" style="max-height: 200px;"></canvas>
                </div>`;
            
            container.appendChild(card);
            renderizarGraficoHistorico(chartId, param);
        });

        document.querySelectorAll(".switchParametro").forEach(switchInput => {
            switchInput.addEventListener("change", () => {
                const parametro = switchInput.dataset.parametro;
                const isChecked = switchInput.checked;

                if (isChecked) {
                    if (window.parametrosSeleccionados.length >= 2) {
                        alert("Solo puede comparar un máximo de 2 parámetros.");
                        switchInput.checked = false;
                        return;
                    }
                    window.parametrosSeleccionados.push(parametro);
                } else {
                    window.parametrosSeleccionados = window.parametrosSeleccionados.filter(p => p !== parametro);
                }
                actualizarVistaComparativa();
            });
        });
    }

    function renderizarGraficoHistorico(canvasId, parametro) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const historicalData = [...window.registrosGlobal].reverse();
        const labels = historicalData.map(r => new Date(r.fecha).toLocaleString());
        const data = historicalData.map(r => parametro === "PA" ? extraerSistolica(r.signos_vitales[parametro]) : r.signos_vitales[parametro]);

        const pointColors = data.map(valor => {
            return estaEnRango(parametro, valor) ? 'rgba(54, 162, 235, 1)' : '#ff0000';
        });

        const pointRadii = data.map(valor => {
            return estaEnRango(parametro, valor) ? 2 : 5;
        });


        const [min, max] = rangosNormales[parametro] || [null, null];
        const annotations = {};

        if (min !== null) {
            annotations.lineaMin = {
                type: 'line',
                yMin: min,
                yMax: min,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                    content: `Mín: ${min}`,
                    enabled: true,
                    position: 'end',
                    backgroundColor: 'rgba(255, 99, 132, 0.8)'
                }
            };
        }

        if (max !== null) {
            annotations.lineaMax = {
                type: 'line',
                yMin: max,
                yMax: max,
                borderColor: 'rgba(255, 159, 64, 0.8)',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                    content: `Máx: ${max}`,
                    enabled: true,
                    position: 'end',
                    backgroundColor: 'rgba(255, 159, 64, 0.8)'
                }
            };
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: nombres[parametro] || parametro,
                    data: data,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    pointBackgroundColor: pointColors,
                    pointRadius: pointRadii,
                    pointHoverRadius: pointRadii.map(r => r + 3)
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { min: (limitesGrafico[parametro] || {}).min } },
                plugins: {
                    legend: { display: false },
                    annotation: {
                        annotations: annotations
                    }
                }
            }
        });
    }

    function actualizarVistaComparativa() {
        const comparador = document.getElementById("comparadorSignosVitales");
        const tabla = document.getElementById("tablaComparativaSignosVitales");
        const thead = tabla.querySelector("thead");
        const tbody = tabla.querySelector("tbody");
        const graficoContainer = document.getElementById("registros2");

        thead.innerHTML = "";
        tbody.innerHTML = "";
        limpiarGraficoComparativo();

        if (window.parametrosSeleccionados.length < 2) {
            comparador.classList.add("d-none");
            return;
        }

        comparador.classList.remove("d-none");

        const [param1, param2] = window.parametrosSeleccionados;
        const registros = [...window.registrosGlobal].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más reciente primero para la tabla

        // --- Actualizar Tabla ---
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `<th>Fecha</th><th>${nombres[param1]}</th><th>${nombres[param2]}</th>`;
        thead.appendChild(headerRow);

        registros.forEach(reg => {
            const fila = document.createElement("tr");
            const val1 = reg.signos_vitales[param1];
            const val2 = reg.signos_vitales[param2];

            const val1Html = estaEnRango(param1, val1)
                ? val1
                : `<strong style="color: #ff0000;">${val1}</strong>`;
            const val2Html = estaEnRango(param2, val2)
                ? val2
                : `<strong style="color: #ff0000;">${val2}</strong>`;

            fila.innerHTML = `
                <td>${new Date(reg.fecha).toLocaleString()}</td>
                <td>${val1Html}</td>
                <td>${val2Html}</td>
            `;
            tbody.appendChild(fila);
        });

        // --- Mostrar Gráfico Comparativo ---
        const registrosParaGrafico = [...registros].reverse(); // De más antiguo a más nuevo
        const labels = registrosParaGrafico.map(r => new Date(r.fecha).toLocaleString());
        const data1 = registrosParaGrafico.map(r => param1 === "PA" ? extraerSistolica(r.signos_vitales[param1]) : r.signos_vitales[param1]);
        const data2 = registrosParaGrafico.map(r => param2 === "PA" ? extraerSistolica(r.signos_vitales[param2]) : r.signos_vitales[param2]);

        graficoContainer.innerHTML = `
        <article class="card cardRegistroSignosVitales mb-0 col shadow-sm">
            <div class="card-header">
                <h5 class="card-title mb-0">Comparación: ${nombres[param1]} vs ${nombres[param2]}</h5>
            </div>
            <div class="card-body pb-0">
                <canvas id="comparativaParametroChart" style="max-height: 180px;"></canvas>
            </div>
        </article>`;

        const ctx = document.getElementById("comparativaParametroChart").getContext("2d");
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: nombres[param1],
                        data: data1,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        yAxisID: 'y-left',
                        fill: true
                    },
                    {
                        label: nombres[param2],
                        data: data2,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        yAxisID: 'y-right',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                stacked: false,
                scales: {
                    'y-left': {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: nombres[param1] }
                    },
                    'y-right': {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: nombres[param2] },
                        grid: { drawOnChartArea: false },
                    }
                }
            }
        });
    }

    function limpiarGraficoComparativo() {
        document.getElementById("registros2").innerHTML = `<span class="card h-100 d-flex justify-content-center align-items-center text-secondary skeleton"> 
            <h3 class="font-italic">Seleccione 2 parámetros para comparar</h3>
        </span>`;
    }

    // Rangos normales para cada parámetro
    const rangosNormales = {
        FC: [60, 100],            // Frecuencia Cardíaca (bpm)
        PA: [90, 120],            // Presión Arterial sistólica (mmHg)
        Temp: [36.1, 37.2],       // Temperatura (°C)
        FR: [12, 20],             // Frecuencia Respiratoria (rpm)
        SpO2: [95, 100],          // Saturación O2 (%)
        GLC: [70, 99]            // Glucemia (mg/dL) en ayunas
    };

    // Límites para la escala del gráfico para evitar rangos inverosímiles
    const limitesGrafico = {
        Temp: { min: 34 },
        SpO2: { min: 80 },
        GLC: { min: 65 },
        FC: { min: 40 },
        PA: { min: 80 },
        FR: { min: 10 },

    };

    function estaEnRango(abrev, valor) {
        const key = abrev;
        if (!rangosNormales[key]) return true;

        let val = valor;
        if (key === "PA") {
            val = extraerSistolica(valor);
        }

        const [min, max] = rangosNormales[key];
        return val >= min && val <= max;
    }

    function extraerSistolica(pa) {
        if (typeof pa === "string" && pa.includes("/")) {
            return parseInt(pa.split("/")[0]) || 0;
        }
        // Si ya es un número (pre-procesado), devolverlo. Si no, es un formato inválido.
        return typeof pa === 'number' ? pa : 0;
    }