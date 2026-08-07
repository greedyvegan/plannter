// ============================================
// HELPER FUNCTIONS
// ============================================

function getSunIcon(sunText) {
    if (sunText.includes('Full Sun') && sunText.includes('Partial')) return '🌤️';
    if (sunText.includes('Partial Shade')) return '🌙';
    if (sunText.includes('Full Sun')) return '☀️';
    if (sunText.includes('Shade')) return '🌑';
    return '☀️';
}

function getWaterEmoji(waterText) {
    const text = waterText.toLowerCase();
    if (text.includes('high')) return '💧💧💧';
    if (text.includes('medium')) return '💧💧';
    if (text.includes('low')) return '💧';
    return '💧💧';
}

function getWaterIcon(waterText) {
    return getWaterEmoji(waterText);
}

function expandMonths(monthStr) {
    const monthMap = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };
    return monthStr.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, function(match) {
        return monthMap[match] || match;
    });
}

// ============================================
// GARDEN PLANNER LOGIC
// ============================================

function getCurrentMonth() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return { month, day, monthName: monthNames[month], monthNames };
}

function canPlantNow(crop, zone) {
    const { month, day } = getCurrentMonth();
    const plantingMonths = crop.plantingMonths || '';
    
    const zoneMatch = zone >= crop.minZone && zone <= crop.maxZone;
    if (!zoneMatch) return { can: false, reason: `Not suitable for zone ${zone}` };
    
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    let expandedMonths = plantingMonths;
    for (let i = 0; i < monthAbbr.length; i++) {
        expandedMonths = expandedMonths.replace(new RegExp('\\b' + monthAbbr[i] + '\\b', 'g'), monthNames[i]);
    }
    
    const monthRanges = expandedMonths.split(',').map(s => s.trim());
    let canPlant = false;
    let urgency = '';
    
    for (const range of monthRanges) {
        if (range.includes(' - ')) {
            const [start, end] = range.split(' - ').map(s => monthNames.indexOf(s.trim()));
            if (start !== -1 && end !== -1) {
                if (start <= end) {
                    if (month >= start && month <= end) {
                        canPlant = true;
                        const daysUntilEnd = (end - month) * 30 + (30 - day);
                        if (daysUntilEnd < 30) urgency = '⚠️ Plant soon!';
                        else if (daysUntilEnd < 60) urgency = '🌱 Good time to plant';
                        else urgency = '✅ Perfect time to plant';
                        break;
                    }
                } else {
                    if (month >= start || month <= end) {
                        canPlant = true;
                        const daysUntilEnd = month >= start ? (12 - month + end) * 30 : (end - month) * 30;
                        if (daysUntilEnd < 30) urgency = '⚠️ Plant soon!';
                        else if (daysUntilEnd < 60) urgency = '🌱 Good time to plant';
                        else urgency = '✅ Perfect time to plant';
                        break;
                    }
                }
            }
        } else {
            const m = monthNames.indexOf(range);
            if (month === m) {
                canPlant = true;
                urgency = '✅ Plant now!';
                break;
            }
        }
    }
    
    if (!canPlant) {
        const nextMonth = month + 1;
        let comingSoon = false;
        let nextMonthName = '';
        for (const range of monthRanges) {
            if (range.includes(' - ')) {
                const [start, end] = range.split(' - ').map(s => monthNames.indexOf(s.trim()));
                if (start !== -1 && end !== -1) {
                    if (start <= end) {
                        if (nextMonth >= start && nextMonth <= end) {
                            comingSoon = true;
                            nextMonthName = monthNames[start];
                            break;
                        }
                    } else {
                        if (nextMonth >= start || nextMonth <= end) {
                            comingSoon = true;
                            nextMonthName = monthNames[start];
                            break;
                        }
                    }
                }
            }
        }
        if (comingSoon) {
            return { can: false, reason: `📅 Coming soon (${nextMonthName})` };
        }
        return { can: false, reason: `📅 Plant ${monthNames[month]}` };
    }
    
    return { can: true, reason: urgency };
}

// ============================================
// IMAGE UPLOAD FUNCTIONS
// ============================================

let currentCropImage = null;

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentCropImage = e.target.result;
        updateImagePreview(currentCropImage);
        saveCropImage(currentCropImage);
    };
    reader.readAsDataURL(file);
}

function updateImagePreview(imageData) {
    const area = document.getElementById('imageUploadArea');
    const preview = document.getElementById('imagePreview');
    if (area) {
        area.classList.add('has-image');
        preview.innerHTML = `
            <img src="${imageData}" alt="Plant photo">
            <div class="upload-hint">Click to change photo</div>
        `;
    }
}

