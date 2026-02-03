const grid = document.getElementById('countryGrid');
const searchBar = document.getElementById('searchBar');
const regionFilter = document.getElementById('regionFilter');
const populationFilter = document.getElementById('populationFilter');
const modal = document.getElementById('countryModal');
const modalDetails = document.getElementById('modalDetails');

let countriesData = [];
let timeout = null;

// 1. Fetch Data from API
async function loadCountries() {
    grid.innerHTML = '<div class="spinner"></div>'; // Loading visual
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca3,region,capital,population,maps,currencies');
        const data = await response.json();
        
        console.log('Total countries loaded:', data.length);
        
        // Sort alphabetically and store globally
        countriesData = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        render(countriesData);
    } catch (error) {
        console.error('Error loading countries:', error);
        grid.innerHTML = '<h2 style="grid-column: 1/-1; text-align: center;">Connection Error. Please try again.</h2>';
    }
}

// 2. Unified Filtering Logic (Search + Region + Population)
function applyFilters() {
    clearTimeout(timeout);
    
    // Add a small delay (debounce) for smoother typing performance
    timeout = setTimeout(() => {
        const term = searchBar.value.toLowerCase();
        const selectedRegion = regionFilter.value;
        const selectedPopulation = populationFilter.value;

        const filtered = countriesData.filter(c => {
            const matchesSearch = c.name.common.toLowerCase().includes(term);
            const matchesRegion = selectedRegion === 'all' || c.region === selectedRegion;
            
            let matchesPopulation = true;
            if (selectedPopulation !== 'all') {
                const pop = c.population;
                if (selectedPopulation === 'small') matchesPopulation = pop < 1000000;
                else if (selectedPopulation === 'medium') matchesPopulation = pop >= 1000000 && pop <= 50000000;
                else if (selectedPopulation === 'large') matchesPopulation = pop > 50000000 && pop <= 250000000;
                else if (selectedPopulation === 'xlarge') matchesPopulation = pop > 250000000;
            }
            
            return matchesSearch && matchesRegion && matchesPopulation;
        });

        render(filtered);
    }, 200); 
}

// 3. Render Cards to Grid
function render(list) {
    if (list.length === 0) {
        grid.innerHTML = '<h2 style="grid-column: 1/-1; text-align: center;">No countries match your search.</h2>';
        return;
    }

    grid.innerHTML = list.map(c => {
        const currency = c.currencies ? Object.values(c.currencies)[0]?.name : 'N/A';
        return `
        <div class="card" onclick="showDetail('${c.cca3}')">
            <img src="${c.flags.svg}" alt="${c.name.common}" loading="lazy">
            <div class="card-content">
                <h3>${c.name.common}</h3>
                <p><strong>Region:</strong> ${c.region}</p>
                <p><strong>Currency:</strong> ${currency}</p>
            </div>
        </div>
    `;
    }).join('');
}

// 4. Modal Interactions
function showDetail(code) {
    const country = countriesData.find(c => c.cca3 === code);
    if (!country) return;

    const currency = country.currencies ? Object.entries(country.currencies).map(([code, data]) => `${data.name} (${code})`).join(', ') : 'N/A';

    modalDetails.innerHTML = `
        <img src="${country.flags.svg}" style="width:100%; border-radius:12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1)">
        <h1 style="color:#6366f1; margin-bottom:10px;">${country.name.common}</h1>
        <div style="line-height: 1.6;">
            <p><b>Capital:</b> ${country.capital ? country.capital[0] : 'N/A'}</p>
            <p><b>Population:</b> ${country.population.toLocaleString()}</p>
            <p><b>Region:</b> ${country.region}</p>
            <p><b>Currency:</b> ${currency}</p>
            <p><b>Alpha Code:</b> ${country.cca3}</p>
        </div>
        <br>
        <a href="${country.maps.googleMaps}" target="_blank" style="display:inline-block; padding:10px 20px; background:#10b981; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">
            📍 View on Google Maps
        </a>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

// 5. Event Listeners
searchBar.addEventListener('input', applyFilters);
regionFilter.addEventListener('change', applyFilters);
populationFilter.addEventListener('change', applyFilters);

// Handle Auth Form Submission
document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('mainPage').classList.remove('hidden');
    loadCountries();
});

// Close modal on click outside or Escape key
window.onclick = (e) => { if (e.target == modal) closeModal(); };
window.addEventListener('keydown', (e) => { if (e.key === "Escape") closeModal(); });