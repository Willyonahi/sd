document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('fault-form');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const healthStatus = document.getElementById('health-status');
    const customLoadingOverlay = document.getElementById('custom-loading-overlay');
    const loadingAudio = document.getElementById('loading-audio');

    // Check server health on page load
    checkServerHealth();

    // Check server health every 30 seconds
    setInterval(checkServerHealth, 30000);

    // Function to check server health
    async function checkServerHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.status === 'ok') {
                healthStatus.textContent = 'Server Status: Online';
                healthStatus.className = 'status online';
            } else {
                healthStatus.textContent = 'Server Status: Offline';
                healthStatus.className = 'status offline';
            }
        } catch (error) {
            healthStatus.textContent = 'Server Status: Offline';
            healthStatus.className = 'status offline';
        }
    }

    // Function to show custom loading overlay
    function showCustomLoading() {
        customLoadingOverlay.style.display = 'flex';
        loadingAudio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    }

    // Function to hide custom loading overlay
    function hideCustomLoading() {
        customLoadingOverlay.style.display = 'none';
        loadingAudio.pause();
        loadingAudio.currentTime = 0;
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const equipment = document.getElementById('equipment').value;
        const code = document.getElementById('code').value;
        
        // Validate inputs
        if (!equipment || !code) {
            showError('Please enter both equipment type and fault code');
            return;
        }
        
        // Show loading screens
        showCustomLoading();
        loadingDiv.style.display = 'flex';
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        try {
            // Send request to server
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ equipment, code })
            });
            
            // Hide loading screens
            hideCustomLoading();
            loadingDiv.style.display = 'none';
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze fault code');
            }
            
            const data = await response.json();
            
            // Display result
            resultDiv.innerHTML = `<pre>${data.analysis}</pre>`;
            resultDiv.style.display = 'block';
        } catch (error) {
            hideCustomLoading();
            showError(error.message);
        }
    });

    // Function to show error message
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        resultDiv.style.display = 'none';
    }

    // Pixel Canvas Functionality
    const pixelCanvasButton = document.getElementById('pixel-canvas-button');
    const pixelCanvasContainer = document.getElementById('pixel-canvas-container');
    const closeCanvasButton = document.getElementById('close-canvas');
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    const cooldownTimer = document.getElementById('cooldown-timer');
    
    const CANVAS_SIZE = 100; // 100x100 pixels
    const PIXEL_SIZE = 5;
    let canPlacePixel = true;
    let cooldownSeconds = 0;
    let cooldownInterval;
    
    // Initialize canvas
    function initCanvas() {
        canvas.width = CANVAS_SIZE * PIXEL_SIZE;
        canvas.height = CANVAS_SIZE * PIXEL_SIZE;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Load existing pixels
        fetchPixels();
    }
    
    // Show pixel canvas
    pixelCanvasButton.addEventListener('click', () => {
        pixelCanvasContainer.style.display = 'flex';
        initCanvas();
    });
    
    // Close pixel canvas
    closeCanvasButton.addEventListener('click', () => {
        pixelCanvasContainer.style.display = 'none';
    });
    
    // Place a pixel
    canvas.addEventListener('click', (e) => {
        if (!canPlacePixel) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
        const color = colorPicker.value;
        
        placePixel(x, y, color);
    });
    
    // Place a pixel
    function placePixel(x, y, color) {
        if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return;
        
        // Draw the pixel
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        
        // Save the pixel to the server
        savePixel(x, y, color);
        
        // Start cooldown
        startCooldown();
    }
    
    // Start cooldown
    function startCooldown() {
        canPlacePixel = false;
        cooldownSeconds = 3;
        cooldownTimer.textContent = `Cooldown: ${cooldownSeconds}s`;
        
        cooldownInterval = setInterval(() => {
            cooldownSeconds--;
            
            if (cooldownSeconds <= 0) {
                clearInterval(cooldownInterval);
                canPlacePixel = true;
                cooldownTimer.textContent = 'Ready to place a pixel';
            } else {
                cooldownTimer.textContent = `Cooldown: ${cooldownSeconds}s`;
            }
        }, 1000);
    }
    
    // Fetch all pixels from server
    async function fetchPixels() {
        try {
            const response = await fetch('/api/pixels');
            if (!response.ok) throw new Error('Failed to fetch pixels');
            
            const pixels = await response.json();
            
            // Draw all pixels
            pixels.forEach(pixel => {
                ctx.fillStyle = pixel.color;
                ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            });
        } catch (error) {
            console.error('Error fetching pixels:', error);
        }
    }
    
    // Save a pixel to the server
    async function savePixel(x, y, color) {
        try {
            await fetch('/api/pixels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ x, y, color })
            });
        } catch (error) {
            console.error('Error saving pixel:', error);
        }
    }
}); 