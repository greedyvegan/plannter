// ============================================
// UPDATE CATEGORY COUNTS
// ============================================

function updateCategoryCounts() {
    const fruits = allCrops.filter(c => c.category === 'Fruit').length;
    const vegetables = allCrops.filter(c => c.category === 'Vegetable').length;
    const herbs = allCrops.filter(c => c.category === 'Herb').length;
    const flowers = allCrops.filter(c => c.category === 'Flower').length;
    
    document.getElementById('fruitsCount').textContent = fruits;
    document.getElementById('vegetablesCount').textContent = vegetables;
    document.getElementById('herbsCount').textContent = herbs;
    document.getElementById('flowersCount').textContent = flowers;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const savedZone = localStorage.getItem('userZone') || '6';
    document.getElementById('currentZoneDisplay').textContent = savedZone;
    if (!localStorage.getItem('userZone')) {
        localStorage.setItem('userZone', '6');
    }
    document.getElementById('globalBack').style.display = 'none';
    updateCategoryCounts();
    handleUnifiedSearch();
    updateFavoritesUI();
});

// Make functions globally accessible for onclick handlers
window.showSection = showSection;
window.resetView = resetView;
window.toggleFavorites = toggleFavorites;
window.closeFavorites = closeFavorites;
window.clearFavorites = clearFavorites;
window.viewFavoritesOnly = viewFavoritesOnly;
window.viewPlantNow = viewPlantNow;
window.handleSearchInput = handleSearchInput;
window.clearSearch = clearSearch;
window.selectSuggestion = selectSuggestion;
window.clearZone = clearZone;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleFavorite = toggleFavorite;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;
window.viewFavoritePlant = viewFavoritePlant;