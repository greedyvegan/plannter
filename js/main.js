// ============================================
// UPDATE CATEGORY COUNTS
// ============================================

function updateCategoryCounts() {
    // Make sure we're counting the right categories
    const fruits = allCrops.filter(c => c.category === 'Fruit').length;
    const vegetables = allCrops.filter(c => c.category === 'Vegetable').length;
    const herbs = allCrops.filter(c => c.category === 'Herb').length;
    const flowers = allCrops.filter(c => c.category === 'Flower').length;
    
    console.log('Category Counts:', { fruits, vegetables, herbs, flowers }); // Debug log
    
    document.getElementById('fruitsCount').textContent = fruits;
    document.getElementById('vegetablesCount').textContent = vegetables;
    document.getElementById('herbsCount').textContent = herbs;
    document.getElementById('flowersCount').textContent = flowers;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // No default zone - start with "--"
    const savedZone = localStorage.getItem('userZone');
    if (savedZone) {
        document.getElementById('currentZoneDisplay').textContent = savedZone;
    } else {
        document.getElementById('currentZoneDisplay').textContent = '--';
    }
    document.getElementById('globalBack').style.display = 'none';
    
    // Initialize month selector for "Best Time to Plant"
    initMonthSelector();
    // Count categories
    updateCategoryCounts();
    
    // Load plants
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