function removeImage() {
    currentCropImage = null;
    const area = document.getElementById('imageUploadArea');
    const preview = document.getElementById('imagePreview');
    if (area) {
        area.classList.remove('has-image');
        preview.innerHTML = `
            <div class="upload-icon">🖼️</div>
            <div class="upload-hint">Click to upload a photo</div>
        `;
    }
    const cropName = document.getElementById('modalBody')?.dataset?.cropName;
    if (cropName) {
        const images = JSON.parse(localStorage.getItem('plantImages') || '{}');
        delete images[cropName];
        localStorage.setItem('plantImages', JSON.stringify(images));
    }
}

function saveCropImage(imageData) {
    const cropName = document.getElementById('modalBody')?.dataset?.cropName;
    if (!cropName) return;
    const images = JSON.parse(localStorage.getItem('plantImages') || '{}');
    images[cropName] = imageData;
    localStorage.setItem('plantImages', JSON.stringify(images));
}

function loadCropImage(cropName) {
    const images = JSON.parse(localStorage.getItem('plantImages') || '{}');
    return images[cropName] || null;
}

// ============================================
// FAVORITES SYSTEM
// ============================================

let favorites = JSON.parse(localStorage.getItem('gardenFavorites') || '[]');
let favoritesViewActive = false;
let plantNowViewActive = false;

function saveFavorites() {
    localStorage.setItem('gardenFavorites', JSON.stringify(favorites));
    updateFavoritesUI();
}

function toggleFavorite(cropName, updateModal = true) {
    const index = favorites.indexOf(cropName);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(cropName);
    }
    saveFavorites();
    
    document.querySelectorAll('.crop-card').forEach(card => {
        const nameEl = card.querySelector('h3');
        if (nameEl) {
            let nameText = nameEl.textContent.replace(/[⭐★☆]/g, '').trim();
            if (nameText === cropName) {
                const star = card.querySelector('.favorite-star');
                if (star) {
                    const isFav = favorites.includes(cropName);
                    if (isFav) {
                        star.classList.add('active');
                        star.textContent = '★';
                        card.classList.add('favorite');
                    } else {
                        star.classList.remove('active');
                        star.textContent = '☆';
                        card.classList.remove('favorite');
                    }
                }
            }
        }
    });
    
    if (updateModal) {
        const modalBody = document.getElementById('modalBody');
        if (modalBody && modalBody.dataset.cropName === cropName) {
            updateModalContent(cropName);
        }
    }
    
    if (favoritesViewActive) {
        viewFavoritesOnly();
    }
    if (plantNowViewActive) {
        viewPlantNow();
    }
}

function updateFavoritesUI() {
    const count = favorites.length;
    document.getElementById('favoritesCount').textContent = count;
    document.getElementById('favoritesBtnCount').textContent = count;

    const list = document.getElementById('favoritesList');
    if (count === 0) {
        list.innerHTML = `
            <div class="favorites-empty">
                <span class="big-icon">🌱</span>
                Your garden planner is empty<br>
                <small style="color:#95a5a6;">Click the ★ on any plant to add it</small>
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <div class="favorites-grid">
            ${favorites.map(name => {
                const crop = allCrops.find(c => c.name === name);
                if (!crop) return '';
                return `
                    <div class="favorite-item" onclick="viewFavoritePlant('${crop.name}')">
                        <span class="name">${crop.name}</span>
                        <span class="category-badge">${crop.category}</span>
                        <button class="remove-btn" onclick="event.stopPropagation(); toggleFavorite('${crop.name}')" title="Remove">✕</button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function viewFavoritePlant(name) {
    closeFavorites();
    const crop = allCrops.find(c => c.name === name);
    if (crop) {
        resetView();
        const input = document.getElementById('unifiedSearch');
        input.value = name;
        handleUnifiedSearch();
        setTimeout(() => openModal(name), 300);
    }
}

function viewFavoritesOnly() {
    plantNowViewActive = false;
    favoritesViewActive = true;
    closeFavorites();
    
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.getElementById('masterResultsView').classList.add('active');
    document.querySelectorAll('.deck-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('globalBack').style.display = 'inline-block';
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchClear').classList.remove('visible');
    
    const title = document.getElementById('masterViewTitle');
    title.textContent = `⭐ My Garden (${favorites.length})`;
    
    const grid = document.getElementById('masterGrid');
    grid.innerHTML = '';
    
    if (favorites.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #7f8c8d; padding: 40px;">Your garden is empty. Click ★ on any plant to add it!</p>';
        return;
    }
    
    const filtered = allCrops.filter(c => favorites.includes(c.name));
    const userZone = parseInt(localStorage.getItem('userZone')) || 6;
    
    filtered.sort((a, b) => {
        const aCan = canPlantNow(a, userZone).can;
        const bCan = canPlantNow(b, userZone).can;
        return (aCan === bCan) ? 0 : aCan ? -1 : 1;
    });
    
    filtered.forEach(crop => {
        grid.appendChild(createCropCard(crop));
    });
    
    document.getElementById('filterStatus').textContent = `⭐ ${favorites.length} plants in your garden`;
}

function viewPlantNow() {
    plantNowViewActive = true;
    favoritesViewActive = false;
    closeFavorites();
    
    const userZone = parseInt(localStorage.getItem('userZone')) || 6;
    const { monthName } = getCurrentMonth();
    
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.getElementById('masterResultsView').classList.add('active');
    document.querySelectorAll('.deck-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('globalBack').style.display = 'inline-block';
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchClear').classList.remove('visible');
    
    const title = document.getElementById('masterViewTitle');
    title.textContent = `🌱 What You Can Start Planting Now (${monthName})`;
    
    const grid = document.getElementById('masterGrid');
    grid.innerHTML = '';
    
    const plantable = allCrops.filter(c => {
        return favorites.includes(c.name) && canPlantNow(c, userZone).can;
    });
    
    if (plantable.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🌱</div>
                <p style="color: #636e72;">No plants in your garden can be planted right now.</p>
                <p style="color: #95a5a6; font-size: 0.9rem;">Check your garden for upcoming planting windows.</p>
            </div>
        `;
        document.getElementById('filterStatus').textContent = `📅 Nothing to plant in ${monthName}`;
        return;
    }
    
    plantable.forEach(crop => {
        grid.appendChild(createCropCard(crop));
    });
    
    document.getElementById('filterStatus').textContent = `🌱 ${plantable.length} plants ready to plant in ${monthName}!`;
}

function toggleFavorites() {
    const panel = document.getElementById('favoritesPanel');
    const overlay = document.getElementById('favoritesOverlay');
    const container = document.getElementById('mainContainer');
    
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        closeFavorites();
    } else {
        panel.classList.add('open');
        overlay.classList.add('active');
        container.classList.add('shifted');
        document.body.style.overflow = 'hidden';
        updateFavoritesUI();
    }
}

function closeFavorites() {
    const panel = document.getElementById('favoritesPanel');
    const overlay = document.getElementById('favoritesOverlay');
    const container = document.getElementById('mainContainer');
    
    panel.classList.remove('open');
    overlay.classList.remove('active');
    container.classList.remove('shifted');
    document.body.style.overflow = '';
}

function clearFavorites() {
    if (confirm('Remove all plants from your garden plan?')) {
        favorites = [];
        saveFavorites();
        document.querySelectorAll('.favorite-star').forEach(star => {
            star.classList.remove('active');
            star.textContent = '☆';
            star.closest('.crop-card').classList.remove('favorite');
        });
        updateFavoritesUI();
        if (favoritesViewActive) {
            viewFavoritesOnly();
        }
        if (plantNowViewActive) {
            viewPlantNow();
        }
    }
}

function clearZone() {
    const defaultZone = '6';
    localStorage.setItem('userZone', defaultZone);
    document.getElementById('currentZoneDisplay').textContent = defaultZone;
    
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchClear').classList.remove('visible');
    document.getElementById('searchSuggestions').classList.remove('active');
    
    favoritesViewActive = false;
    plantNowViewActive = false;
    
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.getElementById('masterResultsView').classList.add('active');
    document.querySelectorAll('.deck-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('globalBack').style.display = 'none';
    document.getElementById('filterStatus').textContent = '';
    document.getElementById('masterViewTitle').textContent = '🌿 Complete Master Plant Inventory';
    
    handleUnifiedSearch();
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal(cropName) {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    body.dataset.cropName = cropName;
    updateModalContent(cropName);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function updateModalContent(cropName) {
    const crop = allCrops.find(c => c.name === cropName);
    if (!crop) return;

    const isFavorite = favorites.includes(crop.name);
    const userZone = parseInt(localStorage.getItem('userZone')) || 6;
    const plantStatus = canPlantNow(crop, userZone);
    const body = document.getElementById('modalBody');
    
    const soilType = crop.soil.split('(')[0].trim() || crop.soil;
    const containerType = crop.container.split('(')[0].trim() || crop.container;
    const waterIcon = getWaterEmoji(crop.water);
    const sunIcon = getSunIcon(crop.sun);
    
    const waterText = crop.water || 'Medium';
    let waterLevel = 'Medium';
    let waterEmoji = '💧💧';
    if (waterText.toLowerCase().includes('high')) {
        waterLevel = 'High (daily)';
        waterEmoji = '💧💧💧';
    } else if (waterText.toLowerCase().includes('medium')) {
        waterLevel = 'Medium (every 2-3 days)';
        waterEmoji = '💧💧';
    } else if (waterText.toLowerCase().includes('low')) {
        waterLevel = 'Low (weekly)';
        waterEmoji = '💧';
    }
    
    // Determine fertilizer NPK recommendation
    let fertilizer = '';
    let npkExplanation = '';
    const cropNameLower = crop.name.toLowerCase();
    const category = crop.category;
    
    if (category === 'Fruit') {
        if (cropNameLower.includes('tomato') || cropNameLower.includes('pepper') || cropNameLower.includes('eggplant')) {
            fertilizer = '5-10-10';
            npkExplanation = 'Less nitrogen (leaf growth), more phosphorus (fruit production)';
        } else if (cropNameLower.includes('citrus') || cropNameLower.includes('lemon') || cropNameLower.includes('lime') || cropNameLower.includes('orange')) {
            fertilizer = '6-6-6';
            npkExplanation = 'Balanced citrus formula for healthy trees';
        } else if (cropNameLower.includes('berry') || cropNameLower.includes('strawberry') || cropNameLower.includes('blueberry') || cropNameLower.includes('blackberry') || cropNameLower.includes('raspberry')) {
            fertilizer = '10-10-10';
            npkExplanation = 'Balanced for fruit production and plant health';
        } else if (cropNameLower.includes('apple') || cropNameLower.includes('pear') || cropNameLower.includes('peach') || cropNameLower.includes('cherry') || cropNameLower.includes('plum') || cropNameLower.includes('apricot') || cropNameLower.includes('nectarine')) {
            fertilizer = '10-10-10';
            npkExplanation = 'Balanced for fruit trees';
        } else {
            fertilizer = '10-10-10';
            npkExplanation = 'Balanced (equal parts for overall health)';
        }
    } else if (category === 'Vegetable') {
        if (cropNameLower.includes('tomato') || cropNameLower.includes('pepper') || cropNameLower.includes('eggplant')) {
            fertilizer = '5-10-10';
            npkExplanation = 'Less nitrogen (leaf growth), more phosphorus (fruit production)';
        } else if (cropNameLower.includes('kale') || cropNameLower.includes('spinach') || cropNameLower.includes('lettuce') || cropNameLower.includes('chard') || cropNameLower.includes('collard') || cropNameLower.includes('mustard') || cropNameLower.includes('arugula')) {
            fertilizer = '10-5-5';
            npkExplanation = 'More nitrogen for leafy green growth';
        } else if (cropNameLower.includes('carrot') || cropNameLower.includes('beet') || cropNameLower.includes('potato') || cropNameLower.includes('onion') || cropNameLower.includes('radish') || cropNameLower.includes('turnip') || cropNameLower.includes('parsnip') || cropNameLower.includes('garlic')) {
            fertilizer = '5-10-10';
            npkExplanation = 'More phosphorus for root development';
        } else if (cropNameLower.includes('pepper') || cropNameLower.includes('cucumber') || cropNameLower.includes('squash') || cropNameLower.includes('pumpkin') || cropNameLower.includes('zucchini') || cropNameLower.includes('corn') || cropNameLower.includes('okra') || cropNameLower.includes('beans') || cropNameLower.includes('peas')) {
            fertilizer = '5-10-10';
            npkExplanation = 'More phosphorus for flowering and fruiting';
        } else {
            fertilizer = '10-10-10';
            npkExplanation = 'Balanced for overall vegetable growth';
        }
    } else if (category === 'Herb') {
        if (cropNameLower.includes('basil') || cropNameLower.includes('mint') || cropNameLower.includes('parsley') || cropNameLower.includes('cilantro') || cropNameLower.includes('dill')) {
            fertilizer = '10-5-5';
            npkExplanation = 'More nitrogen for leafy herb growth';
        } else if (cropNameLower.includes('lavender') || cropNameLower.includes('rosemary') || cropNameLower.includes('thyme') || cropNameLower.includes('oregano') || cropNameLower.includes('sage')) {
            fertilizer = '5-10-5';
            npkExplanation = 'Less nitrogen for slow, steady growth';
        } else {
            fertilizer = '10-10-10';
            npkExplanation = 'Balanced for herb health';
        }
    } else if (category === 'Flower') {
        fertilizer = '10-20-10';
        npkExplanation = 'More phosphorus for abundant blooms';
    } else {
        fertilizer = '10-10-10';
        npkExplanation = 'Balanced for overall plant health';
    }
    
    const savedImage = loadCropImage(cropName);
    if (savedImage) {
        currentCropImage = savedImage;
    } else {
        currentCropImage = null;
    }
    
    const seedInfo = crop.seedStart || { indoors: false, weeksBeforeLastFrost: 0, method: 'direct-sow', methodLabel: 'Direct sow', notes: '' };
    const methodEmojis = {
        'direct-sow': '🌍',
        'paper-towel-fridge': '🧊',
        'paper-towel-warm': '🌡️',
        'soak-water': '💧',
        'heat-mat': '🔥',
        'surface-sow': '☀️',
        'dark-sow': '🌑'
    };
    const methodEmoji = methodEmojis[seedInfo.method] || '🌱';
    
    const growingMethod = crop.growingMethod || 'outdoor';
    const methodLabels = {
        'outdoor': '🌿 Outdoor',
        'outdoor-trellis': '🌿 Outdoor + Trellis',
        'greenhouse-warm': '🏠 Greenhouse (Warm)',
        'greenhouse-tropical': '🏠 Greenhouse (Tropical)',
        'greenhouse-cool': '🏠 Greenhouse (Cool)',
        'grow-light': '💡 Grow Lights',
        'windowsill': '🪟 Windowsill'
    };
    const methodDisplay = methodLabels[growingMethod] || '🌿 Outdoor';
    
    let soilMix = '';
    if (soilType.toLowerCase().includes('sandy')) {
        soilMix = '2:1:1 (Compost:Perlite:Sand)';
    } else if (soilType.toLowerCase().includes('clay')) {
        soilMix = '1:1:1 (Compost:Perlite:Sand)';
    } else if (soilType.toLowerCase().includes('loam') || soilType.toLowerCase().includes('loamy')) {
        soilMix = '3:1:1 (Compost:Perlite:Sand)';
    } else if (soilType.toLowerCase().includes('acidic') || soilType.toLowerCase().includes('peat')) {
        soilMix = '2:1:0.5 (Peat:Perlite:Sand)';
    } else if (soilType.toLowerCase().includes('cactus') || soilType.toLowerCase().includes('sandy')) {
        soilMix = '1:1:2 (Compost:Perlite:Sand)';
    } else {
        soilMix = '2:1:1 (Compost:Perlite:Sand)';
    }
    
    let imageHTML = '';
    if (savedImage) {
        imageHTML = `
            <img src="${savedImage}" alt="${cropName}">
            <div class="upload-hint">Click to change photo</div>
        `;
    } else {
        imageHTML = `
            <div class="upload-icon">🖼️</div>
            <div class="upload-hint">Click to upload a photo</div>
        `;
    }
    
    const scientificName = crop.scientificName || '';
    const cleanName = crop.name.includes('(') ? crop.name.split('(')[0].trim() : crop.name;
    const expandedPlantingMonths = expandMonths(crop.plantingMonths);
    
    let seedDisplay = '';
    if (seedInfo.indoors) {
        seedDisplay += '🏠 Start indoors';
    } else {
        seedDisplay += '🌍 Direct sow';
    }
    if (seedInfo.weeksBeforeLastFrost > 0) {
        seedDisplay += ` • ⏰ ${seedInfo.weeksBeforeLastFrost} weeks before frost`;
    }
    seedDisplay += ` • ${methodEmoji} ${seedInfo.methodLabel}`;
    
    const npkParts = fertilizer.split('-');
    const nPercent = npkParts[0] || '10';
    const pPercent = npkParts[1] || '10';
    const kPercent = npkParts[2] || '10';
    
    body.innerHTML = `
        <div class="image-upload-area ${savedImage ? 'has-image' : ''}" id="imageUploadArea" onclick="document.getElementById('imageFileInput').click()">
            <input type="file" id="imageFileInput" accept="image/*" style="display:none;" onchange="handleImageUpload(event)">
            <div id="imagePreview">
                ${imageHTML}
            </div>
            <button class="remove-image" onclick="event.stopPropagation(); removeImage()">✕</button>
        </div>
        
        <h2>${cleanName}</h2>
        ${scientificName ? `<div class="scientific-name">${scientificName}</div>` : ''}
        <span class="modal-category">${crop.category}</span>
        
        <div class="plant-status-banner ${plantStatus.can ? '' : 'not-ready'}">
            <strong>${plantStatus.can ? '🌱 ' + plantStatus.reason : '📅 ' + plantStatus.reason}</strong>
        </div>
        
        <div class="modal-grid">
            <div class="modal-item combined three-col full-width">
                <div class="part">
                    <label>🌍 Grow Zones</label>
                    <div class="value">${crop.zones}</div>
                </div>
                <div class="part">
                    <label>${sunIcon} Sun</label>
                    <div class="value">${crop.sun}</div>
                </div>
                <div class="part">
                    <label>📅 Planting Window</label>
                    <div class="value">${expandedPlantingMonths}</div>
                </div>
            </div>
            
            <div class="modal-item combined full-width">
                <div class="part">
                    <label>💧 Water Needs</label>
                    <div class="value">
                        <div class="water-display">
                            <span>${waterEmoji}</span>
                            <span class="water-label">${waterLevel}</span>
                        </div>
                    </div>
                </div>
                <div class="part">
                    <label>🏠 Growing Method</label>
                    <div class="value">${methodDisplay}</div>
                </div>
            </div>
            
            <div class="modal-item combined full-width">
                <div class="part">
                    <label>🌱 Seed Starting</label>
                    <div class="value">${seedDisplay}</div>
                    ${seedInfo.notes ? `<div style="margin-top:3px; font-size:0.75rem; color:#636e72;">📝 ${seedInfo.notes}</div>` : ''}
                </div>
                <div class="part">
                    <label>🏺 Recommended Container</label>
                    <div class="value">${containerType}</div>
                    <div style="margin-top:4px; padding-top:4px; border-top:1px solid #e2e8f0;">
                        <label style="font-size:0.6rem; text-transform:uppercase; letter-spacing:0.5px; color:#95a5a6; font-weight:700; display:block; margin-bottom:2px;">🌱 Companion Plants</label>
                        <div class="value">${crop.companion}</div>
                    </div>
                </div>
            </div>
            
            <div class="modal-item combined full-width">
                <div class="part">
                    <label>🧪 Ideal Soil Mix</label>
                    <div class="value">
                        <div>${soilType}</div>
                        <div class="soil-mix">
                            <span>${soilMix}</span>
                        </div>
                    </div>
                </div>
                <div class="part">
                    <label>🧪 Fertilizer: <span style="color:#f39c12; font-weight:700; font-size:0.95rem;">${fertilizer}</span></label>
                    <div class="value">
                        <div style="display:flex; flex-direction:column; gap:2px; margin-top:2px;">
                            <div style="font-size:0.75rem; display:flex; align-items:center; gap:6px;">
                                <span style="font-weight:700; color:#2ecc71;">${nPercent}%</span>
                                <span style="color:#636e72;">Nitrogen → Leaves & Stems</span>
                            </div>
                            <div style="font-size:0.75rem; display:flex; align-items:center; gap:6px;">
                                <span style="font-weight:700; color:#e67e22;">${pPercent}%</span>
                                <span style="color:#636e72;">Phosphorus → Roots, Flowers & Fruit</span>
                            </div>
                            <div style="font-size:0.75rem; display:flex; align-items:center; gap:6px;">
                                <span style="font-weight:700; color:#3498db;">${kPercent}%</span>
                                <span style="color:#636e72;">Potassium → Overall Health</span>
                            </div>
                            <div style="font-size:0.7rem; color:#95a5a6; margin-top:2px; font-style:italic;">${npkExplanation}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn-favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${crop.name}')">
                ${isFavorite ? '★' : '☆'} ${isFavorite ? 'Remove from' : 'Add to'} Garden
            </button>
            <button class="btn-close-modal" onclick="closeModal()">Close</button>
        </div>
    `;
}

// ============================================
// SEARCH & FILTER
// ============================================

function handleSearchInput() {
    const input = document.getElementById('unifiedSearch');
    const query = input.value.trim();
    const clearBtn = document.getElementById('searchClear');
    const suggestions = document.getElementById('searchSuggestions');

    clearBtn.classList.toggle('visible', query.length > 0);

    if (query.length > 0) {
        const matches = allCrops.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.category.toLowerCase().includes(query.toLowerCase()) ||
            (c.scientificName && c.scientificName.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 5);

        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(c => 
                `<div class="search-suggestion" onclick="selectSuggestion('${c.name}')">
                    ${c.name} ${c.scientificName ? `<small style="color:#95a5a6;">(${c.scientificName})</small>` : ''}
                    <small style="color:#95a5a6; margin-left:5px;">${c.category}</small>
                </div>`
            ).join('');
            suggestions.classList.add('active');
        } else {
            suggestions.classList.remove('active');
        }
    } else {
        suggestions.classList.remove('active');
    }

    handleUnifiedSearch();
}

function selectSuggestion(name) {
    document.getElementById('unifiedSearch').value = name;
    document.getElementById('searchSuggestions').classList.remove('active');
    handleUnifiedSearch();
}

function clearSearch() {
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchSuggestions').classList.remove('active');
    document.getElementById('searchClear').classList.remove('visible');
    resetView();
}

function handleUnifiedSearch() {
    const rawInput = document.getElementById('unifiedSearch').value.trim();
    const queryLower = rawInput.toLowerCase();
    const masterGrid = document.getElementById('masterGrid');
    const filterStatus = document.getElementById('filterStatus');
    const title = document.getElementById('masterViewTitle');

    if (favoritesViewActive && !rawInput) {
        viewFavoritesOnly();
        return;
    }
    if (plantNowViewActive && !rawInput) {
        viewPlantNow();
        return;
    }

    let searchPool = allCrops;
    let titleText = '🌿 Complete Master Plant Inventory';
    let statusText = '';
    
    if (favoritesViewActive && rawInput) {
        searchPool = allCrops.filter(c => favorites.includes(c.name));
        titleText = `⭐ My Garden - Searching "${rawInput}"`;
    } else if (plantNowViewActive && rawInput) {
        const userZone = parseInt(localStorage.getItem('userZone')) || 6;
        searchPool = allCrops.filter(c => favorites.includes(c.name) && canPlantNow(c, userZone).can);
        titleText = `🌱 Plant Now - Searching "${rawInput}"`;
    } else if (!favoritesViewActive && !plantNowViewActive) {
        titleText = '🌿 Complete Master Plant Inventory';
    }

    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.getElementById('masterResultsView').classList.add('active');
    document.querySelectorAll('.deck-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('globalBack').style.display = rawInput || favoritesViewActive || plantNowViewActive ? 'inline-block' : 'none';
    document.getElementById('masterViewTitle').textContent = titleText;

    let targetZone = null;
    let textQuery = queryLower;

    if (/^\d{5}$/.test(rawInput)) {
        const prefix3 = rawInput.substring(0, 3);
        const zipMap = {
            "997": 1, "996": 2, "995": 3, "070": 6, "071": 7, "902": 10,
            "100": 7, "303": 8, "752": 8, "606": 5, "981": 8, "331": 10,
            "021": 6, "022": 6, "100": 7, "101": 7, "200": 7, "300": 8,
            "400": 6, "500": 5, "600": 5, "700": 8, "800": 5, "900": 10
        };
        if (zipMap[prefix3]) {
            targetZone = zipMap[prefix3];
            localStorage.setItem('userZone', targetZone);
            document.getElementById('currentZoneDisplay').textContent = targetZone;
            statusText = `📍 Zip Code ${rawInput}: Grow Zone ${targetZone}`;
        } else {
            targetZone = 6;
            localStorage.setItem('userZone', targetZone);
            document.getElementById('currentZoneDisplay').textContent = targetZone;
            statusText = `📍 Zip Code ${rawInput}: Estimated Grow Zone ${targetZone}`;
        }
        textQuery = "";
    } 
    else if (/^zone\s*\d+/i.test(rawInput) || /^\d{1,2}$/.test(rawInput)) {
        const match = rawInput.match(/\d+/);
        if (match) {
            targetZone = parseInt(match[0]);
            localStorage.setItem('userZone', targetZone);
            document.getElementById('currentZoneDisplay').textContent = targetZone;
            statusText = `🗺️ Grow Zone ${targetZone}`;
            textQuery = "";
        }
    } else {
        statusText = rawInput ? `🔍 "${rawInput}"` : '';
        if (favoritesViewActive) statusText = `⭐ ${favorites.length} in your garden`;
        if (plantNowViewActive) statusText = `🌱 Plants ready to plant now`;
    }

    const matches = searchPool.filter(c => {
        let matchesText = textQuery === "" || 
            c.name.toLowerCase().includes(textQuery) || 
            c.category.toLowerCase().includes(textQuery) || 
            c.companion.toLowerCase().includes(textQuery) ||
            (c.scientificName && c.scientificName.toLowerCase().includes(textQuery));

        let matchesZone = true;
        if (targetZone !== null) {
            matchesZone = targetZone >= c.minZone && targetZone <= c.maxZone;
        }

        return matchesText && matchesZone;
    });

    filterStatus.textContent = statusText;
    masterGrid.innerHTML = '';
    
    if (matches.length === 0) {
        masterGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #7f8c8d; padding: 40px;">No matching plants found.</p>';
        return;
    }

    matches.forEach(crop => {
        masterGrid.appendChild(createCropCard(crop));
    });
}

// ============================================
// CATEGORY VIEWS
// ============================================

function showSection(sectionId) {
    favoritesViewActive = false;
    plantNowViewActive = false;
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.deck-btn').forEach(b => b.classList.remove('active'));
    
    const btn = document.querySelector(`button[onclick*='${sectionId}']`);
    if (btn) btn.classList.add('active');

    document.getElementById('globalBack').style.display = 'inline-block';
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchClear').classList.remove('visible');
    document.getElementById('searchSuggestions').classList.remove('active');
    document.getElementById('filterStatus').textContent = '';
    document.getElementById('masterViewTitle').textContent = `🌿 ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Collection`;

    const targetView = document.getElementById(sectionId + 'View');
    if (targetView) {
        targetView.classList.add('active');
        populateCategoryGrid(sectionId);
    }
}

function resetView() {
    favoritesViewActive = false;
    plantNowViewActive = false;
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.getElementById('masterResultsView').classList.add('active');
    document.getElementById('globalBack').style.display = 'none';
    document.getElementById('unifiedSearch').value = '';
    document.getElementById('searchClear').classList.remove('visible');
    document.getElementById('searchSuggestions').classList.remove('active');
    document.querySelectorAll('.deck-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('filterStatus').textContent = '';
    document.getElementById('masterViewTitle').textContent = '🌿 Complete Master Plant Inventory';
    handleUnifiedSearch();
}

function populateCategoryGrid(sectionId) {
    const catMap = {'fruits': 'Fruit', 'vegetables': 'Vegetable', 'herbs': 'Herb', 'flowers': 'Flower'};
    const targetCat = catMap[sectionId];
    const grid = document.getElementById(sectionId + 'Grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const filtered = allCrops.filter(c => c.category === targetCat);
    filtered.forEach(crop => {
        grid.appendChild(createCropCard(crop));
    });
}

// ============================================
// CREATE CROP CARD
// ============================================

function createCropCard(crop) {
    const card = document.createElement('div');
    card.className = 'crop-card';
    const isFavorite = favorites.includes(crop.name);
    if (isFavorite) {
        card.classList.add('favorite');
    }
    
    const userZone = parseInt(localStorage.getItem('userZone')) || 6;
    const plantStatus = canPlantNow(crop, userZone);
    if (plantStatus.can) {
        card.classList.add('plant-now');
    }
    
    let imgStyle = crop.img ? `background-image: url('${crop.img}');` : '';
    let displayText = crop.img ? '' : crop.name;

    const starChar = isFavorite ? '★' : '☆';

    card.innerHTML = `
        <button class="favorite-star ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${crop.name}')" title="Add to garden">
            ${starChar}
        </button>
        <div class="card-img-placeholder" style="${imgStyle}">
            ${displayText}
        </div>
        <div class="card-body">
            <div>
                <h3>
                    ${crop.name} 
                    <span class="badge ${plantStatus.can ? 'urgent' : ''}">${crop.category}</span>
                </h3>
                <div class="crop-info-snippet">
                    <span class="snippet-item">🌍 ${crop.zones}</span>
                    <span class="snippet-item">${getSunIcon(crop.sun)} ${crop.sun}</span>
                    <span class="snippet-item">${getWaterIcon(crop.water)} ${crop.water}</span>
                    ${plantStatus.can ? '<span class="snippet-item" style="background:#27ae60;color:white;">🌱 Plant now!</span>' : ''}
                </div>
            </div>
            <div class="click-hint">Click for details ▾</div>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-star')) return;
        openModal(crop.name);
    });

    return card;
}